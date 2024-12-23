import { NextApiRequest, NextApiResponse } from 'next';
import { getCollection } from '../../../utils/db';
import {
	generateEthereumAccount,
	encryptPrivateKey,
} from '../../../utils/generateEthereumAccount';

export const config = {
	maxDuration: 10, // Set max duration to 10 seconds
};

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const { username_email, userId, provider } = req.body;

	if (!username_email || !userId) {
		return res.status(400).json({ error: 'Missing required fields' });
	}

	try {
		const DB_TIMEOUT = 8000;

		const usersCollection = await Promise.race([
			getCollection('users'),
			new Promise((_, reject) =>
				setTimeout(() => reject(new Error('DB connection timeout')), DB_TIMEOUT)
			),
		]);

		if (provider === 'external-wallet') {
			await Promise.race([
				(usersCollection as any).updateOne(
					{ username_email },
					{
						$setOnInsert: {
							provider,
							username_email,
							address: userId,
							encrypted_private_key: '',
							iv: '',
							salt: '',
							export_account: false,
							created_at: new Date(),
						},
					},
					{ upsert: true }
				),
				new Promise((_, reject) =>
					setTimeout(() => reject(new Error('DB operation timeout')), 5000)
				),
			]);
			return res.status(200).json({ success: true, address: userId });
		}

		const ethereumAccount = generateEthereumAccount();
		const encryptionResult = encryptPrivateKey(
			ethereumAccount.privateKey,
			userId
		);
		await Promise.race([
			(usersCollection as any).updateOne(
				{ username_email },
				{
					$setOnInsert: {
						provider: provider ?? 'unknown',
						username_email,
						address: ethereumAccount.address,
						encrypted_private_key: encryptionResult.encryptedKey,
						iv: encryptionResult.iv,
						salt: encryptionResult.salt,
						export_account: false,
						created_at: new Date(),
					},
				},
				{ upsert: true }
			),
			new Promise((_, reject) =>
				setTimeout(() => reject(new Error('DB operation timeout')), 5000)
			),
		]);

		return res.status(200).json({
			success: true,
			address: ethereumAccount.address,
		});
	} catch (error) {
		console.error('Create user error:', error);
		return res.status(500).json({
			error: 'Database error',
			details: error instanceof Error ? error.message : 'Unknown error',
		});
	}
}

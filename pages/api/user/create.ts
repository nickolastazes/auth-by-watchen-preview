import { NextApiRequest, NextApiResponse } from 'next';
import { getCollection } from '../../../utils/db';
import {
	generateEthereumAccount,
	encryptPrivateKey,
} from '../../../utils/generateEthereumAccount';

export const config = {
	maxDuration: 10,
};

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const { username_email, userId, provider } = req.body;

	if (!username_email || !userId || !provider) {
		return res.status(400).json({ error: 'Missing required fields' });
	}

	try {
		const usersCollection = await getCollection('users');
		const query = { username_email, provider };

		const existingUser = await usersCollection.findOne(query);

		if (!existingUser) {
			const ethereumAccount = generateEthereumAccount();
			const encryptionResult = encryptPrivateKey(
				ethereumAccount.privateKey,
				userId
			);

			await Promise.race([
				(usersCollection as any).updateOne(
					query,
					{
						$setOnInsert: {
							provider,
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
		}

		const finalUser = await usersCollection.findOne(query);

		return res.status(200).json({
			success: true,
			address: finalUser?.address,
		});
	} catch (error) {
		return res.status(500).json({
			error: 'Database error',
			details: error instanceof Error ? error.message : 'Unknown error',
		});
	}
}

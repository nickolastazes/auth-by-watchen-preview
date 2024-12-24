import type { NextApiRequest, NextApiResponse } from 'next';
import { decryptPrivateKey } from '../../../utils/generateEthereumAccount';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '../auth/[...nextauth]';
import { createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { getCollection } from '../../../utils/db';

interface TransactionRequest {
	to: string;
	value: string;
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const session = await getServerSession(req, res, getAuthOptions(req));

	if (!session?.user?.id) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	try {
		const { to, value }: TransactionRequest = req.body;

		if (!to || !value) {
			return res.status(400).json({ error: 'Missing transaction parameters' });
		}

		// Get user data from MongoDB
		const usersCollection = await getCollection('users');
		const userData = await usersCollection.findOne({
			username_email: session.user.email || session.user.username || '',
		});

		if (!userData) {
			return res.status(404).json({ error: 'User data not found' });
		}

		if (!userData.encrypted_private_key || !userData.iv || !userData.salt) {
			return res.status(400).json({
				error: 'Encrypted private key, IV, or salt is missing',
			});
		}

		// Decrypt private key
		const decryptedPrivateKey = decryptPrivateKey(
			userData.encrypted_private_key,
			userData.iv,
			session.user.id,
			userData.salt
		);

		// Create wallet client
		const account = privateKeyToAccount(decryptedPrivateKey as `0x${string}`);
		const client = createWalletClient({
			account,
			chain: baseSepolia,
			transport: http('https://sepolia.base.org'),
		});

		// Sign and send transaction
		const hash = await client.sendTransaction({
			to: to as `0x${string}`,
			value: parseEther(value),
			chain: baseSepolia,
		});

		res.status(200).json({ hash });
	} catch (error) {
		console.error('Error processing transaction:', error);
		res.status(500).json({
			error: 'Failed to process transaction',
			details: error instanceof Error ? error.message : 'Unknown error',
		});
	}
}

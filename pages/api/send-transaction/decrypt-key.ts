import type { NextApiRequest, NextApiResponse } from 'next';
import { decryptPrivateKey } from '../../../utils/generateEthereumAccount';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '../auth/[...nextauth]';
import { getCollection } from '../../../utils/db';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const session = await getServerSession(req, res, getAuthOptions(req));

	if (!session || !session.user?.id) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	try {
		const usersCollection = await getCollection('users');
		const userData = await usersCollection.findOne({
			username_email: session.user.email || session.user.username || '',
		});

		if (!userData) {
			return res.status(404).json({ error: 'User data not found' });
		}

		if (!userData.encrypted_private_key || !userData.iv || !userData.salt) {
			return res
				.status(400)
				.json({ error: 'Encrypted private key, IV, or salt is missing' });
		}

		const decryptedPrivateKey = decryptPrivateKey(
			userData.encrypted_private_key,
			userData.iv,
			session.user.id,
			userData.salt
		);

		res.status(200).json({ privateKey: decryptedPrivateKey });
	} catch (error) {
		console.error('Error decrypting private key:', error);
		res.status(500).json({ error: 'Failed to decrypt private key' });
	}
}

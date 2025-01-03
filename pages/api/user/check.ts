import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '../auth/[...nextauth]';
import { getCollection } from '../../../utils/db';

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

	const { username_email, provider } = req.body;

	if (!username_email || !provider) {
		return res.status(400).json({ error: 'Missing required fields' });
	}

	try {
		const usersCollection = await getCollection('users');

		const user = await usersCollection.findOne({ username_email, provider });

		return res.status(200).json({ address: user?.address });
	} catch (error) {
		return res.status(500).json({
			error: 'Database error',
			details: error instanceof Error ? error.message : 'Unknown error',
		});
	}
}

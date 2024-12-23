import { NextApiRequest, NextApiResponse } from 'next';
import { getCollection } from '../../../utils/db';

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

	const { username_email } = req.body;

	if (!username_email) {
		return res.status(400).json({ error: 'Missing username_email' });
	}

	try {
		const usersCollection = await Promise.race([
			getCollection('users'),
			new Promise((_, reject) =>
				setTimeout(() => reject(new Error('DB connection timeout')), 5000)
			),
		]);
		const user = await Promise.race<{ address?: string } | null>([
			(usersCollection as any).findOne({ username_email }),
			new Promise((_, reject) =>
				setTimeout(() => reject(new Error('DB query timeout')), 5000)
			),
		]);

		return res.status(200).json({ address: user?.address });
	} catch (error) {
		console.error('Check user error:', error);
		return res.status(500).json({
			error: 'Database error',
			details: error instanceof Error ? error.message : 'Unknown error',
		});
	}
}

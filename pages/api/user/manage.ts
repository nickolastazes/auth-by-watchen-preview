import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '../auth/[...nextauth]';
import { getCollection } from '../../../utils/db';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const session = await getServerSession(req, res, getAuthOptions(req));

	if (!session?.user) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	const { method } = req;

	try {
		const usersCollection = await getCollection('users');

		switch (method) {
			case 'DELETE':
				await usersCollection.deleteOne({
					username_email: session.user.email || session.user.username || '',
				});
				return res.status(200).json({ message: 'Account deleted' });

			case 'PATCH':
				await usersCollection.updateOne(
					{ username_email: session.user.email || session.user.username || '' },
					{ $set: { export_account: true } }
				);
				return res.status(200).json({ message: 'Account updated' });

			default:
				res.setHeader('Allow', ['DELETE', 'PATCH']);
				return res.status(405).json({ error: `Method ${method} Not Allowed` });
		}
	} catch (error) {
		console.error('API error:', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

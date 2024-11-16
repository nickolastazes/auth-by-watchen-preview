import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method === 'POST') {
		const session = await getSession({ req });
		if (session) {
			res.setHeader('Set-Cookie', [
				`__Secure-next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly; secure; samesite=lax`,
				`next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly; secure; samesite=lax`,
				`next-auth.csrf-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly; secure; samesite=lax`,
			]);
		}
		res.status(200).json({ success: true });
	} else {
		res.status(405).json({ error: 'Method not allowed' });
	}
}

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const imageUrl = req.query.url as string;
	if (!imageUrl) {
		return res.status(400).json({ error: 'URL parameter is required' });
	}

	try {
		const response = await fetch(imageUrl);
		const buffer = await response.arrayBuffer();

		res.setHeader('Cache-Control', 'public, max-age=86400');
		res.setHeader(
			'Content-Type',
			response.headers.get('content-type') || 'image/jpeg'
		);
		res.send(Buffer.from(buffer));
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch image' });
	}
}

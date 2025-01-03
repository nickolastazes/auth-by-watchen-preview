import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { createPublicClient, http, type Hash } from 'viem';
import { baseSepolia } from 'viem/chains';

export const publicClient = createPublicClient({
	chain: baseSepolia,
	transport: http('https://sepolia.base.org'),
});

export function useWallet() {
	const { data: session } = useSession();
	const [embeddedWallet, setEmbeddedWallet] = useState<`0x${string}` | null>(
		null
	);

	useEffect(() => {
		if (
			session?.user?.ethereumAddress &&
			session.user.provider !== 'external-wallet'
		) {
			setEmbeddedWallet(session.user.ethereumAddress as `0x${string}`);
		}
	}, [session]);

	const sendTransaction = useCallback(
		async (to: string, value: string): Promise<Hash> => {
			if (!session?.user?.id || session.user.provider === 'external-wallet') {
				throw new Error('No session or external wallet user');
			}

			const response = await fetch('/api/send-transaction/sign-transaction', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ to, value }),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Transaction failed');
			}

			const { hash } = await response.json();
			return hash;
		},
		[session]
	);

	return {
		publicClient,
		embeddedWallet,
		sendTransaction,
	};
}

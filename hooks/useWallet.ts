import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
	WalletClient,
	Account,
	createWalletClient,
	createPublicClient,
	http,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

interface WalletTransaction {
	client: WalletClient;
	account: Account;
}

// Create public client once, outside the hook
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

	const createTransactionClient =
		useCallback(async (): Promise<WalletTransaction> => {
			if (!session?.user?.id || session.user.provider === 'external-wallet') {
				throw new Error('No session or external wallet user');
			}

			const response = await fetch('/api/decrypt-key', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			});

			if (!response.ok) {
				throw new Error('Failed to fetch private key');
			}

			const { privateKey } = await response.json();
			const account = privateKeyToAccount(privateKey as `0x${string}`);

			const client = createWalletClient({
				account,
				chain: baseSepolia,
				transport: http('https://sepolia.base.org'),
			});

			return { client, account };
		}, [session]);

	return {
		publicClient,
		embeddedWallet,
		createTransactionClient,
	};
}

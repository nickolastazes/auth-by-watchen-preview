import {
	createWalletClient,
	createPublicClient,
	http,
	PublicClient,
	WalletClient,
	Account,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { Session } from 'next-auth';

const transport = http('https://sepolia.base.org');

export async function getEmbeddedWalletClient(
	session: Session | null
): Promise<{ client: WalletClient; account: Account } | null> {
	if (!session?.user?.id || session.user.provider === 'external-wallet') {
		return null;
	}

	try {
		const response = await fetch('/api/decrypt-key', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error('Failed to fetch private key');
		}

		const { privateKey } = await response.json();

		// Create viem account using privateKeyToAccount
		const account = privateKeyToAccount(privateKey as `0x${string}`);

		// Create wallet client
		const client = createWalletClient({
			account,
			chain: baseSepolia,
			transport,
		});

		return { client, account };
	} catch (error) {
		console.error('Error creating embedded wallet client:', error);
		throw new Error(
			`Failed to create embedded wallet client: ${
				error instanceof Error ? error.message : 'Unknown error'
			}`
		);
	}
}

export function getPublicClient(): PublicClient {
	return createPublicClient({
		chain: baseSepolia,
		transport,
	}) as PublicClient;
}

export async function getUserAddress(
	session: Session | null
): Promise<`0x${string}` | null> {
	if (
		!session?.user?.ethereumAddress ||
		session.user.provider === 'external-wallet'
	) {
		return null;
	}

	return session.user.ethereumAddress as `0x${string}`;
}

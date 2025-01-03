import {
	createWalletClient,
	http,
	WalletClient,
	Account,
	Transport,
	Chain,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { Session } from 'next-auth';

const transport = http('https://sepolia.base.org') as Transport;

export async function getEmbeddedWalletClient(
	session: Session | null
): Promise<{ client: WalletClient; account: Account } | null> {
	if (!session?.user?.id || session.user.provider === 'external-wallet') {
		return null;
	}

	try {
		const response = await fetch('/api/send-transaction/decrypt-key', {
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
			transport: transport as Transport<'http', Chain>,
		});

		return { client, account };
	} catch (error) {
		throw new Error(
			`Failed to create embedded wallet client: ${
				error instanceof Error ? error.message : 'Unknown error'
			}`
		);
	}
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

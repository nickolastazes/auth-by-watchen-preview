import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors';
import { baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '../utils/supabase';
import Head from 'next/head';
import { AuthKitProvider } from '@farcaster/auth-kit';

const inter = Inter({ subsets: ['latin', 'latin-ext', 'greek', 'greek-ext'] });

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID as string;
const appName = 'Watchen Auth';
const appLogoUrl = 'https://watchen.xyz/watchen-favicon.png';

const config = createConfig({
	chains: [baseSepolia],
	connectors: [
		walletConnect({
			projectId,
			metadata: {
				name: appName,
				description: 'Watchen Auth',
				url: 'https://watchen-auth-private.vercel.app/',
				icons: [appLogoUrl],
			},
			qrModalOptions: {
				themeMode: 'dark',
			},
		}),
		injected(),
		coinbaseWallet({ appName, appLogoUrl, preference: 'eoaOnly' }),
	],
	transports: {
		[baseSepolia.id]: http(`https://sepolia.base.org`),
	},
});

const queryClient = new QueryClient();

const farcasterConfig = {
	relay: 'https://relay.farcaster.xyz',
};

export default function App({
	Component,
	pageProps,
}: AppProps<{
	session: Session;
}>) {
	return (
		<SessionProvider refetchInterval={0} session={pageProps.session}>
			<WagmiProvider config={config}>
				<QueryClientProvider client={queryClient}>
					<SessionContextProvider supabaseClient={supabase}>
						<Head>
							<meta
								name='viewport'
								content='width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no'
							/>
							<title>Watchen Auth</title>
							<meta name='description' content='Watchen Auth' />
							<link rel='icon' href='/watchen-icon.svg' />
						</Head>
						<main className={inter.className}>
							<AuthKitProvider config={farcasterConfig}>
								<Component {...pageProps} />
							</AuthKitProvider>
						</main>
					</SessionContextProvider>
				</QueryClientProvider>
			</WagmiProvider>
		</SessionProvider>
	);
}

import { useRouter } from 'next/router';
import React, { Suspense, useEffect, useState } from 'react';
import { getCsrfToken, signIn, useSession } from 'next-auth/react';
import { SiweMessage } from 'siwe';
import { useAccount, useConnect, useSignMessage, useDisconnect } from 'wagmi';
import FarcasterButton from './FarcasterButton';
import TelegramButton from './TelegramButton';
import { toast } from 'sonner';

const SUPPORTED_WALLETS = [
	'Injected',
	'Coinbase Wallet',
	'WalletConnect',
] as const;

const SOCIAL_PROVIDERS = [
	{ id: 'google', logo: 'google.svg', name: 'Google' },
	{ id: 'twitter', logo: 'x.svg', name: 'X' },
	{ id: 'discord', logo: 'discord.svg', name: 'Discord' },
	{
		id: 'farcaster',
		logo: 'farcaster.svg',
		name: 'Farcaster',
		custom: (isRecent: boolean) => (
			<FarcasterButton
				callbackUrl='/app'
				onError={() => toast.error('Farcaster authentication failed')}
			/>
		),
	},
	{
		id: 'telegram',
		logo: 'telegram.svg',
		name: 'Telegram',
		custom: (isRecent: boolean) => (
			<TelegramButton
				botUsername={process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME as string}
			/>
		),
	},
];

export default function WatchenAuth() {
	const router = useRouter();
	const [recentProvider, setRecentProvider] = useState<string>();
	const [mounted, setMounted] = useState(false);
	const [loadingProvider, setLoadingProvider] = useState<string>();
	const [showWallets, setShowWallets] = useState(false);
	const [isAuthenticating, setIsAuthenticating] = useState(false);

	const { signMessageAsync } = useSignMessage();
	const { address, isConnected } = useAccount();
	const { connect, connectors } = useConnect();
	const { data: session, status } = useSession();
	const { disconnect } = useDisconnect();

	useEffect(() => {
		setMounted(true);
		const stored = localStorage.getItem('recent-provider');
		if (stored) setRecentProvider(stored);
	}, []);

	useEffect(() => {
		if (status === 'authenticated' && session && address) {
			router.push('/app');
		}
	}, [status, session, address, router]);

	const handleSocialAuth = async (provider: string) => {
		setLoadingProvider(provider);
		localStorage.setItem('recent-provider', provider);
		setRecentProvider(provider);

		try {
			if (isConnected) {
				disconnect();
			}
			await signIn(provider, { callbackUrl: `${window.location.origin}/app` });
		} catch (err) {
			toast.error(`Failed to authenticate with ${provider}`);
		} finally {
			setLoadingProvider(undefined);
		}
	};

	const handleWalletAuth = async () => {
		setIsAuthenticating(true);

		try {
			const nonce = await getCsrfToken();
			if (!nonce) throw new Error('Missing CSRF token');

			const message = new SiweMessage({
				domain: window.location.host,
				address: address,
				statement: 'Sign in with Ethereum to Auth by Watchen.',
				uri: window.location.origin,
				version: '1',
				chainId: 84532,
				nonce,
			});

			const signature = await signMessageAsync({
				message: message.prepareMessage(),
			});

			const result = await signIn('external-wallet', {
				message: JSON.stringify(message),
				redirect: false,
				signature,
				callbackUrl: `${window.location.origin}/app`,
			});

			if (result?.url) {
				router.push(result.url);
			}
		} catch (err) {
			toast.error('Wallet authentication failed');
		} finally {
			setIsAuthenticating(false);
		}
	};

	const renderSocialButton = (
		id: string,
		logo: string,
		name: string,
		isRecent: boolean
	) => (
		<button
			className={`w-full items-stretch focus-within:z-10 bg-linear-to-b from-white to-[#fdfdfd] shadow-[0_0_10px_rgba(0,0,0,0.05)] border border-[#4B5563]/25 rounded-md focus:ring-1 focus:ring-inset focus:ring-blue-400 flex ${
				loadingProvider === id ? 'opacity-75 cursor-not-allowed' : ''
			}`}
			onClick={() => handleSocialAuth(id)}
			disabled={!!loadingProvider}>
			<div className='flex items-center justify-between py-2.5 px-3 w-full'>
				<div className='flex items-center'>
					{loadingProvider === id ? (
						<svg
							className='animate-spin h-5 w-5 text-neutral-900'
							xmlns='http://www.w3.org/2000/svg'
							fill='none'
							viewBox='0 0 24 24'>
							<circle
								className='opacity-25'
								cx='12'
								cy='12'
								r='10'
								stroke='currentColor'
								strokeWidth='4'></circle>
							<path
								className='opacity-75'
								fill='currentColor'
								d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
						</svg>
					) : (
						<img
							src={`/signinlogos/${logo}`}
							alt={`${name} logo`}
							className='w-[18px] h-[18px]'
						/>
					)}
					<span className='text-neutral-900 text-sm pl-2.5'>
						{loadingProvider === id ? `Signing in with ${name}...` : name}
					</span>
				</div>
			</div>
		</button>
	);

	const availableConnectors = connectors
		.filter(
			(
				c
			): c is (typeof connectors)[number] & {
				name: (typeof SUPPORTED_WALLETS)[number];
			} => SUPPORTED_WALLETS.includes(c.name as any)
		)
		.sort(
			(a, b) =>
				SUPPORTED_WALLETS.indexOf(
					a.name as (typeof SUPPORTED_WALLETS)[number]
				) -
				SUPPORTED_WALLETS.indexOf(b.name as (typeof SUPPORTED_WALLETS)[number])
		);

	const sortedProviders = mounted
		? [
				...SOCIAL_PROVIDERS.filter((p) => p.id === recentProvider),
				...SOCIAL_PROVIDERS.filter((p) => p.id !== recentProvider),
		  ]
		: SOCIAL_PROVIDERS;

	return (
		<Suspense fallback={<div className='text-white'>Loading...</div>}>
			<div className='min-h-screen w-full flex items-center justify-center bg-neutral-900'>
				{!showWallets && (
					<button
						onClick={() => router.push('/')}
						className='absolute top-5 left-5 z-10 flex items-center text-sm font-medium text-neutral-300 hover:text-neutral-100 transition'>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							width='18'
							height='18'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'>
							<path d='m15 18-6-6 6-6' />
						</svg>
						<span className='ml-1'>Back</span>
					</button>
				)}
				<main className='w-full flex items-center justify-center px-2'>
					<div className='w-full max-w-sm'>
						<div className='bg-white rounded-xl p-8 border border-[#4B5563]/20 shadow-md'>
							<img
								src='/signinlogos/auth-by-watchen-black.svg'
								alt='Watchen Auth'
								className='w-auto h-7 mx-auto mb-4'
							/>
							<h1 className='text-2xl font-bold text-neutral-900 text-center mb-1'>
								Sign in
							</h1>
							<h2 className='text-sm text-neutral-500 text-center mb-6'>
								Choose your preferred method to continue
							</h2>
							{!showWallets ? (
								<>
									{mounted && recentProvider && (
										<p className='text-xs text-neutral-500 mb-2'>
											You recently used:
										</p>
									)}
									<div className='space-y-3'>
										{mounted && recentProvider && (
											<React.Fragment>
												{sortedProviders
													.filter((p) => p.id === recentProvider)
													.map((provider) => (
														<React.Fragment key={provider.id}>
															{provider.custom
																? provider.custom(true)
																: renderSocialButton(
																		provider.id,
																		provider.logo,
																		provider.name,
																		true
																  )}
														</React.Fragment>
													))}
											</React.Fragment>
										)}
										{mounted && recentProvider && (
											<div className='flex items-center'>
												<div className='flex-grow h-px bg-gray-200 mx-0.5' />
											</div>
										)}
										{sortedProviders
											.filter((p) => p.id !== recentProvider)
											.map((provider) => (
												<React.Fragment key={provider.id}>
													{provider.custom
														? provider.custom(false)
														: renderSocialButton(
																provider.id,
																provider.logo,
																provider.name,
																false
														  )}
												</React.Fragment>
											))}
									</div>
									<div className='flex items-center my-4'>
										<div className='flex-grow h-px bg-gray-200' />
										<span className='mx-3 text-xs text-neutral-400'>OR</span>
										<div className='flex-grow h-px bg-gray-200' />
									</div>
									<button
										onClick={() => setShowWallets(true)}
										className='w-full flex items-center border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2'>
										<svg
											xmlns='http://www.w3.org/2000/svg'
											width='20'
											height='20'
											viewBox='0 0 24 24'
											fill='none'
											stroke='#000'
											strokeWidth='1.6'
											strokeLinecap='round'
											strokeLinejoin='round'
											className='mr-3'>
											<path d='M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1' />
											<path d='M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4' />
										</svg>
										<span className='text-neutral-900 text-sm'>
											Connect wallet
										</span>
									</button>
								</>
							) : (
								<>
									{isConnected ? (
										<>
											<button
												onClick={handleWalletAuth}
												disabled={isAuthenticating}
												className={`w-full flex items-center justify-center text-sm py-2.5 px-4 rounded-md font-medium bg-blue-600 text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
													isAuthenticating
														? 'opacity-75 cursor-not-allowed'
														: ''
												}`}>
												{isAuthenticating && (
													<svg
														className='animate-spin h-4 w-4 text-white mr-2'
														xmlns='http://www.w3.org/2000/svg'
														fill='none'
														viewBox='0 0 24 24'>
														<circle
															className='opacity-25'
															cx='12'
															cy='12'
															r='10'
															stroke='currentColor'
															strokeWidth='4'></circle>
														<path
															className='opacity-75'
															fill='currentColor'
															d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
													</svg>
												)}
												{isAuthenticating
													? 'Verifying signature...'
													: 'Sign message'}
											</button>
											<p className='text-xs text-neutral-500 text-center mt-5'>
												Sign a message to verify wallet ownership. This is
												gasless and secure.
											</p>
										</>
									) : (
										<div className='space-y-3'>
											{availableConnectors.map((connector) => (
												<button
													key={connector.uid}
													onClick={() => connect({ connector })}
													className='w-full flex items-center border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition px-4 py-2.5'>
													<img
														src={`/signinlogos/${connector.name}.svg`}
														alt={connector.name}
														className='w-[18px] h-[18px] rounded-full mr-3'
													/>
													<span className='text-sm text-neutral-900'>
														{connector.name === 'Injected'
															? 'Browser Wallet'
															: connector.name}
													</span>
												</button>
											))}
											<button
												onClick={() => setShowWallets(false)}
												className='w-full p-2 text-sm text-neutral-500 underline'>
												Back to all options
											</button>
										</div>
									)}
								</>
							)}
						</div>
						<div className='pt-5 text-center'>
							<span className='text-xs text-neutral-500'>
								Secured with{' '}
								<a
									href='https://auth.watchen.xyz'
									target='_blank'
									rel='noopener noreferrer'
									className='font-semibold'>
									Auth by Watchen
								</a>
							</span>
						</div>
					</div>
				</main>
			</div>
		</Suspense>
	);
}

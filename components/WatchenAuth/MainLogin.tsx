import { useRouter } from 'next/router';
import React, { Suspense, useEffect, useState } from 'react';
import { AuroraBackground } from './AuroraBackground';
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
	{ id: 'twitter', logo: 'x.svg', name: 'X (Twitter)' },
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

function MainLogin() {
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
			className={`w-full items-stretch focus-within:z-10 font-medium bg-gradient-to-b from-[#ffffff] via-[#fdfdfd] to-[#f3f3f3] border border-[#4B5563]/25 shadow-sm rounded-xl focus:ring-1 focus:ring-inset focus:ring-blue-400 flex ${
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
							className='w-6 h-6'
						/>
					)}
					<span className='text-neutral-900 font-medium text-sm pl-2.5'>
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
			<AuroraBackground>
				<div className='fixed inset-0 flex flex-col'>
					{!showWallets && (
						<button
							onClick={() => router.push('/')}
							className='absolute top-5 left-5 z-10 flex items-center text-sm font-medium text-neutral-300'>
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
							Back
						</button>
					)}

					<main className='flex-1 flex items-center justify-center px-2'>
						<div className='w-full max-w-[370px]'>
							<div className='bg-white rounded-3xl px-9 py-5 border border-[#4B5563]/30 shadow-sm'>
								<h1 className='text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-900/50 tracking-tight text-center mb-1'>
									Sign in
								</h1>
								<h2 className='text-sm text-neutral-500 text-center mb-5'>
									Please choose one of the following options to continue.
								</h2>
								{!showWallets ? (
									<>
										<div className='space-y-3'>
											{mounted && recentProvider && (
												<p className='text-[13px] text-neutral-500'>
													You recently used:
												</p>
											)}

											{sortedProviders.map((provider, idx) => (
												<React.Fragment key={provider.id}>
													{provider.custom
														? provider.custom(provider.id === recentProvider)
														: renderSocialButton(
																provider.id,
																provider.logo,
																provider.name,
																provider.id === recentProvider
														  )}
													{idx === 0 &&
														provider.id === recentProvider &&
														mounted && (
															<div className='bg-gradient-to-l from-transparent via-[#4B5563]/30 to-transparent h-[1px] w-full my-3' />
														)}
												</React.Fragment>
											))}
										</div>

										<div className='bg-gradient-to-l from-transparent via-[#4B5563]/30 to-transparent h-[1px] w-full my-5' />

										<button
											onClick={() => setShowWallets(true)}
											className='w-full items-stretch focus-within:z-10 bg-gradient-to-b from-[#ffffff] via-[#fdfdfd] to-[#f3f3f3] border border-[#4B5563]/25 shadow-sm rounded-xl focus:ring-1 focus:ring-inset focus:ring-blue-400 flex'>
											<span className='flex items-center py-2.5 px-3'>
												<svg
													xmlns='http://www.w3.org/2000/svg'
													width='22'
													height='22'
													viewBox='0 0 24 24'
													fill='none'
													stroke='#000'
													strokeWidth='1.6'
													strokeLinecap='round'
													strokeLinejoin='round'>
													<path d='M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1' />
													<path d='M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4' />
												</svg>
												<span className='text-neutral-900 font-medium text-sm ml-3'>
													Connect Wallet
												</span>
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
													className={`w-full flex items-center justify-center focus-within:z-10 text-sm py-2 px-3 rounded-xl font-medium bg-gradient-to-b from-[#1d43ff] via-[#0025df] to-[#0025df] text-neutral-50 select-none shadow-md ${
														isAuthenticating
															? 'opacity-75 cursor-not-allowed'
															: ''
													}`}>
													{isAuthenticating && (
														<svg
															className='animate-spin h-4 w-4 text-neutral-100 mr-2'
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
														className='w-full flex items-center p-2.5 bg-gradient-to-b from-[#ffffff] via-[#fdfdfd] to-[#f3f3f3] border border-[#4B5563]/25 rounded-xl shadow-sm'>
														<img
															src={`/signinlogos/${connector.name}.svg`}
															alt={connector.name}
															className='w-6 h-6 rounded-full'
														/>
														<span className='text-sm font-medium ml-3'>
															{connector.name === 'Injected'
																? 'Browser Wallet'
																: connector.name}
														</span>
													</button>
												))}

												<button
													onClick={() => setShowWallets(false)}
													className='w-full p-3 text-sm text-neutral-900 underline'>
													Back to all options
												</button>
											</div>
										)}
									</>
								)}
							</div>

							<div className='border-x border-b border-gray-600/20 -mt-5 pt-7 pb-2 rounded-b-3xl bg-neutral-100 relative -z-10'>
								<a
									href='https://auth.watchen.xyz'
									target='_blank'
									rel='noopener noreferrer'
									className='flex items-center justify-center gap-1.5'>
									<span className='text-[13px] text-neutral-500'>
										powered by
									</span>
									<img
										src='/signinlogos/auth-by-watchen-black.svg'
										alt='Watchen Auth'
										className='w-14 h-auto'
									/>
								</a>
							</div>
						</div>
					</main>
				</div>
			</AuroraBackground>
		</Suspense>
	);
}

export default MainLogin;

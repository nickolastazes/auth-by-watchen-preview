import { useRouter } from 'next/router';
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { AuroraBackground } from './AuroraBackground';
import { getCsrfToken, signIn, useSession } from 'next-auth/react';
import { SiweMessage } from 'siwe';
import { useAccount, useConnect, useSignMessage, useDisconnect } from 'wagmi';
import FarcasterButton from './FarcasterButton';

const ALLOWED_WALLETS = [
	'Injected',
	'Coinbase Wallet',
	'WalletConnect',
] as const;

function MainLogin() {
	const router = useRouter();
	const [lastUsed, setLastUsed] = useState<string | null>(null);
	const [isClient, setIsClient] = useState(false);
	const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
	const [showWalletLogin, setShowWalletLogin] = useState(false);
	const [isSigningOrProcessing, setIsSigningOrProcessing] = useState(false);
	const [isWalletConnected, setIsWalletConnected] = useState(false);

	const { signMessageAsync } = useSignMessage();
	const { address, isConnected } = useAccount();
	const { connect, connectors } = useConnect();
	const { data: session, status } = useSession();
	const { disconnect } = useDisconnect();

	useEffect(() => {
		setIsClient(true);
		const storedLastUsed = localStorage.getItem('last-used');
		if (storedLastUsed) {
			setLastUsed(storedLastUsed);
		}
	}, []);

	useEffect(() => {
		if (status === 'authenticated' && session && address) {
			router.push('/app');
		}
	}, [status, session, address, router]);

	useEffect(() => {
		setIsWalletConnected(isConnected);
	}, [isConnected]);

	const toMainPage = () => router.push('/');

	const handleSignIn = async (provider: string) => {
		setLoadingProvider(provider);
		localStorage.setItem('last-used', provider);
		setLastUsed(provider);
		try {
			// Disconnect the wallet if it's connected
			if (isWalletConnected) {
				disconnect();
				setIsWalletConnected(false);
			}
			const callbackUrl = `${window.location.origin}/app`;
			console.log('Signing in with callback URL:', callbackUrl);
			await signIn(provider, { callbackUrl });
		} catch (error) {
			console.error('Sign in error:', error);
		} finally {
			setLoadingProvider(null);
		}
	};

	const handleLogin = async () => {
		setIsSigningOrProcessing(true);
		try {
			const callbackUrl = `${window.location.origin}/app`;
			const nonce = await getCsrfToken();
			if (!nonce) {
				throw new Error('Failed to get CSRF token');
			}
			const message = new SiweMessage({
				domain: window.location.host,
				address: address,
				statement: 'Sign in with Ethereum to Watchen Auth.',
				uri: window.location.origin,
				version: '1',
				chainId: 84532,
				nonce: nonce,
			});
			const signature = await signMessageAsync({
				message: message.prepareMessage(),
			});
			const result = await signIn('external-wallet', {
				message: JSON.stringify(message),
				redirect: false,
				signature,
				callbackUrl,
			});
			if (result?.url) {
				router.push(result.url);
			} else {
				throw new Error('Sign-in succeeded but no redirect URL was provided');
			}
		} catch (error) {
			console.error('Authentication error:', error);
		} finally {
			setIsSigningOrProcessing(false);
		}
	};

	const renderSignInButton = (
		provider: string,
		logo: string,
		displayName: string,
		isLastUsed: boolean
	) => (
		<button
			className='w-full items-stretch focus-within:z-10 font-medium bg-gradient-to-b from-[#ffffff] via-[#ffffff] to-[#f8f8f8] border border-[#4B5563]/30 shadow-sm rounded-xl focus:ring-1 focus:ring-inset focus:ring-blue-400 flex'
			onClick={() => handleSignIn(provider)}
			disabled={loadingProvider !== null}>
			<div className='flex items-center justify-between py-2.5 px-3 w-full'>
				<div className='flex items-center'>
					<img
						src={`/signinlogos/${logo}`}
						alt={`${displayName} logo`}
						className='w-6 h-6'
					/>
					<span className='text-neutral-900 text-sm pl-2.5'>
						{isLastUsed ? `Continue with ${displayName}` : displayName}
					</span>
				</div>
				{loadingProvider === provider && (
					<svg
						className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
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
			</div>
		</button>
	);

	const providers = [
		{ id: 'google', logo: 'google.svg', name: 'Google' },
		{ id: 'twitter', logo: 'x.svg', name: 'X (Twitter)' },
		{ id: 'discord', logo: 'discord.svg', name: 'Discord' },
	];

	const sortedProviders = isClient
		? [
				...providers.filter((p) => p.id === lastUsed),
				...providers.filter((p) => p.id !== lastUsed),
		  ]
		: providers;

	const filteredConnectors = connectors
		.filter(
			(
				connector
			): connector is (typeof connectors)[number] & {
				name: (typeof ALLOWED_WALLETS)[number];
			} => ALLOWED_WALLETS.includes(connector.name as any)
		)
		.sort(
			(a, b) =>
				ALLOWED_WALLETS.indexOf(a.name as (typeof ALLOWED_WALLETS)[number]) -
				ALLOWED_WALLETS.indexOf(b.name as (typeof ALLOWED_WALLETS)[number])
		);

	const getDisplayName = (connectorName: string) => {
		if (connectorName === 'Injected') return 'Browser Wallet';
		return connectorName;
	};

	return (
		<Suspense fallback={<div className='text-white'>Loading...</div>}>
			<AuroraBackground>
				<div className='fixed inset-0 flex flex-col overflow-hidden'>
					{/* BACK BUTTON */}
					{!showWalletLogin && (
						<div className='absolute top-5 left-5 z-10'>
							<button
								onClick={toMainPage}
								className='flex items-center text-sm font-medium text-neutral-300'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									width='18'
									height='18'
									viewBox='0 0 24 24'
									fill='none'
									stroke='#d4d4d4'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'>
									<path d='m15 18-6-6 6-6' />
								</svg>
								Back
							</button>
						</div>
					)}
					<main className='flex-grow flex items-center justify-center px-2'>
						<div className='w-full max-w-[340px] rounded-3xl'>
							<div className='bg-[#fff] rounded-3xl px-8 py-5 border border-[#4B5563]/30 shadow-sm z-50'>
								<h1 className='text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-900/50 tracking-tight mb-6 text-center'>
									Sign in
								</h1>
								<div className='w-full'>
									{!showWalletLogin ? (
										<>
											<div className='space-y-3'>
												{isClient && lastUsed && (
													<p className='text-sm text-neutral-500'>
														You last used:
													</p>
												)}
												{sortedProviders.map((provider, index) => (
													<React.Fragment key={provider.id}>
														{renderSignInButton(
															provider.id,
															provider.logo,
															provider.name,
															provider.id === lastUsed
														)}
														{index === 0 && isClient && lastUsed && (
															<div className='bg-gradient-to-l from-transparent via-[#4B5563]/30 to-transparent h-[1px] w-full' />
														)}
													</React.Fragment>
												))}
												<FarcasterButton
													callbackUrl={'/app'}
													onError={(error) =>
														console.error('Auth error:', error)
													}
												/>
											</div>
											<div className='bg-gradient-to-l from-transparent via-[#4B5563]/30 to-transparent h-[1px] w-full my-5' />
											<button
												onClick={() => setShowWalletLogin(true)}
												className='w-full items-stretch focus-within:z-10 bg-gradient-to-b from-[#ffffff] via-[#ffffff] to-[#f8f8f8] border border-[#4B5563]/20 shadow-sm rounded-xl focus:ring-1 focus:ring-inset focus:ring-blue-400 flex'>
												<span className='flex items-center py-2.5 px-3'>
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
														className='text-neutral-100'>
														<path d='M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1' />
														<path d='M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4' />
													</svg>
													<p className='text-neutral-900 text-sm ml-3 font-medium'>
														Use a wallet
													</p>
												</span>
											</button>
										</>
									) : (
										<>
											{isWalletConnected ? (
												<>
													<button
														onClick={handleLogin}
														disabled={isSigningOrProcessing}
														className='primarybtn w-full flex items-center justify-center'>
														{isSigningOrProcessing ? (
															<span className='flex items-center'>
																<svg
																	className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
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
																Processing...
															</span>
														) : (
															'Sign message'
														)}
													</button>
													<p className='text-xs text-neutral-500 text-center mt-5'>
														Verify you are the owner of the wallet with this
														gasless, safe signature that does not give access to
														your assets.
													</p>
												</>
											) : (
												<div className='space-y-3 w-full z-10 backdrop-blur-sm rounded-xl p-1'>
													{filteredConnectors.map((connector) => (
														<button
															key={connector.uid}
															onClick={() => connect({ connector })}
															className='w-full items-stretch font-medium focus-within:z-10 bg-gradient-to-b from-[#ffffff] via-[#ffffff] to-[#f8f8f8] border border-[#4B5563]/30 shadow-sm  rounded-xl focus:ring-1 focus:ring-inset focus:ring-blue-400 flex'>
															<div className='flex items-center py-2 px-3'>
																<img
																	src={`/signinlogos/${connector.name}.svg`}
																	alt={`${getDisplayName(connector.name)} icon`}
																	className='w-6 h-6 bg-white rounded-full'
																/>
																<span className='text-neutral-900 text-sm pl-3'>
																	{getDisplayName(connector.name)}
																</span>
															</div>
														</button>
													))}
													<button
														onClick={() => setShowWalletLogin(false)}
														className='w-full p-3 text-sm text-neutral-900 underline font-medium'>
														View all options again
													</button>
												</div>
											)}
										</>
									)}
								</div>
							</div>
							<div className='border-b border-x border-[#4B5563]/20 -mt-5 pt-7 pb-2 rounded-b-3xl bg-neutral-100 -z-20 relative'>
								<a
									href='https://auth.watchen.xyz'
									target='_blank'
									className='flex space-x-1.5 text-sm items-center justify-center'>
									<p className='text-neutral-500 font-medium'>powered by</p>
									<img
										src='/signinlogos/auth-by-watchen-black.svg'
										alt='Watchen Auth logo'
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

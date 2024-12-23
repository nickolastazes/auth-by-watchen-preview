import React, { useCallback, Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useDisconnect, useEnsName, createConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { formatEther, createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { Drawer } from 'vaul';
import { motion } from 'framer-motion';

export default function ExternalWalletUi() {
	// ANIMATIONS
	const containerVariants = {
		hidden: { opacity: 0 },
		visible: (i: number) => ({
			opacity: 1,
			transition: {
				staggerChildren: 0.3,
				delayChildren: 0.1,
			},
		}),
	};

	const sectionVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				duration: 0.5,
				ease: [0.4, 0.0, 0.2, 1],
			},
		},
	};

	const { data: session, status } = useSession();
	const { address: externalAddress } = useAccount();
	const router = useRouter();
	const { disconnect } = useDisconnect();

	const shortExternalAddress = `${externalAddress?.slice(
		0,
		6
	)}...${externalAddress?.slice(-6)}`;

	const setMainnetConfigForENS = createConfig({
		chains: [mainnet],
		transports: {
			[mainnet.id]: http(`https://eth.blockrazor.xyz`),
		},
	});

	const { data: ensName } = useEnsName({
		address: externalAddress as `0x${string}`,
		config: setMainnetConfigForENS,
	});

	// COPY EXTERNAL ADDRESS TO CLIPBOARD
	const copyToClipboard = () => {
		navigator.clipboard.writeText(externalAddress!).then(
			() => {
				toast.success('Address successfully copied!');
			},
			() => {
				toast.error('Failed to copy address to clipboard');
			}
		);
	};

	// FETCH BALANCE
	const [balance, setBalance] = useState<any | null>(null);
	const handleGetBalance = async () => {
		if (!session || status !== 'authenticated' || !externalAddress) {
			setBalance(null);
			return;
		}
		try {
			const publicClient = createPublicClient({
				chain: baseSepolia,
				transport: http(`https://sepolia.base.org`),
			});
			const result = await publicClient.getBalance({
				address: externalAddress,
			});
			const balanceInEther = parseFloat(formatEther(result)).toFixed(4);
			setBalance(balanceInEther);
		} catch (error) {
			console.error('Error fetching balance:', error);
			toast.error('Error fetching your balance');
			setBalance(null);
		}
	};

	// UPDATE BALANCE
	const [isLoadingBalance, setIsLoadingBalance] = useState(false);
	const handleUpdateBalance = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsLoadingBalance(true);
		await handleGetBalance();
		setIsLoadingBalance(false);
	};

	// SIGN OUT
	const [isSignOutLoading, setIsSignOutLoading] = useState(false);
	const handleSignOut = useCallback(async () => {
		setIsSignOutLoading(true);
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			disconnect();
			await signOut({ redirect: false });
			router.push('/');
		} catch (error) {
			console.error('Error during sign out:', error);
		} finally {
			setIsSignOutLoading(false);
		}
	}, [disconnect, router]);

	// FETCH BALANCE ON MOUNT
	useEffect(() => {
		handleGetBalance();
	}, [externalAddress]);

	return (
		<>
			{session && (
				<Drawer.Root direction='right'>
					<Drawer.Trigger className='flex items-center border border-[#4B5563]/40 rounded-xl space-x-2 text-sm py-1 px-2 font-medium bg-white/10 text-neutral-100 shadow-md'>
						{session && externalAddress && (
							<>
								<img
									src='/default-image.svg'
									alt={`User avatar`}
									className='w-[26px] h-[26px] rounded-full object-cover border border-[#4B5563]/40'
								/>
								<span>{ensName ? ensName : shortExternalAddress}</span>
							</>
						)}
					</Drawer.Trigger>
					<Drawer.Portal>
						<Drawer.Overlay
							className='fixed inset-0 bg-black/40 backdrop-blur-sm'
							style={{
								WebkitBackdropFilter: 'blur(4px)',
							}}
						/>
						<Drawer.Content
							className='right-2 top-2 bottom-2 fixed z-10 outline-none mx-auto w-[290px] sm:w-[310px] flex flex-col'
							style={
								{
									'--initial-transform': 'calc(100% + 8px)',
								} as React.CSSProperties
							}>
							<motion.div
								className='bg-[#101010] p-3.5 border border-[#4B5563]/30 rounded-xl grow flex flex-col overflow-y-auto'
								variants={containerVariants}
								initial='hidden'
								animate='visible'>
								{/* USER INFO */}
								<motion.div
									className='flex items-center space-x-2'
									variants={sectionVariants}>
									<div className='w-[40px] h-[40px] relative'>
										<img
											src='/default-image.svg'
											alt={`External wallet's avatar`}
											className='w-full h-full rounded-full object-cover'
											onError={(e) => {
												console.error('Image load failed:', e);
											}}
											referrerPolicy='no-referrer'
											crossOrigin='anonymous'
											style={{
												minWidth: '40px',
												minHeight: '40px',
											}}
										/>
									</div>
									<div className='flex flex-col'>
										<Drawer.Title className='font-bold text-lg text-neutral-50'>
											{ensName ? ensName : shortExternalAddress}
										</Drawer.Title>
										<Drawer.Description className='sr-only text-neutral-400 text-xs'>
											Account: {shortExternalAddress}
										</Drawer.Description>
										<span className='flex items-center space-x-1'>
											<p className='text-xs text-neutral-300'>Account:</p>
											<button
												onClick={copyToClipboard}
												className='flex items-center space-x-2'>
												<span className='text-xs text-neutral-100'>
													{shortExternalAddress}
												</span>
												<svg
													xmlns='http://www.w3.org/2000/svg'
													width='12'
													height='12'
													viewBox='0 0 24 24'
													fill='none'
													stroke='#f5f5f5'
													strokeWidth='2'
													strokeLinecap='round'
													strokeLinejoin='round'>
													<rect
														width='14'
														height='14'
														x='8'
														y='8'
														rx='2'
														ry='2'
													/>
													<path d='M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' />
												</svg>
											</button>
										</span>
									</div>
								</motion.div>

								<div className='h-[1px] w-full my-4' />

								{/* BALANCE */}
								<motion.section
									className='flex flex-col'
									variants={sectionVariants}>
									<p className='text-xs text-neutral-300'>Account balance:</p>
									<div className='flex items-center space-x-2'>
										<p className='text-4xl font-semibold text-neutral-100'>
											{balance} ETH
										</p>
										<button
											onClick={handleUpdateBalance}
											disabled={isLoadingBalance}
											className='text-neutral-100 hover:text-neutral-300 transition-colors focus:outline-none'
											aria-label='Update balance'>
											<svg
												xmlns='http://www.w3.org/2000/svg'
												viewBox='0 0 24 24'
												fill='none'
												stroke='currentColor'
												strokeWidth='2'
												strokeLinecap='round'
												strokeLinejoin='round'
												className={`w-3 h-3 ${
													isLoadingBalance ? 'animate-spin' : ''
												}`}>
												<path d='M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2' />
											</svg>
										</button>
									</div>
								</motion.section>

								<div className='flex-grow' />

								<div className='h-[1px] w-full mb-4 mt-2 bg-gradient-to-r from-[#4B5563]/0 via-[#4B5563]/40 to-[#4B5563]/0' />

								<motion.section
									className='w-full mt-auto'
									variants={sectionVariants}>
									<div className='flex items-center justify-between mb-3'>
										<p className='text-xs text-neutral-300'>
											You signed in with
										</p>
										<p className='text-xs text-neutral-300'>
											{session.user.provider}
										</p>
									</div>
								</motion.section>
								{/* LOGOUT */}
								<motion.section
									className='w-full mt-auto'
									variants={sectionVariants}>
									<button
										onClick={handleSignOut}
										className='inline-flex justify-center space-x-1 w-full text-sm py-2 px-3 items-center border border-[#4B5563]/40 rounded-xl font-medium bg-white/10 text-neutral-100 shadow-md'>
										{isSignOutLoading ? (
											<>
												<span>Logging out...</span>
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
											</>
										) : (
											<>
												<span>Logout</span>
												<svg
													xmlns='http://www.w3.org/2000/svg'
													width='14'
													height='14'
													viewBox='0 0 24 24'
													fill='none'
													stroke='#f5f5f5'
													strokeWidth='2'
													strokeLinecap='round'
													strokeLinejoin='round'>
													<path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
													<polyline points='16 17 21 12 16 7' />
													<line x1='21' x2='9' y1='12' y2='12' />
												</svg>
											</>
										)}
									</button>
								</motion.section>
							</motion.div>
						</Drawer.Content>
					</Drawer.Portal>
				</Drawer.Root>
			)}
		</>
	);
}

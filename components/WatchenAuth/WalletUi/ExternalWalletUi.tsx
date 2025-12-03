import React, { useCallback, Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useDisconnect, useEnsName, createConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { formatEther, createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'motion/react';

// Responsive hook to detect if screen is small
function useIsMobile(): boolean {
	const [isMobile, setIsMobile] = useState(false);
	useEffect(() => {
		function handleResize() {
			setIsMobile(window.matchMedia('(max-width: 639px)').matches);
		}
		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);
	return isMobile;
}

export default function ExternalWalletAltUi() {
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
			toast.error('Something went wrong with logging you out');
		} finally {
			setIsSignOutLoading(false);
		}
	}, [disconnect, router]);

	// FETCH BALANCE ON MOUNT
	useEffect(() => {
		handleGetBalance();
	}, [externalAddress]);

	// Add state for dialog open
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const isMobile = useIsMobile();

	return (
		<>
			{session && (
				<Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<Dialog.Trigger asChild>
						<button className='flex items-center border border-[#4B5563]/40 rounded-full sm:space-x-2 text-sm p-0.5 sm:py-1 sm:px-1.5 font-medium bg-white/10 text-neutral-100 shadow-md'>
							{session && externalAddress && (
								<>
									<img
										src='/default-image.svg'
										alt={`User avatar`}
										className='w-[26px] h-[26px] rounded-full object-cover border border-[#4B5563]/40'
									/>
									<span className='hidden sm:block'>
										{ensName ? ensName : shortExternalAddress}
									</span>
								</>
							)}
						</button>
					</Dialog.Trigger>
					<Dialog.Portal>
						<Dialog.Overlay
							className='fixed inset-0 bg-black/40 backdrop-blur-sm'
							style={{ WebkitBackdropFilter: 'blur(4px)' }}
						/>
						<AnimatePresence>
							{isDialogOpen && (
								<Dialog.Content forceMount asChild>
									<motion.div
										initial={
											isMobile
												? { y: '100%', opacity: 0 }
												: { x: '100%', opacity: 0 }
										}
										animate={
											isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }
										}
										exit={
											isMobile
												? { y: '100%', opacity: 0 }
												: { x: '100%', opacity: 0 }
										}
										transition={{
											type: 'spring',
											stiffness: 400,
											damping: 32,
											duration: 0.35,
										}}
										className={
											isMobile
												? 'left-0 right-0 bottom-0 top-auto fixed z-10 outline-none w-full max-w-full flex flex-col rounded-t-2xl h-[70%]'
												: 'right-2 top-2 bottom-2 fixed z-10 outline-none mx-auto w-[290px] sm:w-[310px] flex flex-col'
										}
										style={
											isMobile
												? {
														borderTopLeftRadius: '1rem',
														borderTopRightRadius: '1rem',
												  }
												: ({
														'--initial-transform': 'calc(100% + 8px)',
												  } as React.CSSProperties)
										}>
										<motion.div
											className='bg-[#101010] p-3.5 border border-[#4B5563]/30 rounded-xl grow flex flex-col overflow-y-auto'
											variants={containerVariants}
											initial='hidden'
											animate='visible'>
											{/* USER INFO */}
											<motion.div className='flex items-center space-x-2'>
												<div className='w-[40px] h-[40px] relative'>
													<img
														src='/default-image.svg'
														alt={`External wallet's avatar`}
														className='w-full h-full rounded-full object-cover'
														onError={(e) => {
															toast.error('Failed to load image');
														}}
														referrerPolicy='no-referrer'
														crossOrigin='anonymous'
														style={{ minWidth: '40px', minHeight: '40px' }}
													/>
												</div>
												<div className='flex flex-col'>
													<Dialog.Title className='font-bold text-lg text-neutral-50'>
														{ensName ? ensName : shortExternalAddress}
													</Dialog.Title>
													<Dialog.Description className='sr-only text-neutral-400 text-xs'>
														Account: {shortExternalAddress}
													</Dialog.Description>
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

											<div className='h-px w-full my-4' />

											{/* BALANCE */}
											<motion.section className='flex flex-col'>
												<p className='text-xs text-neutral-300'>
													Account balance:
												</p>
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

											<div className='grow' />

											<div className='h-px w-full mb-4 mt-2 bg-linear-to-r from-[#4B5563]/0 via-[#4B5563]/40 to-[#4B5563]/0' />

											<motion.section className='w-full mt-auto'>
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
											<motion.section className='w-full mt-auto'>
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
									</motion.div>
								</Dialog.Content>
							)}
						</AnimatePresence>
					</Dialog.Portal>
				</Dialog.Root>
			)}
		</>
	);
}

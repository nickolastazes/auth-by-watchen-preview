import React, { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDisconnect } from 'wagmi';
import { useSession, signOut } from 'next-auth/react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { useWallet } from '../../../hooks/useWallet';
import { formatEther } from 'viem';
import QRCode from 'react-qr-code';
import TransakOnRamp from '../TransakOnRamp';
import TransakOffRamp from '../TransakOffRamp';
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

export default function EmbeddedWalletAltUi() {
	// ANIMATIONS
	const menuVariants = {
		hidden: {
			opacity: 0,
			y: 10,
			scale: 0.95,
			transition: {
				duration: 0.2,
				ease: [0.04, 0.62, 0.23, 0.98],
			},
		},
		visible: {
			opacity: 1,
			y: 0,
			scale: 1,
			transition: {
				duration: 0.3,
				ease: [0.04, 0.62, 0.23, 0.98],
			},
		},
	};

	const buttonVariants = {
		hidden: { opacity: 0, y: 10 },
		visible: (i: number) => ({
			opacity: 1,
			y: 0,
			transition: {
				delay: i * 0.1,
				duration: 0.3,
				ease: [0.4, 0.0, 0.2, 1],
			},
		}),
	};

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

	const modalVariants = {
		hidden: {
			opacity: 0,
			scale: 0.95,
			y: 10,
			transition: {
				duration: 0,
			},
		},
		visible: {
			opacity: 1,
			scale: 1,
			y: 0,
			transition: {
				type: 'spring',
				duration: 0.3,
				bounce: 0.15,
			},
		},
	};

	const overlayVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				duration: 0.2,
				ease: 'easeOut',
			},
		},
	};

	const { data: session, status } = useSession();
	const { embeddedWallet, publicClient } = useWallet();
	const [balance, setBalance] = useState<any | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingBalance, setIsLoadingBalance] = useState(false);
	const router = useRouter();
	const { disconnect } = useDisconnect();

	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
	const [isTransakBuyOpen, setIsTransakBuyOpen] = useState(false);
	const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
	const [isTransakSellOpen, setIsTransakSellOpen] = useState(false);
	const [isWithdrawToExternalAccount, setIsWithdrawToExternalAccount] =
		useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const isMobile = useIsMobile();

	// NAVIGATION DISPLAY NAME
	const navDisplayName = () => {
		if (session?.user?.name && session.user.name.length >= 15) {
			return <p className='text-sm'>{session.user.name.slice(0, 15)}...</p>;
		} else {
			return <p className='text-sm'>{session?.user.name}</p>;
		}
	};

	// DRAWER DISPLAY NAME
	const drawerDisplayName = () => {
		if (session?.user?.name && session.user.name.length >= 29) {
			return <p className='text-sm'>{session.user.name.slice(0, 29)}...</p>;
		} else {
			return <p className='text-sm'>{session?.user.name}</p>;
		}
	};

	// DRAWER USER IMAGE
	const renderNavUserImage = () => {
		if (!session?.user?.image) return null;

		return (
			<div className='w-[28px] h-[28px] relative'>
				<img
					src={session.user.image}
					alt={`${session.user.name}'s avatar`}
					className='w-full h-full rounded-full object-cover'
					onError={(e) => {
						toast.error('Failed to load image');
					}}
					referrerPolicy='no-referrer'
					crossOrigin='anonymous'
					style={{
						minWidth: '28px',
						minHeight: '28px',
					}}
				/>
			</div>
		);
	};

	const renderDrawerUserImage = () => {
		if (!session?.user?.image) return null;

		return (
			<div className='w-[40px] h-[40px] relative'>
				<img
					src={session.user.image}
					alt={`${session.user.name}'s avatar`}
					className='w-full h-full rounded-full object-cover'
					onError={(e) => {
						toast.error('Failed to load image');
					}}
					referrerPolicy='no-referrer'
					crossOrigin='anonymous'
					style={{
						minWidth: '40px',
						minHeight: '40px',
					}}
				/>
			</div>
		);
	};

	// SHORT EMBEDDED ADDRESS
	const shortEmbeddedAddress = `${session?.user.ethereumAddress?.slice(
		0,
		7
	)}...${session?.user.ethereumAddress?.slice(-7)}`;

	// COPY EMBEDDED ADDRESS TO CLIPBOARD
	const copyToClipboard = () => {
		navigator.clipboard.writeText(session?.user?.ethereumAddress!).then(
			() => {
				toast.success('Address successfully copied!');
			},
			() => {
				toast.error('Failed to copy address to clipboard');
			}
		);
	};

	// FETCH BALANCE
	const handleGetBalance = async () => {
		if (!session || status !== 'authenticated' || !embeddedWallet) {
			setBalance(null);
			return;
		}
		try {
			const result = await publicClient.getBalance({
				address: embeddedWallet,
			});
			const balanceInEther = parseFloat(formatEther(result)).toFixed(4);
			setBalance(balanceInEther);
		} catch (error) {
			toast.error('Error fetching your balance');
			setBalance(null);
		}
	};

	// UPDATE BALANCE
	const handleUpdateBalance = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsLoadingBalance(true);
		await handleGetBalance();
		setIsLoadingBalance(false);
	};

	// VALIDATE INPUT IN SEND TRANSACTION
	const validateInput = useCallback(
		(address: string, amount: string): boolean => {
			const numAmount = parseFloat(amount);
			return address.length > 0 && !isNaN(numAmount) && numAmount > 0;
		},
		[]
	);

	const initialAdressState = {
		address: '',
	};
	const initialAmountState = {
		amount: '',
	};

	// STATE VARIABLES
	const [isDisabled, setDisabled] = useState(true);
	const [amountData, setAmountData] = useState(initialAmountState);
	const [addressData, setAddressData] = useState(initialAdressState);
	const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const updatedAmount = e.target.value;
		setAmountData({ ...amountData, amount: updatedAmount });
		setDisabled(!validateInput(addressData.address, updatedAmount));
	};

	const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const updatedAddress = e.target.value;
		setAddressData({ ...addressData, address: updatedAddress });
		setDisabled(!validateInput(updatedAddress, amountData.amount));
	};

	const maxAmount = () => {
		const setBalance = balance;
		setAmountData({ amount: setBalance });
		setDisabled(!validateInput(addressData.address, balance));
	};

	// SEND TRANSACTION
	const [hash, setHash] = useState<`0x${string}` | null>(null);
	const handleSendTransaction = async () => {
		setIsLoading(true);
		if (!validateInput(addressData.address, amountData.amount)) {
			toast.error('Please enter a valid address & amount.');
			setIsLoading(false);
			return;
		}
		try {
			const response = await fetch('/api/send-transaction/sign-transaction', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					to: addressData.address,
					value: amountData.amount,
				}),
			});

			if (!response.ok) {
				throw new Error('Transaction failed');
			}

			const { hash } = await response.json();
			setHash(hash);
			await publicClient.waitForTransactionReceipt({ hash });
			toast.success('Successful withdrawal!');
		} catch (error) {
			toast.error('Transaction failed. Please check your input and try again.');
		} finally {
			setIsLoading(false);
		}
	};

	// ADVANCED MENU
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
	const toggleAdvanced = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsAdvancedOpen(!isAdvancedOpen);
	};

	// SIGN OUT
	const handleSignOut = useCallback(async () => {
		setIsLoading(true);
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			disconnect();
			await signOut({ redirect: false });
			router.push('/');
		} catch (error) {
			toast.error('Something went wrong with logging out');
		} finally {
			setIsLoading(false);
		}
	}, [disconnect, router]);

	// DELETE ACCOUNT
	const handleDeleteAccount = async () => {
		if (
			confirm(
				'Are you sure you want to delete your account? This action cannot be undone.'
			)
		) {
			try {
				const response = await fetch('/api/user/manage', { method: 'DELETE' });
				if (!response.ok) throw new Error('Failed to delete account');
				localStorage.removeItem('last-used');
				await handleSignOut();
			} catch (error) {
				toast.error('An error occurred while deleting the account');
			}
		}
	};

	// TERMS ACCEPTANCE
	const [isTermsAccepted, setIsTermsAccepted] = useState(false);
	const handleTermsAcceptance = (e: React.ChangeEvent<HTMLInputElement>) => {
		setIsTermsAccepted(e.target.checked);
	};

	// DECRYPT PRIVATE KEY
	const [decryptedKey, setDecryptedKey] = useState<string | null>(null);
	const [isDecrypting, setIsDecrypting] = useState(false);
	const handleDecryptPrivateKey = async () => {
		if (!session) {
			toast.error('User session not found');
			return;
		}
		setIsDecrypting(true);
		try {
			const response = await fetch('/api/send-transaction/decrypt-key', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				toast.error('Failed to decrypt private key');
				return;
			}

			const { privateKey } = await response.json();

			setDecryptedKey(privateKey);
		} catch (error) {
			toast.error('Failed to decrypt private key');
		} finally {
			setIsDecrypting(false);
		}
	};

	// COPY PRIVATE KEY TO CLIPBOARD
	const copyKeyToClipboard = async () => {
		if (!decryptedKey) return;
		navigator.clipboard.writeText(decryptedKey).then(
			async () => {
				toast.success('Private key copied!');
				const response = await fetch('/api/user/manage', {
					method: 'PATCH',
				});
				if (!response.ok) throw new Error('Failed to update account');
				setDecryptedKey(null);
			},
			() => toast.error('Failed to copy key')
		);
	};

	// FETCH BALANCE ON MOUNT
	useEffect(() => {
		handleGetBalance();
	}, [embeddedWallet]);

	return (
		<>
			{session && (
				<>
					{/* DELETE DIALOG */}
					<AnimatePresence>
						{isDeleteDialogOpen && (
							<Dialog.Root
								open={isDeleteDialogOpen}
								onOpenChange={setIsDeleteDialogOpen}>
								<Dialog.Portal>
									<motion.div
										initial='hidden'
										animate='visible'
										className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50'
										style={{
											WebkitBackdropFilter: 'blur(4px)',
										}}
									/>
									<div className='fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-screen max-w-[450px] z-50'>
										<Dialog.Content asChild>
											<motion.div
												animate='visible'
												className='rounded-xl bg-[#1a1a1a] border border-yellow-500 p-6 shadow-lg focus:outline-none'>
												<div className='flex justify-between items-center mb-2'>
													<Dialog.Title className='text-neutral-100 text-lg mb-1 font-semibold tracking-tight'>
														Delete your account
													</Dialog.Title>
													<button
														onClick={() => {
															setIsDeleteDialogOpen(false);
														}}
														className='text-neutral-300 bg-white/10 rounded-full p-1'>
														<svg
															xmlns='http://www.w3.org/2000/svg'
															width='14'
															height='14'
															viewBox='0 0 24 24'
															fill='none'
															stroke='currentColor'
															strokeWidth='2'
															strokeLinecap='round'
															strokeLinejoin='round'
															className='rotate-90'>
															<path d='M18 6 6 18' />
															<path d='m6 6 12 12' />
														</svg>
													</button>
												</div>
												<Dialog.Description className='text-neutral-300 mb-5 text-[14px] leading-normal'>
													Deleting your account is irreversible. Your account
													will be removed from our database and its private key
													will be deleted. Please consider exporting your
													private key before deleting your account. You can
													import this private key into every wallet that
													supports the Base Network.
												</Dialog.Description>
												<div className='my-5'>
													<div className='relative'>
														<div
															aria-hidden='true'
															className='absolute inset-0 flex items-center'>
															<div className='w-full border-t border-yellow-500/20' />
														</div>
														<div className='relative flex justify-center text-sm font-medium leading-6'>
															<span className='px-3 bg-[#1a1a1a] text-yellow-500'>
																Delete zone
															</span>
														</div>
													</div>
												</div>
												<div className='flex items-center justify-between'>
													<button
														className={`flex w-full justify-center items-center border rounded-xl text-sm py-2 px-3 font-medium text-[12px]shadow-md
																			${
																				balance <= 0.00001
																					? 'border-yellow-500 bg-white/10 text-white'
																					: 'border-[#4B5563]/10 bg-gray-300/50 text-neutral-800 cursor-not-allowed'
																			}`}
														disabled={balance > 0.00001}
														onClick={(e) => {
															setIsDeleteDialogOpen(true);
															handleDeleteAccount();
														}}>
														{balance <= 0.00001
															? 'Delete account'
															: 'Withdraw your balance to proceed'}
													</button>
												</div>
											</motion.div>
										</Dialog.Content>
									</div>
								</Dialog.Portal>
							</Dialog.Root>
						)}
					</AnimatePresence>

					{/* EXPORT DIALOG */}
					<AnimatePresence>
						{isExportDialogOpen && (
							<Dialog.Root
								open={isExportDialogOpen}
								onOpenChange={setIsExportDialogOpen}>
								<Dialog.Portal>
									<motion.div
										initial='hidden'
										animate='visible'
										className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50'
										style={{
											WebkitBackdropFilter: 'blur(4px)',
										}}
									/>
									<motion.div className='fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-screen max-w-[450px] z-50'>
										<Dialog.Content asChild>
											<motion.div
												initial='hidden'
												animate='visible'
												className='rounded-xl bg-[#1a1a1a] border border-red-500 p-6 shadow-lg focus:outline-none'>
												<div className='flex justify-between items-center mb-2'>
													<Dialog.Title className='text-neutral-100 text-lg mb-1 font-semibold tracking-tight'>
														Export your account's private key
													</Dialog.Title>
													<button
														onClick={() => {
															setIsExportDialogOpen(false);
														}}
														className='text-neutral-300 bg-white/10 rounded-full p-1'>
														<svg
															xmlns='http://www.w3.org/2000/svg'
															width='14'
															height='14'
															viewBox='0 0 24 24'
															fill='none'
															stroke='currentColor'
															strokeWidth='2'
															strokeLinecap='round'
															strokeLinejoin='round'
															className='rotate-90'>
															<path d='M18 6 6 18' />
															<path d='m6 6 12 12' />
														</svg>
													</button>
												</div>
												<Dialog.Description className='text-neutral-300 mb-5 text-[14px] leading-normal'>
													Exporting your account's private key is a critical
													action. Your private key grants full access to all of
													your assets. Please handle with extreme care. Do not
													share this with anyone under any circumstances.
													Proceed only if you fully understand the risk
													involved.
													<a
														href='https://auth.watchen.xyz/export-keys'
														target='_blank'
														className='text-neutral-300 underline font-medium flex items-center text-sm'>
														Learn more
													</a>
												</Dialog.Description>

												<div className='flex items-center justify-between'>
													<label
														htmlFor='accept-terms'
														className='text-sm leading-6 text-neutral-100'>
														I accept the risks and responsibility.
													</label>
													<input
														id='accept-terms'
														name='accept-terms'
														type='checkbox'
														className='h-4 w-4 rounded border-[#4B5563]/20'
														checked={isTermsAccepted}
														onChange={handleTermsAcceptance}
													/>
												</div>

												<div className='my-5'>
													<div className='relative'>
														<div
															aria-hidden='true'
															className='absolute inset-0 flex items-center'>
															<div className='w-full border-t border-red-500/20' />
														</div>
														<div className='relative flex justify-center text-sm font-medium leading-6'>
															<span className='px-3 bg-[#1a1a1a] text-red-500'>
																Danger zone
															</span>
														</div>
													</div>
												</div>

												{!decryptedKey ? (
													<button
														className={`flex w-full justify-center items-center border rounded-xl text-sm py-2 px-3 font-medium text-[12px] shadow-md
															${
																isTermsAccepted
																	? 'border-red-500 bg-white/10 text-white'
																	: 'border-[#4B5563]/10 bg-gray-300/50 text-neutral-800 cursor-not-allowed'
															}`}
														disabled={!isTermsAccepted || isDecrypting}
														onClick={handleDecryptPrivateKey}>
														{isDecrypting && (
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
														{isDecrypting
															? 'Decrypting...'
															: !isTermsAccepted
															? 'To proceed, accept responsibility'
															: 'Decrypt the private key'}
													</button>
												) : (
													<div className='flex items-center justify-between gap-2 p-2 bg-black/20 rounded-lg border border-red-500/20 h-[38px]'>
														<input
															type='text'
															readOnly
															value={
																decryptedKey.slice(0, 10) +
																'...' +
																decryptedKey.slice(-10)
															}
															className='bg-white/5 blur-[2px] text-neutral-100 text-xs rounded font-mono focus:outline-none'
														/>
														<button
															onClick={copyKeyToClipboard}
															className='p-1.5 hover:bg-white/5 rounded-lg transition-colors'
															aria-label='Copy to clipboard'>
															<svg
																xmlns='http://www.w3.org/2000/svg'
																width='16'
																height='16'
																viewBox='0 0 24 24'
																fill='none'
																stroke='currentColor'
																strokeWidth='2'
																strokeLinecap='round'
																strokeLinejoin='round'
																className='text-neutral-100'>
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
													</div>
												)}

												<div className='flex mt-2 text-red-500 space-x-1'>
													<svg
														xmlns='http://www.w3.org/2000/svg'
														width='18'
														height='18'
														viewBox='0 0 24 24'
														fill='none'
														stroke='#ef4444'
														strokeWidth='1.5'
														strokeLinecap='round'
														strokeLinejoin='round'
														className='lucide lucide-triangle-alert'>
														<path d='m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3' />
														<path d='M12 9v4' />
														<path d='M12 17h.01' />
													</svg>
													<p className='text-xs leading-normal'>
														Please note that you waive any rights against us
														regarding fraud or theft. This action will be
														logged.
													</p>
												</div>
											</motion.div>
										</Dialog.Content>
									</motion.div>
								</Dialog.Portal>
							</Dialog.Root>
						)}
					</AnimatePresence>

					{/* DEPOSIT DIALOG */}
					<AnimatePresence>
						{isDepositDialogOpen && !isDrawerOpen && (
							<Dialog.Root
								open={isDepositDialogOpen}
								onOpenChange={(open) => {
									setIsDepositDialogOpen(open);
									if (!open) {
										setIsTransakSellOpen(false);
									}
								}}>
								<Dialog.Portal>
									<motion.div
										initial='hidden'
										animate='visible'
										className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50'
										style={{
											WebkitBackdropFilter: 'blur(4px)',
										}}
									/>
									<div className='fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-screen max-w-[450px] z-50'>
										<Dialog.Content asChild>
											<motion.div
												initial='hidden'
												animate='visible'
												className='rounded-xl bg-[#1a1a1a] border border-[#4B5563]/40 p-5 shadow-lg focus:outline-none'>
												<div className='flex justify-between items-center mb-2'>
													<Dialog.Title className='text-neutral-100 text-lg mb-1 font-semibold tracking-tight'>
														Deposit ETH on the{' '}
														<span className='font-extrabold'>Base Network</span>
													</Dialog.Title>
													<button
														onClick={() => {
															setIsDepositDialogOpen(false);
															setIsTransakBuyOpen(false);
														}}
														className='text-neutral-300 bg-white/10 rounded-full p-1'>
														<svg
															xmlns='http://www.w3.org/2000/svg'
															width='14'
															height='14'
															viewBox='0 0 24 24'
															fill='none'
															stroke='currentColor'
															strokeWidth='2'
															strokeLinecap='round'
															strokeLinejoin='round'
															className='rotate-90'>
															<path d='M18 6 6 18' />
															<path d='m6 6 12 12' />
														</svg>
													</button>
												</div>
												{!isTransakBuyOpen ? (
													<>
														<Dialog.Description className='text-neutral-300 mb-5 text-sm leading-normal'>
															You can either deposit by sending ETH from another
															account or a Centralized Crypto Exchange, or by
															purchasing from a trusted partner.
														</Dialog.Description>

														<div className='flex flex-col items-center mb-5'>
															<span className='p-1 md:h-[180px] md:w-[180px] hidden md:block rounded'>
																<QRCode
																	value={`ethereum:${session?.user.ethereumAddress}@84532`}
																	size={200}
																	style={{
																		height: 'auto',
																		maxWidth: '100%',
																		width: '100%',
																		padding: '8px',
																		borderRadius: '6px',
																		backgroundColor: '#ffffff',
																	}}
																	viewBox={`0 0 256 256`}
																/>
															</span>
															<p className='text-sm text-neutral-300 hidden md:block mt-1'>
																Scan to deposit
															</p>
														</div>
														<div className='my-5 hidden md:block'>
															<div className='relative'>
																<div
																	aria-hidden='true'
																	className='absolute inset-0 flex items-center'>
																	<div className='w-full border-t border-[#4B5563]/20' />
																</div>
																<div className='relative flex justify-center text-sm font-medium leading-6'>
																	<span className='px-3 bg-[#1a1a1a] text-neutral-300'>
																		Or
																	</span>
																</div>
															</div>
														</div>
														<div className='flex items-center'>
															<div className='flex'>
																<div className='relative'>
																	{session?.user.image && (
																		<img
																			src={session.user.image}
																			alt={`${session.user.name}'s avatar`}
																			className='w-[40px] h-[40px] rounded-full object-cover'
																		/>
																	)}
																	<img
																		src='/Base_Network_Logo.svg'
																		alt='Base Network Logo'
																		className='h-5 w-5 absolute -bottom-0.5 -right-0.5'
																	/>
																</div>
															</div>
															<div className='text-xs text-neutral-300 ml-5'>
																Copy your account address
																<span className='text-sm text-neutral-100 block font-bold'>
																	{shortEmbeddedAddress}
																</span>
															</div>
															<button
																onClick={copyToClipboard}
																className='ml-auto'>
																<svg
																	xmlns='http://www.w3.org/2000/svg'
																	width='16'
																	height='16'
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
														</div>
														<div className='my-5'>
															<div className='relative'>
																<div
																	aria-hidden='true'
																	className='absolute inset-0 flex items-center'>
																	<div className='w-full border-t border-[#4B5563]/20' />
																</div>
																<div className='relative flex justify-center text-sm font-medium leading-6'>
																	<span className='px-3 bg-[#1a1a1a] text-neutral-300'></span>
																</div>
															</div>
														</div>
														<div className='flex flex-col gap-4'>
															<button
																className='flex w-full justify-center items-center border border-[#4B5563]/40 rounded-xl text-sm py-2 px-3 font-medium bg-white/10 text-[12px] text-neutral-100 shadow-md'
																onClick={() => {
																	setIsTransakBuyOpen(true);
																}}>
																<img
																	src='/transak-logo.svg'
																	alt='Transak Logo'
																	className='h-5 w-5 mr-2'
																/>
																<span>Deposit using a card</span>
															</button>
															<a
																href={`https://testnets.relay.link/bridge/base-sepolia?fromChainId=11155111&toAddress=${session?.user.ethereumAddress}`}
																target='_blank'
																className='flex w-full justify-center items-center border border-[#4B5563]/40 rounded-xl text-sm py-2 px-3 font-medium bg-white/10 text-[12px] text-neutral-100 shadow-md'
																onClick={() => {
																	setIsDepositDialogOpen(false);
																}}>
																<img
																	src='/relay-logo.svg'
																	alt='Relay Logo'
																	className='h-5 w-5 mr-2'
																/>
																<span>Bridge ETH</span>
															</a>
														</div>
													</>
												) : (
													<TransakOnRamp />
												)}
											</motion.div>
										</Dialog.Content>
									</div>
								</Dialog.Portal>
							</Dialog.Root>
						)}
					</AnimatePresence>

					{/* WITHDRAW DIALOG */}
					<AnimatePresence>
						{isWithdrawDialogOpen && !isDrawerOpen && (
							<Dialog.Root
								open={isWithdrawDialogOpen}
								onOpenChange={(open) => {
									if (!open) {
										setIsWithdrawDialogOpen(false);
										setIsTransakSellOpen(false);
										setIsWithdrawToExternalAccount(false);
									}
								}}>
								<Dialog.Portal>
									<motion.div
										initial='hidden'
										animate='visible'
										className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50'
										style={{
											WebkitBackdropFilter: 'blur(4px)',
										}}
									/>
									<div className='fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-screen max-w-[450px] z-50'>
										<Dialog.Content asChild>
											<motion.div
												initial='hidden'
												animate='visible'
												className='rounded-xl bg-[#1a1a1a] border border-[#4B5563]/40 p-5 shadow-lg focus:outline-none'>
												<div className='flex justify-between items-center mb-2'>
													<Dialog.Title className='text-neutral-100 text-lg font-semibold tracking-tight'>
														Withdraw ETH
													</Dialog.Title>
													<button
														onClick={() => {
															setIsWithdrawDialogOpen(false);
															setIsTransakSellOpen(false);
															setIsWithdrawToExternalAccount(false);
														}}
														className='text-neutral-300 bg-white/10 rounded-full p-1'>
														<svg
															xmlns='http://www.w3.org/2000/svg'
															width='14'
															height='14'
															viewBox='0 0 24 24'
															fill='none'
															stroke='currentColor'
															strokeWidth='2'
															strokeLinecap='round'
															strokeLinejoin='round'
															className='rotate-90'>
															<path d='M18 6 6 18' />
															<path d='m6 6 12 12' />
														</svg>
													</button>
												</div>
												{!isTransakSellOpen && !isWithdrawToExternalAccount && (
													<Dialog.Description className='text-neutral-300 mb-5 text-[14px] leading-normal'>
														Choose how you'd like to withdraw your ETH.
													</Dialog.Description>
												)}
												{!isTransakSellOpen ? (
													<>
														{!isWithdrawToExternalAccount && (
															<div className='flex flex-col space-y-4'>
																<button
																	onClick={() => {
																		setIsWithdrawToExternalAccount(true);
																	}}
																	className='border border-[#4B5563]/40 rounded-xl text-sm py-2 px-3 font-medium bg-white/10 text-[12px] text-neutral-100 shadow-md w-full flex items-center justify-center space-x-2'>
																	<svg
																		xmlns='http://www.w3.org/2000/svg'
																		width='20'
																		height='20'
																		viewBox='0 0 24 24'
																		fill='none'
																		stroke='#fafafa'
																		strokeWidth='2'
																		strokeLinecap='round'
																		strokeLinejoin='round'>
																		<path d='M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1' />
																		<path d='M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4' />
																	</svg>
																	<span>Withdraw to External Account</span>
																</button>
																<button
																	onClick={() => {
																		setIsTransakSellOpen(true);
																	}}
																	className='border border-[#4B5563]/40 rounded-xl text-sm py-2 px-3 font-medium bg-white/10 text-[12px] text-neutral-100 shadow-md w-full flex items-center justify-center space-x-2'>
																	<svg
																		xmlns='http://www.w3.org/2000/svg'
																		width='20'
																		height='20'
																		viewBox='0 0 24 24'
																		fill='none'
																		stroke='#fafafa'
																		strokeWidth='2'
																		strokeLinecap='round'
																		strokeLinejoin='round'>
																		<rect
																			width='20'
																			height='14'
																			x='2'
																			y='5'
																			rx='2'
																		/>
																		<line x1='2' x2='22' y1='10' y2='10' />
																	</svg>
																	<span>Withdraw to Card</span>
																</button>
															</div>
														)}
														{isWithdrawToExternalAccount && (
															<>
																<div className='flex items-center rounded-xl p-4 mb-1 relative mt-5'>
																	<div className='flex'>
																		<div className='relative'>
																			{session?.user.image && (
																				<img
																					src={session.user.image}
																					alt={`${session.user.name}'s avatar`}
																					className='w-[45px] h-[45px] rounded-full object-cover'
																				/>
																			)}
																			<img
																				src='/Base_Network_Logo.svg'
																				alt='Base Network Logo'
																				className='h-5 w-5 absolute -bottom-0.5 -right-0.5'
																			/>
																		</div>
																	</div>
																	<div className='text-[12px] text-neutral-300 ml-5'>
																		Withdraw from
																		<span className='text-[14px] block font-bold text-neutral-100'>
																			{shortEmbeddedAddress}
																		</span>
																		<span>
																			Balance:{' '}
																			<span className='font-bold'>
																				{balance} ETH
																			</span>
																		</span>
																	</div>
																</div>
																<div className='h-px w-full bg-linear-to-r from-[#4B5563]/0 via-[#4B5563]/40 to-[#4B5563]/0' />
																<fieldset className='flex items-center rounded-xl p-4 mb-1 relative'>
																	<div className='flex'>
																		<div className='relative'>
																			<img
																				src={'/default-image.svg'}
																				alt={`Random wallet avatar`}
																				className='w-[45px] h-[45px] rounded-full object-cover'
																			/>
																			<img
																				src='/Base_Network_Logo.svg'
																				alt='Base Network Logo'
																				className='h-5 w-5 absolute -bottom-0.5 -right-0.5'
																			/>
																		</div>
																	</div>
																	<div className='text-[12px] text-neutral-300 ml-5 min-w-[250px]'>
																		To
																		<div className='flex flex-col'>
																			<input
																				className='font-medium text-neutral-100 bg-transparent inline-flex py-1 w-full flex-1 items-center justify-center text-[14px] leading-none shadow-[0_0_0_0px] outline-none focus:shadow-[0_0_0_0px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
																				placeholder='Input recipient address'
																				onChange={handleAddressChange}
																				name='address'
																				aria-label='address'
																				type='text'
																				step='any'
																				value={addressData.address}
																			/>
																			<div className='h-px bg-[#4B5563]/40 my-[5px]' />
																			<div className='flex items-center'>
																				<input
																					className='font-medium text-neutral-100 bg-transparent inline-flex h-[26.6px] w-full flex-1 items-center justify-center text-[14px] leading-none shadow-[0_0_0_0px] outline-none focus:shadow-[0_0_0_0px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
																					placeholder='Input amount in ETH'
																					onChange={handleAmountChange}
																					name='amount'
																					aria-label='amount'
																					type='number'
																					pattern='[0-9]*([.,][0-9]+)?'
																					step='any'
																					min='0.00001'
																					value={amountData.amount}
																				/>
																				<button
																					onClick={maxAmount}
																					className='flex items-center border border-[#4B5563]/40 rounded-xl py-0.5 px-1.5 font-medium bg-white/10 text-[11px] text-neutral-100 shadow-md ml-auto'>
																					Max
																				</button>
																			</div>
																		</div>
																	</div>
																</fieldset>
																<button
																	onClick={handleSendTransaction}
																	className={`w-full mt-6
																	${
																		!isLoading
																			? 'primarybtn'
																			: 'flex w-full justify-center items-center border rounded-xl text-sm py-2 px-3 font-medium text-[12px]shadow-md border-[#4B5563]/10 bg-gray-300/50 text-neutral-800 cursor-not-allowed'
																	}`}>
																	{!isLoading ? (
																		<span>Submit withdrawal</span>
																	) : (
																		<>
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
																				<span>Submitting...</span>
																			</span>
																		</>
																	)}
																</button>
																{hash && (
																	<>
																		<div className='h-px w-full mb-4 mt-4 bg-linear-to-r from-[#4B5563]/0 via-[#4B5563]/40 to-[#4B5563]/0' />
																		<div className='flex items-center justify-center'>
																			<a
																				href={`https://sepolia.basescan.org/tx/${hash}`}
																				target='_blank'
																				className='text-sm font-medium text-neutral-300 flex items-center space-x-2'>
																				<span>
																					View transaction on BaseScan
																				</span>
																				<svg
																					xmlns='http://www.w3.org/2000/svg'
																					width='14'
																					height='14'
																					viewBox='0 0 24 24'
																					fill='none'
																					stroke='currentColor'
																					strokeWidth='1.5'
																					strokeLinecap='round'
																					strokeLinejoin='round'>
																					<path d='M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6' />
																					<path d='m21 3-9 9' />
																					<path d='M15 3h6v6' />
																				</svg>
																			</a>
																		</div>
																	</>
																)}
															</>
														)}
													</>
												) : (
													<TransakOffRamp />
												)}
											</motion.div>
										</Dialog.Content>
									</div>
								</Dialog.Portal>
							</Dialog.Root>
						)}
					</AnimatePresence>

					{/* DRAWER */}
					<Dialog.Root
						open={isDialogOpen}
						onOpenChange={(open) => {
							setIsDialogOpen(open);
							if (!open) {
								setIsAdvancedOpen(false);
							}
						}}>
						<Dialog.Trigger asChild>
							<button className='relative flex items-center border border-[#4B5563]/40 rounded-full sm:rounded-xl sm:space-x-2 text-sm p-0.5 sm:py-1 sm:px-1.5 font-medium bg-white/10 text-neutral-100 shadow-md'>
								{renderNavUserImage()}
								<span className='hidden sm:block'>{navDisplayName()}</span>
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
											onClick={() => setIsAdvancedOpen(false)}
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
												<motion.div className='grow relative flex flex-col'>
													{/* USER INFO */}
													<motion.div className='flex items-center space-x-2'>
														{renderDrawerUserImage()}
														<div className='flex flex-col'>
															<Dialog.Title className='font-bold text-lg text-neutral-50'>
																{drawerDisplayName()}
															</Dialog.Title>
															<Dialog.Description className='sr-only text-neutral-400 text-xs'>
																Account: {shortEmbeddedAddress}
															</Dialog.Description>
															<span className='flex items-center space-x-1'>
																<p className='text-xs text-neutral-300'>
																	Account:
																</p>
																<button
																	onClick={copyToClipboard}
																	className='flex items-center space-x-2'>
																	<span className='text-xs text-neutral-100'>
																		{shortEmbeddedAddress}
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
														<div className='h-px w-full my-2' />
														<div className='flex items-center justify-around gap-1'>
															<button
																className='w-full rounded-xl flex justify-center primarybtn space-x-2'
																onClick={() => {
																	setIsDepositDialogOpen(true);
																	setIsDrawerOpen(false);
																}}>
																<svg
																	xmlns='http://www.w3.org/2000/svg'
																	width='16'
																	height='16'
																	viewBox='0 0 24 24'
																	fill='none'
																	stroke='#fafafa'
																	strokeWidth='2.5'
																	strokeLinecap='round'
																	strokeLinejoin='round'>
																	<path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
																	<polyline points='7 10 12 15 17 10' />
																	<line x1='12' x2='12' y1='15' y2='3' />
																</svg>
																<span>Deposit</span>
															</button>

															<button
																onClick={() => {
																	setIsWithdrawDialogOpen(true);
																	setIsDrawerOpen(false);
																}}
																className='text-sm font-medium text-neutral-100 w-full rounded-xl flex justify-center py-2 px-3 items-center space-x-2'>
																<svg
																	xmlns='http://www.w3.org/2000/svg'
																	width='16'
																	height='16'
																	viewBox='0 0 24 24'
																	fill='none'
																	stroke='#f5f5f5'
																	strokeWidth='2.5'
																	strokeLinecap='round'
																	strokeLinejoin='round'>
																	<path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
																	<polyline points='17 8 12 3 7 8' />
																	<line x1='12' x2='12' y1='3' y2='15' />
																</svg>
																<span>Withdraw</span>
															</button>
														</div>
													</motion.section>

													<div className='grow' />

													{/* ADVANCED OPTIONS */}
													<motion.section className='w-full relative'>
														<motion.button
															onClick={(e: any) => {
																e.stopPropagation();
																toggleAdvanced(e);
															}}
															className='flex justify-between items-center w-full text-xs font-medium text-neutral-100 shadow-md py-2'>
															<span>View advanced options</span>
															<motion.svg
																xmlns='http://www.w3.org/2000/svg'
																width='12'
																height='12'
																viewBox='0 0 24 24'
																fill='none'
																stroke='#f5f5f5'
																strokeWidth='2'
																strokeLinecap='round'
																strokeLinejoin='round'
																animate={{ rotate: isAdvancedOpen ? 180 : 0 }}
																transition={{
																	duration: 0.3,
																	ease: [0.4, 0.0, 0.2, 1],
																}}>
																<polyline points='6 9 12 15 18 9'></polyline>
															</motion.svg>
														</motion.button>

														<AnimatePresence>
															{isAdvancedOpen && (
																<motion.div
																	initial='hidden'
																	animate='visible'
																	exit='hidden'
																	className='absolute bottom-full left-0 right-0 mb-1 flex flex-col space-y-3 bg-[#090909]/95 backdrop-blur-sm border border-[#4B5563]/30 rounded-xl p-2 shadow-lg'
																	onClick={(e: any) => e.stopPropagation()}>
																	<motion.div
																		className='group rounded-lg relative outline-none'
																		custom={0}>
																		<a
																			href={`https://sepolia.basescan.org/address/${session.user.ethereumAddress}`}
																			target='_blank'
																			className='inline-flex justify-center w-full text-[12px] items-center font-medium space-x-2 text-neutral-100'
																			onClick={(e) => e.stopPropagation()}>
																			<svg
																				xmlns='http://www.w3.org/2000/svg'
																				width='14'
																				height='14'
																				viewBox='0 0 24 24'
																				fill='none'
																				stroke='currentColor'
																				strokeWidth='1.5'
																				strokeLinecap='round'
																				strokeLinejoin='round'>
																				<path d='M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6' />
																				<path d='m21 3-9 9' />
																				<path d='M15 3h6v6' />
																			</svg>
																			<span>Account history</span>
																		</a>
																	</motion.div>

																	{/* Delete Account Button */}
																	<motion.div
																		className='group rounded-lg relative outline-none'
																		custom={1}>
																		<button
																			onClick={(e) => {
																				setIsDeleteDialogOpen(true);
																			}}
																			className='inline-flex justify-center w-full text-[12px] items-center font-medium space-x-1 text-yellow-500'>
																			<svg
																				xmlns='http://www.w3.org/2000/svg'
																				width='14'
																				height='14'
																				viewBox='0 0 24 24'
																				fill='none'
																				stroke='#eab308'
																				strokeWidth='1.5'
																				strokeLinecap='round'
																				strokeLinejoin='round'
																				className='lucide lucide-trash-2'>
																				<path d='M3 6h18' />
																				<path d='M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' />
																				<path d='M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' />
																				<line x1='10' x2='10' y1='11' y2='17' />
																				<line x1='14' x2='14' y1='11' y2='17' />
																			</svg>
																			<span>Delete account</span>
																		</button>
																	</motion.div>

																	{/* Export Private Key */}
																	<motion.div
																		className='group rounded-lg relative outline-none'
																		custom={2}>
																		<button
																			className='inline-flex justify-center w-full text-[12px] items-center font-medium space-x-1 text-red-500'
																			onClick={() =>
																				setIsExportDialogOpen(true)
																			}>
																			<svg
																				xmlns='http://www.w3.org/2000/svg'
																				width='14'
																				height='14'
																				viewBox='0 0 24 24'
																				fill='none'
																				stroke='#ef4444'
																				strokeWidth='1.5'
																				strokeLinecap='round'
																				strokeLinejoin='round'
																				className='lucide lucide-triangle-alert'>
																				<path d='m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3' />
																				<path d='M12 9v4' />
																				<path d='M12 17h.01' />
																			</svg>
																			<span>Export private key</span>
																		</button>
																	</motion.div>
																</motion.div>
															)}
														</AnimatePresence>
													</motion.section>

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
															{isLoading ? (
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
										</motion.div>
									</Dialog.Content>
								)}
							</AnimatePresence>
						</Dialog.Portal>
					</Dialog.Root>
				</>
			)}
		</>
	);
}

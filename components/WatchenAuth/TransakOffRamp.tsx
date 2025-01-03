import React, { useState, useCallback, useEffect } from 'react';
import { TransakConfig, Transak } from '@transak/transak-sdk';
import { useWallet } from '../../hooks/useWallet';
import { formatEther } from 'viem';
import { toast } from 'sonner';

const TRANSAK_API_KEY = process.env.NEXT_PUBLIC_TRANSAK_API_KEY as string;

function TransakOffRamp() {
	const [transak, setTransak] = useState<Transak | null>(null);
	const [orderSuccess, setOrderSuccess] = useState(false);
	const [hasSetAmount, setHasSetAmount] = useState(false);
	const [destinationAddress, setDestinationAddress] = useState<string | null>(
		null
	);
	const [amount, setAmount] = useState<number | null>(null);
	const [isTransacting, setIsTransacting] = useState(false);

	const { embeddedWallet, publicClient, sendTransaction } = useWallet();

	const initialAmountState = {
		amount: '',
	};
	const [amountData, setAmountData] = useState(initialAmountState);
	const [isDisabled, setDisabled] = useState(true);
	const [balance, setBalance] = useState<any | null>(null);

	// VALIDATE INPUT IN SEND TRANSACTION
	const validateInput = useCallback((amount: string): boolean => {
		const numAmount = parseFloat(amount);
		return !isNaN(numAmount) && numAmount > 0;
	}, []);

	const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const updatedAmount = e.target.value;
		setAmountData({ ...amountData, amount: updatedAmount });
		setDisabled(!validateInput(updatedAmount));
	};

	const maxAmount = () => {
		const setBalance = balance;
		setAmountData({ amount: setBalance });
		setDisabled(!validateInput(balance));
	};

	const handleInitiateWithdraw = () => {
		setHasSetAmount(true);
	};

	const handleTransaction = async (to: string, amount: string) => {
		if (!to || !amount) {
			toast.error('Missing transaction details');
			return;
		}

		setIsTransacting(true);
		try {
			const response = await fetch('/api/send-transaction/sign-transaction', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					to,
					value: amount,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Transaction failed');
			}

			const { hash } = await response.json();
			await publicClient.waitForTransactionReceipt({ hash });
			toast.success('Transaction sent successfully');
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Transaction failed'
			);
		} finally {
			setIsTransacting(false);
		}
	};

	useEffect(() => {
		if (!hasSetAmount) {
			// FETCH BALANCE
			const handleGetBalance = async () => {
				if (!embeddedWallet) {
					setBalance('0');
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
					setBalance('0');
				}
			};
			handleGetBalance();
		} else {
			const transakConfig: TransakConfig = {
				apiKey: TRANSAK_API_KEY,
				environment: Transak.ENVIRONMENTS.STAGING,
				containerId: 'transakMount',
				productsAvailed: 'SELL',
				defaultFiatCurrency: 'USD',
				defaultNetwork: 'base',
				network: 'base',
				cryptoCurrencyCode: 'ETH',
				defaultCryptoAmount: Number(amountData.amount),
			};

			const newTransak = new Transak(transakConfig);

			newTransak.init();

			setTransak(newTransak);

			const handleOrderSuccessful = () => {
				setOrderSuccess(true);
				newTransak.close();
			};
			const handleOrderFailed = () => {
				setOrderSuccess(false);
				newTransak.close();
			};

			const handleOrderCreated = (data: any) => {
				newTransak.close();
				setDestinationAddress(data.status.cryptoPaymentData.paymentAddress);
				setAmount(Number(data.status.cryptoAmount));
			};

			Transak.on(
				Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL,
				handleOrderSuccessful
			);
			Transak.on(Transak.EVENTS.TRANSAK_ORDER_FAILED, handleOrderFailed);
			Transak.on(Transak.EVENTS.TRANSAK_ORDER_CREATED, handleOrderCreated);

			return () => {
				newTransak.cleanup();
			};
		}
	}, [hasSetAmount, embeddedWallet]);

	return (
		<div className='w-full max-w-2xl mx-auto p-1 bg-white dark:bg-gradient-to-br dark:from-[#343D4B] dark:to-[#313A47] rounded-xl shadow-md'>
			{orderSuccess && (
				<div className='flex flex-col items-center justify-center h-[490px] sm:h-[560px]'>
					<svg
						xmlns='http://www.w3.org/2000/svg'
						width='52'
						height='52'
						viewBox='0 0 24 24'
						fill='none'
						stroke='#15803d'
						strokeWidth='3'
						strokeLinecap='round'
						strokeLinejoin='round'
						className='lucide lucide-circle-check-big'
						style={{ marginBottom: '20px' }}>
						<path d='M21.801 10A10 10 0 1 1 17 3.335' />
						<path d='m9 11 3 3L22 4' />
					</svg>
					<p className='text-2xl text-center font-extrabold text-blue-400'>
						Withdrawal Successful
					</p>
					<p className='text-sm text-neutral-300 text-center'>
						You can now safely exit this window. Your withdrawal is being
						processed.
					</p>
				</div>
			)}
			{!orderSuccess && hasSetAmount && !destinationAddress && (
				<div className='w-full h-[490px] sm:h-[560px]' id='transakMount'></div>
			)}
			{!hasSetAmount && !orderSuccess && (
				<div className='flex flex-col items-center justify-center h-[490px] sm:h-[560px] p-4'>
					<p className='text-neutral-100 text-center text-lg mb-8 font-semibold'>
						Enter the amount you want to withdraw
					</p>
					<div className='flex flex-col items-center justify-center'>
						<input
							className='text-4xl font-semibold text-neutral-100 text-center bg-transparent block mx-auto flex-1 items-center justify-center leading-none outline-none focus:shadow-[0_0_0_0px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
							placeholder='0'
							onChange={handleAmountChange}
							name='amount'
							aria-label='amount'
							type='number'
							pattern='[0-9]*([.,][0-9]+)?'
							step='any'
							min='0.00001'
							value={amountData.amount}
						/>
						<div className='flex justify-center items-center space-x-2 mt-2'>
							<p className='text-neutral-300 text-sm'>Balance: {balance} ETH</p>
							<button
								onClick={maxAmount}
								className='flex items-center border border-[#4B5563]/40 rounded-xl py-0.5 px-1.5 font-medium bg-white/10 text-[11px] text-neutral-100 shadow-md'>
								Max
							</button>
						</div>
					</div>
					<button
						onClick={handleInitiateWithdraw}
						className={`flex mx-auto w-[300px] rounded-xl py-2 mt-10 ${
							Number(amountData.amount) > balance ||
							Number(amountData.amount) <= 0 ||
							Number(amountData.amount) < 0.0036
								? 'text-sm py-2 px-3 rounded-xl font-medium bg-gradient-to-b from-[#1d43ff]/50 via-[#0025df]/50 to-[#0025df]/50 text-neutral-50/50 cursor-not-allowed justify-center'
								: 'primarybtn'
						}`}
						disabled={
							Number(amountData.amount) > balance ||
							Number(amountData.amount) <= 0 ||
							Number(amountData.amount) < 0.0036
						}>
						{Number(amountData.amount) > balance ||
						Number(amountData.amount) <= 0 ||
						Number(amountData.amount) < 0.0036
							? 'Enter a valid amount'
							: 'Proceed'}
					</button>
				</div>
			)}
			{!orderSuccess && destinationAddress && amount && (
				<div className='flex flex-col items-center justify-center h-[490px] sm:h-[560px] p-4'>
					<h2 className='text-neutral-100 text-center text-lg mb-2 font-semibold'>
						Confirm Transaction
					</h2>
					<p className='text-neutral-300 text-center mb-2'>
						Please confirm the transaction details below:
					</p>
					<p className='text-neutral-300 my-4'>
						Withdrawal amount:{' '}
						<span className='font-semibold'>{amount} ETH</span>
					</p>
					<button
						onClick={() =>
							handleTransaction(destinationAddress!, amount!.toString())
						}
						disabled={isTransacting}
						className='primarybtn flex mx-auto w-[300px] mt-2'>
						{isTransacting ? 'Finalizing...' : 'Finalize withdrawal'}
					</button>
				</div>
			)}
		</div>
	);
}

export default TransakOffRamp;

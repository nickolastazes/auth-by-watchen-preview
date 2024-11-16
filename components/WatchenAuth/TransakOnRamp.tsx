import React, { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { TransakConfig, Transak } from '@transak/transak-sdk';
import Confetti from 'react-confetti-boom';

const TRANSAK_API_KEY = process.env.NEXT_PUBLIC_TRANSAK_API_KEY as string;

function TransakOnRamp() {
	const { data: session } = useSession();
	const [transak, setTransak] = useState<Transak | null>(null);
	const [orderSuccess, setOrderSuccess] = useState(false);

	useEffect(() => {
		const transakConfig: TransakConfig = {
			apiKey: TRANSAK_API_KEY,
			environment: Transak.ENVIRONMENTS.STAGING,
			containerId: 'transakMount',
			productsAvailed: 'BUY',
			defaultFiatAmount: 30,
			defaultFiatCurrency: 'USD',
			defaultNetwork: 'base',
			network: 'base',
			walletAddress: session?.user?.ethereumAddress,
			disableWalletAddressForm: true,
		};

		const newTransak = new Transak(transakConfig);

		newTransak.init();

		setTransak(newTransak);

		const handleOrderSuccessful = () => {
			setOrderSuccess(true);
			newTransak.close();
		};
		Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, handleOrderSuccessful);

		return () => {
			newTransak.cleanup();
		};
	}, []);

	return (
		<div className='w-full max-w-2xl mx-auto p-1 bg-white dark:bg-gradient-to-br dark:from-[#343D4B] dark:to-[#313A47] rounded-xl shadow-md'>
			{orderSuccess && (
				<div className='flex flex-col items-center justify-center h-[490px] sm:h-[560px]'>
					<Confetti
						mode='boom'
						particleCount={80}
						shapeSize={12}
						launchSpeed={1.3}
						spreadDeg={41}
						colors={['#ff577f', '#ff884b', '#ffd384', '#fff9b0']}
						effectCount={5}
					/>
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
					<p className='text-2xl text-center font-extrabold text-green-700'>
						Order Successful!
					</p>
					<p className='text-sm text-neutral-600 text-center'>
						You can now safely exit this window. Your ETH will arrive in your
						wallet shortly.
					</p>
				</div>
			)}
			{!orderSuccess && (
				<div className='w-full h-[490px] sm:h-[560px]' id='transakMount'></div>
			)}
		</div>
	);
}

export default TransakOnRamp;

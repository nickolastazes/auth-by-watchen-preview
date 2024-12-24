import React from 'react';
import { useAccount } from 'wagmi';
import { useSession } from 'next-auth/react';
import { Toaster } from 'sonner';
import dynamic from 'next/dynamic';
import ExternalWalletAltUi from './WalletUi/ExternalWalletUi';

const EmbeddedWalletUi = dynamic(() => import('./WalletUi/EmbeddedWalletUi'), {
	loading: () => (
		<div className='flex items-center space-x-2 border border-[#4B5563]/40 rounded-full sm:rounded-xl p-0.5 sm:py-1 sm:px-1.5 bg-white/10'>
			<div className='h-[28px] w-[28px] rounded-full bg-white/20 animate-pulse' />
			<div className='hidden sm:block h-4 w-24 bg-white/20 animate-pulse rounded' />
		</div>
	),
	ssr: false,
});

function Wallet() {
	const { address: externalAddress } = useAccount();
	const { data: session, status } = useSession();
	const isLoading = status === 'loading';

	return (
		<section>
			<Toaster position='bottom-right' richColors />
			{session && status === 'authenticated' && !externalAddress ? (
				<EmbeddedWalletUi isWalletLoading={isLoading} />
			) : (
				<div className='flex items-center space-x-2 border border-[#4B5563]/40 rounded-full sm:rounded-xl p-0.5 sm:py-1 sm:px-1.5 bg-white/10'>
					<div className='h-[28px] w-[28px] rounded-full bg-white/20 animate-pulse' />
					<div className='hidden sm:block h-4 w-24 bg-white/20 animate-pulse rounded' />
				</div>
			)}
			{session && status === 'authenticated' && externalAddress && (
				<ExternalWalletAltUi />
			)}
		</section>
	);
}

export default Wallet;

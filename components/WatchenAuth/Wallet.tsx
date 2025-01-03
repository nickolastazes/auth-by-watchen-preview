import React from 'react';
import { useAccount } from 'wagmi';
import { useSession } from 'next-auth/react';
import { Toaster } from 'sonner';
import EmbeddedWalletAltUi from './WalletUi/EmbeddedWalletUi';
import ExternalWalletAltUi from './WalletUi/ExternalWalletUi';
import WalletSkeleton from './WalletUi/WalletSkeleton';

function Wallet() {
	const { address: externalAddress } = useAccount();
	const { data: session, status } = useSession();

	if (status === 'loading') {
		return <WalletSkeleton />;
	}

	return (
		<div
			className='relative'
			tabIndex={-1}
			{...(status !== 'authenticated' ? { 'data-inert': '' } : {})}>
			<Toaster position='bottom-right' richColors />
			{session && status === 'authenticated' && !externalAddress && (
				<EmbeddedWalletAltUi />
			)}
			{session && status === 'authenticated' && externalAddress && (
				<ExternalWalletAltUi />
			)}
		</div>
	);
}

export default Wallet;

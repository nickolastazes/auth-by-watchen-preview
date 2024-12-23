import React from 'react';
import { useAccount } from 'wagmi';
import { useSession } from 'next-auth/react';
import { Toaster } from 'sonner';
import EmbeddedWalletUi from './WalletUi/EmbeddedWalletUi';
import ExternalWalletUi from './WalletUi/ExternalWalletUi';

function Wallet() {
	const { address: externalAddress } = useAccount();
	const { data: session, status } = useSession();
	return (
		<section>
			<Toaster position='bottom-right' richColors />
			{session && status === 'authenticated' && !externalAddress && (
				<EmbeddedWalletUi />
			)}
			{session && status === 'authenticated' && externalAddress && (
				<ExternalWalletUi />
			)}
		</section>
	);
}

export default Wallet;

import React from 'react';
import { useAccount } from 'wagmi';
import { useSession } from 'next-auth/react';
import { Toaster } from 'sonner';
import EmbeddedWalletAltUi from './WalletAltUi/EmbeddedWalletAltUi';
import ExternalWalletAltUi from './WalletAltUi/ExternalWalletAltUi';

function Wallet() {
	const { address: externalAddress } = useAccount();
	const { data: session, status } = useSession();
	return (
		<section>
			<Toaster position='bottom-right' richColors />
			{session && status === 'authenticated' && !externalAddress && (
				<EmbeddedWalletAltUi />
			)}
			{session && status === 'authenticated' && externalAddress && (
				<ExternalWalletAltUi />
			)}
		</section>
	);
}

export default Wallet;

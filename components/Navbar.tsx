import React, { Suspense } from 'react';
import Wallet from './WatchenAuth/Wallet';
import WalletSkeleton from './WatchenAuth/WalletUi/WalletSkeleton';

function Navbar() {
	return (
		<nav className='flex items-center justify-between p-2'>
			<div className='text-neutral-50 font-bold'>YOUR LOGO</div>
			<Suspense fallback={<WalletSkeleton />}>
				<Wallet />
			</Suspense>
		</nav>
	);
}

export default Navbar;

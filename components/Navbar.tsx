import React from 'react';
import Wallet from './WatchenAuth/Wallet';

function Navbar() {
	return (
		<nav className='flex items-center justify-between p-2'>
			<div className='text-neutral-50 font-bold'>YOUR LOGO</div>
			<Wallet />
		</nav>
	);
}

export default Navbar;

import React from 'react';

const WalletSkeleton = () => {
	return (
		<div className='flex items-center border border-[#4B5563]/40 rounded-xl space-x-2 text-sm py-1 px-2 font-medium bg-white/10 text-neutral-100 shadow-md animate-pulse'>
			<div className='w-[28px] h-[28px] rounded-full bg-gray-400/50'></div>
			<div className='hidden sm:block w-24 h-4 bg-gray-400/50 rounded'></div>
		</div>
	);
};

export default WalletSkeleton;

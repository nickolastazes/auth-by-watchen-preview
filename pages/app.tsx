import React, { Suspense } from 'react';
import Navbar from '../components/Navbar';

export default function App() {
	return (
		<div className='flex flex-col items-center justify-center min-h-screen relative max-w-full mx-auto'>
			<section className='w-full top-0 absolute'>
				<Suspense
					fallback={<div className='text-white'>Loading navigation...</div>}>
					<Navbar />
				</Suspense>
			</section>
			<main>
				<section className='text-center mb-16 relative'>
					<h1 className='text-neutral-50'>Welcome to Auth by Watchen.xyz</h1>
					<p className='text-neutral-300'>You are logged in.</p>
				</section>
			</main>
		</div>
	);
}

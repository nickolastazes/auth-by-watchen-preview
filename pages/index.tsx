import React from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';

export default function Home() {
	const router = useRouter();

	const toLoginPage = () => {
		router.push('/sign-in');
	};

	return (
		<main>
			<section>
				<div className='absolute inset-x-0 top-10 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl'>
					<svg
						viewBox='0 0 1108 632'
						aria-hidden='true'
						className='w-[69.25rem] flex-none'>
						<path
							fill='url(#175c433f-44f6-4d59-93f0-c5c51ad5566d)'
							fillOpacity='.2'
							d='M235.233 402.609 57.541 321.573.83 631.05l234.404-228.441 320.018 145.945c-65.036-115.261-134.286-322.756 109.01-230.655C968.382 433.026 1031 651.247 1092.23 459.36c48.98-153.51-34.51-321.107-82.37-385.717L810.952 324.222 648.261.088 235.233 402.609Z'
						/>
						<defs>
							<linearGradient
								id='175c433f-44f6-4d59-93f0-c5c51ad5566d'
								x1='1220.59'
								x2='-85.053'
								y1='432.766'
								y2='638.714'
								gradientUnits='userSpaceOnUse'>
								<stop stopColor='#4F46E5' />
								<stop offset={1} stopColor='#80CAFF' />
							</linearGradient>
						</defs>
					</svg>
				</div>
			</section>
			<section className='flex min-h-screen flex-col items-center justify-center relative max-w-2xl mx-auto'>
				<section className='text-center mb-16 relative'>
					<h1 className='text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-l from-neutral-300/50 via-neutral-100 to-neutral-100 tracking-tight mb-4 relative z-10 space-y-2 py-1'>
						<span className='block'>Build Crypto Apps</span>
						<span className='block'>for non-Crypto Users</span>
					</h1>
					<p className='text-base mb-8 relative z-10 text-neutral-300'>
						The simple & secure Next.js boilerplate for crypto founders.
					</p>
					<button
						onClick={toLoginPage}
						className='primarybtn flex w-1/2 mx-auto'>
						Sign in
					</button>
					<span className='mt-2 flex justify-center items-center gap-2'>
						<p className='text-xs text-neutral-300 text-center'>contact:</p>
						<a
							href='https://x.com/nickolas_tazes'
							className='text-xs text-neutral-300 text-center'
							target='_blank'>
							x.com
						</a>
						<span className='text-xs text-neutral-300 text-center'>/</span>
						<a
							href='https://warpcast.com/tazes'
							className='text-xs text-neutral-300 text-center'
							target='_blank'>
							warpcast
						</a>
					</span>
				</section>
				<section className='absolute bottom-10'>
					<div className='justify-center mb-2'>
						<p className='text-xs text-neutral-300 text-center'>
							preview 0.0.1
						</p>
					</div>
					<img
						src='/auth-by-watchen.svg'
						alt='Watchen Auth logo'
						className='w-[125px] h-auto mx-auto'
					/>
				</section>
			</section>
		</main>
	);
}

export const getServerSideProps: GetServerSideProps = async (context) => {
	const session = await getSession(context);

	if (session) {
		return {
			redirect: {
				destination: '/app',
				permanent: false,
			},
		};
	}

	return {
		props: {},
	};
};

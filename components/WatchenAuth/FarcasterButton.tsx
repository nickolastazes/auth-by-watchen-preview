import { useCallback, useEffect, useState } from 'react';
import { useSignIn, StatusAPIResponse, QRCode } from '@farcaster/auth-kit';
import { AuthClientError } from '@farcaster/auth-client';
import { signIn as nextAuthSignIn } from 'next-auth/react';

interface FarcasterButtonProps {
	onSuccess?: (res: StatusAPIResponse) => void;
	onStatusResponse?: (res: StatusAPIResponse) => void;
	onError?: (error?: AuthClientError) => void;
	onSignOut?: () => void;
	timeout?: number;
	interval?: number;
	customButtonStyle?: string;
	hideSignOut?: boolean;
	debug?: boolean;
	callbackUrl?: string;
}

const FarcasterButton = ({
	onStatusResponse,
	onError,
	timeout = 300000,
	interval = 1500,
}: FarcasterButtonProps) => {
	const [isQRModalOpen, setIsQRModalOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const onSuccessCallback = useCallback(
		async (res: StatusAPIResponse) => {
			try {
				setIsQRModalOpen(false);
				setIsLoading(true);
				localStorage.setItem('recent-provider', 'farcaster');

				const result = await nextAuthSignIn('farcaster', {
					message: res.message,
					signature: res.signature,
					name: res.username,
					pfp: res.pfpUrl,
					callbackUrl: '/app',
					redirect: false,
				});

				if (!result || result.error) {
					setIsLoading(false);
					return;
				}

				await new Promise((resolve) => setTimeout(resolve, 500));

				window.location.href = '/app';
			} catch (error) {
				setIsLoading(false);
				onError?.(error as AuthClientError);
			}
		},
		[onError]
	);

	const onStatusCallback = useCallback(
		(res: StatusAPIResponse) => {
			onStatusResponse?.(res);
		},
		[onStatusResponse]
	);

	const onErrorCallback = useCallback(
		(error?: AuthClientError) => {
			onError?.(error);
		},
		[onError]
	);

	const { signIn, connect, reconnect, isError, channelToken, url } = useSignIn({
		timeout,
		interval,
		onSuccess: onSuccessCallback,
		onStatusResponse: onStatusCallback,
		onError: onErrorCallback,
	});

	const handleSignIn = useCallback(() => {
		if (isError) {
			reconnect();
		}
		signIn();
		setIsQRModalOpen(true);
	}, [isError, reconnect, signIn]);

	useEffect(() => {
		if (!channelToken) {
			connect();
		}
	}, [channelToken, connect]);

	return (
		<div className='fc-custom-signin'>
			<div className='flex flex-col items-center'>
				<button
					onClick={handleSignIn}
					disabled={!url || isLoading}
					className={`w-full focus-within:z-10 font-medium bg-gradient-to-b from-[#ffffff] via-[#fdfdfd] to-[#f3f3f3] border border-[#4B5563]/25 shadow-sm items-center rounded-xl focus:ring-1 focus:ring-inset focus:ring-blue-400 flex py-2.5 px-3 ${
						isLoading ? 'opacity-75 cursor-not-allowed' : ''
					}`}>
					{isLoading ? (
						<svg
							className='animate-spin h-5 w-5 text-neutral-900'
							xmlns='http://www.w3.org/2000/svg'
							fill='none'
							viewBox='0 0 24 24'>
							<circle
								className='opacity-25'
								cx='12'
								cy='12'
								r='10'
								stroke='currentColor'
								strokeWidth='4'></circle>
							<path
								className='opacity-75'
								fill='currentColor'
								d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
						</svg>
					) : (
						<img
							src='/signinlogos/farcaster.svg'
							alt='Farcaster logo'
							className='w-6 h-6'
						/>
					)}
					<span className='text-neutral-900 text-sm pl-2.5'>
						{!url
							? 'Initializing...'
							: isLoading
							? 'Signing in with Farcaster...'
							: 'Farcaster'}
					</span>
				</button>

				{url && isQRModalOpen && (
					<>
						<div
							className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50'
							style={{
								WebkitBackdropFilter: 'blur(4px)',
							}}
							onClick={() => setIsQRModalOpen(false)}
						/>
						<div className='fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[300px] z-50 rounded-xl bg-[#1a1a1a] border border-[#4B5563]/40 p-5 shadow-lg focus:outline-none'>
							<div className='flex justify-between items-center mb-6'>
								<h3 className='text-neutral-100 text-lg font-semibold tracking-tight'>
									Scan QR Code
								</h3>
								<button
									onClick={() => setIsQRModalOpen(false)}
									className='text-neutral-300 bg-white/10 rounded-full p-1'>
									<svg
										xmlns='http://www.w3.org/2000/svg'
										width='14'
										height='14'
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth='2'
										strokeLinecap='round'
										strokeLinejoin='round'
										className='rotate-90'>
										<path d='M18 6 6 18' />
										<path d='m6 6 12 12' />
									</svg>
								</button>
							</div>
							<div className='flex justify-center items-center'>
								<span className='bg-white p-2 rounded-lg'>
									<QRCode uri={url} />
								</span>
							</div>
							<a
								href={url}
								target='_blank'
								rel='noopener noreferrer'
								className='w-full'>
								<div className='flex justify-center items-center gap-2 mt-6'>
									<svg
										xmlns='http://www.w3.org/2000/svg'
										width='16'
										height='16'
										viewBox='0 0 24 24'
										fill='none'
										stroke='#f5f5f5'
										strokeWidth='2'
										strokeLinecap='round'
										strokeLinejoin='round'>
										<rect width='14' height='20' x='5' y='2' rx='2' ry='2' />
										<path d='M12 18h.01' />
									</svg>
									<span className='text-sm font-medium space-x-2 text-neutral-100'>
										I'm using my phone
									</span>
									<svg
										xmlns='http://www.w3.org/2000/svg'
										width='16'
										height='16'
										viewBox='0 0 24 24'
										fill='none'
										stroke='#f5f5f5'
										strokeWidth='1.5'
										strokeLinecap='round'
										strokeLinejoin='round'>
										<path d='M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6' />
										<path d='m21 3-9 9' />
										<path d='M15 3h6v6' />
									</svg>
								</div>
							</a>
							{isError && (
								<div className='mt-4 mx-auto text-red-600 text-sm'>
									{'An error occurred'}
								</div>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default FarcasterButton;

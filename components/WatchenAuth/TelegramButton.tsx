import { useCallback, useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';

interface TelegramUser {
	id: number;
	first_name: string;
	last_name?: string;
	username: string;
	photo_url?: string;
	auth_date: number;
	hash: string;
}

interface TelegramButtonProps {
	botUsername: string;
	buttonSize?: 'large' | 'medium' | 'small';
	cornerRadius?: number;
	showAvatar?: boolean;
	lang?: string;
	className?: string;
}

declare global {
	interface Window {
		Telegram?: {
			Login: {
				auth: (
					config: {
						bot_id: string;
						request_access?: boolean;
					},
					callback: (user: TelegramUser) => void
				) => void;
			};
		};
	}
}

export default function TelegramButton({ className }: TelegramButtonProps) {
	const [isLoading, setIsLoading] = useState(false);

	const handleTelegramResponse = useCallback(async (user: TelegramUser) => {
		if (!user?.id || !user?.hash) {
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		localStorage.setItem('recent-provider', 'telegram');

		const params = {
			id: user.id.toString(),
			first_name: user.first_name,
			last_name: user.last_name,
			username: user.username,
			photo_url: user.photo_url,
			auth_date: user.auth_date.toString(),
			hash: user.hash,
		};

		await signIn('telegram', {
			...params,
			redirect: true,
			callbackUrl: '/app',
		});
	}, []);

	useEffect(() => {
		const script = document.createElement('script');
		script.src = 'https://telegram.org/js/telegram-widget.js?22';
		script.async = true;
		document.body.appendChild(script);

		return () => {
			document.body.removeChild(script);
		};
	}, []);

	const handleClick = useCallback(() => {
		if (!window.Telegram?.Login) {
			return;
		}

		window.Telegram.Login.auth(
			{
				bot_id: process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN as string,
				request_access: true,
			},
			handleTelegramResponse
		);
	}, [handleTelegramResponse]);

	return (
		<button
			onClick={handleClick}
			disabled={isLoading}
			type='button'
			className={`w-full focus-within:z-10 font-medium bg-linear-to-b from-[#ffffff] via-[#fdfdfd] to-[#f3f3f3] border border-[#4B5563]/25 shadow-sm items-center rounded-xl focus:ring-1 focus:ring-inset focus:ring-blue-400 flex py-2.5 px-3 ${
				isLoading ? 'opacity-75 cursor-not-allowed' : ''
			} ${className}`}
			aria-label='Sign in with Telegram'>
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
					src='/signinlogos/telegram.svg'
					alt='Telegram logo'
					className='w-6 h-6'
					width={24}
					height={24}
				/>
			)}
			<span className='text-neutral-900 text-sm pl-2.5'>
				{isLoading ? 'Signing in with Telegram...' : 'Telegram'}
			</span>
		</button>
	);
}

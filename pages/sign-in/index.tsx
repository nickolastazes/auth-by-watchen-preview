import { Suspense } from 'react';
import WatchenAuth from '../../components/WatchenAuth/WatchenAuth';
import { Toaster } from 'sonner';

function Login() {
	return (
		<Suspense fallback={<div className='text-white'>Loading...</div>}>
			<Toaster />
			{/* By default, the WatchenAuth component will show all available providers. You can change which providers are shown by changing the providers prop. Use any image you want for the logo. */}
			<WatchenAuth
				providers={[
					'google',
					'x',
					'discord',
					'farcaster',
					'telegram',
					'wallet',
				]}
				img='/signinlogos/auth-by-watchen-black.svg'
			/>
		</Suspense>
	);
}

export default Login;

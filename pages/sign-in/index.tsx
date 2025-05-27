import { Suspense } from 'react';
import WatchenAuth from '../../components/WatchenAuth/WatchenAuth';
import { Toaster } from 'sonner';

function Login() {
	return (
		<Suspense fallback={<div className='text-white'>Loading...</div>}>
			<Toaster />
			<WatchenAuth />
		</Suspense>
	);
}

export default Login;

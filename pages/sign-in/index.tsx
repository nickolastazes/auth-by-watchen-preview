import { Suspense } from 'react';
import MainLogin from '../../components/WatchenAuth/MainLogin';
import { Toaster } from 'sonner';

function Login() {
	return (
		<Suspense fallback={<div className='text-white'>Loading...</div>}>
			<Toaster />
			<MainLogin />
		</Suspense>
	);
}

export default Login;

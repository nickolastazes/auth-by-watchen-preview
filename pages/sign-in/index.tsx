import { Suspense } from 'react';
import MainLogin from '../../components/WatchenAuth/MainLogin';

function Login() {
	return (
		<Suspense fallback={<div className='text-white'>Loading...</div>}>
			<MainLogin />
		</Suspense>
	);
}

export default Login;

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
	const token = await getToken({
		req: request,
		secret: process.env.NEXTAUTH_SECRET,
	});
	const { pathname } = request.nextUrl;

	// Special handling for NextAuth route
	if (pathname.startsWith('/api/auth')) {
		// Ensure HTTPS for NextAuth route in production
		if (
			(process.env.NODE_ENV as string) === 'production' &&
			request.headers.get('x-forwarded-proto') !== 'https'
		) {
			return new NextResponse(JSON.stringify({ error: 'SSL required' }), {
				status: 403,
				headers: { 'Content-Type': 'application/json' },
			});
		}
		// Allow the request to proceed
		return NextResponse.next();
	}

	// Protect other API routes
	if (pathname.startsWith('/api/')) {
		if (!token) {
			return new NextResponse(
				JSON.stringify({ error: 'Authentication required' }),
				{ status: 401, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Ensure HTTPS for API routes in production
		if (
			process.env.NODE_ENV === 'production' &&
			request.headers.get('x-forwarded-proto') !== 'https'
		) {
			return new NextResponse(JSON.stringify({ error: 'SSL required' }), {
				status: 403,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	}

	// Protect app routes
	if (pathname.startsWith('/app') && !token) {
		return NextResponse.redirect(new URL('/', request.url));
	}

	// Redirect authenticated users from login page
	if ((pathname === '/' || pathname === '/sign-in') && token) {
		return NextResponse.redirect(new URL('/app', request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		// Protect API routes
		'/api/:path*',
		// All other routes except Next.js system files
		'/((?!_next/static|_next/image|favicon.ico).*)',
	],
};

import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
	interface User {
		username?: string;
	}
	interface Session {
		user: {
			id: string;
			name?: string;
			username?: string;
			provider?: string;
			ethereumAddress?: string;
			authToken?: string;
		} & DefaultSession['user'];
	}
}

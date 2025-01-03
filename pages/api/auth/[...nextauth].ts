import { IncomingMessage } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import TwitterProvider from 'next-auth/providers/twitter';
import GoogleProvider from 'next-auth/providers/google';
import DiscordProvider from 'next-auth/providers/discord';
import { SiweMessage } from 'siwe';

import crypto from 'crypto';

const scopes = ['identify', 'email'].join(' ');

function generateAuthToken(): string {
	return crypto.randomBytes(32).toString('hex');
}

function transformPhotoUrl(photoUrl: string | undefined) {
	if (!photoUrl) return null;
	const encodedUrl = encodeURIComponent(photoUrl);
	return `/api/proxy/telegram-image?url=${encodedUrl}`;
}

export function getAuthOptions(req: IncomingMessage): NextAuthOptions {
	const providers = [
		CredentialsProvider({
			id: 'external-wallet',
			name: 'Ethereum',
			credentials: {
				message: {
					label: 'Message',
					type: 'text',
					placeholder: '0x0',
				},
				signature: {
					label: 'Signature',
					type: 'text',
					placeholder: '0x0',
				},
				nonce: {
					label: 'Nonce',
					type: 'text',
					placeholder: '0x0',
				},
			},
			async authorize(credentials) {
				try {
					const siwe = new SiweMessage(
						JSON.parse(credentials?.message || '{}')
					);
					const nextAuthUrl = new URL(process.env.NEXTAUTH_URL as string);

					const result = await siwe.verify({
						signature: credentials?.signature || '',
						domain: nextAuthUrl.host,
						nonce: credentials?.nonce,
					});

					if (result.success) {
						return {
							id: siwe.address,
						};
					}
					return null;
				} catch (e) {
					return null;
				}
			},
		}),
		CredentialsProvider({
			id: 'farcaster',
			name: 'Farcaster',
			credentials: {
				message: { type: 'text' },
				signature: { type: 'text' },
				name: { type: 'text' },
				displayName: { type: 'text' },
				pfp: { type: 'text' },
			},
			async authorize(credentials) {
				if (!credentials?.signature || !credentials?.message) {
					return null;
				}

				return {
					id: credentials.name,
					name: credentials.name,
					username: credentials.displayName,
					image: credentials.pfp,
				};
			},
		}),
		TwitterProvider({
			clientId: process.env.TWITTER_CLIENT_ID as string,
			clientSecret: process.env.TWITTER_CLIENT_SECRET as string,
			version: '2.0',
			authorization: {
				url: 'https://x.com/i/oauth2/authorize',
				params: {
					scope: 'users.read tweet.read offline.access',
				},
			},
			token: 'https://api.x.com/2/oauth2/token',
			userinfo: {
				url: 'https://api.twitter.com/2/users/me',
				params: {
					'user.fields':
						'created_at,description,id,name,profile_image_url,username,verified',
				},
			},
			profile(profile: any) {
				return {
					id: profile.data.id,
					name: profile.data.name,
					image: profile.data.profile_image_url,
					username: profile.data.username,
				};
			},
		}),
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		}),
		DiscordProvider({
			clientId: process.env.DISCORD_CLIENT_ID as string,
			clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
			authorization: { params: { scope: scopes } },
			profile(profile) {
				if (profile.avatar === null) {
					const defaultAvatarNumber = parseInt(profile.discriminator) % 5;
					profile.image_url = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
				} else {
					const format = profile.avatar.startsWith('a_') ? 'gif' : 'png';
					profile.image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
				}
				return {
					id: profile.id,
					name: profile.global_name || profile.username,
					username: profile.username,
					image: profile.image_url,
					email: profile.email,
				};
			},
		}),
		CredentialsProvider({
			id: 'telegram',
			name: 'Telegram',
			credentials: {
				id: { type: 'text' },
				first_name: { type: 'text' },
				last_name: { type: 'text' },
				username: { type: 'text' },
				photo_url: { type: 'text' },
				auth_date: { type: 'text' },
				hash: { type: 'text' },
			},
			async authorize(credentials) {
				if (!credentials) return null;

				try {
					const fullName = [credentials.first_name, credentials.last_name]
						.filter(Boolean)
						.join(' ');

					return {
						id: credentials.id,
						name: fullName,
						username: credentials.username,
						image: transformPhotoUrl(credentials.photo_url),
					};
				} catch (error) {
					return null;
				}
			},
		}),
	];

	return {
		providers,
		callbacks: {
			async jwt({ token, user, account, profile }) {
				if (user) {
					token.id = user.id;
					token.username = user.username || (profile as any)?.username;
					token.name = user.name;
					token.email = user.email;
					token.provider = account?.provider;
					token.authToken = generateAuthToken();
				}
				return token;
			},
			async session({ session, token }) {
				if (session.user) {
					session.user.id = token.id as string;
					session.user.username = token.username as string;
					session.user.name = token.name as string;
					session.user.provider = token.provider as string;
					session.user.authToken = token.authToken as string;

					try {
						const username_email =
							session.user.email || session.user.username || session.user.name;
						const res = await fetch(
							`${process.env.NEXTAUTH_URL}/api/user/check`,
							{
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({
									username_email,
									provider: session.user.provider,
								}),
							}
						);

						const data = await res.json();
						if (data.address) {
							session.user.ethereumAddress = data.address;
						}
					} catch (error) {
						session.user.ethereumAddress = undefined;
						return {
							...session,
							error:
								'Failed to load wallet address. Please try signing in again.',
						};
					}
				}
				return session;
			},
		},
		events: {
			async signIn({ user, account, profile }) {
				try {
					const username_email =
						user.email || user.username || profile?.name || user.id;

					const res = await fetch(
						`${process.env.NEXTAUTH_URL}/api/user/create`,
						{
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								username_email,
								userId: user.id,
								provider: account?.provider,
							}),
						}
					);

					const data = await res.json();
				} catch (error) {
					throw new Error('Failed to create user account. Please try again.');
				}
			},
		},
		secret: process.env.NEXTAUTH_SECRET!,
		session: {
			strategy: 'jwt',
			maxAge: 180 * 24 * 60 * 60, // 180 days
		},
		pages: {
			signIn: '/sign-in',
			signOut: '/',
			error: '/sign-in?error',
			newUser: '/app',
		},
	};
}

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
	const authOptions = getAuthOptions(req);
	if (!Array.isArray(req.query.nextauth)) {
		res.status(400).send('Bad request');
		return;
	}
	return await NextAuth(req, res, authOptions);
}

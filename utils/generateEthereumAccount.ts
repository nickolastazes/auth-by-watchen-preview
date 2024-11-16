import { ethers } from 'ethers';
import crypto from 'crypto';

const encryptionKey = process.env.ENCRYPTION_KEY as string;

export function generateEthereumAccount() {
	const wallet = ethers.Wallet.createRandom();
	return {
		address: wallet.address,
		privateKey: wallet.privateKey,
	};
}

function deriveUserKey(userId: string, salt: string): Buffer {
	return crypto.pbkdf2Sync(userId, salt, 310000, 32, 'sha512');
}

function combineKeys(encryptionKey: string, userKey: Buffer): Buffer {
	return Buffer.from(
		crypto.hkdfSync(
			'sha512',
			Buffer.from(encryptionKey, 'hex'),
			userKey,
			'EncryptionKey',
			32
		)
	);
}

export function encryptPrivateKey(
	privateKey: string,
	userId: string
): { encryptedKey: string; iv: string; salt: string } {
	const salt = crypto.randomBytes(16).toString('hex');
	const userKey = deriveUserKey(userId, salt);
	const combinedKey = combineKeys(encryptionKey, userKey);

	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv('aes-256-gcm', combinedKey, iv);

	const encryptedBuffer = Buffer.concat([
		cipher.update(Buffer.from(privateKey, 'utf8')),
		cipher.final(),
		cipher.getAuthTag(),
	]);

	return {
		encryptedKey: encryptedBuffer.toString('base64'),
		iv: iv.toString('base64'),
		salt: salt,
	};
}

export function decryptPrivateKey(
	encryptedKey: string,
	iv: string,
	userId: string,
	salt: string
): string {
	const userKey = deriveUserKey(userId, salt);

	if (!encryptionKey) {
		throw new Error('ENCRYPTION_KEY is not set in environment variables');
	}

	const combinedKey = combineKeys(encryptionKey, userKey);
	const decipher = crypto.createDecipheriv(
		'aes-256-gcm',
		combinedKey,
		Buffer.from(iv, 'base64')
	);

	try {
		const encryptedBuffer = Buffer.from(encryptedKey, 'base64');
		const authTag = encryptedBuffer.slice(-16);
		const encryptedContent = encryptedBuffer.slice(0, -16);

		decipher.setAuthTag(authTag);
		const decrypted = Buffer.concat([
			decipher.update(encryptedContent),
			decipher.final(),
		]);

		return decrypted.toString('utf8');
	} catch (error) {
		throw new Error('Failed to decrypt private key');
	}
}

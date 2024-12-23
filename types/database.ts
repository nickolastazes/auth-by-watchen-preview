import { ObjectId } from 'mongodb';

/**
 * Database types for MongoDB collections
 * User interface defines the schema for user documents including their encrypted wallet data
 * DatabaseCollections maps collection names to their document types
 */

export interface User {
	_id?: ObjectId;
	provider: string;
	username_email: string;
	address: string;
	encrypted_private_key: string | null;
	iv: string | null;
	salt: string | null;
	export_account: boolean;
	created_at: Date;
}

export interface DatabaseCollections {
	users: User;
}

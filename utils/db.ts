import { MongoClient, Db } from 'mongodb';
import { DatabaseCollections, User } from '../types/database';

const uri = process.env.MONGODB_URI as string;
const options = {};

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
	try {
		if (cachedClient && cachedDb) {
			return { client: cachedClient, db: cachedDb };
		}

		const client = await MongoClient.connect(uri, options);
		const db = client.db(process.env.MONGODB_DB);

		cachedClient = client;
		cachedDb = db;
		return { client, db };
	} catch (error) {
		throw error;
	}
}

export async function getCollection<T extends keyof DatabaseCollections>(
	collectionName: T
) {
	const { db } = await connectToDatabase();
	return db.collection<DatabaseCollections[T]>(collectionName);
}

export async function getUserWithFilters(filter: Partial<User>) {
	const { db } = await connectToDatabase();
	return db
		.collection<User>('users')
		.aggregate([
			// Match basic filters
			{ $match: filter },
			// Remove sensitive fields
			{
				$project: {
					encrypted_private_key: 0,
					iv: 0,
					salt: 0,
					email_encrypted: 0,
					metadata_encrypted: 0,
				},
			},
		])
		.toArray();
}

// Cleanup on app termination
process.on('SIGTERM', async () => {
	if (cachedClient) {
		await cachedClient.close();
		cachedClient = null;
		cachedDb = null;
	}
});

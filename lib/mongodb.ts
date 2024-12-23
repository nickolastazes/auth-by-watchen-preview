import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI as string;
const options = {};

const client = new MongoClient(uri, options);

const mongoClient = client.connect();

export default mongoClient;

/**
 * MongoDB Client for NoSQL Database Support
 * This provides a connection to MongoDB for document-based data storage
 * alongside the SQL database managed by Prisma
 */

// Note: Install mongodb package: pnpm add mongodb
// Uncomment when mongodb is installed:

/*
import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

const globalWithMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

if (process.env.NODE_ENV === "development") {
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getMongoDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db();
}
*/

// Temporary export for build to pass
export const getMongoDb = async () => {
  throw new Error("MongoDB not configured. Install mongodb package and configure MONGODB_URI");
};

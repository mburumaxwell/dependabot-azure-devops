import { UsageTelemetryRequestDataSchema } from '@paklo/core/usage';
import { type Document, MongoClient } from 'mongodb';
import { z } from 'zod';
import { RegionCodeSchema } from './regions';

const url = process.env.MONGO_DATABASE_URL!;
const client = new MongoClient(url);

let connected = false;
export async function getMongoClient() {
  if (!connected) {
    await client.connect();
    connected = true;
  }
  return client;
}

export async function closeMongoClient() {
  if (connected) {
    await client.close();
    connected = false;
  }
}

type EnsureDocumentMap<T extends Record<string, Document>> = T;
type Collections = EnsureDocumentMap<{
  usage_telemetry: UsageTelemetry;
  // add future collections here
}>;

export async function getMongoCollection<K extends keyof Collections>(name: K, dbName?: string) {
  const client = await getMongoClient();
  const db = client.db(dbName);
  return db.collection<Collections[K]>(name);
}

// const collection = await getCollection();
// await collection.createIndex({ trigger: 1 }, {})
// await collection.createIndex({ owner: 1 }, {})
// await collection.createIndex({ packageManager: 1 }, {})
// await collection.createIndex({ started: -1 }, {})
// await collection.createIndex({ duration: 1 }, {})
// await collection.createIndex({ success: 1 }, {})
// await collection.createIndex({ region: 1 }, {})
export const UsageTelemetrySchema = z.object({
  _id: z.string(),
  country: z.string().nullish(),
  region: RegionCodeSchema.nullish(),
  ...UsageTelemetryRequestDataSchema.omit({ id: true }).shape,
});
export type UsageTelemetry = z.infer<typeof UsageTelemetrySchema>;

export type { AnyBulkWriteOperation, Filter } from 'mongodb';

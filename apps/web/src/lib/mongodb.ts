import { type Document, MongoClient } from 'mongodb';
import { z } from 'zod';

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

export async function getMongoCollection<K extends keyof Collections>(name: K) {
  const client = await getMongoClient();
  const db = client.db();
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
  region: z.string().nullish(),
  hostPlatform: z.string(),
  hostRelease: z.string(),
  hostArch: z.string(),
  hostMachineHash: z.string(),
  hostDockerContainer: z.boolean().nullish(),
  version: z.string(),
  trigger: z.string(),
  provider: z.string(),
  owner: z.string(),
  project: z.string().nullish(), // TODO: remove nullable after older records are cleared (90 days after 2025-Oct-21 i.e. 2026-Jan-19)
  packageManager: z.string(),
  started: z.coerce.date(),
  duration: z.coerce.number(),
  success: z.coerce.boolean(),
  error: z.object({ message: z.string() }).nullish(),
});
export type UsageTelemetry = z.infer<typeof UsageTelemetrySchema>;

export type { AnyBulkWriteOperation, Filter } from 'mongodb';

import { type Document, MongoClient } from 'mongodb';

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
export type UsageTelemetry = {
  _id: string;
  country: string | null;
  region: string | null;
  hostPlatform: string;
  hostRelease: string;
  hostArch: string;
  hostMachineHash: string;
  hostDockerContainer?: boolean;
  version: string;
  trigger: string;
  provider: string;
  owner: string;
  project: string | null; // TODO: remove nullable after older records are cleared (90 days after 2025-Oct-21 i.e. 2026-Jan-19)
  packageManager: string;
  started: Date;
  duration: number;
  success: boolean;
  error?: { message: string };
};

export type { Filter } from 'mongodb';

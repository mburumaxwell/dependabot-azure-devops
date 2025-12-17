import fs from 'node:fs';
import { finished } from 'node:stream/promises';
import { parse } from 'csv-parse';
import dotenvFlow from 'dotenv-flow';
import { z } from 'zod';
import type { AnyBulkWriteOperation, UsageTelemetry } from '@/lib/mongodb';

dotenvFlow.config();

async function run(signal: AbortSignal) {
  const { getMongoCollection, UsageTelemetrySchema } = await import('@/lib/mongodb'); // ensure mongodb connection is setup
  const refinedSchema = z.object({ id: z.string() }).and(UsageTelemetrySchema.omit({ _id: true }));
  const { create } = await import('@paklo/core/logger');
  const logger = create({ timestamp: true, pretty: { includeLevel: true } });
  const collection = await getMongoCollection('usage_telemetry');

  if (signal.aborted) {
    logger.info('Import aborted before starting');
    return;
  }

  async function saveToDatabase(docs: UsageTelemetry[]) {
    const operations = docs.map(
      (doc): AnyBulkWriteOperation<UsageTelemetry> => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: doc },
          upsert: true,
        },
      }),
    );
    await collection.bulkWrite(operations);
  }

  async function processFile(fp: string) {
    const parser = fs.createReadStream(fp).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
      }),
    );

    let count = 0;
    const documents: UsageTelemetry[] = [];

    parser.on('data', async (record) => {
      if (signal.aborted) {
        parser.destroy();
        return;
      }

      parser.pause();

      count++;
      const { success, data, error } = refinedSchema.safeParse(record);
      if (!success) {
        logger.error('Invalid record:', record, error.format());
        parser.resume();
        return;
      }

      const { id, ...rest } = data;
      documents.push({ _id: id, ...rest });

      if (documents.length >= 2_000) {
        await saveToDatabase(documents);
        logger.debug(`Processed ${count.toLocaleString()} records so far...`);
        documents.splice(0);
      }

      parser.resume();
    });

    parser.on('end', async () => {
      if (documents.length) {
        await saveToDatabase(documents);
        logger.debug(`Processed final batch of ${documents.length.toLocaleString()} records...`);
      }
    });

    await finished(parser);
    logger.info(`Total records processed: ${count.toLocaleString()}`);
  }

  logger.info('Starting import');
  await processFile('/Users/maxwell/Downloads/usage_telemetry.csv');
  logger.info('Finished import');
}

const controller = new AbortController();

process.on('SIGINT', () => controller.abort());
process.on('SIGTERM', () => controller.abort());

run(controller.signal)
  .then(() => process.exit(0))
  .catch((error) => {
    if (error.name === 'AbortError') {
      process.exit(0);
    }
    process.exit(1);
  });

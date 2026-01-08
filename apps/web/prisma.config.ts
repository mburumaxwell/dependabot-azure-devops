import dotenvFlow from 'dotenv-flow';
import { defineConfig, env } from 'prisma/config';

dotenvFlow.config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // seed: `tsx prisma/seed.ts`,
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});

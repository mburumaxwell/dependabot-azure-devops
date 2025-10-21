-- CreateEnum
CREATE TYPE "region_provider" AS ENUM ('vercel');

-- AlterTable
ALTER TABLE "usage_telemetry" ADD COLUMN     "country" VARCHAR(10),
ADD COLUMN     "regionProvider" "region_provider",
ADD COLUMN     "region" VARCHAR(50);

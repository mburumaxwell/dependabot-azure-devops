-- AlterTable
ALTER TABLE "usage_telemetry" DROP COLUMN "regionProvider";

-- DropEnum
DROP TYPE "public"."region_provider";

-- CreateIndex
CREATE INDEX "usage_telemetry_region_idx" ON "usage_telemetry"("region");

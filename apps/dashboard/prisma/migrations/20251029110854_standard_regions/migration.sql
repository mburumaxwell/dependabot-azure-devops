-- AlterTable
ALTER TABLE "usage_telemetry" DROP COLUMN "regionProvider";

-- DropEnum
DROP TYPE "public"."region_provider";

-- CreateIndex
CREATE INDEX "usage_telemetry_region_idx" ON "usage_telemetry"("region");

-- Update regions to standard codes
UPDATE usage_telemetry
SET region = CASE region
    WHEN 'lhr1' THEN 'lhr'
    WHEN 'dub1' THEN 'dub'
    WHEN 'fra1' THEN 'fra'
    WHEN 'cdg1' THEN 'cdg'
    WHEN 'pdx1' THEN 'pdx'
    WHEN 'syd1' THEN 'syd'
    WHEN 'iad1' THEN 'iad'
    WHEN 'sfo1' THEN 'sfo'
    WHEN 'cle1' THEN 'cle'
    WHEN 'arn1' THEN 'arn'
    WHEN 'hkg1' THEN 'hkg'
    WHEN 'gru1' THEN 'gru'
    WHEN 'sin1' THEN 'sin'
    ELSE region  -- Keep unchanged if not in the list
END
WHERE region IN (
    'lhr1', 'dub1', 'fra1', 'cdg1', 'pdx1',
    'syd1', 'iad1', 'sfo1', 'cle1', 'arn1',
    'hkg1', 'gru1', 'sin1'
);

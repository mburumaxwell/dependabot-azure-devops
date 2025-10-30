-- AlterTable
ALTER TABLE "organization" ADD COLUMN     "region" VARCHAR(10) NOT NULL,
ADD COLUMN     "token" VARCHAR(512) NOT NULL,
ADD COLUMN     "type" VARCHAR(20) NOT NULL,
ADD COLUMN     "url" VARCHAR(100) NOT NULL;

-- CreateIndex
CREATE INDEX "organization_type_idx" ON "organization"("type");

-- CreateIndex
CREATE INDEX "organization_region_idx" ON "organization"("region");

-- CreateIndex
CREATE UNIQUE INDEX "organization_url_key" ON "organization"("url");

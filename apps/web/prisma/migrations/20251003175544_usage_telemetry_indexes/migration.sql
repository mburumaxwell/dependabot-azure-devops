-- CreateIndex
CREATE INDEX "usage_telemetry_trigger_idx" ON "public"."usage_telemetry"("trigger");

-- CreateIndex
CREATE INDEX "usage_telemetry_owner_idx" ON "public"."usage_telemetry"("owner");

-- CreateIndex
CREATE INDEX "usage_telemetry_packageManager_idx" ON "public"."usage_telemetry"("packageManager");

-- CreateIndex
CREATE INDEX "usage_telemetry_started_idx" ON "public"."usage_telemetry"("started" DESC);

-- CreateIndex
CREATE INDEX "usage_telemetry_duration_idx" ON "public"."usage_telemetry"("duration");

-- CreateIndex
CREATE INDEX "usage_telemetry_success_idx" ON "public"."usage_telemetry"("success");

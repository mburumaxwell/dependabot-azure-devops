-- CreateEnum
CREATE TYPE "public"."job_trigger" AS ENUM ('user', 'service');

-- CreateEnum
CREATE TYPE "public"."source_provider" AS ENUM ('azure');

-- CreateTable
CREATE TABLE "public"."usage_telemetry" (
    "id" BIGINT NOT NULL,
    "hostPlatform" TEXT NOT NULL,
    "hostRelease" TEXT NOT NULL,
    "hostArch" TEXT NOT NULL,
    "hostMachineHash" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "trigger" "public"."job_trigger" NOT NULL,
    "provider" "public"."source_provider" NOT NULL,
    "owner" TEXT NOT NULL,
    "packageManager" TEXT NOT NULL,
    "started" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,

    CONSTRAINT "usage_telemetry_pkey" PRIMARY KEY ("id")
);

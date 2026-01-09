-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" TEXT,
    "banned" BOOLEAN DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,
    "activeOrganizationId" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "metadata" TEXT,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "providerHostname" TEXT NOT NULL,
    "providerApiEndpoint" TEXT NOT NULL,
    "customerId" TEXT,
    "subscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "billingPeriod" JSONB,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inviterId" TEXT NOT NULL,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passkey" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "publicKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialID" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "deviceType" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL,
    "transports" TEXT,
    "createdAt" TIMESTAMP(3),
    "aaguid" TEXT,

    CONSTRAINT "passkey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "opinion" TEXT,
    "url" TEXT,
    "message" TEXT,
    "metadata" JSONB,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_credential" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tokenSecretUrl" TEXT,
    "webhooksToken" TEXT NOT NULL,
    "githubTokenSecretUrl" TEXT,

    CONSTRAINT "organization_credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_secret" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "secretUrl" TEXT,
    "description" TEXT,

    CONSTRAINT "organization_secret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "permalink" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "synchronizationStatus" TEXT NOT NULL,
    "synchronizedAt" TIMESTAMP(3),

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repository" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "permalink" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "latestCommit" TEXT,
    "configFileContents" TEXT,
    "configPath" TEXT,
    "synchronizationError" TEXT,
    "synchronizationStatus" TEXT NOT NULL,
    "synchronizedAt" TIMESTAMP(3),

    CONSTRAINT "repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repository_update" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "ecosystem" TEXT NOT NULL,
    "directory" TEXT,
    "directories" TEXT[],
    "directoryKey" TEXT NOT NULL,
    "cron" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "nextUpdateJobAt" TIMESTAMP(3) NOT NULL,
    "files" TEXT[],

    CONSTRAINT "repository_update_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repository_pull_request" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "providerId" INTEGER NOT NULL,
    "packageManager" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "repository_pull_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "update_job" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "repositoryUpdateId" TEXT NOT NULL,
    "repositorySlug" TEXT NOT NULL,
    "commit" TEXT NOT NULL,
    "ecosystem" TEXT NOT NULL,
    "packageManager" TEXT NOT NULL,
    "directory" TEXT,
    "directories" TEXT[],
    "directoryKey" TEXT NOT NULL,
    "workflowRunId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "jobConfig" JSONB NOT NULL,
    "credentials" JSONB[],
    "region" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "errors" JSONB[],
    "warnings" JSONB[],
    "affectedPrIds" INTEGER[],

    CONSTRAINT "update_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "update_job_secret" (
    "id" TEXT NOT NULL,
    "jobToken" TEXT NOT NULL,
    "credentialsToken" TEXT NOT NULL,
    "hookToken" TEXT NOT NULL,

    CONSTRAINT "update_job_secret_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "organization_type_idx" ON "organization"("type");

-- CreateIndex
CREATE INDEX "organization_region_idx" ON "organization"("region");

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organization_url_key" ON "organization"("url");

-- CreateIndex
CREATE INDEX "member_organizationId_idx" ON "member"("organizationId");

-- CreateIndex
CREATE INDEX "member_userId_idx" ON "member"("userId");

-- CreateIndex
CREATE INDEX "invitation_organizationId_idx" ON "invitation"("organizationId");

-- CreateIndex
CREATE INDEX "invitation_email_idx" ON "invitation"("email");

-- CreateIndex
CREATE INDEX "passkey_userId_idx" ON "passkey"("userId");

-- CreateIndex
CREATE INDEX "passkey_credentialID_idx" ON "passkey"("credentialID");

-- CreateIndex
CREATE INDEX "organization_secret_organizationId_idx" ON "organization_secret"("organizationId");

-- CreateIndex
CREATE INDEX "organization_secret_name_idx" ON "organization_secret"("name");

-- CreateIndex
CREATE UNIQUE INDEX "organization_secret_organizationId_name_key" ON "organization_secret"("organizationId", "name");

-- CreateIndex
CREATE INDEX "project_organizationId_idx" ON "project"("organizationId");

-- CreateIndex
CREATE INDEX "project_providerId_idx" ON "project"("providerId");

-- CreateIndex
CREATE INDEX "project_organizationId_providerId_idx" ON "project"("organizationId", "providerId");

-- CreateIndex
CREATE INDEX "repository_projectId_idx" ON "repository"("projectId");

-- CreateIndex
CREATE INDEX "repository_providerId_idx" ON "repository"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "repository_projectId_providerId_key" ON "repository"("projectId", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "repository_url_key" ON "repository"("url");

-- CreateIndex
CREATE INDEX "repository_update_repositoryId_idx" ON "repository_update"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "repository_update_repositoryId_ecosystem_directoryKey_key" ON "repository_update"("repositoryId", "ecosystem", "directoryKey");

-- CreateIndex
CREATE INDEX "repository_pull_request_repositoryId_idx" ON "repository_pull_request"("repositoryId");

-- CreateIndex
CREATE INDEX "repository_pull_request_repositoryId_providerId_idx" ON "repository_pull_request"("repositoryId", "providerId");

-- CreateIndex
CREATE INDEX "repository_pull_request_repositoryId_packageManager_status_idx" ON "repository_pull_request"("repositoryId", "packageManager", "status");

-- CreateIndex
CREATE INDEX "update_job_organizationId_idx" ON "update_job"("organizationId");

-- CreateIndex
CREATE INDEX "update_job_projectId_idx" ON "update_job"("projectId");

-- CreateIndex
CREATE INDEX "update_job_repositoryId_idx" ON "update_job"("repositoryId");

-- CreateIndex
CREATE INDEX "update_job_repositoryUpdateId_idx" ON "update_job"("repositoryUpdateId");

-- CreateIndex
CREATE INDEX "update_job_region_idx" ON "update_job"("region");

-- CreateIndex
CREATE UNIQUE INDEX "update_job_packageManager_directoryKey_workflowRunId_key" ON "update_job"("packageManager", "directoryKey", "workflowRunId");

-- CreateIndex
CREATE UNIQUE INDEX "update_job_secret_jobToken_key" ON "update_job_secret"("jobToken");

-- CreateIndex
CREATE UNIQUE INDEX "update_job_secret_credentialsToken_key" ON "update_job_secret"("credentialsToken");

-- CreateIndex
CREATE UNIQUE INDEX "update_job_secret_hookToken_key" ON "update_job_secret"("hookToken");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_credential" ADD CONSTRAINT "organization_credential_id_fkey" FOREIGN KEY ("id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_secret" ADD CONSTRAINT "organization_secret_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository" ADD CONSTRAINT "repository_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_update" ADD CONSTRAINT "repository_update_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_pull_request" ADD CONSTRAINT "repository_pull_request_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "update_job_secret" ADD CONSTRAINT "update_job_secret_id_fkey" FOREIGN KEY ("id") REFERENCES "update_job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

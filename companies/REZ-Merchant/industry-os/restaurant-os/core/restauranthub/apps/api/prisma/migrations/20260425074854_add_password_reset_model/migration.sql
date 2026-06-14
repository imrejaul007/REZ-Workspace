-- AlterTable
ALTER TABLE "public"."OtpCode" ADD CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."Session" ADD COLUMN     "deviceInfo" TEXT,
ADD COLUMN     "lastAccessedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."PasswordReset" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FailedAttempt" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "email" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FailedAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BlockedIp" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "blockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedUntil" TIMESTAMP(3) NOT NULL,
    "blockCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "BlockedIp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "public"."PasswordReset"("token");

-- CreateIndex
CREATE INDEX "PasswordReset_email_idx" ON "public"."PasswordReset"("email");

-- CreateIndex
CREATE INDEX "PasswordReset_token_idx" ON "public"."PasswordReset"("token");

-- CreateIndex
CREATE INDEX "PasswordReset_expiresAt_idx" ON "public"."PasswordReset"("expiresAt");

-- CreateIndex
CREATE INDEX "FailedAttempt_ipAddress_endpoint_attemptedAt_idx" ON "public"."FailedAttempt"("ipAddress", "endpoint", "attemptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedIp_ipAddress_key" ON "public"."BlockedIp"("ipAddress");

-- CreateIndex
CREATE INDEX "BlockedIp_blockedUntil_idx" ON "public"."BlockedIp"("blockedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "public"."ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "public"."ApiKey"("userId");

-- CreateIndex
CREATE INDEX "ApiKey_keyHash_idx" ON "public"."ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "Job_validTill_idx" ON "public"."Job"("validTill");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "public"."Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "Transaction_restaurantId_createdAt_idx" ON "public"."Transaction"("restaurantId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

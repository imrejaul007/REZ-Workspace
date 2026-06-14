-- Add appSource to User to track which app/platform created each account
-- Values: 'restopapa_web' | 'rez_bridge' | 'rez_webhook' | 'admin'
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "appSource" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginApp" TEXT;

-- Back-fill existing REZ-originated users
UPDATE "User" SET "appSource" = 'rez_webhook'
WHERE "rezMerchantId" IS NOT NULL AND "appSource" IS NULL;

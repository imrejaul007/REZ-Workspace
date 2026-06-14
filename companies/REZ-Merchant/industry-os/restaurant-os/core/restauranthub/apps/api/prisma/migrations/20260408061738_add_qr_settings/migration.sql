-- CreateTable
CREATE TABLE "QRSettings" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL DEFAULT 'classic',
    "templateName" TEXT NOT NULL DEFAULT 'Classic',
    "primaryColor" TEXT NOT NULL DEFAULT '#000000',
    "accentColor" TEXT NOT NULL DEFAULT '#1a1a1a',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "restaurantName" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT,
    "borderRadius" INTEGER NOT NULL DEFAULT 8,
    "size" INTEGER NOT NULL DEFAULT 256,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QRSettings_restaurantId_key" ON "QRSettings"("restaurantId");

-- CreateIndex
CREATE INDEX "QRSettings_restaurantId_idx" ON "QRSettings"("restaurantId");

-- CreateIndex
CREATE INDEX "QRSettings_templateId_idx" ON "QRSettings"("templateId");

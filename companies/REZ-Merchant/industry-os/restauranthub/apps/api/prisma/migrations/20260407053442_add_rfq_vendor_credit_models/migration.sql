-- CreateTable
CREATE TABLE "Rfq" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "restauranthubUserId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "deliveryFrequency" TEXT,
    "city" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rfq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorApplication" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "cities" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditApplication" (
    "id" TEXT NOT NULL,
    "rezMerchantId" TEXT NOT NULL,
    "restauranthubUserId" TEXT NOT NULL,
    "requestedAmount" DOUBLE PRECISION NOT NULL,
    "tenor" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "creditScore" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "nbfcPartner" TEXT NOT NULL DEFAULT 'stub',
    "approvedAmount" DOUBLE PRECISION,
    "disbursedAt" TIMESTAMP(3),
    "repayByDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Rfq_merchantId_idx" ON "Rfq"("merchantId");

-- CreateIndex
CREATE INDEX "Rfq_supplierId_idx" ON "Rfq"("supplierId");

-- CreateIndex
CREATE INDEX "Rfq_status_idx" ON "Rfq"("status");

-- CreateIndex
CREATE INDEX "VendorApplication_status_idx" ON "VendorApplication"("status");

-- CreateIndex
CREATE INDEX "VendorApplication_category_idx" ON "VendorApplication"("category");

-- CreateIndex
CREATE INDEX "CreditApplication_rezMerchantId_idx" ON "CreditApplication"("rezMerchantId");

-- CreateIndex
CREATE INDEX "CreditApplication_status_idx" ON "CreditApplication"("status");

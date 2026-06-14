-- Add idempotencyKey column to Order table
ALTER TABLE "public"."Order" ADD COLUMN "idempotencyKey" TEXT;

-- Create index for idempotency lookups
CREATE INDEX "Order_idempotencyKey_idx" ON "public"."Order"("idempotencyKey");

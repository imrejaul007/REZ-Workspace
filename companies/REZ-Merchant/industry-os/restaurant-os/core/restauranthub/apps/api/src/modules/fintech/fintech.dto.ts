/**
 * Fintech module — shared DTOs and types.
 *
 * No raw financial figures are exposed in API responses; only aggregated
 * scores, tiers, and eligibility flags are returned to callers.
 */

import { IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

// Local type definitions (originally from @restopapa/rez-client which is not published)
export type CreditTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
export type CreditFactor = {
  name: string;
  score: number;
  impact: 'positive' | 'negative' | 'neutral';
  description?: string;
};

// ── Credit profile (read) ─────────────────────────────────────────────────────

export interface CreditProfile {
  merchantId: string;
  score: number;
  tier: CreditTier;
  maxCreditLine: number;
  recommendedTenor: number;
  eligibleForSupplierTerms: boolean;
  factors: CreditFactor[];
  computedAt: string;
  dataMonthsAvailable: number;
  walletBalance: number;
}

export interface IneligibleProfile {
  ineligible: true;
  reason: string;
  dataMonthsAvailable: number;
}

// ── Application (write) ───────────────────────────────────────────────────────

export class CreditApplicationDto {
  @IsNumber()
  @Min(1000)
  @Max(200_000)
  requestedAmount!: number;

  @IsIn([15, 30, 45])
  tenor!: 15 | 30 | 45;

  @IsIn(['supplier_payment', 'working_capital'])
  purpose!: 'supplier_payment' | 'working_capital';

  @IsOptional()
  @IsString()
  gstin?: string;
}

// ── Application result ────────────────────────────────────────────────────────

export interface CreditApplicationResult {
  applicationId: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'disbursed' | 'closed';
  approvedAmount?: number;
  rejectionReason?: string;
  tenor: number;
  purpose: string;
  createdAt: string;
}

// ── Credit history ────────────────────────────────────────────────────────────

export interface CreditTransaction {
  id: string;
  type: 'credit';
  amount: number;
  currency: string;
  status: string;
  description?: string;
  reference?: string;
  createdAt: string;
}

// ── Supplier payment ──────────────────────────────────────────────────────────

export class SupplierPaymentDto {
  @IsString()
  supplierId!: string;

  @IsNumber()
  @Min(100)
  @Max(200_000)
  amount!: number;

  @IsOptional()
  @IsString()
  invoiceRef?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export interface SupplierPaymentResult {
  paymentId: string;
  supplierId: string;
  amount: number;
  status: 'initiated' | 'completed' | 'failed';
  processedAt: string;
}

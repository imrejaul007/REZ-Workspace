/**
 * Merchant Loans Connector - DTOs and Validation Schemas
 *
 * POS-Data connector that feeds financial data to the Merchant Loans service
 * for credit scoring (RidZa Financial Ecosystem).
 *
 * Port Range: 4900-4999 (RidZa/RidZa/RidZa Finance)
 */

import { z, ZodSchema } from 'zod';

// =============================================================================
// Core Data Models
// =============================================================================

/** Peak hour revenue data */
export interface PeakHourData {
  hour: number;
  revenue: number;
}

/** Popular item performance data */
export interface PopularItemData {
  itemId: string;
  itemName?: string;
  quantity: number;
  revenue: number;
}

/** Financial metrics for the analysis period */
export interface FinancialMetrics {
  totalRevenue: number;
  avgDailyRevenue: number;
  transactionCount: number;
  avgOrderValue: number;
  peakHours: PeakHourData[];
  popularItems: PopularItemData[];
  customerRetention: number;
  seasonalityScore: number;
}

/** Risk indicators derived from financial analysis */
export interface RiskIndicators {
  revenueVolatility: number; // 0-100, higher = more volatile
  weekendVsWeekday: number; // Ratio: >1 = more weekend revenue
  peakSeasonality: string; // e.g., "december", "summer"
  lowStockFrequency: number; // Percentage of days with low stock alerts
}

/** Complete financial profile for a merchant */
export interface MerchantFinancialProfile {
  merchantId: string;
  period: { start: Date; end: Date };
  metrics: FinancialMetrics;
  riskIndicators: RiskIndicators;
  creditScore: number; // 300-850 range
}

/** Loan application data */
export interface LoanApplicationData {
  merchantId: string;
  businessType: string;
  yearsInOperation: number;
  monthlyRevenue: number;
  requestedAmount: number;
  purpose: string;
}

/** Credit score factors breakdown */
export interface CreditScoreFactor {
  name: string;
  score: number;
  weight: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

/** Loan recommendation based on merchant profile */
export interface LoanRecommendation {
  merchantId: string;
  maxEligibleAmount: number;
  recommendedAmount: number;
  suggestedTenorMonths: number;
  interestRate: number; // Annual percentage rate
  monthlyEmi: number;
  approvalProbability: number; // 0-100%
  riskCategory: 'low' | 'medium' | 'high';
  reasons: string[];
  warnings?: string[];
}

/** Revenue forecast for repayment capacity */
export interface RevenueForecast {
  merchantId: string;
  period: { start: Date; end: Date };
  predictions: Array<{
    month: string;
    predictedRevenue: number;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  avgMonthlyRevenue: number;
  volatilityIndex: number;
  repaymentCapacity: number; // Suggested EMI capacity
}

/** Financial report for loan application export */
export interface FinancialReport {
  merchantId: string;
  generatedAt: Date;
  period: { start: Date; end: Date };
  businessInfo: {
    businessType: string;
    yearsInOperation: number;
    monthlyRevenue: number;
  };
  financialSummary: FinancialMetrics;
  riskProfile: RiskIndicators;
  creditAssessment: {
    score: number;
    tier: 'poor' | 'fair' | 'good' | 'very_good' | 'excellent';
    factors: CreditScoreFactor[];
  };
  loanEligibility: {
    eligible: boolean;
    maxAmount: number;
    recommendedTenor: number;
  };
}

// =============================================================================
// Zod Validation Schemas
// =============================================================================

/** Schema for generating financial profile request */
export const GenerateProfileSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  period: z.object({
    start: z.coerce.date(),
    end: z.coerce.date(),
  }),
});

/** Schema for credit score calculation request */
export const CreditScoreRequestSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  period: z
    .object({
      start: z.coerce.date(),
      end: z.coerce.date(),
    })
    .optional(),
});

/** Schema for loan recommendation request */
export const LoanRecommendationSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  requestedAmount: z.number().positive('Requested amount must be positive'),
  purpose: z.enum([
    'inventory_purchase',
    'equipment_upgrade',
    'expansion',
    'working_capital',
    'marketing',
    'renovation',
    'other',
  ]),
  preferredTenor: z.number().int().min(3).max(60).optional(),
});

/** Schema for revenue forecast request */
export const ForecastSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  months: z.number().int().min(1).max(12).default(6),
});

/** Schema for financial report export request */
export const FinancialReportSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  format: z.enum(['json', 'pdf', 'csv']).default('json'),
  period: z
    .object({
      start: z.coerce.date(),
      end: z.coerce.date(),
    })
    .optional(),
});

/** Schema for loan application submission */
export const LoanApplicationSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  businessType: z.string().min(1, 'Business type is required'),
  yearsInOperation: z.number().int().min(0).max(100),
  monthlyRevenue: z.number().positive('Monthly revenue must be positive'),
  requestedAmount: z.number().positive('Requested amount must be positive'),
  purpose: z.string().min(1, 'Purpose is required'),
});

// =============================================================================
// Type exports from Zod schemas
// =============================================================================

export type GenerateProfileInput = z.infer<typeof GenerateProfileSchema>;
export type CreditScoreRequestInput = z.infer<typeof CreditScoreRequestSchema>;
export type LoanRecommendationInput = z.infer<typeof LoanRecommendationSchema>;
export type ForecastInput = z.infer<typeof ForecastSchema>;
export type FinancialReportInput = z.infer<typeof FinancialReportSchema>;
export type LoanApplicationInput = z.infer<typeof LoanApplicationSchema>;

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ProfileResponse extends ApiResponse<MerchantFinancialProfile> {}
export interface CreditScoreResponse extends ApiResponse<{
  merchantId: string;
  score: number;
  tier: 'poor' | 'fair' | 'good' | 'very_good' | 'excellent';
  factors: CreditScoreFactor[];
}> {}
export interface RecommendationResponse extends ApiResponse<LoanRecommendation> {}
export interface ForecastResponse extends ApiResponse<RevenueForecast> {}
export interface ReportResponse extends ApiResponse<FinancialReport | string> {} // string for file path/URL

/**
 * CreditScoreCalculator — derives a merchant credit score from REZ operational data.
 *
 * Scoring weights:
 *   30% Revenue stability  (coefficient of variation — lower CV = better)
 *   25% Payment regularity (0-1 fraction paid on time)
 *   20% Dispute rate       (<1% excellent, >5% disqualifying)
 *   15% Account age        (months on REZ platform)
 *   10% Order frequency    (supplier purchase orders per month)
 *
 * Minimum 3 months of revenue history is required before a score can be issued.
 * No raw financial data is returned — only the computed score, tier, and factors.
 */

export interface CreditScoreInput {
  merchantId: string;
  /** last 12 months of revenue, most-recent last (from analytics-events) */
  monthlyRevenueHistory: number[];
  /** 0-1 fraction of bills paid on time (from payment-service records) */
  paymentRegularity: number;
  /** supplier purchase orders placed per month (from merchant-service) */
  supplierOrderFrequency: number;
  /** disputes / total orders, expressed as a fraction (from merchant-service) */
  disputeRate: number;
  /** months the merchant has been active on the REZ platform */
  accountAgeMonths: number;
  /** current REZ wallet balance in INR (from wallet-service) */
  walletBalance: number;
}

export type CreditTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface CreditFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface CreditScore {
  score: number;
  tier: CreditTier;
  /** maximum credit line in INR */
  maxCreditLine: number;
  /** recommended payment tenor in days (15, 30, or 45) */
  recommendedTenor: number;
  eligibleForSupplierTerms: boolean;
  factors: CreditFactor[];
  computedAt: string;
  dataMonthsAvailable: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CREDIT_LINES: Record<CreditTier, number> = {
  bronze: 0,
  silver: 25_000,
  gold: 75_000,
  platinum: 200_000,
};

const TENORS: Record<CreditTier, number> = {
  bronze: 15,
  silver: 15,
  gold: 30,
  platinum: 45,
};

const MIN_MONTHS_REQUIRED = 3;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Population standard deviation */
function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/** Coefficient of variation (stddev / mean), clamped to [0, 1] */
function coefficientOfVariation(values: number[]): number {
  if (values.length === 0) return 1;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 1;
  return Math.min(stdDev(values) / mean, 1);
}

function tierFromScore(score: number): CreditTier {
  if (score >= 81) return 'platinum';
  if (score >= 61) return 'gold';
  if (score >= 41) return 'silver';
  return 'bronze';
}

// ── Scoring sub-functions (each returns 0-100) ────────────────────────────────

function scoreRevenue(history: number[]): { value: number; factor: CreditFactor } {
  const cv = coefficientOfVariation(history);
  // CV = 0 (perfectly stable) → 100; CV = 1 (very volatile) → 0
  const value = Math.round((1 - cv) * 100);

  const mean = history.reduce((a, b) => a + b, 0) / history.length;
  const impact = value >= 70 ? 'positive' : value >= 40 ? 'neutral' : 'negative';
  return {
    value,
    factor: {
      factor: 'Revenue Stability',
      impact,
      description:
        value >= 70
          ? `Consistent monthly revenue (avg ₹${Math.round(mean).toLocaleString('en-IN')})`
          : value >= 40
          ? 'Moderate revenue fluctuations detected'
          : 'High revenue volatility is reducing your score',
    },
  };
}

function scorePaymentRegularity(regularity: number): { value: number; factor: CreditFactor } {
  const value = Math.round(Math.min(Math.max(regularity, 0), 1) * 100);
  const impact = value >= 80 ? 'positive' : value >= 60 ? 'neutral' : 'negative';
  return {
    value,
    factor: {
      factor: 'Payment Regularity',
      impact,
      description:
        value >= 80
          ? `${value}% of payments made on time`
          : value >= 60
          ? `${value}% on-time payment rate — room for improvement`
          : `${value}% on-time payment rate is hurting your score`,
    },
  };
}

function scoreDisputeRate(rate: number): { value: number; factor: CreditFactor } {
  let value: number;
  let description: string;
  let impact: CreditFactor['impact'];

  if (rate < 0.01) {
    value = 100;
    impact = 'positive';
    description = 'Excellent dispute record — less than 1% of orders disputed';
  } else if (rate <= 0.03) {
    value = 70;
    impact = 'neutral';
    description = `${(rate * 100).toFixed(1)}% dispute rate — slightly above ideal`;
  } else if (rate <= 0.05) {
    value = 40;
    impact = 'negative';
    description = `${(rate * 100).toFixed(1)}% dispute rate is impacting your score`;
  } else {
    value = 10;
    impact = 'negative';
    description = `${(rate * 100).toFixed(1)}% dispute rate significantly reduces your credit eligibility`;
  }

  return { value, factor: { factor: 'Dispute Rate', impact, description } };
}

function scoreAccountAge(months: number): { value: number; factor: CreditFactor } {
  let value: number;
  let description: string;
  let impact: CreditFactor['impact'];

  if (months < 3) {
    value = 0;
    impact = 'negative';
    description = `${months} month(s) on REZ — minimum 3 months required`;
  } else if (months < 6) {
    value = 30;
    impact = 'neutral';
    description = `${months} months on REZ — score improves with longer history`;
  } else if (months < 12) {
    value = 60;
    impact = 'neutral';
    description = `${months} months of REZ history`;
  } else {
    value = 100;
    impact = 'positive';
    description = `${months} months of established REZ history`;
  }

  return { value, factor: { factor: 'Account Age', impact, description } };
}

function scoreOrderFrequency(ordersPerMonth: number): { value: number; factor: CreditFactor } {
  let value: number;
  let impact: CreditFactor['impact'];

  if (ordersPerMonth > 20) {
    value = 100;
    impact = 'positive';
  } else if (ordersPerMonth >= 10) {
    value = 70;
    impact = 'positive';
  } else if (ordersPerMonth >= 5) {
    value = 40;
    impact = 'neutral';
  } else {
    value = 20;
    impact = 'negative';
  }

  return {
    value,
    factor: {
      factor: 'Supplier Order Frequency',
      impact,
      description:
        value >= 70
          ? `${ordersPerMonth.toFixed(1)} orders/month — strong supplier engagement`
          : value >= 40
          ? `${ordersPerMonth.toFixed(1)} orders/month — increasing order volume will help`
          : `${ordersPerMonth.toFixed(1)} orders/month — low supplier activity detected`,
    },
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function computeCreditScore(input: CreditScoreInput): Promise<CreditScore> {
  const dataMonthsAvailable = input.monthlyRevenueHistory.length;

  // Minimum data gate — must have at least 3 months before issuing a score
  if (dataMonthsAvailable < MIN_MONTHS_REQUIRED || input.accountAgeMonths < MIN_MONTHS_REQUIRED) {
    const tier: CreditTier = 'bronze';
    return {
      score: 0,
      tier,
      maxCreditLine: CREDIT_LINES[tier],
      recommendedTenor: TENORS[tier],
      eligibleForSupplierTerms: false,
      computedAt: new Date().toISOString(),
      dataMonthsAvailable,
      factors: [
        {
          factor: 'Insufficient Data',
          impact: 'negative',
          description: `Only ${dataMonthsAvailable} month(s) of data available. Use REZ for at least 3 months to unlock credit scoring.`,
        },
      ],
    };
  }

  // Compute weighted sub-scores
  const revenue = scoreRevenue(input.monthlyRevenueHistory);
  const payment = scorePaymentRegularity(input.paymentRegularity);
  const dispute = scoreDisputeRate(input.disputeRate);
  const age = scoreAccountAge(input.accountAgeMonths);
  const frequency = scoreOrderFrequency(input.supplierOrderFrequency);

  const score = Math.round(
    revenue.value * 0.30 +
    payment.value * 0.25 +
    dispute.value * 0.20 +
    age.value    * 0.15 +
    frequency.value * 0.10,
  );

  const tier = tierFromScore(score);
  const eligibleForSupplierTerms = tier !== 'bronze';

  // Wallet balance factor (informational only — not in score formula)
  const walletFactor: CreditFactor | null =
    input.walletBalance > 0
      ? {
          factor: 'REZ Wallet Balance',
          impact: 'positive',
          description: `Active wallet balance of ₹${input.walletBalance.toLocaleString('en-IN')} shows platform engagement`,
        }
      : null;

  const factors: CreditFactor[] = [
    revenue.factor,
    payment.factor,
    dispute.factor,
    age.factor,
    frequency.factor,
    ...(walletFactor ? [walletFactor] : []),
  ];

  return {
    score,
    tier,
    maxCreditLine: CREDIT_LINES[tier],
    recommendedTenor: TENORS[tier],
    eligibleForSupplierTerms,
    factors,
    computedAt: new Date().toISOString(),
    dataMonthsAvailable,
  };
}

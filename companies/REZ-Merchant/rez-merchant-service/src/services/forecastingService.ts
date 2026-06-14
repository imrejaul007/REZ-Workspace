/**
 * Cash Flow Forecasting Service
 *
 * Provides cash flow predictions based on:
 * - Historical payment patterns
 * - Outstanding invoices
 * - Upcoming due dates
 * - Seasonal trends
 */

import { Types } from 'mongoose';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { SupplierLedger } from '../models/SupplierLedger';
import { Supplier } from '../models/Supplier';
import { logger } from '../config/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CashFlowForecast {
  merchantId: string;
  currency: string;
  period: {
    start: Date;
    end: Date;
  };
  currentBalance: number;
  projectedInflows: ForecastItem[];
  projectedOutflows: ForecastItem[];
  netCashFlow: number;
  endingBalance: number;
  riskAssessment: RiskAssessment;
  recommendations: string[];
}

export interface ForecastItem {
  date: Date;
  amount: number;
  category: string;
  description: string;
  confidence: number; // 0-1
  source: string;
}

export interface RiskAssessment {
  overallScore: number; // 1-10
  liquidityRisk: 'low' | 'medium' | 'high';
  concentrationRisk: 'low' | 'medium' | 'high';
  overdueRisk: 'low' | 'medium' | 'high';
  factors: string[];
}

export interface AgingBucket {
  bucket: string;
  label: string;
  amount: number;
  percentage: number;
  count: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const BUCKET_LABELS = {
  current: 'Current (0-30 days)',
  days30to60: '31-60 days',
  days60to90: '61-90 days',
  days90plus: '90+ days',
};

// ── Main Forecasting Function ─────────────────────────────────────────────────

export async function generateCashFlowForecast(
  merchantId: string,
  options: {
    days?: number; // Forecast horizon (default 90)
    startDate?: Date;
  } = {}
): Promise<CashFlowForecast> {
  const days = options.days || 90;
  const startDate = options.startDate || new Date();
  const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);

  logger.info(`[Forecast] Generating ${days}-day forecast for merchant ${merchantId}`);

  // Get outstanding POs
  const outstandingPOs = await PurchaseOrder.find({
    merchantId: new Types.ObjectId(merchantId),
    paymentStatus: { $in: ['unpaid', 'partial', 'overdue'] },
    isDeleted: { $ne: true },
  }).lean();

  // Get supplier ledger entries
  const ledgerEntries = await SupplierLedger.find({
    merchantId: new Types.ObjectId(merchantId),
    unallocatedAmount: { $gt: 0 },
  }).lean();

  // Calculate aging buckets
  const agingBuckets = calculateAgingBuckets(outstandingPOs);

  // Generate projected outflows (payments to suppliers)
  const projectedOutflows = generateProjectedOutflows(outstandingPOs, startDate);

  // Generate projected inflows (if any advances/deposits exist)
  const projectedInflows = generateProjectedInflows(ledgerEntries, startDate);

  // Calculate totals
  const totalOutflows = projectedOutflows.reduce((sum, item) => sum + item.amount, 0);
  const totalInflows = projectedInflows.reduce((sum, item) => sum + item.amount, 0);

  // Estimate current balance (simplified - in production, integrate with accounting)
  const currentBalance = await estimateCurrentBalance(merchantId);

  // Calculate ending balance
  const endingBalance = currentBalance + totalInflows - totalOutflows;

  // Risk assessment
  const riskAssessment = assessCashFlowRisk({
    outstandingPOs,
    agingBuckets,
    totalOutflows,
    days,
  });

  // Generate recommendations
  const recommendations = generateRecommendations({
    riskAssessment,
    agingBuckets,
    projectedOutflows,
    endingBalance,
  });

  return {
    merchantId,
    currency: 'INR',
    period: { start: startDate, end: endDate },
    currentBalance,
    projectedInflows,
    projectedOutflows,
    netCashFlow: totalInflows - totalOutflows,
    endingBalance,
    riskAssessment,
    recommendations,
  };
}

// ── Aging Analysis ───────────────────────────────────────────────────────────

function calculateAgingBuckets(pos: unknown[]): AgingBucket[] {
  const now = new Date();
  const buckets = {
    current: { amount: 0, count: 0 },
    days30to60: { amount: 0, count: 0 },
    days60to90: { amount: 0, count: 0 },
    days90plus: { amount: 0, count: 0 },
  };

  for (const po of pos) {
    const dueDate = new Date(po.dueDate);
    const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
    const outstanding = po.totalAmount - (po.paidAmount || 0);

    if (daysDiff <= 0) {
      buckets.current.amount += outstanding;
      buckets.current.count++;
    } else if (daysDiff <= 30) {
      buckets.days30to60.amount += outstanding;
      buckets.days30to60.count++;
    } else if (daysDiff <= 60) {
      buckets.days60to90.amount += outstanding;
      buckets.days60to90.count++;
    } else {
      buckets.days90plus.amount += outstanding;
      buckets.days90plus.count++;
    }
  }

  const totalAmount = Object.values(buckets).reduce((sum, b) => sum + b.amount, 0);

  return Object.entries(buckets).map(([key, value]) => ({
    bucket: key,
    label: BUCKET_LABELS[key as keyof typeof BUCKET_LABELS],
    amount: value.amount,
    percentage: totalAmount > 0 ? (value.amount / totalAmount) * 100 : 0,
    count: value.count,
  }));
}

// ── Projected Outflows ───────────────────────────────────────────────────────

function generateProjectedOutflows(pos: unknown[], startDate: Date): ForecastItem[] {
  const items: ForecastItem[] = [];
  const now = new Date();

  for (const po of pos) {
    const dueDate = new Date(po.dueDate);
    const outstanding = po.totalAmount - (po.paidAmount || 0);

    if (outstanding <= 0) continue;

    // Determine confidence based on how far in the future
    const daysToDue = Math.floor((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    let confidence = 0.95; // Base confidence

    if (daysToDue < 0) {
      // Overdue - high confidence
      confidence = 0.98;
    } else if (daysToDue > 60) {
      // Far future - lower confidence
      confidence = 0.7;
    }

    items.push({
      date: dueDate,
      amount: outstanding,
      category: 'supplier_payment',
      description: `Payment to ${po.supplierName} - PO ${po.poNumber}`,
      confidence,
      source: 'outstanding_po',
    });
  }

  // Sort by date
  items.sort((a, b) => a.date.getTime() - b.date.getTime());

  return items;
}

// ── Projected Inflows ────────────────────────────────────────────────────────

function generateProjectedInflows(entries: unknown[], startDate: Date): ForecastItem[] {
  // In B2B context, inflows might include:
  // - Advances from customers
  // - Deposits
  // - Refunds

  const items: ForecastItem[] = [];

  for (const entry of entries) {
    if (entry.entryType === 'advance' || entry.entryType === 'deposit') {
      items.push({
        date: new Date(entry.createdAt),
        amount: entry.amount,
        category: 'advance',
        description: `Advance from ${entry.supplierId}`,
        confidence: 1.0,
        source: 'ledger_entry',
      });
    }
  }

  return items;
}

// ── Balance Estimation ──────────────────────────────────────────────────────

async function estimateCurrentBalance(merchantId: string): Promise<number> {
  // This is a simplified estimation
  // In production, integrate with actual accounting/ledger
  const ledgerSummary = await SupplierLedger.aggregate([
    { $match: { merchantId: new Types.ObjectId(merchantId) } },
    {
      $group: {
        _id: null,
        totalCredits: { $sum: '$creditAmount' },
        totalDebits: { $sum: '$debitAmount' },
      },
    },
  ]);

  if (ledgerSummary.length === 0) {
    return 0;
  }

  return (ledgerSummary[0].totalCredits || 0) - (ledgerSummary[0].totalDebits || 0);
}

// ── Risk Assessment ─────────────────────────────────────────────────────────

function assessCashFlowRisk(data: {
  outstandingPOs: unknown[];
  agingBuckets: AgingBucket[];
  totalOutflows: number;
  days: number;
}): RiskAssessment {
  const { agingBuckets, totalOutflows, days } = data;

  const overdueBucket = agingBuckets.find((b) => b.bucket === 'days90plus');
  const overduePercentage = overdueBucket?.percentage || 0;

  // Liquidity risk: based on outflows per day
  const dailyOutflow = totalOutflows / days;
  const liquidityRisk = dailyOutflow > 100000 ? 'high' : dailyOutflow > 50000 ? 'medium' : 'low';

  // Concentration risk: based on number of large POs
  const largePOs = data.outstandingPOs.filter((po) => po.totalAmount > 50000);
  const concentrationRisk = largePOs.length > 10 ? 'high' : largePOs.length > 5 ? 'medium' : 'low';

  // Overdue risk: based on aging
  const overdueRisk =
    overduePercentage > 30 ? 'high' : overduePercentage > 15 ? 'medium' : 'low';

  // Overall score (1-10)
  let overallScore = 10;
  if (liquidityRisk === 'high') overallScore -= 3;
  else if (liquidityRisk === 'medium') overallScore -= 1;
  if (concentrationRisk === 'high') overallScore -= 2;
  else if (concentrationRisk === 'medium') overallScore -= 1;
  if (overdueRisk === 'high') overallScore -= 3;
  else if (overdueRisk === 'medium') overallScore -= 1;

  // Factors
  const factors: string[] = [];
  if (overduePercentage > 15) {
    factors.push(`${overduePercentage.toFixed(1)}% of outstanding is 90+ days overdue`);
  }
  if (dailyOutflow > 50000) {
    factors.push(`High daily payment outflow: ₹${dailyOutflow.toLocaleString()}`);
  }
  if (largePOs.length > 5) {
    factors.push(`${largePOs.length} large orders (₹50K+) pending`);
  }

  return {
    overallScore: Math.max(1, overallScore),
    liquidityRisk,
    concentrationRisk,
    overdueRisk,
    factors,
  };
}

// ── Recommendations ──────────────────────────────────────────────────────────

function generateRecommendations(data: {
  riskAssessment: RiskAssessment;
  agingBuckets: AgingBucket[];
  projectedOutflows: ForecastItem[];
  endingBalance: number;
}): string[] {
  const recommendations: string[] = [];
  const { riskAssessment, agingBuckets, endingBalance } = data;

  // Overdue recommendations
  const overdue90 = agingBuckets.find((b) => b.bucket === 'days90plus');
  if (overdue90 && overdue90.amount > 0) {
    recommendations.push(
      `Prioritize clearing ₹${overdue90.amount.toLocaleString()} in 90+ day overdue payments to improve supplier relationships`
    );
  }

  // Balance recommendations
  if (endingBalance < 0) {
    recommendations.push(
      'Warning: Projected negative cash flow. Consider negotiating extended payment terms with suppliers.'
    );
  } else if (endingBalance < 100000) {
    recommendations.push(
      'Low cash reserves projected. Maintain minimum buffer of ₹1L for operational flexibility.'
    );
  }

  // Risk-based recommendations
  if (riskAssessment.liquidityRisk === 'high') {
    recommendations.push(
      'High payment outflows detected. Consider staggering payments or negotiating better terms.'
    );
  }
  if (riskAssessment.concentrationRisk === 'high') {
    recommendations.push(
      'Concentrated payment obligations. Diversify supplier base to reduce single-supplier dependency.'
    );
  }

  // Upcoming large payments
  const largePayments = data.projectedOutflows
    .filter((p) => p.amount > 100000)
    .slice(0, 3);
  if (largePayments.length > 0) {
    const dates = largePayments.map((p) => p.date.toLocaleDateString()).join(', ');
    recommendations.push(
      `Large payments due: ${dates}. Plan cash reserves accordingly.`
    );
  }

  // Default recommendation
  if (recommendations.length === 0) {
    recommendations.push('Cash flow appears healthy. Continue monitoring payment cycles.');
  }

  return recommendations;
}

// ── Short-term Forecast (7/14/30 days) ─────────────────────────────────────

export async function getShortTermForecast(
  merchantId: string,
  horizon: 7 | 14 | 30 = 30
): Promise<{
  date: Date;
  expectedOutflow: number;
  expectedInflow: number;
  netFlow: number;
}[]> {
  const forecast = await generateCashFlowForecast(merchantId, { days: horizon });

  const result: {
    date: Date;
    expectedOutflow: number;
    expectedInflow: number;
    netFlow: number;
  }[] = [];

  // Group by day
  const now = new Date();
  for (let i = 0; i < horizon; i++) {
    const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];

    const dayOutflow = forecast.projectedOutflows
      .filter((p) => p.date.toISOString().split('T')[0] === dateStr)
      .reduce((sum, p) => sum + p.amount, 0);

    const dayInflow = forecast.projectedInflows
      .filter((p) => p.date.toISOString().split('T')[0] === dateStr)
      .reduce((sum, p) => sum + p.amount, 0);

    result.push({
      date,
      expectedOutflow: dayOutflow,
      expectedInflow: dayInflow,
      netFlow: dayInflow - dayOutflow,
    });
  }

  return result;
}

/**
 * Cash Flow Forecasting Service
 *
 * Predicts future cash flows based on:
 * - Historical payment patterns
 * - Outstanding invoices
 * - Expected receipts
 * - Seasonal trends
 */

import { Types } from 'mongoose';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { SupplierLedger } from '../models/SupplierLedger';
import { logger } from '../config/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CashFlowForecast {
  merchantId: string;
  period: { start: Date; end: Date };
  generatedAt: Date;

  // Summary
  openingBalance: number;
  totalInflows: number;
  totalOutflows: number;
  closingBalance: number;
  netChange: number;

  // Breakdown by category
  inflows: {
    supplierPayments: number;
    otherInflows: number;
  };
  outflows: {
    supplierPayments: number;
    otherOutflows: number;
  };

  // Daily projections
  dailyProjections: DailyProjection[];

  // Alerts
  alerts: CashFlowAlert[];

  // Confidence
  confidence: number; // 0-100
  methodology: string;
}

export interface DailyProjection {
  date: Date;
  projectedBalance: number;
  expectedInflows: number;
  expectedOutflows: number;
  invoicesDue: {
    supplierName: string;
    amount: number;
    reference: string;
  }[];
  expectedReceipts: {
    customerName: string;
    amount: number;
    reference: string;
  }[];
}

export interface CashFlowAlert {
  type: 'warning' | 'critical' | 'info';
  message: string;
  date?: Date;
  amount?: number;
}

export interface CashFlowTrend {
  period: string;
  avgInflow: number;
  avgOutflow: number;
  netFlow: number;
  volatility: number; // Standard deviation
}

// ── Forecasting Engine ─────────────────────────────────────────────────────────

/**
 * Generate cash flow forecast for the next N days
 */
export async function generateForecast(
  merchantId: string,
  days: number = 30,
  startingBalance?: number
): Promise<CashFlowForecast> {
  logger.info('[CashFlow] Generating forecast', { merchantId, days });

  const now = new Date();
  const startDate = new Date(now);
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + days);

  // Get historical data for pattern analysis
  const historicalData = await getHistoricalPatterns(merchantId);

  // Get current outstanding obligations
  const outstanding = await getOutstandingObligations(merchantId);

  // Get expected receipts
  const expectedReceipts = await getExpectedReceipts(merchantId, endDate);

  // Calculate opening balance (from ledger)
  const openingBalance = startingBalance || (await calculateCurrentBalance(merchantId));

  // Generate daily projections
  const dailyProjections = generateDailyProjections(
    startDate,
    endDate,
    openingBalance,
    historicalData,
    outstanding,
    expectedReceipts
  );

  // Calculate totals
  const totalInflows = dailyProjections.reduce((sum, d) => sum + d.expectedInflows, 0);
  const totalOutflows = dailyProjections.reduce((sum, d) => sum + d.expectedOutflows, 0);
  const closingBalance = openingBalance + totalInflows - totalOutflows;

  // Generate alerts
  const alerts = generateAlerts(openingBalance, totalInflows, totalOutflows, dailyProjections);

  // Calculate confidence based on historical data quality
  const confidence = calculateConfidence(historicalData, days);

  return {
    merchantId,
    period: { start: startDate, end: endDate },
    generatedAt: now,

    openingBalance,
    totalInflows,
    totalOutflows,
    closingBalance,
    netChange: totalInflows - totalOutflows,

    inflows: {
      supplierPayments: totalInflows * 0.8, // Estimate
      otherInflows: totalInflows * 0.2,
    },
    outflows: {
      supplierPayments: totalOutflows * 0.7,
      otherOutflows: totalOutflows * 0.3,
    },

    dailyProjections,
    alerts,
    confidence,
    methodology: 'Historical pattern analysis with weighted averages',
  };
}

/**
 * Get historical payment patterns
 */
async function getHistoricalPatterns(merchantId: string): Promise<{
  avgDailyInflow: number;
  avgDailyOutflow: number;
  paymentPatterns: Map<string, number>; // Day of week -> amount
  seasonalFactors: Map<number, number>; // Month -> factor
}> {
  // Get last 90 days of ledger data
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const ledger = await SupplierLedger.find({
    merchantId: new Types.ObjectId(merchantId),
    createdAt: { $gte: ninetyDaysAgo },
  }).lean();

  // Calculate averages
  let totalInflow = 0;
  let totalOutflow = 0;
  let inflowDays = 0;
  let outflowDays = 0;

  const paymentPatterns = new Map<string, number>();
  const seasonalFactors = new Map<number, number>();

  // Initialize day patterns
  for (let i = 0; i < 7; i++) {
    paymentPatterns.set(i.toString(), 0);
  }

  // Initialize month factors
  for (let i = 1; i <= 12; i++) {
    seasonalFactors.set(i, 1);
  }

  const dayTotals = new Map<number, { inflow: number; outflow: number; days: number }>();
  const monthTotals = new Map<number, { inflow: number; outflow: number; days: number }>();

  for (const entry of ledger) {
    const dayOfWeek = entry.createdAt.getDay().toString();
    const month = (entry.createdAt.getMonth() + 1);

    if (entry.type === 'credit') {
      totalInflow += entry.amount;
      inflowDays++;
      paymentPatterns.set(
        dayOfWeek,
        (paymentPatterns.get(dayOfWeek) || 0) + entry.amount
      );
    } else {
      totalOutflow += entry.amount;
      outflowDays++;
    }

    // Track day patterns
    const dayKey = entry.createdAt.toISOString().split('T')[0];
    if (!dayTotals.has(dayKey)) {
      dayTotals.set(dayKey, { inflow: 0, outflow: 0, days: 0 });
    }
    const dayData = dayTotals.get(dayKey)!;
    if (entry.type === 'credit') dayData.inflow += entry.amount;
    else dayData.outflow += entry.amount;

    // Track month patterns
    if (!monthTotals.has(month)) {
      monthTotals.set(month, { inflow: 0, outflow: 0, days: 0 });
    }
    const monthData = monthTotals.get(month)!;
    if (entry.type === 'credit') monthData.inflow += entry.amount;
    else monthData.outflow += entry.amount;
  }

  // Calculate averages
  const avgDailyInflow = inflowDays > 0 ? totalInflow / 90 : 50000;
  const avgDailyOutflow = outflowDays > 0 ? totalOutflow / 90 : 40000;

  // Calculate seasonal factors
  const avgMonthInflow = totalInflow / 3; // Rough average per month
  for (const [month, data] of monthTotals) {
    if (data.inflow > 0) {
      seasonalFactors.set(month, data.inflow / (avgMonthInflow / 3));
    }
  }

  return {
    avgDailyInflow,
    avgDailyOutflow,
    paymentPatterns,
    seasonalFactors,
  };
}

/**
 * Get outstanding payment obligations
 */
async function getOutstandingObligations(merchantId: string): Promise<{
  suppliers: { name: string; amount: number; dueDate: Date; reference: string }[];
  total: number;
}> {
  const outstanding = await PurchaseOrder.find({
    merchantId: new Types.ObjectId(merchantId),
    paymentStatus: { $nin: ['paid'] },
    status: { $nin: ['cancelled', 'draft'] },
  })
    .populate('supplierId', 'name')
    .lean();

  const suppliers = outstanding
    .filter((po) => po.dueDate)
    .map((po) => ({
      name: (po.supplierId as unknown)?.name || 'Unknown',
      amount: po.totalAmount - (po.paidAmount || 0),
      dueDate: po.dueDate!,
      reference: po.poNumber,
    }))
    .filter((s) => s.amount > 0);

  return {
    suppliers,
    total: suppliers.reduce((sum, s) => sum + s.amount, 0),
  };
}

/**
 * Get expected receipts
 */
async function getExpectedReceipts(
  merchantId: string,
  endDate: Date
): Promise<{ receipts: { amount: number; expectedDate: Date; reference: string }[]; total: number }> {
  // In production, this would come from sales orders/customers
  // For now, return empty
  return {
    receipts: [],
    total: 0,
  };
}

/**
 * Calculate current balance
 */
async function calculateCurrentBalance(merchantId: string): Promise<number> {
  const ledger = await SupplierLedger.find({
    merchantId: new Types.ObjectId(merchantId),
  }).lean();

  let balance = 0;
  for (const entry of ledger) {
    if (entry.type === 'credit') {
      balance += entry.amount;
    } else {
      balance -= entry.amount;
    }
  }

  return balance;
}

/**
 * Generate daily projections
 */
function generateDailyProjections(
  startDate: Date,
  endDate: Date,
  openingBalance: number,
  historical: { avgDailyInflow: number; avgDailyOutflow: number; seasonalFactors: Map<number, number> },
  outstanding: { suppliers: { name: string; amount: number; dueDate: Date; reference: string }[] },
  _expectedReceipts: { receipts: { amount: number; expectedDate: Date; reference: string }[] }
): DailyProjection[] {
  const projections: DailyProjection[] = [];
  let currentBalance = openingBalance;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const month = current.getMonth() + 1;

    // Base projections with seasonal adjustment
    const seasonalFactor = historical.seasonalFactors.get(month) || 1;
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.5 : 1;

    let expectedInflows = historical.avgDailyInflow * seasonalFactor * weekendFactor;
    let expectedOutflows = historical.avgDailyOutflow * seasonalFactor * weekendFactor;

    // Find invoices due on this day
    const invoicesDue = outstanding.suppliers.filter((s) => {
      const dueDate = new Date(s.dueDate);
      return dueDate.toDateString() === current.toDateString();
    });

    // Add due invoices to outflows
    for (const invoice of invoicesDue) {
      expectedOutflows += invoice.amount;
    }

    currentBalance = currentBalance + expectedInflows - expectedOutflows;

    projections.push({
      date: new Date(current),
      projectedBalance: currentBalance,
      expectedInflows,
      expectedOutflows,
      invoicesDue: invoicesDue.map((inv) => ({
        supplierName: inv.name,
        amount: inv.amount,
        reference: inv.reference,
      })),
      expectedReceipts: [],
    });

    current.setDate(current.getDate() + 1);
  }

  return projections;
}

/**
 * Generate alerts based on projections
 */
function generateAlerts(
  openingBalance: number,
  totalInflows: number,
  totalOutflows: number,
  projections: DailyProjection[]
): CashFlowAlert[] {
  const alerts: CashFlowAlert[] = [];

  // Check for negative balance
  const minBalance = Math.min(...projections.map((p) => p.projectedBalance));
  if (minBalance < 0) {
    alerts.push({
      type: 'critical',
      message: `Cash balance may go negative: ₹${Math.abs(minBalance).toLocaleString()}`,
      amount: Math.abs(minBalance),
    });
  } else if (minBalance < openingBalance * 0.2) {
    alerts.push({
      type: 'warning',
      message: `Low cash balance warning: ₹${minBalance.toLocaleString()}`,
      amount: minBalance,
    });
  }

  // Check for large outflows
  const largeOutflows = projections.filter((p) => p.expectedOutflows > 100000);
  if (largeOutflows.length > 0) {
    alerts.push({
      type: 'info',
      message: `${largeOutflows.length} days with large outflows (>₹1L)`,
    });
  }

  // Check net position
  const netChange = totalInflows - totalOutflows;
  if (netChange < 0 && Math.abs(netChange) > openingBalance * 0.5) {
    alerts.push({
      type: 'warning',
      message: `Significant outflows expected: ₹${Math.abs(netChange).toLocaleString()}`,
      amount: Math.abs(netChange),
    });
  }

  return alerts;
}

/**
 * Calculate forecast confidence
 */
function calculateConfidence(
  historical: { avgDailyInflow: number; avgDailyOutflow: number },
  _days: number
): number {
  // Higher confidence with more historical data
  let confidence = 70;

  // Boost if we have good historical averages
  if (historical.avgDailyInflow > 10000) confidence += 10;
  if (historical.avgDailyOutflow > 10000) confidence += 10;

  return Math.min(confidence, 95);
}

// ── Trends Analysis ─────────────────────────────────────────────────────────────

/**
 * Get cash flow trends over time
 */
export async function getCashFlowTrends(
  merchantId: string,
  period: 'weekly' | 'monthly' | 'quarterly' = 'monthly'
): Promise<CashFlowTrend[]> {
  const trends: CashFlowTrend[] = [];

  // Get last 12 periods
  for (let i = 11; i >= 0; i--) {
    const { startDate, endDate } = getPeriodDates(i, period);

    const ledger = await SupplierLedger.find({
      merchantId: new Types.ObjectId(merchantId),
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    let totalInflow = 0;
    let totalOutflow = 0;

    for (const entry of ledger) {
      if (entry.type === 'credit') totalInflow += entry.amount;
      else totalOutflow += entry.amount;
    }

    const avgInflow = totalInflow / getDaysInPeriod(period);
    const avgOutflow = totalOutflow / getDaysInPeriod(period);

    // Calculate volatility (simplified)
    const volatility = Math.abs(totalInflow - totalOutflow) / Math.max(totalInflow, totalOutflow, 1);

    trends.push({
      period: formatPeriod(startDate, period),
      avgInflow,
      avgOutflow,
      netFlow: totalInflow - totalOutflow,
      volatility,
    });
  }

  return trends;
}

/**
 * Compare forecast vs actual
 */
export async function compareForecastToActual(
  merchantId: string,
  forecastId?: string
): Promise<{
  forecastInflow: number;
  actualInflow: number;
  forecastOutflow: number;
  actualOutflow: number;
  accuracy: number;
}> {
  // In production, would compare with stored forecast
  // For demo, return mock data
  return {
    forecastInflow: 1500000,
    actualInflow: 1450000,
    forecastOutflow: 1200000,
    actualOutflow: 1180000,
    accuracy: 94,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getPeriodDates(periodsAgo: number, period: 'weekly' | 'monthly' | 'quarterly'): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case 'weekly':
      endDate.setDate(endDate.getDate() - periodsAgo * 7);
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'monthly':
      endDate.setMonth(endDate.getMonth() - periodsAgo);
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case 'quarterly':
      endDate.setMonth(endDate.getMonth() - periodsAgo * 3);
      startDate.setMonth(endDate.getMonth() - 3);
      break;
  }

  return { startDate, endDate };
}

function getDaysInPeriod(period: 'weekly' | 'monthly' | 'quarterly'): number {
  switch (period) {
    case 'weekly': return 7;
    case 'monthly': return 30;
    case 'quarterly': return 90;
  }
}

function formatPeriod(date: Date, period: 'weekly' | 'monthly' | 'quarterly'): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

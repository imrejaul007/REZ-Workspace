/**
 * Revenue Consolidation Service - Express Server
 * Aggregates revenue data from all 15 Industry AI products
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3004;
const SERVICE_NAME = 'revenue-consolidation-service';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// ============================================================================
// Types and Interfaces
// ============================================================================

export type IndustryType = 'waitron' | 'shopflow' | 'staybot' | 'carecode' | 'glamai' | 'fitmind' | 'teammind' | 'ledgerai' | 'fleetiq' | 'propflow' | 'neighborai' | 'learniq' | 'tripmind' | 'franchiseiq' | 'prodflow';

export interface RevenueRecord {
  id: string;
  customerId: string;
  customerEmail: string;
  industry: IndustryType;
  product: string;
  amount: number;
  currency: string;
  type: 'sale' | 'subscription' | 'one-time' | 'refund';
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface RevenueSummary {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  byIndustry: Record<IndustryType, IndustryRevenue>;
  byType: Record<string, number>;
  trends: {
    daily: DailyRevenue[];
    weekly: WeeklyRevenue[];
    monthly: MonthlyRevenue[];
  };
}

export interface IndustryRevenue {
  industry: IndustryType;
  productName: string;
  totalRevenue: number;
  transactionCount: number;
  averageValue: number;
  growth: number;
  topCustomers: Array<{ customerId: string; totalSpent: number }>;
}

export interface DailyRevenue {
  date: string;
  amount: number;
  transactionCount: number;
}

export interface WeeklyRevenue {
  week: string;
  amount: number;
  transactionCount: number;
}

export interface MonthlyRevenue {
  month: string;
  amount: number;
  transactionCount: number;
}

// ============================================================================
// Industry Data
// ============================================================================

const INDUSTRY_PRODUCTS: Record<IndustryType, string> = {
  waitron: 'Waitron',
  shopflow: 'ShopFlow',
  staybot: 'StayBot',
  carecode: 'CareCode',
  glamai: 'GlamAI',
  fitmind: 'FitMind',
  teammind: 'TeamMind',
  ledgerai: 'LedgerAI',
  fleetiq: 'FleetIQ',
  propflow: 'PropFlow',
  neighborai: 'NeighborAI',
  learniq: 'LearnIQ',
  tripmind: 'TripMind',
  franchiseiq: 'FranchiseIQ',
  prodflow: 'ProdFlow'
};

// ============================================================================
// Service Class
// ============================================================================

class RevenueConsolidationService {
  private records: Map<string, RevenueRecord> = new Map();
  private industryIndex: Map<IndustryType, Set<string>> = new Map();

  constructor() {
    Object.keys(INDUSTRY_PRODUCTS).forEach(industry => {
      this.industryIndex.set(industry as IndustryType, new Set());
    });
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    const industries = Object.keys(INDUSTRY_PRODUCTS) as IndustryType[];
    const customerIds = ['cust-001', 'cust-002', 'cust-003', 'cust-004', 'cust-005'];
    const types: RevenueRecord['type'][] = ['sale', 'subscription', 'one-time', 'refund'];

    for (let i = 0; i < 100; i++) {
      const industry = industries[Math.floor(Math.random() * industries.length)];
      const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
      const type = types[Math.floor(Math.random() * 3)]; // Avoid too many refunds
      const amount = type === 'refund' ? -Math.random() * 500 : Math.random() * 1000 + 50;

      const record: RevenueRecord = {
        id: uuidv4(),
        customerId,
        customerEmail: `${customerId}@example.com`,
        industry,
        product: INDUSTRY_PRODUCTS[industry],
        amount: Math.round(amount * 100) / 100,
        currency: 'USD',
        type,
        timestamp: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        metadata: {}
      };

      this.records.set(record.id, record);
      this.industryIndex.get(industry)?.add(record.id);
    }

    logger.info(`Initialized ${this.records.size} sample revenue records`);
  }

  recordRevenue(data: Omit<RevenueRecord, 'id'>): RevenueRecord {
    const record: RevenueRecord = {
      ...data,
      id: uuidv4()
    };

    this.records.set(record.id, record);
    this.industryIndex.get(record.industry)?.add(record.id);

    logger.info(`Recorded ${record.amount} from ${record.industry}`);
    return record;
  }

  getSummary(startDate?: Date, endDate?: Date): RevenueSummary {
    let records = Array.from(this.records.values());

    if (startDate) {
      records = records.filter(r => new Date(r.timestamp) >= startDate);
    }
    if (endDate) {
      records = records.filter(r => new Date(r.timestamp) <= endDate);
    }

    const totalRevenue = records.reduce((sum, r) => sum + r.amount, 0);
    const totalTransactions = records.length;
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    const byIndustry: Record<string, IndustryRevenue> = {};
    for (const industry of Object.keys(INDUSTRY_PRODUCTS)) {
      const industryRecords = records.filter(r => r.industry === industry);
      const industryTotal = industryRecords.reduce((sum, r) => sum + r.amount, 0);

      byIndustry[industry] = {
        industry: industry as IndustryType,
        productName: INDUSTRY_PRODUCTS[industry as IndustryType],
        totalRevenue: industryTotal,
        transactionCount: industryRecords.length,
        averageValue: industryRecords.length > 0 ? industryTotal / industryRecords.length : 0,
        growth: (Math.random() - 0.3) * 0.5,
        topCustomers: this.getTopCustomersForIndustry(industry as IndustryType, records)
      };
    }

    const byType: Record<string, number> = {};
    for (const record of records) {
      byType[record.type] = (byType[record.type] || 0) + record.amount;
    }

    const trends = this.generateTrends(records);

    return {
      totalRevenue,
      totalTransactions,
      averageTransactionValue,
      byIndustry: byIndustry as Record<IndustryType, IndustryRevenue>,
      byType,
      trends
    };
  }

  private getTopCustomersForIndustry(industry: IndustryType, records: RevenueRecord[]): Array<{ customerId: string; totalSpent: number }> {
    const customerTotals: Map<string, number> = new Map();
    const industryRecords = records.filter(r => r.industry === industry);

    for (const record of industryRecords) {
      const current = customerTotals.get(record.customerId) || 0;
      customerTotals.set(record.customerId, current + record.amount);
    }

    return Array.from(customerTotals.entries())
      .map(([customerId, totalSpent]) => ({ customerId, totalSpent }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
  }

  private generateTrends(records: RevenueRecord[]): RevenueSummary['trends'] {
    const dailyMap: Map<string, DailyRevenue> = new Map();
    const weeklyMap: Map<string, WeeklyRevenue> = new Map();
    const monthlyMap: Map<string, MonthlyRevenue> = new Map();

    for (const record of records) {
      const date = new Date(record.timestamp);
      const dateStr = date.toISOString().split('T')[0];
      const weekStr = this.getWeekString(date);
      const monthStr = date.toISOString().slice(0, 7);

      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, { date: dateStr, amount: 0, transactionCount: 0 });
      }
      const daily = dailyMap.get(dateStr)!;
      daily.amount += record.amount;
      daily.transactionCount++;

      if (!weeklyMap.has(weekStr)) {
        weeklyMap.set(weekStr, { week: weekStr, amount: 0, transactionCount: 0 });
      }
      const weekly = weeklyMap.get(weekStr)!;
      weekly.amount += record.amount;
      weekly.transactionCount++;

      if (!monthlyMap.has(monthStr)) {
        monthlyMap.set(monthStr, { month: monthStr, amount: 0, transactionCount: 0 });
      }
      const monthly = monthlyMap.get(monthStr)!;
      monthly.amount += record.amount;
      monthly.transactionCount++;
    }

    return {
      daily: Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
      weekly: Array.from(weeklyMap.values()).sort((a, b) => a.week.localeCompare(b.week)),
      monthly: Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month))
    };
  }

  private getWeekString(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  getIndustryRevenue(industry: IndustryType, startDate?: Date, endDate?: Date): IndustryRevenue | null {
    const productName = INDUSTRY_PRODUCTS[industry];
    if (!productName) return null;

    let records = Array.from(this.records.values()).filter(r => r.industry === industry);

    if (startDate) records = records.filter(r => new Date(r.timestamp) >= startDate);
    if (endDate) records = records.filter(r => new Date(r.timestamp) <= endDate);

    const totalRevenue = records.reduce((sum, r) => sum + r.amount, 0);

    return {
      industry,
      productName,
      totalRevenue,
      transactionCount: records.length,
      averageValue: records.length > 0 ? totalRevenue / records.length : 0,
      growth: (Math.random() - 0.3) * 0.5,
      topCustomers: this.getTopCustomersForIndustry(industry, Array.from(this.records.values()))
    };
  }

  getTotalRevenue(startDate?: Date, endDate?: Date): number {
    let records = Array.from(this.records.values());

    if (startDate) records = records.filter(r => new Date(r.timestamp) >= startDate);
    if (endDate) records = records.filter(r => new Date(r.timestamp) <= endDate);

    return records.reduce((sum, r) => sum + r.amount, 0);
  }

  getTopIndustries(limit: number = 5): IndustryRevenue[] {
    const summary = this.getSummary();
    return Object.values(summary.byIndustry)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }

  getRecentTransactions(limit: number = 50): RevenueRecord[] {
    return Array.from(this.records.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  comparePeriods(startA: Date, endA: Date, startB: Date, endB: Date): {
    periodA: number;
    periodB: number;
    change: number;
    changePercent: number;
  } {
    const periodA = this.getTotalRevenue(startA, endA);
    const periodB = this.getTotalRevenue(startB, endB);

    const change = periodB - periodA;
    const changePercent = periodA > 0 ? (change / periodA) * 100 : 0;

    return { periodA, periodB, change, changePercent };
  }
}

const revenueConsolidationService = new RevenueConsolidationService();

// ============================================================================
// API Routes
// ============================================================================

/**
 * Get revenue summary
 */
app.get('/api/revenue/summary', (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const start = startDate ? new Date(startDate as string) : undefined;
  const end = endDate ? new Date(endDate as string) : undefined;

  res.json(revenueConsolidationService.getSummary(start, end));
});

/**
 * Get total revenue
 */
app.get('/api/revenue/total', (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const start = startDate ? new Date(startDate as string) : undefined;
  const end = endDate ? new Date(endDate as string) : undefined;

  res.json({ total: revenueConsolidationService.getTotalRevenue(start, end) });
});

/**
 * Get revenue by industry
 */
app.get('/api/revenue/industry/:industry', (req: Request, res: Response) => {
  const { industry } = req.params;
  const { startDate, endDate } = req.query;

  const start = startDate ? new Date(startDate as string) : undefined;
  const end = endDate ? new Date(endDate as string) : undefined;

  const revenue = revenueConsolidationService.getIndustryRevenue(industry as IndustryType, start, end);
  if (!revenue) {
    res.status(404).json({ error: 'Industry not found' });
    return;
  }
  res.json(revenue);
});

/**
 * Get top industries
 */
app.get('/api/revenue/top-industries', (req: Request, res: Response) => {
  const { limit } = req.query;
  const topIndustries = revenueConsolidationService.getTopIndustries(limit ? parseInt(limit as string) : 5);
  res.json(topIndustries);
});

/**
 * Get recent transactions
 */
app.get('/api/revenue/transactions', (req: Request, res: Response) => {
  const { limit } = req.query;
  const transactions = revenueConsolidationService.getRecentTransactions(limit ? parseInt(limit as string) : 50);
  res.json(transactions);
});

/**
 * Record new revenue
 */
app.post('/api/revenue', (req: Request, res: Response) => {
  const { customerId, customerEmail, industry, product, amount, currency, type, metadata } = req.body;

  if (!customerId || !industry || amount === undefined) {
    res.status(400).json({ error: 'customerId, industry, and amount are required' });
    return;
  }

  const record = revenueConsolidationService.recordRevenue({
    customerId,
    customerEmail: customerEmail || '',
    industry,
    product: product || industry,
    amount,
    currency: currency || 'USD',
    type: type || 'sale',
    timestamp: new Date(),
    metadata: metadata || {}
  });

  res.status(201).json(record);
});

/**
 * Compare periods
 */
app.post('/api/revenue/compare', (req: Request, res: Response) => {
  const { startA, endA, startB, endB } = req.body;

  if (!startA || !endA || !startB || !endB) {
    res.status(400).json({ error: 'startA, endA, startB, and endB dates are required' });
    return;
  }

  const comparison = revenueConsolidationService.comparePeriods(
    new Date(startA),
    new Date(endA),
    new Date(startB),
    new Date(endB)
  );

  res.json(comparison);
});

/**
 * Get daily trends
 */
app.get('/api/trends/daily', (req: Request, res: Response) => {
  const { days } = req.query;
  const summary = revenueConsolidationService.getSummary();
  const daily = summary.trends.daily;

  if (days) {
    const limit = parseInt(days as string);
    res.json(daily.slice(-limit));
  } else {
    res.json(daily);
  }
});

/**
 * Get weekly trends
 */
app.get('/api/trends/weekly', (req: Request, res: Response) => {
  const { weeks } = req.query;
  const summary = revenueConsolidationService.getSummary();
  const weekly = summary.trends.weekly;

  if (weeks) {
    const limit = parseInt(weeks as string);
    res.json(weekly.slice(-limit));
  } else {
    res.json(weekly);
  }
});

/**
 * Get monthly trends
 */
app.get('/api/trends/monthly', (req: Request, res: Response) => {
  const { months } = req.query;
  const summary = revenueConsolidationService.getSummary();
  const monthly = summary.trends.monthly;

  if (months) {
    const limit = parseInt(months as string);
    res.json(monthly.slice(-limit));
  } else {
    res.json(monthly);
  }
});

/**
 * Get all industries
 */
app.get('/api/industries', (req: Request, res: Response) => {
  const industries = Object.entries(INDUSTRY_PRODUCTS).map(([id, name]) => ({ id, name }));
  res.json(industries);
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  const summary = revenueConsolidationService.getSummary();

  res.json({
    service: SERVICE_NAME,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    stats: {
      totalRevenue: summary.totalRevenue,
      totalTransactions: summary.totalTransactions,
      averageTransactionValue: summary.averageTransactionValue,
      topIndustry: summary.byIndustry && Object.values(summary.byIndustry).length > 0
        ? Object.values(summary.byIndustry).sort((a, b) => b.totalRevenue - a.totalRevenue)[0]?.industry
        : null
    }
  });
});

// ============================================================================
// Error Handler
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// Server Start
// ============================================================================

app.listen(PORT, () => {
  logger.info(`${SERVICE_NAME} running on port ${PORT}`);
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
});

export default app;

/**
 * Revenue Consolidation Service
 * Aggregates revenue data from all 15 Industry AI products
 */

import { v4 as uuidv4 } from 'uuid';
import { hojaiCore, IndustryType } from '../../connectors/hojai-core';

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

class RevenueConsolidationService {
  private records: Map<string, RevenueRecord> = new Map();
  private industryIndex: Map<IndustryType, Set<string>> = new Map();

  constructor() {
    // Initialize industry indexes
    const industries = Object.keys(hojaiCore.getAllProducts());
    for (const industry of industries) {
      this.industryIndex.set(industry as IndustryType, new Set());
    }
  }

  /**
   * Record a new revenue transaction
   */
  async recordRevenue(data: Omit<RevenueRecord, 'id'>): Promise<RevenueRecord> {
    const record: RevenueRecord = {
      ...data,
      id: uuidv4()
    };

    this.records.set(record.id, record);

    // Index by industry
    const industryRecords = this.industryIndex.get(record.industry);
    if (industryRecords) {
      industryRecords.add(record.id);
    }

    console.log(`[Revenue] Recorded ${record.amount} from ${record.industry}`);
    return record;
  }

  /**
   * Record revenue from all industries (sync)
   */
  async syncFromAllIndustries(): Promise<Record<IndustryType, number>> {
    const results: Record<string, number> = {};

    for (const industry of Object.keys(hojaiCore.getAllProducts()).map(k => k as IndustryType)) {
      const revenue = await hojaiCore.getRevenueFromIndustry(industry);

      if (revenue && revenue.transactions) {
        for (const txn of revenue.transactions) {
          await this.recordRevenue({
            ...txn,
            industry,
            product: hojaiCore.getProduct(industry)?.name || industry
          });
        }
        results[industry] = revenue.transactions.length;
      } else {
        results[industry] = 0;
      }
    }

    console.log(`[Revenue] Synced from all industries`);
    return results as Record<IndustryType, number>;
  }

  /**
   * Get revenue summary for a time period
   */
  async getSummary(startDate?: Date, endDate?: Date): Promise<RevenueSummary> {
    let records = Array.from(this.records.values());

    // Filter by date range
    if (startDate) {
      records = records.filter(r => r.timestamp >= startDate);
    }
    if (endDate) {
      records = records.filter(r => r.timestamp <= endDate);
    }

    // Calculate totals
    const totalRevenue = records.reduce((sum, r) => sum + r.amount, 0);
    const totalTransactions = records.length;
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // By industry
    const byIndustry: Record<string, IndustryRevenue> = {};
    for (const industry of Object.keys(hojaiCore.getAllProducts())) {
      const industryRecords = records.filter(r => r.industry === industry);
      const industryTotal = industryRecords.reduce((sum, r) => sum + r.amount, 0);
      const product = hojaiCore.getProduct(industry as IndustryType);

      byIndustry[industry] = {
        industry: industry as IndustryType,
        productName: product?.name || industry,
        totalRevenue: industryTotal,
        transactionCount: industryRecords.length,
        averageValue: industryRecords.length > 0 ? industryTotal / industryRecords.length : 0,
        growth: 0, // Would calculate from historical data
        topCustomers: this.getTopCustomersForIndustry(industry as IndustryType, industryRecords)
      };
    }

    // By type
    const byType: Record<string, number> = {};
    for (const record of records) {
      byType[record.type] = (byType[record.type] || 0) + record.amount;
    }

    // Generate trends (simulated)
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

  /**
   * Get top customers for an industry
   */
  private getTopCustomersForIndustry(
    industry: IndustryType,
    records: RevenueRecord[]
  ): Array<{ customerId: string; totalSpent: number }> {
    const customerTotals: Map<string, number> = new Map();

    for (const record of records) {
      const current = customerTotals.get(record.customerId) || 0;
      customerTotals.set(record.customerId, current + record.amount);
    }

    return Array.from(customerTotals.entries())
      .map(([customerId, totalSpent]) => ({ customerId, totalSpent }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
  }

  /**
   * Generate trend data
   */
  private generateTrends(records: RevenueRecord[]): RevenueSummary['trends'] {
    const dailyMap: Map<string, DailyRevenue> = new Map();
    const weeklyMap: Map<string, WeeklyRevenue> = new Map();
    const monthlyMap: Map<string, MonthlyRevenue> = new Map();

    for (const record of records) {
      const dateStr = record.timestamp.toISOString().split('T')[0];
      const weekStr = getWeekString(record.timestamp);
      const monthStr = record.timestamp.toISOString().slice(0, 7);

      // Daily
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, { date: dateStr, amount: 0, transactionCount: 0 });
      }
      const daily = dailyMap.get(dateStr)!;
      daily.amount += record.amount;
      daily.transactionCount++;

      // Weekly
      if (!weeklyMap.has(weekStr)) {
        weeklyMap.set(weekStr, { week: weekStr, amount: 0, transactionCount: 0 });
      }
      const weekly = weeklyMap.get(weekStr)!;
      weekly.amount += record.amount;
      weekly.transactionCount++;

      // Monthly
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

  /**
   * Get revenue for specific industry
   */
  async getIndustryRevenue(
    industry: IndustryType,
    startDate?: Date,
    endDate?: Date
  ): Promise<IndustryRevenue | null> {
    const product = hojaiCore.getProduct(industry);
    if (!product) return null;

    let records = Array.from(this.records.values()).filter(r => r.industry === industry);

    if (startDate) {
      records = records.filter(r => r.timestamp >= startDate);
    }
    if (endDate) {
      records = records.filter(r => r.timestamp <= endDate);
    }

    const totalRevenue = records.reduce((sum, r) => sum + r.amount, 0);

    return {
      industry,
      productName: product.name,
      totalRevenue,
      transactionCount: records.length,
      averageValue: records.length > 0 ? totalRevenue / records.length : 0,
      growth: 0,
      topCustomers: this.getTopCustomersForIndustry(industry, records)
    };
  }

  /**
   * Get total revenue
   */
  async getTotalRevenue(startDate?: Date, endDate?: Date): Promise<number> {
    let records = Array.from(this.records.values());

    if (startDate) {
      records = records.filter(r => r.timestamp >= startDate);
    }
    if (endDate) {
      records = records.filter(r => r.timestamp <= endDate);
    }

    return records.reduce((sum, r) => sum + r.amount, 0);
  }

  /**
   * Get top performing industries
   */
  async getTopIndustries(limit: number = 5): Promise<IndustryRevenue[]> {
    const summary = await this.getSummary();
    return Object.values(summary.byIndustry)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }

  /**
   * Get recent transactions
   */
  async getRecentTransactions(limit: number = 50): Promise<RevenueRecord[]> {
    return Array.from(this.records.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Compare revenue between two time periods
   */
  async comparePeriods(
    startA: Date,
    endA: Date,
    startB: Date,
    endB: Date
  ): Promise<{
    periodA: number;
    periodB: number;
    change: number;
    changePercent: number;
  }> {
    const periodA = await this.getTotalRevenue(startA, endA);
    const periodB = await this.getTotalRevenue(startB, endB);

    const change = periodB - periodA;
    const changePercent = periodA > 0 ? (change / periodA) * 100 : 0;

    return { periodA, periodB, change, changePercent };
  }
}

function getWeekString(date: Date): string {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export const revenueConsolidationService = new RevenueConsolidationService();
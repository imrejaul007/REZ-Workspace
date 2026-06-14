/**
 * Forecast Service
 * 13-week rolling cash flow forecast and shortfall prediction
 */

import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import {
  CashForecast,
  ForecastVariance,
  ShortfallAlert,
  CashTransaction,
  TreasuryAccount,
  ICashForecast,
  IShortfallAlert
} from '../models';
import { cashManagementService } from './cashManagementService';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface ForecastInput {
  businessId: string;
  projectedInflow: number;
  projectedOutflow: number;
  factors?: Array<{
    category: string;
    description: string;
    amount: number;
    probability: number;
  }>;
}

export interface ForecastResult {
  forecastId: string;
  weekNumber: number;
  weekStartDate: Date;
  projectedInflow: number;
  projectedOutflow: number;
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
  confidence: number;
  shortfallRisk: 'low' | 'medium' | 'high' | 'critical';
  factors: Array<{
    category: string;
    amount: number;
    weightedAmount: number;
  }>;
}

export interface ShortfallPrediction {
  willShortfall: boolean;
  projectedShortfall: number;
  shortfallDate?: Date;
  projectedBalance: number;
  requiredBalance: number;
  recoveryActions: Array<{
    action: string;
    estimatedAmount?: number;
    timeline: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  recommendations: string[];
}

export interface VarianceAnalysis {
  category: string;
  projected: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'on_track' | 'over' | 'under';
}

/**
 * Forecast Service
 */
export class ForecastService {
  private readonly FORECAST_WEEKS = 13; // 13-week rolling forecast
  private readonly HISTORY_DAYS = 90; // Use 90 days of history

  /**
   * Generate 13-week rolling forecast
   */
  async generateForecast(
    businessId: string,
    options?: {
      startingBalance?: number;
      confidenceOverride?: number;
    }
  ): Promise<ForecastResult[]> {
    const now = new Date();
    const startOfWeek = this.getStartOfWeek(now);
    const forecasts: ForecastResult[] = [];

    // Get historical data for pattern analysis
    const historyStart = new Date(now.getTime() - this.HISTORY_DAYS * 24 * 60 * 60 * 1000);
    const cashFlowHistory = await this.analyzeHistoricalCashFlow(businessId, historyStart, now);

    // Get current balance
    const cashPosition = await cashManagementService.getCashPosition(businessId);
    let runningBalance = options?.startingBalance ?? cashPosition.totalAvailable;

    for (let week = 0; week < this.FORECAST_WEEKS; week++) {
      const weekStart = new Date(startOfWeek.getTime() + week * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Project based on historical patterns
      const { inflow, outflow, confidence, factors } = await this.projectWeeklyCashFlow(
        businessId,
        weekStart,
        weekEnd,
        cashFlowHistory,
        week
      );

      const netCashFlow = new Decimal(inflow).minus(outflow).toNumber();
      const closingBalance = new Decimal(runningBalance).plus(netCashFlow).toNumber();

      // Calculate shortfall risk
      const shortfallRisk = this.calculateShortfallRisk(closingBalance, outflow, runningBalance);

      // Store forecast
      const forecast = new CashForecast({
        forecastId: `fc_${uuidv4()}`,
        businessId,
        weekStartDate: weekStart,
        weekNumber: week + 1,
        year: weekStart.getFullYear(),
        projectedInflow: inflow,
        projectedOutflow: outflow,
        netCashFlow,
        openingBalance: runningBalance,
        closingBalance,
        confidence: options?.confidenceOverride ?? confidence,
        factors: factors.map(f => ({
          ...f,
          weightedAmount: f.amount * f.probability
        })),
        status: 'draft'
      });
      await forecast.save();

      forecasts.push({
        forecastId: forecast.forecastId,
        weekNumber: week + 1,
        weekStartDate: weekStart,
        projectedInflow: inflow,
        projectedOutflow: outflow,
        netCashFlow,
        openingBalance: runningBalance,
        closingBalance,
        confidence,
        shortfallRisk,
        factors: factors.map(f => ({
          category: f.category,
          amount: f.amount,
          weightedAmount: f.amount * f.probability
        }))
      });

      runningBalance = closingBalance;
    }

    return forecasts;
  }

  /**
   * Get current forecast
   */
  async getCurrentForecast(businessId: string): Promise<ICashForecast[]> {
    const now = new Date();
    const startOfWeek = this.getStartOfWeek(now);

    return CashForecast.find({
      businessId,
      weekStartDate: { $gte: startOfWeek }
    }).sort({ weekNumber: 1 });
  }

  /**
   * Predict shortfall
   */
  async predictShortfall(
    businessId: string,
    options?: {
      requiredBalance?: number;
      lookAheadWeeks?: number;
    }
  ): Promise<ShortfallPrediction> {
    const requiredBalance = options?.requiredBalance ?? 10000; // Minimum required buffer
    const lookAheadWeeks = options?.lookAheadWeeks ?? 4; // 4-week lookahead

    const forecasts = await this.generateForecast(businessId);
    const upcomingForecasts = forecasts.slice(0, lookAheadWeeks);

    let projectedShortfall = 0;
    let shortfallWeek: number | undefined;
    let projectedBalance = 0;

    for (let i = 0; i < upcomingForecasts.length; i++) {
      const forecast = upcomingForecasts[i];
      if (forecast.closingBalance < requiredBalance) {
        const shortfall = new Decimal(requiredBalance).minus(forecast.closingBalance).toNumber();
        if (shortfall > projectedShortfall) {
          projectedShortfall = shortfall;
          shortfallWeek = i;
          projectedBalance = forecast.closingBalance;
        }
      }
    }

    const recoveryActions: ShortfallPrediction['recoveryActions'] = [];
    const recommendations: string[] = [];

    if (projectedShortfall > 0) {
      // Generate recovery actions
      const shortfallAmount = projectedShortfall;

      // Option 1: Accelerate receivables
      recoveryActions.push({
        action: 'Accelerate receivables collection',
        estimatedAmount: Math.min(shortfallAmount * 0.3, shortfallAmount),
        timeline: '1-2 weeks',
        priority: 'high'
      });

      // Option 2: Use credit line
      recoveryActions.push({
        action: 'Draw from credit line',
        estimatedAmount: shortfallAmount,
        timeline: '1-3 days',
        priority: 'high'
      });

      // Option 3: Delay non-essential payments
      recoveryActions.push({
        action: 'Delay non-critical vendor payments',
        estimatedAmount: Math.min(shortfallAmount * 0.2, shortfallAmount),
        timeline: '2-4 weeks',
        priority: 'medium'
      });

      // Option 4: Early investment redemption
      recoveryActions.push({
        action: 'Redeem short-term investments',
        estimatedAmount: Math.min(shortfallAmount * 0.4, shortfallAmount),
        timeline: '3-5 days',
        priority: 'medium'
      });

      // Generate recommendations
      if (shortfallWeek !== undefined && shortfallWeek < 2) {
        recommendations.push('⚠️ Shortfall imminent within 2 weeks - immediate action required');
      } else if (shortfallWeek !== undefined) {
        recommendations.push(`📅 Shortfall projected in week ${shortfallWeek + 1} - prepare recovery plan`);
      }

      if (projectedShortfall > requiredBalance * 0.5) {
        recommendations.push('🔴 High shortfall risk - consider proactive credit facility');
      }

      recommendations.push('💡 Review outstanding receivables and follow up on collections');
      recommendations.push('📊 Consider negotiating extended payment terms with vendors');
    }

    return {
      willShortfall: projectedShortfall > 0,
      projectedShortfall,
      shortfallDate: shortfallWeek !== undefined
        ? new Date(Date.now() + shortfallWeek * 7 * 24 * 60 * 60 * 1000)
        : undefined,
      projectedBalance,
      requiredBalance,
      recoveryActions,
      recommendations
    };
  }

  /**
   * Update forecast with actuals
   */
  async updateForecastWithActuals(
    forecastId: string,
    actualInflow: number,
    actualOutflow: number,
    actualClosingBalance: number
  ): Promise<void> {
    const forecast = await CashForecast.findOne({ forecastId });
    if (!forecast) {
      throw new Error('Forecast not found');
    }

    forecast.actualInflow = actualInflow;
    forecast.actualOutflow = actualOutflow;
    forecast.actualClosingBalance = actualClosingBalance;
    forecast.variance = actualClosingBalance - forecast.closingBalance;
    forecast.variancePercent = forecast.closingBalance === 0
      ? 0
      : ((actualClosingBalance - forecast.closingBalance) / forecast.closingBalance) * 100;
    forecast.status = 'actual';

    await forecast.save();

    // Create variance analysis
    await this.createVarianceAnalysis(forecast);
  }

  /**
   * Create shortfall alert
   */
  async createShortfallAlert(
    businessId: string,
    shortfall: ShortfallPrediction,
    forecastId?: string
  ): Promise<IShortfallAlert> {
    // Check if active alert already exists
    const existing = await ShortfallAlert.findOne({
      businessId,
      status: { $in: ['active', 'acknowledged'] }
    });

    if (existing) {
      // Update existing
      existing.projectedShortfall = shortfall.projectedShortfall;
      existing.shortfallDate = shortfall.shortfallDate;
      existing.projectedBalance = shortfall.projectedBalance;
      await existing.save();
      return existing;
    }

    const severity = shortfall.willShortfall
      ? (shortfall.projectedShortfall > 50000 ? 'critical' : 'high')
      : 'low';

    const alert = new ShortfallAlert({
      alertId: `sal_${uuidv4()}`,
      businessId,
      forecastId,
      type: shortfall.shortfallDate && shortfall.shortfallDate.getTime() - Date.now() < 14 * 24 * 60 * 60 * 1000
        ? 'imminent'
        : 'projected',
      severity,
      projectedShortfall: shortfall.projectedShortfall,
      shortfallDate: shortfall.shortfallDate || new Date(),
      projectedBalance: shortfall.projectedBalance,
      requiredBalance: shortfall.requiredBalance,
      recoveryActions: shortfall.recoveryActions.map(a => ({
        action: a.action,
        amount: a.estimatedAmount,
        status: 'pending'
      })),
      status: 'active'
    });

    await alert.save();
    return alert;
  }

  /**
   * Acknowledge shortfall alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = await ShortfallAlert.findOne({ alertId });
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    await alert.save();
  }

  /**
   * Resolve shortfall alert
   */
  async resolveAlert(
    alertId: string,
    resolution: string
  ): Promise<void> {
    const alert = await ShortfallAlert.findOne({ alertId });
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    await alert.save();
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(businessId: string): Promise<IShortfallAlert[]> {
    return ShortfallAlert.find({
      businessId,
      status: { $in: ['active', 'acknowledged'] }
    }).sort({ severity: -1, projectedShortfall: -1 });
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  private async analyzeHistoricalCashFlow(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    dailyAverage: { inflow: number; outflow: number };
    byDayOfWeek: Record<number, { inflow: number; outflow: number }>;
    byCategory: Record<string, { inflow: number; outflow: number }>;
  }> {
    const accounts = await TreasuryAccount.find({ businessId, status: 'active' });
    const transactions = await CashTransaction.find({
      accountId: { $in: accounts.map(a => a.accountId) },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
    let totalInflow = new Decimal(0);
    let totalOutflow = new Decimal(0);
    const byDayOfWeek: Record<number, { inflow: Decimal; outflow: Decimal }> = {};
    const byCategory: Record<string, { inflow: Decimal; outflow: Decimal }> = {};

    for (const txn of transactions) {
      const amount = new Decimal(txn.amount);
      if (txn.category === 'inflow') {
        totalInflow = totalInflow.plus(amount);
      } else {
        totalOutflow = totalOutflow.plus(amount);
      }

      // By day of week
      const dayOfWeek = new Date(txn.createdAt).getDay();
      if (!byDayOfWeek[dayOfWeek]) {
        byDayOfWeek[dayOfWeek] = { inflow: new Decimal(0), outflow: new Decimal(0) };
      }
      if (txn.category === 'inflow') {
        byDayOfWeek[dayOfWeek].inflow = byDayOfWeek[dayOfWeek].inflow.plus(amount);
      } else {
        byDayOfWeek[dayOfWeek].outflow = byDayOfWeek[dayOfWeek].outflow.plus(amount);
      }

      // By category
      if (!byCategory[txn.type]) {
        byCategory[txn.type] = { inflow: new Decimal(0), outflow: new Decimal(0) };
      }
      if (txn.category === 'inflow') {
        byCategory[txn.type].inflow = byCategory[txn.type].inflow.plus(amount);
      } else {
        byCategory[txn.type].outflow = byCategory[txn.type].outflow.plus(amount);
      }
    }

    return {
      dailyAverage: {
        inflow: totalInflow.dividedBy(days).toNumber(),
        outflow: totalOutflow.dividedBy(days).toNumber()
      },
      byDayOfWeek: Object.fromEntries(
        Object.entries(byDayOfWeek).map(([k, v]) => [
          parseInt(k),
          { inflow: v.inflow.toNumber(), outflow: v.outflow.toNumber() }
        ])
      ),
      byCategory: Object.fromEntries(
        Object.entries(byCategory).map(([k, v]) => [
          k,
          { inflow: v.inflow.toNumber(), outflow: v.outflow.toNumber() }
        ])
      )
    };
  }

  private async projectWeeklyCashFlow(
    businessId: string,
    weekStart: Date,
    weekEnd: Date,
    history: {
      dailyAverage: { inflow: number; outflow: number };
      byDayOfWeek: Record<number, { inflow: number; outflow: number }>;
      byCategory: Record<string, { inflow: number; outflow: number }>;
    },
    weekIndex: number
  ): Promise<{
    inflow: number;
    outflow: number;
    confidence: number;
    factors: Array<{ category: string; description: string; amount: number; probability: number }>;
  }> {
    // Base projection from historical average
    const daysInPeriod = 7;
    let baseInflow = history.dailyAverage.inflow * daysInPeriod;
    let baseOutflow = history.dailyAverage.outflow * daysInPeriod;

    const factors: Array<{ category: string; description: string; amount: number; probability: number }> = [];

    // Adjust for known events
    // Week-of-month adjustments
    const weekOfMonth = Math.floor(weekStart.getDate() / 7);
    if (weekOfMonth === 0) {
      // First week often has lower sales
      baseInflow = baseInflow * 0.85;
      factors.push({ category: 'seasonal', description: 'First week typically lower', amount: baseInflow * 0.15, probability: 0.7 });
    } else if (weekOfMonth === 3) {
      // Fourth week may have month-end push
      baseInflow = baseInflow * 1.1;
      factors.push({ category: 'seasonal', description: 'Month-end sales push', amount: baseInflow * 0.1, probability: 0.8 });
    }

    // Day-of-week adjustments for the specific days in this week
    let dayOfWeekAdjustment = new Decimal(1);
    for (let day = 0; day < 7; day++) {
      const actualDay = (weekStart.getDay() + day) % 7;
      const dayData = history.byDayOfWeek[actualDay];
      if (dayData) {
        const dayRatio = dayData.inflow / (history.dailyAverage.inflow || 1);
        dayOfWeekAdjustment = dayOfWeekAdjustment.times(dayRatio / 7);
      }
    }

    // Confidence decreases further into the future
    const baseConfidence = 0.9;
    const confidence = Math.max(0.5, baseConfidence - weekIndex * 0.03);

    return {
      inflow: new Decimal(baseInflow).times(dayOfWeekAdjustment).toNumber(),
      outflow: baseOutflow,
      confidence,
      factors
    };
  }

  private calculateShortfallRisk(
    closingBalance: number,
    outflow: number,
    openingBalance: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (closingBalance < 0) return 'critical';
    if (closingBalance < outflow * 0.5) return 'critical';
    if (closingBalance < outflow) return 'high';
    if (closingBalance < outflow * 2) return 'medium';
    return 'low';
  }

  private async createVarianceAnalysis(forecast: ICashForecast): Promise<void> {
    if (forecast.actualInflow === undefined || forecast.actualOutflow === undefined) {
      return;
    }

    // Inflow variance
    const inflowVariance = forecast.actualInflow - forecast.projectedInflow;
    const inflowVariancePct = forecast.projectedInflow === 0
      ? 0
      : (inflowVariance / forecast.projectedInflow) * 100;

    const inflowVariance = new ForecastVariance({
      varianceId: `var_${uuidv4()}`,
      businessId: forecast.businessId,
      forecastId: forecast.forecastId,
      period: forecast.weekStartDate,
      category: 'inflow',
      projected: forecast.projectedInflow,
      actual: forecast.actualInflow,
      variance: inflowVariance,
      variancePercent: inflowVariancePct,
      reasons: this.explainVariance(inflowVariancePct)
    });
    await inflowVariance.save();

    // Outflow variance
    const outflowVariance = forecast.actualOutflow - forecast.projectedOutflow;
    const outflowVariancePct = forecast.projectedOutflow === 0
      ? 0
      : (outflowVariance / forecast.projectedOutflow) * 100;

    const outflowRecord = new ForecastVariance({
      varianceId: `var_${uuidv4()}`,
      businessId: forecast.businessId,
      forecastId: forecast.forecastId,
      period: forecast.weekStartDate,
      category: 'outflow',
      projected: forecast.projectedOutflow,
      actual: forecast.actualOutflow,
      variance: outflowVariance,
      variancePercent: outflowVariancePct,
      reasons: this.explainVariance(outflowVariancePct)
    });
    await outflowRecord.save();
  }

  private explainVariance(variancePercent: number): string[] {
    const reasons: string[] = [];
    if (Math.abs(variancePercent) < 5) {
      reasons.push('Variance within normal range');
    } else if (variancePercent > 10) {
      reasons.push('Significant positive variance - review assumptions');
    } else if (variancePercent < -10) {
      reasons.push('Significant negative variance - investigate causes');
    }
    return reasons;
  }
}

export const forecastService = new ForecastService();

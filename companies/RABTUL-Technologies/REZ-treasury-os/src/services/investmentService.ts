/**
 * Investment Service
 * Handles investment tracking, returns, and maturity management
 */

import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import {
  Investment,
  InvestmentReturn,
  InvestmentTransaction,
  CashTransaction,
  IInvestment,
  IInvestmentReturn,
  IInvestmentTransaction
} from '../models';
import { cashManagementService } from './cashManagementService';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface CreateInvestmentInput {
  businessId: string;
  accountId: string;
  type: 'fixed_deposit' | 'recurring_deposit' | 'mutual_fund' | 'government_bond' | 'corporate_bond' | 'money_market' | 'custom';
  name: string;
  provider: string;
  principal: number;
  interestRate: number;
  interestType?: 'simple' | 'compound';
  compoundingFrequency?: 'monthly' | 'quarterly' | 'annually';
  startDate: Date;
  tenureDays: number;
  autoRenew?: boolean;
  notes?: string;
}

export interface InvestmentSummary {
  totalInvested: number;
  currentValue: number;
  totalReturns: number;
  returnPercent: number;
  activeCount: number;
  maturedCount: number;
  byType: Record<string, { count: number; invested: number; value: number; returns: number }>;
  upcomingMaturities: Array<{
    investmentId: string;
    name: string;
    amount: number;
    maturityDate: Date;
    daysRemaining: number;
  }>;
}

/**
 * Investment Service
 */
export class InvestmentService {
  /**
   * Create a new investment
   */
  async createInvestment(input: CreateInvestmentInput): Promise<IInvestment> {
    const investmentId = `inv_${uuidv4()}`;

    // Calculate maturity details
    const startDate = new Date(input.startDate);
    const maturityDate = new Date(startDate.getTime() + input.tenureDays * 24 * 60 * 60 * 1000);
    const maturityAmount = this.calculateMaturityAmount(
      input.principal,
      input.interestRate,
      input.tenureDays,
      input.interestType || 'simple'
    );

    const investment = new Investment({
      investmentId,
      businessId: input.businessId,
      accountId: input.accountId,
      type: input.type,
      name: input.name,
      provider: input.provider,
      principal: input.principal,
      currentValue: input.principal,
      interestRate: input.interestRate,
      interestType: input.interestType || 'simple',
      compoundingFrequency: input.compoundingFrequency,
      startDate: input.startDate,
      maturityDate,
      tenureDays: input.tenureDays,
      maturityAmount,
      status: 'active',
      autoRenew: input.autoRenew || false,
      notes: input.notes
    });

    await investment.save();

    // Record purchase transaction
    const transaction = new InvestmentTransaction({
      transactionId: `itx_${uuidv4()}`,
      investmentId,
      businessId: input.businessId,
      type: 'purchase',
      amount: input.principal,
      description: `Purchased ${input.name}`,
      createdAt: new Date()
    });
    await transaction.save();

    // Deduct from treasury account
    try {
      await cashManagementService.withdraw(
        input.accountId,
        input.principal,
        investmentId,
        'investment_purchase',
        `Investment: ${input.name}`
      );
    } catch (error) {
      // Log but don't fail - the investment is recorded
      console.error('Failed to withdraw from treasury account:', error);
    }

    return investment;
  }

  /**
   * Calculate maturity amount
   */
  private calculateMaturityAmount(
    principal: number,
    annualRate: number,
    tenureDays: number,
    interestType: 'simple' | 'compound'
  ): number {
    const rate = new Decimal(annualRate).dividedBy(100);
    const years = new Decimal(tenureDays).dividedBy(365);

    if (interestType === 'simple') {
      const interest = new Decimal(principal).times(rate).times(years);
      return new Decimal(principal).plus(interest).toNumber();
    } else {
      // Compound interest
      const compoundFactor = new Decimal(1).plus(rate.dividedBy(12)).pow(new Decimal(tenureDays).dividedBy(30.44));
      return new Decimal(principal).times(compoundFactor).toNumber();
    }
  }

  /**
   * Get investment by ID
   */
  async getInvestment(investmentId: string): Promise<IInvestment | null> {
    return Investment.findOne({ investmentId });
  }

  /**
   * Get all investments for a business
   */
  async getBusinessInvestments(
    businessId: string,
    options?: {
      status?: string;
      type?: string;
      includeMatured?: boolean;
    }
  ): Promise<IInvestment[]> {
    const query: Record<string, unknown> = { businessId };

    if (options?.status) {
      query.status = options.status;
    }

    if (options?.type) {
      query.type = options.type;
    }

    return Investment.find(query).sort({ maturityDate: 1 });
  }

  /**
   * Get investment summary
   */
  async getInvestmentSummary(businessId: string): Promise<InvestmentSummary> {
    const investments = await Investment.find({ businessId });

    let totalInvested = new Decimal(0);
    let currentValue = new Decimal(0);
    const activeCount = 0;
    const maturedCount = 0;
    const byType: Record<string, { count: number; invested: Decimal; value: Decimal; returns: Decimal }> = {};
    const upcomingMaturities: Array<{
      investmentId: string;
      name: string;
      amount: number;
      maturityDate: Date;
      daysRemaining: number;
    }> = [];

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const inv of investments) {
      totalInvested = totalInvested.plus(inv.principal);
      currentValue = currentValue.plus(inv.currentValue);

      // By type
      if (!byType[inv.type]) {
        byType[inv.type] = { count: 0, invested: new Decimal(0), value: new Decimal(0), returns: new Decimal(0) };
      }
      byType[inv.type].count++;
      byType[inv.type].invested = byType[inv.type].invested.plus(inv.principal);
      byType[inv.type].value = byType[inv.type].value.plus(inv.currentValue);
      byType[inv.type].returns = byType[inv.type].returns.plus(inv.currentValue - inv.principal);

      // Upcoming maturities
      if (inv.status === 'active' && inv.maturityDate <= thirtyDaysFromNow) {
        const daysRemaining = Math.ceil((inv.maturityDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        upcomingMaturities.push({
          investmentId: inv.investmentId,
          name: inv.name,
          amount: inv.currentValue,
          maturityDate: inv.maturityDate,
          daysRemaining
        });
      }
    }

    return {
      totalInvested: totalInvested.toNumber(),
      currentValue: currentValue.toNumber(),
      totalReturns: currentValue.minus(totalInvested).toNumber(),
      returnPercent: totalInvested.isZero() ? 0 : currentValue.minus(totalInvested).dividedBy(totalInvested).times(100).toNumber(),
      activeCount: investments.filter(i => i.status === 'active').length,
      maturedCount: investments.filter(i => i.status === 'matured').length,
      byType: Object.fromEntries(
        Object.entries(byType).map(([k, v]) => [k, {
          count: v.count,
          invested: v.invested.toNumber(),
          value: v.value.toNumber(),
          returns: v.returns.toNumber()
        }])
      ),
      upcomingMaturities: upcomingMaturities.sort((a, b) => a.daysRemaining - b.daysRemaining)
    };
  }

  /**
   * Update investment value (mark-to-market)
   */
  async updateInvestmentValue(
    investmentId: string,
    newValue: number,
    benchmarkValue?: number
  ): Promise<void> {
    const investment = await Investment.findOne({ investmentId });
    if (!investment) {
      throw new Error('Investment not found');
    }

    const change = new Decimal(newValue).minus(investment.currentValue).toNumber();
    const changePercent = investment.currentValue === 0 ? 0 :
      new Decimal(change).dividedBy(investment.currentValue).times(100).toNumber();

    investment.currentValue = newValue;
    await investment.save();

    // Record return
    const investmentReturn = new InvestmentReturn({
      returnId: `ret_${uuidv4()}`,
      investmentId,
      businessId: investment.businessId,
      date: new Date(),
      value: newValue,
      change,
      changePercent,
      benchmarkValue,
      benchmarkReturn: benchmarkValue ? (benchmarkValue - investment.principal) / investment.principal * 100 : undefined
    });
    await investmentReturn.save();
  }

  /**
   * Redeem/foreclose an investment
   */
  async redeemInvestment(
    investmentId: string,
    targetAccountId: string,
    options?: {
      premature?: boolean;
      reinvest?: boolean;
    }
  ): Promise<{
    success: boolean;
    amount: number;
    interestEarned: number;
    taxWithheld: number;
    netProceeds: number;
  }> {
    const investment = await Investment.findOne({ investmentId });
    if (!investment) {
      throw new Error('Investment not found');
    }

    if (investment.status !== 'active') {
      throw new Error('Investment is not active');
    }

    const now = new Date();
    const isPremature = now < investment.maturityDate;
    const actualTenureDays = Math.floor((now.getTime() - new Date(investment.startDate).getTime()) / (24 * 60 * 60 * 1000));

    // Calculate interest earned
    let interestEarned: number;
    let taxWithheld = 0;

    if (isPremature && options?.premature) {
      // Premature withdrawal - reduced rate (typically 1% less or simple interest)
      const reducedRate = Math.max(investment.interestRate - 1, 5);
      const years = actualTenureDays / 365;
      interestEarned = new Decimal(investment.principal)
        .times(reducedRate / 100)
        .times(years)
        .toNumber();
    } else {
      // Full maturity
      interestEarned = new Decimal(investment.maturityAmount || investment.currentValue)
        .minus(investment.principal)
        .toNumber();
    }

    // TDS deduction (10% if interest > 10000)
    if (interestEarned > 10000) {
      taxWithheld = new Decimal(interestEarned).times(0.1).toNumber();
    }

    const netProceeds = new Decimal(investment.currentValue).minus(taxWithheld).toNumber();

    // Update investment
    investment.status = 'foreclosed';
    investment.interestEarned = interestEarned;
    investment.taxWithheld = taxWithheld;
    await investment.save();

    // Record transaction
    const transaction = new InvestmentTransaction({
      transactionId: `itx_${uuidv4()}`,
      investmentId,
      businessId: investment.businessId,
      type: 'redemption',
      amount: netProceeds,
      tax: taxWithheld,
      description: `${isPremature ? 'Premature' : 'Maturity'} redemption of ${investment.name}`,
      createdAt: now
    });
    await transaction.save();

    // Credit treasury account
    try {
      await cashManagementService.deposit(
        targetAccountId,
        netProceeds,
        investmentId,
        'investment_redemption',
        `Redemption: ${investment.name}`
      );
    } catch (error) {
      console.error('Failed to credit treasury account:', error);
    }

    return {
      success: true,
      amount: investment.currentValue,
      interestEarned,
      taxWithheld,
      netProceeds
    };
  }

  /**
   * Process matured investments (batch job)
   */
  async processMaturedInvestments(): Promise<{
    processed: number;
    matured: IInvestment[];
    autoRenewed: IInvestment[];
  }> {
    const now = new Date();
    const matured = await Investment.find({
      status: 'active',
      maturityDate: { $lte: now }
    });

    const autoRenewed: IInvestment[] = [];
    let processed = 0;

    for (const investment of matured) {
      if (investment.autoRenew && investment.renewTerms) {
        // Auto renew
        const newMaturityDate = new Date(now.getTime() + investment.tenureDays * 24 * 60 * 60 * 1000);
        const newMaturityAmount = this.calculateMaturityAmount(
          investment.currentValue,
          investment.interestRate,
          investment.tenureDays,
          investment.interestType
        );

        investment.maturityDate = newMaturityDate;
        investment.maturityAmount = newMaturityAmount;
        investment.status = 'auto_renewed';
        await investment.save();
        autoRenewed.push(investment);
      } else {
        // Mark as matured
        investment.status = 'matured';
        await investment.save();
      }
      processed++;
    }

    return { processed, matured, autoRenewed };
  }

  /**
   * Get investment returns
   */
  async getInvestmentReturns(
    investmentId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<IInvestmentReturn[]> {
    const query: Record<string, unknown> = { investmentId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) (query.date as Record<string, Date>).$gte = startDate;
      if (endDate) (query.date as Record<string, Date>).$lte = endDate;
    }
    return InvestmentReturn.find(query).sort({ date: -1 });
  }

  /**
   * Get investment transactions
   */
  async getInvestmentTransactions(
    investmentId: string
  ): Promise<IInvestmentTransaction[]> {
    return InvestmentTransaction.find({ investmentId }).sort({ createdAt: -1 });
  }
}

export const investmentService = new InvestmentService();

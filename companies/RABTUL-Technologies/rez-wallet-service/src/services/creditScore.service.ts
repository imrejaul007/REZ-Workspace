import { CreditScore, ICreditScore } from '../models/CreditScore';
import { BNPLTransaction, IBNPLTransaction } from '../models/BNPLTransaction';
import { logger } from '../config/logger';

export class CreditScoreService {

  static async getOrCreateCreditScore(userId: string, phone: string): Promise<ICreditScore> {
    let score = await CreditScore.findOne({ userId });

    if (!score) {
      score = await CreditScore.create({
        userId,
        phone,
        paymentHistory: 50,
        walletStability: 50,
        spendingRegularity: 50,
        engagementScore: 50,
        compositeScore: 500,
        riskTier: 'MEDIUM',
        creditLimit: 5000,
        interestRate: 3,
        creditUsed: 0,
        creditAvailable: 5000,
        lastCalculated: new Date(),
        nextCalculation: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      });
    }

    return score;
  }

  static async calculateScore(userId: string, phone: string, params?: {
    onTimePayments?: number;
    latePayments?: number;
    walletBalanceAvg?: number;
    transactionCount?: number;
    daysActive?: number;
  }): Promise<ICreditScore> {
    const score = await this.getOrCreateCreditScore(userId, phone);

    const paymentHistory = params?.onTimePayments !== undefined
      ? this.calculatePaymentHistory(params.onTimePayments, params.latePayments || 0)
      : score.paymentHistory;

    const walletStability = params?.walletBalanceAvg !== undefined
      ? this.calculateWalletStability(params.walletBalanceAvg)
      : score.walletStability;

    const spendingRegularity = params?.transactionCount !== undefined && params?.daysActive !== undefined
      ? this.calculateSpendingRegularity(params.transactionCount, params.daysActive)
      : score.spendingRegularity;

    const engagementScore = this.calculateEngagementScore(score.engagementScore, score.lastCalculated);

    const compositeScore = Math.round(
      paymentHistory * 0.35 +
      walletStability * 0.20 +
      spendingRegularity * 0.25 +
      engagementScore * 0.20
    );

    const riskTier = this.getRiskTier(compositeScore);
    const creditLimit = this.calculateCreditLimit(compositeScore, score.creditLimit);

    score.paymentHistory = paymentHistory;
    score.walletStability = walletStability;
    score.spendingRegularity = spendingRegularity;
    score.engagementScore = engagementScore;
    score.compositeScore = compositeScore;
    score.riskTier = riskTier;
    score.creditLimit = creditLimit;
    score.creditAvailable = Math.max(0, creditLimit - score.creditUsed);
    score.lastCalculated = new Date();
    score.nextCalculation = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await score.save();
    logger.info('[CreditScore] Calculated', { userId, compositeScore, riskTier });

    return score;
  }

  static calculatePaymentHistory(onTime: number, late: number): number {
    const total = onTime + late;
    if (total === 0) return 50;
    const ratio = onTime / total;
    return Math.round(ratio * 100);
  }

  static calculateWalletStability(avgBalance: number): number {
    if (avgBalance >= 10000) return 90;
    if (avgBalance >= 5000) return 75;
    if (avgBalance >= 2000) return 60;
    if (avgBalance >= 500) return 40;
    return 20;
  }

  static calculateSpendingRegularity(transactions: number, daysActive: number): number {
    if (daysActive <= 0) return 30;
    const monthlyTxns = transactions / (daysActive / 30);
    if (monthlyTxns >= 20) return 90;
    if (monthlyTxns >= 10) return 75;
    if (monthlyTxns >= 5) return 60;
    if (monthlyTxns >= 2) return 40;
    return 20;
  }

  static calculateEngagementScore(currentScore: number, lastCalculated: Date | null): number {
    const daysSince = lastCalculated
      ? Math.floor((Date.now() - lastCalculated.getTime()) / (1000 * 60 * 60 * 24))
      : 30;

    if (daysSince <= 7) return Math.min(currentScore + 5, 100);
    if (daysSince <= 30) return currentScore;
    if (daysSince <= 60) return Math.max(currentScore - 5, 20);
    return Math.max(currentScore - 15, 10);
  }

  static getRiskTier(compositeScore: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (compositeScore >= 650) return 'LOW';
    if (compositeScore >= 450) return 'MEDIUM';
    return 'HIGH';
  }

  static calculateCreditLimit(compositeScore: number, previousLimit: number): number {
    let baseLimit: number;
    if (compositeScore >= 750) baseLimit = 50000;
    else if (compositeScore >= 650) baseLimit = 25000;
    else if (compositeScore >= 550) baseLimit = 10000;
    else if (compositeScore >= 450) baseLimit = 5000;
    else baseLimit = 1000;

    return Math.max(baseLimit, previousLimit * 0.9);
  }

  static async checkEligibility(userId: string, phone: string, requestedAmount: number): Promise<{
    eligible: boolean;
    reason?: string;
    approvedAmount?: number;
    interestRate?: number;
    dueDate?: Date;
  }> {
    const score = await this.getOrCreateCreditScore(userId, phone);

    if (!score.isActive) {
      return { eligible: false, reason: 'Credit account is not active' };
    }

    if (score.compositeScore < 400) {
      return { eligible: false, reason: 'Credit score too low' };
    }

    const availableCredit = score.creditAvailable;
    if (requestedAmount > availableCredit) {
      return {
        eligible: false,
        reason: `Requested amount exceeds available credit of ₹${availableCredit}`,
        approvedAmount: availableCredit
      };
    }

    const totalOutstanding = await BNPLTransaction.findOne({
      userId,
      status: 'ACTIVE'
    });

    if (totalOutstanding && totalOutstanding.totalDue > availableCredit * 0.7) {
      return {
        eligible: false,
        reason: 'Outstanding BNPL balance too high'
      };
    }

    const approvedAmount = Math.min(requestedAmount, availableCredit);
    const interestRate = score.interestRate;
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    return {
      eligible: true,
      approvedAmount,
      interestRate,
      dueDate
    };
  }

  static async createBNPL(params: {
    userId: string;
    phone: string;
    merchantId: string;
    merchantName: string;
    vertical: 'hotel' | 'restaurant' | 'fashion' | 'pharmacy' | 'retail' | 'd2c';
    amount: number;
  }): Promise<IBNPLTransaction> {
    const eligibility = await this.checkEligibility(params.userId, params.phone, params.amount);

    if (!eligibility.eligible) {
      throw new Error(eligibility.reason || 'Not eligible for BNPL');
    }

    const score = await this.getOrCreateCreditScore(params.userId, params.phone);
    const interestAmount = params.amount * (score.interestRate / 100);
    const totalDue = params.amount + interestAmount;

    const transaction = await BNPLTransaction.create({
      userId: params.userId,
      phone: params.phone,
      amount: params.amount,
      merchantId: params.merchantId,
      merchantName: params.merchantName,
      vertical: params.vertical,
      creditUsed: eligibility.approvedAmount || params.amount,
      interestAmount,
      totalDue,
      dueDate: eligibility.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      daysOverdue: 0,
      penaltyApplied: 0,
      paymentMethod: 'bnpl',
    });

    score.creditUsed += eligibility.approvedAmount || params.amount;
    score.creditAvailable = Math.max(0, score.creditLimit - score.creditUsed);
    await score.save();

    logger.info('[CreditScore] BNPL created', {
      userId: params.userId,
      transactionId: transaction._id,
      amount: params.amount
    });

    return transaction;
  }

  static async repayBNPL(userId: string, transactionId: string, amount: number): Promise<IBNPLTransaction> {
    const transaction = await BNPLTransaction.findOne({ _id: transactionId, userId });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'ACTIVE') {
      throw new Error('Transaction is not active');
    }

    const score = await this.getOrCreateCreditScore(userId, transaction.phone);

    if (amount >= transaction.totalDue) {
      transaction.status = 'REPAID';
      transaction.repaidDate = new Date();
      score.creditUsed = Math.max(0, score.creditUsed - transaction.creditUsed);
      score.creditAvailable = score.creditLimit - score.creditUsed;
    } else {
      const remaining = transaction.totalDue - amount;
      transaction.totalDue = remaining;
      transaction.creditUsed = Math.min(transaction.creditUsed, remaining);
    }

    await transaction.save();
    await score.save();

    logger.info('[CreditScore] BNPL repaid', {
      userId,
      transactionId,
      amount,
      status: transaction.status
    });

    return transaction;
  }

  static async getActiveBNPLs(userId: string): Promise<IBNPLTransaction[]> {
    return BNPLTransaction.find({ userId, status: 'ACTIVE' }).sort({ dueDate: 1 });
  }

  static async processOverdueBNPLs(): Promise<number> {
    const now = new Date();
    const overdueTxns = await BNPLTransaction.find({
      status: 'ACTIVE',
      dueDate: { $lt: now }
    });

    let processed = 0;
    for (const txn of overdueTxns) {
      const daysOverdue = Math.floor((now.getTime() - txn.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      txn.daysOverdue = daysOverdue;

      if (daysOverdue > 30) {
        txn.status = 'DEFAULTED';
      } else {
        txn.penaltyApplied = Math.round(txn.totalDue * 0.02 * daysOverdue);
      }

      await txn.save();
      processed++;
    }

    return processed;
  }

  static async getCreditSummary(userId: string, phone: string) {
    const score = await this.getOrCreateCreditScore(userId, phone);
    const activeBNPLs = await this.getActiveBNPLs(userId);
    const totalOutstanding = activeBNPLs.reduce((sum, txn) => sum + txn.totalDue, 0);

    return {
      compositeScore: score.compositeScore,
      riskTier: score.riskTier,
      creditLimit: score.creditLimit,
      creditUsed: score.creditUsed,
      creditAvailable: score.creditAvailable,
      interestRate: score.interestRate,
      activeBNPLCount: activeBNPLs.length,
      totalOutstanding,
      paymentHistory: score.paymentHistory,
      walletStability: score.walletStability,
      spendingRegularity: score.spendingRegularity,
      engagementScore: score.engagementScore,
      lastCalculated: score.lastCalculated,
      nextCalculation: score.nextCalculation,
    };
  }
}

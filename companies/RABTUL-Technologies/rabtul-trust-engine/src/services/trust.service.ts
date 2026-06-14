import { TrustScore, CreditScore, TransactionLimit, ITrustScore, ICreditScore, ITransactionLimit } from '../models/trust.model';
import { config } from '../config';
import logger from '../utils/logger';

export interface TrustScoreUpdate {
  paymentScore?: Partial<{
    score: number;
    onTimePayments: number;
    latePayments: number;
    defaultedPayments: number;
  }>;
  fulfillmentScore?: Partial<{
    score: number;
    ordersFulfilled: number;
    partial: number;
    failed: number;
  }>;
  disputeScore?: Partial<{
    score: number;
    disputesFiled: number;
    won: number;
    lost: number;
  }>;
  verificationScore?: Partial<{
    score: number;
    kycCompleted: boolean;
    kybCompleted: boolean;
    documentsVerified: number;
  }>;
  changeReason?: string;
}

export interface CreditScoreUpdate {
  score?: number;
  creditLimit?: number;
  currentUtilization?: number;
  paymentHistory?: Array<{
    date: Date;
    amount: number;
    status: 'paid' | 'partial' | 'overdue' | 'defaulted';
  }>;
}

export interface TransactionLimitsUpdate {
  maxAutoApprove?: number;
  requiresEscrowAbove?: number;
  canExtendCredit?: boolean;
  creditTermsAvailable?: Array<{
    termDays: number;
    maxAmount: number;
    interestRate: number;
    available: boolean;
  }>;
  dailyLimit?: number;
  monthlyLimit?: number;
  transactionCountLimit?: number;
}

export interface CanTransactResult {
  canTransact: boolean;
  reason: string;
  maxAmount: number;
  requiresEscrow: boolean;
  escrowPercentage?: number;
}

export interface CanExtendCreditResult {
  canExtend: boolean;
  reason: string;
  maxCreditAmount: number;
  availableTerms: Array<{
    termDays: number;
    maxAmount: number;
    interestRate: number;
  }>;
  riskLevel: string;
}

class TrustService {
  /**
   * Get trust score for an entity
   */
  async getTrustScore(entityId: string): Promise<ITrustScore | null> {
    try {
      const trustScore = await TrustScore.findOne({ entityId });
      if (!trustScore) {
        logger.warn(`Trust score not found for entity: ${entityId}`);
        return null;
      }
      return trustScore;
    } catch (error) {
      logger.error(`Error getting trust score for ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Get or create trust score for an entity
   */
  async getOrCreateTrustScore(
    entityId: string,
    entityType: 'user' | 'merchant' | 'business' | 'partner'
  ): Promise<ITrustScore> {
    let trustScore = await this.getTrustScore(entityId);

    if (!trustScore) {
      trustScore = new TrustScore({
        entityId,
        entityType,
        overallScore: config.trust.defaultOverallScore,
        paymentScore: {
          score: config.trust.defaultPaymentScore,
          onTimePayments: 0,
          latePayments: 0,
          defaultedPayments: 0,
        },
        fulfillmentScore: {
          score: config.trust.defaultFulfillmentScore,
          ordersFulfilled: 0,
          partial: 0,
          failed: 0,
        },
        disputeScore: {
          score: config.trust.defaultDisputeScore,
          disputesFiled: 0,
          won: 0,
          lost: 0,
        },
        verificationScore: {
          score: config.trust.defaultVerificationScore,
          kycCompleted: false,
          kybCompleted: false,
          documentsVerified: 0,
        },
        trustLevel: 'fair',
        history: [],
      });
      await trustScore.save();
      logger.info(`Created new trust score for entity: ${entityId}`);
    }

    return trustScore;
  }

  /**
   * Update trust score for an entity
   */
  async updateTrustScore(entityId: string, updates: TrustScoreUpdate): Promise<ITrustScore> {
    try {
      const trustScore = await this.getOrCreateTrustScore(entityId, 'user');

      // Store previous scores for history
      const previousOverall = trustScore.overallScore;
      const previousPayment = trustScore.paymentScore.score;
      const previousFulfillment = trustScore.fulfillmentScore.score;
      const previousDispute = trustScore.disputeScore.score;
      const previousVerification = trustScore.verificationScore.score;

      // Apply updates
      if (updates.paymentScore) {
        trustScore.paymentScore = {
          ...trustScore.paymentScore,
          ...updates.paymentScore,
        };
      }

      if (updates.fulfillmentScore) {
        trustScore.fulfillmentScore = {
          ...trustScore.fulfillmentScore,
          ...updates.fulfillmentScore,
        };
      }

      if (updates.disputeScore) {
        trustScore.disputeScore = {
          ...trustScore.disputeScore,
          ...updates.disputeScore,
        };
      }

      if (updates.verificationScore) {
        trustScore.verificationScore = {
          ...trustScore.verificationScore,
          ...updates.verificationScore,
        };
      }

      // Calculate new overall score (weighted average)
      const weights = {
        payment: 0.35,
        fulfillment: 0.25,
        dispute: 0.20,
        verification: 0.20,
      };

      trustScore.overallScore = Math.round(
        trustScore.paymentScore.score * weights.payment +
        trustScore.fulfillmentScore.score * weights.fulfillment +
        trustScore.disputeScore.score * weights.dispute +
        trustScore.verificationScore.score * weights.verification
      );

      // Update trust level
      trustScore.trustLevel = trustScore.calculateTrustLevel(trustScore.overallScore);

      // Add to history if score changed
      if (previousOverall !== trustScore.overallScore) {
        trustScore.history.push({
          timestamp: new Date(),
          overallScore: trustScore.overallScore,
          paymentScore: trustScore.paymentScore.score,
          fulfillmentScore: trustScore.fulfillmentScore.score,
          disputeScore: trustScore.disputeScore.score,
          verificationScore: trustScore.verificationScore.score,
          changeReason: updates.changeReason || 'Score updated',
        });

        // Keep only last 100 history entries
        if (trustScore.history.length > 100) {
          trustScore.history = trustScore.history.slice(-100);
        }
      }

      await trustScore.save();
      logger.info(`Updated trust score for entity: ${entityId}, new score: ${trustScore.overallScore}`);

      return trustScore;
    } catch (error) {
      logger.error(`Error updating trust score for ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Get trust score history
   */
  async getTrustHistory(entityId: string, limit: number = 30): Promise<ITrustScore['history']> {
    const trustScore = await this.getTrustScore(entityId);
    if (!trustScore) {
      return [];
    }
    return trustScore.history.slice(-limit).reverse();
  }

  /**
   * Get credit score for an entity
   */
  async getCreditScore(entityId: string): Promise<ICreditScore | null> {
    try {
      const creditScore = await CreditScore.findOne({ entityId });
      if (!creditScore) {
        logger.warn(`Credit score not found for entity: ${entityId}`);
        return null;
      }
      return creditScore;
    } catch (error) {
      logger.error(`Error getting credit score for ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Get or create credit score for an entity
   */
  async getOrCreateCreditScore(entityId: string): Promise<ICreditScore> {
    let creditScore = await this.getCreditScore(entityId);

    if (!creditScore) {
      creditScore = new CreditScore({
        entityId,
        score: config.credit.defaultScore,
        creditLimit: 0,
        currentUtilization: 0,
        availableCredit: 0,
        paymentHistory: [],
        riskLevel: 'medium',
        lastUpdated: new Date(),
      });
      await creditScore.save();
      logger.info(`Created new credit score for entity: ${entityId}`);
    }

    return creditScore;
  }

  /**
   * Update credit score for an entity
   */
  async updateCreditScore(entityId: string, updates: CreditScoreUpdate): Promise<ICreditScore> {
    try {
      const creditScore = await this.getOrCreateCreditScore(entityId);

      if (updates.score !== undefined) {
        creditScore.score = Math.max(
          config.credit.minScore,
          Math.min(config.credit.maxScore, updates.score)
        );
        creditScore.riskLevel = creditScore.calculateRiskLevel(creditScore.score);
      }

      if (updates.creditLimit !== undefined) {
        creditScore.creditLimit = updates.creditLimit;
        creditScore.availableCredit = creditScore.creditLimit - creditScore.currentUtilization;
      }

      if (updates.currentUtilization !== undefined) {
        creditScore.currentUtilization = updates.currentUtilization;
        creditScore.availableCredit = creditScore.creditLimit - creditScore.currentUtilization;
      }

      if (updates.paymentHistory) {
        creditScore.paymentHistory = [...creditScore.paymentHistory, ...updates.paymentHistory].slice(-24);
      }

      creditScore.lastUpdated = new Date();
      await creditScore.save();

      logger.info(`Updated credit score for entity: ${entityId}, new score: ${creditScore.score}`);

      return creditScore;
    } catch (error) {
      logger.error(`Error updating credit score for ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Check if an entity can transact
   */
  async canTransact(entityId: string, amount: number): Promise<CanTransactResult> {
    try {
      const trustScore = await this.getTrustScore(entityId);
      const transactionLimits = await this.getTransactionLimits(entityId);

      // Default values if not found
      const maxAutoApprove = transactionLimits?.maxAutoApprove || config.transactionLimits.defaultMaxAutoApprove;
      const requiresEscrowAbove = transactionLimits?.requiresEscrowAbove || config.transactionLimits.defaultEscrowThreshold;
      const overallScore = trustScore?.overallScore || config.trust.defaultOverallScore;

      // Check if can auto-approve
      if (amount <= maxAutoApprove && overallScore >= config.trust.scoreThresholds.fair) {
        return {
          canTransact: true,
          reason: 'Transaction auto-approved',
          maxAmount: maxAutoApprove,
          requiresEscrow: false,
        };
      }

      // Check if escrow is required
      if (amount > requiresEscrowAbove) {
        const escrowPercentage = Math.min(50, Math.max(10, (amount / requiresEscrowAbove) * 5));
        return {
          canTransact: true,
          reason: 'Transaction requires escrow',
          maxAmount: maxAutoApprove,
          requiresEscrow: true,
          escrowPercentage,
        };
      }

      // Check trust level
      if (overallScore < config.trust.scoreThresholds.poor) {
        return {
          canTransact: false,
          reason: 'Trust score too low to transact',
          maxAmount: 0,
          requiresEscrow: true,
          escrowPercentage: 100,
        };
      }

      // Manual review required
      return {
        canTransact: true,
        reason: 'Transaction requires manual review',
        maxAmount: maxAutoApprove,
        requiresEscrow: true,
        escrowPercentage: 25,
      };
    } catch (error) {
      logger.error(`Error checking canTransact for ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Check if credit can be extended to an entity
   */
  async canExtendCredit(entityId: string, amount: number): Promise<CanExtendCreditResult> {
    try {
      const creditScore = await this.getCreditScore(entityId);
      const trustScore = await this.getTrustScore(entityId);
      const transactionLimits = await this.getTransactionLimits(entityId);

      const score = creditScore?.score || config.credit.defaultScore;
      const riskLevel = creditScore?.calculateRiskLevel(score);
      const overallTrust = trustScore?.overallScore || config.trust.defaultOverallScore;
      const canExtend = transactionLimits?.canExtendCredit ?? false;

      // Check if credit extension is allowed
      if (!canExtend) {
        return {
          canExtend: false,
          reason: 'Credit extension not enabled for this entity',
          maxCreditAmount: 0,
          availableTerms: [],
          riskLevel: 'high',
        };
      }

      // Check risk level
      if (score < config.credit.scoreThresholds.poor) {
        return {
          canExtend: false,
          reason: 'Credit score too low',
          maxCreditAmount: 0,
          availableTerms: [],
          riskLevel,
        };
      }

      // Get available terms
      const availableTerms = (transactionLimits?.creditTermsAvailable || [])
        .filter(term => term.available && term.maxAmount >= amount)
        .map(term => ({
          termDays: term.termDays,
          maxAmount: term.maxAmount,
          interestRate: term.interestRate,
        }));

      // Calculate max credit based on score
      const maxCreditMultiplier = score / 600; // Higher score = higher multiplier
      const baseCreditLimit = creditScore?.availableCredit || 0;
      const maxCreditAmount = Math.min(baseCreditLimit * maxCreditMultiplier, amount * 2);

      if (maxCreditAmount <= 0) {
        return {
          canExtend: false,
          reason: 'No available credit',
          maxCreditAmount: 0,
          availableTerms,
          riskLevel,
        };
      }

      return {
        canExtend: true,
        reason: 'Credit extension approved',
        maxCreditAmount,
        availableTerms,
        riskLevel,
      };
    } catch (error) {
      logger.error(`Error checking canExtendCredit for ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Get transaction limits for an entity
   */
  async getTransactionLimits(entityId: string): Promise<ITransactionLimit | null> {
    try {
      return await TransactionLimit.findOne({ entityId });
    } catch (error) {
      logger.error(`Error getting transaction limits for ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Get or create transaction limits for an entity
   */
  async getOrCreateTransactionLimits(entityId: string): Promise<ITransactionLimit> {
    let limits = await this.getTransactionLimits(entityId);

    if (!limits) {
      limits = new TransactionLimit({
        entityId,
        maxAutoApprove: config.transactionLimits.defaultMaxAutoApprove,
        requiresEscrowAbove: config.transactionLimits.defaultEscrowThreshold,
        canExtendCredit: false,
        creditTermsAvailable: config.transactionLimits.defaultCreditTerms.map(days => ({
          termDays: days,
          maxAmount: days * 1000, // ₹1000 per day
          interestRate: 12 + (days / 10), // 12% base + 0.1% per day
          available: days <= 30, // Only short terms available by default
        })),
        dailyLimit: 100000,
        monthlyLimit: 1000000,
        transactionCountLimit: 1000,
      });
      await limits.save();
      logger.info(`Created new transaction limits for entity: ${entityId}`);
    }

    return limits;
  }

  /**
   * Update transaction limits for an entity
   */
  async updateTransactionLimits(entityId: string, updates: TransactionLimitsUpdate): Promise<ITransactionLimit> {
    try {
      const limits = await this.getOrCreateTransactionLimits(entityId);

      if (updates.maxAutoApprove !== undefined) {
        limits.maxAutoApprove = updates.maxAutoApprove;
      }

      if (updates.requiresEscrowAbove !== undefined) {
        limits.requiresEscrowAbove = updates.requiresEscrowAbove;
      }

      if (updates.canExtendCredit !== undefined) {
        limits.canExtendCredit = updates.canExtendCredit;
      }

      if (updates.creditTermsAvailable) {
        limits.creditTermsAvailable = updates.creditTermsAvailable;
      }

      if (updates.dailyLimit !== undefined) {
        limits.dailyLimit = updates.dailyLimit;
      }

      if (updates.monthlyLimit !== undefined) {
        limits.monthlyLimit = updates.monthlyLimit;
      }

      if (updates.transactionCountLimit !== undefined) {
        limits.transactionCountLimit = updates.transactionCountLimit;
      }

      await limits.save();
      logger.info(`Updated transaction limits for entity: ${entityId}`);

      return limits;
    } catch (error) {
      logger.error(`Error updating transaction limits for ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Get combined entity report
   */
  async getEntityReport(entityId: string): Promise<{
    trustScore: ITrustScore | null;
    creditScore: ICreditScore | null;
    transactionLimits: ITransactionLimit | null;
  }> {
    const [trustScore, creditScore, transactionLimits] = await Promise.all([
      this.getTrustScore(entityId),
      this.getCreditScore(entityId),
      this.getTransactionLimits(entityId),
    ]);

    return { trustScore, creditScore, transactionLimits };
  }
}

export default new TrustService();

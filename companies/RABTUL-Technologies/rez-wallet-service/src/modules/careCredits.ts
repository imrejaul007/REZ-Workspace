/**
 * Care Credits Module for RABTUL Wallet Service
 * Manages healthcare rewards: medication adherence, care rewards, family credits
 * Version: 1.0.0
 */

import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

// Medication Adherence Rewards
export interface MedicationAdherenceReward {
  id: string;
  patientId: string;
  medicationId: string;
  medicationName: string;
  streakDays: number;
  adherencePercentage: number;
  creditsEarned: number;
  lastTakenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdherenceStreak {
  patientId: string;
  medicationId: string;
  medicationName: string;
  currentStreak: number;
  longestStreak: number;
  totalDoses: number;
  takenDoses: number;
  missedDoses: number;
  adherenceRate: number; // percentage
  lastDoseDate?: Date;
  streakStartDate?: Date;
  longestStreakEndDate?: Date;
}

export interface AdherenceRewardConfig {
  dailyTakeDose: number; // credits per dose taken
  weeklyPerfectStreak: number; // bonus for 7-day streak
  monthlyPerfectStreak: number; // bonus for 30-day streak
  milestoneBonuses: MilestoneBonus[];
}

export interface MilestoneBonus {
  streakDays: number;
  bonusCredits: number;
  title: string;
}

// Care Rewards
export type CareRewardType =
  | 'medication_adherence'
  | 'checkup_completed'
  | 'vaccination'
  | 'health_goal'
  | 'preventive_screening'
  | 'wellness_check'
  | 'chronic_care'
  | 'mental_health';

export interface CareReward {
  id: string;
  patientId: string;
  rewardType: CareRewardType;
  description: string;
  credits: number;
  earnedAt: Date;
  expiresAt?: Date;
  redeemed: boolean;
  redeemedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface CareRewardSummary {
  patientId: string;
  totalCreditsEarned: number;
  totalCreditsRedeemed: number;
  availableCredits: number;
  rewardsByType: Record<CareRewardType, { count: number; totalCredits: number }>;
  lastRewardDate?: Date;
}

// Family Credits Pool
export interface FamilyCreditsPool {
  id: string;
  familyId: string;
  poolName: string;
  totalCredits: number;
  availableCredits: number;
  members: FamilyPoolMember[];
  createdAt: Date;
  updatedAt: Date;
  settings: FamilyPoolSettings;
}

export interface FamilyPoolMember {
  userId: string;
  displayName: string;
  role: FamilyPoolRole;
  contribution: number;
  withdrawals: number;
  joinedAt: Date;
}

export type FamilyPoolRole = 'admin' | 'contributor' | 'beneficiary';

export interface FamilyPoolSettings {
  minContribution: number;
  maxContribution: number;
  allowWithdrawals: boolean;
  withdrawalApprovalRequired: boolean;
  autoReplenish: boolean;
  autoReplenishThreshold?: number;
  autoReplenishAmount?: number;
}

export interface FamilyPoolTransaction {
  id: string;
  poolId: string;
  userId: string;
  type: FamilyPoolTransactionType;
  amount: number;
  description: string;
  status: TransactionStatus;
  approvedBy?: string;
  createdAt: Date;
  processedAt?: Date;
}

export type FamilyPoolTransactionType = 'contribution' | 'withdrawal' | 'reward_allocation' | 'expiration' | 'refund';
export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

// Credit Redemption
export interface CreditRedemption {
  id: string;
  patientId: string;
  rewardId?: string;
  credits: number;
  redeemedFor: RedemptionItem;
  redeemedAt: Date;
  transactionRef?: string;
}

export interface RedemptionItem {
  type: 'discount' | 'service' | 'product' | 'donation';
  name: string;
  description: string;
  value: number; // monetary value or equivalent
  merchantId?: string;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const AdherenceRewardConfigSchema = z.object({
  dailyTakeDose: z.number().min(0),
  weeklyPerfectStreak: z.number().min(0),
  monthlyPerfectStreak: z.number().min(0),
  milestoneBonuses: z.array(z.object({
    streakDays: z.number().min(1),
    bonusCredits: z.number().min(0),
    title: z.string().min(1),
  })),
});

export const CareRewardSchema = z.object({
  patientId: z.string().min(1),
  rewardType: z.enum([
    'medication_adherence',
    'checkup_completed',
    'vaccination',
    'health_goal',
    'preventive_screening',
    'wellness_check',
    'chronic_care',
    'mental_health',
  ]),
  description: z.string().min(1),
  credits: z.number().min(1),
  expiresAt: z.date().optional(),
});

export const FamilyPoolSettingsSchema = z.object({
  minContribution: z.number().min(0),
  maxContribution: z.number().min(0),
  allowWithdrawals: z.boolean(),
  withdrawalApprovalRequired: z.boolean(),
  autoReplenish: z.boolean(),
  autoReplenishThreshold: z.number().optional(),
  autoReplenishAmount: z.number().optional(),
});

// ============================================================================
// Mock Data Stores (for development)
// ============================================================================

const mockAdherenceStreaks: Map<string, AdherenceStreak> = new Map();
const mockCareRewards: CareReward[] = [];
const mockFamilyPools: Map<string, FamilyCreditsPool> = new Map();
const mockFamilyPoolTransactions: FamilyPoolTransaction[] = [];
const mockCreditRedemptions: CreditRedemption[] = [];

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_ADHERENCE_CONFIG: AdherenceRewardConfig = {
  dailyTakeDose: 10,
  weeklyPerfectStreak: 50,
  monthlyPerfectStreak: 200,
  milestoneBonuses: [
    { streakDays: 7, bonusCredits: 25, title: 'Week Warrior' },
    { streakDays: 14, bonusCredits: 50, title: 'Fortnight Fighter' },
    { streakDays: 30, bonusCredits: 100, title: 'Monthly Master' },
    { streakDays: 60, bonusCredits: 150, title: 'Dedicated Defender' },
    { streakDays: 90, bonusCredits: 250, title: 'Quarterly Champion' },
    { streakDays: 180, bonusCredits: 500, title: 'Half-Year Hero' },
    { streakDays: 365, bonusCredits: 1000, title: 'Annual Legend' },
  ],
};

// ============================================================================
// Service Class
// ============================================================================

export class CareCreditsService {
  private readonly adherenceConfig: AdherenceRewardConfig;

  constructor(config?: Partial<AdherenceRewardConfig>) {
    this.adherenceConfig = { ...DEFAULT_ADHERENCE_CONFIG, ...config };
  }

  // ===========================================================================
  // Medication Adherence Rewards
  // ===========================================================================

  /**
   * Award credits for medication adherence
   */
  async awardAdherenceCredit(
    patientId: string,
    medicationId: string,
    medicationName: string,
    takenAt?: Date
  ): Promise<MedicationAdherenceReward> {
    const now = takenAt || new Date();
    const streakKey = `${patientId}_${medicationId}`;

    // Get or create streak record
    let streak = mockAdherenceStreaks.get(streakKey);

    if (!streak) {
      streak = this.createInitialStreak(patientId, medicationId, medicationName);
    }

    // Check if this dose is on a new day
    const lastDose = streak.lastDoseDate ? new Date(streak.lastDoseDate) : null;
    const isNewDay = !lastDose ||
      lastDose.toDateString() !== now.toDateString();

    // Check if within expected time window (grace period: 4 hours before/after scheduled)
    const wasOnTime = true; // In production, compare with scheduled time

    let creditsEarned = 0;

    if (isNewDay) {
      streak.currentStreak += 1;
      streak.totalDoses += 1;
      streak.takenDoses += 1;
      streak.lastDoseDate = now;

      // Base credits for taking dose
      creditsEarned = this.adherenceConfig.dailyTakeDose;

      // Check for milestone bonuses
      const milestoneBonus = this.adherenceConfig.milestoneBonuses.find(
        m => streak!.currentStreak === m.streakDays
      );
      if (milestoneBonus) {
        creditsEarned += milestoneBonus.bonusCredits;
      }

      // Update streak start if new streak
      if (streak.currentStreak === 1) {
        streak.streakStartDate = now;
      }

      // Update longest streak if current exceeds
      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
        streak.longestStreakEndDate = now;
      }

      // Recalculate adherence rate
      streak.adherenceRate = (streak.takenDoses / streak.totalDoses) * 100;
    }

    const reward: MedicationAdherenceReward = {
      id: this.generateId(),
      patientId,
      medicationId,
      medicationName,
      streakDays: streak.currentStreak,
      adherencePercentage: streak.adherenceRate,
      creditsEarned,
      lastTakenAt: now,
      createdAt: now,
      updatedAt: now,
    };

    mockAdherenceStreaks.set(streakKey, streak);

    // In production: Add credits to patient's wallet
    if (creditsEarned > 0) {
      await this.addCreditsToWallet(patientId, creditsEarned, 'medication_adherence', reward.id);
    }

    return reward;
  }

  /**
   * Get adherence streak for a medication
   */
  async getAdherenceStreak(
    patientId: string,
    medicationId: string
  ): Promise<AdherenceStreak | null> {
    const streakKey = `${patientId}_${medicationId}`;
    return mockAdherenceStreaks.get(streakKey) || null;
  }

  /**
   * Get all adherence streaks for a patient
   */
  async getAllAdherenceStreaks(patientId: string): Promise<AdherenceStreak[]> {
    return Array.from(mockAdherenceStreaks.values()).filter(
      s => s.patientId === patientId
    );
  }

  /**
   * Record a missed dose (breaks streak)
   */
  async recordMissedDose(
    patientId: string,
    medicationId: string,
    missedAt?: Date
  ): Promise<AdherenceStreak> {
    const streakKey = `${patientId}_${medicationId}`;
    const streak = mockAdherenceStreaks.get(streakKey);

    if (!streak) {
      throw new CareCreditsError(
        'STREAK_NOT_FOUND',
        `No streak found for medication ${medicationId}`
      );
    }

    streak.missedDoses += 1;
    streak.totalDoses += 1;
    streak.currentStreak = 0; // Reset streak
    streak.adherenceRate = (streak.takenDoses / streak.totalDoses) * 100;

    mockAdherenceStreaks.set(streakKey, streak);

    return streak;
  }

  /**
   * Calculate potential credits for completing a streak
   */
  async calculateStreakBonus(
    patientId: string,
    medicationId: string,
    targetStreakDays: number
  ): Promise<{ achievable: boolean; currentStreak: number; creditsNeeded: number; bonusCredits: number }> {
    const streak = await this.getAdherenceStreak(patientId, medicationId);
    const currentStreak = streak?.currentStreak || 0;
    const daysRemaining = targetStreakDays - currentStreak;

    const milestoneBonus = this.adherenceConfig.milestoneBonuses.find(
      m => m.streakDays === targetStreakDays
    );

    return {
      achievable: daysRemaining > 0,
      currentStreak,
      creditsNeeded: daysRemaining * this.adherenceConfig.dailyTakeDose,
      bonusCredits: milestoneBonus?.bonusCredits || 0,
    };
  }

  // ===========================================================================
  // Care Rewards
  // ===========================================================================

  /**
   * Award a care reward
   */
  async awardCareReward(
    patientId: string,
    rewardType: CareRewardType,
    description: string,
    credits: number,
    metadata?: Record<string, unknown>
  ): Promise<CareReward> {
    const now = new Date();

    const reward: CareReward = {
      id: this.generateId(),
      patientId,
      rewardType,
      description,
      credits,
      earnedAt: now,
      expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year expiry
      redeemed: false,
      metadata,
    };

    mockCareRewards.push(reward);

    // Add credits to wallet
    await this.addCreditsToWallet(patientId, credits, rewardType, reward.id);

    return reward;
  }

  /**
   * Award checkup completed reward
   */
  async awardCheckupReward(
    patientId: string,
    appointmentId: string,
    providerName: string
  ): Promise<CareReward> {
    return this.awardCareReward(
      patientId,
      'checkup_completed',
      `Completed checkup with ${providerName}`,
      50,
      { appointmentId, providerName }
    );
  }

  /**
   * Award vaccination reward
   */
  async awardVaccinationReward(
    patientId: string,
    vaccineName: string,
    doseNumber: number
  ): Promise<CareReward> {
    const baseCredits = 30;
    const seriesBonus = doseNumber === 1 ? 20 : 0; // Bonus for first dose of series

    return this.awardCareReward(
      patientId,
      'vaccination',
      `Completed ${vaccineName} vaccination (Dose ${doseNumber})`,
      baseCredits + seriesBonus,
      { vaccineName, doseNumber }
    );
  }

  /**
   * Award health goal achievement
   */
  async awardHealthGoalReward(
    patientId: string,
    goalType: string,
    targetValue: number,
    achievedValue: number
  ): Promise<CareReward> {
    const bonusCredits = Math.round((achievedValue / targetValue) * 100);

    return this.awardCareReward(
      patientId,
      'health_goal',
      `Achieved health goal: ${goalType}`,
      Math.min(bonusCredits, 200), // Cap at 200
      { goalType, targetValue, achievedValue }
    );
  }

  /**
   * Get care reward summary for a patient
   */
  async getCareRewardSummary(patientId: string): Promise<CareRewardSummary> {
    const rewards = mockCareRewards.filter(r => r.patientId === patientId);

    const summary: CareRewardSummary = {
      patientId,
      totalCreditsEarned: 0,
      totalCreditsRedeemed: 0,
      availableCredits: 0,
      rewardsByType: {
        medication_adherence: { count: 0, totalCredits: 0 },
        checkup_completed: { count: 0, totalCredits: 0 },
        vaccination: { count: 0, totalCredits: 0 },
        health_goal: { count: 0, totalCredits: 0 },
        preventive_screening: { count: 0, totalCredits: 0 },
        wellness_check: { count: 0, totalCredits: 0 },
        chronic_care: { count: 0, totalCredits: 0 },
        mental_health: { count: 0, totalCredits: 0 },
      },
      lastRewardDate: undefined,
    };

    for (const reward of rewards) {
      summary.totalCreditsEarned += reward.credits;

      if (reward.redeemed) {
        summary.totalCreditsRedeemed += reward.credits;
      } else {
        summary.availableCredits += reward.credits;
      }

      const typeStats = summary.rewardsByType[reward.rewardType];
      if (typeStats) {
        typeStats.count += 1;
        typeStats.totalCredits += reward.credits;
      }

      if (!summary.lastRewardDate || reward.earnedAt > summary.lastRewardDate) {
        summary.lastRewardDate = reward.earnedAt;
      }
    }

    return summary;
  }

  /**
   * Get care rewards for a patient
   */
  async getCareRewards(
    patientId: string,
    options?: {
      type?: CareRewardType;
      redeemed?: boolean;
      limit?: number;
    }
  ): Promise<CareReward[]> {
    let rewards = mockCareRewards.filter(r => r.patientId === patientId);

    if (options?.type) {
      rewards = rewards.filter(r => r.rewardType === options.type);
    }

    if (options?.redeemed !== undefined) {
      rewards = rewards.filter(r => r.redeemed === options.redeemed);
    }

    return rewards
      .sort((a, b) => b.earnedAt.getTime() - a.earnedAt.getTime())
      .slice(0, options?.limit || 100);
  }

  // ===========================================================================
  // Family Credits Pool
  // ===========================================================================

  /**
   * Create a family credits pool
   */
  async createFamilyPool(
    familyId: string,
    poolName: string,
    adminUserId: string,
    settings?: Partial<FamilyPoolSettings>
  ): Promise<FamilyCreditsPool> {
    // Check if pool already exists
    if (mockFamilyPools.has(familyId)) {
      throw new CareCreditsError(
        'POOL_EXISTS',
        `Family pool already exists for family ${familyId}`
      );
    }

    const now = new Date();
    const defaultSettings: FamilyPoolSettings = {
      minContribution: 0,
      maxContribution: 10000,
      allowWithdrawals: true,
      withdrawalApprovalRequired: false,
      autoReplenish: false,
      ...settings,
    };

    const pool: FamilyCreditsPool = {
      id: this.generateId(),
      familyId,
      poolName,
      totalCredits: 0,
      availableCredits: 0,
      members: [
        {
          userId: adminUserId,
          displayName: 'Admin',
          role: 'admin',
          contribution: 0,
          withdrawals: 0,
          joinedAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
      settings: defaultSettings,
    };

    mockFamilyPools.set(familyId, pool);

    return pool;
  }

  /**
   * Add a member to the family pool
   */
  async addToFamilyPool(
    familyId: string,
    userId: string,
    displayName: string,
    role: FamilyPoolRole = 'beneficiary'
  ): Promise<FamilyCreditsPool> {
    const pool = mockFamilyPools.get(familyId);

    if (!pool) {
      throw new CareCreditsError('POOL_NOT_FOUND', `Family pool ${familyId} not found`);
    }

    // Check if already a member
    if (pool.members.some(m => m.userId === userId)) {
      throw new CareCreditsError(
        'ALREADY_MEMBER',
        `User ${userId} is already a member of this pool`
      );
    }

    pool.members.push({
      userId,
      displayName,
      role,
      contribution: 0,
      withdrawals: 0,
      joinedAt: new Date(),
    });

    pool.updatedAt = new Date();

    return pool;
  }

  /**
   * Add credits to family pool
   */
  async addToPool(
    familyId: string,
    userId: string,
    amount: number,
    description?: string
  ): Promise<FamilyPoolTransaction> {
    const pool = mockFamilyPools.get(familyId);

    if (!pool) {
      throw new CareCreditsError('POOL_NOT_FOUND', `Family pool ${familyId} not found`);
    }

    // Validate contribution amount
    if (amount < pool.settings.minContribution) {
      throw new CareCreditsError(
        'AMOUNT_TOO_LOW',
        `Minimum contribution is ${pool.settings.minContribution}`
      );
    }

    if (amount > pool.settings.maxContribution) {
      throw new CareCreditsError(
        'AMOUNT_TOO_HIGH',
        `Maximum contribution is ${pool.settings.maxContribution}`
      );
    }

    const now = new Date();
    const transaction: FamilyPoolTransaction = {
      id: this.generateId(),
      poolId: pool.id,
      userId,
      type: 'contribution',
      amount,
      description: description || 'Contribution to family credits pool',
      status: 'completed',
      createdAt: now,
      processedAt: now,
    };

    mockFamilyPoolTransactions.push(transaction);

    // Update pool
    pool.totalCredits += amount;
    pool.availableCredits += amount;
    pool.updatedAt = now;

    // Update member contribution
    const member = pool.members.find(m => m.userId === userId);
    if (member) {
      member.contribution += amount;
    }

    return transaction;
  }

  /**
   * Use family credits (withdraw)
   */
  async useFamilyCredits(
    familyId: string,
    userId: string,
    amount: number,
    description: string
  ): Promise<FamilyPoolTransaction> {
    const pool = mockFamilyPools.get(familyId);

    if (!pool) {
      throw new CareCreditsError('POOL_NOT_FOUND', `Family pool ${familyId} not found`);
    }

    if (!pool.settings.allowWithdrawals) {
      throw new CareCreditsError(
        'WITHDRAWALS_DISABLED',
        'Withdrawals are not allowed from this pool'
      );
    }

    if (amount > pool.availableCredits) {
      throw new CareCreditsError(
        'INSUFFICIENT_CREDITS',
        `Insufficient credits. Available: ${pool.availableCredits}, Requested: ${amount}`
      );
    }

    // Check member role
    const member = pool.members.find(m => m.userId === userId);
    if (!member) {
      throw new CareCreditsError(
        'NOT_MEMBER',
        `User ${userId} is not a member of this pool`
      );
    }

    if (member.role === 'beneficiary' && pool.settings.withdrawalApprovalRequired) {
      // Create pending transaction
      const transaction: FamilyPoolTransaction = {
        id: this.generateId(),
        poolId: pool.id,
        userId,
        type: 'withdrawal',
        amount,
        description,
        status: 'pending',
        createdAt: new Date(),
      };

      mockFamilyPoolTransactions.push(transaction);
      return transaction;
    }

    // Process immediately
    return this.processWithdrawal(pool, member, amount, description);
  }

  /**
   * Approve a pending withdrawal
   */
  async approveWithdrawal(
    transactionId: string,
    approvedBy: string
  ): Promise<FamilyPoolTransaction> {
    const transaction = mockFamilyPoolTransactions.find(
      t => t.id === transactionId && t.status === 'pending'
    );

    if (!transaction) {
      throw new CareCreditsError(
        'TRANSACTION_NOT_FOUND',
        `Transaction ${transactionId} not found or not pending`
      );
    }

    const pool = mockFamilyPools.get(transaction.poolId);
    if (!pool) {
      throw new CareCreditsError('POOL_NOT_FOUND', 'Associated pool not found');
    }

    // Check approver is admin
    const approver = pool.members.find(m => m.userId === approvedBy);
    if (!approver || approver.role !== 'admin') {
      throw new CareCreditsError(
        'UNAUTHORIZED',
        'Only pool admins can approve withdrawals'
      );
    }

    const member = pool.members.find(m => m.userId === transaction.userId);
    return this.processWithdrawal(pool, member!, transaction.amount, transaction.description, transactionId);
  }

  /**
   * Get family pool by ID
   */
  async getFamilyPool(familyId: string): Promise<FamilyCreditsPool | null> {
    return mockFamilyPools.get(familyId) || null;
  }

  /**
   * Get family pool transactions
   */
  async getFamilyPoolTransactions(
    familyId: string,
    limit: number = 50
  ): Promise<FamilyPoolTransaction[]> {
    const pool = mockFamilyPools.get(familyId);
    if (!pool) {
      throw new CareCreditsError('POOL_NOT_FOUND', `Family pool ${familyId} not found`);
    }

    return mockFamilyPoolTransactions
      .filter(t => t.poolId === pool.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Allocate reward to family pool (from adherence rewards)
   */
  async allocateRewardToPool(
    familyId: string,
    patientId: string,
    rewardCredits: number
  ): Promise<FamilyPoolTransaction> {
    const pool = mockFamilyPools.get(familyId);

    if (!pool) {
      throw new CareCreditsError('POOL_NOT_FOUND', `Family pool ${familyId} not found`);
    }

    const now = new Date();
    const transaction: FamilyPoolTransaction = {
      id: this.generateId(),
      poolId: pool.id,
      userId: patientId,
      type: 'reward_allocation',
      amount: rewardCredits,
      description: `Medication adherence reward allocation`,
      status: 'completed',
      createdAt: now,
      processedAt: now,
    };

    mockFamilyPoolTransactions.push(transaction);

    pool.totalCredits += rewardCredits;
    pool.availableCredits += rewardCredits;
    pool.updatedAt = now;

    return transaction;
  }

  // ===========================================================================
  // Credit Redemption
  // ===========================================================================

  /**
   * Redeem credits
   */
  async redeemCredits(
    patientId: string,
    credits: number,
    redemption: RedemptionItem,
    rewardId?: string
  ): Promise<CreditRedemption> {
    const summary = await this.getCareRewardSummary(patientId);

    if (summary.availableCredits < credits) {
      throw new CareCreditsError(
        'INSUFFICIENT_CREDITS',
        `Insufficient credits. Available: ${summary.availableCredits}, Required: ${credits}`
      );
    }

    const now = new Date();
    const redemptionRecord: CreditRedemption = {
      id: this.generateId(),
      patientId,
      rewardId,
      credits,
      redeemedFor: redemption,
      redeemedAt: now,
    };

    mockCreditRedemptions.push(redemptionRecord);

    // Mark reward as redeemed if applicable
    if (rewardId) {
      const reward = mockCareRewards.find(r => r.id === rewardId);
      if (reward) {
        reward.redeemed = true;
        reward.redeemedAt = now;
      }
    }

    // In production: Process actual redemption (discount, service, etc.)
    return redemptionRecord;
  }

  /**
   * Get redemption history
   */
  async getRedemptionHistory(
    patientId: string,
    limit: number = 50
  ): Promise<CreditRedemption[]> {
    return mockCreditRedemptions
      .filter(r => r.patientId === patientId)
      .sort((a, b) => b.redeemedAt.getTime() - a.redeemedAt.getTime())
      .slice(0, limit);
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private createInitialStreak(
    patientId: string,
    medicationId: string,
    medicationName: string
  ): AdherenceStreak {
    return {
      patientId,
      medicationId,
      medicationName,
      currentStreak: 0,
      longestStreak: 0,
      totalDoses: 0,
      takenDoses: 0,
      missedDoses: 0,
      adherenceRate: 0,
    };
  }

  private async addCreditsToWallet(
    userId: string,
    amount: number,
    source: CareRewardType | 'medication_adherence',
    referenceId: string
  ): Promise<void> {
    // In production, integrate with actual wallet service
    console.log(`Adding ${amount} credits to wallet for user ${userId} from ${source}`);
  }

  private async processWithdrawal(
    pool: FamilyCreditsPool,
    member: FamilyPoolMember,
    amount: number,
    description: string,
    originalTransactionId?: string
  ): Promise<FamilyPoolTransaction> {
    const now = new Date();

    let transaction: FamilyPoolTransaction;

    if (originalTransactionId) {
      transaction = mockFamilyPoolTransactions.find(t => t.id === originalTransactionId)!;
      transaction.status = 'approved';
      transaction.approvedBy = member.userId;
    } else {
      transaction = {
        id: this.generateId(),
        poolId: pool.id,
        userId: member.userId,
        type: 'withdrawal',
        amount,
        description,
        status: 'completed',
        createdAt: now,
        processedAt: now,
      };
      mockFamilyPoolTransactions.push(transaction);
    }

    // Update pool
    pool.availableCredits -= amount;
    pool.updatedAt = now;

    // Update member
    member.withdrawals += amount;

    return transaction;
  }

  private generateId(): string {
    return `credit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// ============================================================================
// Custom Error Class
// ============================================================================

export class CareCreditsError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'CareCreditsError';
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createCareCreditsService(
  config?: Partial<AdherenceRewardConfig>
): CareCreditsService {
  return new CareCreditsService(config);
}

// ============================================================================
// Default Export
// ============================================================================

export default CareCreditsService;

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomInt } from 'crypto';
import { Driver } from '../models/driver.model';

export interface Quest {
  id: string;
  type: QUEST_TYPE;
  title: string;
  description: string;
  target: number;
  progress: number;
  reward: QuestReward;
  status: QUEST_STATUS;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  cityId?: string;
  vehicleType?: string;
}

export enum QUEST_TYPE {
  TRIP_COUNT = 'trip_count',
  EARNINGS = 'earnings',
  TIME_ONLINE = 'time_online',
  RATING = 'rating',
  ACCEPTANCE = 'acceptance',
  STREAK = 'streak',
}

export enum QUEST_STATUS {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CLAIMED = 'claimed',
}

export interface QuestReward {
  type: 'cash' | 'bonus' | 'fuel_card' | 'subscription';
  amount: number;
  description: string;
}

export interface DriverQuestProgress {
  questId: string;
  driverId: string;
  currentProgress: number;
  status: QUEST_STATUS;
  startedAt: Date;
  completedAt?: Date;
  claimedAt?: Date;
}

@Injectable()
export class QuestsService {
  private readonly logger = new Logger(QuestsService.name);

  // Quest templates
  private questTemplates: Quest[] = [
    // Daily Quests
    {
      id: 'daily_trips_10',
      type: QUEST_TYPE.TRIP_COUNT,
      title: 'Complete 10 Trips',
      description: 'Complete 10 trips today and earn bonus',
      target: 10,
      progress: 0,
      reward: { type: 'cash', amount: 300, description: '₹300 cash bonus' },
      status: QUEST_STATUS.ACTIVE,
      startDate: new Date(),
      endDate: new Date(new Date().setHours(23, 59, 59)),
      isActive: true,
    },
    {
      id: 'daily_earnings_2000',
      type: QUEST_TYPE.EARNINGS,
      title: 'Earn ₹2,000 Today',
      description: 'Earn ₹2,000 in fares and get extra',
      target: 2000,
      progress: 0,
      reward: { type: 'cash', amount: 200, description: '₹200 bonus' },
      status: QUEST_STATUS.ACTIVE,
      startDate: new Date(),
      endDate: new Date(new Date().setHours(23, 59, 59)),
      isActive: true,
    },
    {
      id: 'daily_online_8h',
      type: QUEST_TYPE.TIME_ONLINE,
      title: 'Stay Online 8 Hours',
      description: 'Stay online for 8 hours total',
      target: 480, // minutes
      progress: 0,
      reward: { type: 'cash', amount: 150, description: '₹150 guaranteed' },
      status: QUEST_STATUS.ACTIVE,
      startDate: new Date(),
      endDate: new Date(new Date().setHours(23, 59, 59)),
      isActive: true,
    },
    {
      id: 'daily_rating_4_8',
      type: QUEST_TYPE.RATING,
      title: 'Maintain 4.8+ Rating',
      description: 'Keep your rating above 4.8',
      target: 4.8,
      progress: 0,
      reward: { type: 'bonus', amount: 100, description: '₹100 bonus' },
      status: QUEST_STATUS.ACTIVE,
      startDate: new Date(),
      endDate: new Date(new Date().setHours(23, 59, 59)),
      isActive: true,
    },

    // Weekly Quests
    {
      id: 'weekly_trips_50',
      type: QUEST_TYPE.TRIP_COUNT,
      title: 'Complete 50 Trips This Week',
      description: 'Complete 50 trips this week',
      target: 50,
      progress: 0,
      reward: { type: 'cash', amount: 1500, description: '₹1,500 cash bonus' },
      status: QUEST_STATUS.ACTIVE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
    {
      id: 'weekly_earnings_15000',
      type: QUEST_TYPE.EARNINGS,
      title: 'Earn ₹15,000 This Week',
      description: 'Earn ₹15,000 in fares this week',
      target: 15000,
      progress: 0,
      reward: { type: 'cash', amount: 1000, description: '₹1,000 bonus' },
      status: QUEST_STATUS.ACTIVE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
    {
      id: 'weekly_streak_7',
      type: QUEST_TYPE.STREAK,
      title: '7-Day Streak',
      description: 'Complete at least 1 trip for 7 consecutive days',
      target: 7,
      progress: 0,
      reward: { type: 'cash', amount: 500, description: '₹500 streak bonus' },
      status: QUEST_STATUS.ACTIVE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
    },

    // Boost (Surge guarantees)
    {
      id: 'boost_evening',
      type: QUEST_TYPE.EARNINGS,
      title: 'Evening Boost',
      description: 'Earn 1.5x guaranteed during evening rush',
      target: 500,
      progress: 0,
      reward: { type: 'bonus', amount: 1.5, description: '1.5x multiplier' },
      status: QUEST_STATUS.ACTIVE,
      startDate: new Date(),
      endDate: new Date(new Date().setHours(23, 59, 59)),
      isActive: true,
    },
  ];

  // Driver progress tracking
  private driverProgress: Map<string, DriverQuestProgress[]> = new Map();

  constructor(
    @InjectModel(Driver.name) private driverModel: Model<Driver>,
  ) {}

  // ===========================================
  // QUEST MANAGEMENT
  // ===========================================

  /**
   * Get all active quests for driver
   */
  async getActiveQuests(driverId: string): Promise<Quest[]> {
    const now = new Date();
    const progress = this.driverProgress.get(driverId) || [];

    return this.questTemplates
      .filter(q => q.isActive && q.endDate > now)
      .map(quest => {
        const driverProgress = progress.find(p => p.questId === quest.id);
        return {
          ...quest,
          progress: driverProgress?.currentProgress || 0,
          status: this.calculateQuestStatus(quest, driverProgress),
        };
      });
  }

  /**
   * Calculate quest status
   */
  private calculateQuestStatus(quest: Quest, progress?: DriverQuestProgress): QUEST_STATUS {
    if (!progress) return QUEST_STATUS.ACTIVE;

    if (progress.status === QUEST_STATUS.CLAIMED) return QUEST_STATUS.CLAIMED;
    if (progress.completedAt) return QUEST_STATUS.COMPLETED;
    if (quest.endDate < new Date()) return QUEST_STATUS.EXPIRED;

    return QUEST_STATUS.ACTIVE;
  }

  /**
   * Get quest progress for driver
   */
  async getDriverProgress(driverId: string): Promise<{
    activeQuests: number;
    completedToday: number;
    earnedToday: number;
    weeklyProgress: number;
  }> {
    const progress = this.driverProgress.get(driverId) || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeQuests = progress.filter(p => p.status === QUEST_STATUS.ACTIVE).length;
    const completedToday = progress.filter(
      p => p.completedAt && p.completedAt >= today
    ).length;
    const earnedToday = progress
      .filter(p => p.claimedAt && p.claimedAt >= today)
      .reduce((sum, p) => {
        const quest = this.questTemplates.find(q => q.id === p.questId);
        return sum + (quest?.reward.amount || 0);
      }, 0);
    const weeklyProgress = progress.reduce((sum, p) => sum + p.currentProgress, 0);

    return {
      activeQuests,
      completedToday,
      earnedToday,
      weeklyProgress,
    };
  }

  /**
   * Update quest progress
   */
  async updateProgress(
    driverId: string,
    questType: QUEST_TYPE,
    amount: number
  ): Promise<Quest | null> {
    const eligibleQuests = this.questTemplates.filter(
      q => q.type === questType && q.isActive && q.endDate > new Date()
    );

    if (eligibleQuests.length === 0) return null;

    // Get or create progress array
    let progress = this.driverProgress.get(driverId) || [];

    for (const quest of eligibleQuests) {
      let questProgress = progress.find(p => p.questId === quest.id);

      if (!questProgress) {
        questProgress = {
          questId: quest.id,
          driverId,
          currentProgress: 0,
          status: QUEST_STATUS.ACTIVE,
          startedAt: new Date(),
        };
        progress.push(questProgress);
      }

      // Update progress
      questProgress.currentProgress += amount;

      // Check completion
      if (questProgress.currentProgress >= quest.target && !questProgress.completedAt) {
        questProgress.status = QUEST_STATUS.COMPLETED;
        questProgress.completedAt = new Date();
        this.logger.log(`Quest ${quest.id} completed by driver ${driverId}`);
      }
    }

    this.driverProgress.set(driverId, progress);

    // Return first completed quest that hasn't been claimed
    const completed = progress.find(
      p => p.status === QUEST_STATUS.COMPLETED && !p.claimedAt
    );

    if (completed) {
      return this.questTemplates.find(q => q.id === completed.questId) || null;
    }

    return null;
  }

  /**
   * Claim quest reward
   */
  async claimReward(
    driverId: string,
    questId: string
  ): Promise<{ success: boolean; reward?: QuestReward; message: string }> {
    let progress = this.driverProgress.get(driverId) || [];
    const questProgress = progress.find(p => p.questId === questId);

    if (!questProgress) {
      return { success: false, message: 'Quest not found' };
    }

    if (questProgress.status !== QUEST_STATUS.COMPLETED) {
      return { success: false, message: 'Quest not completed yet' };
    }

    if (questProgress.claimedAt) {
      return { success: false, message: 'Reward already claimed' };
    }

    const quest = this.questTemplates.find(q => q.id === questId);
    if (!quest) {
      return { success: false, message: 'Quest not found' };
    }

    // Mark as claimed
    questProgress.status = QUEST_STATUS.CLAIMED;
    questProgress.claimedAt = new Date();
    this.driverProgress.set(driverId, progress);

    // Award reward to driver
    await this.awardReward(driverId, quest.reward);

    this.logger.log(`Reward claimed: ${quest.reward.description} for driver ${driverId}`);

    return {
      success: true,
      reward: quest.reward,
      message: `Reward claimed: ${quest.reward.description}`,
    };
  }

  /**
   * Award reward to driver
   */
  private async awardReward(driverId: string, reward: QuestReward): Promise<void> {
    const driver = await this.driverModel.findById(driverId);
    if (!driver) return;

    switch (reward.type) {
      case 'cash':
      case 'bonus':
        driver.walletBalance += reward.amount;
        break;
      case 'fuel_card':
        // Add fuel card credit
        break;
      case 'subscription':
        // Extend subscription
        break;
    }

    await driver.save();
  }

  // ===========================================
  // STREAK TRACKING
  // ===========================================

  /**
   * Update streak for driver
   */
  async updateStreak(driverId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    streakBonus: number;
  }> {
    // In production, track daily activity from database
    const currentStreak = randomInt(0, 7); // Mock
    const longestStreak = Math.max(currentStreak, 7);
    const streakBonus = currentStreak * 50; // ₹50 per day streak

    return {
      currentStreak,
      longestStreak,
      streakBonus,
    };
  }

  /**
   * Check streak eligibility
   */
  async checkStreakEligibility(driverId: string): Promise<boolean> {
    // Check if driver completed at least 1 trip today
    return randomInt(0, 100) > 20; // Mock
  }

  // ===========================================
  // GUARANTEED EARNINGS
  // ===========================================

  /**
   * Get guaranteed earnings for time block
   */
  async getGuaranteedEarnings(
    driverId: string,
    timeBlock: 'morning' | 'evening' | 'night'
  ): Promise<{
    available: boolean;
    minimum: number;
    requirement: string;
    expiresAt: Date;
  }> {
    const guarantees = {
      morning: { minimum: 500, requirement: '3 trips' },
      evening: { minimum: 800, requirement: '4 trips' },
      night: { minimum: 600, requirement: '3 trips' },
    };

    const guarantee = guarantees[timeBlock];
    const expiresAt = new Date();

    if (timeBlock === 'morning') {
      expiresAt.setHours(12, 0, 0, 0);
    } else if (timeBlock === 'evening') {
      expiresAt.setHours(20, 0, 0, 0);
    } else {
      expiresAt.setHours(23, 59, 59, 0);
    }

    return {
      available: true,
      ...guarantee,
      expiresAt,
    };
  }

  /**
   * Calculate guaranteed earnings payout
   */
  async calculateGuaranteedPayout(
    driverId: string,
    timeBlock: 'morning' | 'evening' | 'night',
    actualEarnings: number
  ): Promise<{
    guarantee: number;
    actual: number;
    payout: number;
    bonus: number;
  }> {
    const guarantee = await this.getGuaranteedEarnings(driverId, timeBlock);

    const payout = Math.max(guarantee.minimum, actualEarnings);
    const bonus = payout > actualEarnings ? payout - actualEarnings : 0;

    return {
      guarantee: guarantee.minimum,
      actual: actualEarnings,
      payout,
      bonus,
    };
  }

  // ===========================================
  // LEADERBOARD
  // ===========================================

  /**
   * Get weekly leaderboard
   */
  async getWeeklyLeaderboard(limit: number = 10): Promise<{
    rank: number;
    driverId: string;
    driverName: string;
    trips: number;
    earnings: number;
    rating: number;
  }[]> {
    // Mock leaderboard data
    const mockLeaderboard = [
      { driverId: 'DRV_001', driverName: 'Rajesh K', trips: 127, earnings: 34500, rating: 4.92 },
      { driverId: 'DRV_002', driverName: 'Priya S', trips: 118, earnings: 32000, rating: 4.89 },
      { driverId: 'DRV_003', driverName: 'Amit P', trips: 105, earnings: 29500, rating: 4.85 },
      { driverId: 'DRV_004', driverName: 'Sunita M', trips: 98, earnings: 27800, rating: 4.91 },
      { driverId: 'DRV_005', driverName: 'Vikram R', trips: 92, earnings: 26200, rating: 4.88 },
      { driverId: 'DRV_006', driverName: 'Neha K', trips: 88, earnings: 24500, rating: 4.84 },
      { driverId: 'DRV_007', driverName: 'Anil S', trips: 85, earnings: 23800, rating: 4.87 },
      { driverId: 'DRV_008', driverName: 'Pooja R', trips: 82, earnings: 22100, rating: 4.90 },
      { driverId: 'DRV_009', driverName: 'Ravi M', trips: 78, earnings: 21500, rating: 4.83 },
      { driverId: 'DRV_010', driverName: 'Kavita J', trips: 75, earnings: 20800, rating: 4.86 },
    ];

    return mockLeaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));
  }

  /**
   * Get driver's rank
   */
  async getDriverRank(driverId: string): Promise<{
    rank: number;
    totalDrivers: number;
    percentile: number;
    improvement: number;
  }> {
    // Mock rank calculation
    const rank = randomInt(1, 101);
    const totalDrivers = 500;
    const percentile = Math.round((1 - rank / totalDrivers) * 100);
    const improvement = randomInt(-10, 11); // -10 to +10

    return {
      rank,
      totalDrivers,
      percentile,
      improvement: Math.round(improvement * 10) / 10,
    };
  }
}

/**
 * Savings Service
 *
 * Comprehensive savings tracking, analytics, and recommendations.
 * Tracks all money saved through cashback, rewards, referrals, and more.
 */

import mongoose, { Types } from 'mongoose';
import crypto from 'crypto';
import {
  SavingsEntry,
  SavingsGoal,
  SavingsStreak,
  SavingsInsight,
  SavingsProjection,
  UserSavingsSummary,
  ISavingsEntry,
  ISavingsGoal,
  ISavingsStreak,
  ISavingsInsight,
  ISavingsProjection,
  IUserSavingsSummary,
} from '../models/Savings';
import { CoinTransaction } from '../models/CoinTransaction';
import { getDynamicConversionRate } from './walletService';
import { createServiceLogger } from '../config/logger';
import { recordTransaction } from './amlComplianceService';

const logger = createServiceLogger('savings');

// ─── Constants ─────────────────────────────────────────────────────────────────

const SAVINGS_TYPES = ['cashback', 'reward', 'referral', 'loyalty', 'promo', 'cashback_bonus'] as const;
const CATEGORY_MAPPING: Record<string, string[]> = {
  dining: ['restaurant', 'cafe', 'food', 'dining', 'meal'],
  groceries: ['grocery', 'supermarket', 'mart', 'store'],
  entertainment: ['movie', 'cinema', 'entertainment', 'game', 'ticket'],
  shopping: ['shop', 'retail', 'mall', 'store', 'fashion'],
  travel: ['travel', 'flight', 'hotel', 'booking', 'trip'],
  health: ['pharmacy', 'health', 'medical', 'fitness'],
  utilities: ['utility', 'bill', 'recharge', 'payment'],
};

const SAVINGS_TIPS = [
  { category: 'dining', tip: 'Use REZ cashback at partner restaurants for up to 20% savings', threshold: 500 },
  { category: 'groceries', tip: 'Shop at REZ partner supermarkets for bonus cashback on groceries', threshold: 1000 },
  { category: 'entertainment', tip: 'Book movie tickets through REZ for extra cashback rewards', threshold: 300 },
  { category: 'shopping', tip: 'Check REZ deals before major shopping festivals for maximum savings', threshold: 2000 },
  { category: 'travel', tip: 'Plan your trips with REZ travel partners for accumulated savings', threshold: 5000 },
  { category: 'referral', tip: 'Refer friends to earn ₹500+ in referral bonuses', threshold: 100 },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────────

function generateEntryId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDayStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Core Savings Operations ─────────────────────────────────────────────────────

/**
 * Record a new savings entry (called internally when earning cashback/rewards)
 */
export async function recordSavings(params: {
  userId: string;
  type: typeof SAVINGS_TYPES[number];
  amount: number;
  source: string;
  description: string;
  originalAmount?: number;
  savingsPercentage?: number;
  category?: string;
  merchantId?: string;
  transactionId?: string;
}): Promise<ISavingsEntry> {
  const { userId, type, amount, source, description, originalAmount, savingsPercentage, category, merchantId } = params;

  const entry = new SavingsEntry({
    userId,
    entryId: generateEntryId('sav'),
    type,
    amount,
    source,
    description,
    originalAmount,
    savingsPercentage,
    category,
    merchantId,
  });

  await entry.save();

  // Update summary asynchronously
  updateSavingsSummary(userId).catch((err) => {
    logger.warn('Failed to update savings summary', { userId, error: err.message });
  });

  // Update streak
  updateSavingsStreak(userId, amount).catch((err) => {
    logger.warn('Failed to update savings streak', { userId, error: err.message });
  });

  // Generate insights
  generateSavingsInsights(userId).catch((err) => {
    logger.warn('Failed to generate savings insights', { userId, error: err.message });
  });

  logger.info('Savings entry recorded', { userId, type, amount, source });
  return entry;
}

/**
 * Get savings summary for a user
 */
export async function getSavingsSummary(userId: string): Promise<{
  totalSavings: number;
  totalSavingsAmount: number;
  thisMonth: number;
  thisMonthAmount: number;
  lastMonth: number;
  thisWeek: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  averageSavingsPerTransaction: number;
  transactionCount: number;
}> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const weekStart = getWeekStart(now);

  // Try to get from summary cache first
  const cachedSummary = await UserSavingsSummary.findOne({ userId }).lean();
  if (cachedSummary) {
    const rate = await getDynamicConversionRate();
    return {
      totalSavings: cachedSummary.totalSavings,
      totalSavingsAmount: cachedSummary.totalSavingsAmount,
      thisMonth: cachedSummary.thisMonth,
      thisMonthAmount: cachedSummary.thisMonthAmount,
      lastMonth: cachedSummary.lastMonth,
      thisWeek: cachedSummary.thisWeek,
      byType: {
        cashback: cachedSummary.cashbackTotal,
        reward: cachedSummary.rewardTotal,
        referral: cachedSummary.referralTotal,
        loyalty: cachedSummary.loyaltyTotal,
        promo: cachedSummary.promoTotal,
      },
      byCategory: {},
      averageSavingsPerTransaction: cachedSummary.averageSavingsPerTransaction,
      transactionCount: cachedSummary.transactionCount,
    };
  }

  // Calculate from scratch
  const [entries, totals] = await Promise.all([
    SavingsEntry.find({ userId }).sort({ createdAt: -1 }).limit(1000).lean(),
    SavingsEntry.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          byType: { $push: { type: '$type', amount: '$amount' } },
        },
      },
    ]),
  ]);

  const total = totals[0] || { total: 0, count: 0, byType: [] };
  const thisMonthEntries = entries.filter((e) => new Date(e.createdAt) >= monthStart);
  const lastMonthEntries = entries.filter(
    (e) => new Date(e.createdAt) >= lastMonthStart && new Date(e.createdAt) <= lastMonthEnd,
  );
  const weekEntries = entries.filter((e) => new Date(e.createdAt) >= weekStart);

  const thisMonth = thisMonthEntries.reduce((sum, e) => sum + (e.amount || 0), 0);
  const lastMonth = lastMonthEntries.reduce((sum, e) => sum + (e.amount || 0), 0);
  const thisWeek = weekEntries.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Group by type
  const byType: Record<string, number> = {};
  const byTypeRaw = totals[0]?.byType || [];
  for (const item of byTypeRaw) {
    byType[item.type] = (byType[item.type] || 0) + item.amount;
  }

  const rate = await getDynamicConversionRate();
  return {
    totalSavings: total.total || 0,
    totalSavingsAmount: (total.total || 0) * rate,
    thisMonth,
    thisMonthAmount: thisMonth * rate,
    lastMonth,
    thisWeek,
    byType,
    byCategory: {},
    averageSavingsPerTransaction: total.count > 0 ? total.total / total.count : 0,
    transactionCount: total.count || 0,
  };
}

/**
 * Update savings summary (called after new savings entry)
 */
async function updateSavingsSummary(userId: string): Promise<void> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const weekStart = getWeekStart(now);

  const aggregates = await SavingsEntry.aggregate([
    { $match: { userId: new Types.ObjectId(userId) } },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 },
              cashback: { $sum: { $cond: [{ $eq: ['$type', 'cashback'] }, '$amount', 0] } },
              reward: { $sum: { $cond: [{ $eq: ['$type', 'reward'] }, '$amount', 0] } },
              referral: { $sum: { $cond: [{ $eq: ['$type', 'referral'] }, '$amount', 0] } },
              loyalty: { $sum: { $cond: [{ $eq: ['$type', 'loyalty'] }, '$amount', 0] } },
              promo: { $sum: { $cond: [{ $eq: ['$type', 'promo'] }, '$amount', 0] } },
            },
          },
        ],
        thisMonth: [
          { $match: { createdAt: { $gte: monthStart } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ],
        lastMonth: [
          { $match: { createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ],
        thisWeek: [
          { $match: { createdAt: { $gte: weekStart } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ],
        bestDay: [
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              total: { $sum: '$amount' },
            },
          },
          { $sort: { total: -1 } },
          { $limit: 1 },
        ],
        bestMonth: [
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              total: { $sum: '$amount' },
            },
          },
          { $sort: { total: -1 } },
          { $limit: 1 },
        ],
      },
    },
  ]);

  const data = aggregates[0];
  const totals = data.totals[0] || { total: 0, count: 0, cashback: 0, reward: 0, referral: 0, loyalty: 0, promo: 0 };
  const rate = await getDynamicConversionRate();

  await UserSavingsSummary.findOneAndUpdate(
    { userId },
    {
      $set: {
        totalSavings: totals.total,
        totalSavingsAmount: totals.total * rate,
        thisMonth: data.thisMonth[0]?.total || 0,
        thisMonthAmount: (data.thisMonth[0]?.total || 0) * rate,
        lastMonth: data.lastMonth[0]?.total || 0,
        lastMonthAmount: (data.lastMonth[0]?.total || 0) * rate,
        thisWeek: data.thisWeek[0]?.total || 0,
        thisWeekAmount: (data.thisWeek[0]?.total || 0) * rate,
        cashbackTotal: totals.cashback,
        rewardTotal: totals.reward,
        referralTotal: totals.referral,
        loyaltyTotal: totals.loyalty,
        promoTotal: totals.promo,
        transactionCount: totals.count,
        averageSavingsPerTransaction: totals.count > 0 ? totals.total / totals.count : 0,
        bestSavingsDay: data.bestDay[0]
          ? { date: new Date(data.bestDay[0]._id), amount: data.bestDay[0].total }
          : null,
        bestSavingsMonth: data.bestMonth[0]
          ? { month: `${data.bestMonth[0]._id.year}-${String(data.bestMonth[0]._id.month).padStart(2, '0')}`, amount: data.bestMonth[0].total }
          : null,
        lastUpdated: now,
      },
    },
    { upsert: true },
  );
}

// ─── Savings Streak ────────────────────────────────────────────────────────────

/**
 * Update savings streak when user earns savings
 */
async function updateSavingsStreak(userId: string, amount: number): Promise<ISavingsStreak> {
  const today = getDayStart(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const streakDoc = await SavingsStreak.findOne({ userId }).lean();

  if (!streakDoc) {
    // Create new streak
    const newStreak = await SavingsStreak.create({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastSavingsDate: today,
      totalStreakDays: 1,
      streakActive: true,
      streakHistory: [{ date: today, amount, streakDay: 1 }],
    });
    return newStreak.toObject() as unknown as ISavingsStreak;
  }

  const streak = streakDoc;

  const lastDate = getDayStart(new Date(streak.lastSavingsDate));
  const isConsecutive = lastDate.getTime() === yesterday.getTime();
  const isSameDay = lastDate.getTime() === today.getTime();

  let newStreak: number;
  let newLongest: number;
  let totalDays: number;

  if (isSameDay) {
    // Same day - just update amount in history
    const historyEntry = streak.streakHistory.find(
      (h) => getDayStart(new Date(h.date)).getTime() === today.getTime(),
    );
    if (historyEntry) {
      historyEntry.amount += amount;
    }
    newStreak = streak.currentStreak;
    newLongest = streak.longestStreak;
    totalDays = streak.totalStreakDays;
  } else if (isConsecutive) {
    // Consecutive day
    newStreak = streak.currentStreak + 1;
    newLongest = Math.max(streak.longestStreak, newStreak);
    totalDays = streak.totalStreakDays + 1;
  } else {
    // Streak broken - start fresh
    newStreak = 1;
    newLongest = streak.longestStreak;
    totalDays = streak.totalStreakDays + 1;
  }

  const updated = await SavingsStreak.findOneAndUpdate(
    { userId },
    {
      $set: {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastSavingsDate: today,
        totalStreakDays: totalDays,
        streakHistory: streak.streakHistory.slice(-365), // Keep 1 year of history
      },
    },
    { new: true },
  ).lean();

  return updated as unknown as ISavingsStreak;
}

/**
 * Get savings streak info
 */
export async function getSavingsStreak(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  totalStreakDays: number;
  lastSavingsDate: Date | null;
  streakActive: boolean; // True if streak is still going
  daysUntilStreakLost: number; // 0 if already lost, 1 if needs savings today
}> {
  const streak = await SavingsStreak.findOne({ userId }).lean();

  if (!streak) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalStreakDays: 0,
      lastSavingsDate: null,
      streakActive: false,
      daysUntilStreakLost: 0,
    };
  }

  const today = getDayStart(new Date());
  const lastDate = getDayStart(new Date(streak.lastSavingsDate));
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = lastDate.getTime() === today.getTime();
  const isYesterday = lastDate.getTime() === yesterday.getTime();

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    totalStreakDays: streak.totalStreakDays,
    lastSavingsDate: streak.lastSavingsDate,
    streakActive: isToday || isYesterday,
    daysUntilStreakLost: isYesterday ? 1 : 0,
  };
}

// ─── Savings Projection ────────────────────────────────────────────────────────

/**
 * Calculate savings projections based on historical data
 */
export async function getSavingsProjection(userId: string): Promise<ISavingsProjection> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // Get historical data
  const [thirtyDayTotal, ninetyDayTotal, yearlyTotal, recentEntries, oldEntries] = await Promise.all([
    SavingsEntry.aggregate([
      { $match: { userId: new Types.ObjectId(userId), createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    SavingsEntry.aggregate([
      { $match: { userId: new Types.ObjectId(userId), createdAt: { $gte: ninetyDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    SavingsEntry.aggregate([
      { $match: { userId: new Types.ObjectId(userId), createdAt: { $gte: oneYearAgo } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    SavingsEntry.find({ userId, createdAt: { $gte: thirtyDaysAgo } })
      .sort({ createdAt: 1 })
      .limit(30)
      .lean(),
    SavingsEntry.find({ userId, createdAt: { $lt: thirtyDaysAgo, $gte: ninetyDaysAgo } })
      .sort({ createdAt: 1 })
      .limit(30)
      .lean(),
  ]);

  const recent30Days = thirtyDayTotal[0]?.total || 0;
  const recent90Days = ninetyDayTotal[0]?.total || 0;
  const recentYear = yearlyTotal[0]?.total || 0;

  // Calculate daily average
  const recentDays = recentEntries.length > 0 ? 30 : Math.max(1, Math.floor((Date.now() - new Date(recentEntries[0]?.createdAt).getTime()) / 86400000));
  const oldDays = oldEntries.length > 0 ? 60 : 60;

  const recentDailyAvg = recent30Days / recentDays;
  const oldDailyAvg = recent90Days > recent30Days ? (recent90Days - recent30Days) / oldDays : recentDailyAvg;

  // Calculate trend
  const trendDirection: 'increasing' | 'decreasing' | 'stable' =
    recentDailyAvg > oldDailyAvg * 1.1 ? 'increasing' :
    recentDailyAvg < oldDailyAvg * 0.9 ? 'decreasing' : 'stable';

  // Project
  const monthlyAvg = recent30Days || (recent90Days / 3);
  const projected30 = recent30Days * 1; // Already 30 days
  const projected90 = monthlyAvg * 3;
  const projected365 = monthlyAvg * 12;

  const projection = await SavingsProjection.findOneAndUpdate(
    { userId },
    {
      $set: {
        projectedAmount30Days: Math.round(projected30),
        projectedAmount90Days: Math.round(projected90),
        projectedAmount365Days: Math.round(projected365),
        monthlyAverage: Math.round(monthlyAvg),
        savingsRate: Math.round(recentDailyAvg * 100) / 100,
        trendDirection,
        basedOnDays: recentDays,
        calculatedAt: new Date(),
      },
    },
    { new: true, upsert: true },
  );

  return projection;
}

// ─── Savings Insights ─────────────────────────────────────────────────────────

/**
 * Generate personalized savings insights
 */
async function generateSavingsInsights(userId: string): Promise<void> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
  const sixtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);

  // Get category breakdown
  const categoryBreakdown = await SavingsEntry.aggregate([
    { $match: { userId: new Types.ObjectId(userId), category: { $exists: true, $ne: null } } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
    { $limit: 5 },
  ]);

  // Get comparison with last period
  const [recentTotal, oldTotal] = await Promise.all([
    SavingsEntry.aggregate([
      { $match: { userId: new Types.ObjectId(userId), createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    SavingsEntry.aggregate([
      { $match: { userId: new Types.ObjectId(userId), createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const recent = recentTotal[0]?.total || 0;
  const old = oldTotal[0]?.total || 0;
  const comparisonPercent = old > 0 ? ((recent - old) / old) * 100 : 0;

  // Get best savings day
  const bestDay = await SavingsEntry.aggregate([
    { $match: { userId: new Types.ObjectId(userId) } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 1 },
  ]);

  // Get average per transaction
  const avgCalc = await SavingsEntry.aggregate([
    { $match: { userId: new Types.ObjectId(userId) } },
    { $group: { _id: null, avg: { $avg: '$amount' }, count: { $sum: 1 } } },
  ]);

  // Generate insights
  const insights: Partial<ISavingsInsight>[] = [];

  // Best category insight
  if (categoryBreakdown.length > 0) {
    const best = categoryBreakdown[0];
    insights.push({
      userId,
      insightType: 'best_category',
      title: `Your top savings category: ${best._id}`,
      description: `You've saved ₹${(best.total / 100).toFixed(0)} from ${best._id} spending`,
      value: best.total,
      category: best._id,
      actionable: true,
      actionText: `Explore more ${best._id} deals`,
    });
  }

  // Savings trend insight
  const trendText =
    comparisonPercent > 20 ? 'Your savings are growing! 🎉' :
    comparisonPercent > 0 ? 'Keep it up! Your savings are increasing.' :
    comparisonPercent < -20 ? 'Try to save more this month' :
    'Your savings are stable';

  insights.push({
    userId,
    insightType: 'savings_trend',
    title: trendText,
    description: `You've saved ${comparisonPercent >= 0 ? 'more' : 'less'} this month compared to last month`,
    value: recent,
    comparison: old,
    comparisonPercent: Math.round(comparisonPercent),
  });

  // Average savings insight
  const avgSavings = avgCalc[0]?.avg || 0;
  insights.push({
    userId,
    insightType: 'average_savings',
    title: 'Average savings per transaction',
    description: `You save ₹${(avgSavings / 100).toFixed(0)} on average per transaction`,
    value: avgSavings,
  });

  // Best day insight
  if (bestDay.length > 0) {
    insights.push({
      userId,
      insightType: 'peak_savings_day',
      title: 'Best savings day',
      description: `Your highest savings day was ${bestDay[0]._id}`,
      value: bestDay[0].total,
    });
  }

  // Potential savings insight
  const potentialSavings = calculatePotentialSavings(userId, categoryBreakdown);
  if (potentialSavings > 0) {
    insights.push({
      userId,
      insightType: 'potential_savings',
      title: 'Potential additional savings',
      description: `You could save up to ₹${(potentialSavings / 100).toFixed(0)} more by exploring partner deals`,
      value: potentialSavings,
      actionable: true,
      actionText: 'See recommendations',
    });
  }

  // Upsert insights
  for (const insight of insights) {
    await SavingsInsight.findOneAndUpdate(
      { userId, insightType: insight.insightType },
      { $set: insight },
      { upsert: true },
    );
  }
}

/**
 * Calculate potential savings based on user behavior
 */
function calculatePotentialSavings(userId: string, categoryBreakdown: Array<{_id: string; total: number}>): number {
  // Estimate based on category spending patterns
  let potential = 0;
  const categorySpendEstimate: Record<string, number> = {
    dining: 2000,
    groceries: 3000,
    entertainment: 1000,
    shopping: 5000,
    travel: 2000,
    health: 500,
    utilities: 1000,
  };

  for (const category of categoryBreakdown) {
    const estimatedSpend = categorySpendEstimate[category._id] || 1000;
    const currentSavings = category.total;
    const potentialRate = 0.15; // 15% potential savings rate
    const potentialAmount = estimatedSpend * potentialRate;
    potential += Math.max(0, potentialAmount - currentSavings);
  }

  return Math.round(potential);
}

/**
 * Get all insights for a user
 */
export async function getSavingsInsights(userId: string): Promise<ISavingsInsight[]> {
  const insights = await SavingsInsight.find({ userId }).sort({ insightType: 1 }).lean();
  return insights as unknown as ISavingsInsight[];
}

// ─── Savings Goals ─────────────────────────────────────────────────────────────

/**
 * Create a savings goal
 */
export async function createSavingsGoal(params: {
  userId: string;
  name: string;
  targetAmount: number;
  targetDate?: Date;
  category?: string;
  icon?: string;
  color?: string;
}): Promise<ISavingsGoal> {
  const goal = await SavingsGoal.create({
    userId: params.userId,
    goalId: generateEntryId('goal'),
    name: params.name,
    targetAmount: params.targetAmount,
    targetDate: params.targetDate,
    category: params.category,
    icon: params.icon || '🎯',
    color: params.color || '#4CAF50',
  });

  logger.info('Savings goal created', { userId: params.userId, goalId: goal.goalId, name: params.name });
  return goal;
}

/**
 * Get all savings goals for a user
 */
export async function getSavingsGoals(userId: string): Promise<ISavingsGoal[]> {
  const goals = await SavingsGoal.find({ userId }).sort({ isCompleted: 1, createdAt: -1 }).lean();
  return goals as unknown as ISavingsGoal[];
}

/**
 * Update savings goal progress
 */
export async function updateSavingsGoalProgress(
  userId: string,
  goalId: string,
  amount: number,
): Promise<ISavingsGoal | null> {
  const goal = await SavingsGoal.findOne({ userId, goalId });

  if (!goal) return null;

  goal.currentAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);

  if (goal.currentAmount >= goal.targetAmount && !goal.isCompleted) {
    goal.isCompleted = true;
    goal.completedAt = new Date();
  }

  await goal.save();
  return goal;
}

/**
 * Delete a savings goal
 */
export async function deleteSavingsGoal(userId: string, goalId: string): Promise<boolean> {
  const result = await SavingsGoal.deleteOne({ userId, goalId });
  return result.deletedCount > 0;
}

// ─── Savings History ────────────────────────────────────────────────────────────

/**
 * Get savings history with pagination
 */
export async function getSavingsHistory(
  userId: string,
  page: number = 1,
  limit: number = 20,
  filters?: {
    type?: typeof SAVINGS_TYPES[number];
    category?: string;
    startDate?: Date;
    endDate?: Date;
  },
): Promise<{
  entries: ISavingsEntry[];
  total: number;
  page: number;
  hasMore: boolean;
}> {
  const query: Record<string, unknown> = { userId };

  if (filters?.type) {
    query.type = filters.type;
  }
  if (filters?.category) {
    query.category = filters.category;
  }
  if (filters?.startDate || filters?.endDate) {
    query.createdAt = {};
    if (filters.startDate) (query.createdAt as Record<string, Date>).$gte = filters.startDate;
    if (filters.endDate) (query.createdAt as Record<string, Date>).$lte = filters.endDate;
  }

  const [entries, total] = await Promise.all([
    SavingsEntry.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    SavingsEntry.countDocuments(query),
  ]);

  return {
    entries: entries as unknown as ISavingsEntry[],
    total,
    page,
    hasMore: page * limit < total,
  };
}

// ─── Savings Recommendations ────────────────────────────────────────────────────

export interface SavingsRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  potentialSavings: number;
  icon: string;
  actionText: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Get personalized savings recommendations
 */
export async function getSavingsRecommendations(userId: string): Promise<SavingsRecommendation[]> {
  const summary = await getSavingsSummary(userId);
  const streak = await getSavingsStreak(userId);
  const goals = await getSavingsGoals(userId);

  const recommendations: SavingsRecommendation[] = [];
  const rate = await getDynamicConversionRate();

  // Streak-based recommendations
  if (streak.daysUntilStreakLost === 1) {
    recommendations.push({
      id: 'streak-save-today',
      category: 'streak',
      title: 'Keep your savings streak alive!',
      description: `You've saved ${streak.currentStreak} days in a row. Make a purchase today to keep your streak going!`,
      potentialSavings: 50,
      icon: '🔥',
      actionText: 'Earn savings today',
      priority: 'high',
    });
  }

  // Goal-based recommendations
  const activeGoals = goals.filter((g) => !g.isCompleted);
  for (const goal of activeGoals) {
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining > 0) {
      recommendations.push({
        id: `goal-${goal.goalId}`,
        category: 'goal',
        title: `Save for ${goal.name}`,
        description: `You're ${Math.round((goal.currentAmount / goal.targetAmount) * 100)}% of the way to your goal. Just ₹${(remaining * rate / 100).toFixed(0)} more to go!`,
        potentialSavings: remaining,
        icon: goal.icon || '🎯',
        actionText: 'Add to goal',
        priority: remaining < goal.targetAmount * 0.2 ? 'high' : 'medium',
      });
    }
  }

  // Category-based recommendations
  const categoryTips: Record<string, { title: string; tip: string; icon: string; savings: number }> = {
    dining: {
      title: 'Save more on dining',
      tip: 'Use REZ at partner restaurants for up to 20% cashback',
      icon: '🍽️',
      savings: 500,
    },
    groceries: {
      title: 'Maximize grocery savings',
      tip: 'Shop at REZ partner supermarkets for bonus cashback',
      icon: '🛒',
      savings: 300,
    },
    entertainment: {
      title: 'Entertainment deals',
      tip: 'Book movie tickets and events through REZ for extra rewards',
      icon: '🎬',
      savings: 200,
    },
    shopping: {
      title: 'Shopping rewards',
      tip: 'Check REZ deals before major shopping festivals',
      icon: '🛍️',
      savings: 1000,
    },
    travel: {
      title: 'Travel savings',
      tip: 'Plan trips with REZ travel partners for accumulated savings',
      icon: '✈️',
      savings: 2000,
    },
    referral: {
      title: 'Earn with referrals',
      tip: 'Refer friends to earn ₹500+ in referral bonuses',
      icon: '👥',
      savings: 500,
    },
  };

  // Check which categories user could benefit from
  for (const [category, info] of Object.entries(categoryTips)) {
    if (!summary.byType[category] || summary.byType[category] < 200) {
      recommendations.push({
        id: `category-${category}`,
        category,
        title: info.title,
        description: info.tip,
        potentialSavings: info.savings,
        icon: info.icon,
        actionText: 'Start saving',
        priority: summary.byType[category] ? 'low' : 'medium',
      });
    }
  }

  // Monthly savings boost recommendation
  if (summary.lastMonth > 0) {
    const monthlyIncrease = ((summary.thisMonth - summary.lastMonth) / summary.lastMonth) * 100;
    if (monthlyIncrease < 10) {
      recommendations.push({
        id: 'monthly-boost',
        category: 'growth',
        title: 'Boost your monthly savings',
        description: `Try to increase your monthly savings by just ₹${Math.round(summary.lastMonth * 0.1 / 100)}. Small increases add up!`,
        potentialSavings: Math.round(summary.lastMonth * 0.1),
        icon: '📈',
        actionText: 'Set a target',
        priority: 'medium',
      });
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations.slice(0, 5); // Return top 5 recommendations
}

// ─── Savings Dashboard Summary ─────────────────────────────────────────────────

export interface SavingsDashboard {
  totalSavings: number;
  totalSavingsAmount: number;
  thisMonth: number;
  thisMonthAmount: number;
  thisMonthVsLastMonth: number;
  currentStreak: number;
  streakActive: boolean;
  projection30Days: number;
  projection90Days: number;
  projection365Days: number;
  goalProgress: Array<{
    goalId: string;
    name: string;
    current: number;
    target: number;
    percent: number;
    icon: string;
  }>;
  topCategories: Array<{
    category: string;
    amount: number;
  }>;
  recommendations: SavingsRecommendation[];
  insights: ISavingsInsight[];
}

export async function getSavingsDashboard(userId: string): Promise<SavingsDashboard> {
  const [summary, streak, projection, goals, recommendations, insights] = await Promise.all([
    getSavingsSummary(userId),
    getSavingsStreak(userId),
    getSavingsProjection(userId),
    getSavingsGoals(userId),
    getSavingsRecommendations(userId),
    getSavingsInsights(userId),
  ]);

  const rate = await getDynamicConversionRate();

  // Calculate month comparison
  const thisMonthVsLastMonth = summary.lastMonth > 0
    ? Math.round(((summary.thisMonth - summary.lastMonth) / summary.lastMonth) * 100)
    : 0;

  return {
    totalSavings: summary.totalSavings,
    totalSavingsAmount: summary.totalSavingsAmount,
    thisMonth: summary.thisMonth,
    thisMonthAmount: summary.thisMonthAmount,
    thisMonthVsLastMonth,
    currentStreak: streak.currentStreak,
    streakActive: streak.streakActive,
    projection30Days: projection.projectedAmount30Days,
    projection90Days: projection.projectedAmount90Days,
    projection365Days: projection.projectedAmount365Days,
    goalProgress: goals
      .filter((g) => !g.isCompleted)
      .slice(0, 3)
      .map((g) => ({
        goalId: g.goalId,
        name: g.name,
        current: g.currentAmount,
        target: g.targetAmount,
        percent: Math.round((g.currentAmount / g.targetAmount) * 100),
        icon: g.icon || '🎯',
      })),
    topCategories: [], // Would need category aggregation
    recommendations,
    insights: insights as ISavingsInsight[],
  };
}

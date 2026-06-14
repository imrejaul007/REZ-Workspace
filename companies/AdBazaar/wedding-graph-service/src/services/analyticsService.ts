import { Wedding } from '../models/Wedding';
import { Guest } from '../models/Guest';
import { Vendor } from '../models/Vendor';
import { WeddingAnalytics, Campaign } from '../models/WeddingAnalytics';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

export interface AnalyticsResponse {
  weddingId: string;
  period: {
    start: Date;
    end: Date;
  };
  guestAnalytics: {
    totalGuests: number;
    confirmedGuests: number;
    pendingRsvps: number;
    declinedGuests: number;
    tentativeGuests: number;
    attendanceRate: number;
    plusOnes: number;
    dietaryBreakdown: Record<string, number>;
    categoryBreakdown: Record<string, number>;
    giftMetrics: {
      totalGifts: number;
      giftValue: number;
      avgGiftValue: number;
    };
  };
  budgetAnalytics: {
    totalBudget: number;
    totalSpent: number;
    remainingBudget: number;
    budgetUtilization: number;
    categorySpending: Record<string, number>;
    projectedTotal: number;
    budgetHealth: 'on_track' | 'over_budget' | 'under_budget';
  };
  vendorAnalytics: {
    totalVendors: number;
    bookedVendors: number;
    pendingVendors: number;
    totalVendorSpend: number;
    categoryBreakdown: Record<string, { count: number; spend: number }>;
    paymentStatus: Record<string, number>;
  };
  timelineAnalytics: {
    daysUntilWedding: number;
    planningProgress: number;
    tasksCompleted: number;
    criticalPathItems: string[];
  };
  locationInsights: {
    venueCity: string;
    guestDistribution: { city: string; count: number; percentage: number }[];
    travelRequired: number;
  };
  engagementScore: number;
  recommendations: string[];
}

class AnalyticsService {
  /**
   * Get comprehensive wedding analytics
   */
  async getWeddingAnalytics(weddingId: string): Promise<AnalyticsResponse | null> {
    try {
      const wedding = await Wedding.findOne({ weddingId });
      if (!wedding) return null;

      // Gather all analytics in parallel
      const [guestAnalytics, vendorAnalytics, locationInsights] = await Promise.all([
        this.getGuestAnalytics(weddingId, wedding.guestCount),
        this.getVendorAnalytics(weddingId),
        this.getLocationInsights(weddingId)
      ]);

      const budgetAnalytics = this.getBudgetAnalytics(wedding);
      const timelineAnalytics = this.getTimelineAnalytics(wedding);
      const engagementScore = this.calculateEngagementScore(wedding, guestAnalytics);

      const recommendations = this.generateRecommendations(
        wedding,
        budgetAnalytics,
        guestAnalytics,
        vendorAnalytics
      );

      return {
        weddingId,
        period: {
          start: wedding.createdAt,
          end: wedding.weddingDate
        },
        guestAnalytics,
        budgetAnalytics,
        vendorAnalytics,
        timelineAnalytics,
        locationInsights,
        engagementScore,
        recommendations
      };
    } catch (error) {
      logger.error('Error getting wedding analytics:', error);
      throw error;
    }
  }

  /**
   * Get guest analytics
   */
  private async getGuestAnalytics(weddingId: string, guestCount: any): Promise<any> {
    const guestStats = await Guest.aggregate([
      { $match: { weddingId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          withPlusOne: { $sum: { $cond: ['$plusOne', 1, 0] } },
          sendingGift: { $sum: { $cond: ['$sendingGift', 1, 0] } },
          totalGiftAmount: { $sum: { $cond: ['$giftAmount', '$giftAmount', 0] } },
          vegetarian: { $sum: { $cond: ['$dietary.vegetarian', 1, 0] } },
          vegan: { $sum: { $cond: ['$dietary.vegan', 1, 0] } },
          glutenFree: { $sum: { $cond: ['$dietary.glutenFree', 1, 0] } },
          halal: { $sum: { $cond: ['$dietary.halal', 1, 0] } },
          kosher: { $sum: { $cond: ['$dietary.kosher', 1, 0] } },
          familyCount: { $sum: { $cond: [{ $eq: ['$category', 'family'] }, 1, 0] } },
          friendCount: { $sum: { $cond: [{ $eq: ['$category', 'friend'] }, 1, 0] } },
          colleagueCount: { $sum: { $cond: [{ $eq: ['$category', 'colleague'] }, 1, 0] } }
        }
      }
    ]);

    const stats = guestStats[0] || {
      total: 0,
      withPlusOne: 0,
      sendingGift: 0,
      totalGiftAmount: 0
    };

    return {
      totalGuests: stats.total,
      confirmedGuests: guestCount?.confirmed || 0,
      pendingRsvps: guestCount?.expected - guestCount?.confirmed - guestCount?.declined || 0,
      declinedGuests: guestCount?.declined || 0,
      tentativeGuests: guestCount?.tentative || 0,
      attendanceRate: guestCount?.expected > 0
        ? ((guestCount?.confirmed || 0) / guestCount?.expected) * 100
        : 0,
      plusOnes: stats.withPlusOne,
      dietaryBreakdown: {
        vegetarian: stats.vegetarian,
        vegan: stats.vegan,
        glutenFree: stats.glutenFree,
        halal: stats.halal,
        kosher: stats.kosher
      },
      categoryBreakdown: {
        family: stats.familyCount,
        friends: stats.friendCount,
        colleagues: stats.colleagueCount
      },
      giftMetrics: {
        totalGifts: stats.sendingGift,
        giftValue: stats.totalGiftAmount,
        avgGiftValue: stats.sendingGift > 0 ? stats.totalGiftAmount / stats.sendingGift : 0
      }
    };
  }

  /**
   * Get vendor analytics
   */
  private async getVendorAnalytics(weddingId: string): Promise<any> {
    const vendorStats = await Vendor.aggregate([
      { $match: { weddingId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          booked: { $sum: { $cond: ['$booked', 1, 0] } },
          totalSpend: { $sum: '$price.amount' },
          byCategory: {
            $push: {
              category: '$category',
              amount: '$price.amount',
              booked: '$booked'
            }
          },
          byStatus: {
            $push: {
              status: '$status',
              amount: '$price.amount'
            }
          }
        }
      }
    ]);

    const stats = vendorStats[0] || { total: 0, booked: 0, totalSpend: 0 };

    // Process category breakdown
    const categoryBreakdown: Record<string, { count: number; spend: number }> = {};
    const statusBreakdown: Record<string, number> = {};

    stats.byCategory?.forEach((v: any) => {
      if (!categoryBreakdown[v.category]) {
        categoryBreakdown[v.category] = { count: 0, spend: 0 };
      }
      categoryBreakdown[v.category].count++;
      categoryBreakdown[v.category].spend += v.amount;
    });

    stats.byStatus?.forEach((v: any) => {
      statusBreakdown[v.status] = (statusBreakdown[v.status] || 0) + 1;
    });

    return {
      totalVendors: stats.total,
      bookedVendors: stats.booked,
      pendingVendors: stats.total - stats.booked,
      totalVendorSpend: stats.totalSpend,
      categoryBreakdown,
      paymentStatus: statusBreakdown
    };
  }

  /**
   * Get budget analytics
   */
  private getBudgetAnalytics(wedding: any): any {
    const total = wedding.budget?.total || 0;
    const spent = wedding.budget?.spent || 0;
    const remaining = total - spent;
    const utilization = total > 0 ? (spent / total) * 100 : 0;

    // Project final spend based on current trajectory
    const daysUntilWedding = Math.max(
      1,
      Math.ceil((wedding.weddingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );
    const daysPlanned = Math.ceil(
      (Date.now() - wedding.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const dailySpend = daysPlanned > 0 ? spent / daysPlanned : 0;
    const projectedTotal = spent + dailySpend * daysUntilWedding;

    return {
      totalBudget: total,
      totalSpent: spent,
      remainingBudget: remaining,
      budgetUtilization: utilization,
      categorySpending: wedding.budget?.breakdown || {},
      projectedTotal,
      budgetHealth: this.getBudgetHealth(utilization, projectedTotal, total)
    };
  }

  /**
   * Get budget health status
   */
  private getBudgetHealth(
    utilization: number,
    projected: number,
    total: number
  ): 'on_track' | 'over_budget' | 'under_budget' {
    if (projected > total * 1.1) return 'over_budget';
    if (projected < total * 0.8) return 'under_budget';
    return 'on_track';
  }

  /**
   * Get timeline analytics
   */
  private getTimelineAnalytics(wedding: any): any {
    const daysUntilWedding = Math.ceil(
      (wedding.weddingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Simple progress calculation based on vendors booked
    const planningProgress = wedding.status === 'completed' ? 100 :
      wedding.status === 'confirmed' ? 80 :
        wedding.status === 'in_progress' ? 50 :
          wedding.status === 'planning' ? 20 : 0;

    const criticalPathItems: string[] = [];

    if (daysUntilWedding < 30) {
      criticalPathItems.push('Finalize vendor bookings');
    }
    if (daysUntilWedding < 14) {
      criticalPathItems.push('Confirm guest final headcount');
      criticalPathItems.push('Final catering numbers');
    }
    if (daysUntilWedding < 7) {
      criticalPathItems.push('Day-of coordination');
      criticalPathItems.push('Final venue walkthrough');
    }

    return {
      daysUntilWedding,
      planningProgress,
      tasksCompleted: Math.round(planningProgress),
      criticalPathItems
    };
  }

  /**
   * Get location insights
   */
  private async getLocationInsights(weddingId: string): Promise<any> {
    const guests = await Guest.find({
      weddingId,
      'address.city': { $exists: true }
    }).select('address');

    const guestDistribution: Record<string, number> = {};

    guests.forEach((guest) => {
      const city = guest.address?.city || 'Unknown';
      guestDistribution[city] = (guestDistribution[city] || 0) + 1;
    });

    const totalGuests = Object.values(guestDistribution).reduce((a, b) => a + b, 0);

    const distribution = Object.entries(guestDistribution)
      .map(([city, count]) => ({
        city,
        count,
        percentage: totalGuests > 0 ? (count / totalGuests) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate travel required (guests not in venue city)
    const venueCityGuests = distribution.find(
      (d) => d.city.toLowerCase() === weddingId.split('-')[0].toLowerCase()
    )?.count || 0;

    return {
      venueCity: '', // Would be populated from wedding data
      guestDistribution: distribution.slice(0, 10),
      travelRequired: totalGuests - venueCityGuests
    };
  }

  /**
   * Calculate engagement score (0-100)
   */
  private calculateEngagementScore(wedding: any, guestAnalytics: any): number {
    let score = 50; // Base score

    // RSVP engagement (0-20 points)
    const rsvpRate = guestAnalytics.attendanceRate || 0;
    score += Math.min(20, rsvpRate * 0.2);

    // Gift engagement (0-15 points)
    const giftRate = guestAnalytics.totalGuests > 0
      ? (guestAnalytics.giftMetrics.totalGifts / guestAnalytics.totalGuests) * 100
      : 0;
    score += Math.min(15, giftRate * 0.15);

    // Budget tracking (0-15 points)
    if (wedding.budget?.total > 0) {
      const utilization = (wedding.budget.spent / wedding.budget.total) * 100;
      if (utilization >= 80 && utilization <= 100) {
        score += 15;
      } else if (utilization >= 60 && utilization <= 110) {
        score += 10;
      } else {
        score += 5;
      }
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Generate recommendations based on analytics
   */
  private generateRecommendations(
    wedding: any,
    budgetAnalytics: any,
    guestAnalytics: any,
    vendorAnalytics: any
  ): string[] {
    const recommendations: string[] = [];

    // Budget recommendations
    if (budgetAnalytics.budgetHealth === 'over_budget') {
      recommendations.push('Consider reviewing vendor contracts for potential savings');
      recommendations.push('Prioritize essential services over nice-to-haves');
    }

    // Guest recommendations
    const pendingPercent =
      guestAnalytics.totalGuests > 0
        ? (guestAnalytics.pendingRsvps / guestAnalytics.totalGuests) * 100
        : 0;

    if (pendingPercent > 30) {
      recommendations.push('Send reminders to guests with pending RSVPs');
      recommendations.push('Consider deadline for final headcount');
    }

    // Dietary recommendations
    const specialDietary =
      (guestAnalytics.dietaryBreakdown.vegan || 0) +
      (guestAnalytics.dietaryBreakdown.glutenFree || 0) +
      (guestAnalytics.dietaryBreakdown.halal || 0) +
      (guestAnalytics.dietaryBreakdown.kosher || 0);

    if (specialDietary > guestAnalytics.totalGuests * 0.1) {
      recommendations.push('Coordinate with caterer for special dietary requirements');
    }

    // Vendor recommendations
    if (vendorAnalytics.pendingVendors > 3) {
      recommendations.push('Consider booking remaining vendors soon');
    }

    // Timeline recommendations
    const daysUntil = Math.ceil(
      (wedding.weddingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil < 30 && vendorAnalytics.bookedVendors < 5) {
      recommendations.push('Urgent: Finalize key vendors within 2 weeks');
    }

    return recommendations;
  }

  /**
   * Record daily analytics snapshot
   */
  async recordDailySnapshot(weddingId: string): Promise<void> {
    try {
      const analytics = await this.getWeddingAnalytics(weddingId);
      if (!analytics) return;

      const snapshot = new WeddingAnalytics({
        weddingId,
        date: new Date(),
        dailyMetrics: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          reach: 0,
          engagement: { likes: 0, shares: 0, comments: 0, saves: 0 }
        },
        guestMetrics: {
          totalGuests: analytics.guestAnalytics.totalGuests,
          confirmedGuests: analytics.guestAnalytics.confirmedGuests,
          pendingRsvps: analytics.guestAnalytics.pendingRsvps,
          giftSenders: analytics.guestAnalytics.giftMetrics.totalGifts,
          avgGiftValue: analytics.guestAnalytics.giftMetrics.avgGiftValue
        },
        vendorMetrics: {
          bookedVendors: analytics.vendorAnalytics.bookedVendors,
          pendingBookings: analytics.vendorAnalytics.pendingVendors,
          totalVendorSpend: analytics.vendorAnalytics.totalVendorSpend
        },
        budgetMetrics: {
          totalBudget: analytics.budgetAnalytics.totalBudget,
          totalSpent: analytics.budgetAnalytics.totalSpent,
          projectedSpend: analytics.budgetAnalytics.projectedTotal,
          budgetUtilization: analytics.budgetAnalytics.budgetUtilization
        }
      });

      await snapshot.save();

      logger.info('Daily analytics snapshot recorded', { weddingId });
    } catch (error) {
      logger.error('Error recording daily snapshot:', error);
    }
  }

  /**
   * Get analytics history
   */
  async getAnalyticsHistory(
    weddingId: string,
    days: number = 30
  ): Promise<WeddingAnalytics[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      return await WeddingAnalytics.find({
        weddingId,
        date: { $gte: startDate }
      }).sort({ date: -1 });
    } catch (error) {
      logger.error('Error getting analytics history:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
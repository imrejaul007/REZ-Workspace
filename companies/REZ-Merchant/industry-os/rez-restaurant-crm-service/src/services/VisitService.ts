import { Visit, IVisit, IVisitItem } from '../models/Visit';
import { Customer } from '../models/Customer';
import { LOYALTY } from '../config/constants';

/**
 * FIX (security): Generate secure visit ID using crypto
 */
function generateVisitId(): string {
  try {
    const { randomUUID } = require('crypto');
    return `VISIT-${Date.now()}-${randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase()}`;
  } catch {
    return `VISIT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
}

export interface CreateVisitInput {
  customerId: string;
  orderId?: string;
  tableNumber?: string;
  staffMemberId?: string;
  visitDate?: Date;
  items: IVisitItem[];
  paymentMethod?: string;
  duration?: number;
  partySize?: number;
  loyaltyPointsRedeemed?: number;
}

export interface VisitFilters {
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export class VisitService {
  /**
   * Record a new customer visit and update customer stats
   */
  async recordVisit(input: CreateVisitInput): Promise<IVisit> {
    const session = await Customer.startSession();
    session.startTransaction();

    try {
      const customer = await Customer.findOne({ customerId: input.customerId }).session(session);
      if (!customer) {
        throw new Error('Customer not found');
      }

      const totalAmount = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const pointsRedeemed = input.loyaltyPointsRedeemed || 0;
      const pointsEarned = Math.floor((totalAmount / 100) - (pointsRedeemed * 100 / LOYALTY.pointsToRupeeRatio));

      const visit = new Visit({
        visitId: generateVisitId(),
        customerId: input.customerId,
        orderId: input.orderId,
        tableNumber: input.tableNumber,
        staffMemberId: input.staffMemberId,
        visitDate: input.visitDate || new Date(),
        items: input.items,
        totalAmount,
        loyaltyPointsEarned: Math.max(0, pointsEarned),
        loyaltyPointsRedeemed: pointsRedeemed,
        paymentMethod: input.paymentMethod || 'cash',
        duration: input.duration || 60,
        partySize: input.partySize || 1,
      });

      await visit.save({ session });

      // Update customer stats
      const now = new Date();
      await Customer.updateOne(
        { customerId: input.customerId },
        {
          $inc: {
            totalVisits: 1,
            totalSpend: totalAmount,
            lifetimeValue: totalAmount,
            loyaltyPoints: Math.max(0, pointsEarned),
          },
          $set: {
            lastVisitAt: visit.visitDate,
          },
          $setOnInsert: {
            firstVisitAt: visit.visitDate,
          },
        },
        { session }
      );

      await session.commitTransaction();
      return visit;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get visit by ID
   */
  async getVisitById(visitId: string): Promise<IVisit | null> {
    return Visit.findOne({ visitId });
  }

  /**
   * Get visit history for a customer
   */
  async getCustomerVisits(
    customerId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ visits: IVisit[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [visits, total] = await Promise.all([
      Visit.find({ customerId })
        .sort({ visitDate: -1 })
        .skip(skip)
        .limit(limit),
      Visit.countDocuments({ customerId }),
    ]);

    return {
      visits,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * List visits with filters
   */
  async listVisits(
    filters: VisitFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ visits: IVisit[]; total: number; page: number; totalPages: number }> {
    const query: Record<string, unknown> = {};

    if (filters.customerId) query.customerId = filters.customerId;

    if (filters.startDate || filters.endDate) {
      query.visitDate = {};
      if (filters.startDate) (query.visitDate as Record<string, Date>).$gte = filters.startDate;
      if (filters.endDate) (query.visitDate as Record<string, Date>).$lte = filters.endDate;
    }

    if (filters.minAmount || filters.maxAmount) {
      query.totalAmount = {};
      if (filters.minAmount) (query.totalAmount as Record<string, number>).$gte = filters.minAmount;
      if (filters.maxAmount) (query.totalAmount as Record<string, number>).$lte = filters.maxAmount;
    }

    const skip = (page - 1) * limit;

    const [visits, total] = await Promise.all([
      Visit.find(query).sort({ visitDate: -1 }).skip(skip).limit(limit),
      Visit.countDocuments(query),
    ]);

    return {
      visits,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Add feedback to a visit
   */
  async addFeedback(
    visitId: string,
    rating: number,
    comment?: string
  ): Promise<IVisit | null> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    return Visit.findOneAndUpdate(
      { visitId },
      {
        $set: {
          feedback: {
            rating,
            comment,
          },
        },
      },
      { new: true }
    );
  }

  /**
   * Get visit analytics
   */
  async getAnalytics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalVisits: number;
    totalRevenue: number;
    averageOrderValue: number;
    uniqueCustomers: number;
    averageVisitsPerDay: number;
    topItems: Array<{ itemId: string; itemName: string; quantity: number; revenue: number }>;
  }> {
    const match: Record<string, unknown> = {};
    if (startDate || endDate) {
      match.visitDate = {};
      if (startDate) (match.visitDate as Record<string, Date>).$gte = startDate;
      if (endDate) (match.visitDate as Record<string, Date>).$lte = endDate;
    }

    const [result] = await Visit.aggregate([
      { $match: match },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalVisits: { $sum: 1 },
                totalRevenue: { $sum: '$totalAmount' },
                uniqueCustomers: { $addToSet: '$customerId' },
              },
            },
            {
              $project: {
                totalVisits: 1,
                totalRevenue: 1,
                averageOrderValue: { $divide: ['$totalRevenue', '$totalVisits'] },
                uniqueCustomers: { $size: '$uniqueCustomers' },
              },
            },
          ],
          topItems: {
            $unwind: '$items',
          },
        },
      },
    ]);

    const summary = result.summary[0] || {
      totalVisits: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      uniqueCustomers: 0,
    };

    // Calculate top items
    const itemAggregation = await Visit.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: { itemId: '$items.itemId', itemName: '$items.itemName' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    const topItems = itemAggregation.map((item) => ({
      itemId: item._id.itemId,
      itemName: item._id.itemName,
      quantity: item.quantity,
      revenue: item.revenue,
    }));

    // Calculate average visits per day
    let avgVisitsPerDay = 0;
    if (startDate && endDate) {
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      avgVisitsPerDay = days > 0 ? summary.totalVisits / days : 0;
    }

    return {
      totalVisits: summary.totalVisits,
      totalRevenue: summary.totalRevenue,
      averageOrderValue: summary.averageOrderValue,
      uniqueCustomers: summary.uniqueCustomers,
      averageVisitsPerDay: Math.round(avgVisitsPerDay * 100) / 100,
      topItems,
    };
  }

  /**
   * Get customer frequency stats
   */
  async getCustomerFrequencyStats(customerId: string): Promise<{
    visitCount: number;
    averageDaysBetweenVisits: number;
    favoriteDayOfWeek: string;
    favoriteTimeOfDay: string;
  } | null> {
    const visits = await Visit.find({ customerId })
      .sort({ visitDate: 1 })
      .select('visitDate');

    if (visits.length === 0) return null;

    // Calculate average days between visits
    let totalDaysBetween = 0;
    for (let i = 1; i < visits.length; i++) {
      const daysDiff = Math.floor(
        (visits[i].visitDate.getTime() - visits[i - 1].visitDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      totalDaysBetween += daysDiff;
    }
    const averageDaysBetweenVisits = visits.length > 1
      ? totalDaysBetween / (visits.length - 1)
      : 0;

    // Find favorite day of week
    const dayCounts: Record<number, number> = {};
    visits.forEach((visit) => {
      const day = visit.visitDate.getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const favoriteDayOfWeek = days[Object.entries(dayCounts).reduce((a, b) =>
      (b[1] as number) > (a[1] as number) ? b : a
    )[0] as unknown as number]];

    // Find favorite time of day
    const hourCounts: Record<number, number> = {};
    visits.forEach((visit) => {
      const hour = visit.visitDate.getHours();
      if (hour < 12) hourCounts['morning'] = (hourCounts['morning'] || 0) + 1;
      else if (hour < 17) hourCounts['afternoon'] = (hourCounts['afternoon'] || 0) + 1;
      else if (hour < 21) hourCounts['evening'] = (hourCounts['evening'] || 0) + 1;
      else hourCounts['night'] = (hourCounts['night'] || 0) + 1;
    });
    const favoriteTimeOfDay = Object.entries(hourCounts).reduce((a, b) =>
      (b[1] as number) > (a[1] as number) ? b : a
    )[0];

    return {
      visitCount: visits.length,
      averageDaysBetweenVisits: Math.round(averageDaysBetweenVisits * 10) / 10,
      favoriteDayOfWeek,
      favoriteTimeOfDay,
    };
  }
}

export const visitService = new VisitService();

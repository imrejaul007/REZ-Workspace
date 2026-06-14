import { Performance, IPerformance, PerformancePeriod } from '../models';
import { Types } from 'mongoose';

export interface CreatePerformanceDTO {
  staffId: string;
  period: PerformancePeriod;
  date: Date;
  ordersServed?: number;
  avgTicketTime?: number;
  customerRating?: number;
  tips?: number;
  deductions?: number;
  bonus?: number;
}

export interface UpdatePerformanceDTO {
  ordersServed?: number;
  avgTicketTime?: number;
  customerRating?: number;
  tips?: number;
  deductions?: number;
  bonus?: number;
}

export interface PerformanceFilters {
  staffId?: string;
  period?: PerformancePeriod;
  startDate: Date;
  endDate: Date;
}

export interface StaffPerformanceSummary {
  staffId: string;
  totalOrders: number;
  avgTicketTime: number;
  avgCustomerRating: number;
  totalTips: number;
  totalBonus: number;
  totalDeductions: number;
  netEarnings: number;
  periodCount: number;
}

export class PerformanceService {
  /**
   * Create a new performance record
   */
  async createPerformance(data: CreatePerformanceDTO): Promise<IPerformance> {
    const performance = new Performance({
      ...data,
      staffId: new Types.ObjectId(data.staffId),
      ordersServed: data.ordersServed || 0,
      avgTicketTime: data.avgTicketTime || 0,
      tips: data.tips || 0,
      deductions: data.deductions || 0,
      bonus: data.bonus || 0,
    });

    await performance.save();
    return performance;
  }

  /**
   * Get performance by ID
   */
  async getPerformanceById(id: string): Promise<IPerformance | null> {
    return Performance.findById(id).populate('staffId', 'name employeeId role');
  }

  /**
   * Update performance record
   */
  async updatePerformance(id: string, data: UpdatePerformanceDTO): Promise<IPerformance | null> {
    const performance = await Performance.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).populate('staffId', 'name employeeId role');

    return performance;
  }

  /**
   * Get performance records with filters
   */
  async getPerformanceRecords(
    filters: PerformanceFilters,
    page: number = 1,
    limit: number = 50
  ): Promise<{ records: IPerformance[]; total: number }> {
    const query: Record<string, unknown> = {
      date: {
        $gte: new Date(filters.startDate.setHours(0, 0, 0, 0)),
        $lte: new Date(filters.endDate.setHours(23, 59, 59, 999)),
      },
    };

    if (filters.staffId) {
      query.staffId = new Types.ObjectId(filters.staffId);
    }

    if (filters.period) {
      query.period = filters.period;
    }

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Performance.find(query)
        .populate('staffId', 'name employeeId role')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Performance.countDocuments(query),
    ]);

    return { records, total };
  }

  /**
   * Get performance summary for a staff member
   */
  async getStaffPerformanceSummary(
    staffId: string,
    startDate: Date,
    endDate: Date
  ): Promise<StaffPerformanceSummary> {
    const records = await Performance.find({
      staffId: new Types.ObjectId(staffId),
      date: {
        $gte: new Date(startDate.setHours(0, 0, 0, 0)),
        $lte: new Date(endDate.setHours(23, 59, 59, 999)),
      },
    });

    if (records.length === 0) {
      return {
        staffId,
        totalOrders: 0,
        avgTicketTime: 0,
        avgCustomerRating: 0,
        totalTips: 0,
        totalBonus: 0,
        totalDeductions: 0,
        netEarnings: 0,
        periodCount: 0,
      };
    }

    const totalOrders = records.reduce((sum, r) => sum + r.ordersServed, 0);
    const avgTicketTime = records.reduce((sum, r) => sum + r.avgTicketTime, 0) / records.length;
    const ratings = records.filter((r) => r.customerRating).map((r) => r.customerRating!);
    const avgCustomerRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;
    const totalTips = records.reduce((sum, r) => sum + r.tips, 0);
    const totalBonus = records.reduce((sum, r) => sum + r.bonus, 0);
    const totalDeductions = records.reduce((sum, r) => sum + r.deductions, 0);

    return {
      staffId,
      totalOrders,
      avgTicketTime: Math.round(avgTicketTime * 100) / 100,
      avgCustomerRating: Math.round(avgCustomerRating * 100) / 100,
      totalTips,
      totalBonus,
      totalDeductions,
      netEarnings: totalTips + totalBonus - totalDeductions,
      periodCount: records.length,
    };
  }

  /**
   * Get top performing staff for a period
   */
  async getTopPerformers(
    merchantId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<Array<StaffPerformanceSummary & { rank: number }>> {
    // Get all staff performance records
    const { Staff } = await import('../models');

    const staffMembers = await Staff.find({ merchantId });
    const summaries: Array<StaffPerformanceSummary & { rank: number }> = [];

    for (const staff of staffMembers) {
      const summary = await this.getStaffPerformanceSummary(
        staff._id.toString(),
        new Date(startDate),
        new Date(endDate)
      );
      if (summary.totalOrders > 0 || summary.netEarnings > 0) {
        summaries.push({
          ...summary,
          staffId: staff._id.toString(),
          rank: 0,
        });
      }
    }

    // Sort by total orders and net earnings
    summaries.sort((a, b) => {
      if (b.totalOrders !== a.totalOrders) {
        return b.totalOrders - a.totalOrders;
      }
      return b.netEarnings - a.netEarnings;
    });

    // Assign ranks
    summaries.forEach((s, index) => {
      s.rank = index + 1;
    });

    return summaries.slice(0, limit);
  }

  /**
   * Get daily performance for a staff member
   */
  async getDailyPerformance(
    staffId: string,
    date: Date
  ): Promise<IPerformance | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return Performance.findOne({
      staffId: new Types.ObjectId(staffId),
      period: 'daily',
      date: { $gte: startOfDay, $lte: endOfDay },
    }).populate('staffId', 'name employeeId role');
  }

  /**
   * Update or create daily performance
   */
  async upsertDailyPerformance(
    staffId: string,
    date: Date,
    data: Partial<UpdatePerformanceDTO>
  ): Promise<IPerformance> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await Performance.findOne({
      staffId: new Types.ObjectId(staffId),
      period: 'daily',
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existing) {
      Object.assign(existing, data);
      await existing.save();
      return existing;
    }

    return this.createPerformance({
      staffId,
      period: 'daily',
      date: startOfDay,
      ...data,
    });
  }

  /**
   * Generate weekly performance summary
   */
  async generateWeeklySummary(
    staffId: string,
    weekStartDate: Date
  ): Promise<IPerformance> {
    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const dailyRecords = await Performance.find({
      staffId: new Types.ObjectId(staffId),
      period: 'daily',
      date: { $gte: weekStartDate, $lte: weekEnd },
    });

    if (dailyRecords.length === 0) {
      throw new Error('No daily records found for this week');
    }

    const totalOrders = dailyRecords.reduce((sum, r) => sum + r.ordersServed, 0);
    const avgTicketTime = dailyRecords.reduce((sum, r) => sum + r.avgTicketTime, 0) / dailyRecords.length;
    const ratings = dailyRecords.filter((r) => r.customerRating).map((r) => r.customerRating!);
    const avgCustomerRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;
    const totalTips = dailyRecords.reduce((sum, r) => sum + r.tips, 0);
    const totalDeductions = dailyRecords.reduce((sum, r) => sum + r.deductions, 0);
    const totalBonus = dailyRecords.reduce((sum, r) => sum + r.bonus, 0);

    // Delete existing weekly record if exists
    await Performance.deleteOne({
      staffId: new Types.ObjectId(staffId),
      period: 'weekly',
      date: weekStartDate,
    });

    return this.createPerformance({
      staffId,
      period: 'weekly',
      date: weekStartDate,
      ordersServed: totalOrders,
      avgTicketTime: Math.round(avgTicketTime * 100) / 100,
      customerRating: avgCustomerRating ? Math.round(avgCustomerRating * 100) / 100 : undefined,
      tips: totalTips,
      deductions: totalDeductions,
      bonus: totalBonus,
    });
  }

  /**
   * Get performance trends
   */
  async getPerformanceTrends(
    staffId: string,
    period: PerformancePeriod,
    count: number = 12
  ): Promise<Array<{ date: Date; ordersServed: number; customerRating?: number }>> {
    const records = await Performance.find({
      staffId: new Types.ObjectId(staffId),
      period,
    })
      .sort({ date: -1 })
      .limit(count);

    return records.map((r) => ({
      date: r.date,
      ordersServed: r.ordersServed,
      customerRating: r.customerRating,
    })).reverse();
  }
}

export const performanceService = new PerformanceService();

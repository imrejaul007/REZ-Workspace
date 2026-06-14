import { RevenueRecord, IRevenueRecord, PeriodType } from '../models';
import {
  CreateRevenueInput,
  UpdateRevenueInput,
  QueryRevenueInput,
  StatsQueryInput,
} from '../validators/revenue.validator';

export interface RevenueStats {
  totalRevenue: number;
  totalRecords: number;
  byType: Record<string, number>;
  byPeriod: Record<string, number>;
  currency: string;
}

export interface PeriodStats {
  period: string;
  totalRevenue: number;
  impressionRevenue: number;
  clickRevenue: number;
  bookingRevenue: number;
  commissionRevenue: number;
  recordCount: number;
}

export class RevenueService {
  /**
   * Create a new revenue record
   */
  async createRecord(input: CreateRevenueInput): Promise<IRevenueRecord> {
    const record = new RevenueRecord({
      ...input,
      periodDate: input.periodDate instanceof Date ? input.periodDate : new Date(input.periodDate),
    });
    await record.save();
    return record;
  }

  /**
   * Get all revenue records with pagination
   */
  async getRecords(query: QueryRevenueInput): Promise<{
    records: IRevenueRecord[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const filter: Record<string, unknown> = {};

    if (query.startDate) {
      filter.periodDate = { $gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      filter.periodDate = { ...(filter.periodDate as object || {}), $lte: new Date(query.endDate) };
    }
    if (query.type) {
      filter.type = query.type;
    }
    if (query.period) {
      filter.period = query.period;
    }

    const [records, total] = await Promise.all([
      RevenueRecord.find(filter)
        .sort({ periodDate: -1 })
        .skip(query.offset)
        .limit(query.limit)
        .lean(),
      RevenueRecord.countDocuments(filter),
    ]);

    return {
      records: records as IRevenueRecord[],
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  /**
   * Get a single revenue record by recordId
   */
  async getRecordById(recordId: string): Promise<IRevenueRecord | null> {
    return RevenueRecord.findOne({ recordId }).lean() as Promise<IRevenueRecord | null>;
  }

  /**
   * Get revenue records by screen ID
   */
  async getRecordsByScreen(screenId: string, query: QueryRevenueInput): Promise<{
    records: IRevenueRecord[];
    total: number;
    totalRevenue: number;
  }> {
    const filter: Record<string, unknown> = { screenId };

    if (query.startDate) {
      filter.periodDate = { $gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      filter.periodDate = { ...(filter.periodDate as object || {}), $lte: new Date(query.endDate) };
    }

    const [records, total, aggregation] = await Promise.all([
      RevenueRecord.find(filter)
        .sort({ periodDate: -1 })
        .skip(query.offset)
        .limit(query.limit)
        .lean(),
      RevenueRecord.countDocuments(filter),
      RevenueRecord.aggregate([
        { $match: filter },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
      ]),
    ]);

    return {
      records: records as IRevenueRecord[],
      total,
      totalRevenue: aggregation[0]?.totalRevenue || 0,
    };
  }

  /**
   * Get revenue records by advertiser ID
   */
  async getRecordsByAdvertiser(advertiserId: string, query: QueryRevenueInput): Promise<{
    records: IRevenueRecord[];
    total: number;
    totalRevenue: number;
  }> {
    const filter: Record<string, unknown> = { advertiserId };

    if (query.startDate) {
      filter.periodDate = { $gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      filter.periodDate = { ...(filter.periodDate as object || {}), $lte: new Date(query.endDate) };
    }

    const [records, total, aggregation] = await Promise.all([
      RevenueRecord.find(filter)
        .sort({ periodDate: -1 })
        .skip(query.offset)
        .limit(query.limit)
        .lean(),
      RevenueRecord.countDocuments(filter),
      RevenueRecord.aggregate([
        { $match: filter },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
      ]),
    ]);

    return {
      records: records as IRevenueRecord[],
      total,
      totalRevenue: aggregation[0]?.totalRevenue || 0,
    };
  }

  /**
   * Get revenue records by campaign ID
   */
  async getRecordsByCampaign(campaignId: string, query: QueryRevenueInput): Promise<{
    records: IRevenueRecord[];
    total: number;
    totalRevenue: number;
  }> {
    const filter: Record<string, unknown> = { campaignId };

    if (query.startDate) {
      filter.periodDate = { $gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      filter.periodDate = { ...(filter.periodDate as object || {}), $lte: new Date(query.endDate) };
    }

    const [records, total, aggregation] = await Promise.all([
      RevenueRecord.find(filter)
        .sort({ periodDate: -1 })
        .skip(query.offset)
        .limit(query.limit)
        .lean(),
      RevenueRecord.countDocuments(filter),
      RevenueRecord.aggregate([
        { $match: filter },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
      ]),
    ]);

    return {
      records: records as IRevenueRecord[],
      total,
      totalRevenue: aggregation[0]?.totalRevenue || 0,
    };
  }

  /**
   * Get overall revenue statistics
   */
  async getOverviewStats(): Promise<RevenueStats> {
    const aggregation = await RevenueRecord.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalRecords: { $sum: 1 },
          byType: { $push: { type: '$type', amount: '$amount' } },
          byPeriod: { $push: { period: '$period', amount: '$amount' } },
        },
      },
    ]);

    if (!aggregation.length) {
      return {
        totalRevenue: 0,
        totalRecords: 0,
        byType: {},
        byPeriod: {},
        currency: 'INR',
      };
    }

    const result = aggregation[0];
    const byType: Record<string, number> = {};
    const byPeriod: Record<string, number> = {};

    result.byType.forEach((item: { type: string; amount: number }) => {
      byType[item.type] = (byType[item.type] || 0) + item.amount;
    });

    result.byPeriod.forEach((item: { period: string; amount: number }) => {
      byPeriod[item.period] = (byPeriod[item.period] || 0) + item.amount;
    });

    return {
      totalRevenue: result.totalRevenue,
      totalRecords: result.totalRecords,
      byType,
      byPeriod,
      currency: 'INR',
    };
  }

  /**
   * Get daily revenue statistics
   */
  async getDailyStats(query: StatsQueryInput): Promise<PeriodStats[]> {
    const matchStage: Record<string, unknown> = { period: 'daily' };

    if (query.startDate) {
      matchStage.periodDate = { $gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      matchStage.periodDate = { ...(matchStage.periodDate as object || {}), $lte: new Date(query.endDate) };
    }

    return RevenueRecord.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$periodDate' } },
          totalRevenue: { $sum: '$amount' },
          impressionRevenue: {
            $sum: { $cond: [{ $eq: ['$type', 'impression'] }, '$amount', 0] },
          },
          clickRevenue: {
            $sum: { $cond: [{ $eq: ['$type', 'click'] }, '$amount', 0] },
          },
          bookingRevenue: {
            $sum: { $cond: [{ $eq: ['$type', 'booking'] }, '$amount', 0] },
          },
          commissionRevenue: {
            $sum: { $cond: [{ $eq: ['$type', 'commission'] }, '$amount', 0] },
          },
          recordCount: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]).then(results =>
      results.map(r => ({
        period: r._id,
        totalRevenue: r.totalRevenue,
        impressionRevenue: r.impressionRevenue,
        clickRevenue: r.clickRevenue,
        bookingRevenue: r.bookingRevenue,
        commissionRevenue: r.commissionRevenue,
        recordCount: r.recordCount,
      }))
    );
  }

  /**
   * Get weekly revenue statistics
   */
  async getWeeklyStats(query: StatsQueryInput): Promise<PeriodStats[]> {
    const matchStage: Record<string, unknown> = { period: 'weekly' };

    if (query.startDate) {
      matchStage.periodDate = { $gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      matchStage.periodDate = { ...(matchStage.periodDate as object || {}), $lte: new Date(query.endDate) };
    }

    return RevenueRecord.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$periodDate' },
            week: { $isoWeek: '$periodDate' },
          },
          totalRevenue: { $sum: '$amount' },
          impressionRevenue: {
            $sum: { $cond: [{ $eq: ['$type', 'impression'] }, '$amount', 0] },
          },
          clickRevenue: {
            $sum: { $cond: [{ $eq: ['$type', 'click'] }, '$amount', 0] },
          },
          bookingRevenue: {
            $sum: { $cond: [{ $eq: ['$type', 'booking'] }, '$amount', 0] },
          },
          commissionRevenue: {
            $sum: { $cond: [{ $eq: ['$type', 'commission'] }, '$amount', 0] },
          },
          recordCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.week': -1 } },
    ]).then(results =>
      results.map(r => ({
        period: `${r._id.year}-W${String(r._id.week).padStart(2, '0')}`,
        totalRevenue: r.totalRevenue,
        impressionRevenue: r.impressionRevenue,
        clickRevenue: r.clickRevenue,
        bookingRevenue: r.bookingRevenue,
        commissionRevenue: r.commissionRevenue,
        recordCount: r.recordCount,
      }))
    );
  }

  /**
   * Get monthly revenue statistics
   */
  async getMonthlyStats(query: StatsQueryInput): Promise<PeriodStats[]> {
    const matchStage: Record<string, unknown> = { period: 'monthly' };

    if (query.startDate) {
      matchStage.periodDate = { $gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      matchStage.periodDate = { ...(matchStage.periodDate as object || {}), $lte: new Date(query.endDate) };
    }

    return RevenueRecord.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$periodDate' } },
          totalRevenue: { $sum: '$amount' },
          impressionRevenue: {
            $sum: { $cond: [{ $eq: ['$type', 'impression'] }, '$amount', 0] },
          },
          clickRevenue: {
            $sum: { $cond: [{ $eq: ['$type', 'click'] }, '$amount', 0] },
          },
          bookingRevenue: {
            $sum: { $cond: [{ $eq: ['$type', 'booking'] }, '$amount', 0] },
          },
          commissionRevenue: {
            $sum: { $cond: [{ $eq: ['$type', 'commission'] }, '$amount', 0] },
          },
          recordCount: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]).then(results =>
      results.map(r => ({
        period: r._id,
        totalRevenue: r.totalRevenue,
        impressionRevenue: r.impressionRevenue,
        clickRevenue: r.clickRevenue,
        bookingRevenue: r.bookingRevenue,
        commissionRevenue: r.commissionRevenue,
        recordCount: r.recordCount,
      }))
    );
  }

  /**
   * Get revenue for a specific screen in a period
   */
  async getScreenRevenueByPeriod(
    screenId: string,
    period: PeriodType,
    query: StatsQueryInput
  ): Promise<{
    screenId: string;
    period: PeriodType;
    totalRevenue: number;
    breakdown: PeriodStats[];
  }> {
    const matchStage: Record<string, unknown> = { screenId, period };

    if (query.startDate) {
      matchStage.periodDate = { $gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      matchStage.periodDate = { ...(matchStage.periodDate as object || {}), $lte: new Date(query.endDate) };
    }

    const dateFormat = period === 'daily' ? '%Y-%m-%d' : period === 'weekly' ? '%Y-W%V' : '%Y-%m';

    const [aggregation, totalAggregation] = await Promise.all([
      RevenueRecord.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$periodDate' } },
            totalRevenue: { $sum: '$amount' },
            impressionRevenue: {
              $sum: { $cond: [{ $eq: ['$type', 'impression'] }, '$amount', 0] },
            },
            clickRevenue: {
              $sum: { $cond: [{ $eq: ['$type', 'click'] }, '$amount', 0] },
            },
            bookingRevenue: {
              $sum: { $cond: [{ $eq: ['$type', 'booking'] }, '$amount', 0] },
            },
            commissionRevenue: {
              $sum: { $cond: [{ $eq: ['$type', 'commission'] }, '$amount', 0] },
            },
            recordCount: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
      ]),
      RevenueRecord.aggregate([
        { $match: matchStage },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
      ]),
    ]);

    return {
      screenId,
      period,
      totalRevenue: totalAggregation[0]?.totalRevenue || 0,
      breakdown: aggregation.map(r => ({
        period: r._id,
        totalRevenue: r.totalRevenue,
        impressionRevenue: r.impressionRevenue,
        clickRevenue: r.clickRevenue,
        bookingRevenue: r.bookingRevenue,
        commissionRevenue: r.commissionRevenue,
        recordCount: r.recordCount,
      })),
    };
  }

  /**
   * Delete a revenue record
   */
  async deleteRecord(recordId: string): Promise<boolean> {
    const result = await RevenueRecord.deleteOne({ recordId });
    return result.deletedCount > 0;
  }

  /**
   * Update a revenue record
   */
  async updateRecord(recordId: string, input: UpdateRevenueInput): Promise<IRevenueRecord | null> {
    const updateData: Record<string, unknown> = {};

    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    if (Object.keys(updateData).length === 0) {
      return this.getRecordById(recordId);
    }

    return RevenueRecord.findOneAndUpdate(
      { recordId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean() as Promise<IRevenueRecord | null>;
  }
}

export const revenueService = new RevenueService();
export default revenueService;

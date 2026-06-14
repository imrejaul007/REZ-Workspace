import { OfflineConversion, ConversionAnalytics, IConversionAnalytics } from '../models';
import { AnalyticsQueryInput } from '../utils/validation';
import { logger } from '../utils';
import { analyticsQueries, databaseOperationDuration } from '../utils/metrics';

export class AnalyticsService {
  /**
   * Get conversion analytics
   */
  async getAnalytics(input: AnalyticsQueryInput): Promise<{
    summary: {
      total: number;
      totalValue: number;
      averageValue: number;
      matchRate: number;
    };
    byType: Record<string, { count: number; value: number }>;
    byDate: Array<{ date: string; count: number; value: number }>;
    byCampaign: Array<{ campaignId: string; count: number; value: number }>;
    byStatus: Record<string, number>;
    demographics?: {
      locations: Record<string, number>;
      devices: Record<string, number>;
    };
  }> {
    const startTime = Date.now();

    try {
      analyticsQueries.inc({ type: 'conversions' });

      const matchStage: any = { $match: {} };
      if (input.campaignId) matchStage.$match.campaignId = input.campaignId;
      if (input.startDate || input.endDate) {
        matchStage.$match.date = {};
        if (input.startDate) matchStage.$match.date.$gte = input.startDate;
        if (input.endDate) matchStage.$match.date.$lte = input.endDate;
      }
      if (input.type) matchStage.$match.type = input.type;

      // Build date grouping based on groupBy
      let dateFormat: string;
      switch (input.groupBy) {
        case 'week':
          dateFormat = '%Y-W%V';
          break;
        case 'month':
          dateFormat = '%Y-%m';
          break;
        default:
          dateFormat = '%Y-%m-%d';
      }

      const aggregation = await OfflineConversion.aggregate([
        matchStage,
        {
          $facet: {
            summary: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  totalValue: { $sum: '$value' },
                  matched: {
                    $sum: {
                      $cond: [{ $in: ['$status', ['matched', 'confirmed']] }, 1, 0]
                    }
                  }
                }
              },
              {
                $project: {
                  _id: 0,
                  total: 1,
                  totalValue: 1,
                  averageValue: { $cond: [{ $eq: ['$total', 0] }, 0, { $divide: ['$totalValue', '$total'] }] },
                  matchRate: { $cond: [{ $eq: ['$total', 0] }, 0, { $multiply: [{ $divide: ['$matched', '$total'] }, 100] }] }
                }
              }
            ],
            byType: [
              {
                $group: {
                  _id: '$type',
                  count: { $sum: 1 },
                  value: { $sum: '$value' }
                }
              }
            ],
            byDate: [
              {
                $group: {
                  _id: { $dateToString: { format: dateFormat, date: '$date' } },
                  count: { $sum: 1 },
                  value: { $sum: '$value' }
                }
              },
              { $sort: { _id: 1 } }
            ],
            byCampaign: [
              {
                $group: {
                  _id: '$campaignId',
                  count: { $sum: 1 },
                  value: { $sum: '$value' }
                }
              },
              { $sort: { count: -1 } },
              { $limit: 20 }
            ],
            byStatus: [
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 }
                }
              }
            ],
            demographics: [
              {
                $match: { 'location.city': { $exists: true } }
              },
              {
                $group: {
                  _id: '$location.city',
                  count: { $sum: 1 }
                }
              },
              { $sort: { count: -1 } },
              { $limit: 20 }
            ]
          }
        }
      ]);

      const result = aggregation[0] || {};

      // Format byType
      const byType: Record<string, { count: number; value: number }> = {};
      (result.byType || []).forEach((item: any) => {
        byType[item._id] = { count: item.count, value: item.value };
      });

      // Format byDate
      const byDate = (result.byDate || []).map((item: any) => ({
        date: item._id,
        count: item.count,
        value: item.value
      }));

      // Format byCampaign
      const byCampaign = (result.byCampaign || []).map((item: any) => ({
        campaignId: item._id,
        count: item.count,
        value: item.value
      }));

      // Format byStatus
      const byStatus: Record<string, number> = {};
      (result.byStatus || []).forEach((item: any) => {
        byStatus[item._id] = item.count;
      });

      // Format demographics
      const demographics = input.includeDemographics ? {
        locations: Object.fromEntries(
          (result.demographics || []).map((item: any) => [item._id, item.count])
        ),
        devices: {} as Record<string, number>
      } : undefined;

      return {
        summary: result.summary?.[0] || {
          total: 0,
          totalValue: 0,
          averageValue: 0,
          matchRate: 0
        },
        byType,
        byDate,
        byCampaign,
        byStatus,
        demographics
      };
    } finally {
      databaseOperationDuration.observe({ operation: 'aggregate', collection: 'conversions' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Get dashboard data
   */
  async getDashboard(campaignId?: string): Promise<{
    overview: {
      totalConversions: number;
      totalValue: number;
      matchedConversions: number;
      matchRate: number;
    };
    recentConversions: Array<{
      id: string;
      campaignId: string;
      type: string;
      value: number;
      date: Date;
      status: string;
    }>;
    topCampaigns: Array<{
      campaignId: string;
      conversions: number;
      value: number;
      matchRate: number;
    }>;
    conversionsByType: Record<string, number>;
    conversionsByDay: Array<{
      date: string;
      count: number;
      value: number;
    }>;
    performance: {
      cpa: number;
      roas: number;
      avgOrderValue: number;
    };
  }> {
    const startTime = Date.now();

    try {
      analyticsQueries.inc({ type: 'dashboard' });

      const matchStage: any = campaignId ? { $match: { campaignId } } : { $match: {} };

      const [overview, recentConversions, topCampaigns, byType, byDay] = await Promise.all([
        // Overview
        OfflineConversion.aggregate([
          matchStage,
          {
            $group: {
              _id: null,
              totalConversions: { $sum: 1 },
              totalValue: { $sum: '$value' },
              matchedConversions: {
                $sum: {
                  $cond: [{ $in: ['$status', ['matched', 'confirmed']] }, 1, 0]
                }
              }
            }
          }
        ]),
        // Recent conversions
        OfflineConversion.find(matchStage.$match)
          .sort({ date: -1 })
          .limit(10)
          .select('_id campaignId type value date status'),
        // Top campaigns
        OfflineConversion.aggregate([
          matchStage,
          {
            $group: {
              _id: '$campaignId',
              conversions: { $sum: 1 },
              value: { $sum: '$value' },
              matched: {
                $sum: {
                  $cond: [{ $in: ['$status', ['matched', 'confirmed']] }, 1, 0]
                }
              }
            }
          },
          { $sort: { conversions: -1 } },
          { $limit: 10 }
        ]),
        // By type
        OfflineConversion.aggregate([
          matchStage,
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 }
            }
          }
        ]),
        // By day (last 7 days)
        OfflineConversion.aggregate([
          {
            $match: {
              ...(matchStage.$match || {}),
              date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
              count: { $sum: 1 },
              value: { $sum: '$value' }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]);

      const overviewData = overview[0] || {
        totalConversions: 0,
        totalValue: 0,
        matchedConversions: 0
      };

      // Format conversions by type
      const conversionsByType: Record<string, number> = {};
      byType.forEach((item: any) => {
        conversionsByType[item._id] = item.count;
      });

      // Format top campaigns
      const topCampaignsFormatted = topCampaigns.map((item: any) => ({
        campaignId: item._id,
        conversions: item.conversions,
        value: item.value,
        matchRate: item.conversions > 0 ? (item.matched / item.conversions) * 100 : 0
      }));

      // Format recent conversions
      const recentConversionsFormatted = recentConversions.map((conv: any) => ({
        id: conv._id.toString(),
        campaignId: conv.campaignId,
        type: conv.type,
        value: conv.value,
        date: conv.date,
        status: conv.status
      }));

      // Calculate performance metrics
      const cpa = overviewData.totalConversions > 0
        ? overviewData.totalValue / overviewData.totalConversions
        : 0;
      const roas = 0; // Would need ad spend data
      const avgOrderValue = overviewData.totalConversions > 0
        ? overviewData.totalValue / overviewData.totalConversions
        : 0;

      return {
        overview: {
          totalConversions: overviewData.totalConversions,
          totalValue: overviewData.totalValue,
          matchedConversions: overviewData.matchedConversions,
          matchRate: overviewData.totalConversions > 0
            ? (overviewData.matchedConversions / overviewData.totalConversions) * 100
            : 0
        },
        recentConversions: recentConversionsFormatted,
        topCampaigns: topCampaignsFormatted,
        conversionsByType,
        conversionsByDay: byDay.map((item: any) => ({
          date: item._id,
          count: item.count,
          value: item.value
        })),
        performance: {
          cpa,
          roas,
          avgOrderValue
        }
      };
    } finally {
      databaseOperationDuration.observe({ operation: 'aggregate', collection: 'conversions' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Store daily analytics
   */
  async storeDailyAnalytics(campaignId: string, date: Date): Promise<IConversionAnalytics> {
    const startTime = Date.now();

    try {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const stats = await OfflineConversion.aggregate([
        {
          $match: {
            campaignId,
            date: { $gte: dayStart, $lte: dayEnd }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            purchase: { $sum: { $cond: [{ $eq: ['$type', 'purchase'] }, 1, 0] } },
            visit: { $sum: { $cond: [{ $eq: ['$type', 'visit'] }, 1, 0] } },
            call: { $sum: { $cond: [{ $eq: ['$type', 'call'] }, 1, 0] } },
            form: { $sum: { $cond: [{ $eq: ['$type', 'form'] }, 1, 0] } },
            install: { $sum: { $cond: [{ $eq: ['$type', 'install'] }, 1, 0] } },
            other: { $sum: { $cond: [{ $eq: ['$type', 'other'] }, 1, 0] } },
            totalValue: { $sum: '$value' },
            matched: { $sum: { $cond: [{ $in: ['$status', ['matched', 'confirmed']] }, 1, 0] } },
            unmatched: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }
          }
        }
      ]);

      const result = stats[0] || {
        total: 0,
        purchase: 0,
        visit: 0,
        call: 0,
        form: 0,
        install: 0,
        other: 0,
        totalValue: 0,
        matched: 0,
        unmatched: 0
      };

      const analytics = await ConversionAnalytics.findOneAndUpdate(
        { campaignId, date: dayStart },
        {
          campaignId,
          date: dayStart,
          conversions: {
            total: result.total,
            purchase: result.purchase,
            visit: result.visit,
            call: result.call,
            form: result.form,
            install: result.install,
            other: result.other
          },
          value: {
            total: result.totalValue,
            average: result.total > 0 ? result.totalValue / result.total : 0,
            currency: 'INR'
          },
          matchRate: {
            matched: result.matched,
            unmatched: result.unmatched,
            rate: result.total > 0 ? (result.matched / result.total) * 100 : 0
          }
        },
        { upsert: true, new: true }
      );

      logger.info('Daily analytics stored', { campaignId, date: dayStart });

      return analytics;
    } finally {
      databaseOperationDuration.observe({ operation: 'upsert', collection: 'analytics' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Get historical analytics
   */
  async getHistoricalAnalytics(
    campaignId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IConversionAnalytics[]> {
    const startTime = Date.now();

    try {
      return await ConversionAnalytics.find({
        campaignId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });
    } finally {
      databaseOperationDuration.observe({ operation: 'find', collection: 'analytics' }, (Date.now() - startTime) / 1000);
    }
  }
}

export const analyticsService = new AnalyticsService();
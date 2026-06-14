/**
 * Multi-Location Dashboard Service
 * Provides aggregated analytics and reporting across multiple store locations
 */

import { Types } from 'mongoose';
import { Store } from '../models/Store';
import { Order } from '../models/Order';

// =============================================================================
// Types
// =============================================================================

export interface DateRange {
  start: Date;
  end: Date;
}

export interface Location {
  _id: string;
  name: string;
  city: string;
  address: string;
  isActive: boolean;
  ratings?: { average: number; count: number };
  createdAt: Date;
}

export interface PerformanceMetrics {
  locationId: string;
  locationName: string;
  period: DateRange;
  revenue: {
    total: number;
    averageOrderValue: number;
    growth: number; // percentage vs previous period
  };
  orders: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
  };
  customers: {
    unique: number;
    new: number;
    returning: number;
  };
  ratings: {
    average: number;
    count: number;
  };
  operationalHours: {
    avgPrepTime: number; // minutes
    avgDeliveryTime: number; // minutes
  };
}

export interface ConsolidatedReport {
  merchantId: string;
  period: DateRange;
  summary: {
    totalLocations: number;
    activeLocations: number;
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    overallRating: number;
  };
  topLocation: {
    id: string;
    name: string;
    revenue: number;
  };
  bottomLocation: {
    id: string;
    name: string;
    revenue: number;
  };
  growth: {
    revenueChange: number;
    ordersChange: number;
    customersChange: number;
  };
  trend: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export interface Comparison {
  locationId: string;
  locationName: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  customers: number;
  rating: number;
  revenueShare: number; // percentage of total
}

export interface HealthMetrics {
  locationId: string;
  locationName: string;
  status: 'healthy' | 'warning' | 'critical';
  score: number; // 0-100
  checks: {
    orderVolume: { status: 'pass' | 'fail' | 'warning'; value: number; message: string };
    revenue: { status: 'pass' | 'fail' | 'warning'; value: number; message: string };
    rating: { status: 'pass' | 'fail' | 'warning'; value: number; message: string };
    cancellations: { status: 'pass' | 'fail' | 'warning'; value: number; message: string };
    activeStatus: { status: 'pass' | 'fail'; value: boolean; message: string };
  };
  alerts: string[];
  lastOrderAt?: Date;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate percentage change between two values
 */
function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

/**
 * Get date range for previous period (same duration, shifted back)
 */
function getPreviousPeriod(period: DateRange): DateRange {
  const duration = period.end.getTime() - period.start.getTime();
  return {
    start: new Date(period.start.getTime() - duration),
    end: new Date(period.end.getTime() - duration),
  };
}

/**
 * Generate daily trend data for a date range
 */
async function generateTrendData(
  merchantId: string,
  storeIds: Types.ObjectId[],
  period: DateRange
): Promise<Array<{ date: string; revenue: number; orders: number }>> {
  const pipeline = [
    {
      $match: {
        merchant: new Types.ObjectId(merchantId),
        store: { $in: storeIds },
        createdAt: { $gte: period.start, $lte: period.end },
        'payment.status': 'completed',
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totals.total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: '$_id', revenue: 1, orders: 1, _id: 0 } },
  ];

  return Order.aggregate(pipeline);
}

// =============================================================================
// Service Class
// =============================================================================

export class MultiLocationDashboard {
  /**
   * Get all locations for a merchant
   */
  async getAllLocations(merchantId: string): Promise<Location[]> {
    const stores = await Store.find({
      $or: [{ merchantId: new Types.ObjectId(merchantId) }, { merchant: new Types.ObjectId(merchantId) }],
      deletedAt: { $exists: false },
    })
      .select('_id name location.city location.address isActive ratings createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return stores.map((store) => ({
      _id: store._id.toString(),
      name: store.name,
      city: store.location?.city || '',
      address: store.location?.address || '',
      isActive: store.isActive,
      ratings: store.ratings,
      createdAt: store.createdAt,
    }));
  }

  /**
   * Get performance metrics for a specific location
   */
  async getLocationPerformance(locationId: string, period: DateRange): Promise<PerformanceMetrics> {
    const store = await Store.findById(locationId).lean();
    if (!store) {
      throw new Error(`Store not found: ${locationId}`);
    }

    const previousPeriod = getPreviousPeriod(period);

    // Current period aggregation
    const currentPipeline = [
      {
        $match: {
          store: new Types.ObjectId(locationId),
          createdAt: { $gte: period.start, $lte: period.end },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totals.total' },
          orderCount: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
          pendingOrders: {
            $sum: { $cond: [{ $in: ['$status', ['pending', 'confirmed', 'preparing']] }, 1, 0] },
          },
          uniqueCustomers: { $addToSet: '$user' },
        },
      },
    ];

    // Previous period for growth calculation
    const previousPipeline = [
      {
        $match: {
          store: new Types.ObjectId(locationId),
          createdAt: { $gte: previousPeriod.start, $lte: previousPeriod.end },
          'payment.status': 'completed',
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totals.total' },
          orderCount: { $sum: 1 },
        },
      },
    ];

    const [currentResult, previousResult] = await Promise.all([
      Order.aggregate(currentPipeline),
      Order.aggregate(previousPipeline),
    ]);

    const current = currentResult[0] || {
      totalRevenue: 0,
      orderCount: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      pendingOrders: 0,
      uniqueCustomers: [],
    };
    const previous = previousResult[0] || { totalRevenue: 0, orderCount: 0 };

    const revenueGrowth = calculateGrowth(current.totalRevenue, previous.totalRevenue);
    const orderCount = current.orderCount || 1;
    const uniqueCustomers = current.uniqueCustomers?.length || 0;

    return {
      locationId,
      locationName: store.name,
      period,
      revenue: {
        total: current.totalRevenue || 0,
        averageOrderValue: current.totalRevenue ? current.totalRevenue / orderCount : 0,
        growth: revenueGrowth,
      },
      orders: {
        total: current.orderCount || 0,
        completed: current.completedOrders || 0,
        cancelled: current.cancelledOrders || 0,
        pending: current.pendingOrders || 0,
      },
      customers: {
        unique: uniqueCustomers,
        new: 0, // Would need user creation date tracking
        returning: 0,
      },
      ratings: {
        average: store.ratings?.average || 0,
        count: store.ratings?.count || 0,
      },
      operationalHours: {
        avgPrepTime: 0,
        avgDeliveryTime: 0,
      },
    };
  }

  /**
   * Get consolidated report across all locations
   */
  async getConsolidatedReport(merchantId: string, period: DateRange): Promise<ConsolidatedReport> {
    const stores = await Store.find({
      $or: [{ merchantId: new Types.ObjectId(merchantId) }, { merchant: new Types.ObjectId(merchantId) }],
      deletedAt: { $exists: false },
    })
      .select('_id name ratings')
      .lean();

    const storeIds = stores.map((s) => s._id);
    const previousPeriod = getPreviousPeriod(period);

    // Current period aggregation
    const currentPipeline = [
      {
        $match: {
          merchant: new Types.ObjectId(merchantId),
          store: { $in: storeIds },
          createdAt: { $gte: period.start, $lte: period.end },
        },
      },
      {
        $group: {
          _id: '$store',
          revenue: { $sum: '$totals.total' },
          orders: { $sum: 1 },
          customers: { $addToSet: '$user' },
        },
      },
    ];

    // Previous period for growth
    const previousPipeline = [
      {
        $match: {
          merchant: new Types.ObjectId(merchantId),
          store: { $in: storeIds },
          createdAt: { $gte: previousPeriod.start, $lte: previousPeriod.end },
          'payment.status': 'completed',
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totals.total' },
          totalOrders: { $sum: 1 },
        },
      },
    ];

    const [locationStats, previousData, trendData] = await Promise.all([
      Order.aggregate(currentPipeline),
      Order.aggregate(previousPipeline),
      generateTrendData(merchantId, storeIds, period),
    ]);

    const previous = previousData[0] || { totalRevenue: 0, totalOrders: 0 };

    // Calculate totals
    let totalRevenue = 0;
    let totalOrders = 0;
    let totalCustomers = 0;
    let topLocation = locationStats[0] || null;
    let bottomLocation = locationStats[0] || null;

    for (const stat of locationStats) {
      totalRevenue += stat.revenue || 0;
      totalOrders += stat.orders || 0;
      totalCustomers += stat.customers?.length || 0;

      if (!topLocation || stat.revenue > (topLocation.revenue || 0)) {
        topLocation = stat;
      }
      if (!bottomLocation || stat.revenue < (bottomLocation.revenue || 0)) {
        bottomLocation = stat;
      }
    }

    // Get location names
    const storeMap = new Map(stores.map((s) => [s._id.toString(), s.name]));

    // Calculate overall rating
    const ratingsSum = stores.reduce((sum, s) => sum + (s.ratings?.average || 0) * (s.ratings?.count || 0), 0);
    const ratingsCount = stores.reduce((sum, s) => sum + (s.ratings?.count || 0), 0);
    const overallRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;

    return {
      merchantId,
      period,
      summary: {
        totalLocations: stores.length,
        activeLocations: stores.filter((s) => s.isActive).length,
        totalRevenue,
        totalOrders,
        totalCustomers,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        overallRating: Number(overallRating.toFixed(2)),
      },
      topLocation: {
        id: topLocation?._id?.toString() || '',
        name: storeMap.get(topLocation?._id?.toString() || '') || 'N/A',
        revenue: topLocation?.revenue || 0,
      },
      bottomLocation: {
        id: bottomLocation?._id?.toString() || '',
        name: storeMap.get(bottomLocation?._id?.toString() || '') || 'N/A',
        revenue: bottomLocation?.revenue || 0,
      },
      growth: {
        revenueChange: calculateGrowth(totalRevenue, previous.totalRevenue),
        ordersChange: calculateGrowth(totalOrders, previous.totalOrders),
        customersChange: 0, // Would need user tracking
      },
      trend: trendData,
    };
  }

  /**
   * Compare multiple locations side by side
   */
  async compareLocations(merchantId: string, period: DateRange): Promise<Comparison[]> {
    const stores = await Store.find({
      $or: [{ merchantId: new Types.ObjectId(merchantId) }, { merchant: new Types.ObjectId(merchantId) }],
      deletedAt: { $exists: false },
    })
      .select('_id name ratings')
      .lean();

    const storeIds = stores.map((s) => s._id);

    const pipeline = [
      {
        $match: {
          merchant: new Types.ObjectId(merchantId),
          store: { $in: storeIds },
          createdAt: { $gte: period.start, $lte: period.end },
        },
      },
      {
        $group: {
          _id: '$store',
          revenue: { $sum: '$totals.total' },
          orders: { $sum: 1 },
          customers: { $addToSet: '$user' },
        },
      },
    ];

    const stats = await Order.aggregate(pipeline);

    // Calculate total revenue for percentage
    const totalRevenue = stats.reduce((sum, s) => sum + (s.revenue || 0), 0);

    const storeMap = new Map(stores.map((s) => [s._id.toString(), s]));

    return stats.map((stat) => {
      const store = storeMap.get(stat._id.toString());
      const orders = stat.orders || 1;
      const revenue = stat.revenue || 0;

      return {
        locationId: stat._id.toString(),
        locationName: store?.name || 'Unknown',
        revenue,
        orders: stat.orders || 0,
        averageOrderValue: revenue / orders,
        customers: stat.customers?.length || 0,
        rating: store?.ratings?.average || 0,
        revenueShare: totalRevenue > 0 ? Number(((revenue / totalRevenue) * 100).toFixed(2)) : 0,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Get top performing locations
   */
  async getTopPerformers(merchantId: string, limit: number = 5): Promise<Location[]> {
    const stores = await Store.find({
      $or: [{ merchantId: new Types.ObjectId(merchantId) }, { merchant: new Types.ObjectId(merchantId) }],
      deletedAt: { $exists: false },
    })
      .select('_id name location.city location.address isActive ratings createdAt')
      .lean();

    const storeIds = stores.map((s) => s._id);

    // Get recent order totals per store
    const pipeline = [
      {
        $match: {
          merchant: new Types.ObjectId(merchantId),
          store: { $in: storeIds },
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
      },
      {
        $group: {
          _id: '$store',
          totalRevenue: { $sum: '$totals.total' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
    ];

    const topStores = await Order.aggregate(pipeline);
    const storeMap = new Map(stores.map((s) => [s._id.toString(), s]));

    return topStores.map((stat) => {
      const store = storeMap.get(stat._id.toString());
      return {
        _id: stat._id.toString(),
        name: store?.name || 'Unknown',
        city: store?.location?.city || '',
        address: store?.location?.address || '',
        isActive: store?.isActive || false,
        ratings: store?.ratings,
        createdAt: store?.createdAt || new Date(),
      };
    });
  }

  /**
   * Get health status for a location
   */
  async getLocationHealth(locationId: string): Promise<HealthMetrics> {
    const store = await Store.findById(locationId).lean();
    if (!store) {
      throw new Error(`Store not found: ${locationId}`);
    }

    // Last 30 days metrics
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const pipeline = [
      {
        $match: {
          store: new Types.ObjectId(locationId),
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totals.total' },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
          lastOrder: { $max: '$createdAt' },
        },
      },
    ];

    const [result] = await Order.aggregate(pipeline);

    const totalOrders = result?.totalOrders || 0;
    const completedOrders = result?.completedOrders || 0;
    const cancelledOrders = result?.cancelledOrders || 0;
    const totalRevenue = result?.totalRevenue || 0;

    // Calculate cancellation rate
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    // Health check thresholds
    const checks: HealthMetrics['checks'] = {
      orderVolume: {
        status: totalOrders >= 100 ? 'pass' : totalOrders >= 50 ? 'warning' : 'fail',
        value: totalOrders,
        message: totalOrders >= 100 ? 'Good order volume' : totalOrders >= 50 ? 'Moderate order volume' : 'Low order volume',
      },
      revenue: {
        status: totalRevenue >= 100000 ? 'pass' : totalRevenue >= 50000 ? 'warning' : 'fail',
        value: totalRevenue,
        message: totalRevenue >= 100000 ? 'Healthy revenue' : totalRevenue >= 50000 ? 'Moderate revenue' : 'Revenue below threshold',
      },
      rating: {
        status: (store.ratings?.average || 0) >= 4.0 ? 'pass' : (store.ratings?.average || 0) >= 3.0 ? 'warning' : 'fail',
        value: store.ratings?.average || 0,
        message: (store.ratings?.average || 0) >= 4.0 ? 'Good rating' : 'Rating needs improvement',
      },
      cancellations: {
        status: cancellationRate <= 5 ? 'pass' : cancellationRate <= 10 ? 'warning' : 'fail',
        value: Number(cancellationRate.toFixed(2)),
        message: cancellationRate <= 5 ? 'Healthy cancellation rate' : cancellationRate <= 10 ? 'Elevated cancellations' : 'High cancellation rate',
      },
      activeStatus: {
        status: store.isActive ? 'pass' : 'fail',
        value: store.isActive,
        message: store.isActive ? 'Store is active' : 'Store is inactive',
      },
    };

    // Calculate overall score
    const weights = { orderVolume: 20, revenue: 25, rating: 25, cancellations: 20, activeStatus: 10 };
    let score = 0;
    const alerts: string[] = [];

    for (const [key, weight] of Object.entries(weights)) {
      const check = checks[key as keyof typeof checks];
      if (check.status === 'pass') score += weight;
      else if (check.status === 'warning') score += weight * 0.5;
      else {
        score += 0;
        alerts.push(check.message);
      }
    }

    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (score < 50 || !store.isActive) status = 'critical';
    else if (score < 75) status = 'warning';

    return {
      locationId,
      locationName: store.name,
      status,
      score: Math.round(score),
      checks,
      alerts,
      lastOrderAt: result?.lastOrder || undefined,
    };
  }
}

// Singleton instance
export const multiLocationDashboard = new MultiLocationDashboard();

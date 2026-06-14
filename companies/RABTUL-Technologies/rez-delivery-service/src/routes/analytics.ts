import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import DeliveryOrder from '../models/DeliveryOrder';
import Rider from '../models/Rider';
import orderService from '../services/orderService';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Validation middleware
const validate = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

/**
 * @route GET /api/analytics/overview
 * @desc Get delivery analytics overview
 */
router.get(
  '/overview',
  [
    query('startDate').optional().isISO8601().toDate(),
    query('endDate').optional().isISO8601().toDate(),
    query('merchantId').optional().isString()
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, merchantId } = req.query;

    const matchStage: unknown = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate as string);
    }
    if (merchantId) matchStage.merchantId = merchantId;

    // Aggregate orders by status
    const statusAggregation = await DeliveryOrder.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Aggregate orders by source
    const sourceAggregation = await DeliveryOrder.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    // Calculate average delivery time for completed orders
    const deliveryTimeAggregation = await DeliveryOrder.aggregate([
      {
        $match: {
          ...matchStage,
          status: 'delivered',
          actualDelivery: { $exists: true }
        }
      },
      {
        $project: {
          deliveryTime: {
            $divide: [
              { $subtract: ['$actualDelivery', '$createdAt'] },
              60000 // Convert to minutes
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDeliveryTime: { $avg: '$deliveryTime' },
          minDeliveryTime: { $min: '$deliveryTime' },
          maxDeliveryTime: { $max: '$deliveryTime' }
        }
      }
    ]);

    // Format response
    const statusCounts: Record<string, number> = {};
    let totalRevenue = 0;
    statusAggregation.forEach(s => {
      statusCounts[s._id] = s.count;
      if (['delivered', 'cancelled'].includes(s._id)) {
        totalRevenue += s.revenue;
      }
    });

    const totalOrders = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    res.json({
      success: true,
      data: {
        summary: {
          totalOrders,
          totalRevenue,
          completedOrders: statusCounts.delivered || 0,
          cancelledOrders: statusCounts.cancelled || 0,
          pendingOrders: statusCounts.pending || 0,
          inProgressOrders: (statusCounts.confirmed || 0) +
            (statusCounts.preparing || 0) +
            (statusCounts.ready || 0) +
            (statusCounts.picked_up || 0)
        },
        byStatus: statusAggregation,
        bySource: sourceAggregation,
        deliveryTime: deliveryTimeAggregation[0] || {
          avgDeliveryTime: 0,
          minDeliveryTime: 0,
          maxDeliveryTime: 0
        }
      }
    });
  })
);

/**
 * @route GET /api/analytics/orders/trends
 * @desc Get order trends over time
 */
router.get(
  '/orders/trends',
  [
    query('startDate').optional().isISO8601().toDate(),
    query('endDate').optional().isISO8601().toDate(),
    query('interval').optional().isIn(['hour', 'day', 'week', 'month']).withMessage('Invalid interval')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, interval } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default 7 days
    const end = endDate ? new Date(endDate as string) : new Date();
    const intervalType = interval || 'day';

    // Determine date grouping based on interval
    let dateFormat;
    switch (intervalType) {
      case 'hour':
        dateFormat = { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } };
        break;
      case 'week':
        dateFormat = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
        break;
      case 'month':
        dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        break;
      default:
        dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    const trends = await DeliveryOrder.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: dateFormat,
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        interval: intervalType,
        startDate: start,
        endDate: end,
        trends
      }
    });
  })
);

/**
 * @route GET /api/analytics/riders/performance
 * @desc Get rider performance analytics
 */
router.get(
  '/riders/performance',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sortBy').optional().isIn(['deliveries', 'rating', 'earnings']).withMessage('Invalid sort field')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit || 20;
    const sortField = req.query.sortBy || 'deliveries';

    let sortQuery;
    switch (sortField) {
      case 'rating':
        sortQuery = { rating: -1 };
        break;
      case 'earnings':
        sortQuery = { 'earnings.month': -1 };
        break;
      default:
        sortQuery = { totalDeliveries: -1 };
    }

    const topRiders = await Rider.aggregate([
      {
        $lookup: {
          from: 'delivery_orders',
          localField: '_id',
          foreignField: 'riderId',
          as: 'orders'
        }
      },
      {
        $project: {
          name: 1,
          phone: 1,
          status: 1,
          rating: 1,
          vehicleType: 1,
          totalDeliveries: 1,
          completedDeliveries: 1,
          'metrics.averageDeliveryTime': 1,
          'metrics.onTimeRate': 1,
          'metrics.customerRating': 1,
          'earnings.today': 1,
          'earnings.week': 1,
          'earnings.month': 1,
          recentDeliveries: {
            $slice: ['$orders', 5]
          }
        }
      },
      { $sort: sortQuery },
      { $limit: limit }
    ]);

    // Calculate team statistics
    const teamStats = await Rider.aggregate([
      {
        $group: {
          _id: null,
          totalRiders: { $sum: 1 },
          activeRiders: {
            $sum: { $cond: [{ $ne: ['$status', 'offline'] }, 1, 0] }
          },
          avgRating: { $avg: '$rating' },
          totalDeliveries: { $sum: '$totalDeliveries' },
          avgDeliveryTime: { $avg: '$metrics.averageDeliveryTime' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        topRiders,
        teamStats: teamStats[0] || {}
      }
    });
  })
);

/**
 * @route GET /api/analytics/merchant/:merchantId
 * @desc Get analytics for a specific merchant
 */
router.get(
  '/merchant/:merchantId',
  [
    query('startDate').optional().isISO8601().toDate(),
    query('endDate').optional().isISO8601().toDate()
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await orderService.getOrderStats(
      req.params.merchantId,
      req.query.startDate as Date,
      req.query.endDate as Date
    );

    // Get hourly distribution
    const hourlyDistribution = await DeliveryOrder.aggregate([
      {
        $match: {
          merchantId: req.params.merchantId,
          createdAt: {
            $gte: req.query.startDate
              ? new Date(req.query.startDate as string)
              : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            $lte: req.query.endDate
              ? new Date(req.query.endDate as string)
              : new Date()
          }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        merchantId: req.params.merchantId,
        stats,
        hourlyDistribution
      }
    });
  })
);

/**
 * @route GET /api/analytics/riders/distribution
 * @desc Get rider status distribution
 */
router.get(
  '/riders/distribution',
  asyncHandler(async (req: Request, res: Response) => {
    const distribution = await Rider.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const vehicleDistribution = await Rider.aggregate([
      {
        $group: {
          _id: '$vehicleType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        byStatus: distribution,
        byVehicleType: vehicleDistribution
      }
    });
  })
);

/**
 * @route GET /api/analytics/revenue/daily
 * @desc Get daily revenue breakdown
 */
router.get(
  '/revenue/daily',
  [
    query('days').optional().isInt({ min: 1, max: 90 }).toInt()
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const days = req.query.days || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const dailyRevenue = await DeliveryOrder.aggregate([
      {
        $match: {
          status: 'delivered',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          deliveryFee: { $sum: '$deliveryFee' },
          platformFee: { $sum: '$platformFee' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate totals
    const totals = dailyRevenue.reduce(
      (acc, day) => ({
        revenue: acc.revenue + day.revenue,
        deliveryFee: acc.deliveryFee + day.deliveryFee,
        platformFee: acc.platformFee + day.platformFee,
        orders: acc.orders + day.orders
      }),
      { revenue: 0, deliveryFee: 0, platformFee: 0, orders: 0 }
    );

    res.json({
      success: true,
      data: {
        period: {
          start: startDate,
          end: new Date(),
          days
        },
        dailyRevenue,
        totals
      }
    });
  })
);

/**
 * @route GET /api/analytics/fulfillment/rate
 * @desc Get order fulfillment metrics
 */
router.get(
  '/fulfillment/rate',
  [
    query('startDate').optional().isISO8601().toDate(),
    query('endDate').optional().isISO8601().toDate()
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const matchStage: unknown = {};
    if (req.query.startDate || req.query.endDate) {
      matchStage.createdAt = {};
      if (req.query.startDate) {
        matchStage.createdAt.$gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        matchStage.createdAt.$lte = new Date(req.query.endDate as string);
      }
    }

    const fulfillment = await DeliveryOrder.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          avgDeliveryTime: {
            $avg: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'delivered'] },
                    { $ne: ['$actualDelivery', null] }
                  ]
                },
                {
                  $divide: [
                    { $subtract: ['$actualDelivery', '$createdAt'] },
                    60000
                  ]
                },
                null
              ]
            }
          }
        }
      }
    ]);

    const data = fulfillment[0] || { total: 0, delivered: 0, cancelled: 0 };
    const fulfillmentRate = data.total > 0 ? (data.delivered / data.total) * 100 : 0;
    const cancellationRate = data.total > 0 ? (data.cancelled / data.total) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalOrders: data.total,
        deliveredOrders: data.delivered,
        cancelledOrders: data.cancelled,
        fulfillmentRate: Math.round(fulfillmentRate * 100) / 100,
        cancellationRate: Math.round(cancellationRate * 100) / 100,
        averageDeliveryTimeMinutes: Math.round(data.avgDeliveryTime || 0)
      }
    });
  })
);

export default router;

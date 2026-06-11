/**
 * FLEETIQ - Analytics Routes
 * Dashboard and analytics endpoints
 */

import { Router, Request, Response } from 'express';
import { Vehicle, Driver, Trip, Maintenance } from '../../models';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';
import { getDashboardData } from '../../services/fleetService';
import { logger } from '../../utils/logger';

const router = Router();

// ============================================
// DASHBOARD DATA
// ============================================

router.get(
  '/dashboard',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const data = await getDashboardData();

    res.json({
      success: true,
      ...data,
      generatedAt: new Date().toISOString()
    });
  })
);

// ============================================
// VEHICLE ANALYTICS
// ============================================

router.get(
  '/vehicles',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { period = 'month' } = req.query;

    const periodDays: Record<string, number> = { day: 1, week: 7, month: 30, quarter: 90 };
    const startDate = new Date(Date.now() - (periodDays[period as string] || 30) * 24 * 60 * 60 * 1000);

    // Get fleet composition
    const byType = await Vehicle.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgFuelLevel: { $avg: '$fuelLevel' },
          avgMileage: { $avg: '$mileage' }
        }
      }
    ]);

    // Get status distribution
    const byStatus = await Vehicle.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get utilization trends
    const tripCounts = await Trip.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: 'completed' } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          totalDistance: { $sum: '$distance' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      analytics: {
        period,
        fleetComposition: byType.map(t => ({
          type: t._id,
          count: t.count,
          avgFuelLevel: Math.round(t.avgFuelLevel || 0),
          avgMileage: Math.round(t.avgMileage || 0)
        })),
        statusDistribution: byStatus.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, {} as Record<string, number>),
        utilizationTrends: tripCounts,
        totalVehicles: byType.reduce((sum, t) => sum + t.count, 0)
      }
    });
  })
);

// ============================================
// DRIVER ANALYTICS
// ============================================

router.get(
  '/drivers',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { period = 'month' } = req.query;

    const periodDays: Record<string, number> = { day: 1, week: 7, month: 30, quarter: 90 };
    const startDate = new Date(Date.now() - (periodDays[period as string] || 30) * 24 * 60 * 60 * 1000);

    // Get rating distribution
    const ratingDistribution = await Driver.aggregate([
      {
        $bucket: {
          groupBy: '$rating',
          boundaries: [0, 3, 3.5, 4, 4.5, 5.01],
          default: 'unknown',
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    // Get top performers
    const topPerformers = await Driver.find()
      .sort({ rating: -1, tripsCompleted: -1 })
      .limit(10)
      .select('name rating tripsCompleted totalDistance')
      .lean();

    // Get trips by driver
    const tripsByDriver = await Trip.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$driverId',
          tripCount: { $sum: 1 },
          totalDistance: { $sum: '$distance' }
        }
      },
      { $sort: { tripCount: -1 } },
      { $limit: 10 }
    ]);

    // Populate driver names
    const driverIds = tripsByDriver.map(t => t._id);
    const drivers = await Driver.find({ _id: { $in: driverIds } })
      .select('_id name')
      .lean();

    const driverMap = drivers.reduce((acc, d) => {
      acc[d._id.toString()] = d.name;
      return acc;
    }, {} as Record<string, string>);

    res.json({
      success: true,
      analytics: {
        period,
        ratingDistribution: ratingDistribution.map(r => ({
          range: r._id,
          count: r.count
        })),
        topPerformers,
        mostActiveDrivers: tripsByDriver.map(t => ({
          driverId: t._id,
          name: driverMap[t._id.toString()] || 'Unknown',
          trips: t.tripCount,
          distance: Math.round(t.totalDistance)
        }))
      }
    });
  })
);

// ============================================
// TRIP ANALYTICS
// ============================================

router.get(
  '/trips',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { period = 'month' } = req.query;

    const periodDays: Record<string, number> = { day: 1, week: 7, month: 30, quarter: 90 };
    const startDate = new Date(Date.now() - (periodDays[period as string] || 30) * 24 * 60 * 60 * 1000);

    // Get trip statistics
    const tripStats = await Trip.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgDistance: { $avg: '$distance' },
          avgTime: { $avg: '$estimatedTime' }
        }
      }
    ]);

    // Get daily trip trends
    const dailyTrends = await Trip.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $in: ['$status', ['pending', 'in-progress']] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get distance distribution
    const distanceDistribution = await Trip.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $bucket: {
          groupBy: '$distance',
          boundaries: [0, 50, 100, 200, 500, 1000, Infinity],
          default: 'unknown',
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    // Calculate totals
    const totals = tripStats.reduce((acc, t) => {
      acc[t._id] = t.count;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      analytics: {
        period,
        summary: {
          total: Object.values(totals).reduce((a, b) => a + b, 0),
          completed: totals.completed || 0,
          cancelled: totals.cancelled || 0,
          active: (totals.pending || 0) + (totals['in-progress'] || 0)
        },
        averages: {
          distance: Math.round(tripStats.reduce((s, t) => s + (t.avgDistance || 0), 0) / (tripStats.length || 1)),
          duration: Math.round(tripStats.reduce((s, t) => s + (t.avgTime || 0), 0) / (tripStats.length || 1))
        },
        dailyTrends,
        distanceDistribution: distanceDistribution.map(d => ({
          range: d._id,
          count: d.count
        }))
      }
    });
  })
);

// ============================================
// MAINTENANCE ANALYTICS
// ============================================

router.get(
  '/maintenance',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { period = 'month' } = req.query;

    const periodDays: Record<string, number> = { day: 1, week: 7, month: 30, quarter: 90 };
    const startDate = new Date(Date.now() - (periodDays[period as string] || 30) * 24 * 60 * 60 * 1000);

    // Get maintenance statistics
    const maintenanceStats = await Maintenance.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { type: '$type', status: '$status' },
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' }
        }
      }
    ]);

    // Get upcoming maintenance
    const upcomingMaintenance = await Maintenance.countDocuments({
      status: 'pending',
      date: { $gte: new Date(), $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
    });

    // Get overdue maintenance
    const overdueMaintenance = await Vehicle.countDocuments({
      nextServiceDue: { $lt: new Date() }
    });

    // Get most common maintenance types
    const commonTypes = await Maintenance.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Calculate totals
    const totalCost = maintenanceStats.reduce((s, m) => s + m.totalCost, 0);
    const totalRecords = maintenanceStats.reduce((s, m) => s + m.count, 0);

    res.json({
      success: true,
      analytics: {
        period,
        summary: {
          totalRecords,
          totalCost: Math.round(totalCost),
          avgCostPerRecord: Math.round(totalCost / (totalRecords || 1)),
          upcomingMaintenance,
          overdueMaintenance
        },
        byType: commonTypes.map(t => ({
          type: t._id,
          count: t.count,
          totalCost: t.totalCost
        }))
      }
    });
  })
);

// ============================================
// OVERALL PERFORMANCE
// ============================================

router.get(
  '/performance',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's stats
    const [todayTrips, todayCompleted] = await Promise.all([
      Trip.countDocuments({ createdAt: { $gte: startOfDay } }),
      Trip.countDocuments({ createdAt: { $gte: startOfDay }, status: 'completed' })
    ]);

    // Weekly stats
    const [weekTrips, weekCompleted] = await Promise.all([
      Trip.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Trip.countDocuments({ createdAt: { $gte: startOfWeek }, status: 'completed' })
    ]);

    // Monthly stats
    const [monthTrips, monthCompleted, monthCost] = await Promise.all([
      Trip.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Trip.countDocuments({ createdAt: { $gte: startOfMonth }, status: 'completed' }),
      Maintenance.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$cost' } } }
      ])
    ]);

    // Active resources
    const [activeVehicles, availableDrivers] = await Promise.all([
      Vehicle.countDocuments({ status: 'on-trip' }),
      Driver.countDocuments({ status: 'available' })
    ]);

    res.json({
      success: true,
      performance: {
        today: {
          trips: todayTrips,
          completed: todayCompleted,
          completionRate: todayTrips > 0 ? Math.round((todayCompleted / todayTrips) * 100) : 0
        },
        thisWeek: {
          trips: weekTrips,
          completed: weekCompleted,
          completionRate: weekTrips > 0 ? Math.round((weekCompleted / weekTrips) * 100) : 0
        },
        thisMonth: {
          trips: monthTrips,
          completed: monthCompleted,
          completionRate: monthTrips > 0 ? Math.round((monthCompleted / monthTrips) * 100) : 0,
          maintenanceCost: monthCost[0]?.total || 0
        },
        resources: {
          activeVehicles,
          availableDrivers
        }
      },
      generatedAt: new Date().toISOString()
    });
  })
);

export default router;
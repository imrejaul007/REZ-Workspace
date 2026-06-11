/**
 * GLAMAI - Analytics Routes
 * Salon AI Operating System
 */

import { Router, Request, Response } from 'express';
import { Appointment, Customer, Service, Stylist, Payment } from '../models';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { logger } from '../middleware/logger';

const router = Router();

/**
 * GET /api/analytics/dashboard
 * Get dashboard statistics
 */
router.get(
  '/dashboard',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Today's stats
    const [todayAppointments, totalCustomers, totalServices, totalStylists] = await Promise.all([
      Appointment.find({
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['scheduled', 'confirmed', 'completed'] },
      }).populate('serviceId', 'name price'),
      Customer.countDocuments(),
      Service.countDocuments({ isActive: true }),
      Stylist.countDocuments({ isActive: true }),
    ]);

    // Monthly stats
    const [monthlyAppointments, lastMonthAppointments, monthlyRevenue] = await Promise.all([
      Appointment.countDocuments({ date: { $gte: startOfMonth } }),
      Appointment.countDocuments({ date: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Payment.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]).catch(() => [{ total: 0 }]),
    ]);

    // Top services
    const topServices = await Appointment.aggregate([
      { $match: { date: { $gte: startOfMonth } } },
      { $group: { _id: '$serviceId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Customer tier distribution
    const tierDistribution = await Customer.aggregate([
      { $group: { _id: '$loyaltyTier', count: { $sum: 1 } } },
    ]);

    // Inactive customers (last visit > 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const inactiveCustomers = await Customer.countDocuments({
      $or: [
        { lastVisit: { $lt: thirtyDaysAgo } },
        { lastVisit: null },
      ],
    });

    res.json({
      success: true,
      dashboard: {
        overview: {
          totalCustomers,
          totalServices,
          totalStylists,
          monthlyAppointments,
          monthlyRevenue: monthlyRevenue[0]?.total || 0,
        },
        today: {
          appointments: todayAppointments.length,
          scheduled: todayAppointments.filter((a: any) => a.status === 'scheduled').length,
          completed: todayAppointments.filter((a: any) => a.status === 'completed').length,
          estimatedRevenue: todayAppointments.reduce(
            (sum: number, a: any) => sum + ((a.serviceId as any)?.price || 0),
            0
          ),
        },
        growth: {
          appointmentsChange: monthlyAppointments - lastMonthAppointments,
          appointmentsChangePercent:
            lastMonthAppointments > 0
              ? Math.round(((monthlyAppointments - lastMonthAppointments) / lastMonthAppointments) * 100)
              : 0,
        },
        topServices: topServices.map(s => ({ serviceId: s._id, bookings: s.count })),
        customerSegments: {
          active: totalCustomers - inactiveCustomers,
          inactive: inactiveCustomers,
        },
        loyaltyTiers: tierDistribution.reduce((acc: any, t) => {
          acc[t._id] = t.count;
          return acc;
        }, {}),
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/analytics/revenue
 * Get revenue analytics
 */
router.get(
  '/revenue',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { period = 'month' } = req.query;

    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    }

    // Revenue by day
    const revenueByDay = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Revenue by payment method
    const revenueByMethod = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$method', revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
    ]);

    // Total revenue
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      success: true,
      analytics: {
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalRevenue: totalRevenue[0]?.total || 0,
        revenueByDay,
        revenueByMethod,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/analytics/customers
 * Get customer analytics
 */
router.get(
  '/customers',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalCustomers,
      newCustomersThisMonth,
      activeCustomers,
      inactiveCustomers,
      tierDistribution,
      topSpenders,
    ] = await Promise.all([
      Customer.countDocuments(),
      Customer.countDocuments({
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      }),
      Customer.countDocuments({ lastVisit: { $gte: thirtyDaysAgo } }),
      Customer.countDocuments({
        $or: [{ lastVisit: { $lt: thirtyDaysAgo } }, { lastVisit: null }],
      }),
      Customer.aggregate([
        { $group: { _id: '$loyaltyTier', count: { $sum: 1 }, totalSpent: { $sum: '$totalSpent' } } },
        { $sort: { _id: 1 } },
      ]),
      Customer.find({}).sort({ totalSpent: -1 }).limit(10).select('name phone totalSpent visits'),
    ]);

    res.json({
      success: true,
      analytics: {
        totalCustomers,
        newCustomersThisMonth,
        activeCustomers,
        inactiveCustomers,
        retentionRate: totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0,
        tierDistribution,
        topSpenders,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/analytics/services
 * Get service analytics
 */
router.get(
  '/services',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // Service popularity
    const servicePopularity = await Appointment.aggregate([
      { $match: { date: { $gte: startOfMonth } } },
      { $group: { _id: '$serviceId', bookings: { $sum: 1 } } },
      { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
      { $unwind: '$service' },
      {
        $project: {
          serviceId: '$_id',
          name: '$service.name',
          category: '$service.category',
          price: '$service.price',
          duration: '$service.duration',
          bookings: 1,
          revenue: { $multiply: ['$bookings', '$service.price'] },
        },
      },
      { $sort: { bookings: -1 } },
    ]);

    // Category distribution
    const categoryDistribution = await Appointment.aggregate([
      { $match: { date: { $gte: startOfMonth } } },
      { $lookup: { from: 'services', localField: 'serviceId', foreignField: '_id', as: 'service' } },
      { $unwind: '$service' },
      { $group: { _id: '$service.category', bookings: { $sum: 1 }, revenue: { $sum: '$service.price' } } },
      { $sort: { bookings: -1 } },
    ]);

    res.json({
      success: true,
      analytics: {
        servicePopularity,
        categoryDistribution,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/analytics/stylists
 * Get stylist analytics
 */
router.get(
  '/stylists',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // Stylist performance
    const stylistPerformance = await Appointment.aggregate([
      { $match: { date: { $gte: startOfMonth }, status: 'completed' } },
      { $group: { _id: '$stylistId', appointments: { $sum: 1 } } },
      { $lookup: { from: 'stylists', localField: '_id', foreignField: '_id', as: 'stylist' } },
      { $unwind: { path: '$stylist', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          stylistId: '$_id',
          name: { $ifNull: ['$stylist.name', 'Unknown'] },
          appointments: 1,
          rating: { $ifNull: ['$stylist.rating', 0] },
        },
      },
      { $sort: { appointments: -1 } },
    ]);

    res.json({
      success: true,
      analytics: {
        stylistPerformance,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
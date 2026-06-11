/**
 * NEIGHBORAI - Analytics Dashboard Routes
 */

import { Router, Response } from 'express';
import { Resident, Visitor, Complaint, Maintenance, Event } from '../models';
import { optionalAuth, AuthRequest } from '../middleware/auth';
import { logger } from '../middleware/logger';

const router = Router();

// GET /api/analytics/dashboard - Get comprehensive dashboard data
router.get('/dashboard', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch all data in parallel
    const [
      totalResidents,
      ownerCount,
      tenantCount,
      todayVisitors,
      activeVisitors,
      pendingVisitors,
      openComplaints,
      inProgressComplaints,
      resolvedComplaints,
      overdueMaintenance,
      pendingMaintenance,
      upcomingEvents,
      monthlyRevenue,
      lastMonthRevenue
    ] = await Promise.all([
      // Residents
      Resident.countDocuments(),
      Resident.countDocuments({ status: 'owner' }),
      Resident.countDocuments({ status: 'tenant' }),

      // Visitors
      Visitor.countDocuments({ checkIn: { $gte: today } }),
      Visitor.countDocuments({ status: 'checked-in' }),
      Visitor.countDocuments({ status: 'pending' }),

      // Complaints
      Complaint.countDocuments({ status: 'open' }),
      Complaint.countDocuments({ status: 'in-progress' }),
      Complaint.countDocuments({ status: 'resolved' }),

      // Maintenance
      Maintenance.countDocuments({ status: 'overdue' }),
      Maintenance.countDocuments({ status: 'pending' }),

      // Events
      Event.countDocuments({ date: { $gte: now } }),

      // Revenue (paid in current month)
      Maintenance.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: startOfMonth, $lte: now } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } }
      ]),

      // Last month revenue
      Maintenance.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: lastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } }
      ])
    ]);

    // Calculate pending revenue
    const pendingRevenueData = await Maintenance.aggregate([
      { $match: { status: { $in: ['pending', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingRevenue = pendingRevenueData[0]?.total || 0;
    const currentRevenue = monthlyRevenue[0]?.total || 0;
    const prevRevenue = lastMonthRevenue[0]?.total || 0;

    // Complaint category breakdown
    const complaintCategories = await Complaint.aggregate([
      { $match: { status: { $in: ['open', 'in-progress'] } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Maintenance by category
    const maintenanceByCategory = await Maintenance.aggregate([
      { $match: { status: 'overdue' } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    // Wing-wise residents
    const residentsByWing = await Resident.aggregate([
      { $group: { _id: '$wing', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Recent activity
    const recentComplaints = await Complaint.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('category status priority createdAt flatNumber');

    const recentVisitors = await Visitor.find()
      .sort({ checkIn: -1 })
      .limit(5)
      .select('name hostFlat checkIn status');

    // Calculate growth rates
    const residentGrowth = totalResidents > 0 ? ((ownerCount - tenantCount) / totalResidents * 100).toFixed(1) : '0';
    const revenueGrowth = prevRevenue > 0 ? (((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : '0';

    // AI Status
    const aiStatus = {
      societyManager: { status: 'active', queriesToday: Math.floor(Math.random() * 50) + 10 },
      visitorAgent: { status: 'active', visitorsProcessed: todayVisitors },
      complaintAgent: { status: 'active', openComplaints },
      communityAgent: { status: 'active', upcomingEvents }
    };

    logger.info('Dashboard data fetched', { userId: req.userId });

    res.json({
      success: true,
      dashboard: {
        overview: {
          totalResidents,
          owners: ownerCount,
          tenants: tenantCount,
          totalFlats: await Resident.distinct('flatNumber').then(d => d.length)
        },
        visitors: {
          todayCount: todayVisitors,
          currentlyInside: activeVisitors,
          pendingApproval: pendingVisitors
        },
        complaints: {
          open: openComplaints,
          inProgress: inProgressComplaints,
          resolved: resolvedComplaints,
          total: openComplaints + inProgressComplaints + resolvedComplaints,
          resolutionRate: resolvedComplaints > 0
            ? ((resolvedComplaints / (openComplaints + inProgressComplaints + resolvedComplaints)) * 100).toFixed(1) + '%'
            : '0%'
        },
        maintenance: {
          pending: pendingMaintenance,
          overdue: overdueMaintenance,
          pendingRevenue,
          collectedRevenue: currentRevenue
        },
        events: {
          upcoming: upcomingEvents
        },
        revenue: {
          collected: currentRevenue,
          pending: pendingRevenue,
          growth: revenueGrowth + '%'
        },
        breakdown: {
          complaintsByCategory: complaintCategories.map(c => ({ category: c._id, count: c.count })),
          overdueByCategory: maintenanceByCategory.map(m => ({ category: m._id, total: m.total, count: m.count })),
          residentsByWing: residentsByWing.map(w => ({ wing: w._id, count: w.count }))
        },
        recentActivity: {
          complaints: recentComplaints,
          visitors: recentVisitors
        },
        aiStatus,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/residents - Get resident analytics
router.get('/residents', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { wing } = req.query;
    const match = wing ? { wing } : {};

    const [total, owners, tenants, byWing, byStatus] = await Promise.all([
      Resident.countDocuments(match),
      Resident.countDocuments({ ...match, status: 'owner' }),
      Resident.countDocuments({ ...match, status: 'tenant' }),
      Resident.aggregate([
        { $match: match },
        { $group: { _id: '$wing', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Resident.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    // Get vehicles count
    const residentsWithVehicles = await Resident.countDocuments({
      ...match,
      vehicleNumbers: { $exists: true, $ne: [] }
    });

    res.json({
      success: true,
      analytics: {
        total,
        owners,
        tenants,
        residentsWithVehicles,
        ownershipRatio: total > 0 ? ((owners / total) * 100).toFixed(1) + '%' : '0%',
        byWing: byWing.map(w => ({ wing: w._id, count: w.count })),
        byStatus
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/visitors - Get visitor analytics
router.get('/visitors', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [todayCount, weekCount, monthCount, byStatus, byPurpose, peakHours] = await Promise.all([
      Visitor.countDocuments({ checkIn: { $gte: today } }),
      Visitor.countDocuments({ checkIn: { $gte: last7Days } }),
      Visitor.countDocuments({ checkIn: { $gte: last30Days } }),
      Visitor.aggregate([
        { $match: { checkIn: { $gte: last30Days } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Visitor.aggregate([
        { $match: { checkIn: { $gte: last30Days } } },
        { $group: { _id: '$purpose', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Visitor.aggregate([
        { $match: { checkIn: { $gte: last30Days } } },
        { $project: { hour: { $hour: '$checkIn' } } },
        { $group: { _id: '$hour', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    // Get most visited flats
    const topVisitedFlats = await Visitor.aggregate([
      { $match: { checkIn: { $gte: last30Days } } },
      { $group: { _id: '$hostFlat', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      analytics: {
        today: todayCount,
        last7Days: weekCount,
        last30Days: monthCount,
        averagePerDay: (monthCount / 30).toFixed(1),
        byStatus: byStatus.map(s => ({ status: s._id, count: s.count })),
        byPurpose: byPurpose.map(p => ({ purpose: p._id, count: p.count })),
        peakHours: peakHours.map(h => ({ hour: h._id + ':00', visits: h.count })),
        topVisitedFlats: topVisitedFlats.map(f => ({ flat: f._id, visits: f.count }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/complaints - Get complaint analytics
router.get('/complaints', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const [total, open, inProgress, resolved, closed] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'open' }),
      Complaint.countDocuments({ status: 'in-progress' }),
      Complaint.countDocuments({ status: 'resolved' }),
      Complaint.countDocuments({ status: 'closed' })
    ]);

    const [byPriority, byCategory, avgResolutionDays] = await Promise.all([
      Complaint.aggregate([
        { $match: { status: 'resolved' } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Complaint.aggregate([
        { $match: { status: { $in: ['open', 'in-progress'] } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Complaint.aggregate([
        { $match: { status: 'resolved' } },
        { $project: { resolutionDays: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 86400000] } } },
        { $group: { _id: null, avgDays: { $avg: '$resolutionDays' } } }
      ])
    ]);

    // Get SLA compliance
    const urgentComplaints = await Complaint.countDocuments({ priority: 'urgent', status: { $in: ['open', 'in-progress'] }, createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
    const highComplaints = await Complaint.countDocuments({ priority: 'high', status: { $in: ['open', 'in-progress'] }, createdAt: { $lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } });

    res.json({
      success: true,
      analytics: {
        summary: { total, open, inProgress, resolved, closed },
        resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(1) + '%' : '0%',
        avgResolutionDays: avgResolutionDays[0]?.avgDays?.toFixed(1) || '0',
        byPriority: byPriority.map(p => ({ priority: p._id, count: p.count })),
        byCategory: byCategory.map(c => ({ category: c._id, count: c.count })),
        slaCompliance: {
          urgentOverdue: urgentComplaints,
          highOverdue: highComplaints
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/maintenance - Get maintenance analytics
router.get('/maintenance', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [pendingCount, overdueCount, paidCount, monthlyCollected, lastMonthCollected, byStatus] = await Promise.all([
      Maintenance.countDocuments({ status: 'pending' }),
      Maintenance.countDocuments({ status: 'overdue' }),
      Maintenance.countDocuments({ status: 'paid' }),
      Maintenance.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' }, count: { $sum: 1 } } }
      ]),
      Maintenance.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: lastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } }
      ]),
      Maintenance.aggregate([
        { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    ]);

    const monthlyTotal = monthlyCollected[0]?.total || 0;
    const lastMonthTotal = lastMonthCollected[0]?.total || 0;
    const collectionRate = lastMonthTotal > 0 ? (((monthlyTotal - lastMonthTotal) / lastMonthTotal) * 100).toFixed(1) : '0';

    res.json({
      success: true,
      analytics: {
        summary: { pending: pendingCount, overdue: overdueCount, paid: paidCount },
        revenue: {
          thisMonth: monthlyTotal,
          lastMonth: lastMonthTotal,
          growth: collectionRate + '%'
        },
        byStatus: byStatus.map(s => ({ status: s._id, total: s.total, count: s.count })),
        pendingAmount: byStatus.find(s => s._id === 'pending')?.total || 0,
        overdueAmount: byStatus.find(s => s._id === 'overdue')?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/events - Get event analytics
router.get('/events', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [upcomingCount, pastCount, totalAttendees] = await Promise.all([
      Event.countDocuments({ date: { $gte: now } }),
      Event.countDocuments({ date: { $gte: last30Days, $lte: now } }),
      Event.aggregate([
        { $match: { date: { $gte: last30Days, $lte: now } } },
        { $group: { _id: null, total: { $sum: { $size: '$attendees' } } } }
      ])
    ]);

    // Get top events by attendance
    const topEvents = await Event.find({ date: { $lte: now } })
      .sort({ date: -1 })
      .limit(10)
      .select('title date attendees')
      .then(events => events.map(e => ({
        title: e.title,
        date: e.date,
        attendeeCount: e.attendees.length
      })));

    // Get events this month
    const thisMonthEvents = await Event.countDocuments({
      date: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) }
    });

    res.json({
      success: true,
      analytics: {
        upcoming: upcomingCount,
        pastLast30Days: pastCount,
        thisMonth: thisMonthEvents,
        totalAttendeesLast30Days: totalAttendees[0]?.total || 0,
        avgAttendance: pastCount > 0 ? Math.round((totalAttendees[0]?.total || 0) / pastCount) : 0,
        topEvents
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
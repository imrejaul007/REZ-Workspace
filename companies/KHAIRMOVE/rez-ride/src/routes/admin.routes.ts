import { logger } from '../../shared/logger';
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Ride } from '../models/ride.model';
import { Driver, DriverStatus } from '../models/driver.model';
import { User } from '../models/user.model';
import { Campaign } from '../models/campaign.model';

const router = Router();

// ===========================================
// DASHBOARD STATS
// ===========================================

/**
 * @route GET /api/admin/stats
 * @desc Get dashboard statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ride stats
    const totalRides = await Ride.countDocuments();
    const todayRides = await Ride.countDocuments({ requestedAt: { $gte: today } });
    const completedRides = await Ride.countDocuments({ status: 'completed' });
    const cancelledRides = await Ride.countDocuments({ status: 'cancelled' });

    // Driver stats
    const totalDrivers = await Driver.countDocuments();
    const onlineDrivers = await Driver.countDocuments({ status: 'online' });
    const pendingDrivers = await Driver.countDocuments({ status: 'pending_verification' });
    const suspendedDrivers = await Driver.countDocuments({ status: 'suspended' });

    // User stats
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ lastRideAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });

    // Revenue stats (completed rides)
    const completedRidesList = await Ride.find({ status: 'completed' });
    const totalRevenue = completedRidesList.reduce((sum, r) => sum + (r.fare?.total || 0), 0);
    const todayRevenue = completedRidesList
      .filter(r => r.completedAt && r.completedAt >= today)
      .reduce((sum, r) => sum + (r.fare?.total || 0), 0);

    // Cashback distributed
    const totalCashback = completedRidesList.reduce((sum, r) => sum + (r.cashbackAmount || 0), 0);

    // Active campaigns
    const activeCampaigns = await Campaign.countDocuments({ status: 'active' });

    res.json({
      success: true,
      stats: {
        rides: {
          total: totalRides,
          today: todayRides,
          completed: completedRides,
          cancelled: cancelledRides,
          completionRate: totalRides > 0 ? (completedRides / totalRides * 100).toFixed(1) : 0,
        },
        drivers: {
          total: totalDrivers,
          online: onlineDrivers,
          pending: pendingDrivers,
          suspended: suspendedDrivers,
        },
        users: {
          total: totalUsers,
          active: activeUsers,
        },
        revenue: {
          total: totalRevenue,
          today: todayRevenue,
          cashback: totalCashback,
        },
        campaigns: {
          active: activeCampaigns,
        },
      },
    });
  } catch (error) {
    logger.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ===========================================
// DRIVER MANAGEMENT
// ===========================================

/**
 * @route GET /api/admin/drivers
 * @desc Get all drivers with filters
 */
router.get('/drivers', async (req: Request, res: Response) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'vehicle.plate': { $regex: search, $options: 'i' } },
      ];
    }

    const [drivers, total] = await Promise.all([
      Driver.find(query).skip(skip).limit(parseInt(limit as string)).sort({ createdAt: -1 }),
      Driver.countDocuments(query),
    ]);

    res.json({
      success: true,
      drivers,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    logger.error('Get drivers error:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

/**
 * @route GET /api/admin/drivers/:id
 * @desc Get driver details
 */
router.get('/drivers/:id', async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Get recent rides
    const recentRides = await Ride.find({ driverId: driver._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      driver,
      recentRides,
    });
  } catch (error) {
    logger.error('Get driver error:', error);
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
});

/**
 * @route PATCH /api/admin/drivers/:id
 * @desc Update driver (status, verification)
 */
router.patch('/drivers/:id', async (req: Request, res: Response) => {
  try {
    const { status, isDocumentsVerified } = req.body;

    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    if (status) {
      driver.status = status;
    }

    if (typeof isDocumentsVerified === 'boolean') {
      driver.isDocumentsVerified = isDocumentsVerified;
    }

    await driver.save();

    res.json({
      success: true,
      driver,
    });
  } catch (error) {
    logger.error('Update driver error:', error);
    res.status(500).json({ error: 'Failed to update driver' });
  }
});

/**
 * @route POST /api/admin/drivers/:id/approve
 * @desc Approve driver
 */
router.post('/drivers/:id/approve', async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    driver.isDocumentsVerified = true;
    driver.status = DriverStatus.OFFLINE; // Can go online now
    await driver.save();

    res.json({
      success: true,
      driver,
      message: 'Driver approved successfully',
    });
  } catch (error) {
    logger.error('Approve driver error:', error);
    res.status(500).json({ error: 'Failed to approve driver' });
  }
});

/**
 * @route POST /api/admin/drivers/:id/reject
 * @desc Reject driver
 */
router.post('/drivers/:id/reject', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    driver.status = DriverStatus.SUSPENDED;
    driver.isDocumentsVerified = false;
    await driver.save();

    res.json({
      success: true,
      message: 'Driver rejected',
    });
  } catch (error) {
    logger.error('Reject driver error:', error);
    res.status(500).json({ error: 'Failed to reject driver' });
  }
});

/**
 * @route POST /api/admin/drivers/:id/suspend
 * @desc Suspend driver
 */
router.post('/drivers/:id/suspend', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    driver.status = DriverStatus.SUSPENDED;
    await driver.save();

    res.json({
      success: true,
      driver,
      message: 'Driver suspended',
    });
  } catch (error) {
    logger.error('Suspend driver error:', error);
    res.status(500).json({ error: 'Failed to suspend driver' });
  }
});

// ===========================================
// RIDE MANAGEMENT
// ===========================================

/**
 * @route GET /api/admin/rides
 * @desc Get all rides with filters
 */
router.get('/rides', async (req: Request, res: Response) => {
  try {
    const { status, search, page = 1, limit = 20, startDate, endDate } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.requestedAt = {};
      if (startDate) query.requestedAt.$gte = new Date(startDate as string);
      if (endDate) query.requestedAt.$lte = new Date(endDate as string);
    }

    const [rides, total] = await Promise.all([
      Ride.find(query)
        .populate('userId', 'name phone')
        .populate('driverId', 'name phone vehicle')
        .skip(skip)
        .limit(parseInt(limit as string))
        .sort({ requestedAt: -1 }),
      Ride.countDocuments(query),
    ]);

    res.json({
      success: true,
      rides,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    logger.error('Get rides error:', error);
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
});

/**
 * @route GET /api/admin/rides/:id
 * @desc Get ride details
 */
router.get('/rides/:id', async (req: Request, res: Response) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('userId', 'name phone')
      .populate('driverId', 'name phone vehicle');

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    res.json({
      success: true,
      ride,
    });
  } catch (error) {
    logger.error('Get ride error:', error);
    res.status(500).json({ error: 'Failed to fetch ride' });
  }
});

// ===========================================
// CAMPAIGN MANAGEMENT
// ===========================================

/**
 * @route GET /api/admin/campaigns
 * @desc Get all campaigns
 */
router.get('/campaigns', async (req: Request, res: Response) => {
  try {
    const { status, merchantId } = req.query;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (merchantId) {
      query.merchantId = merchantId;
    }

    const campaigns = await Campaign.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      campaigns,
    });
  } catch (error) {
    logger.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

/**
 * @route PATCH /api/admin/campaigns/:id
 * @desc Update campaign status
 */
router.patch('/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (status) {
      campaign.status = status;
    }

    await campaign.save();

    res.json({
      success: true,
      campaign,
    });
  } catch (error) {
    logger.error('Update campaign error:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// ===========================================
// USER MANAGEMENT
// ===========================================

/**
 * @route GET /api/admin/users
 * @desc Get all users
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(parseInt(limit as string)).sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * @route GET /api/admin/users/:id
 * @desc Get user details with ride history
 */
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRides = await Ride.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      user,
      rides: userRides,
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ===========================================
// EXPORT DATA
// ===========================================

/**
 * @route GET /api/admin/export/rides
 * @desc Export rides data as CSV
 */
router.get('/export/rides', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, status } = req.query;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.requestedAt = {};
      if (startDate) query.requestedAt.$gte = new Date(startDate as string);
      if (endDate) query.requestedAt.$lte = new Date(endDate as string);
    }

    const rides = await Ride.find(query).populate('userId', 'phone').populate('driverId', 'name phone');

    // Generate CSV
    const headers = ['Ride ID', 'User', 'Driver', 'Pickup', 'Drop', 'Vehicle', 'Status', 'Fare', 'Date'];
    const rows = rides.map(r => [
      r._id.toString(),
      (r.userId as any)?.phone || 'N/A',
      (r.driverId as any)?.name || 'N/A',
      r.pickup.address,
      r.drop.address,
      r.vehicleType,
      r.status,
      r.fare?.total || 0,
      r.requestedAt.toISOString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=rides.csv');
    res.send(csv);
  } catch (error) {
    logger.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

export default router;

import { Injectable, Logger } from '@nestjs/common';

/**
 * Reports Service - Real analytics dashboard data from MongoDB
 * Replaces fake Math.random() data with actual ride statistics
 */

export interface DailyReport {
  date: Date;
  rides: number;
  revenue: number;
  avgFare: number;
  completedRides: number;
  cancelledRides: number;
  activeDrivers: number;
}

export interface WeeklyReport {
  startDate: Date;
  endDate: Date;
  totalRides: number;
  totalRevenue: number;
  avgRating: number;
  topDrivers: Array<{
    driverId: string;
    totalRides: number;
    totalEarnings: number;
    rating: number;
  }>;
}

export interface DriverEarningsReport {
  driverId: string;
  totalRides: number;
  rideEarnings: number;
  adRevenue: number;
  bonuses: number;
  totalEarnings: number;
  hoursOnline: number;
  distanceKm: number;
  avgRating: number;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger('ReportsService');

  // Lazy imports to avoid circular dependency
  private get models() {
    const mongoose = require('mongoose');
    return {
      Ride: mongoose.model('Ride'),
      Driver: mongoose.model('Driver'),
      User: mongoose.model('User'),
    };
  }

  /**
   * Get daily report with real data from MongoDB
   */
  async getDailyReport(date: Date): Promise<DailyReport> {
    try {
      const { Ride, Driver } = this.models;

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get ride statistics
      const rideStats = await Ride.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay, $lte: endOfDay },
          },
        },
        {
          $group: {
            _id: null,
            totalRides: { $sum: 1 },
            completedRides: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            cancelledRides: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
            },
            totalRevenue: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, { $ifNull: ['$finalAmount', 0] }, 0] },
            },
          },
        },
      ]);

      const stats = rideStats[0] || {
        totalRides: 0,
        completedRides: 0,
        cancelledRides: 0,
        totalRevenue: 0,
      };

      // Get active drivers (who were online during the day)
      const activeDrivers = await Driver.countDocuments({
        lastLocationUpdate: { $gte: startOfDay, $lte: endOfDay },
        status: 'online',
      });

      return {
        date,
        rides: stats.totalRides,
        revenue: stats.totalRevenue,
        avgFare: stats.completedRides > 0
          ? Math.round((stats.totalRevenue / stats.completedRides) * 100) / 100
          : 0,
        completedRides: stats.completedRides,
        cancelledRides: stats.cancelledRides,
        activeDrivers,
      };
    } catch (error) {
      this.logger.error(`Failed to generate daily report: ${error.message}`);
      // Return empty report on error rather than fake data
      return {
        date,
        rides: 0,
        revenue: 0,
        avgFare: 0,
        completedRides: 0,
        cancelledRides: 0,
        activeDrivers: 0,
      };
    }
  }

  /**
   * Get weekly report with real data from MongoDB
   */
  async getWeeklyReport(startDate: Date, endDate: Date): Promise<WeeklyReport> {
    try {
      const { Ride, Driver } = this.models;

      // Get weekly ride statistics
      const rideStats = await Ride.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed',
          },
        },
        {
          $group: {
            _id: null,
            totalRides: { $sum: 1 },
            totalRevenue: { $sum: { $ifNull: ['$finalAmount', 0] } },
            avgFare: { $avg: { $ifNull: ['$finalAmount', 0] } },
            avgRating: { $avg: { $ifNull: ['$userRating', 0] } },
          },
        },
      ]);

      const stats = rideStats[0] || {
        totalRides: 0,
        totalRevenue: 0,
        avgFare: 0,
        avgRating: 0,
      };

      // Get top drivers by earnings
      const topDrivers = await Ride.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed',
            driverId: { $exists: true },
          },
        },
        {
          $group: {
            _id: '$driverId',
            totalRides: { $sum: 1 },
            totalEarnings: { $sum: { $ifNull: ['$finalAmount', 0] } },
            avgRating: { $avg: { $ifNull: ['$driverRating', 0] } },
          },
        },
        { $sort: { totalEarnings: -1 } },
        { $limit: 10 },
      ]);

      return {
        startDate,
        endDate,
        totalRides: stats.totalRides,
        totalRevenue: stats.totalRevenue,
        avgRating: Math.round(stats.avgRating * 10) / 10 || 0,
        topDrivers: topDrivers.map((d: any) => ({
          driverId: d._id?.toString() || 'unknown',
          totalRides: d.totalRides,
          totalEarnings: d.totalEarnings,
          rating: Math.round(d.avgRating * 10) / 10 || 0,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to generate weekly report: ${error.message}`);
      return {
        startDate,
        endDate,
        totalRides: 0,
        totalRevenue: 0,
        avgRating: 0,
        topDrivers: [],
      };
    }
  }

  /**
   * Get driver earnings report with real data
   */
  async getDriverEarnings(driverId: string, startDate: Date, endDate: Date): Promise<DriverEarningsReport | null> {
    try {
      const { Ride, Driver } = this.models;

      // Get driver info
      const driver = await Driver.findById(driverId).lean();
      if (!driver) {
        return null;
      }

      // Get ride earnings
      const rideStats = await Ride.aggregate([
        {
          $match: {
            driverId: new (require('mongoose').Types.ObjectId)(driverId),
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed',
          },
        },
        {
          $group: {
            _id: null,
            totalRides: { $sum: 1 },
            rideEarnings: { $sum: { $ifNull: ['$finalAmount', 0] } },
            totalDistanceKm: { $sum: { $ifNull: ['$distanceKm', 0] } },
            totalMinutes: { $sum: { $ifNull: ['$durationMinutes', 0] } },
            avgRating: { $avg: { $ifNull: ['$driverRating', 0] } },
          },
        },
      ]);

      const stats = rideStats[0] || {
        totalRides: 0,
        rideEarnings: 0,
        totalDistanceKm: 0,
        totalMinutes: 0,
        avgRating: 0,
      };

      // Calculate ad revenue (from completed rides with ads)
      const adStats = await Ride.aggregate([
        {
          $match: {
            driverId: new (require('mongoose').Types.ObjectId)(driverId),
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed',
            adServed: true,
          },
        },
        {
          $group: {
            _id: null,
            adImpressions: { $sum: { $ifNull: ['$adImpressions', 0] } },
          },
        },
      ]);

      const adImpressions = adStats[0]?.adImpressions || 0;
      const adRevenue = adImpressions * 0.05; // ₹0.05 per impression

      // Calculate hours online (approximate from ride minutes)
      const hoursOnline = Math.round(stats.totalMinutes / 60 * 10) / 10;

      return {
        driverId,
        totalRides: stats.totalRides,
        rideEarnings: stats.rideEarnings,
        adRevenue: Math.round(adRevenue * 100) / 100,
        bonuses: 0, // Would need separate bonus collection
        totalEarnings: stats.rideEarnings + adRevenue,
        hoursOnline,
        distanceKm: Math.round(stats.totalDistanceKm * 10) / 10,
        avgRating: Math.round(stats.avgRating * 10) / 10 || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to generate driver earnings report: ${error.message}`);
      return null;
    }
  }

  /**
   * Get user ride history
   */
  async getUserRideHistory(userId: string, options: { page?: number; limit?: number } = {}): Promise<{
    rides: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const { Ride } = this.models;
      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const [rides, total] = await Promise.all([
        Ride.find({ userId: new (require('mongoose').Types.ObjectId)(userId) })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Ride.countDocuments({ userId: new (require('mongoose').Types.ObjectId)(userId) }),
      ]);

      return {
        rides,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Failed to get user ride history: ${error.message}`);
      return { rides: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  /**
   * Get platform-wide statistics
   */
  async getPlatformStats(): Promise<{
    totalRides: number;
    totalRevenue: number;
    totalDrivers: number;
    totalUsers: number;
    avgRating: number;
  }> {
    try {
      const { Ride, Driver, User } = this.models;

      const [rideStats, driverCount, userCount, ratingStats] = await Promise.all([
        Ride.aggregate([
          { $match: { status: 'completed' } },
          {
            $group: {
              _id: null,
              totalRides: { $sum: 1 },
              totalRevenue: { $sum: { $ifNull: ['$finalAmount', 0] } },
            },
          },
        ]),
        Driver.countDocuments({ status: { $in: ['online', 'offline'] } }),
        User.countDocuments({}),
        Ride.aggregate([
          { $match: { status: 'completed', userRating: { $gt: 0 } } },
          { $group: { _id: null, avgRating: { $avg: '$userRating' } } },
        ]),
      ]);

      return {
        totalRides: rideStats[0]?.totalRides || 0,
        totalRevenue: rideStats[0]?.totalRevenue || 0,
        totalDrivers: driverCount,
        totalUsers: userCount,
        avgRating: Math.round((ratingStats[0]?.avgRating || 0) * 10) / 10,
      };
    } catch (error) {
      this.logger.error(`Failed to get platform stats: ${error.message}`);
      return {
        totalRides: 0,
        totalRevenue: 0,
        totalDrivers: 0,
        totalUsers: 0,
        avgRating: 0,
      };
    }
  }
}

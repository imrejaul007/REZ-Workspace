import { v4 as uuidv4 } from 'uuid';
import { Wedding, IWedding } from '../models/Wedding';
import { Guest } from '../models/Guest';
import { Vendor } from '../models/Vendor';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

export interface CreateWeddingDto {
  coupleName: string;
  brideName: string;
  groomName: string;
  weddingDate: Date;
  weddingEndDate?: Date;
  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    capacity?: number;
  };
  budget?: {
    total: number;
    currency?: string;
    breakdown?: {
      venue?: number;
      catering?: number;
      photography?: number;
      decoration?: number;
      entertainment?: number;
      attire?: number;
      flowers?: number;
      transportation?: number;
      gifts?: number;
      other?: number;
    };
  };
  theme?: string;
  style?: string;
  guestCategories?: string[];
  hashtags?: string[];
  instagramHandle?: string;
  ownerId: string;
  createdBy: string;
}

export interface UpdateWeddingDto {
  coupleName?: string;
  brideName?: string;
  groomName?: string;
  weddingDate?: Date;
  weddingEndDate?: Date;
  venue?: Partial<Wedding['venue']>;
  budget?: Partial<Wedding['budget']>;
  guestCount?: Partial<Wedding['guestCount']>;
  theme?: string;
  style?: string;
  guestCategories?: string[];
  hashtags?: string[];
  instagramHandle?: string;
  status?: Wedding['status'];
  estimatedAttendees?: number;
  updatedBy: string;
}

export interface WeddingFilters {
  ownerId?: string;
  status?: Wedding['status'];
  city?: string;
  state?: string;
  startDate?: Date;
  endDate?: Date;
  minBudget?: number;
  maxBudget?: number;
  hashtags?: string[];
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class WeddingService {
  /**
   * Create a new wedding
   */
  async createWedding(data: CreateWeddingDto): Promise<IWedding> {
    try {
      const weddingId = `WDG-${uuidv4().substring(0, 8).toUpperCase()}`;

      const wedding = new Wedding({
        weddingId,
        ...data,
        guestCount: {
          expected: 0,
          confirmed: 0,
          declined: 0,
          tentative: 0
        },
        status: 'planning'
      });

      await wedding.save();

      logger.info('Wedding created', {
        weddingId,
        coupleName: data.coupleName,
        weddingDate: data.weddingDate
      });

      return wedding;
    } catch (error) {
      logger.error('Error creating wedding:', error);
      throw error;
    }
  }

  /**
   * Get wedding by ID
   */
  async getWeddingById(weddingId: string): Promise<IWedding | null> {
    try {
      const wedding = await Wedding.findOne({ weddingId });
      return wedding;
    } catch (error) {
      logger.error('Error getting wedding:', error);
      throw error;
    }
  }

  /**
   * Get wedding by MongoDB _id
   */
  async getWeddingByObjectId(id: string): Promise<IWedding | null> {
    try {
      const wedding = await Wedding.findById(id);
      return wedding;
    } catch (error) {
      logger.error('Error getting wedding by object ID:', error);
      throw error;
    }
  }

  /**
   * Update wedding
   */
  async updateWedding(weddingId: string, data: UpdateWeddingDto): Promise<IWedding | null> {
    try {
      const wedding = await Wedding.findOneAndUpdate(
        { weddingId },
        { $set: data },
        { new: true, runValidators: true }
      );

      if (wedding) {
        logger.info('Wedding updated', {
          weddingId,
          updatedFields: Object.keys(data)
        });
      }

      return wedding;
    } catch (error) {
      logger.error('Error updating wedding:', error);
      throw error;
    }
  }

  /**
   * Delete wedding (soft delete by setting status to cancelled)
   */
  async deleteWedding(weddingId: string): Promise<boolean> {
    try {
      const result = await Wedding.findOneAndUpdate(
        { weddingId },
        { $set: { status: 'cancelled' } },
        { new: true }
      );

      if (result) {
        logger.info('Wedding cancelled', { weddingId });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error deleting wedding:', error);
      throw error;
    }
  }

  /**
   * List weddings with filters and pagination
   */
  async listWeddings(
    filters: WeddingFilters,
    pagination: PaginationOptions
  ): Promise<{ weddings: IWedding[]; total: number; page: number; totalPages: number }> {
    try {
      const query: any = {};

      if (filters.ownerId) query.ownerId = filters.ownerId;
      if (filters.status) query.status = filters.status;
      if (filters.city) query['venue.city'] = filters.city;
      if (filters.state) query['venue.state'] = filters.state;
      if (filters.startDate || filters.endDate) {
        query.weddingDate = {};
        if (filters.startDate) query.weddingDate.$gte = filters.startDate;
        if (filters.endDate) query.weddingDate.$lte = filters.endDate;
      }
      if (filters.minBudget || filters.maxBudget) {
        query['budget.total'] = {};
        if (filters.minBudget) query['budget.total'].$gte = filters.minBudget;
        if (filters.maxBudget) query['budget.total'].$lte = filters.maxBudget;
      }
      if (filters.hashtags && filters.hashtags.length > 0) {
        query.hashtags = { $in: filters.hashtags };
      }

      const sortField = pagination.sortBy || 'weddingDate';
      const sortDirection = pagination.sortOrder === 'desc' ? -1 : 1;

      const [weddings, total] = await Promise.all([
        Wedding.find(query)
          .sort({ [sortField]: sortDirection })
          .skip((pagination.page - 1) * pagination.limit)
          .limit(pagination.limit),
        Wedding.countDocuments(query)
      ]);

      return {
        weddings,
        total,
        page: pagination.page,
        totalPages: Math.ceil(total / pagination.limit)
      };
    } catch (error) {
      logger.error('Error listing weddings:', error);
      throw error;
    }
  }

  /**
   * Find nearby weddings
   */
  async findNearbyWeddings(
    latitude: number,
    longitude: number,
    radiusKm: number = 50
  ): Promise<IWedding[]> {
    try {
      // Using MongoDB geospatial query
      // Earth's radius in kilometers
      const earthRadius = 6378.1;

      const weddings = await Wedding.find({
        'venue.latitude': { $exists: true },
        'venue.longitude': { $exists: true },
        status: { $in: ['planning', 'confirmed'] }
      }).then((results) => {
        // Filter by distance in JavaScript (can be optimized with aggregation pipeline)
        return results.filter((wedding) => {
          if (!wedding.venue.latitude || !wedding.venue.longitude) return false;
          const lat1 = latitude * Math.PI / 180;
          const lat2 = wedding.venue.latitude * Math.PI / 180;
          const lon1 = longitude * Math.PI / 180;
          const lon2 = wedding.venue.longitude * Math.PI / 180;

          const dLat = lat2 - lat1;
          const dLon = lon2 - lon1;

          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = earthRadius * c;

          return distance <= radiusKm;
        });
      });

      return weddings;
    } catch (error) {
      logger.error('Error finding nearby weddings:', error);
      throw error;
    }
  }

  /**
   * Get wedding statistics
   */
  async getWeddingStats(weddingId: string): Promise<any> {
    try {
      const wedding = await Wedding.findOne({ weddingId });
      if (!wedding) return null;

      const [guestStats, vendorStats] = await Promise.all([
        Guest.aggregate([
          { $match: { weddingId } },
          {
            $group: {
              _id: '$rsvp',
              count: { $sum: 1 }
            }
          }
        ]),
        Vendor.aggregate([
          { $match: { weddingId } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalSpend: { $sum: '$price.amount' }
            }
          }
        ])
      ]);

      return {
        weddingId,
        budget: {
          total: wedding.budget.total,
          spent: wedding.budget.spent,
          remaining: wedding.budget.total - wedding.budget.spent,
          utilizationPercent: wedding.budget.total > 0
            ? (wedding.budget.spent / wedding.budget.total) * 100
            : 0
        },
        guests: {
          expected: wedding.guestCount.expected,
          confirmed: wedding.guestCount.confirmed,
          declined: wedding.guestCount.declined,
          tentative: wedding.guestCount.tentative,
          rsvpBreakdown: guestStats,
          attendanceRate: wedding.guestCount.expected > 0
            ? (wedding.guestCount.confirmed / wedding.guestCount.expected) * 100
            : 0
        },
        vendors: {
          booked: vendorStats.filter((v) => ['booked', 'paid', 'confirmed', 'completed'].includes(v._id)).length,
          pending: vendorStats.filter((v) => ['inquiry', 'quoted', 'negotiating'].includes(v._id)).length,
          vendorBreakdown: vendorStats
        },
        timeline: {
          weddingDate: wedding.weddingDate,
          daysUntilWedding: Math.ceil((wedding.weddingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        }
      };
    } catch (error) {
      logger.error('Error getting wedding stats:', error);
      throw error;
    }
  }

  /**
   * Update guest count from guest collection
   */
  async syncGuestCount(weddingId: string): Promise<void> {
    try {
      const stats = await Guest.aggregate([
        { $match: { weddingId } },
        {
          $group: {
            _id: '$rsvp',
            count: { $sum: 1 }
          }
        }
      ]);

      const guestCount = {
        expected: stats.reduce((sum, s) => sum + s.count, 0),
        confirmed: stats.find((s) => s._id === 'confirmed')?.count || 0,
        declined: stats.find((s) => s._id === 'declined')?.count || 0,
        tentative: stats.find((s) => s._id === 'tentative')?.count || 0
      };

      await Wedding.updateOne({ weddingId }, { $set: { guestCount } });

      logger.info('Guest count synced', { weddingId, guestCount });
    } catch (error) {
      logger.error('Error syncing guest count:', error);
      throw error;
    }
  }
}

export const weddingService = new WeddingService();
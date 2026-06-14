import { v4 as uuidv4 } from 'uuid';
import { Vendor, IVendor } from '../models/Vendor';
import { Wedding } from '../models/Wedding';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

export interface CreateVendorDto {
  weddingId: string;
  category: Vendor['category'];
  name: string;
  businessName?: string;
  contactName?: string;
  email?: string;
  phone: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  service: string;
  description?: string;
  price?: {
    amount: number;
    currency?: string;
    breakdown?: {
      basePrice?: number;
      tax?: number;
      tip?: number;
      extra?: number;
    };
  };
  hashtags?: string[];
  referralSource?: string;
}

export interface UpdateVendorDto {
  category?: Vendor['category'];
  name?: string;
  businessName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: Partial<Vendor['address']>;
  service?: string;
  description?: string;
  booked?: boolean;
  bookingDate?: Date;
  price?: Partial<Vendor['price']>;
  status?: Vendor['status'];
  contractSigned?: boolean;
  contractUrl?: string;
  paymentStatus?: Vendor['paymentStatus'];
  paymentAmount?: number;
  paymentDueDate?: Date;
  notes?: string;
  rating?: number;
  hashtags?: string[];
}

export interface VendorFilters {
  weddingId: string;
  category?: Vendor['category'];
  status?: Vendor['status'];
  booked?: boolean;
}

export interface BulkVendorDto {
  weddingId: string;
  vendors: CreateVendorDto[];
}

class VendorService {
  /**
   * Create a new vendor
   */
  async createVendor(data: CreateVendorDto): Promise<IVendor> {
    try {
      const vendorId = `VND-${uuidv4().substring(0, 8).toUpperCase()}`;

      const vendor = new Vendor({
        vendorId,
        ...data,
        status: 'inquiry',
        booked: false,
        paymentStatus: 'pending'
      });

      await vendor.save();

      logger.info('Vendor created', {
        vendorId,
        weddingId: data.weddingId,
        name: data.name,
        category: data.category
      });

      return vendor;
    } catch (error) {
      logger.error('Error creating vendor:', error);
      throw error;
    }
  }

  /**
   * Create multiple vendors (bulk)
   */
  async createBulkVendors(data: BulkVendorDto): Promise<{ created: number; failed: number; vendors: IVendor[] }> {
    try {
      const vendors: IVendor[] = [];
      let failed = 0;

      for (const vendorData of data.vendors) {
        try {
          const vendor = await this.createVendor({
            ...vendorData,
            weddingId: data.weddingId
          });
          vendors.push(vendor);
        } catch (error) {
          failed++;
          logger.error('Error creating vendor in bulk:', error);
        }
      }

      logger.info('Bulk vendors created', {
        weddingId: data.weddingId,
        created: vendors.length,
        failed
      });

      return {
        created: vendors.length,
        failed,
        vendors
      };
    } catch (error) {
      logger.error('Error in bulk vendor creation:', error);
      throw error;
    }
  }

  /**
   * Get vendor by ID
   */
  async getVendorById(vendorId: string): Promise<IVendor | null> {
    try {
      const vendor = await Vendor.findOne({ vendorId });
      return vendor;
    } catch (error) {
      logger.error('Error getting vendor:', error);
      throw error;
    }
  }

  /**
   * Update vendor
   */
  async updateVendor(vendorId: string, data: UpdateVendorDto): Promise<IVendor | null> {
    try {
      const vendor = await Vendor.findOneAndUpdate(
        { vendorId },
        { $set: data },
        { new: true, runValidators: true }
      );

      if (vendor) {
        logger.info('Vendor updated', {
          vendorId,
          updatedFields: Object.keys(data)
        });
      }

      return vendor;
    } catch (error) {
      logger.error('Error updating vendor:', error);
      throw error;
    }
  }

  /**
   * Delete vendor
   */
  async deleteVendor(vendorId: string): Promise<boolean> {
    try {
      const vendor = await Vendor.findOne({ vendorId });
      if (!vendor) return false;

      await Vendor.deleteOne({ vendorId });

      logger.info('Vendor deleted', { vendorId, weddingId: vendor.weddingId });

      return true;
    } catch (error) {
      logger.error('Error deleting vendor:', error);
      throw error;
    }
  }

  /**
   * List vendors for a wedding
   */
  async listVendors(
    filters: VendorFilters,
    page: number = 1,
    limit: number = 50
  ): Promise<{ vendors: IVendor[]; total: number; page: number; totalPages: number }> {
    try {
      const query: any = { weddingId: filters.weddingId };

      if (filters.category) query.category = filters.category;
      if (filters.status) query.status = filters.status;
      if (filters.booked !== undefined) query.booked = filters.booked;

      const [vendors, total] = await Promise.all([
        Vendor.find(query)
          .sort({ category: 1, name: 1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Vendor.countDocuments(query)
      ]);

      return {
        vendors,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error listing vendors:', error);
      throw error;
    }
  }

  /**
   * Get vendor statistics for a wedding
   */
  async getVendorStats(weddingId: string): Promise<any> {
    try {
      const categoryStats = await Vendor.aggregate([
        { $match: { weddingId } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalSpend: { $sum: '$price.amount' },
            bookedCount: {
              $sum: { $cond: ['$booked', 1, 0] }
            }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const statusStats = await Vendor.aggregate([
        { $match: { weddingId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalSpend: { $sum: '$price.amount' }
          }
        }
      ]);

      const overallStats = await Vendor.aggregate([
        { $match: { weddingId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            booked: { $sum: { $cond: ['$booked', 1, 0] } },
            totalBudget: { $sum: '$price.amount' },
            paidAmount: { $sum: { $cond: ['$paymentAmount', '$paymentAmount', 0] } }
          }
        }
      ]);

      const topVendors = await Vendor.find({ weddingId, booked: true })
        .sort({ 'price.amount': -1 })
        .limit(5)
        .select('name category service price.amount');

      return {
        weddingId,
        summary: overallStats[0] || {
          total: 0,
          booked: 0,
          totalBudget: 0,
          paidAmount: 0
        },
        categoryBreakdown: categoryStats,
        statusBreakdown: statusStats,
        topVendors,
        pendingPayments: statusStats
          .filter((s) => ['inquiry', 'quoted', 'negotiating'].includes(s._id))
          .reduce((sum, s) => sum + s.count, 0),
        upcomingPayments: await this.getUpcomingPayments(weddingId)
      };
    } catch (error) {
      logger.error('Error getting vendor stats:', error);
      throw error;
    }
  }

  /**
   * Get upcoming vendor payments
   */
  async getUpcomingPayments(weddingId: string): Promise<any[]> {
    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const vendors = await Vendor.find({
        weddingId,
        paymentDueDate: {
          $gte: now,
          $lte: thirtyDaysFromNow
        },
        paymentStatus: { $ne: 'paid' }
      }).select('name category paymentDueDate price.amount paymentStatus');

      return vendors;
    } catch (error) {
      logger.error('Error getting upcoming payments:', error);
      throw error;
    }
  }

  /**
   * Add review to vendor
   */
  async addVendorReview(vendorId: string, rating: number, comment?: string): Promise<IVendor | null> {
    try {
      const vendor = await Vendor.findOneAndUpdate(
        { vendorId },
        {
          $push: {
            reviews: {
              rating,
              comment,
              reviewedAt: new Date()
            }
          },
          $inc: { reviewCount: 1 }
        },
        { new: true }
      );

      // Recalculate average rating
      if (vendor) {
        const avgRating = vendor.reviews!.reduce((sum, r) => sum + r.rating, 0) / vendor.reviews!.length;
        vendor.rating = Math.round(avgRating * 10) / 10;
        await vendor.save();
      }

      logger.info('Vendor review added', { vendorId, rating });

      return vendor;
    } catch (error) {
      logger.error('Error adding vendor review:', error);
      throw error;
    }
  }

  /**
   * Get vendors by category for a wedding
   */
  async getVendorsByCategory(weddingId: string): Promise<Record<string, IVendor[]>> {
    try {
      const vendors = await Vendor.find({ weddingId }).sort({ category: 1, name: 1 });

      const grouped = vendors.reduce((acc, vendor) => {
        if (!acc[vendor.category]) {
          acc[vendor.category] = [];
        }
        acc[vendor.category].push(vendor);
        return acc;
      }, {} as Record<string, IVendor[]>);

      return grouped;
    } catch (error) {
      logger.error('Error getting vendors by category:', error);
      throw error;
    }
  }

  /**
   * Book a vendor
   */
  async bookVendor(vendorId: string, bookingDate?: Date): Promise<IVendor | null> {
    try {
      const vendor = await Vendor.findOneAndUpdate(
        { vendorId },
        {
          $set: {
            booked: true,
            bookingDate: bookingDate || new Date(),
            status: 'booked'
          }
        },
        { new: true }
      );

      if (vendor) {
        logger.info('Vendor booked', { vendorId, bookingDate });
      }

      return vendor;
    } catch (error) {
      logger.error('Error booking vendor:', error);
      throw error;
    }
  }

  /**
   * Record payment for vendor
   */
  async recordPayment(
    vendorId: string,
    amount: number,
    paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded'
  ): Promise<IVendor | null> {
    try {
      const vendor = await Vendor.findOneAndUpdate(
        { vendorId },
        {
          $set: {
            paymentStatus,
            paymentAmount: amount
          }
        },
        { new: true }
      );

      if (vendor) {
        logger.info('Vendor payment recorded', { vendorId, amount, paymentStatus });

        // Update wedding budget spent
        const vendorTotal = vendor.price.amount;
        const paidAmount = amount;
        await Wedding.updateOne(
          { weddingId: vendor.weddingId },
          { $inc: { 'budget.spent': paidAmount } }
        );
      }

      return vendor;
    } catch (error) {
      logger.error('Error recording vendor payment:', error);
      throw error;
    }
  }
}

export const vendorService = new VendorService();
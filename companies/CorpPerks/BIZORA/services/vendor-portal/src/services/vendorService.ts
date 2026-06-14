import { Vendor, IVendor, VendorSchema } from '../models/Vendor.js';
import { logger } from '../config/logger.js';

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface VendorFilters {
  status?: string;
  category?: string;
  search?: string;
  minRating?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class VendorService {
  /**
   * Create a new vendor
   */
  async createVendor(vendorData: unknown): Promise<IVendor> {
    // Validate with Zod
    const validatedData = VendorSchema.parse(vendorData);

    // Check for existing vendor with same email
    const existingVendor = await Vendor.findOne({ email: validatedData.email });
    if (existingVendor) {
      throw new Error('Vendor with this email already exists');
    }

    const vendor = new Vendor(validatedData);
    await vendor.save();

    logger.info('Vendor created', { vendorId: vendor._id, email: vendor.email });

    return vendor;
  }

  /**
   * Get all vendors with pagination and filters
   */
  async getVendors(
    filters: VendorFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }
  ): Promise<PaginatedResult<IVendor>> {
    const query: Record<string, unknown> = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.minRating !== undefined) {
      query.rating = { $gte: filters.minRating };
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { companyName: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const skip = (pagination.page - 1) * pagination.limit;
    const sort: Record<string, 1 | -1> = { [pagination.sortBy]: pagination.sortOrder === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
      Vendor.find(query)
        .sort(sort)
        .skip(skip)
        .limit(pagination.limit)
        .lean(),
      Vendor.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: data as IVendor[],
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1
      }
    };
  }

  /**
   * Get vendor by ID
   */
  async getVendorById(id: string): Promise<IVendor | null> {
    const vendor = await Vendor.findById(id).lean();
    return vendor as IVendor | null;
  }

  /**
   * Update vendor
   */
  async updateVendor(id: string, updateData: Partial<unknown>): Promise<IVendor | null> {
    // Validate update data with Zod (partial)
    const partialSchema = VendorSchema.partial();
    const validatedData = partialSchema.parse(updateData);

    const vendor = await Vendor.findByIdAndUpdate(
      id,
      { $set: validatedData },
      { new: true, runValidators: true }
    ).lean();

    if (vendor) {
      logger.info('Vendor updated', { vendorId: id });
    }

    return vendor as IVendor | null;
  }

  /**
   * Update vendor status
   */
  async updateVendorStatus(id: string, status: 'pending' | 'active' | 'suspended' | 'rejected'): Promise<IVendor | null> {
    const vendor = await Vendor.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    ).lean();

    if (vendor) {
      logger.info('Vendor status updated', { vendorId: id, status });
    }

    return vendor as IVendor | null;
  }

  /**
   * Get vendor orders
   */
  async getVendorOrders(
    vendorId: string,
    pagination: PaginationOptions = { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' }
  ): Promise<PaginatedResult<unknown>> {
    // Verify vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Note: Orders would typically be in a separate collection
    // This is a placeholder that returns empty results
    // In production, this would query an orders collection

    logger.info('Fetching vendor orders', { vendorId, page: pagination.page });

    return {
      data: [],
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    };
  }

  /**
   * Get vendor payment history
   */
  async getVendorPayments(
    vendorId: string,
    pagination: PaginationOptions = { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' }
  ): Promise<PaginatedResult<unknown>> {
    // Verify vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Note: Payments would typically be in a separate collection
    // This is a placeholder that returns empty results
    // In production, this would query a payments collection

    logger.info('Fetching vendor payments', { vendorId, page: pagination.page });

    return {
      data: [],
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    };
  }

  /**
   * Update vendor stats after order completion
   */
  async updateVendorStats(
    vendorId: string,
    orderAmount: number,
    deliveryTimeMinutes: number,
    deliveredOnTime: boolean
  ): Promise<void> {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const newTotalOrders = vendor.totalOrders + 1;
    const newTotalRevenue = vendor.totalRevenue + orderAmount;
    const newAvgDeliveryTime =
      (vendor.averageDeliveryTime * vendor.totalOrders + deliveryTimeMinutes) / newTotalOrders;
    const onTimeDeliveries =
      (vendor.onTimeDeliveryRate / 100) * vendor.totalOrders + (deliveredOnTime ? 1 : 0);
    const newOnTimeRate = (onTimeDeliveries / newTotalOrders) * 100;

    await Vendor.findByIdAndUpdate(vendorId, {
      $set: {
        totalOrders: newTotalOrders,
        totalRevenue: newTotalRevenue,
        averageDeliveryTime: newAvgDeliveryTime,
        onTimeDeliveryRate: newOnTimeRate
      }
    });

    logger.info('Vendor stats updated', {
      vendorId,
      totalOrders: newTotalOrders,
      totalRevenue: newTotalRevenue
    });
  }

  /**
   * Delete vendor (soft delete by setting status)
   */
  async deleteVendor(id: string): Promise<boolean> {
    const result = await Vendor.findByIdAndUpdate(id, {
      $set: { status: 'suspended' }
    });

    if (result) {
      logger.info('Vendor deleted (suspended)', { vendorId: id });
      return true;
    }

    return false;
  }

  /**
   * Get vendor statistics
   */
  async getVendorStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    averageRating: number;
  }> {
    const [total, byStatus, byCategory, ratingAgg] = await Promise.all([
      Vendor.countDocuments(),
      Vendor.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Vendor.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Vendor.aggregate([
        { $match: { rating: { $gt: 0 } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ])
    ]);

    const statusMap: Record<string, number> = {};
    byStatus.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    const categoryMap: Record<string, number> = {};
    byCategory.forEach((c) => {
      categoryMap[c._id] = c.count;
    });

    return {
      total,
      byStatus: statusMap,
      byCategory: categoryMap,
      averageRating: ratingAgg[0]?.avgRating || 0
    };
  }
}

export const vendorService = new VendorService();
export default vendorService;

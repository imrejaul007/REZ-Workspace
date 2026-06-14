import { Customer, ICustomer, ICustomerDocument } from '../models/Customer';
import { CustomerInput, CustomerFilter, LoyaltyTier, PurchaseHistoryEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';

export class CustomerService {
  private readonly CACHE_TTL = 1800; // 30 minutes

  /**
   * Create a new customer
   */
  async createCustomer(input: CustomerInput): Promise<ICustomer> {
    try {
      const customer = new Customer({
        ...input,
        id: uuidv4(),
      });

      await customer.save();

      logger.info(`Customer created: ${customer.id}`);
      return customer.toJSON();
    } catch (error) {
      logger.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id: string): Promise<ICustomer | null> {
    const cacheKey = `customer:${id}`;

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const customer = await Customer.findOne({ id });
      if (!customer) return null;

      const result = customer.toJSON();
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));

      return result;
    } catch (error) {
      logger.error('Error fetching customer:', error);
      return await Customer.findOne({ id }).then(c => c?.toJSON() || null);
    }
  }

  /**
   * Get customer by user ID (RABTUL)
   */
  async getCustomerByUserId(userId: string): Promise<ICustomer | null> {
    return await Customer.findOne({ userId }).then(c => c?.toJSON() || null);
  }

  /**
   * Get customer by email or phone
   */
  async getCustomerByContact(email?: string, phone?: string): Promise<ICustomer | null> {
    const query: Record<string, string> = {};
    if (email) query.email = email;
    if (phone) query.phone = phone;

    return await Customer.findOne(query).then(c => c?.toJSON() || null);
  }

  /**
   * Update customer
   */
  async updateCustomer(id: string, updates: Partial<CustomerInput>): Promise<ICustomer | null> {
    try {
      const customer = await Customer.findOne({ id });
      if (!customer) return null;

      Object.assign(customer, updates);
      await customer.save();

      await this.invalidateCache(id);
      logger.info(`Customer updated: ${id}`);

      return customer.toJSON();
    } catch (error) {
      logger.error('Error updating customer:', error);
      throw error;
    }
  }

  /**
   * Delete customer (soft delete)
   */
  async deleteCustomer(id: string): Promise<boolean> {
    try {
      const result = await Customer.updateOne({ id }, { isActive: false });
      await this.invalidateCache(id);
      logger.info(`Customer deleted: ${id}`);
      return result.modifiedCount > 0;
    } catch (error) {
      logger.error('Error deleting customer:', error);
      throw error;
    }
  }

  /**
   * List customers with filters
   */
  async listCustomers(
    filter: CustomerFilter = {},
    page = 1,
    limit = 20
  ): Promise<{ customers: ICustomer[]; total: number; page: number; totalPages: number }> {
    const query: Record<string, unknown> = {};

    if (filter.search) {
      query.$text = { $search: filter.search };
    }
    if (filter.loyaltyTier) {
      query.loyaltyTier = filter.loyaltyTier;
    }
    if (filter.tags && filter.tags.length > 0) {
      query.tags = { $all: filter.tags };
    }
    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }
    if (filter.isVerified !== undefined) {
      query.isVerified = filter.isVerified;
    }
    if (filter.minTotalSpent !== undefined || filter.maxTotalSpent !== undefined) {
      query.totalSpent = {};
      if (filter.minTotalSpent !== undefined) query.totalSpent.$gte = filter.minTotalSpent;
      if (filter.maxTotalSpent !== undefined) query.totalSpent.$lte = filter.maxTotalSpent;
    }
    if (filter.lastPurchaseAfter || filter.lastPurchaseBefore) {
      query.lastPurchaseDate = {};
      if (filter.lastPurchaseAfter) query.lastPurchaseDate.$gte = filter.lastPurchaseAfter;
      if (filter.lastPurchaseBefore) query.lastPurchaseDate.$lte = filter.lastPurchaseBefore;
    }

    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Customer.countDocuments(query),
    ]);

    return {
      customers: customers.map(c => c.toJSON()),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Add purchase to customer history
   */
  async addPurchase(
    customerId: string,
    orderId: string,
    total: number,
    items: number,
    pointsEarned: number = 0
  ): Promise<ICustomer | null> {
    try {
      const customer = await Customer.findOne({ id: customerId });
      if (!customer) return null;

      const entry: PurchaseHistoryEntry = {
        id: uuidv4(),
        orderId,
        date: new Date(),
        total,
        items,
        pointsEarned,
        status: 'completed',
      };

      customer.purchaseHistory.push(entry);
      customer.totalSpent += total;
      customer.totalOrders += 1;
      customer.loyaltyPoints += pointsEarned;
      customer.lastPurchaseDate = new Date();

      if (!customer.firstPurchaseDate) {
        customer.firstPurchaseDate = new Date();
      }

      await customer.save();
      await this.invalidateCache(customerId);

      // Check for tier upgrade
      await this.checkTierUpgrade(customer);

      logger.info(`Purchase added for customer ${customerId}: ${orderId}`);
      return customer.toJSON();
    } catch (error) {
      logger.error('Error adding purchase:', error);
      throw error;
    }
  }

  /**
   * Add address to customer
   */
  async addAddress(customerId: string, address: Omit<import('../types').Address, 'id'>): Promise<ICustomer | null> {
    try {
      const customer = await Customer.findOne({ id: customerId });
      if (!customer) return null;

      const newAddress = {
        ...address,
        id: uuidv4(),
      };

      // If this is the first address or marked as default, handle defaults
      if (newAddress.isDefault || customer.addresses.length === 0) {
        customer.addresses.forEach(addr => addr.isDefault = false);
        newAddress.isDefault = true;
      }

      customer.addresses.push(newAddress);
      await customer.save();
      await this.invalidateCache(customerId);

      return customer.toJSON();
    } catch (error) {
      logger.error('Error adding address:', error);
      throw error;
    }
  }

  /**
   * Update customer preferences
   */
  async updatePreferences(
    customerId: string,
    preferences: Partial<import('../types').CustomerPreferences>
  ): Promise<ICustomer | null> {
    try {
      const customer = await Customer.findOne({ id: customerId });
      if (!customer) return null;

      customer.preferences = { ...customer.preferences, ...preferences };
      await customer.save();
      await this.invalidateCache(customerId);

      return customer.toJSON();
    } catch (error) {
      logger.error('Error updating preferences:', error);
      throw error;
    }
  }

  /**
   * Add loyalty points
   */
  async addLoyaltyPoints(customerId: string, points: number): Promise<ICustomer | null> {
    try {
      const customer = await Customer.findOne({ id: customerId });
      if (!customer) return null;

      customer.loyaltyPoints += points;
      await customer.save();
      await this.invalidateCache(customerId);

      return customer.toJSON();
    } catch (error) {
      logger.error('Error adding loyalty points:', error);
      throw error;
    }
  }

  /**
   * Redeem loyalty points
   */
  async redeemLoyaltyPoints(customerId: string, points: number): Promise<ICustomer | null> {
    try {
      const customer = await Customer.findOne({ id: customerId });
      if (!customer) return null;

      if (customer.loyaltyPoints < points) {
        throw new Error('Insufficient loyalty points');
      }

      customer.loyaltyPoints -= points;
      await customer.save();
      await this.invalidateCache(customerId);

      return customer.toJSON();
    } catch (error) {
      logger.error('Error redeeming loyalty points:', error);
      throw error;
    }
  }

  /**
   * Add tag to customer
   */
  async addTag(customerId: string, tag: string): Promise<ICustomer | null> {
    try {
      const customer = await Customer.findOne({ id: customerId });
      if (!customer) return null;

      if (!customer.tags.includes(tag)) {
        customer.tags.push(tag);
        await customer.save();
        await this.invalidateCache(customerId);
      }

      return customer.toJSON();
    } catch (error) {
      logger.error('Error adding tag:', error);
      throw error;
    }
  }

  /**
   * Get top customers by spending
   */
  async getTopCustomers(limit = 10): Promise<ICustomer[]> {
    const cacheKey = `customers:top:${limit}`;

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const customers = await Customer.find({ isActive: true })
        .sort({ totalSpent: -1 })
        .limit(limit);

      const result = customers.map(c => c.toJSON());
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));

      return result;
    } catch (error) {
      logger.error('Error fetching top customers:', error);
      return await Customer.find({ isActive: true })
        .sort({ totalSpent: -1 })
        .limit(limit)
        .then(c => c.map(customer => customer.toJSON()));
    }
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    totalRevenue: number;
    averageOrderValue: number;
    customersByTier: Record<LoyaltyTier, number>;
  }> {
    const stats = await Customer.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          totalRevenue: { $sum: '$totalSpent' },
          totalOrders: { $sum: '$totalOrders' },
          customersByTier: { $push: '$loyaltyTier' },
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        totalCustomers: 0,
        activeCustomers: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        customersByTier: {
          [LoyaltyTier.BRONZE]: 0,
          [LoyaltyTier.SILVER]: 0,
          [LoyaltyTier.GOLD]: 0,
          [LoyaltyTier.PLATINUM]: 0,
          [LoyaltyTier.DIAMOND]: 0,
        },
      };
    }

    const tierCounts: Record<string, number> = {};
    stats[0].customersByTier.forEach((tier: string) => {
      tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    });

    return {
      totalCustomers: stats[0].totalCustomers,
      activeCustomers: stats[0].totalCustomers,
      totalRevenue: stats[0].totalRevenue,
      averageOrderValue: stats[0].totalOrders > 0
        ? stats[0].totalRevenue / stats[0].totalOrders
        : 0,
      customersByTier: {
        [LoyaltyTier.BRONZE]: tierCounts[LoyaltyTier.BRONZE] || 0,
        [LoyaltyTier.SILVER]: tierCounts[LoyaltyTier.SILVER] || 0,
        [LoyaltyTier.GOLD]: tierCounts[LoyaltyTier.GOLD] || 0,
        [LoyaltyTier.PLATINUM]: tierCounts[LoyaltyTier.PLATINUM] || 0,
        [LoyaltyTier.DIAMOND]: tierCounts[LoyaltyTier.DIAMOND] || 0,
      },
    };
  }

  /**
   * Check and update tier based on spending
   */
  private async checkTierUpgrade(customer: ICustomerDocument): Promise<void> {
    const tierThresholds: Record<LoyaltyTier, number> = {
      [LoyaltyTier.BRONZE]: 0,
      [LoyaltyTier.SILVER]: 5000,
      [LoyaltyTier.GOLD]: 20000,
      [LoyaltyTier.PLATINUM]: 50000,
      [LoyaltyTier.DIAMOND]: 100000,
    };

    let newTier = LoyaltyTier.BRONZE;
    for (const [tier, threshold] of Object.entries(tierThresholds)) {
      if (customer.totalSpent >= threshold) {
        newTier = tier as LoyaltyTier;
      }
    }

    if (newTier !== customer.loyaltyTier) {
      const oldTier = customer.loyaltyTier;
      customer.loyaltyTier = newTier;
      logger.info(`Customer ${customer.id} tier upgraded: ${oldTier} -> ${newTier}`);
      // Could emit an event here for notifications
    }
  }

  /**
   * Invalidate cache
   */
  private async invalidateCache(customerId?: string): Promise<void> {
    try {
      if (customerId) {
        await redisClient.del(`customer:${customerId}`);
      }
      const keys = await redisClient.keys('customers:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      logger.warn('Cache invalidation failed:', error);
    }
  }
}

export const customerService = new CustomerService();
export default customerService;

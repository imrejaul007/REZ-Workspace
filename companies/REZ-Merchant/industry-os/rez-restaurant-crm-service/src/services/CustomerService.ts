import { Customer, ICustomer, ICustomerPreferences } from '../models/Customer';
import { SEGMENTATION, LOYALTY, SegmentType } from '../config/constants';

/**
 * FIX (security): Generate secure customer ID using crypto
 */
function generateCustomerId(): string {
  try {
    const { randomUUID } = require('crypto');
    return `CUST-${Date.now()}-${randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase()}`;
  } catch {
    return `CUST-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
}

export interface CreateCustomerInput {
  phone: string;
  email?: string;
  name: string;
  dateOfBirth?: Date;
  anniversary?: Date;
  preferences?: Partial<ICustomerPreferences>;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  dateOfBirth?: Date;
  anniversary?: Date;
  preferences?: Partial<ICustomerPreferences>;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CustomerFilters {
  segment?: SegmentType;
  isActive?: boolean;
  birthdayThisMonth?: boolean;
  anniversaryThisMonth?: boolean;
  minLifetimeValue?: number;
  maxLifetimeValue?: number;
  minVisits?: number;
  search?: string;
}

export class CustomerService {
  /**
   * Create a new customer with welcome bonus points
   */
  async createCustomer(input: CreateCustomerInput): Promise<ICustomer> {
    const customer = new Customer({
      customerId: generateCustomerId(),
      phone: input.phone,
      email: input.email,
      name: input.name,
      dateOfBirth: input.dateOfBirth,
      anniversary: input.anniversary,
      preferences: {
        ...input.preferences,
        notificationsEnabled: input.preferences?.notificationsEnabled || {
          sms: true,
          email: true,
          whatsapp: true,
        },
      },
      loyaltyPoints: LOYALTY.welcomeBonus,
      segment: 'NEW',
    });

    await customer.save();
    return customer;
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(customerId: string): Promise<ICustomer | null> {
    return Customer.findOne({ customerId, isActive: true });
  }

  /**
   * Get customer by phone
   */
  async getCustomerByPhone(phone: string): Promise<ICustomer | null> {
    return Customer.findOne({ phone, isActive: true });
  }

  /**
   * Update customer details
   */
  async updateCustomer(customerId: string, input: UpdateCustomerInput): Promise<ICustomer | null> {
    const updateData: Record<string, unknown> = {};

    if (input.name) updateData.name = input.name;
    if (input.email) updateData.email = input.email;
    if (input.dateOfBirth) updateData.dateOfBirth = input.dateOfBirth;
    if (input.anniversary) updateData.anniversary = input.anniversary;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.metadata) updateData.metadata = input.metadata;

    if (input.preferences) {
      updateData.preferences = input.preferences;
    }

    return Customer.findOneAndUpdate(
      { customerId },
      { $set: updateData },
      { new: true }
    );
  }

  /**
   * Update customer preferences
   */
  async updatePreferences(
    customerId: string,
    preferences: Partial<ICustomerPreferences>
  ): Promise<ICustomer | null> {
    return Customer.findOneAndUpdate(
      { customerId },
      { $set: { preferences } },
      { new: true }
    );
  }

  /**
   * List customers with filters and pagination
   */
  async listCustomers(
    filters: CustomerFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ customers: ICustomer[]; total: number; page: number; totalPages: number }> {
    const query: Record<string, unknown> = {};

    if (filters.segment) query.segment = filters.segment;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    if (filters.birthdayThisMonth) {
      const now = new Date();
      query.$expr = {
        $and: [
          { $eq: [{ $month: '$dateOfBirth' }, now.getMonth() + 1] },
          { $ne: ['$dateOfBirth', null] }],
      };
    }

    if (filters.anniversaryThisMonth) {
      const now = new Date();
      if (query.$expr) {
        query.$expr.$and.push(
          { $eq: [{ $month: '$anniversary' }, now.getMonth() + 1] },
          { $ne: ['$anniversary', null] }
        );
      } else {
        query.$expr = {
          $and: [
            { $eq: [{ $month: '$anniversary' }, now.getMonth() + 1] },
            { $ne: ['$anniversary', null] }],
        };
      }
    }

    if (filters.minLifetimeValue) {
      query.lifetimeValue = { ...((query.lifetimeValue as Record<string, number>) || {}), $gte: filters.minLifetimeValue };
    }

    if (filters.maxLifetimeValue) {
      query.lifetimeValue = { ...((query.lifetimeValue as Record<string, number>) || {}), $lte: filters.maxLifetimeValue };
    }

    if (filters.minVisits) {
      query.totalVisits = { $gte: filters.minVisits };
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      Customer.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Customer.countDocuments(query),
    ]);

    return {
      customers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Calculate and update customer segment based on behavior
   */
  async updateSegment(customerId: string): Promise<SegmentType> {
    const customer = await Customer.findOne({ customerId });
    if (!customer) throw new Error('Customer not found');

    let newSegment: SegmentType;

    if (customer.totalVisits >= SEGMENTATION.VIP.minVisits &&
        customer.totalSpend >= SEGMENTATION.VIP.minSpend) {
      newSegment = 'VIP';
    } else if (customer.totalVisits >= SEGMENTATION.REGULAR.minVisits) {
      newSegment = 'REGULAR';
    } else if (customer.lastVisitAt) {
      const daysSinceLastVisit = Math.floor(
        (Date.now() - customer.lastVisitAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastVisit > SEGMENTATION.LAPSED.daysSinceLastVisit) {
        newSegment = 'LAPSED';
      } else {
        newSegment = 'REGULAR';
      }
    } else {
      newSegment = 'NEW';
    }

    await Customer.updateOne({ customerId }, { segment: newSegment });
    return newSegment;
  }

  /**
   * Update segment for all customers (batch job)
   */
  async updateAllSegments(): Promise<{ updated: number }> {
    const customers = await Customer.find({ isActive: true });
    let updated = 0;

    for (const customer of customers) {
      const newSegment = await this.updateSegment(customer.customerId);
      if (newSegment !== customer.segment) {
        updated++;
      }
    }

    return { updated };
  }

  /**
   * Add loyalty points to customer
   */
  async addLoyaltyPoints(customerId: string, points: number): Promise<ICustomer | null> {
    return Customer.findOneAndUpdate(
      { customerId },
      { $inc: { loyaltyPoints: points } },
      { new: true }
    );
  }

  /**
   * Redeem loyalty points
   */
  async redeemLoyaltyPoints(customerId: string, points: number): Promise<{ success: boolean; remainingPoints: number }> {
    const customer = await Customer.findOne({ customerId });
    if (!customer) throw new Error('Customer not found');

    if (customer.loyaltyPoints < points) {
      throw new Error(`Insufficient points. Available: ${customer.loyaltyPoints}, Requested: ${points}`);
    }

    await Customer.updateOne(
      { customerId },
      { $inc: { loyaltyPoints: -points } }
    );

    return {
      success: true,
      remainingPoints: customer.loyaltyPoints - points,
    };
  }

  /**
   * Calculate loyalty points for a purchase (1 point per rupee)
   */
  calculatePointsForPurchase(amount: number): number {
    return Math.floor(amount / 100); // 1 point per 100 cents (1 rupee)
  }

  /**
   * Convert loyalty points to monetary value
   */
  pointsToMoney(points: number): number {
    return (points * 100) / LOYALTY.pointsToRupeeRatio; // in cents
  }

  /**
   * Calculate customer lifetime value
   */
  async calculateLifetimeValue(customerId: string): Promise<number> {
    const customer = await Customer.findOne({ customerId });
    if (!customer) throw new Error('Customer not found');
    return customer.lifetimeValue;
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(customerId: string): Promise<{
    totalVisits: number;
    totalSpend: number;
    averageSpendPerVisit: number;
    loyaltyPoints: number;
    lifetimeValue: number;
    daysSinceLastVisit: number | null;
    segment: SegmentType;
  } | null> {
    const customer = await Customer.findOne({ customerId });
    if (!customer) return null;

    const daysSinceLastVisit = customer.lastVisitAt
      ? Math.floor((Date.now() - customer.lastVisitAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      totalVisits: customer.totalVisits,
      totalSpend: customer.totalSpend,
      averageSpendPerVisit: customer.totalVisits > 0
        ? customer.totalSpend / customer.totalVisits
        : 0,
      loyaltyPoints: customer.loyaltyPoints,
      lifetimeValue: customer.lifetimeValue,
      daysSinceLastVisit,
      segment: customer.segment as SegmentType,
    };
  }

  /**
   * Check for birthday/anniversary today and return eligible customers
   */
  async getTodayCelebrations(): Promise<{
    birthdays: ICustomer[];
    anniversaries: ICustomer[];
  }> {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const [birthdays, anniversaries] = await Promise.all([
      Customer.find({
        isActive: true,
        dateOfBirth: {
          $exists: true,
          $ne: null,
        },
        $expr: {
          $and: [
            { $eq: [{ $month: '$dateOfBirth' }, month] },
            { $eq: [{ $dayOfMonth: '$dateOfBirth' }, day] },
          ],
        },
      }),
      Customer.find({
        isActive: true,
        anniversary: {
          $exists: true,
          $ne: null,
        },
        $expr: {
          $and: [
            { $eq: [{ $month: '$anniversary' }, month] },
            { $eq: [{ $dayOfMonth: '$anniversary' }, day] },
          ],
        },
      }),
    ]);

    return { birthdays, anniversaries };
  }

  /**
   * Deactivate customer (soft delete)
   */
  async deactivateCustomer(customerId: string): Promise<ICustomer | null> {
    return Customer.findOneAndUpdate(
      { customerId },
      { isActive: false },
      { new: true }
    );
  }
}

export const customerService = new CustomerService();

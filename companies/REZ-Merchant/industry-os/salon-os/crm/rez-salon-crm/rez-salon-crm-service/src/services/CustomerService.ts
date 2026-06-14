import { Customer, ICustomer, IVisitHistory, IPreference } from '../models/Customer';
import { Interaction, InteractionType } from '../models/Interaction';
import { v4 as uuidv4 } from 'uuid';
import { differenceInDays, parseISO, format, isWithinInterval, addDays } from 'date-fns';
import { logger } from '../utils/logger';

export interface CreateCustomerInput {
  phone: string;
  email?: string;
  name: string;
  dateOfBirth?: string;
  anniversary?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  acquisitionSource?: string;
  referralCode?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  dateOfBirth?: string;
  anniversary?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  preferences?: Partial<IPreference>;
  tags?: string[];
  notes?: string;
}

export interface CustomerFilters {
  tier?: ICustomer['customerTier'];
  minSpend?: number;
  maxSpend?: number;
  minVisits?: number;
  maxVisits?: number;
  daysInactiveMin?: number;
  daysInactiveMax?: number;
  tags?: string[];
  services?: string[];
  hasBirthday?: boolean;
  hasAnniversary?: boolean;
}

export interface CustomerSegment {
  name: string;
  customers: ICustomer[];
  totalCount: number;
  averageSpend: number;
  totalRevenue: number;
}

export class CustomerService {
  /**
   * Create a new customer profile
   */
  async createCustomer(input: CreateCustomerInput): Promise<ICustomer> {
    const customerId = `CUST-${uuidv4().slice(0, 8).toUpperCase()}`;

    const customer = new Customer({
      customerId,
      phone: input.phone,
      email: input.email,
      name: input.name,
      dateOfBirth: input.dateOfBirth ? parseISO(input.dateOfBirth) : undefined,
      anniversary: input.anniversary ? parseISO(input.anniversary) : undefined,
      gender: input.gender,
      address: input.address,
      acquisitionSource: input.acquisitionSource,
      referralCode: input.referralCode,
      preferences: {
        communicationChannel: 'both',
        language: 'en',
        notificationsEnabled: true,
        preferredServices: [],
        preferredStylists: [],
        preferredTimeSlots: [],
      },
    });

    await customer.save();

    await this.logInteraction(customerId, 'note_added', 'in-person', {
      action: 'Customer profile created',
    });

    logger.info(`Customer created: ${customerId}`);
    return customer;
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(customerId: string): Promise<ICustomer | null> {
    return Customer.findOne({ customerId });
  }

  /**
   * Get customer by phone
   */
  async getCustomerByPhone(phone: string): Promise<ICustomer | null> {
    return Customer.findOne({ phone });
  }

  /**
   * Get customer by email
   */
  async getCustomerByEmail(email: string): Promise<ICustomer | null> {
    return Customer.findOne({ email: email.toLowerCase() });
  }

  /**
   * Update customer profile
   */
  async updateCustomer(customerId: string, input: UpdateCustomerInput): Promise<ICustomer | null> {
    const updateData: Record<string, unknown> = {};

    if (input.name) updateData.name = input.name;
    if (input.email) updateData.email = input.email.toLowerCase();
    if (input.dateOfBirth) updateData.dateOfBirth = parseISO(input.dateOfBirth);
    if (input.anniversary) updateData.anniversary = parseISO(input.anniversary);
    if (input.gender) updateData.gender = input.gender;
    if (input.address) updateData.address = input.address;
    if (input.tags) updateData.tags = input.tags;
    if (input.notes) updateData.notes = input.notes;
    if (input.preferences) {
      Object.entries(input.preferences).forEach(([key, value]) => {
        updateData[`preferences.${key}`] = value;
      });
    }

    const customer = await Customer.findOneAndUpdate(
      { customerId },
      { $set: updateData },
      { new: true }
    );

    if (customer && Object.keys(updateData).length > 0) {
      await this.logInteraction(customerId, 'preference_updated', 'in-app', {
        updatedFields: Object.keys(updateData),
      });
    }

    return customer;
  }

  /**
   * Add a visit to customer's visit history
   */
  async recordVisit(
    customerId: string,
    visitData: Omit<IVisitHistory, 'date'>
  ): Promise<ICustomer | null> {
    const session = await Customer.startSession();
    session.startTransaction();

    try {
      const customer = await Customer.findOne({ customerId }).session(session);
      if (!customer) {
        throw new Error(`Customer not found: ${customerId}`);
      }

      const visit: IVisitHistory = {
        date: new Date(),
        ...visitData,
      };

      customer.visitHistory.push(visit);
      customer.visitCount += 1;
      customer.totalSpent += visitData.amount;
      customer.averageSpend = customer.totalSpent / customer.visitCount;
      customer.lastVisit = new Date();
      customer.daysSinceLastVisit = 0;

      // Update preferred services based on frequency
      this.updatePreferredServices(customer, visitData.service);

      // Update customer tier
      this.updateCustomerTier(customer);

      // Calculate lifetime value
      customer.lifetimeValue = this.calculateLifetimeValue(customer);

      await customer.save({ session });
      await session.commitTransaction();

      await this.logInteraction(customerId, 'visit', 'in-person', {
        service: visitData.service,
        stylist: visitData.stylist,
        amount: visitData.amount,
      });

      logger.info(`Visit recorded for customer: ${customerId}`);
      return customer;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get customer's visit history with pagination
   */
  async getVisitHistory(
    customerId: string,
    options: { limit?: number; offset?: number; startDate?: string; endDate?: string } = {}
  ): Promise<{ visits: IVisitHistory[]; total: number }> {
    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return { visits: [], total: 0 };
    }

    let visits = [...customer.visitHistory].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    if (options.startDate) {
      const startDate = parseISO(options.startDate);
      visits = visits.filter((v) => v.date >= startDate);
    }

    if (options.endDate) {
      const endDate = parseISO(options.endDate);
      visits = visits.filter((v) => v.date <= endDate);
    }

    const total = visits.length;
    const offset = options.offset || 0;
    const limit = options.limit || 20;

    return {
      visits: visits.slice(offset, offset + limit),
      total,
    };
  }

  /**
   * Get customers with upcoming birthdays (within next N days)
   */
  async getUpcomingBirthdays(daysAhead: number = 7): Promise<ICustomer[]> {
    const today = new Date();
    const endDate = addDays(today, daysAhead);

    const customers = await Customer.find({
      dateOfBirth: { $ne: null },
      isActive: true,
      smsOptIn: true,
    });

    return customers.filter((customer) => {
      if (!customer.dateOfBirth) return false;

      // Get this year's birthday date
      const thisYearBirthday = new Date(
        today.getFullYear(),
        customer.dateOfBirth.getMonth(),
        customer.dateOfBirth.getDate()
      );

      // If birthday already passed this year, check next year
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }

      return isWithinInterval(thisYearBirthday, { start: today, end: endDate });
    });
  }

  /**
   * Get customers with upcoming anniversaries (within next N days)
   */
  async getUpcomingAnniversaries(daysAhead: number = 7): Promise<ICustomer[]> {
    const today = new Date();
    const endDate = addDays(today, daysAhead);

    const customers = await Customer.find({
      anniversary: { $ne: null },
      isActive: true,
      smsOptIn: true,
    });

    return customers.filter((customer) => {
      if (!customer.anniversary) return false;

      const thisYearAnniversary = new Date(
        today.getFullYear(),
        customer.anniversary.getMonth(),
        customer.anniversary.getDate()
      );

      if (thisYearAnniversary < today) {
        thisYearAnniversary.setFullYear(today.getFullYear() + 1);
      }

      return isWithinInterval(thisYearAnniversary, { start: today, end: endDate });
    });
  }

  /**
   * Segment customers based on various criteria
   */
  async segmentCustomers(filters: CustomerFilters): Promise<CustomerSegment> {
    const query: Record<string, unknown> = { isActive: true };

    if (filters.tier) query.customerTier = filters.tier;
    if (filters.tags?.length) query.tags = { $in: filters.tags };
    if (filters.services?.length) {
      query.preferredServices = { $in: filters.services };
    }

    if (filters.minSpend || filters.maxSpend) {
      query.totalSpent = {};
      if (filters.minSpend) (query.totalSpent as Record<string, number>).$gte = filters.minSpend;
      if (filters.maxSpend) (query.totalSpent as Record<string, number>).$lte = filters.maxSpend;
    }

    if (filters.minVisits || filters.maxVisits) {
      query.visitCount = {};
      if (filters.minVisits) (query.visitCount as Record<string, number>).$gte = filters.minVisits;
      if (filters.maxVisits) (query.visitCount as Record<string, number>).$lte = filters.maxVisits;
    }

    if (filters.daysInactiveMin || filters.daysInactiveMax) {
      query.daysSinceLastVisit = {};
      if (filters.daysInactiveMin) (query.daysSinceLastVisit as Record<string, number>).$gte = filters.daysInactiveMin;
      if (filters.daysInactiveMax) (query.daysSinceLastVisit as Record<string, number>).$lte = filters.daysInactiveMax;
    }

    const customers = await Customer.find(query);
    const totalCount = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const averageSpend = totalCount > 0 ? totalRevenue / totalCount : 0;

    return {
      name: this.getSegmentName(filters),
      customers,
      totalCount,
      averageSpend,
      totalRevenue,
    };
  }

  /**
   * Get customers at risk of churning (no visit in X days)
   */
  async getAtRiskCustomers(inactiveDays: number = 60): Promise<ICustomer[]> {
    return Customer.find({
      isActive: true,
      daysSinceLastVisit: { $gte: inactiveDays },
      customerTier: { $ne: 'churned' },
    }).sort({ daysSinceLastVisit: -1 });
  }

  /**
   * Get VIP customers (high spenders)
   */
  async getVIPCustomers(minSpend: number = 10000): Promise<ICustomer[]> {
    return Customer.find({
      isActive: true,
      totalSpent: { $gte: minSpend },
    }).sort({ totalSpent: -1 });
  }

  /**
   * Get customer lifetime value metrics
   */
  async getLTVMetrics(customerId: string): Promise<{
    lifetimeValue: number;
    averageOrderValue: number;
    purchaseFrequency: number;
    predictedLTV: number;
  } | null> {
    const customer = await Customer.findOne({ customerId });
    if (!customer) return null;

    const averageOrderValue = customer.averageSpend;
    const purchaseFrequency =
      customer.visitCount / (this.getCustomerAgeInMonths(customer) || 1);

    // Simple LTV prediction: average monthly value * 24 months
    const monthlyValue = averageOrderValue * purchaseFrequency;
    const predictedLTV = monthlyValue * 24;

    return {
      lifetimeValue: customer.lifetimeValue,
      averageOrderValue,
      purchaseFrequency,
      predictedLTV,
    };
  }

  /**
   * Deactivate a customer (soft delete)
   */
  async deactivateCustomer(customerId: string): Promise<boolean> {
    const result = await Customer.updateOne(
      { customerId },
      { $set: { isActive: false } }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Search customers by name or phone
   */
  async searchCustomers(
    query: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ customers: ICustomer[]; total: number }> {
    const searchRegex = new RegExp(query, 'i');
    const searchQuery = {
      $or: [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { customerId: searchRegex },
      ],
      isActive: true,
    };

    const total = await Customer.countDocuments(searchQuery);
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    const customers = await Customer.find(searchQuery)
      .limit(limit)
      .skip(offset)
      .sort({ lastVisit: -1 });

    return { customers, total };
  }

  // Helper methods

  private updatePreferredServices(customer: ICustomer, service: string): void {
    const serviceCounts = new Map<string, number>();

    customer.visitHistory.forEach((visit) => {
      const count = serviceCounts.get(visit.service) || 0;
      serviceCounts.set(visit.service, count + 1);
    });

    const sortedServices = Array.from(serviceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([s]) => s);

    customer.preferredServices = sortedServices;
  }

  private updateCustomerTier(customer: ICustomer): void {
    const now = new Date();
    const daysSinceLastVisit = customer.lastVisit
      ? differenceInDays(now, customer.lastVisit)
      : 999;

    // VIP: High spenders with frequent visits
    if (customer.totalSpent >= 15000 && customer.visitCount >= 10) {
      customer.customerTier = 'vip';
    }
    // At-risk: Haven't visited in 60+ days
    else if (daysSinceLastVisit >= 60 && customer.visitCount > 0) {
      customer.customerTier = 'at-risk';
    }
    // Churned: 180+ days inactive
    else if (daysSinceLastVisit >= 180) {
      customer.customerTier = 'churned';
    }
    // Regular: Multiple visits
    else if (customer.visitCount >= 3) {
      customer.customerTier = 'regular';
    }
    // New: 1-2 visits
    else {
      customer.customerTier = 'new';
    }
  }

  private calculateLifetimeValue(customer: ICustomer): number {
    // LTV formula: (Average Order Value * Purchase Frequency * Customer Lifespan)
    // Customer Lifespan in months, assuming 24 months average for active customers
    const avgMonthlyValue =
      customer.averageSpend * (customer.visitCount / (this.getCustomerAgeInMonths(customer) || 1));
    return avgMonthlyValue * 24;
  }

  private getCustomerAgeInMonths(customer: ICustomer): number {
    const createdAt = new Date(customer.createdAt);
    const now = new Date();
    const months = (now.getFullYear() - createdAt.getFullYear()) * 12 +
      (now.getMonth() - createdAt.getMonth());
    return Math.max(1, months);
  }

  private getSegmentName(filters: CustomerFilters): string {
    const parts: string[] = [];
    if (filters.tier) parts.push(filters.tier);
    if (filters.minSpend || filters.maxSpend) {
      parts.push(`spend-${filters.minSpend || 0}-${filters.maxSpend || 'inf'}`);
    }
    if (filters.minVisits || filters.maxVisits) {
      parts.push(`visits-${filters.minVisits || 0}-${filters.maxVisits || 'inf'}`);
    }
    return parts.join('-') || 'all-customers';
  }

  private async logInteraction(
    customerId: string,
    type: InteractionType,
    channel: 'sms' | 'email' | 'in-app' | 'phone' | 'in-person',
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      const interaction = new Interaction({
        interactionId: `INT-${uuidv4().slice(0, 8).toUpperCase()}`,
        customerId,
        type,
        channel,
        metadata,
      });
      await interaction.save();
    } catch (error) {
      logger.error('Failed to log interaction', { customerId, type, error });
    }
  }
}

export const customerService = new CustomerService();

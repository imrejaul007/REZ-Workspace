// Cross-Merchant View Service - Unified Customer Service (MongoDB-backed)
// Cross-merchant customer identity resolution

import { v4 as uuidv4 } from 'uuid';
import { UnifiedCustomer, IUnifiedCustomer } from '../models';
import { logger } from '../utils/logger';

interface CustomerActivity {
  merchantId: string;
  merchantName: string;
  type: 'conversation' | 'purchase' | 'support' | 'feedback';
  timestamp: Date;
  summary: string;
  amount?: number;
}

interface UnifiedCustomerProfile {
  id: string;
  customerId: string;
  primaryEmail?: string;
  primaryPhone?: string;
  name?: string;
  totalMerchants: number;
  totalConversations: number;
  totalPurchases: number;
  avgSatisfaction: number;
  lifetimeValue: number;
  firstSeen: Date;
  lastSeen: Date;
  recentActivity: CustomerActivity[];
  merchantInteractions: {
    merchantId: string;
    merchantName: string;
    interactions: number;
    lastInteraction: Date;
    totalSpent: number;
  }[];
}

export class UnifiedCustomerService {

  async resolveCustomer(email?: string, phone?: string): Promise<string> {
    if (!email && !phone) {
      throw new Error('Either email or phone required');
    }

    // Check MongoDB
    const filter: Record<string, string> = {};
    if (email) filter.primaryEmail = email;
    if (phone) filter.primaryPhone = phone;

    const existing = await UnifiedCustomer.findOne(filter);
    if (existing) {
      return existing.customerId;
    }

    // Create new
    const customerId = `cust_${uuidv4()}`;
    await UnifiedCustomer.create({
      customerId,
      primaryEmail: email,
      primaryPhone: phone,
      totalMerchants: 0,
      totalConversations: 0,
      totalPurchases: 0,
      avgSatisfaction: 0,
      lifetimeValue: 0,
      firstSeen: new Date(),
      lastSeen: new Date(),
      recentActivity: [],
      merchantInteractions: [],
    });

    logger.info(`[UnifiedCustomer] Created profile ${customerId} for ${email || phone}`);
    return customerId;
  }

  async getCustomer(customerId: string): Promise<UnifiedCustomerProfile | null> {
    const customer = await UnifiedCustomer.findOne({ customerId });
    if (!customer) return null;

    return this.mapToProfile(customer);
  }

  async getCustomerByEmail(email: string): Promise<UnifiedCustomerProfile | null> {
    const customer = await UnifiedCustomer.findOne({ primaryEmail: email });
    if (!customer) return null;

    return this.mapToProfile(customer);
  }

  async getCustomerByPhone(phone: string): Promise<UnifiedCustomerProfile | null> {
    const customer = await UnifiedCustomer.findOne({ primaryPhone: phone });
    if (!customer) return null;

    return this.mapToProfile(customer);
  }

  async addActivity(
    customerId: string,
    merchantId: string,
    merchantName: string,
    activity: Omit<CustomerActivity, 'merchantId' | 'merchantName'>
  ): Promise<void> {
    const customer = await UnifiedCustomer.findOne({ customerId });
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Add to recent activity
    customer.recentActivity.unshift({
      merchantId,
      merchantName,
      ...activity,
    });

    // Keep only last 20 activities
    if (customer.recentActivity.length > 20) {
      customer.recentActivity = customer.recentActivity.slice(0, 20);
    }

    // Update merchant interactions
    const existingInteraction = customer.merchantInteractions.find(
      i => i.merchantId === merchantId
    );

    if (existingInteraction) {
      existingInteraction.interactions++;
      existingInteraction.lastInteraction = new Date();
      if (activity.type === 'purchase') {
        const amount = activity.amount || 0;
        existingInteraction.totalSpent += amount;
        customer.lifetimeValue += amount;
        customer.totalPurchases++;
      }
    } else {
      const newInteraction = {
        merchantId,
        merchantName,
        interactions: 1,
        lastInteraction: new Date(),
        totalSpent: activity.type === 'purchase' ? activity.amount || 0 : 0,
      };
      customer.merchantInteractions.push(newInteraction);
      customer.totalMerchants++;
    }

    // Update totals
    customer.lastSeen = new Date();
    if (activity.type === 'conversation') {
      customer.totalConversations++;
    }

    await customer.save();
  }

  async searchCustomers(
    query: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ customers: UnifiedCustomerProfile[]; total: number }> {
    const { limit = 20, offset = 0 } = options;
    const q = query.toLowerCase();

    const filter = {
      $or: [
        { primaryEmail: { $regex: q, $options: 'i' } },
        { primaryPhone: { $regex: q } },
        { name: { $regex: q, $options: 'i' } },
      ],
    };

    const [customers, total] = await Promise.all([
      UnifiedCustomer.find(filter).skip(offset).limit(limit).sort({ lastSeen: -1 }),
      UnifiedCustomer.countDocuments(filter),
    ]);

    return {
      customers: customers.map(c => this.mapToProfile(c)),
      total,
    };
  }

  async getCustomerJourney(
    customerId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CustomerActivity[]> {
    const customer = await UnifiedCustomer.findOne({ customerId });
    if (!customer) {
      throw new Error('Customer not found');
    }

    let activities = customer.recentActivity;

    if (startDate || endDate) {
      activities = activities.filter(a => {
        const time = new Date(a.timestamp).getTime();
        if (startDate && time < startDate.getTime()) return false;
        if (endDate && time > endDate.getTime()) return false;
        return true;
      });
    }

    return activities.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  private mapToProfile(customer: IUnifiedCustomer): UnifiedCustomerProfile {
    return {
      id: customer.customerId,
      customerId: customer.customerId,
      primaryEmail: customer.primaryEmail,
      primaryPhone: customer.primaryPhone,
      name: customer.name,
      totalMerchants: customer.totalMerchants,
      totalConversations: customer.totalConversations,
      totalPurchases: customer.totalPurchases,
      avgSatisfaction: customer.avgSatisfaction,
      lifetimeValue: customer.lifetimeValue,
      firstSeen: customer.firstSeen,
      lastSeen: customer.lastSeen,
      recentActivity: customer.recentActivity.map(a => ({
        merchantId: a.merchantId,
        merchantName: a.merchantName,
        type: a.type,
        timestamp: a.timestamp,
        summary: a.summary,
      })),
      merchantInteractions: customer.merchantInteractions.map(i => ({
        merchantId: i.merchantId,
        merchantName: i.merchantName,
        interactions: i.interactions,
        lastInteraction: i.lastInteraction,
        totalSpent: i.totalSpent,
      })),
    };
  }
}

export const unifiedCustomerService = new UnifiedCustomerService();
export default unifiedCustomerService;

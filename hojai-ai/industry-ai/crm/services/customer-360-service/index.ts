/**
 * Customer 360 Service
 * Provides a unified view of customers across all industries
 */

import { v4 as uuidv4 } from 'uuid';
import { hojaiCore, IndustryType } from '../../connectors/hojai-core';
import { merchantOS } from '../../connectors/merchant-os';

export interface Customer360 {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  industries: IndustryType[];
  industryProfiles: Record<IndustryType, IndustryProfile>;
  totalLifetimeValue: number;
  totalTransactions: number;
  firstInteraction: Date;
  lastInteraction: Date;
  communicationHistory: CommunicationEntry[];
  preferences: CustomerPreferences;
  tags: string[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IndustryProfile {
  industry: IndustryType;
  customerId: string;
  totalSpent: number;
  transactionCount: number;
  lastTransaction: Date;
  averageOrderValue: number;
  products: string[];
  preferences: Record<string, any>;
}

export interface CommunicationEntry {
  id: string;
  timestamp: Date;
  channel: 'email' | 'phone' | 'sms' | 'whatsapp' | 'in-app';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  industry?: IndustryType;
  outcome?: string;
}

export interface CustomerPreferences {
  preferredContactMethod: 'email' | 'phone' | 'sms' | 'whatsapp';
  preferredLanguage: string;
  marketingOptIn: boolean;
  notificationPreferences: Record<string, boolean>;
}

class Customer360Service {
  private customers: Map<string, Customer360> = new Map();
  private emailIndex: Map<string, string> = new Map();
  private phoneIndex: Map<string, string> = new Map();

  /**
   * Get or create a unified customer profile
   */
  async getOrCreateCustomer(identifier: {
    email?: string;
    phone?: string;
    name?: string;
  }): Promise<Customer360> {
    // Check if customer already exists
    if (identifier.email) {
      const existingId = this.emailIndex.get(identifier.email);
      if (existingId) {
        const existing = this.customers.get(existingId);
        if (existing) return existing;
      }
    }

    if (identifier.phone) {
      const existingId = this.phoneIndex.get(identifier.phone);
      if (existingId) {
        const existing = this.customers.get(existingId);
        if (existing) return existing;
      }
    }

    // Create new customer
    return this.createCustomer({
      name: identifier.name || 'Unknown',
      email: identifier.email || '',
      phone: identifier.phone || ''
    });
  }

  /**
   * Create a new unified customer
   */
  async createCustomer(data: {
    name: string;
    email: string;
    phone: string;
    industries?: IndustryType[];
    preferences?: Partial<CustomerPreferences>;
  }): Promise<Customer360> {
    const now = new Date();
    const customer: Customer360 = {
      id: uuidv4(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      industries: data.industries || [],
      industryProfiles: {} as Record<IndustryType, IndustryProfile>,
      totalLifetimeValue: 0,
      totalTransactions: 0,
      firstInteraction: now,
      lastInteraction: now,
      communicationHistory: [],
      preferences: {
        preferredContactMethod: 'email',
        preferredLanguage: 'en',
        marketingOptIn: true,
        notificationPreferences: {}
      },
      tags: [],
      notes: '',
      createdAt: now,
      updatedAt: now
    };

    if (data.preferences) {
      customer.preferences = { ...customer.preferences, ...data.preferences };
    }

    this.customers.set(customer.id, customer);
    this.indexCustomer(customer);

    console.log(`[Customer360] Created customer ${customer.id}`);
    return customer;
  }

  /**
   * Index customer for fast lookup
   */
  private indexCustomer(customer: Customer360): void {
    if (customer.email) {
      this.emailIndex.set(customer.email.toLowerCase(), customer.id);
    }
    if (customer.phone) {
      this.phoneIndex.set(customer.phone, customer.id);
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(id: string): Promise<Customer360 | undefined> {
    return this.customers.get(id);
  }

  /**
   * Get customer by email
   */
  async getCustomerByEmail(email: string): Promise<Customer360 | undefined> {
    const id = this.emailIndex.get(email.toLowerCase());
    return id ? this.customers.get(id) : undefined;
  }

  /**
   * Get customer by phone
   */
  async getCustomerByPhone(phone: string): Promise<Customer360 | undefined> {
    const id = this.phoneIndex.get(phone);
    return id ? this.customers.get(id) : undefined;
  }

  /**
   * Add industry profile to customer
   */
  async addIndustryProfile(
    customerId: string,
    industry: IndustryType,
    profile: Omit<IndustryProfile, 'industry' | 'industry'>
  ): Promise<Customer360 | undefined> {
    const customer = this.customers.get(customerId);
    if (!customer) return undefined;

    customer.industryProfiles[industry] = { ...profile, industry };

    if (!customer.industries.includes(industry)) {
      customer.industries.push(industry);
    }

    // Update totals
    customer.totalLifetimeValue += profile.totalSpent;
    customer.totalTransactions += profile.transactionCount;
    customer.lastInteraction = new Date();
    customer.updatedAt = new Date();

    return customer;
  }

  /**
   * Import customer data from all industries
   */
  async syncFromAllIndustries(): Promise<{ imported: number; updated: number }> {
    let imported = 0;
    let updated = 0;

    for (const industry of Object.keys(hojaiCore.getAllProducts()).map(k => k as IndustryType)) {
      const industryCustomers = await hojaiCore.getCustomersFromIndustry(industry);

      for (const cust of industryCustomers) {
        const existing = await this.getOrCreateCustomer({
          email: cust.email,
          phone: cust.phone,
          name: cust.name
        });

        if (!existing.industries.includes(industry)) {
          existing.industries.push(industry);
          imported++;
        } else {
          updated++;
        }
      }
    }

    console.log(`[Customer360] Synced: ${imported} new, ${updated} updated`);
    return { imported, updated };
  }

  /**
   * Get all customers
   */
  async getAllCustomers(): Promise<Customer360[]> {
    return Array.from(this.customers.values());
  }

  /**
   * Update customer
   */
  async updateCustomer(id: string, updates: Partial<Customer360>): Promise<Customer360 | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;

    const updated: Customer360 = {
      ...customer,
      ...updates,
      id: customer.id,
      createdAt: customer.createdAt,
      updatedAt: new Date()
    };

    this.customers.set(id, updated);
    return updated;
  }

  /**
   * Add communication entry
   */
  async addCommunication(
    customerId: string,
    entry: Omit<CommunicationEntry, 'id' | 'timestamp'>
  ): Promise<Customer360 | undefined> {
    const customer = this.customers.get(customerId);
    if (!customer) return undefined;

    const communication: CommunicationEntry = {
      ...entry,
      id: uuidv4(),
      timestamp: new Date()
    };

    customer.communicationHistory.push(communication);
    customer.updatedAt = new Date();

    return customer;
  }

  /**
   * Get customer timeline (sorted communications)
   */
  async getCustomerTimeline(customerId: string): Promise<CommunicationEntry[]> {
    const customer = this.customers.get(customerId);
    if (!customer) return [];

    return customer.communicationHistory.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Get cross-industry customer statistics
   */
  async getCrossIndustryStats(): Promise<{
    totalCustomers: number;
    singleIndustry: number;
    multiIndustry: number;
    averageIndustriesPerCustomer: number;
    topIndustryCombinations: Array<{ industries: IndustryType[]; count: number }>;
  }> {
    const customers = await this.getAllCustomers();

    let singleIndustry = 0;
    let multiIndustry = 0;
    let totalIndustries = 0;
    const combinations: Map<string, number> = new Map();

    for (const customer of customers) {
      const industryCount = customer.industries.length;
      totalIndustries += industryCount;

      if (industryCount === 1) {
        singleIndustry++;
      } else {
        multiIndustry++;
      }

      // Track combinations
      const sorted = [...customer.industries].sort().join('+');
      combinations.set(sorted, (combinations.get(sorted) || 0) + 1);
    }

    const topCombinations = Array.from(combinations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([combo, count]) => ({
        industries: combo.split('+') as IndustryType[],
        count
      }));

    return {
      totalCustomers: customers.length,
      singleIndustry,
      multiIndustry,
      averageIndustriesPerCustomer: customers.length > 0 ? totalIndustries / customers.length : 0,
      topIndustryCombinations: topCombinations
    };
  }

  /**
   * Search customers
   */
  async searchCustomers(query: string): Promise<Customer360[]> {
    const q = query.toLowerCase();
    return Array.from(this.customers.values()).filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  /**
   * Get high-value customers
   */
  async getHighValueCustomers(minLTV: number = 1000): Promise<Customer360[]> {
    return Array.from(this.customers.values())
      .filter(c => c.totalLifetimeValue >= minLTV)
      .sort((a, b) => b.totalLifetimeValue - a.totalLifetimeValue);
  }

  /**
   * Delete customer
   */
  async deleteCustomer(id: string): Promise<boolean> {
    const customer = this.customers.get(id);
    if (!customer) return false;

    // Remove from indexes
    if (customer.email) {
      this.emailIndex.delete(customer.email.toLowerCase());
    }
    if (customer.phone) {
      this.phoneIndex.delete(customer.phone);
    }

    return this.customers.delete(id);
  }
}

export const customer360Service = new Customer360Service();
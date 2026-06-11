/**
 * Customer 360 Service - Express Server
 * Provides a unified view of customers across all industries
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;
const SERVICE_NAME = 'customer-360-service';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// ============================================================================
// Types and Interfaces
// ============================================================================

export type IndustryType = 'waitron' | 'shopflow' | 'staybot' | 'carecode' | 'glamai' | 'fitmind' | 'teammind' | 'ledgerai' | 'fleetiq' | 'propflow' | 'neighborai' | 'learniq' | 'tripmind' | 'franchiseiq' | 'prodflow';

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

// ============================================================================
// Service Class
// ============================================================================

class Customer360Service {
  private customers: Map<string, Customer360> = new Map();
  private emailIndex: Map<string, string> = new Map();
  private phoneIndex: Map<string, string> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    const sampleCustomers: Partial<Customer360>[] = [
      {
        id: uuidv4(),
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+1-555-0101',
        industries: ['waitron', 'staybot'],
        industryProfiles: {
          waitron: {
            industry: 'waitron',
            customerId: '',
            totalSpent: 2500,
            transactionCount: 15,
            lastTransaction: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            averageOrderValue: 167,
            products: ['menu-item-1', 'menu-item-2'],
            preferences: { dietaryRestrictions: ['vegetarian'] }
          },
          staybot: {
            industry: 'staybot',
            customerId: '',
            totalSpent: 5000,
            transactionCount: 8,
            lastTransaction: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            averageOrderValue: 625,
            products: ['deluxe-room', 'spa-package'],
            preferences: { roomType: 'ocean-view' }
          }
        } as Record<IndustryType, IndustryProfile>,
        totalLifetimeValue: 7500,
        totalTransactions: 23,
        preferences: { preferredContactMethod: 'email', preferredLanguage: 'en', marketingOptIn: true, notificationPreferences: {} },
        tags: ['vip', 'frequent-diner'],
        notes: 'Preferred customer with high engagement'
      },
      {
        id: uuidv4(),
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        phone: '+1-555-0102',
        industries: ['shopflow', 'glamai'],
        industryProfiles: {
          shopflow: {
            industry: 'shopflow',
            customerId: '',
            totalSpent: 1800,
            transactionCount: 12,
            lastTransaction: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            averageOrderValue: 150,
            products: ['clothing-item-1'],
            preferences: { size: 'M' }
          },
          glamai: {
            industry: 'glamai',
            customerId: '',
            totalSpent: 600,
            transactionCount: 4,
            lastTransaction: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            averageOrderValue: 150,
            products: ['hair-treatment'],
            preferences: { preferredService: 'coloring' }
          }
        } as Record<IndustryType, IndustryProfile>,
        totalLifetimeValue: 2400,
        totalTransactions: 16,
        preferences: { preferredContactMethod: 'sms', preferredLanguage: 'en', marketingOptIn: true, notificationPreferences: {} },
        tags: ['fashion-forward'],
        notes: ''
      },
      {
        id: uuidv4(),
        name: 'Bob Johnson',
        email: 'bob.j@example.com',
        phone: '+1-555-0103',
        industries: ['fitmind', 'carecode'],
        industryProfiles: {
          fitmind: {
            industry: 'fitmind',
            customerId: '',
            totalSpent: 1200,
            transactionCount: 20,
            lastTransaction: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            averageOrderValue: 60,
            products: ['gym-membership', 'personal-training'],
            preferences: { workoutPreference: 'morning' }
          },
          carecode: {
            industry: 'carecode',
            customerId: '',
            totalSpent: 3500,
            transactionCount: 6,
            lastTransaction: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            averageOrderValue: 583,
            products: ['annual-checkup', 'dental-care'],
            preferences: { insurance: 'premium' }
          }
        } as Record<IndustryType, IndustryProfile>,
        totalLifetimeValue: 4700,
        totalTransactions: 26,
        preferences: { preferredContactMethod: 'phone', preferredLanguage: 'en', marketingOptIn: true, notificationPreferences: {} },
        tags: ['health-conscious', 'fitness-enthusiast'],
        notes: ''
      }
    ];

    sampleCustomers.forEach(data => {
      const now = new Date();
      const customer: Customer360 = {
        id: data.id!,
        name: data.name!,
        email: data.email!,
        phone: data.phone!,
        industries: data.industries || [],
        industryProfiles: data.industryProfiles || {} as Record<IndustryType, IndustryProfile>,
        totalLifetimeValue: data.totalLifetimeValue || 0,
        totalTransactions: data.totalTransactions || 0,
        firstInteraction: now,
        lastInteraction: now,
        communicationHistory: [],
        preferences: data.preferences || { preferredContactMethod: 'email', preferredLanguage: 'en', marketingOptIn: true, notificationPreferences: {} },
        tags: data.tags || [],
        notes: data.notes || '',
        createdAt: now,
        updatedAt: now
      };
      this.customers.set(customer.id, customer);
      this.indexCustomer(customer);
    });
  }

  private indexCustomer(customer: Customer360): void {
    if (customer.email) this.emailIndex.set(customer.email.toLowerCase(), customer.id);
    if (customer.phone) this.phoneIndex.set(customer.phone, customer.id);
  }

  getOrCreateCustomer(identifier: { email?: string; phone?: string; name?: string }): Customer360 | undefined {
    if (identifier.email) {
      const existingId = this.emailIndex.get(identifier.email.toLowerCase());
      if (existingId) return this.customers.get(existingId);
    }
    if (identifier.phone) {
      const existingId = this.phoneIndex.get(identifier.phone);
      if (existingId) return this.customers.get(existingId);
    }
    return undefined;
  }

  createCustomer(data: { name: string; email: string; phone: string; industries?: IndustryType[]; preferences?: Partial<CustomerPreferences> }): Customer360 {
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
        notificationPreferences: {},
        ...data.preferences
      },
      tags: [],
      notes: '',
      createdAt: now,
      updatedAt: now
    };

    this.customers.set(customer.id, customer);
    this.indexCustomer(customer);
    logger.info(`Created customer ${customer.id}`);
    return customer;
  }

  getCustomer(id: string): Customer360 | undefined {
    return this.customers.get(id);
  }

  getCustomerByEmail(email: string): Customer360 | undefined {
    const id = this.emailIndex.get(email.toLowerCase());
    return id ? this.customers.get(id) : undefined;
  }

  getCustomerByPhone(phone: string): Customer360 | undefined {
    const id = this.phoneIndex.get(phone);
    return id ? this.customers.get(id) : undefined;
  }

  getAllCustomers(): Customer360[] {
    return Array.from(this.customers.values());
  }

  updateCustomer(id: string, updates: Partial<Customer360>): Customer360 | undefined {
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

  addIndustryProfile(customerId: string, industry: IndustryType, profile: Omit<IndustryProfile, 'industry' | 'customerId'>): Customer360 | undefined {
    const customer = this.customers.get(customerId);
    if (!customer) return undefined;

    customer.industryProfiles[industry] = { ...profile, industry, customerId };
    if (!customer.industries.includes(industry)) {
      customer.industries.push(industry);
    }
    customer.totalLifetimeValue += profile.totalSpent;
    customer.totalTransactions += profile.transactionCount;
    customer.lastInteraction = new Date();
    customer.updatedAt = new Date();

    return customer;
  }

  addCommunication(customerId: string, entry: Omit<CommunicationEntry, 'id' | 'timestamp'>): Customer360 | undefined {
    const customer = this.customers.get(customerId);
    if (!customer) return undefined;

    customer.communicationHistory.push({ ...entry, id: uuidv4(), timestamp: new Date() });
    customer.updatedAt = new Date();
    return customer;
  }

  getCustomerTimeline(customerId: string): CommunicationEntry[] {
    const customer = this.customers.get(customerId);
    if (!customer) return [];
    return customer.communicationHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getCrossIndustryStats(): {
    totalCustomers: number;
    singleIndustry: number;
    multiIndustry: number;
    averageIndustriesPerCustomer: number;
    topIndustryCombinations: Array<{ industries: IndustryType[]; count: number }>;
  } {
    const customers = this.getAllCustomers();
    let singleIndustry = 0;
    let multiIndustry = 0;
    let totalIndustries = 0;
    const combinations: Map<string, number> = new Map();

    for (const customer of customers) {
      totalIndustries += customer.industries.length;
      if (customer.industries.length === 1) singleIndustry++;
      else if (customer.industries.length > 1) multiIndustry++;

      const sorted = [...customer.industries].sort().join('+');
      combinations.set(sorted, (combinations.get(sorted) || 0) + 1);
    }

    const topCombinations = Array.from(combinations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([combo, count]) => ({ industries: combo.split('+') as IndustryType[], count }));

    return {
      totalCustomers: customers.length,
      singleIndustry,
      multiIndustry,
      averageIndustriesPerCustomer: customers.length > 0 ? totalIndustries / customers.length : 0,
      topIndustryCombinations: topCombinations
    };
  }

  searchCustomers(query: string): Customer360[] {
    const q = query.toLowerCase();
    return Array.from(this.customers.values()).filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  getHighValueCustomers(minLTV: number = 1000): Customer360[] {
    return Array.from(this.customers.values())
      .filter(c => c.totalLifetimeValue >= minLTV)
      .sort((a, b) => b.totalLifetimeValue - a.totalLifetimeValue);
  }

  deleteCustomer(id: string): boolean {
    const customer = this.customers.get(id);
    if (!customer) return false;
    if (customer.email) this.emailIndex.delete(customer.email.toLowerCase());
    if (customer.phone) this.phoneIndex.delete(customer.phone);
    return this.customers.delete(id);
  }
}

const customer360Service = new Customer360Service();

// ============================================================================
// API Routes
// ============================================================================

/**
 * Create a new customer
 */
app.post('/api/customers', (req: Request, res: Response) => {
  const { name, email, phone, industries, preferences } = req.body;

  if (!name || !email) {
    res.status(400).json({ error: 'Name and email are required' });
    return;
  }

  const existing = customer360Service.getOrCreateCustomer({ email, phone });
  if (existing) {
    res.status(409).json({ error: 'Customer already exists', customer: existing });
    return;
  }

  const customer = customer360Service.createCustomer({ name, email, phone, industries, preferences });
  res.status(201).json(customer);
});

/**
 * Get all customers
 */
app.get('/api/customers', (req: Request, res: Response) => {
  const { minLTV, search } = req.query;

  let customers = customer360Service.getAllCustomers();

  if (minLTV) {
    customers = customers.filter(c => c.totalLifetimeValue >= parseInt(minLTV as string));
  }
  if (search) {
    customers = customer360Service.searchCustomers(search as string);
  }

  res.json(customers);
});

/**
 * Get customer by ID
 */
app.get('/api/customers/:id', (req: Request, res: Response) => {
  const customer = customer360Service.getCustomer(req.params.id);
  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }
  res.json(customer);
});

/**
 * Get customer by email
 */
app.get('/api/customers/email/:email', (req: Request, res: Response) => {
  const customer = customer360Service.getCustomerByEmail(req.params.email);
  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }
  res.json(customer);
});

/**
 * Update customer
 */
app.put('/api/customers/:id', (req: Request, res: Response) => {
  const customer = customer360Service.updateCustomer(req.params.id, req.body);
  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }
  res.json(customer);
});

/**
 * Add industry profile to customer
 */
app.post('/api/customers/:id/industries', (req: Request, res: Response) => {
  const { industry, ...profile } = req.body;

  if (!industry) {
    res.status(400).json({ error: 'Industry is required' });
    return;
  }

  const customer = customer360Service.addIndustryProfile(req.params.id, industry, {
    ...profile,
    customerId: req.params.id,
    lastTransaction: new Date()
  });

  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }

  res.json(customer);
});

/**
 * Add communication entry
 */
app.post('/api/customers/:id/communications', (req: Request, res: Response) => {
  const { channel, direction, subject, content, industry, outcome } = req.body;

  if (!channel || !direction || !content) {
    res.status(400).json({ error: 'Channel, direction, and content are required' });
    return;
  }

  const customer = customer360Service.addCommunication(req.params.id, {
    channel, direction, subject, content, industry, outcome
  });

  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }

  res.json(customer);
});

/**
 * Get customer timeline
 */
app.get('/api/customers/:id/timeline', (req: Request, res: Response) => {
  const timeline = customer360Service.getCustomerTimeline(req.params.id);
  res.json(timeline);
});

/**
 * Search customers
 */
app.get('/api/customers/search/:query', (req: Request, res: Response) => {
  const customers = customer360Service.searchCustomers(req.params.query);
  res.json(customers);
});

/**
 * Get high value customers
 */
app.get('/api/customers/high-value/:minLTV', (req: Request, res: Response) => {
  const minLTV = parseInt(req.params.minLTV) || 1000;
  const customers = customer360Service.getHighValueCustomers(minLTV);
  res.json(customers);
});

/**
 * Get cross-industry statistics
 */
app.get('/api/stats/cross-industry', (req: Request, res: Response) => {
  res.json(customer360Service.getCrossIndustryStats());
});

/**
 * Delete customer
 */
app.delete('/api/customers/:id', (req: Request, res: Response) => {
  const deleted = customer360Service.deleteCustomer(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }
  res.status(204).send();
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  const customers = customer360Service.getAllCustomers();
  const stats = customer360Service.getCrossIndustryStats();

  res.json({
    service: SERVICE_NAME,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    stats: {
      totalCustomers: customers.length,
      singleIndustry: stats.singleIndustry,
      multiIndustry: stats.multiIndustry,
      averageLTV: customers.length > 0
        ? customers.reduce((sum, c) => sum + c.totalLifetimeValue, 0) / customers.length
        : 0
    }
  });
});

// ============================================================================
// Error Handler
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// Server Start
// ============================================================================

app.listen(PORT, () => {
  logger.info(`${SERVICE_NAME} running on port ${PORT}`);
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
});

export default app;

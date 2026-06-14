/**
 * BIZORA Marketplace Service
 * Agency Services Marketplace with MongoDB
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose, { Document, Model, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import crypto from 'crypto';

// ============================================================================
// Configuration
// ============================================================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bizora_marketplace';
const PORT = process.env.PORT || 4003;

// ============================================================================
// Mongoose Schemas
// ============================================================================

// Package Schema
const PackageSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  currency: { type: String, default: 'INR' },
  duration: { type: String, required: true },
  deliverables: [{ type: String }],
  includes: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { _id: false });

// Portfolio Item Schema
const PortfolioItemSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  images: [{ type: String }],
  category: { type: String },
  clientName: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

// Agency Schema
interface IAgency extends Document {
  name: string;
  email: string;
  phone: string;
  logo?: string;
  description: string;
  categories: string[];
  subcategories: string[];
  location: {
    country: string;
    city: string;
    state?: string;
  };
  rating: number;
  reviewCount: number;
  completedOrders: number;
  verified: boolean;
  verificationDocuments: string[];
  pricing: {
    minOrder: number;
    maxOrder?: number;
    currency: string;
  };
  responseTime: number;
  completionRate: number;
  status: 'active' | 'suspended' | 'inactive';
  ownerId: string;
  packages: mongoose.Types.DocumentArray<typeof PackageSchema>;
  portfolio: mongoose.Types.DocumentArray<typeof PortfolioItemSchema>;
  createdAt: Date;
  updatedAt: Date;
}

const AgencySchema = new Schema<IAgency>({
  name: { type: String, required: true, index: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  logo: { type: String },
  description: { type: String, required: true },
  categories: [{ type: String, index: true }],
  subcategories: [{ type: String }],
  location: {
    country: { type: String, default: 'India' },
    city: { type: String, index: true },
    state: { type: String }
  },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  completedOrders: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  verificationDocuments: [{ type: String }],
  pricing: {
    minOrder: { type: Number, default: 0 },
    maxOrder: { type: Number },
    currency: { type: String, default: 'INR' }
  },
  responseTime: { type: Number, default: 60 },
  completionRate: { type: Number, default: 0, min: 0, max: 1 },
  status: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    default: 'active',
    index: true
  },
  ownerId: { type: String, index: true },
  packages: [PackageSchema],
  portfolio: [PortfolioItemSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound indexes for common queries
AgencySchema.index({ 'location.city': 1, status: 1 });
AgencySchema.index({ categories: 1, status: 1, rating: -1 });
AgencySchema.index({ rating: -1, reviewCount: -1 });

// Service Schema
interface IService extends Document {
  agencyId: string;
  category: string;
  subcategory: string;
  name: string;
  description: string;
  price: number;
  priceType: 'fixed' | 'starting_from' | 'starting_at';
  currency: string;
  duration: string;
  deliverables: string[];
  requirements: string[];
  tags: string[];
  isActive: boolean;
  createdAt: Date;
}

const ServiceSchema = new Schema<IService>({
  agencyId: { type: String, required: true, index: true },
  category: { type: String, required: true, index: true },
  subcategory: { type: String, index: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  priceType: {
    type: String,
    enum: ['fixed', 'starting_from', 'starting_at'],
    default: 'fixed'
  },
  currency: { type: String, default: 'INR' },
  duration: { type: String, required: true },
  deliverables: [{ type: String }],
  requirements: [{ type: String }],
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

// Compound indexes
ServiceSchema.index({ category: 1, isActive: 1, price: 1 });
ServiceSchema.index({ agencyId: 1, isActive: 1 });
ServiceSchema.index({ name: 'text', description: 'text' });

// Milestone Schema
const MilestoneSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'submitted', 'approved', 'revision'],
    default: 'pending'
  },
  dueDate: { type: Date, required: true },
  completedAt: { type: Date }
}, { _id: false });

// Timeline Event Schema
const TimelineEventSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true }
}, { _id: false });

// Order Schema
interface IOrder extends Document {
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  agencyId: string;
  serviceId?: string;
  packageId?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  pricing: {
    basePrice: number;
    addons: number;
    discount: number;
    platformFee: number;
    total: number;
    currency: string;
  };
  milestones: mongoose.Types.DocumentArray<typeof MilestoneSchema>;
  timeline: mongoose.Types.DocumentArray<typeof TimelineEventSchema>;
  notes?: string;
  rating?: { score: number; review?: string };
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  orderNumber: { type: String, required: true, unique: true },
  customerId: { type: String, required: true, index: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String },
  customerPhone: { type: String, required: true },
  agencyId: { type: String, required: true, index: true },
  serviceId: { type: String },
  packageId: { type: String },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'review', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  pricing: {
    basePrice: { type: Number, default: 0 },
    addons: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' }
  },
  milestones: [MilestoneSchema],
  timeline: [TimelineEventSchema],
  notes: { type: String },
  rating: {
    score: { type: Number, min: 1, max: 5 },
    review: { type: String }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound indexes
OrderSchema.index({ agencyId: 1, status: 1 });
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });

// Review Categories Schema
const ReviewCategoriesSchema = new Schema({
  quality: { type: Number, min: 1, max: 5 },
  communication: { type: Number, min: 1, max: 5 },
  delivery: { type: Number, min: 1, max: 5 },
  professionalism: { type: Number, min: 1, max: 5 }
}, { _id: false });

// Review Schema
interface IReview extends Document {
  orderId: string;
  agencyId: string;
  customerId: string;
  customerName: string;
  score: number;
  review?: string;
  categories: {
    quality: number;
    communication: number;
    delivery: number;
    professionalism: number;
  };
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  orderId: { type: String, required: true, unique: true, index: true },
  agencyId: { type: String, required: true, index: true },
  customerId: { type: String, required: true, index: true },
  customerName: { type: String, required: true },
  score: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String },
  categories: ReviewCategoriesSchema,
  createdAt: { type: Date, default: Date.now }
});

// Compound indexes
ReviewSchema.index({ agencyId: 1, createdAt: -1 });
ReviewSchema.index({ score: -1 });

// ============================================================================
// Mongoose Models
// ============================================================================

const Agency: Model<IAgency> = mongoose.model<IAgency>('Agency', AgencySchema);
const Service: Model<IService> = mongoose.model<IService>('Service', ServiceSchema);
const Order: Model<IOrder> = mongoose.model<IOrder>('Order', OrderSchema);
const Review: Model<IReview> = mongoose.model<IReview>('Review', ReviewSchema);

// ============================================================================
// Validation Schemas
// ============================================================================

const RegisterAgencySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  description: z.string().min(50),
  categories: z.array(z.string()).min(1),
  subcategories: z.array(z.string()),
  location: z.object({
    country: z.string(),
    city: z.string(),
    state: z.string().optional(),
  }),
});

const CreateServiceSchema = z.object({
  agencyId: z.string(),
  category: z.string(),
  subcategory: z.string(),
  name: z.string().min(5),
  description: z.string().min(20),
  price: z.number().min(0),
  priceType: z.enum(['fixed', 'starting_from', 'starting_at']).default('fixed'),
  duration: z.string(),
  deliverables: z.array(z.string()),
  requirements: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

const CreatePackageSchema = z.object({
  agencyId: z.string(),
  name: z.string().min(3),
  description: z.string().min(20),
  price: z.number().min(0),
  originalPrice: z.number().optional(),
  duration: z.string(),
  deliverables: z.array(z.string()),
  includes: z.array(z.string()),
});

const CreateOrderSchema = z.object({
  serviceId: z.string().optional(),
  packageId: z.string().optional(),
  agencyId: z.string(),
  customerId: z.string(),
  customerDetails: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    phone: z.string(),
    notes: z.string().optional(),
  }),
});

// ============================================================================
// Sample Data Seeding
// ============================================================================

async function seedSampleData(): Promise<void> {
  const existingAgencies = await Agency.countDocuments();
  if (existingAgencies > 0) {
    logger.info('Sample data already exists, skipping seed.');
    return;
  }

  logger.info('Seeding sample data...');

  const sampleAgencies = [
    {
      name: 'DigitalBuzz Agency',
      email: 'contact@digitalbuzz.in',
      phone: '+919876543210',
      logo: 'https://example.com/logo1.png',
      description: 'DigitalBuzz is a full-service digital marketing agency specializing in restaurant and retail businesses. We help brands grow their online presence through strategic social media management, targeted advertising, and compelling content creation.',
      categories: ['marketing', 'creative'],
      subcategories: ['social-media', 'advertising', 'content'],
      location: { country: 'India', city: 'Mumbai', state: 'Maharashtra' },
      rating: 4.8,
      reviewCount: 127,
      completedOrders: 234,
      verified: true,
      verificationDocuments: ['cert1.pdf', 'cert2.pdf'],
      pricing: { minOrder: 5000, maxOrder: 100000, currency: 'INR' },
      responseTime: 30,
      completionRate: 0.98,
      status: 'active' as const,
      ownerId: 'user-001',
      packages: [
        {
          id: 'pkg-001',
          name: 'Social Media Starter',
          description: 'Perfect for restaurants starting their social media journey',
          price: 5999,
          originalPrice: 7999,
          currency: 'INR',
          duration: '1 month',
          deliverables: ['20 custom posts', 'Captions & hashtags', 'Basic engagement'],
          includes: ['Instagram', 'Facebook', 'Monthly report'],
          isActive: true
        },
        {
          id: 'pkg-002',
          name: 'Growth Package',
          description: 'For restaurants looking to expand their reach',
          price: 12999,
          originalPrice: 16999,
          currency: 'INR',
          duration: '1 month',
          deliverables: ['30 posts', 'Story/Reels', 'Community management', 'Ad management'],
          includes: ['Instagram', 'Facebook', 'LinkedIn', 'Bi-weekly reports'],
          isActive: true
        }
      ],
      portfolio: [
        {
          id: 'port-001',
          title: 'The Burger Joint - Social Media Rebrand',
          description: 'Complete social media overhaul including content strategy and visual identity',
          images: ['https://example.com/case1.jpg'],
          category: 'social-media',
          clientName: 'The Burger Joint',
          createdAt: new Date('2024-01-15')
        }
      ],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    },
    {
      name: 'TechServe Solutions',
      email: 'hello@techserve.in',
      phone: '+919876543211',
      description: 'TechServe is a technology solutions provider offering website development, POS systems, and custom software. We specialize in building scalable solutions for restaurants, retail, and service businesses.',
      categories: ['technology'],
      subcategories: ['website', 'pos', 'crm'],
      location: { country: 'India', city: 'Bangalore', state: 'Karnataka' },
      rating: 4.6,
      reviewCount: 89,
      completedOrders: 156,
      verified: true,
      verificationDocuments: ['cert1.pdf'],
      pricing: { minOrder: 15000, maxOrder: 500000, currency: 'INR' },
      responseTime: 60,
      completionRate: 0.95,
      status: 'active' as const,
      ownerId: 'user-002',
      packages: [
        {
          id: 'pkg-003',
          name: 'Restaurant POS Setup',
          description: 'Complete POS implementation including training',
          price: 29999,
          currency: 'INR',
          duration: '1 week',
          deliverables: ['POS Installation', 'Staff Training', 'Menu Setup', '30-day Support'],
          includes: ['Hardware Quote', 'Cloud Sync', 'Reporting Dashboard'],
          isActive: true
        }
      ],
      portfolio: [],
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date()
    },
    {
      name: 'CorpAssist CA',
      email: 'info@corpassist.in',
      phone: '+919876543212',
      description: 'CorpAssist is a chartered accountant firm offering comprehensive business compliance services including GST registration, tax filing, company registration, and financial consulting for startups and SMEs.',
      categories: ['business_setup', 'compliance'],
      subcategories: ['company-registration', 'gst', 'tax-filing', 'roc'],
      location: { country: 'India', city: 'Delhi', state: 'Delhi' },
      rating: 4.9,
      reviewCount: 245,
      completedOrders: 567,
      verified: true,
      verificationDocuments: ['ca-cert.pdf', 'gst-cert.pdf'],
      pricing: { minOrder: 2000, maxOrder: 50000, currency: 'INR' },
      responseTime: 15,
      completionRate: 0.99,
      status: 'active' as const,
      ownerId: 'user-003',
      packages: [
        {
          id: 'pkg-004',
          name: 'GST Registration Package',
          description: 'Complete GST registration with all documentation',
          price: 2999,
          originalPrice: 4999,
          currency: 'INR',
          duration: '7-10 days',
          deliverables: ['GSTIN Application', 'Registration Certificate', 'PAN if required'],
          includes: ['Document Review', 'Application Filing', 'Follow-up'],
          isActive: true
        },
        {
          id: 'pkg-005',
          name: 'Private Limited Registration',
          description: 'Complete company incorporation including DIN, DSC, and MCA filing',
          price: 24999,
          originalPrice: 49999,
          currency: 'INR',
          duration: '15-20 days',
          deliverables: ['Certificate of Incorporation', 'PAN', 'TAN', 'GST Registration'],
          includes: ['Name Approval', 'MoA/AoA Drafting', 'ROC Filing', 'Bank Account Assistance'],
          isActive: true
        }
      ],
      portfolio: [],
      createdAt: new Date('2023-06-01'),
      updatedAt: new Date()
    }
  ];

  await Agency.insertMany(sampleAgencies);
  logger.info(`Seeded ${sampleAgencies.length} sample agencies.`);
}

// ============================================================================
// Express App
// ============================================================================

const app = express();

app.use(cors());
app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', async (_req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    service: 'marketplace',
    mongodb: mongoStatus,
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// Agency Routes
// ============================================================================

// Register agency
app.post('/api/agencies', async (req: Request, res: Response) => {
  try {
    const data = RegisterAgencySchema.parse(req.body);

    const agency = new Agency({
      ...data,
      rating: 0,
      reviewCount: 0,
      completedOrders: 0,
      verified: false,
      verificationDocuments: [],
      pricing: { ...data.location, currency: 'INR' },
      responseTime: 60,
      completionRate: 0,
      status: 'active',
      ownerId: req.body.ownerId || uuidv4(),
      packages: [],
      portfolio: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await agency.save();
    res.status(201).json(agency);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    if (error instanceof Error && error.message.includes('duplicate')) {
      return res.status(409).json({ error: 'Agency with this email already exists' });
    }
    logger.error('Create agency error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all agencies (with filters)
app.get('/api/agencies', async (req: Request, res: Response) => {
  const { category, city, minRating, verified, search, limit = 20, offset = 0 } = req.query;

  const filter: Record<string, unknown> = { status: 'active' };

  if (category) {
    filter.categories = category as string;
  }
  if (city) {
    filter['location.city'] = { $regex: new RegExp(`^${(city as string).toLowerCase()}`, 'i') };
  }
  if (minRating) {
    filter.rating = { $gte: Number(minRating) };
  }
  if (verified === 'true') {
    filter.verified = true;
  }
  if (search) {
    filter.$or = [
      { name: { $regex: new RegExp(search as string, 'i') } },
      { description: { $regex: new RegExp(search as string, 'i') } }
    ];
  }

  const total = await Agency.countDocuments(filter);
  const agencies = await Agency.find(filter)
    .sort({ rating: -1 })
    .skip(Number(offset))
    .limit(Number(limit))
    .lean();

  res.json({ agencies, total });
});

// Get single agency
app.get('/api/agencies/:id', async (req: Request, res: Response) => {
  const agency = await Agency.findById(req.params.id).lean();

  if (!agency) {
    return res.status(404).json({ error: 'Agency not found' });
  }

  res.json(agency);
});

// Update agency
app.patch('/api/agencies/:id', async (req: Request, res: Response) => {
  const agency = await Agency.findById(req.params.id);

  if (!agency) {
    return res.status(404).json({ error: 'Agency not found' });
  }

  const updates = req.body;
  const allowedUpdates = ['name', 'description', 'logo', 'categories', 'subcategories', 'location', 'pricing'];

  for (const key of Object.keys(updates)) {
    if (allowedUpdates.includes(key)) {
      (agency as Record<string, unknown>)[key] = updates[key];
    }
  }
  agency.updatedAt = new Date();

  await agency.save();
  res.json(agency);
});

// Verify agency
app.post('/api/agencies/:id/verify', async (req: Request, res: Response) => {
  const agency = await Agency.findById(req.params.id);

  if (!agency) {
    return res.status(404).json({ error: 'Agency not found' });
  }

  const { documents } = req.body;

  agency.verified = true;
  agency.verificationDocuments = documents || [];
  agency.updatedAt = new Date();

  await agency.save();
  res.json(agency);
});

// Add package to agency
app.post('/api/agencies/:id/packages', async (req: Request, res: Response) => {
  try {
    const data = CreatePackageSchema.parse(req.body);
    const agency = await Agency.findById(req.params.id);

    if (!agency) {
      return res.status(404).json({ error: 'Agency not found' });
    }

    const pkg = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      price: data.price,
      originalPrice: data.originalPrice,
      currency: 'INR',
      duration: data.duration,
      deliverables: data.deliverables,
      includes: data.includes,
      isActive: true
    };

    agency.packages.push(pkg as never);
    agency.updatedAt = new Date();

    await agency.save();
    res.status(201).json(pkg);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add portfolio item
app.post('/api/agencies/:id/portfolio', async (req: Request, res: Response) => {
  const agency = await Agency.findById(req.params.id);

  if (!agency) {
    return res.status(404).json({ error: 'Agency not found' });
  }

  const item = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date()
  };

  agency.portfolio.push(item as never);
  agency.updatedAt = new Date();

  await agency.save();
  res.status(201).json(item);
});

// ============================================================================
// Service Routes
// ============================================================================

// Create service
app.post('/api/services', async (req: Request, res: Response) => {
  try {
    const data = CreateServiceSchema.parse(req.body);

    const service = new Service({
      ...data,
      priceType: data.priceType || 'fixed',
      currency: 'INR',
      requirements: data.requirements || [],
      tags: data.tags || [],
      isActive: true,
      createdAt: new Date()
    });

    await service.save();
    res.status(201).json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get services
app.get('/api/services', async (req: Request, res: Response) => {
  const { category, agencyId, search, limit = 20, offset = 0 } = req.query;

  const filter: Record<string, unknown> = { isActive: true };

  if (category) {
    filter.category = category as string;
  }
  if (agencyId) {
    filter.agencyId = agencyId as string;
  }
  if (search) {
    filter.$or = [
      { name: { $regex: new RegExp(search as string, 'i') } },
      { description: { $regex: new RegExp(search as string, 'i') } }
    ];
  }

  const total = await Service.countDocuments(filter);
  const services = await Service.find(filter)
    .skip(Number(offset))
    .limit(Number(limit))
    .lean();

  // Enrich with agency data
  const agencyIds = [...new Set(services.map(s => s.agencyId))];
  const agenciesData = await Agency.find({ _id: { $in: agencyIds } })
    .select('_id name rating verified')
    .lean();
  const agenciesMap = new Map(agenciesData.map(a => [a._id.toString(), a]));

  const enriched = services.map(service => ({
    ...service,
    agency: agenciesMap.get(service.agencyId) || null
  }));

  res.json({ services: enriched, total });
});

// Get single service
app.get('/api/services/:id', async (req: Request, res: Response) => {
  const service = await Service.findById(req.params.id).lean();

  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  const agency = await Agency.findById(service.agencyId).lean();

  res.json({
    ...service,
    agency
  });
});

// ============================================================================
// Order Routes
// ============================================================================

// Create order
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const data = CreateOrderSchema.parse(req.body);

    // Get agency
    const agency = await Agency.findById(data.agencyId);
    if (!agency) {
      return res.status(404).json({ error: 'Agency not found' });
    }

    let basePrice = 0;
    let serviceOrPackage = null;

    if (data.packageId) {
      serviceOrPackage = agency.packages.find(p => p.id === data.packageId);
      if (serviceOrPackage) {
        basePrice = serviceOrPackage.price;
      }
    } else if (data.serviceId) {
      const service = await Service.findById(data.serviceId!);
      if (service) {
        basePrice = service.price;
        serviceOrPackage = service;
      }
    }

    if (!serviceOrPackage) {
      return res.status(400).json({ error: 'Service or package not found' });
    }

    const platformFee = Math.round(basePrice * 0.10); // 10% platform fee

    const order = new Order({
      orderNumber: `ORD-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      customerId: data.customerId,
      customerName: data.customerDetails.name,
      customerEmail: data.customerDetails.email,
      customerPhone: data.customerDetails.phone,
      agencyId: data.agencyId,
      serviceId: data.serviceId,
      packageId: data.packageId,
      status: 'pending',
      pricing: {
        basePrice,
        addons: 0,
        discount: 0,
        platformFee,
        total: basePrice + platformFee,
        currency: 'INR'
      },
      milestones: [],
      timeline: [
        {
          id: uuidv4(),
          type: 'created',
          description: 'Order created',
          createdAt: new Date(),
          createdBy: data.customerId
        }
      ],
      notes: data.customerDetails.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await order.save();

    // Update agency stats
    agency.completedOrders += 1;
    await agency.save();

    res.status(201).json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    logger.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get orders
app.get('/api/orders', async (req: Request, res: Response) => {
  const { customerId, agencyId, status } = req.query;

  const filter: Record<string, unknown> = {};

  if (customerId) {
    filter.customerId = customerId as string;
  }
  if (agencyId) {
    filter.agencyId = agencyId as string;
  }
  if (status) {
    filter.status = status as string;
  }

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  // Enrich with agency info
  const agencyIds = [...new Set(orders.map(o => o.agencyId))];
  const agenciesData = await Agency.find({ _id: { $in: agencyIds } })
    .select('_id name rating')
    .lean();
  const agenciesMap = new Map(agenciesData.map(a => [a._id.toString(), a]));

  const enriched = orders.map(order => ({
    ...order,
    agency: agenciesMap.get(order.agencyId) || null
  }));

  res.json({ orders: enriched, total: enriched.length });
});

// Get single order
app.get('/api/orders/:id', async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id).lean();

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const agency = await Agency.findById(order.agencyId).lean();

  res.json({
    ...order,
    agency
  });
});

// Update order status
app.patch('/api/orders/:id/status', async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const { status, notes } = req.body;

  const validStatuses = ['pending', 'confirmed', 'in_progress', 'review', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  order.status = status;
  order.timeline.push({
    id: uuidv4(),
    type: 'status_change',
    description: `Status changed to ${status}`,
    createdAt: new Date(),
    createdBy: req.body.userId || 'system'
  });

  if (notes) {
    order.notes = notes;
  }

  order.updatedAt = new Date();

  // Update agency completion rate if completed
  if (status === 'completed') {
    const agency = await Agency.findById(order.agencyId);
    if (agency) {
      const completedCount = await Order.countDocuments({
        agencyId: order.agencyId,
        status: 'completed'
      });
      const totalCount = await Order.countDocuments({ agencyId: order.agencyId });
      agency.completionRate = totalCount > 0 ? completedCount / totalCount : 0;
      await agency.save();
    }
  }

  await order.save();
  res.json(order);
});

// Add milestone
app.post('/api/orders/:id/milestones', async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const milestone = {
    id: uuidv4(),
    name: req.body.name,
    description: req.body.description,
    price: req.body.price || 0,
    status: 'pending' as const,
    dueDate: new Date(req.body.dueDate)
  };

  order.milestones.push(milestone as never);
  order.updatedAt = new Date();

  await order.save();
  res.status(201).json(milestone);
});

// ============================================================================
// Review Routes
// ============================================================================

// Submit review
app.post('/api/orders/:id/review', async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.status !== 'completed') {
    return res.status(400).json({ error: 'Can only review completed orders' });
  }

  const { score, review, quality, communication, delivery, professionalism } = req.body;

  const reviewRecord = new Review({
    orderId: order.id,
    agencyId: order.agencyId,
    customerId: order.customerId,
    customerName: order.customerName,
    score,
    review,
    categories: {
      quality: quality || score,
      communication: communication || score,
      delivery: delivery || score,
      professionalism: professionalism || score
    },
    createdAt: new Date()
  });

  await reviewRecord.save();

  // Update order with rating
  order.rating = { score, review };
  await order.save();

  // Update agency rating
  const agency = await Agency.findById(order.agencyId);
  if (agency) {
    const agencyReviews = await Review.find({ agencyId: order.agencyId });
    const totalScore = agencyReviews.reduce((sum, r) => sum + r.score, 0);
    agency.rating = totalScore / agencyReviews.length;
    agency.reviewCount = agencyReviews.length;
    await agency.save();
  }

  res.status(201).json(reviewRecord);
});

// Get reviews for agency
app.get('/api/agencies/:id/reviews', async (req: Request, res: Response) => {
  const reviews = await Review.find({ agencyId: req.params.id })
    .sort({ createdAt: -1 })
    .lean();

  res.json({ reviews, total: reviews.length });
});

// ============================================================================
// Category Routes
// ============================================================================

app.get('/api/categories', (_req: Request, res: Response) => {
  const categories = [
    {
      id: 'business_setup',
      name: 'Business Setup',
      icon: '📋',
      description: 'Company registration, licenses, GST',
      subcategories: ['company-registration', 'gst', 'licenses', 'fssai', 'iec']
    },
    {
      id: 'compliance',
      name: 'Tax & Compliance',
      icon: '📜',
      description: 'GST filing, TDS, annual returns',
      subcategories: ['gst', 'tds', 'income-tax', 'roc', 'audit']
    },
    {
      id: 'marketing',
      name: 'Marketing',
      icon: '📢',
      description: 'Social media, ads, branding',
      subcategories: ['social-media', 'advertising', 'branding', 'content', 'seo']
    },
    {
      id: 'technology',
      name: 'Technology',
      icon: '💻',
      description: 'Websites, apps, POS systems',
      subcategories: ['website', 'mobile-app', 'pos', 'crm', 'erp']
    },
    {
      id: 'finance',
      name: 'Finance & Accounting',
      icon: '💰',
      description: 'Accounting, payroll, bookkeeping',
      subcategories: ['accounting', 'payroll', 'bookkeeping', 'audit']
    },
    {
      id: 'legal',
      name: 'Legal Services',
      icon: '⚖️',
      description: 'Contracts, trademark, legal advice',
      subcategories: ['contracts', 'trademark', 'ip', 'dispute']
    },
    {
      id: 'creative',
      name: 'Creative Services',
      icon: '🎨',
      description: 'Design, video, photography',
      subcategories: ['graphic-design', 'video', 'photography', 'animation']
    },
    {
      id: 'operations',
      name: 'Operations',
      icon: '👥',
      description: 'Staffing, VAs, procurement',
      subcategories: ['recruitment', 'va', 'procurement', 'logistics']
    }
  ];

  res.json(categories);
});

// ============================================================================
// MongoDB Connection & Server Start
// ============================================================================

async function startServer(): Promise<void> {
  try {
    logger.info(`Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected successfully.');

    // Seed sample data
    await seedSampleData();

    // Get counts for startup message
    const agencyCount = await Agency.countDocuments();
    const serviceCount = await Service.countDocuments();
    const orderCount = await Order.countDocuments();

    app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🛒 BIZORA Marketplace Service                           ║
║   Agency Services Platform (MongoDB)                      ║
║                                                           ║
║   Port: ${PORT}                                             ║
║   Status: Running                                         ║
║   Database: bizora_marketplace                            ║
║                                                           ║
║   Agencies: ${agencyCount}                                          ║
║   Services: ${serviceCount}                                         ║
║   Orders: ${orderCount}                                            ║
║                                                           ║
║   Endpoints:                                              ║
║   • GET/POST /api/agencies                               ║
║   • GET/POST /api/services                               ║
║   • GET/POST /api/orders                                 ║
║   • GET /api/categories                                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`\nReceived ${signal}. Shutting down gracefully...`);
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start the server
startServer();

export { Agency, Service, Order, Review };

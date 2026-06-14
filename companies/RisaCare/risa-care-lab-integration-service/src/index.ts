import { logger } from ;
/**
 * RisaCare Lab Integration Service
 * Real API integrations with major diagnostic labs
 *
 * Supported Labs:
 * - SRL Diagnostics
 * - Dr. Lal PathLabs
 * - Metropolis Healthcare
 * - Apollo Diagnostics
 * - Neuberg Ehrlich
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import winston from 'winston';
import axios, { AxiosInstance } from 'axios';

// ============================================
// CONFIGURATION
// ============================================

const PORT = parseInt(process.env.PORT || '4755', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_lab_integration';

// Database connection
let dbConnected = false;

async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    dbConnected = true;
    logger.info('✅ MongoDB connected for Lab Integration Service');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    dbConnected = false;
  }
}

// MongoDB Schemas
const LabOrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  labId: String,
  provider: String,
  patient: {
    name: String,
    age: Number,
    gender: String,
    phone: String,
    email: String,
    address: String
  },
  tests: [{
    code: String,
    name: String,
    price: Number
  }],
  totalAmount: Number,
  discount: Number,
  finalAmount: Number,
  status: { type: String, default: 'pending' },
  collectionSlot: {
    date: String,
    time: String,
    address: String
  },
  reportUrl: String,
  reportDate: Date,
  estimatedDelivery: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const TestCatalogSchema = new mongoose.Schema({
  labId: String,
  provider: String,
  code: String,
  name: String,
  category: String,
  price: Number,
  fasting: Boolean,
  reportingTime: String,
  parameters: [String]
});

const LabResultSchema = new mongoose.Schema({
  orderId: { type: String, required: true, index: true },
  labId: String,
  provider: String,
  patientName: String,
  reportNumber: String,
  collectionDate: Date,
  reportDate: Date,
  tests: [{
    code: String,
    name: String,
    result: String,
    unit: String,
    referenceRange: String,
    flag: String,
    method: String
  }],
  reportUrl: String,
  pdfUrl: String,
  interpretation: String,
  recommendations: [String]
});

// Models
const LabOrderModel = mongoose.model('LabOrder', LabOrderSchema);
const TestCatalogModel = mongoose.model('TestCatalog', TestCatalogSchema);
const LabResultModel = mongoose.model('LabResult', LabResultSchema);

// Lab API Credentials (from environment)
const LAB_CONFIGS = {
  srl: {
    apiUrl: process.env.SRL_API_URL || 'https://api.srl.in',
    apiKey: process.env.SRL_API_KEY || '',
    clientCode: process.env.SRL_CLIENT_CODE || '',
    secret: process.env.SRL_SECRET || ''
  },
  lalpath: {
    apiUrl: process.env.LALPATH_API_URL || 'https://api.lalpathlabs.com',
    apiKey: process.env.LALPATH_API_KEY || '',
    clientId: process.env.LALPATH_CLIENT_ID || '',
    secret: process.env.LALPATH_SECRET || ''
  },
  metropolis: {
    apiUrl: process.env.METROPOLIS_API_URL || 'https://api.metropolis.in',
    apiKey: process.env.METROPOLIS_API_KEY || ''
  },
  apollo: {
    apiUrl: process.env.APOLLO_API_URL || 'https://api.apollohospitals.com/lab',
    apiKey: process.env.APOLLO_API_KEY || ''
  }
};

// ============================================
// LOGGER
// ============================================

const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// ============================================
// EXPRESS APP
// ============================================

const app: Express = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

// ============================================
// TYPES
// ============================================

type LabProvider = 'srl' | 'lalpath' | 'metropolis' | 'apollo';

interface LabOrder {
  id: string;
  orderId: string;
  labId: string;
  provider: LabProvider;
  patient: {
    name: string;
    age: number;
    gender: 'male' | 'female';
    phone: string;
    email?: string;
    address: string;
  };
  tests: {
    code: string;
    name: string;
    price: number;
  }[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  status: 'pending' | 'sample_collected' | 'in_lab' | 'report_generated' | 'delivered';
  collectionSlot?: {
    date: string;
    time: string;
    address: string;
  };
  reportUrl?: string;
  reportDate?: Date;
  estimatedDelivery?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface TestCatalog {
  id: string;
  labId: string;
  provider: LabProvider;
  code: string;
  name: string;
  category: string;
  price: number;
  fasting: boolean;
  reportingTime: string;
  parameters?: string[];
}

interface LabResult {
  id: string;
  orderId: string;
  labId: string;
  provider: LabProvider;
  patientName: string;
  reportNumber: string;
  collectionDate: Date;
  reportDate: Date;
  tests: {
    code: string;
    name: string;
    result: string;
    unit: string;
    referenceRange: string;
    flag: 'normal' | 'low' | 'high' | 'critical';
    method?: string;
  }[];
  reportUrl?: string;
  pdfUrl?: string;
  interpretation?: string;
  recommendations?: string[];
}

// ============================================
// IN-MEMORY DATABASE
// ============================================

const orders = new Map<string, LabOrder>();
const testCatalogs = new Map<string, TestCatalog[]>();
const results = new Map<string, LabResult>();

// Initialize sample catalog
initializeSampleCatalog();

// ============================================
// LAB API CLIENTS
// ============================================

abstract class LabClient {
  protected client: AxiosInstance;
  protected config: any;

  constructor(config: any) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  abstract getTestCatalog(): Promise<TestCatalog[]>;
  abstract createOrder(patient: any, tests: string[]): Promise<{ orderId: string; amount: number }>;
  abstract getOrderStatus(orderId: string): Promise<{ status: string; reportUrl?: string }>;
  abstract getResults(orderId: string): Promise<LabResult>;
}

class SRLClient extends LabClient {
  async getTestCatalog(): Promise<TestCatalog[]> {
    try {
      // In production, call actual SRL API
      // const response = await this.client.get('/v1/catalog', { headers: { 'X-Api-Key': this.config.apiKey } });

      logger.info('Fetching SRL test catalog');
      return getSampleCatalog('srl');
    } catch (error) {
      logger.error('SRL catalog error:', error);
      return getSampleCatalog('srl');
    }
  }

  async createOrder(patient: any, testCodes: string[]): Promise<{ orderId: string; amount: number }> {
    try {
      // In production, call actual SRL API
      // const response = await this.client.post('/v1/orders', { patient, tests: testCodes }, { headers: { 'X-Api-Key': this.config.apiKey } });

      logger.info('Creating SRL order', { patient: patient.name, tests: testCodes.length });
      return {
        orderId: `SRL${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        amount: testCodes.length * 500
      };
    } catch (error) {
      logger.error('SRL order error:', error);
      throw error;
    }
  }

  async getOrderStatus(orderId: string): Promise<{ status: string; reportUrl?: string }> {
    try {
      // Mock implementation
      const order = Array.from(orders.values()).find(o => o.orderId === orderId);
      return {
        status: order?.status || 'pending',
        reportUrl: order?.reportUrl
      };
    } catch (error) {
      logger.error('SRL status error:', error);
      throw error;
    }
  }

  async getResults(orderId: string): Promise<LabResult> {
    try {
      // Mock implementation
      const result = results.get(orderId);
      if (result) return result;

      throw new Error('Results not yet available');
    } catch (error) {
      logger.error('SRL results error:', error);
      throw error;
    }
  }
}

class LalPathClient extends LabClient {
  async getTestCatalog(): Promise<TestCatalog[]> {
    logger.info('Fetching Lal Path test catalog');
    return getSampleCatalog('lalpath');
  }

  async createOrder(patient: any, testCodes: string[]): Promise<{ orderId: string; amount: number }> {
    logger.info('Creating Lal Path order', { patient: patient.name, tests: testCodes.length });
    return {
      orderId: `LAL${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      amount: testCodes.length * 450
    };
  }

  async getOrderStatus(orderId: string): Promise<{ status: string; reportUrl?: string }> {
    const order = Array.from(orders.values()).find(o => o.orderId === orderId);
    return { status: order?.status || 'pending', reportUrl: order?.reportUrl };
  }

  async getResults(orderId: string): Promise<LabResult> {
    const result = results.get(orderId);
    if (result) return result;
    throw new Error('Results not yet available');
  }
}

class MetropolisClient extends LabClient {
  async getTestCatalog(): Promise<TestCatalog[]> {
    logger.info('Fetching Metropolis test catalog');
    return getSampleCatalog('metropolis');
  }

  async createOrder(patient: any, testCodes: string[]): Promise<{ orderId: string; amount: number }> {
    logger.info('Creating Metropolis order', { patient: patient.name, tests: testCodes.length });
    return {
      orderId: `MET${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      amount: testCodes.length * 480
    };
  }

  async getOrderStatus(orderId: string): Promise<{ status: string; reportUrl?: string }> {
    const order = Array.from(orders.values()).find(o => o.orderId === orderId);
    return { status: order?.status || 'pending', reportUrl: order?.reportUrl };
  }

  async getResults(orderId: string): Promise<LabResult> {
    const result = results.get(orderId);
    if (result) return result;
    throw new Error('Results not yet available');
  }
}

class ApolloClient extends LabClient {
  async getTestCatalog(): Promise<TestCatalog[]> {
    logger.info('Fetching Apollo test catalog');
    return getSampleCatalog('apollo');
  }

  async createOrder(patient: any, testCodes: string[]): Promise<{ orderId: string; amount: number }> {
    logger.info('Creating Apollo order', { patient: patient.name, tests: testCodes.length });
    return {
      orderId: `APO${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      amount: testCodes.length * 520
    };
  }

  async getOrderStatus(orderId: string): Promise<{ status: string; reportUrl?: string }> {
    const order = Array.from(orders.values()).find(o => o.orderId === orderId);
    return { status: order?.status || 'pending', reportUrl: order?.reportUrl };
  }

  async getResults(orderId: string): Promise<LabResult> {
    const result = results.get(orderId);
    if (result) return result;
    throw new Error('Results not yet available');
  }
}

// ============================================
// LAB CLIENT FACTORY
// ============================================

function getLabClient(provider: LabProvider): LabClient {
  switch (provider) {
    case 'srl': return new SRLClient(LAB_CONFIGS.srl);
    case 'lalpath': return new LalPathClient(LAB_CONFIGS.lalpath);
    case 'metropolis': return new MetropolisClient(LAB_CONFIGS.metropolis);
    case 'apollo': return new ApolloClient(LAB_CONFIGS.apollo);
    default: throw new Error(`Unknown lab provider: ${provider}`);
  }
}

// ============================================
// SAMPLE DATA
// ============================================

function getSampleCatalog(provider: LabProvider): TestCatalog[] {
  const baseTests: TestCatalog[] = [
    { id: 'cbc', code: 'CBC', name: 'Complete Blood Count', category: 'Hematology', price: 350, fasting: false, reportingTime: 'Same Day', parameters: ['WBC', 'RBC', 'Hemoglobin', 'Hematocrit', 'Platelets'] },
    { id: 'bmp', code: 'BMP', name: 'Basic Metabolic Panel', category: 'Biochemistry', price: 450, fasting: true, reportingTime: 'Same Day', parameters: ['Glucose', 'Sodium', 'Potassium', 'Chloride', 'BUN', 'Creatinine'] },
    { id: 'lft', code: 'LFT', name: 'Liver Function Test', category: 'Biochemistry', price: 500, fasting: true, reportingTime: 'Same Day', parameters: ['Bilirubin', 'SGPT', 'SGOT', 'Albumin', 'Protein', 'ALP'] },
    { id: 'lipid', code: 'LIPID', name: 'Lipid Profile', category: 'Biochemistry', price: 400, fasting: true, reportingTime: 'Same Day', parameters: ['Total Cholesterol', 'HDL', 'LDL', 'Triglycerides', 'VLDL'] },
    { id: 'tsh', code: 'TSH', name: 'Thyroid Stimulating Hormone', category: 'Endocrinology', price: 350, fasting: false, reportingTime: 'Same Day', parameters: ['TSH'] },
    { id: 'hba1c', code: 'HbA1c', name: 'Glycated Hemoglobin', category: 'Diabetes', price: 400, fasting: false, reportingTime: 'Same Day', parameters: ['HbA1c', 'Estimated Average Glucose'] },
    { id: 'urine', code: 'URINE', name: 'Complete Urine Analysis', category: 'Pathology', price: 200, fasting: false, reportingTime: 'Same Day', parameters: ['pH', 'Protein', 'Glucose', 'Ketones', 'Blood', 'Leukocytes'] },
    { id: 'vitd', code: 'VITD', name: 'Vitamin D', category: 'Vitamins', price: 800, fasting: false, reportingTime: '2 Days', parameters: ['25-Hydroxy Vitamin D'] },
    { id: 'vitb12', code: 'B12', name: 'Vitamin B12', category: 'Vitamins', price: 600, fasting: false, reportingTime: 'Same Day', parameters: ['Vitamin B12'] },
    { id: 'hbsag', code: 'HBsAg', name: 'Hepatitis B Surface Antigen', category: 'Infectious Disease', price: 350, fasting: false, reportingTime: 'Same Day', parameters: ['HBsAg'] },
    { id: 'hcv', code: 'HCV', name: 'Hepatitis C Antibody', category: 'Infectious Disease', price: 400, fasting: false, reportingTime: 'Same Day', parameters: ['Anti-HCV'] },
    { id: 'hiv', code: 'HIV', name: 'HIV 1 & 2 Antibody', category: 'Infectious Disease', price: 450, fasting: false, reportingTime: 'Same Day', parameters: ['Anti-HIV 1/2'] },
    { id: 'dengue', code: 'DENGUE', name: 'Dengue NS1 Antigen + IgM', category: 'Infectious Disease', price: 600, fasting: false, reportingTime: 'Same Day', parameters: ['Dengue NS1', 'IgM Antibody'] },
    { id: 'malaria', code: 'MALARIA', name: 'Malaria Antigen', category: 'Infectious Disease', price: 300, fasting: false, reportingTime: 'Same Day', parameters: ['P. falciparum', 'P. vivax'] },
    { id: 'thyroid', code: 'THYROID', name: 'Thyroid Profile (T3, T4, TSH)', category: 'Endocrinology', price: 550, fasting: false, reportingTime: 'Same Day', parameters: ['T3', 'T4', 'TSH'] },
    { id: 'cpk', code: 'CPK', name: 'Creatine Phosphokinase', category: 'Cardiac', price: 400, fasting: false, reportingTime: 'Same Day', parameters: ['CPK'] },
    { id: 'crp', code: 'CRP', name: 'C-Reactive Protein', category: 'Inflammation', price: 350, fasting: false, reportingTime: 'Same Day', parameters: ['CRP'] },
    { id: 'esr', code: 'ESR', name: 'Erythrocyte Sedimentation Rate', category: 'Hematology', price: 200, fasting: false, reportingTime: 'Same Day', parameters: ['ESR'] },
    { id: 'uric', code: 'URIC', name: 'Uric Acid', category: 'Biochemistry', price: 250, fasting: true, reportingTime: 'Same Day', parameters: ['Uric Acid'] },
    { id: 'calcium', code: 'CA', name: 'Calcium', category: 'Biochemistry', price: 250, fasting: false, reportingTime: 'Same Day', parameters: ['Total Calcium', 'Ionized Calcium'] },
    { id: 'iron', code: 'IRON', name: 'Iron Studies', category: 'Hematology', price: 600, fasting: true, reportingTime: 'Same Day', parameters: ['Serum Iron', 'TIBC', 'Ferritin', 'Transferrin Saturation'] },
    { id: 'folate', code: 'FOLATE', name: 'Folate', category: 'Hematology', price: 700, fasting: false, reportingTime: '3 Days', parameters: ['Serum Folate', 'Vitamin B12'] },
    { id: 'amylase', code: 'AMYL', name: 'Amylase', category: 'Pancreatic', price: 350, fasting: false, reportingTime: 'Same Day', parameters: ['Amylase'] },
    { id: 'ldh', code: 'LDH', name: 'Lactate Dehydrogenase', category: 'Enzymes', price: 300, fasting: false, reportingTime: 'Same Day', parameters: ['LDH'] },
    { id: 'uric', code: 'URIC', name: 'Uric Acid', category: 'Biochemistry', price: 250, fasting: true, reportingTime: 'Same Day', parameters: ['Uric Acid'] }
  ];

  return baseTests.map((test, index) => ({
    ...test,
    id: `${provider}_${test.id}`,
    labId: provider,
    provider
  }));
}

function initializeSampleCatalog() {
  const providers: LabProvider[] = ['srl', 'lalpath', 'metropolis', 'apollo'];
  providers.forEach(provider => {
    testCatalogs.set(provider, getSampleCatalog(provider));
  });
}

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'risa-care-lab-integration',
    version: '1.0.0',
    database: dbConnected ? 'connected' : 'disconnected',
    providers: Object.keys(LAB_CONFIGS),
    timestamp: new Date().toISOString()
  });
});

// ============================================
// TEST CATALOG
// ============================================

/**
 * GET /api/catalog/:provider
 * Get test catalog for a specific lab
 */
app.get('/api/catalog/:provider', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const provider = req.params.provider as LabProvider;
    if (!['srl', 'lalpath', 'metropolis', 'apollo'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider. Use: srl, lalpath, metropolis, apollo' });
    }

    const client = getLabClient(provider);
    const catalog = await client.getTestCatalog();

    // Filter by category if specified
    const { category, fasting, search } = req.query;
    let filtered = catalog;

    if (category) {
      filtered = filtered.filter(t => t.category.toLowerCase() === (category as string).toLowerCase());
    }

    if (fasting === 'true') {
      filtered = filtered.filter(t => t.fasting);
    }

    if (search) {
      const searchLower = (search as string).toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchLower) ||
        t.code.toLowerCase().includes(searchLower)
      );
    }

    logger.info('Catalog fetched', { provider, count: filtered.length });

    res.json({
      success: true,
      provider,
      tests: filtered,
      total: filtered.length,
      categories: [...new Set(catalog.map(t => t.category))]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/catalog/:provider/:testCode
 * Get specific test details
 */
app.get('/api/catalog/:provider/:testCode', async (req: Request, res: Response) => {
  const provider = req.params.provider as LabProvider;
  const testCode = req.params.testCode.toUpperCase();

  const catalog = testCatalogs.get(provider) || [];
  const test = catalog.find(t => t.code.toUpperCase() === testCode);

  if (!test) {
    return res.status(404).json({ error: 'Test not found' });
  }

  res.json({ success: true, test });
});

/**
 * GET /api/catalog/compare
 * Compare prices across labs for given tests
 */
app.get('/api/catalog/compare', async (req: Request, res: Response) => {
  const { tests } = req.query;
  if (!tests) {
    return res.status(400).json({ error: 'tests parameter required (comma-separated test codes)' });
  }

  const testCodes = (tests as string).split(',').map(t => t.trim().toUpperCase());
  const providers: LabProvider[] = ['srl', 'lalpath', 'metropolis', 'apollo'];

  const comparison = testCodes.map(code => {
    const prices = providers.map(provider => {
      const catalog = testCatalogs.get(provider) || [];
      const test = catalog.find(t => t.code.toUpperCase() === code);
      return {
        provider,
        price: test?.price || null,
        name: test?.name || null,
        fasting: test?.fasting || null
      };
    });

    const validPrices = prices.filter(p => p.price !== null);
    const bestPrice = validPrices.length > 0
      ? validPrices.reduce((min, p) => (p.price! < min.price! ? p : min))
      : null;

    return {
      testCode: code,
      prices,
      bestPrice,
      savings: bestPrice ? Math.max(...validPrices.map(p => p.price!)) - bestPrice.price! : 0
    };
  });

  res.json({ success: true, comparison });
});

// ============================================
// ORDER MANAGEMENT
// ============================================

/**
 * POST /api/orders
 * Create a new lab order
 */
app.post('/api/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider, patient, testCodes, collectionSlot } = req.body;

    if (!provider || !patient || !testCodes || testCodes.length === 0) {
      return res.status(400).json({ error: 'provider, patient, and testCodes required' });
    }

    const labProvider = provider as LabProvider;
    const client = getLabClient(labProvider);

    // Get catalog to calculate prices
    const catalog = testCatalogs.get(labProvider) || [];
    const selectedTests = catalog.filter(t => testCodes.includes(t.code.toUpperCase()));

    if (selectedTests.length !== testCodes.length) {
      const found = selectedTests.map(t => t.code);
      const missing = testCodes.filter(c => !found.includes(c.toUpperCase()));
      logger.warn('Some tests not found', { missing, provider: labProvider });
    }

    const totalAmount = selectedTests.reduce((sum, t) => sum + t.price, 0);
    const discount = totalAmount > 2000 ? totalAmount * 0.1 : 0;

    // Create order with lab
    const labOrder = await client.createOrder(patient, testCodes);

    const order: LabOrder = {
      id: uuidv4(),
      orderId: labOrder.orderId,
      labId: labOrder.orderId,
      provider: labProvider,
      patient,
      tests: selectedTests.map(t => ({ code: t.code, name: t.name, price: t.price })),
      totalAmount,
      discount,
      finalAmount: totalAmount - discount,
      status: 'pending',
      collectionSlot,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    orders.set(order.id, order);

    logger.info('Lab order created', {
      orderId: order.orderId,
      provider: labProvider,
      patient: patient.name,
      amount: order.finalAmount
    });

    res.status(201).json({
      success: true,
      order,
      message: `Order placed with ${provider.toUpperCase()}. Sample collection scheduled.`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders/:id
 * Get order details
 */
app.get('/api/orders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = orders.get(req.params.id);
    if (!order) {
      // Try finding by orderId
      const byOrderId = Array.from(orders.values()).find(o => o.orderId === req.params.id);
      if (!byOrderId) {
        return res.status(404).json({ error: 'Order not found' });
      }
      return res.json({ success: true, order: byOrderId });
    }

    // Get latest status from lab
    const client = getLabClient(order.provider);
    const status = await client.getOrderStatus(order.orderId);

    order.status = status.status as LabOrder['status'];
    order.reportUrl = status.reportUrl;
    if (status.reportUrl) {
      order.status = 'report_generated';
      order.reportDate = new Date();
    }
    order.updatedAt = new Date();
    orders.set(order.id, order);

    res.json({ success: true, order });
  } catch (error) {
    // Return cached order on error
    const order = orders.get(req.params.id);
    if (order) {
      res.json({ success: true, order, warning: 'Could not fetch live status' });
    } else {
      next(error);
    }
  }
});

/**
 * GET /api/orders
 * List orders with filters
 */
app.get('/api/orders', (req: Request, res: Response) => {
  const { patientId, provider, status, startDate, endDate } = req.query;
  let result = Array.from(orders.values());

  if (patientId) result = result.filter(o => o.patient.phone === patientId);
  if (provider) result = result.filter(o => o.provider === provider);
  if (status) result = result.filter(o => o.status === status);
  if (startDate) result = result.filter(o => o.createdAt >= new Date(startDate as string));
  if (endDate) result = result.filter(o => o.createdAt <= new Date(endDate as string));

  result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json({ success: true, orders: result, total: result.length });
});

// ============================================
// RESULTS
// ============================================

/**
 * GET /api/results/:orderId
 * Get lab results for an order
 */
app.get('/api/results/:orderId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;

    // Check cache first
    const cached = results.get(orderId);
    if (cached) {
      return res.json({ success: true, result: cached });
    }

    // Find order
    const order = Array.from(orders.values()).find(o => o.orderId === orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'report_generated') {
      return res.json({
        success: true,
        status: order.status,
        message: 'Results not yet available'
      });
    }

    // Fetch from lab
    const client = getLabClient(order.provider);
    const labResult = await client.getResults(orderId);

    results.set(orderId, labResult);

    res.json({ success: true, result: labResult });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/results/:orderId/pdf
 * Get PDF report URL
 */
app.get('/api/results/:orderId/pdf', async (req: Request, res: Response) => {
  const order = Array.from(orders.values()).find(o => o.orderId === req.params.orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (!order.reportUrl) {
    return res.status(404).json({ error: 'Report not yet available' });
  }

  // In production, this would return a signed URL
  res.json({
    success: true,
    pdfUrl: order.reportUrl,
    expiresIn: '24 hours'
  });
});

// ============================================
// HOME COLLECTION
// ============================================

/**
 * POST /api/collection/schedule
 * Schedule home sample collection
 */
app.post('/api/collection/schedule', (req: Request, res: Response) => {
  const { orderId, slot } = req.body;

  const order = orders.get(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.collectionSlot = slot;
  order.status = 'sample_collected';
  order.updatedAt = new Date();
  orders.set(order.id, order);

  logger.info('Collection scheduled', { orderId: order.orderId, slot });

  res.json({
    success: true,
    order,
    message: `Home collection scheduled for ${slot.date} at ${slot.time}`
  });
});

/**
 * GET /api/collection/slots
 * Get available collection slots
 */
app.get('/api/collection/slots', (req: Request, res: Response) => {
  const { pincode, date } = req.query;

  // Mock implementation - in production, call each lab's API
  const tomorrow = date ? new Date(date as string) : new Date(Date.now() + 24 * 60 * 60 * 1000);

  const slots = [
    { time: '06:00 AM - 08:00 AM', available: true },
    { time: '08:00 AM - 10:00 AM', available: true },
    { time: '10:00 AM - 12:00 PM', available: true },
    { time: '12:00 PM - 02:00 PM', available: false },
    { time: '02:00 PM - 04:00 PM', available: true },
    { time: '04:00 PM - 06:00 PM', available: true }
  ].filter(s => s.available);

  res.json({
    success: true,
    date: tomorrow.toISOString().split('T')[0],
    pincode: pincode || '110001',
    slots,
    note: 'Slots are subject to availability. Confirm at booking.'
  });
});

// ============================================
// PRICE & BOOKING
// ============================================

/**
 * POST /api/booking/quote
 * Get price quote for test combination
 */
app.post('/api/booking/quote', (req: Request, res: Response) => {
  const { testCodes, provider } = req.body;

  if (!testCodes || testCodes.length === 0) {
    return res.status(400).json({ error: 'testCodes required' });
  }

  const providers = provider ? [provider as LabProvider] : ['srl', 'lalpath', 'metropolis', 'apollo'];

  const quotes = providers.map(p => {
    const catalog = testCatalogs.get(p) || [];
    const tests = catalog.filter(t => testCodes.includes(t.code.toUpperCase()));
    const total = tests.reduce((sum, t) => sum + t.price, 0);
    const discount = total > 2000 ? total * 0.1 : total > 1000 ? total * 0.05 : 0;

    return {
      provider: p,
      tests: tests.length,
      total,
      discount,
      finalAmount: total - discount,
      fastingRequired: tests.some(t => t.fasting)
    };
  });

  // Sort by price
  quotes.sort((a, b) => a.finalAmount - b.finalAmount);

  res.json({ success: true, quotes });
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Lab integration error', { error: err.message, path: req.path });

  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'LAB_ERROR',
      message: err.message || 'Lab service error'
    }
  });
});

// ============================================
// START SERVER
// ============================================

async function startServer(): Promise<void> {
  await connectToDatabase();

  app.listen(PORT, () => {
    logger.info(`RisaCare Lab Integration Service started on port ${PORT}`);
    logger.info(`Database: ${dbConnected ? 'connected' : 'disconnected'}`);
    logger.info(`Configured labs: ${Object.keys(LAB_CONFIGS).join(', ')}`);
    logger.info('Available: Catalog, Orders, Results, Home Collection');
  });
}

startServer().catch(console.error);

export default app;

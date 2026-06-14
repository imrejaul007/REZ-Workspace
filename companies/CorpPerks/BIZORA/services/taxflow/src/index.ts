/**
 * BIZORA TaxFlow Service
 * GST Filing & Compliance Management
 * MongoDB-powered with Mongoose ODM
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose, { Schema, Document, Model } from 'mongoose';
import { z } from 'zod';
import crypto from 'crypto';

// ============================================================================
// Configuration
// ============================================================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bizora_taxflow';
const PORT = process.env.PORT || 4004;

// ============================================================================
// Mongoose Document Interfaces
// ============================================================================

export interface IAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface IInvoiceRecord {
  invoiceNumber: string;
  invoiceDate: Date;
  customerGstin?: string;
  customerName: string;
  invoiceType: 'b2b' | 'b2c' | 'export' | 'nil' | 'composition';
  supplyType: 'interstate' | 'intrastate';
  totalTaxableValue: number;
  rate: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  totalAmount: number;
  placeOfSupply: string;
  reverseCharge: boolean;
}

export interface IFilingSummary {
  totalTaxableValue: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalCess: number;
  totalLiability: number;
  itcAvailable: number;
  itcClaimed: number;
  cashBalance: number;
  totalTaxPayable: number;
}

export interface IBusinessProfile extends Document {
  userId: string;
  businessName: string;
  businessType: 'proprietorship' | 'partnership' | 'llp' | 'pvt_ltd' | 'public_ltd';
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  address: IAddress;
  constitution: string;
  registrationDate: Date;
  lastFilingDate?: Date;
  nextFilingDue?: Date;
  complianceStatus: 'compliant' | 'pending' | 'defaulted';
  filingHistory: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IFiling extends Document {
  businessId: mongoose.Types.ObjectId;
  filingType: 'GSTR-1' | 'GSTR-3B' | 'GSTR-9' | 'GSTR-9C' | 'TDS';
  period: string;
  status: 'draft' | 'prepared' | 'filed' | 'accepted' | 'rejected' | 'pending';
  dueDate: Date;
  filedDate?: Date;
  acknowledgmentNumber?: string;
  summary: IFilingSummary;
  invoices: IInvoiceRecord[];
  documents: string[];
  preparedBy?: string;
  filedBy?: string;
  reviewedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReminder extends Document {
  businessId: mongoose.Types.ObjectId;
  type: 'filing_due' | 'payment_due' | 'amendment_due' | 'annual_return';
  filingType: string;
  title: string;
  message: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'sent' | 'acknowledged' | 'completed';
  channels: ('email' | 'sms' | 'whatsapp' | 'push')[];
  sentAt?: Date;
  createdAt: Date;
}

// ============================================================================
// Mongoose Schemas
// ============================================================================

// Address Schema (embedded)
const AddressSchema = new Schema<IAddress>({
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, default: 'India' },
  pincode: { type: String, required: true },
}, { _id: false });

// Invoice Record Schema (embedded in Filing)
const InvoiceRecordSchema = new Schema<IInvoiceRecord>({
  invoiceNumber: { type: String, required: true },
  invoiceDate: { type: Date, required: true },
  customerGstin: { type: String },
  customerName: { type: String, required: true },
  invoiceType: {
    type: String,
    enum: ['b2b', 'b2c', 'export', 'nil', 'composition'],
    required: true,
  },
  supplyType: {
    type: String,
    enum: ['interstate', 'intrastate'],
    required: true,
  },
  totalTaxableValue: { type: Number, required: true, min: 0 },
  rate: { type: Number, required: true },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  cess: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  placeOfSupply: { type: String, required: true },
  reverseCharge: { type: Boolean, default: false },
}, { _id: false });

// Filing Summary Schema (embedded in Filing)
const FilingSummarySchema = new Schema<IFilingSummary>({
  totalTaxableValue: { type: Number, default: 0 },
  totalCgst: { type: Number, default: 0 },
  totalSgst: { type: Number, default: 0 },
  totalIgst: { type: Number, default: 0 },
  totalCess: { type: Number, default: 0 },
  totalLiability: { type: Number, default: 0 },
  itcAvailable: { type: Number, default: 0 },
  itcClaimed: { type: Number, default: 0 },
  cashBalance: { type: Number, default: 0 },
  totalTaxPayable: { type: Number, default: 0 },
}, { _id: false });

// Business Profile Schema
const BusinessProfileSchema = new Schema<IBusinessProfile>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    businessName: {
      type: String,
      required: true,
      minlength: 2,
    },
    businessType: {
      type: String,
      enum: ['proprietorship', 'partnership', 'llp', 'pvt_ltd', 'public_ltd'],
      required: true,
    },
    gstin: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      match: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    },
    pan: {
      type: String,
      required: true,
      uppercase: true,
      match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      minlength: 10,
    },
    address: {
      type: AddressSchema,
      required: true,
    },
    constitution: {
      type: String,
      required: true,
    },
    registrationDate: {
      type: Date,
      required: true,
    },
    lastFilingDate: {
      type: Date,
    },
    nextFilingDue: {
      type: Date,
    },
    complianceStatus: {
      type: String,
      enum: ['compliant', 'pending', 'defaulted'],
      default: 'pending',
    },
    filingHistory: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for BusinessProfile
BusinessProfileSchema.index({ userId: 1, gstin: 1 });
BusinessProfileSchema.index({ complianceStatus: 1, businessType: 1 });

// Filing Schema
const FilingSchema = new Schema<IFiling>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'BusinessProfile',
      required: true,
      index: true,
    },
    filingType: {
      type: String,
      enum: ['GSTR-1', 'GSTR-3B', 'GSTR-9', 'GSTR-9C', 'TDS'],
      required: true,
    },
    period: {
      type: String,
      required: true,
      match: /^(0[1-9]|1[0-2])(20[2-3][0-9])$/,
    },
    status: {
      type: String,
      enum: ['draft', 'prepared', 'filed', 'accepted', 'rejected', 'pending'],
      default: 'draft',
    },
    dueDate: {
      type: Date,
      required: true,
    },
    filedDate: {
      type: Date,
    },
    acknowledgmentNumber: {
      type: String,
    },
    summary: {
      type: FilingSummarySchema,
      default: () => ({}),
    },
    invoices: {
      type: [InvoiceRecordSchema],
      default: [],
    },
    documents: [{
      type: String,
    }],
    preparedBy: {
      type: String,
    },
    filedBy: {
      type: String,
    },
    reviewedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for Filing
FilingSchema.index({ businessId: 1, filingType: 1, period: 1 }, { unique: true });
FilingSchema.index({ status: 1, dueDate: 1 });
FilingSchema.index({ filingType: 1, period: 1 });
FilingSchema.index({ createdAt: -1 });

// Reminder Schema
const ReminderSchema = new Schema<IReminder>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'BusinessProfile',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['filing_due', 'payment_due', 'amendment_due', 'annual_return'],
      required: true,
    },
    filingType: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'acknowledged', 'completed'],
      default: 'pending',
    },
    channels: [{
      type: String,
      enum: ['email', 'sms', 'whatsapp', 'push'],
    }],
    sentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for Reminder
ReminderSchema.index({ businessId: 1, status: 1 });
ReminderSchema.index({ status: 1, dueDate: 1, priority: -1 });

// ============================================================================
// Mongoose Models
// ============================================================================

export const BusinessProfile: Model<IBusinessProfile> = mongoose.model<IBusinessProfile>(
  'BusinessProfile',
  BusinessProfileSchema
);

export const Filing: Model<IFiling> = mongoose.model<IFiling>('Filing', FilingSchema);

export const Reminder: Model<IReminder> = mongoose.model<IReminder>('Reminder', ReminderSchema);

// ============================================================================
// Validation Schemas (Zod)
// ============================================================================

const CreateBusinessSchema = z.object({
  userId: z.string(),
  businessName: z.string().min(2),
  businessType: z.enum(['proprietorship', 'partnership', 'llp', 'pvt_ltd', 'public_ltd']),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
  email: z.string().email(),
  phone: z.string().min(10),
  address: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    country: z.string().default('India'),
    pincode: z.string().regex(/^[0-9]{6}$/),
  }),
  constitution: z.string(),
  registrationDate: z.string(),
});

const CreateFilingSchema = z.object({
  businessId: z.string(),
  filingType: z.enum(['GSTR-1', 'GSTR-3B', 'GSTR-9', 'GSTR-9C', 'TDS']),
  period: z.string().regex(/^(0[1-9]|1[0-2])(20[2-3][0-9])$/),
});

const AddInvoiceSchema = z.object({
  filingId: z.string(),
  invoiceNumber: z.string(),
  invoiceDate: z.string(),
  customerGstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional().nullable(),
  customerName: z.string(),
  invoiceType: z.enum(['b2b', 'b2c', 'export', 'nil', 'composition']),
  supplyType: z.enum(['interstate', 'intrastate']),
  totalTaxableValue: z.number().min(0),
  rate: z.number(),
  placeOfSupply: z.string(),
  reverseCharge: z.boolean().default(false),
});

// ============================================================================
// GST Due Dates Configuration
// ============================================================================

const FILING_DUE_DATES: Record<string, { type: string; dueDay: number; description: string }> = {
  'GSTR-1': { type: 'monthly', dueDay: 11, description: 'Outward supplies (Sales)' },
  'GSTR-3B': { type: 'monthly', dueDay: 20, description: 'Summary return with tax payment' },
  'GSTR-9': { type: 'annual', dueDay: 31, description: 'Annual return', dueMonth: 12 },
  'TDS': { type: 'quarterly', dueDay: 31, description: 'TDS returns', quarters: [3, 6, 9, 12] },
};

// ============================================================================
// Helper Functions
// ============================================================================

function calculateTaxSummary(invoiceList: IInvoiceRecord[]): IFilingSummary {
  const summary: IFilingSummary = {
    totalTaxableValue: 0,
    totalCgst: 0,
    totalSgst: 0,
    totalIgst: 0,
    totalCess: 0,
    totalLiability: 0,
    itcAvailable: 0,
    itcClaimed: 0,
    cashBalance: 0,
    totalTaxPayable: 0,
  };

  for (const inv of invoiceList) {
    summary.totalTaxableValue += inv.totalTaxableValue;
    summary.totalCgst += inv.cgst;
    summary.totalSgst += inv.sgst;
    summary.totalIgst += inv.igst;
    summary.totalCess += inv.cess;
  }

  summary.totalLiability = summary.totalCgst + summary.totalSgst + summary.totalIgst + summary.totalCess;
  summary.itcAvailable = summary.totalLiability * 0.8;
  summary.itcClaimed = summary.itcAvailable;
  summary.cashBalance = summary.totalLiability * 0.1;
  summary.totalTaxPayable = summary.totalLiability - summary.itcClaimed - summary.cashBalance;

  return summary;
}

function getNextDueDate(filingType: string): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const config = FILING_DUE_DATES[filingType];
  if (!config) return now;

  if (filingType === 'GSTR-9') {
    return new Date(year, 11, 31);
  }

  if (filingType === 'TDS') {
    const quarter = Math.ceil((month + 1) / 3);
    const quarterEndMonth = quarter * 3 - 1;
    return new Date(year, quarterEndMonth, config.dueDay);
  }

  const dueMonth = month;
  const dueYear = dueMonth === 0 ? year - 1 : year;
  const adjustedMonth = dueMonth === 0 ? 11 : dueMonth - 1;
  return new Date(dueYear, adjustedMonth, config.dueDay);
}

function formatPeriod(period: string): string {
  const month = parseInt(period.slice(0, 2));
  const year = period.slice(2);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${monthNames[month - 1]} ${year}`;
}

// ============================================================================
// Sample Data Seeding
// ============================================================================

async function seedSampleData(): Promise<void> {
  try {
    const existingBusiness = await BusinessProfile.findOne({ gstin: '27AAACH1234P1Z5' });
    if (existingBusiness) {
      logger.info('[TaxFlow] Sample data already exists, skipping seed');
      return;
    }

    logger.info('[TaxFlow] Seeding sample data...');

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const period = `${prevMonth.toString().padStart(2, '0')}${prevYear}`;

    // Create sample business
    const business = await BusinessProfile.create({
      userId: 'user-001',
      businessName: 'Sample Restaurant Pvt Ltd',
      businessType: 'pvt_ltd',
      gstin: '27AAACH1234P1Z5',
      pan: 'AAACH1234P',
      email: 'accounts@samplerestaurant.com',
      phone: '+919876543210',
      address: {
        line1: '123 Business Park',
        line2: 'Andheri West',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        pincode: '400053',
      },
      constitution: 'Private Limited Company',
      registrationDate: new Date('2023-01-15'),
      complianceStatus: 'compliant',
      filingHistory: [],
    });

    // Sample invoices
    const sampleInvoices: IInvoiceRecord[] = [
      {
        invoiceNumber: 'INV-2026-001',
        invoiceDate: new Date(prevYear, prevMonth - 1, 5),
        customerGstin: '29AAACH5678M1ZX',
        customerName: 'Tech Solutions Pvt Ltd',
        invoiceType: 'b2b',
        supplyType: 'interstate',
        totalTaxableValue: 50000,
        rate: 18,
        cgst: 0,
        sgst: 0,
        igst: 9000,
        cess: 0,
        totalAmount: 59000,
        placeOfSupply: 'Karnataka',
        reverseCharge: false,
      },
      {
        invoiceNumber: 'INV-2026-002',
        invoiceDate: new Date(prevYear, prevMonth - 1, 10),
        customerName: 'Walk-in Customer',
        invoiceType: 'b2c',
        supplyType: 'intrastate',
        totalTaxableValue: 100000,
        rate: 18,
        cgst: 9000,
        sgst: 9000,
        igst: 0,
        cess: 0,
        totalAmount: 118000,
        placeOfSupply: 'Maharashtra',
        reverseCharge: false,
      },
      {
        invoiceNumber: 'INV-2026-003',
        invoiceDate: new Date(prevYear, prevMonth - 1, 15),
        customerGstin: '27AAACH9012P1Z3',
        customerName: 'Food Supplies Co',
        invoiceType: 'b2b',
        supplyType: 'intrastate',
        totalTaxableValue: 75000,
        rate: 5,
        cgst: 3750,
        sgst: 3750,
        igst: 0,
        cess: 0,
        totalAmount: 78750,
        placeOfSupply: 'Maharashtra',
        reverseCharge: false,
      },
      {
        invoiceNumber: 'INV-2026-004',
        invoiceDate: new Date(prevYear, prevMonth - 1, 20),
        customerName: 'Walk-in Customer',
        invoiceType: 'b2c',
        supplyType: 'intrastate',
        totalTaxableValue: 25000,
        rate: 18,
        cgst: 2250,
        sgst: 2250,
        igst: 0,
        cess: 0,
        totalAmount: 29500,
        placeOfSupply: 'Maharashtra',
        reverseCharge: false,
      },
    ];

    // Create sample filing
    const filing = await Filing.create({
      businessId: business._id,
      filingType: 'GSTR-3B',
      period,
      status: 'draft',
      dueDate: new Date(prevYear, prevMonth - 1, 20),
      summary: {
        totalTaxableValue: 0,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 0,
        totalCess: 0,
        totalLiability: 0,
        itcAvailable: 0,
        itcClaimed: 0,
        cashBalance: 0,
        totalTaxPayable: 0,
      },
      invoices: sampleInvoices,
      documents: [],
    });

    // Calculate summary
    filing.summary = calculateTaxSummary(sampleInvoices);
    filing.status = 'prepared';
    await filing.save();

    // Create reminders
    const filingTypes = ['GSTR-1', 'GSTR-3B', 'GSTR-9'];
    for (const type of filingTypes) {
      await Reminder.create({
        businessId: business._id,
        type: 'filing_due',
        filingType: type,
        title: `${type} Filing Due`,
        message: `Your ${type} return is due. Please prepare and file on time to avoid penalties.`,
        dueDate: getNextDueDate(type),
        priority: 'high',
        status: 'pending',
        channels: ['email', 'whatsapp', 'push'],
      });
    }

    logger.info('[TaxFlow] Sample data seeded successfully');
  } catch (error) {
    logger.error('[TaxFlow] Error seeding sample data:', error);
  }
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
    service: 'taxflow',
    timestamp: new Date().toISOString(),
    mongodb: mongoStatus,
  });
});

// ============================================================================
// Business Profile Routes
// ============================================================================

// Create business profile
app.post('/api/businesses', async (req: Request, res: Response) => {
  try {
    const data = CreateBusinessSchema.parse(req.body);

    const business = await BusinessProfile.create({
      ...data,
      address: { ...data.address, country: data.address.country || 'India' },
      registrationDate: new Date(data.registrationDate),
      complianceStatus: 'pending',
      filingHistory: [],
    });

    // Create reminders for new business
    const filingTypes = ['GSTR-1', 'GSTR-3B', 'GSTR-9'];
    for (const type of filingTypes) {
      await Reminder.create({
        businessId: business._id,
        type: 'filing_due',
        filingType: type,
        title: `${type} Filing Due`,
        message: `Your ${type} return is due. Please prepare and file on time to avoid penalties.`,
        dueDate: getNextDueDate(type),
        priority: 'high',
        status: 'pending',
        channels: ['email', 'whatsapp', 'push'],
      });
    }

    res.status(201).json(business);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    if (error instanceof Error && error.message.includes('duplicate')) {
      return res.status(409).json({ error: 'Business with this GSTIN already exists' });
    }
    logger.error('Create business error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all businesses
app.get('/api/businesses', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const filter: Record<string, unknown> = {};
    if (userId) {
      filter.userId = userId;
    }

    const businesses = await BusinessProfile.find(filter).sort({ createdAt: -1 });
    res.json({ businesses, total: businesses.length });
  } catch (error) {
    logger.error('Get businesses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single business
app.get('/api/businesses/:id', async (req: Request, res: Response) => {
  try {
    const business = await BusinessProfile.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json(business);
  } catch (error) {
    logger.error('Get business error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update business
app.patch('/api/businesses/:id', async (req: Request, res: Response) => {
  try {
    const business = await BusinessProfile.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json(business);
  } catch (error) {
    logger.error('Update business error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get filings for business
app.get('/api/businesses/:id/filings', async (req: Request, res: Response) => {
  try {
    const { status, filingType, period } = req.query;
    const filter: Record<string, unknown> = { businessId: req.params.id };

    if (status) filter.status = status;
    if (filingType) filter.filingType = filingType;
    if (period) filter.period = period;

    const filings = await Filing.find(filter).sort({ createdAt: -1 });
    res.json({ filings, total: filings.length });
  } catch (error) {
    logger.error('Get business filings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Filing Routes
// ============================================================================

// Create filing
app.post('/api/filings', async (req: Request, res: Response) => {
  try {
    const data = CreateFilingSchema.parse(req.body);

    // Check if business exists
    const business = await BusinessProfile.findById(data.businessId);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Check if filing already exists for this period
    const existing = await Filing.findOne({
      businessId: data.businessId,
      filingType: data.filingType,
      period: data.period,
    });
    if (existing) {
      return res.status(400).json({ error: 'Filing already exists for this period' });
    }

    const filing = await Filing.create({
      businessId: data.businessId,
      filingType: data.filingType,
      period: data.period,
      status: 'draft',
      dueDate: getNextDueDate(data.filingType),
      summary: {
        totalTaxableValue: 0,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 0,
        totalCess: 0,
        totalLiability: 0,
        itcAvailable: 0,
        itcClaimed: 0,
        cashBalance: 0,
        totalTaxPayable: 0,
      },
      invoices: [],
      documents: [],
    });

    res.status(201).json(filing);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    logger.error('Create filing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all filings
app.get('/api/filings', async (req: Request, res: Response) => {
  try {
    const { businessId, status, filingType } = req.query;
    const filter: Record<string, unknown> = {};

    if (businessId) filter.businessId = businessId;
    if (status) filter.status = status;
    if (filingType) filter.filingType = filingType;

    const filings = await Filing.find(filter)
      .sort({ createdAt: -1 })
      .populate('businessId', 'businessName gstin');

    const enriched = filings.map(f => ({
      ...f.toObject(),
      businessName: (f.businessId as unknown as IBusinessProfile)?.businessName,
      gstin: (f.businessId as unknown as IBusinessProfile)?.gstin,
    }));

    res.json({ filings: enriched, total: enriched.length });
  } catch (error) {
    logger.error('Get filings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single filing
app.get('/api/filings/:id', async (req: Request, res: Response) => {
  try {
    const filing = await Filing.findById(req.params.id).populate('businessId');
    if (!filing) {
      return res.status(404).json({ error: 'Filing not found' });
    }

    res.json({
      ...filing.toObject(),
      periodFormatted: formatPeriod(filing.period),
    });
  } catch (error) {
    logger.error('Get filing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add invoice to filing
app.post('/api/filings/:id/invoices', async (req: Request, res: Response) => {
  try {
    const data = AddInvoiceSchema.parse(req.body);
    const filing = await Filing.findById(data.filingId);

    if (!filing) {
      return res.status(404).json({ error: 'Filing not found' });
    }

    // Calculate tax
    const taxRate = data.rate / 100;
    let cgst = 0, sgst = 0, igst = 0;

    if (data.supplyType === 'intrastate') {
      cgst = data.totalTaxableValue * taxRate / 2;
      sgst = data.totalTaxableValue * taxRate / 2;
    } else {
      igst = data.totalTaxableValue * taxRate;
    }

    const invoice: IInvoiceRecord = {
      invoiceNumber: data.invoiceNumber,
      invoiceDate: new Date(data.invoiceDate),
      customerGstin: data.customerGstin || undefined,
      customerName: data.customerName,
      invoiceType: data.invoiceType,
      supplyType: data.supplyType,
      totalTaxableValue: data.totalTaxableValue,
      rate: data.rate,
      cgst,
      sgst,
      igst,
      cess: 0,
      totalAmount: data.totalTaxableValue + cgst + sgst + igst,
      placeOfSupply: data.placeOfSupply,
      reverseCharge: data.reverseCharge,
    };

    // Add invoice to filing
    filing.invoices.push(invoice);
    filing.summary = calculateTaxSummary(filing.invoices);
    filing.status = 'prepared';
    await filing.save();

    res.status(201).json(invoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    logger.error('Add invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get invoices for filing
app.get('/api/filings/:id/invoices', async (req: Request, res: Response) => {
  try {
    const filing = await Filing.findById(req.params.id);
    if (!filing) {
      return res.status(404).json({ error: 'Filing not found' });
    }
    res.json({ invoices: filing.invoices, total: filing.invoices.length });
  } catch (error) {
    logger.error('Get invoices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Calculate filing
app.post('/api/filings/:id/calculate', async (req: Request, res: Response) => {
  try {
    const filing = await Filing.findById(req.params.id);
    if (!filing) {
      return res.status(404).json({ error: 'Filing not found' });
    }

    filing.summary = calculateTaxSummary(filing.invoices);
    filing.status = 'prepared';
    await filing.save();

    res.json(filing.summary);
  } catch (error) {
    logger.error('Calculate filing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit filing
app.post('/api/filings/:id/submit', async (req: Request, res: Response) => {
  try {
    const filing = await Filing.findById(req.params.id);
    if (!filing) {
      return res.status(404).json({ error: 'Filing not found' });
    }

    if (filing.status === 'filed') {
      return res.status(400).json({ error: 'Filing already submitted' });
    }

    // Simulate filing process
    filing.status = 'filed';
    filing.filedDate = new Date();
    filing.acknowledgmentNumber = `ACK${Date.now()}${crypto.randomUUID().slice(0, 12).toUpperCase()}`;
    await filing.save();

    // Update business profile
    await BusinessProfile.findByIdAndUpdate(filing.businessId, {
      lastFilingDate: new Date(),
      $push: { filingHistory: filing._id.toString() },
    });

    res.json({
      ...filing.toObject(),
      message: `Filing submitted successfully. Acknowledgment Number: ${filing.acknowledgmentNumber}`,
    });
  } catch (error) {
    logger.error('Submit filing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update filing status
app.patch('/api/filings/:id', async (req: Request, res: Response) => {
  try {
    const filing = await Filing.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!filing) {
      return res.status(404).json({ error: 'Filing not found' });
    }
    res.json(filing);
  } catch (error) {
    logger.error('Update filing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Reminder Routes
// ============================================================================

app.get('/api/businesses/:id/reminders', async (req: Request, res: Response) => {
  try {
    const reminders = await Reminder.find({ businessId: req.params.id })
      .sort({ dueDate: 1 });
    res.json({ reminders, total: reminders.length });
  } catch (error) {
    logger.error('Get reminders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/reminders', async (req: Request, res: Response) => {
  try {
    const { businessId, status, priority } = req.query;
    const filter: Record<string, unknown> = {};

    if (businessId) filter.businessId = businessId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const reminders = await Reminder.find(filter)
      .sort({ dueDate: 1 })
      .populate('businessId', 'businessName gstin');

    const enriched = reminders.map(r => ({
      ...r.toObject(),
      businessName: (r.businessId as unknown as IBusinessProfile)?.businessName,
      gstin: (r.businessId as unknown as IBusinessProfile)?.gstin,
    }));

    res.json({ reminders: enriched, total: enriched.length });
  } catch (error) {
    logger.error('Get reminders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Dashboard Stats
// ============================================================================

app.get('/api/dashboard/stats', async (_req: Request, res: Response) => {
  try {
    const now = new Date();

    const [
      totalBusinesses,
      compliantBusinesses,
      pendingFilings,
      filedThisMonth,
      totalTaxPayable,
      upcomingDeadlines,
    ] = await Promise.all([
      BusinessProfile.countDocuments(),
      BusinessProfile.countDocuments({ complianceStatus: 'compliant' }),
      Filing.countDocuments({ status: { $in: ['draft', 'prepared'] } }),
      Filing.countDocuments({
        status: 'filed',
        filedDate: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        },
      }),
      Filing.aggregate([
        { $match: { status: 'filed' } },
        { $group: { _id: null, total: { $sum: '$summary.totalTaxPayable' } } },
      ]),
      Reminder.find({
        status: 'pending',
        dueDate: { $gt: now },
      })
        .sort({ dueDate: 1 })
        .limit(5)
        .populate('businessId', 'businessName'),
    ]);

    res.json({
      totalBusinesses,
      compliantBusinesses,
      pendingFilings,
      filedThisMonth,
      totalTaxPayable: totalTaxPayable[0]?.total || 0,
      upcomingDeadlines: upcomingDeadlines.map(r => ({
        ...r.toObject(),
        businessName: (r.businessId as unknown as IBusinessProfile)?.businessName,
      })),
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// MongoDB Connection & Server Start
// ============================================================================

async function startServer(): Promise<void> {
  try {
    logger.info(`[TaxFlow] Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    logger.info('[TaxFlow] MongoDB connected successfully');

    // Seed sample data
    await seedSampleData();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   📜 BIZORA TaxFlow Service                              ║
║   GST Filing & Compliance (MongoDB)                       ║
║                                                           ║
║   Port: ${PORT}                                             ║
║   MongoDB: ${MONGODB_URI.split('@')[1] || MONGODB_URI}        ║
║   Status: Running                                        ║
║                                                           ║
║   Filing Types:                                          ║
║   • GSTR-1 (Monthly) - Due: 11th                       ║
║   • GSTR-3B (Monthly) - Due: 20th                      ║
║   • GSTR-9 (Annual) - Due: Dec 31st                   ║
║   • TDS (Quarterly) - Due: 31st                        ║
║                                                           ║
║   Endpoints:                                             ║
║   • POST/GET /api/businesses                           ║
║   • POST/GET /api/filings                              ║
║   • POST /api/filings/:id/invoices                     ║
║   • GET /api/reminders                                 ║
║   • GET /api/dashboard/stats                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('[TaxFlow] Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('[TaxFlow] Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('[TaxFlow] Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

// Start the server
startServer();

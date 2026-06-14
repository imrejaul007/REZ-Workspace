/**
 * BIZORA InvoiceFlow Service
 * GST-Compliant Invoice Generation with MongoDB
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose, { Document, Model, Schema, HydratedDocument } from 'mongoose';
import { z } from 'zod';

// ============================================================================
// Environment & Configuration
// ============================================================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bizora_invoiceflow';
const PORT = parseInt(process.env.PORT || '4005', 10);

// ============================================================================
// Types
// ============================================================================

type InvoiceType = 'tax_invoice' | 'bill_of_supply' | 'export_invoice' | 'credit_note' | 'debit_note';
type InvoiceStatus = 'draft' | 'issued' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
type PaymentStatus = 'unpaid' | 'partial' | 'paid';

interface IInvoiceItem {
  description: string;
  hsnCode?: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  taxableAmount: number;
  taxRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  total: number;
}

interface IInvoice extends Document {
  invoiceNumber: string;
  businessId: string;
  customerId?: string;
  type: InvoiceType;
  status: InvoiceStatus;
  invoiceDate: Date;
  dueDate: Date;
  customer: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstin?: string;
    pan?: string;
    email?: string;
    phone?: string;
  };
  items: IInvoiceItem[];
  subtotal: number;
  discount: number;
  taxableValue: number;
  taxBreakdown: {
    cgst: { rate: number; amount: number };
    sgst: { rate: number; amount: number };
    igst: { rate: number; amount: number };
    cess: { rate: number; amount: number };
  };
  totalTax: number;
  totalAmount: number;
  amountInWords: string;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  paymentTerms?: string;
  paymentMethod?: string;
  paidDate?: Date;
  eInvoiceNumber?: string;
  ackNumber?: string;
  ackDate?: Date;
  irn?: string;
  notes?: string;
  terms?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface ICustomerAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

interface ICustomer extends Document {
  businessId: string;
  name: string;
  email?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  address?: ICustomerAddress;
  createdAt: Date;
  updatedAt: Date;
}

// Type for the invoice item from request
type InvoiceItemInput = {
  description: string;
  hsnCode?: string;
  quantity: number;
  unit?: string;
  rate: number;
  discount?: number;
  taxRate: number;
};

// ============================================================================
// Validation Schemas
// ============================================================================

const CreateInvoiceSchema = z.object({
  businessId: z.string().min(1, 'businessId is required'),
  customerId: z.string().optional(),
  type: z.enum(['tax_invoice', 'bill_of_supply', 'export_invoice', 'credit_note', 'debit_note']).default('tax_invoice'),
  customer: z.object({
    name: z.string().min(1, 'Customer name is required'),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional().or(z.literal('')),
    pan: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }),
  items: z.array(z.object({
    description: z.string().min(1, 'Item description is required'),
    hsnCode: z.string().optional(),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unit: z.string().default('pcs'),
    rate: z.number().min(0, 'Rate cannot be negative'),
    discount: z.number().min(0).default(0),
    taxRate: z.number().min(0, 'Tax rate cannot be negative'),
  })),
  invoiceDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid invoice date' }),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid due date' }),
  notes: z.string().optional(),
  terms: z.string().optional(),
  placeOfSupply: z.string().optional(),
});

const CreateCustomerSchema = z.object({
  businessId: z.string().min(1, 'businessId is required'),
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
  pan: z.string().optional(),
  address: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    pincode: z.string().regex(/^[0-9]{6}$/, 'Pincode must be 6 digits'),
  }).optional(),
});

const PaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be positive'),
  method: z.string().optional(),
});

const RecordPaymentSchema = z.object({
  amount: z.number().positive('Amount is required'),
  method: z.string().optional(),
});

const SendInvoiceSchema = z.object({
  channel: z.enum(['email', 'sms', 'whatsapp']).default('email'),
});

// ============================================================================
// Mongoose Schemas
// ============================================================================

// Invoice Item Subdocument Schema
const InvoiceItemSchema = new Schema<IInvoiceItem>({
  description: { type: String, required: true },
  hsnCode: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, default: 'pcs' },
  rate: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  taxableAmount: { type: Number, required: true },
  taxRate: { type: Number, required: true, min: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  cess: { type: Number, default: 0 },
  total: { type: Number, required: true },
}, { _id: false });

// Tax Breakdown Subdocument Schema
const TaxBreakdownSchema = new Schema({
  cgst: {
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
  sgst: {
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
  igst: {
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
  cess: {
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
}, { _id: false });

// Customer Subdocument Schema (for embedding in Invoice)
const CustomerEmbeddedSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  gstin: { type: String },
  pan: { type: String },
  email: { type: String },
  phone: { type: String },
}, { _id: false });

// Invoice Schema
const InvoiceSchema = new Schema<IInvoice>({
  invoiceNumber: { type: String, required: true, unique: true, index: true },
  businessId: { type: String, required: true, index: true },
  customerId: { type: String, index: true },
  type: {
    type: String,
    enum: ['tax_invoice', 'bill_of_supply', 'export_invoice', 'credit_note', 'debit_note'],
    default: 'tax_invoice',
  },
  status: {
    type: String,
    enum: ['draft', 'issued', 'viewed', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
    index: true,
  },
  invoiceDate: { type: Date, required: true, index: true },
  dueDate: { type: Date, required: true, index: true },
  customer: { type: CustomerEmbeddedSchema, required: true },
  items: { type: [InvoiceItemSchema], required: true, validate: [arr => arr.length > 0, 'At least one item is required'] },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  taxableValue: { type: Number, required: true },
  taxBreakdown: { type: TaxBreakdownSchema, required: true },
  totalTax: { type: Number, required: true },
  totalAmount: { type: Number, required: true, index: true },
  amountInWords: { type: String, required: true },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid',
    index: true,
  },
  paidAmount: { type: Number, default: 0 },
  paymentTerms: { type: String },
  paymentMethod: { type: String },
  paidDate: { type: Date },
  eInvoiceNumber: { type: String },
  ackNumber: { type: String },
  ackDate: { type: Date },
  irn: { type: String },
  notes: { type: String },
  terms: { type: String },
  attachments: { type: [String] },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Compound indexes for common queries
InvoiceSchema.index({ businessId: 1, status: 1 });
InvoiceSchema.index({ businessId: 1, paymentStatus: 1 });
InvoiceSchema.index({ businessId: 1, invoiceDate: -1 });
InvoiceSchema.index({ customerId: 1, createdAt: -1 });
InvoiceSchema.index({ businessId: 1, status: 1, dueDate: 1 }); // For overdue lookups

// Address Schema
const AddressSchema = new Schema({
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
}, { _id: false });

// Customer Schema
const CustomerSchema = new Schema<ICustomer>({
  businessId: { type: String, required: true, index: true },
  name: { type: String, required: true, index: 'text' },
  email: { type: String, index: true },
  phone: { type: String, index: true },
  gstin: { type: String, sparse: true, index: true },
  pan: { type: String },
  address: { type: AddressSchema },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Compound indexes for customer queries
CustomerSchema.index({ businessId: 1, name: 'text' });
CustomerSchema.index({ businessId: 1, gstin: 1 }, { sparse: true });

// ============================================================================
// Models
// ============================================================================

interface IInvoiceModel extends Model<IInvoice> {
  findByBusiness(businessId: string, filters?: Record<string, unknown>): Promise<HydratedDocument<IInvoice>[]>;
  getStats(businessId: string): Promise<Record<string, unknown>>;
  generateInvoiceNumber(): Promise<string>;
}

interface ICustomerModel extends Model<ICustomer> {
  searchByBusiness(businessId: string, search?: string): Promise<HydratedDocument<ICustomer>[]>;
}

// Static method for finding invoices by business with filters
InvoiceSchema.statics.findByBusiness = async function(
  businessId: string,
  filters: {
    status?: string;
    customerId?: string;
    from?: Date;
    to?: Date;
  } = {}
): Promise<HydratedDocument<IInvoice>[]> {
  const query: Record<string, unknown> = { businessId };

  if (filters.status) query.status = filters.status;
  if (filters.customerId) query.customerId = filters.customerId;
  if (filters.from || filters.to) {
    query.invoiceDate = {};
    if (filters.from) (query.invoiceDate as Record<string, Date>).$gte = filters.from;
    if (filters.to) (query.invoiceDate as Record<string, Date>).$lte = filters.to;
  }

  return this.find(query).sort({ invoiceDate: -1 }).exec();
};

// Static method for dashboard stats
InvoiceSchema.statics.getStats = async function(businessId: string): Promise<Record<string, unknown>> {
  const pipeline = [
    { $match: { businessId } },
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        totalOutstanding: {
          $sum: { $subtract: ['$totalAmount', '$paidAmount'] }
        },
        paidCount: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
        },
      }
    }
  ];

  const result = await this.aggregate(pipeline).exec();
  const stats = result[0] || { totalInvoices: 0, totalRevenue: 0, totalOutstanding: 0, paidCount: 0 };

  // Get by status counts
  const statusCounts = await this.aggregate([
    { $match: { businessId } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]).exec();

  const byStatus: Record<string, number> = {};
  statusCounts.forEach(s => { byStatus[s._id] = s.count; });

  // Get overdue count
  const overdueCount = await this.countDocuments({
    businessId,
    status: 'issued',
    dueDate: { $lt: new Date() }
  }).exec();

  // Get recent invoices
  const recentInvoices = await this.find({ businessId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('_id invoiceNumber customer totalAmount status paymentStatus')
    .exec();

  return {
    ...stats,
    overdueInvoices: overdueCount,
    byStatus,
    recentInvoices,
  };
};

// Generate invoice number with atomic counter
InvoiceSchema.statics.generateInvoiceNumber = async function(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');

  // Use a counter document for atomic increment
  const counter = await mongoose.connection.collection('counters').findOneAndUpdate(
    { _id: 'invoiceNumber' },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );

  const seq = (counter?.seq || 1).toString().padStart(6, '0');
  return `INV-${year}${month}-${seq}`;
};

// Static method for customer search
CustomerSchema.statics.searchByBusiness = async function(
  businessId: string,
  search?: string
): Promise<HydratedDocument<ICustomer>[]> {
  const query: Record<string, unknown> = { businessId };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { gstin: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  return this.find(query).sort({ name: 1 }).exec();
};

// Create models
const Invoice = mongoose.model<IInvoice, IInvoiceModel>('Invoice', InvoiceSchema);
const Customer = mongoose.model<ICustomer, ICustomerModel>('Customer', CustomerSchema);

// ============================================================================
// Helper Functions
// ============================================================================

function calculateAmountInWords(amount: number): string {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertHundreds = (n: number): string => {
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + units[n % 10] : '');
  };

  const convertThousands = (n: number): string => {
    if (n < 1000) return convertHundreds(n);
    return units[Math.floor(n / 1000)] + ' Thousand' + (n % 1000 ? ' ' + convertHundreds(n % 1000) : '');
  };

  const convertLakhs = (n: number): string => {
    if (n < 100000) return convertThousands(n);
    return units[Math.floor(n / 100000)] + ' Lakh' + (n % 100000 ? ' ' + convertThousands(Math.floor(n % 100000)) : '');
  };

  if (amount === 0) return 'Zero';

  const crore = Math.floor(amount / 10000000);
  const remainder = Math.floor(amount % 10000000);

  let result = '';
  if (crore > 0) {
    result += units[crore] + ' Crore';
  }
  if (remainder > 0) {
    if (result) result += ' ';
    result += convertLakhs(remainder);
  }

  return result + ' Only';
}

function calculateItemTaxes(item: InvoiceItemInput, supplyType: 'intra' | 'inter'): Omit<IInvoiceItem, never> {
  const taxableAmount = (item.rate * item.quantity) - (item.discount || 0);
  const taxRate = item.taxRate / 100;

  let cgst = 0, sgst = 0, igst = 0;

  if (supplyType === 'intra') {
    cgst = taxableAmount * taxRate / 2;
    sgst = taxableAmount * taxRate / 2;
  } else {
    igst = taxableAmount * taxRate;
  }

  const totalTax = cgst + sgst + igst;
  const total = taxableAmount + totalTax;

  return {
    description: item.description,
    hsnCode: item.hsnCode,
    quantity: item.quantity,
    unit: item.unit || 'pcs',
    rate: item.rate,
    discount: item.discount || 0,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    taxRate: item.taxRate,
    cgst: Math.round(cgst * 100) / 100,
    sgst: Math.round(sgst * 100) / 100,
    igst: Math.round(igst * 100) / 100,
    cess: 0,
    total: Math.round(total * 100) / 100,
  };
}

// ============================================================================
// Sample Data Seeding
// ============================================================================

async function seedSampleData(): Promise<void> {
  try {
    // Check if data already exists
    const existingCustomers = await Customer.countDocuments();
    const existingInvoices = await Invoice.countDocuments();

    if (existingCustomers > 0 || existingInvoices > 0) {
      logger.info('[InvoiceFlow] Sample data already exists, skipping seed');
      return;
    }

    logger.info('[InvoiceFlow] Seeding sample data...');

    // Create sample customers
    const sampleCustomers = [
      {
        businessId: 'biz-001',
        name: 'Tech Solutions Pvt Ltd',
        email: 'accounts@techsol.in',
        phone: '+919876543210',
        gstin: '29AAACH5678M1ZX',
        pan: 'AAACH5678M',
        address: {
          line1: '456 Tech Park',
          line2: 'MG Road',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
        },
      },
      {
        businessId: 'biz-001',
        name: 'Food Supplies Co',
        email: 'purchase@foodsupplies.com',
        phone: '+919876543211',
        gstin: '27AAACH9012P1Z3',
        pan: 'AAACH9012P',
        address: {
          line1: '789 Industrial Area',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
        },
      },
      {
        businessId: 'biz-001',
        name: 'Global Retail Chains',
        email: 'procurement@globalretail.in',
        phone: '+919876543212',
        gstin: '19AAACH3456K2WQ',
        pan: 'AAACH3456K',
        address: {
          line1: '123 Commerce Hub',
          city: 'Kolkata',
          state: 'West Bengal',
          pincode: '700001',
        },
      },
    ];

    const createdCustomers = await Customer.insertMany(sampleCustomers);
    logger.info(`[InvoiceFlow] Created ${createdCustomers.length} sample customers`);

    // Create sample invoices
    const now = new Date();
    const sampleInvoices = [
      {
        invoiceNumber: 'INV-2026-000001',
        businessId: 'biz-001',
        customerId: createdCustomers[0]._id.toString(),
        type: 'tax_invoice',
        status: 'paid',
        invoiceDate: new Date('2026-05-01'),
        dueDate: new Date('2026-05-31'),
        customer: {
          name: 'Tech Solutions Pvt Ltd',
          address: '456 Tech Park, MG Road',
          city: 'Bangalore',
          state: 'Karnataka',
          gstin: '29AAACH5678M1ZX',
          email: 'accounts@techsol.in',
        },
        items: [
          {
            description: 'Web Development Services',
            hsnCode: '9983',
            quantity: 1,
            unit: 'job',
            rate: 75000,
            discount: 5000,
            taxableAmount: 70000,
            taxRate: 18,
            cgst: 6300,
            sgst: 6300,
            igst: 0,
            cess: 0,
            total: 82600,
          },
        ],
        subtotal: 70000,
        discount: 5000,
        taxableValue: 70000,
        taxBreakdown: { cgst: { rate: 9, amount: 6300 }, sgst: { rate: 9, amount: 6300 }, igst: { rate: 0, amount: 0 }, cess: { rate: 0, amount: 0 } },
        totalTax: 12600,
        totalAmount: 82600,
        amountInWords: 'Eighty Two Thousand Six Hundred Only',
        paymentStatus: 'paid',
        paidAmount: 82600,
        paymentTerms: 'Net 30',
        paymentMethod: 'UPI',
        paidDate: new Date('2026-05-15'),
      },
      {
        invoiceNumber: 'INV-2026-000002',
        businessId: 'biz-001',
        customerId: createdCustomers[1]._id.toString(),
        type: 'tax_invoice',
        status: 'issued',
        invoiceDate: new Date('2026-05-10'),
        dueDate: new Date('2026-06-10'),
        customer: {
          name: 'Food Supplies Co',
          address: '789 Industrial Area',
          city: 'Mumbai',
          state: 'Maharashtra',
          gstin: '27AAACH9012P1Z3',
          email: 'purchase@foodsupplies.com',
        },
        items: [
          {
            description: 'Restaurant POS System License',
            hsnCode: '9984',
            quantity: 5,
            unit: 'license',
            rate: 5999,
            discount: 0,
            taxableAmount: 29995,
            taxRate: 18,
            cgst: 2699.55,
            sgst: 2699.55,
            igst: 0,
            cess: 0,
            total: 35394.10,
          },
        ],
        subtotal: 29995,
        discount: 0,
        taxableValue: 29995,
        taxBreakdown: { cgst: { rate: 9, amount: 2699.55 }, sgst: { rate: 9, amount: 2699.55 }, igst: { rate: 0, amount: 0 }, cess: { rate: 0, amount: 0 } },
        totalTax: 5399.10,
        totalAmount: 35394.10,
        amountInWords: 'Thirty Five Thousand Three Hundred Ninety Four and Ten Paise Only',
        paymentStatus: 'unpaid',
        paidAmount: 0,
        paymentTerms: 'Net 30',
      },
      {
        invoiceNumber: 'INV-2026-000003',
        businessId: 'biz-001',
        customerId: createdCustomers[2]._id.toString(),
        type: 'tax_invoice',
        status: 'overdue',
        invoiceDate: new Date('2026-04-01'),
        dueDate: new Date('2026-04-30'),
        customer: {
          name: 'Global Retail Chains',
          address: '123 Commerce Hub',
          city: 'Kolkata',
          state: 'West Bengal',
          gstin: '19AAACH3456K2WQ',
          email: 'procurement@globalretail.in',
        },
        items: [
          {
            description: 'Inventory Management Software',
            hsnCode: '9984',
            quantity: 10,
            unit: 'license',
            rate: 4999,
            discount: 5000,
            taxableAmount: 44990,
            taxRate: 18,
            cgst: 4049.10,
            sgst: 4049.10,
            igst: 0,
            cess: 0,
            total: 53088.20,
          },
        ],
        subtotal: 49990,
        discount: 5000,
        taxableValue: 44990,
        taxBreakdown: { cgst: { rate: 9, amount: 4049.10 }, sgst: { rate: 9, amount: 4049.10 }, igst: { rate: 0, amount: 0 }, cess: { rate: 0, amount: 0 } },
        totalTax: 8098.20,
        totalAmount: 53088.20,
        amountInWords: 'Fifty Three Thousand Eighty Eight and Twenty Paise Only',
        paymentStatus: 'unpaid',
        paidAmount: 0,
        paymentTerms: 'Net 30',
      },
    ];

    await Invoice.insertMany(sampleInvoices);
    logger.info(`[InvoiceFlow] Created ${sampleInvoices.length} sample invoices`);

    // Initialize counter
    await mongoose.connection.collection('counters').updateOne(
      { _id: 'invoiceNumber' },
      { $set: { seq: 3 } },
      { upsert: true }
    );

    logger.info('[InvoiceFlow] Sample data seeding complete');
  } catch (error) {
    logger.error('[InvoiceFlow] Error seeding sample data:', error);
  }
}

// ============================================================================
// Express App
// ============================================================================

const app = express();

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'invoiceflow',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Invoice Routes
// ============================================================================

// Create invoice
app.post('/api/invoices', async (req: Request, res: Response) => {
  try {
    const data = CreateInvoiceSchema.parse(req.body);

    // Generate invoice number
    const invoiceNumber = await Invoice.generateInvoiceNumber();

    // Calculate totals
    let subtotal = 0;
    let totalDiscount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalCess = 0;

    // Determine supply type based on states (simplified - intra-state for now)
    const supplyType: 'intra' | 'inter' = 'intra';

    const items = data.items.map(item => {
      const calculated = calculateItemTaxes(item, supplyType);
      subtotal += item.rate * item.quantity;
      totalDiscount += item.discount || 0;
      totalCgst += calculated.cgst;
      totalSgst += calculated.sgst;
      totalIgst += calculated.igst;
      totalCess += calculated.cess;

      return calculated;
    });

    const taxableValue = subtotal - totalDiscount;
    const totalTax = totalCgst + totalSgst + totalIgst + totalCess;
    const totalAmount = taxableValue + totalTax;

    const invoice = new Invoice({
      invoiceNumber,
      businessId: data.businessId,
      customerId: data.customerId,
      type: data.type,
      status: 'draft',
      invoiceDate: new Date(data.invoiceDate),
      dueDate: new Date(data.dueDate),
      customer: data.customer,
      items,
      subtotal,
      discount: totalDiscount,
      taxableValue,
      taxBreakdown: {
        cgst: { rate: 9, amount: totalCgst },
        sgst: { rate: 9, amount: totalSgst },
        igst: { rate: 18, amount: totalIgst },
        cess: { rate: 0, amount: totalCess },
      },
      totalTax,
      totalAmount,
      amountInWords: calculateAmountInWords(Math.floor(totalAmount)),
      paymentStatus: 'unpaid',
      paidAmount: 0,
      paymentTerms: data.terms || 'Net 30',
      notes: data.notes,
      terms: data.terms,
    });

    await invoice.save();

    res.status(201).json(invoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    logger.error('Create invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all invoices
app.get('/api/invoices', async (req: Request, res: Response) => {
  try {
    const { businessId, status, customerId, from, to } = req.query;

    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const invoices = await Invoice.findByBusiness(businessId as string, {
      status: status as string,
      customerId: customerId as string,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
    });

    res.json({ invoices, total: invoices.length });
  } catch (error) {
    logger.error('Get invoices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single invoice
app.get('/api/invoices/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    logger.error('Get invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update invoice
app.patch('/api/invoices/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Cannot modify paid invoice' });
    }

    const allowedUpdates = [
      'customer', 'items', 'notes', 'terms', 'paymentTerms',
      'invoiceDate', 'dueDate'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        (invoice as Record<string, unknown>)[field] = req.body[field];
      }
    });

    await invoice.save();
    res.json(invoice);
  } catch (error) {
    logger.error('Update invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Issue invoice
app.post('/api/invoices/:id/issue', async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status !== 'draft') {
      return res.status(400).json({ error: 'Invoice already issued' });
    }

    invoice.status = 'issued';
    await invoice.save();

    res.json(invoice);
  } catch (error) {
    logger.error('Issue invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Record payment
app.post('/api/invoices/:id/payment', async (req: Request, res: Response) => {
  try {
    const validation = RecordPaymentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const { amount, method } = validation.data;
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Invoice already paid' });
    }

    invoice.paidAmount += amount;
    if (method) invoice.paymentMethod = method;

    if (invoice.paidAmount >= invoice.totalAmount) {
      invoice.paymentStatus = 'paid';
      invoice.paidDate = new Date();
      invoice.status = 'paid';
    } else {
      invoice.paymentStatus = 'partial';
    }

    await invoice.save();
    res.json(invoice);
  } catch (error) {
    logger.error('Record payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel invoice
app.post('/api/invoices/:id/cancel', async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Cannot cancel paid invoice' });
    }

    invoice.status = 'cancelled';
    await invoice.save();

    res.json(invoice);
  } catch (error) {
    logger.error('Cancel invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete invoice (draft only)
app.delete('/api/invoices/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status !== 'draft') {
      return res.status(400).json({ error: 'Can only delete draft invoices' });
    }

    await invoice.deleteOne();
    res.json({ success: true });
  } catch (error) {
    logger.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send invoice
app.post('/api/invoices/:id/send', async (req: Request, res: Response) => {
  try {
    const validation = SendInvoiceSchema.safeParse(req.body);
    const channel = validation.success ? validation.data.channel : 'email';

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    logger.info(`[InvoiceFlow] Sending invoice ${invoice.invoiceNumber} via ${channel}`);

    if (invoice.status === 'draft') {
      invoice.status = 'issued';
      await invoice.save();
    }

    res.json({ success: true, message: `Invoice sent via ${channel}` });
  } catch (error) {
    logger.error('Send invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate PDF URL (mock)
app.get('/api/invoices/:id/pdf', async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({
      url: `https://bizora.com/invoices/${invoice.invoiceNumber}.pdf`,
      invoiceNumber: invoice.invoiceNumber,
    });
  } catch (error) {
    logger.error('Generate PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Customer Routes
// ============================================================================

// Create customer
app.post('/api/customers', async (req: Request, res: Response) => {
  try {
    const data = CreateCustomerSchema.parse(req.body);

    const customer = new Customer(data);
    await customer.save();

    res.status(201).json(customer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    logger.error('Create customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customers
app.get('/api/customers', async (req: Request, res: Response) => {
  try {
    const { businessId, search } = req.query;

    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const customers = await Customer.searchByBusiness(
      businessId as string,
      search as string | undefined
    );

    res.json({ customers, total: customers.length });
  } catch (error) {
    logger.error('Get customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single customer
app.get('/api/customers/:id', async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    logger.error('Get customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update customer
app.patch('/api/customers/:id', async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const allowedUpdates = ['name', 'email', 'phone', 'gstin', 'pan', 'address'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        (customer as Record<string, unknown>)[field] = req.body[field];
      }
    });

    await customer.save();
    res.json(customer);
  } catch (error) {
    logger.error('Update customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete customer
app.delete('/api/customers/:id', async (req: Request, res: Response) => {
  try {
    // Check if customer has invoices
    const invoiceCount = await Invoice.countDocuments({ customerId: req.params.id });

    if (invoiceCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete customer with existing invoices',
        invoiceCount
      });
    }

    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Delete customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Dashboard Stats
// ============================================================================

app.get('/api/dashboard/stats', async (req: Request, res: Response) => {
  try {
    const { businessId } = req.query;

    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const stats = await Invoice.getStats(businessId as string);

    res.json(stats);
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
    logger.info(`[InvoiceFlow] Connecting to MongoDB at ${MONGODB_URI}...`);

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('[InvoiceFlow] MongoDB connected successfully');

    // Seed sample data
    await seedSampleData();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   BIZORA InvoiceFlow Service                             ║
║   GST-Compliant Invoice Generation                      ║
║                                                           ║
║   Port: ${PORT.toString().padEnd(46)}║
║   MongoDB: ${MONGODB_URI.substring(0, 40).padEnd(40)}║
║   Status: Running                                        ║
║                                                           ║
║   Invoice Types:                                        ║
║   - Tax Invoice (with GST)                             ║
║   - Bill of Supply (no GST)                           ║
║   - Export Invoice                                      ║
║   - Credit Note                                        ║
║   - Debit Note                                         ║
║                                                           ║
║   Endpoints:                                           ║
║   - POST/GET /api/invoices                             ║
║   - POST /api/invoices/:id/payment                     ║
║   - GET /api/dashboard/stats                           ║
║   - POST/GET /api/customers                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('[InvoiceFlow] Failed to start server:', error);
    process.exit(1);
  }
}

// Handle connection events
mongoose.connection.on('error', (err) => {
  logger.error('[InvoiceFlow] MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('[InvoiceFlow] MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('[InvoiceFlow] Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('[InvoiceFlow] Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

// Start the server
startServer();

export { Invoice, Customer };

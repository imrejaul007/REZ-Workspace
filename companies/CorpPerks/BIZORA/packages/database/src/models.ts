/**
 * BIZORA Database Models
 * MongoDB Schemas for all services
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// User Model
// ============================================================================

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  phone: string;
  type: 'business_owner' | 'agency' | 'admin' | 'support';
  avatar?: string;
  businessId?: mongoose.Types.ObjectId;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, index: true },
  type: { type: String, enum: ['business_owner', 'agency', 'admin', 'support'], default: 'business_owner' },
  avatar: String,
  businessId: { type: Schema.Types.ObjectId, ref: 'Business' },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', userSchema);

// ============================================================================
// Business Model
// ============================================================================

export interface IBusiness extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: 'proprietorship' | 'partnership' | 'llp' | 'pvt_ltd' | 'public_ltd';
  industry: string;
  gstin?: string;
  pan?: string;
  tan?: string;
  email: string;
  phone: string;
  website?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  plan: 'starter' | 'business' | 'growth' | 'enterprise';
  subscriptionEndsAt?: Date;
  employeeCount: number;
  monthlyRevenue: number;
  createdAt: Date;
  updatedAt: Date;
}

const businessSchema = new Schema<IBusiness>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['proprietorship', 'partnership', 'llp', 'pvt_ltd', 'public_ltd'],
    required: true
  },
  industry: { type: String, required: true, index: true },
  gstin: { type: String, sparse: true },
  pan: String,
  tan: String,
  email: String,
  phone: String,
  website: String,
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    country: { type: String, default: 'India' },
    pincode: String
  },
  plan: { type: String, enum: ['starter', 'business', 'growth', 'enterprise'], default: 'starter' },
  subscriptionEndsAt: Date,
  employeeCount: { type: Number, default: 0 },
  monthlyRevenue: { type: Number, default: 0 }
}, { timestamps: true });

businessSchema.index({ 'address.city': 1 });
businessSchema.index({ 'address.state': 1 });
businessSchema.index({ gstin: 1 }, { unique: true, sparse: true });

export const Business = mongoose.model<IBusiness>('Business', businessSchema);

// ============================================================================
// Agency Model
// ============================================================================

export interface IAgency extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  logo?: string;
  description: string;
  categories: string[];
  subcategories: string[];
  location: { country: string; city: string; state?: string };
  rating: number;
  reviewCount: number;
  completedOrders: number;
  verified: boolean;
  verificationDocuments: string[];
  pricing: { minOrder: number; maxOrder?: number; currency: string };
  responseTime: number;
  completionRate: number;
  status: 'active' | 'suspended' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const agencySchema = new Schema<IAgency>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  logo: String,
  description: { type: String, required: true },
  categories: [{ type: String, index: true }],
  subcategories: [String],
  location: {
    country: { type: String, default: 'India' },
    city: { type: String, index: true },
    state: String
  },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  completedOrders: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  verificationDocuments: [String],
  pricing: {
    minOrder: { type: Number, default: 0 },
    maxOrder: Number,
    currency: { type: String, default: 'INR' }
  },
  responseTime: { type: Number, default: 60 },
  completionRate: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'suspended', 'inactive'], default: 'active' }
}, { timestamps: true });

agencySchema.index({ 'categories': 1, 'location.city': 1 });
agencySchema.index({ rating: -1, completedOrders: -1 });

export const Agency = mongoose.model<IAgency>('Agency', agencySchema);

// ============================================================================
// Order Model
// ============================================================================

export interface IOrder extends Document {
  orderNumber: string;
  customerId: mongoose.Types.ObjectId;
  agencyId: mongoose.Types.ObjectId;
  serviceId?: mongoose.Types.ObjectId;
  packageId?: mongoose.Types.ObjectId;
  status: 'pending' | 'confirmed' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  pricing: {
    basePrice: number;
    addons: number;
    discount: number;
    platformFee: number;
    total: number;
    currency: string;
  };
  customerDetails: {
    name: string;
    email?: string;
    phone: string;
    notes?: string;
  };
  milestones: [{
    id: string;
    name: string;
    description?: string;
    price: number;
    status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'revision';
    dueDate: Date;
    completedAt?: Date;
  }];
  rating?: { score: number; review?: string };
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>({
  orderNumber: { type: String, required: true, unique: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  agencyId: { type: Schema.Types.ObjectId, ref: 'Agency', required: true, index: true },
  serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
  packageId: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'review', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  pricing: {
    basePrice: { type: Number, required: true },
    addons: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    platformFee: { type: Number, required: true },
    total: { type: Number, required: true },
    currency: { type: String, default: 'INR' }
  },
  customerDetails: {
    name: String,
    email: String,
    phone: String,
    notes: String
  },
  milestones: [{
    id: String,
    name: String,
    description: String,
    price: Number,
    status: { type: String, enum: ['pending', 'in_progress', 'submitted', 'approved', 'revision'] },
    dueDate: Date,
    completedAt: Date
  }],
  rating: {
    score: Number,
    review: String
  }
}, { timestamps: true });

orderSchema.index({ agencyId: 1, status: 1 });
orderSchema.index({ customerId: 1, createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);

// ============================================================================
// Filing Model (TaxFlow)
// ============================================================================

export interface IFiling extends Document {
  businessId: mongoose.Types.ObjectId;
  filingType: 'GSTR-1' | 'GSTR-3B' | 'GSTR-9' | 'GSTR-9C' | 'TDS';
  period: string;
  status: 'draft' | 'prepared' | 'filed' | 'accepted' | 'rejected';
  dueDate: Date;
  filedDate?: Date;
  acknowledgmentNumber?: string;
  summary: {
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
  };
  invoices: [{
    id: string;
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
  }];
  filedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const filingSchema = new Schema<IFiling>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  filingType: {
    type: String,
    enum: ['GSTR-1', 'GSTR-3B', 'GSTR-9', 'GSTR-9C', 'TDS'],
    required: true
  },
  period: { type: String, required: true },
  status: {
    type: String,
    enum: ['draft', 'prepared', 'filed', 'accepted', 'rejected'],
    default: 'draft',
    index: true
  },
  dueDate: { type: Date, required: true, index: true },
  filedDate: Date,
  acknowledgmentNumber: String,
  summary: {
    totalTaxableValue: { type: Number, default: 0 },
    totalCgst: { type: Number, default: 0 },
    totalSgst: { type: Number, default: 0 },
    totalIgst: { type: Number, default: 0 },
    totalCess: { type: Number, default: 0 },
    totalLiability: { type: Number, default: 0 },
    itcAvailable: { type: Number, default: 0 },
    itcClaimed: { type: Number, default: 0 },
    cashBalance: { type: Number, default: 0 },
    totalTaxPayable: { type: Number, default: 0 }
  },
  invoices: [{
    id: String,
    invoiceNumber: String,
    invoiceDate: Date,
    customerGstin: String,
    customerName: String,
    invoiceType: String,
    supplyType: String,
    totalTaxableValue: Number,
    rate: Number,
    cgst: Number,
    sgst: Number,
    igst: Number,
    cess: Number,
    totalAmount: Number,
    placeOfSupply: String,
    reverseCharge: Boolean
  }],
  filedBy: String
}, { timestamps: true });

filingSchema.index({ businessId: 1, filingType: 1, period: 1 }, { unique: true });

export const Filing = mongoose.model<IFiling>('Filing', filingSchema);

// ============================================================================
// Invoice Model (InvoiceFlow)
// ============================================================================

export interface IInvoice extends Document {
  invoiceNumber: string;
  businessId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  type: 'tax_invoice' | 'bill_of_supply' | 'export_invoice' | 'credit_note' | 'debit_note';
  status: 'draft' | 'issued' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
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
  items: [{
    id: string;
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
  }];
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
  paymentStatus: 'unpaid' | 'partial' | 'paid';
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
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>({
  invoiceNumber: { type: String, required: true, unique: true },
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['tax_invoice', 'bill_of_supply', 'export_invoice', 'credit_note', 'debit_note'],
    default: 'tax_invoice'
  },
  status: {
    type: String,
    enum: ['draft', 'issued', 'viewed', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
    index: true
  },
  invoiceDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  customer: {
    name: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    gstin: String,
    pan: String,
    email: String,
    phone: String
  },
  items: [{
    id: String,
    description: String,
    hsnCode: String,
    quantity: Number,
    unit: String,
    rate: Number,
    discount: Number,
    taxableAmount: Number,
    taxRate: Number,
    cgst: Number,
    sgst: Number,
    igst: Number,
    cess: Number,
    total: Number
  }],
  subtotal: Number,
  discount: Number,
  taxableValue: Number,
  taxBreakdown: {
    cgst: { rate: Number, amount: Number },
    sgst: { rate: Number, amount: Number },
    igst: { rate: Number, amount: Number },
    cess: { rate: Number, amount: Number }
  },
  totalTax: Number,
  totalAmount: Number,
  amountInWords: String,
  paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
  paidAmount: { type: Number, default: 0 },
  paymentTerms: String,
  paymentMethod: String,
  paidDate: Date,
  eInvoiceNumber: String,
  ackNumber: String,
  ackDate: Date,
  irn: String,
  notes: String,
  terms: String
}, { timestamps: true });

invoiceSchema.index({ businessId: 1, status: 1, invoiceDate: -1 });
invoiceSchema.index({ 'customer.gstin': 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);

// ============================================================================
// Audit Log Model
// ============================================================================

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  service: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  ip?: string;
  userAgent?: string;
  requestBody?: Record<string, unknown>;
  responseBody?: Record<string, unknown>;
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  service: { type: String, required: true, index: true },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: String,
  method: String,
  path: String,
  statusCode: Number,
  duration: Number,
  ip: String,
  userAgent: String,
  requestBody: Schema.Types.Mixed,
  responseBody: Schema.Types.Mixed,
  error: String,
  metadata: Schema.Types.Mixed
}, { timestamps: { createdAt: true, updatedAt: false } });

auditLogSchema.index({ service: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

// ============================================================================
// Export all models
// ============================================================================

export const models = {
  User,
  Business,
  Agency,
  Order,
  Filing,
  Invoice,
  AuditLog
};

export default models;

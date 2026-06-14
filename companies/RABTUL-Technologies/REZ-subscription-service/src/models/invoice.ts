import mongoose, { Schema, Document, Model } from 'mongoose';
import { InvoiceStatus, PaymentStatus, Address, InvoiceLineItem } from '../types';

export interface IInvoice extends Document {
  invoiceId: string;
  subscriptionId: string;
  customerId: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  discountCode?: string;
  total: number;
  amountDue: number;
  amountPaid: number;
  lineItems: InvoiceLineItem[];
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  issuedAt: Date;
  paidAt?: Date;
  voidedAt?: Date;
  voidReason?: string;
  billingAddress?: Address;
  paymentAttempts: {
    id: string;
    amount: number;
    status: PaymentStatus;
    paymentMethodId?: string;
    paymentIntentId?: string;
    errorMessage?: string;
    attemptedAt: Date;
    failureReason?: string;
  }[];
  metadata: Record<string, unknown>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  addPaymentAttempt(attempt: IInvoice['paymentAttempts'][0]): Promise<void>;
  markAsPaid(paymentIntentId: string): Promise<void>;
  markAsFailed(errorMessage: string): Promise<void>;
  void(reason: string): Promise<void>;
  calculateAmountDue(): number;
}

const InvoiceLineItemSchema = new Schema({
  id: { type: String, required: true },
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: 'INR' },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  metadata: { type: Schema.Types.Mixed }
}, { _id: false });

const PaymentAttemptSchema = new Schema({
  id: { type: String, required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: Object.values(PaymentStatus),
    required: true
  },
  paymentMethodId: { type: String },
  paymentIntentId: { type: String },
  errorMessage: { type: String },
  attemptedAt: { type: Date, required: true },
  failureReason: { type: String }
}, { _id: false });

const AddressSchema = new Schema({
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'IN', length: 2 }
}, { _id: false });

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    subscriptionId: {
      type: String,
      required: true,
      index: true
    },
    customerId: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(InvoiceStatus),
      default: InvoiceStatus.DRAFT,
      index: true
    },
    currency: {
      type: String,
      default: 'INR',
      length: 3
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    discountCode: {
      type: String
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    amountDue: {
      type: Number,
      required: true,
      min: 0
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0
    },
    lineItems: {
      type: [InvoiceLineItemSchema],
      required: true,
      validate: [arr => arr.length > 0, 'Invoice must have at least one line item']
    },
    periodStart: {
      type: Date,
      required: true
    },
    periodEnd: {
      type: Date,
      required: true
    },
    dueDate: {
      type: Date,
      required: true,
      index: true
    },
    issuedAt: {
      type: Date,
      required: true
    },
    paidAt: {
      type: Date
    },
    voidedAt: {
      type: Date
    },
    voidReason: {
      type: String
    },
    billingAddress: {
      type: AddressSchema
    },
    paymentAttempts: {
      type: [PaymentAttemptSchema],
      default: []
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    notes: {
      type: String
    }
  },
  {
    timestamps: true,
    collection: 'invoices'
  }
);

// Indexes
InvoiceSchema.index({ customerId: 1, createdAt: -1 });
InvoiceSchema.index({ subscriptionId: 1, createdAt: -1 });
InvoiceSchema.index({ status: 1, dueDate: 1 });
InvoiceSchema.index({ dueDate: 1, status: 1 });

// Virtual for days overdue
InvoiceSchema.virtual('daysOverdue').get(function() {
  if (this.status === InvoiceStatus.PAID) return 0;
  const now = new Date();
  const diff = now.getTime() - this.dueDate.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Method to add payment attempt
InvoiceSchema.methods.addPaymentAttempt = async function(
  attempt: IInvoice['paymentAttempts'][0]
): Promise<void> {
  this.paymentAttempts.push(attempt);
  if (attempt.status === PaymentStatus.SUCCEEDED) {
    this.amountPaid = this.total;
    this.status = InvoiceStatus.PAID;
    this.paidAt = new Date();
  } else if (attempt.status === PaymentStatus.FAILED) {
    this.status = InvoiceStatus.FAILED;
  }
  await this.save();
};

// Method to mark as paid
InvoiceSchema.methods.markAsPaid = async function(paymentIntentId: string): Promise<void> {
  this.amountPaid = this.total;
  this.amountDue = 0;
  this.status = InvoiceStatus.PAID;
  this.paidAt = new Date();
  this.paymentAttempts.push({
    id: `pay_${Date.now()}`,
    amount: this.total,
    status: PaymentStatus.SUCCEEDED,
    paymentIntentId,
    attemptedAt: new Date()
  });
  await this.save();
};

// Method to mark as failed
InvoiceSchema.methods.markAsFailed = async function(errorMessage: string): Promise<void> {
  this.status = InvoiceStatus.FAILED;
  const lastAttempt = this.paymentAttempts[this.paymentAttempts.length - 1];
  if (lastAttempt) {
    lastAttempt.status = PaymentStatus.FAILED;
    lastAttempt.failureReason = errorMessage;
  }
  await this.save();
};

// Method to void invoice
InvoiceSchema.methods.void = async function(reason: string): Promise<void> {
  if (this.status === InvoiceStatus.PAID) {
    throw new Error('Cannot void a paid invoice');
  }
  this.status = InvoiceStatus.VOID;
  this.voidedAt = new Date();
  this.voidReason = reason;
  await this.save();
};

// Method to recalculate amount due
InvoiceSchema.methods.calculateAmountDue = function(): number {
  this.amountDue = this.total - this.amountPaid;
  return this.amountDue;
};

// Static method to find invoices by customer
InvoiceSchema.statics.findByCustomer = function(customerId: string, limit = 50) {
  return this.find({ customerId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to find outstanding invoices
InvoiceSchema.statics.findOutstanding = function() {
  return this.find({
    status: { $in: [InvoiceStatus.PENDING, InvoiceStatus.FAILED] },
    dueDate: { $lt: new Date() }
  }).sort({ dueDate: 1 });
};

// Static method to generate invoice number
InvoiceSchema.statics.generateInvoiceNumber = async function(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  const count = await this.countDocuments({
    createdAt: {
      $gte: new Date(`${year}-${month}-01`),
      $lt: new Date(`${year}-${month + 1}-01`)
    }
  });

  return `INV-${year}${month}-${String(count + 1).padStart(6, '0')}`;
};

export const Invoice: Model<IInvoice> = mongoose.model<IInvoice>('Invoice', InvoiceSchema);

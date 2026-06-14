import mongoose, { Schema, Document } from 'mongoose';

// ── Types & Interfaces ────────────────────────────────────────────────────────

export type QuoteStatus = 'submitted' | 'revised' | 'accepted' | 'rejected' | 'withdrawn';

export interface IQuoteItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  discount?: number; // percentage 0-100
  tax?: number; // percentage 0-100
  total: number;
  notes?: string;
}

export interface IRevisionHistory {
  revisedAt: Date;
  items: IQuoteItem[];
  totalAmount: number;
  reason?: string;
}

export interface IQuote extends Document {
  quoteNumber: string;
  rfqId: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  status: QuoteStatus;
  items: IQuoteItem[];
  subtotal: number;
  discount: number; // discount amount
  taxAmount: number;
  totalAmount: number;
  validUntil?: Date;
  deliveryDays: number;
  paymentTerms?: string;
  notes?: string;
  revisionHistory: IRevisionHistory[];
  submittedAt: Date;
  withdrawnAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema Definition ─────────────────────────────────────────────────────────

const quoteItemSchema = new Schema<IQuoteItem>(
  {
    itemName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    tax: { type: Number, default: 0, min: 0, max: 100 },
    total: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true },
  },
  { _id: false },
);

const revisionHistorySchema = new Schema<IRevisionHistory>(
  {
    revisedAt: { type: Date, required: true, default: Date.now },
    items: { type: [quoteItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    reason: { type: String, trim: true },
  },
  { _id: false },
);

const quoteSchema = new Schema<IQuote>(
  {
    quoteNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    rfqId: {
      type: Schema.Types.ObjectId,
      ref: 'RFQ',
      required: true,
      index: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['submitted', 'revised', 'accepted', 'rejected', 'withdrawn'],
      default: 'submitted',
      index: true,
    },
    items: {
      type: [quoteItemSchema],
      required: true,
      validate: {
        validator: (v: IQuoteItem[]) => Array.isArray(v) && v.length > 0,
        message: 'At least one quote item is required',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    validUntil: {
      type: Date,
      index: true,
    },
    deliveryDays: {
      type: Number,
      required: true,
      min: 1,
    },
    paymentTerms: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    revisionHistory: {
      type: [revisionHistorySchema],
      default: [],
    },
    submittedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    withdrawnAt: {
      type: Date,
    },
  },
  {
    strict: true,
    strictQuery: true,
    timestamps: true,
    collection: 'quotes',
  },
);

// ── Compound Indexes ──────────────────────────────────────────────────────────

quoteSchema.index({ rfqId: 1, supplierId: 1 }, { unique: true }); // One quote per supplier per RFQ
quoteSchema.index({ merchantId: 1, status: 1, createdAt: -1 });
quoteSchema.index({ supplierId: 1, status: 1, createdAt: -1 });
quoteSchema.index({ totalAmount: 1 }); // For best quote comparisons

// ── Pre-save Hook: Generate Quote Number ─────────────────────────────────────

quoteSchema.pre('save', async function (this: IQuote, next) {
  if (this.isNew && !this.quoteNumber) {
    this.quoteNumber = await generateQuoteNumber();
  }
  next();
});

// ── Static: Generate Next Quote Number ────────────────────────────────────────

async function generateQuoteNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const prefix = `QT-${dateStr}-`;

  // Find the highest quote number for today
  const lastQuote = await mongoose.models.Quote
    .findOne({ quoteNumber: { $regex: `^${prefix}` } })
    .sort({ quoteNumber: -1 })
    .lean()
    .exec();

  let nextSeq = 1;
  if (lastQuote) {
    const lastSeq = parseInt(lastQuote.quoteNumber.slice(prefix.length), 10);
    nextSeq = lastSeq + 1;
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

// ── Static: Calculate Quote Totals ───────────────────────────────────────────

/**
 * Calculate quote item totals and overall totals
 */
quoteSchema.statics.calculateTotals = function (
  items: Omit<IQuoteItem, 'total'>[],
): { items: IQuoteItem[]; subtotal: number; discount: number; taxAmount: number; totalAmount: number } {
  let subtotal = 0;
  const calculatedItems: IQuoteItem[] = items.map((item) => {
    const itemTotal = item.quantity * item.unitPrice;
    const discountAmount = (itemTotal * (item.discount || 0)) / 100;
    const afterDiscount = itemTotal - discountAmount;
    const taxAmount = (afterDiscount * (item.tax || 0)) / 100;
    const total = afterDiscount + taxAmount;

    subtotal += itemTotal;

    return {
      ...item,
      total: Math.round(total * 100) / 100, // Round to 2 decimal places
    };
  });

  const totalDiscount = items.reduce((sum, item) => {
    return sum + ((item.quantity * item.unitPrice) * (item.discount || 0)) / 100;
  }, 0);

  const totalTax = calculatedItems.reduce((sum, item) => {
    const afterDiscount = (item.quantity * item.unitPrice) * (1 - (item.discount || 0) / 100);
    return sum + (afterDiscount * (item.tax || 0)) / 100;
  }, 0);

  return {
    items: calculatedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(totalDiscount * 100) / 100,
    taxAmount: Math.round(totalTax * 100) / 100,
    totalAmount: Math.round((subtotal - totalDiscount + totalTax) * 100) / 100,
  };
};

// ── Instance Methods ───────────────────────────────────────────────────────────

/**
 * Check if quote can be revised (only submitted status)
 */
quoteSchema.methods.canRevise = function (this: IQuote): boolean {
  return this.status === 'submitted';
};

/**
 * Check if quote can be withdrawn (only submitted or revised status)
 */
quoteSchema.methods.canWithdraw = function (this: IQuote): boolean {
  return ['submitted', 'revised'].includes(this.status);
};

/**
 * Check if quote can be accepted (only submitted or revised status)
 */
quoteSchema.methods.canAccept = function (this: IQuote): boolean {
  return ['submitted', 'revised'].includes(this.status);
};

/**
 * Check if quote can be rejected (only submitted or revised status)
 */
quoteSchema.methods.canReject = function (this: IQuote): boolean {
  return ['submitted', 'revised'].includes(this.status);
};

/**
 * Check if quote is expired (validUntil has passed)
 */
quoteSchema.methods.isExpired = function (this: IQuote): boolean {
  if (!this.validUntil) return false;
  return new Date() > this.validUntil;
};

/**
 * Revise the quote with new items
 */
quoteSchema.methods.revise = async function (
  this: IQuote,
  newItems: Omit<IQuoteItem, 'total'>[],
  reason?: string,
): Promise<IQuote> {
  if (!this.canRevise()) {
    throw new Error('Quote cannot be revised in current status');
  }

  // Save current state to revision history
  this.revisionHistory.push({
    revisedAt: new Date(),
    items: this.items.map((item) => ({ ...item.toObject() })),
    totalAmount: this.totalAmount,
    reason,
  });

  // Calculate new totals
  const { items, subtotal, discount, taxAmount, totalAmount } = (this.constructor as typeof Quote).calculateTotals(newItems);

  this.items = items;
  this.subtotal = subtotal;
  this.discount = discount;
  this.taxAmount = taxAmount;
  this.totalAmount = totalAmount;
  this.status = 'revised';

  await this.save();
  return this;
};

/**
 * Withdraw the quote
 */
quoteSchema.methods.withdraw = async function (this: IQuote): Promise<IQuote> {
  if (!this.canWithdraw()) {
    throw new Error('Quote cannot be withdrawn in current status');
  }

  this.status = 'withdrawn';
  this.withdrawnAt = new Date();

  await this.save();
  return this;
};

// ── Virtuals ─────────────────────────────────────────────────────────────────

quoteSchema.virtual('isExpired').get(function (this: IQuote) {
  return this.isExpired();
});

quoteSchema.virtual('isValid').get(function (this: IQuote) {
  if (this.status !== 'submitted' && this.status !== 'revised') return false;
  return !this.isExpired();
});

// Ensure virtuals are included in JSON output
quoteSchema.set('toJSON', { virtuals: true });
quoteSchema.set('toObject', { virtuals: true });

// ── Export ────────────────────────────────────────────────────────────────────

export const Quote = (mongoose.models.Quote as mongoose.Model<IQuote>) ||
  mongoose.model<IQuote>('Quote', quoteSchema);

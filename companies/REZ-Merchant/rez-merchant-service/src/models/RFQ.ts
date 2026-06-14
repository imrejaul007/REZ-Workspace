import mongoose, { Schema, Document } from 'mongoose';

// ── Types & Interfaces ────────────────────────────────────────────────────────

export type RFQStatus = 'draft' | 'open' | 'closed' | 'awarded' | 'cancelled';

export type RFQCategory = 'raw_materials' | 'equipment' | 'services' | 'packaging' | 'logistics' | 'other';

export interface IRFQItem {
  itemName: string;
  description?: string;
  quantity: number;
  unit: string;
  specifications?: Record<string, unknown>;
}

export interface IRFQ extends Document {
  rfqNumber: string;
  merchantId: mongoose.Types.ObjectId;
  storeId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  category: RFQCategory;
  status: RFQStatus;
  items: IRFQItem[];
  requiredByDate?: Date;
  invitedSuppliers: mongoose.Types.ObjectId[];
  isPublic: boolean;
  quotesReceived: number;
  awardedSupplierId?: mongoose.Types.ObjectId;
  awardedQuoteId?: mongoose.Types.ObjectId;
  notes?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema Definition ─────────────────────────────────────────────────────────

const rfqItemSchema = new Schema<IRFQItem>(
  {
    itemName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    specifications: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

const rfqSchema = new Schema<IRFQ>(
  {
    rfqNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      enum: ['raw_materials', 'equipment', 'services', 'packaging', 'logistics', 'other'],
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['draft', 'open', 'closed', 'awarded', 'cancelled'],
      default: 'draft',
      index: true,
    },
    items: {
      type: [rfqItemSchema],
      required: true,
      validate: {
        validator: (v: IRFQItem[]) => Array.isArray(v) && v.length > 0,
        message: 'At least one RFQ item is required',
      },
    },
    requiredByDate: {
      type: Date,
      index: true,
    },
    invitedSuppliers: [{
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
    }],
    isPublic: {
      type: Boolean,
      default: false,
    },
    quotesReceived: {
      type: Number,
      default: 0,
      min: 0,
    },
    awardedSupplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    awardedQuoteId: {
      type: Schema.Types.ObjectId,
      ref: 'Quote',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    strict: true,
    strictQuery: true,
    timestamps: true,
    collection: 'rfqs',
  },
);

// ── Compound Indexes ──────────────────────────────────────────────────────────

rfqSchema.index({ merchantId: 1, status: 1, createdAt: -1 });
rfqSchema.index({ merchantId: 1, category: 1, createdAt: -1 });
rfqSchema.index({ merchantId: 1, requiredByDate: 1 });
rfqSchema.index({ isPublic: 1, status: 1 }); // For supplier browsing
rfqSchema.index({ deletedAt: 1 }); // For soft delete queries

// ── Pre-save Hook: Generate RFQ Number ────────────────────────────────────────

rfqSchema.pre('save', async function (this: IRFQ, next) {
  if (this.isNew && !this.rfqNumber) {
    this.rfqNumber = await generateRFQNumber();
  }
  next();
});

// ── Static: Generate Next RFQ Number ─────────────────────────────────────────

async function generateRFQNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const prefix = `RFQ-${dateStr}-`;

  // Find the highest RFQ number for today
  const lastRFQ = await mongoose.models.RFQ
    .findOne({ rfqNumber: { $regex: `^${prefix}` } })
    .sort({ rfqNumber: -1 })
    .lean()
    .exec();

  let nextSeq = 1;
  if (lastRFQ) {
    const lastSeq = parseInt(lastRFQ.rfqNumber.slice(prefix.length), 10);
    nextSeq = lastSeq + 1;
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

// ── Instance Methods ───────────────────────────────────────────────────────────

/**
 * Soft delete the RFQ
 */
rfqSchema.methods.softDelete = async function (this: IRFQ): Promise<void> {
  this.deletedAt = new Date();
  await this.save();
};

/**
 * Check if RFQ can be edited (only draft status)
 */
rfqSchema.methods.canEdit = function (this: IRFQ): boolean {
  return this.status === 'draft';
};

/**
 * Check if RFQ can be opened (only draft status)
 */
rfqSchema.methods.canOpen = function (this: IRFQ): boolean {
  return this.status === 'draft' && this.items.length > 0;
};

/**
 * Check if RFQ can be closed (only open status)
 */
rfqSchema.methods.canClose = function (this: IRFQ): boolean {
  return this.status === 'open';
};

/**
 * Check if RFQ can be cancelled (not already awarded)
 */
rfqSchema.methods.canCancel = function (this: IRFQ): boolean {
  return !['awarded', 'cancelled'].includes(this.status);
};

/**
 * Check if supplier is invited
 */
rfqSchema.methods.isSupplierInvited = function (
  this: IRFQ,
  supplierId: mongoose.Types.ObjectId,
): boolean {
  return this.invitedSuppliers.some((id) => id.equals(supplierId));
};

/**
 * Check if supplier can submit quote
 */
rfqSchema.methods.canSupplierQuote = function (
  this: IRFQ,
  supplierId?: mongoose.Types.ObjectId,
): boolean {
  if (this.status !== 'open') return false;
  if (!this.isPublic && (!supplierId || !this.isSupplierInvited(supplierId))) {
    return false;
  }
  return true;
};

// ── Virtuals ─────────────────────────────────────────────────────────────────

rfqSchema.virtual('isExpired').get(function (this: IRFQ) {
  if (!this.requiredByDate) return false;
  return new Date() > this.requiredByDate;
});

rfqSchema.virtual('isDeleted').get(function (this: IRFQ) {
  return !!this.deletedAt;
});

// Ensure virtuals are included in JSON output
rfqSchema.set('toJSON', { virtuals: true });
rfqSchema.set('toObject', { virtuals: true });

// ── Export ────────────────────────────────────────────────────────────────────

export const RFQ = (mongoose.models.RFQ as mongoose.Model<IRFQ>) ||
  mongoose.model<IRFQ>('RFQ', rfqSchema);

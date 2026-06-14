/**
 * Purchase Order Model
 *
 * Enhanced model for B2B merchant purchase order management with:
 * - Auto-generated PO numbers (PO-YYYYMMDD-XXXX)
 * - Multi-store support
 * - Approval workflow with history tracking
 * - Goods receipt tracking
 * - Payment tracking
 * - Credit limit checks
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { POStatus, POPaymentStatus } from '../config/purchaseOrderTransitions';

// ── Subdocument Schemas ──────────────────────────────────────────────────────

/**
 * Purchase Order Line Item
 */
export interface IPOItem {
  productName: string;
  sku: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount: number; // Discount amount per item
  taxRate: number; // Tax percentage (e.g., 18 for 18%)
  taxAmount: number;
  total: number; // (quantity * unitPrice - discount + taxAmount)
  receivedQty: number; // Quantity received so far
  pendingQty: number; // Quantity pending (quantity - receivedQty)
}

const POItemSchema = new Schema<IPOItem>(
  {
    productName: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    description: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    taxAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    receivedQty: { type: Number, default: 0, min: 0 },
    pendingQty: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

/**
 * Approval History Entry
 */
export interface IPOApprovalHistory {
  approvedBy: Types.ObjectId;
  approvedByEmail?: string;
  approvedAt: Date;
  status: POStatus;
  comments?: string;
  previousStatus?: POStatus;
}

const POApprovalHistorySchema = new Schema<IPOApprovalHistory>(
  {
    approvedBy: { type: Schema.Types.ObjectId, ref: 'MerchantUser', required: true },
    approvedByEmail: { type: String },
    approvedAt: { type: Date, default: Date.now },
    status: { type: String, enum: Object.values(POStatus), required: true },
    comments: { type: String },
    previousStatus: { type: String, enum: Object.values(POStatus) },
  },
  { _id: false },
);

/**
 * Payment Record Entry
 */
export interface IPOPaymentRecord {
  paymentId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'bank_transfer' | 'cash' | 'upi' | 'cheque' | 'card' | 'other';
  reference?: string;
  notes?: string;
  recordedBy: Types.ObjectId;
  recordedAt: Date;
}

const POPaymentRecordSchema = new Schema<IPOPaymentRecord>(
  {
    paymentId: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'cash', 'upi', 'cheque', 'card', 'other'],
      required: true,
    },
    reference: { type: String },
    notes: { type: String },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'MerchantUser', required: true },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

/**
 * Attachment (documents, images)
 */
export interface IPOAttachment {
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  uploadedBy?: Types.ObjectId;
}

const POAttachmentSchema = new Schema<IPOAttachment>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'MerchantUser' },
  },
  { _id: false },
);

/**
 * Goods Receipt Entry (tracking received items)
 */
export interface IPOGoodsReceipt {
  receiptId: string;
  receivedAt: Date;
  items: Array<{
    sku: string;
    productName: string;
    receivedQty: number;
    condition: 'good' | 'damaged' | 'partial';
    notes?: string;
  }>;
  receivedBy: Types.ObjectId;
  notes?: string;
}

const POGoodsReceiptSchema = new Schema<IPOGoodsReceipt>(
  {
    receiptId: { type: String, required: true },
    receivedAt: { type: Date, default: Date.now },
    items: [
      {
        sku: { type: String, required: true },
        productName: { type: String, required: true },
        receivedQty: { type: Number, required: true, min: 0 },
        condition: { type: String, enum: ['good', 'damaged', 'partial'], default: 'good' },
        notes: { type: String },
        _id: false,
      },
    ],
    receivedBy: { type: Schema.Types.ObjectId, ref: 'MerchantUser', required: true },
    notes: { type: String },
  },
  { _id: false },
);

// ── Main Purchase Order Schema ──────────────────────────────────────────────

export interface IPurchaseOrder extends Document {
  // Identification
  poNumber: string; // Auto-generated: PO-YYYYMMDD-XXXX
  merchantId: Types.ObjectId;
  storeId?: Types.ObjectId; // Optional: for multi-store merchants

  // Relationships
  supplierId: Types.ObjectId;
  supplierName?: string; // Denormalized for quick access

  // Status
  status: POStatus;
  paymentStatus: POPaymentStatus;

  // Line Items
  items: IPOItem[];

  // Financials
  currency: string; // Default: 'INR'
  subtotal: number; // Sum of (quantity * unitPrice - discount) before tax
  totalDiscount: number; // Total discount amount
  taxAmount: number; // Total tax
  totalAmount: number; // Final amount after tax

  // Dates
  orderDate: Date;
  expectedDeliveryDate?: Date;
  dueDate?: Date; // Calculated from supplier.creditPeriodDays
  actualDeliveryDate?: Date;

  // Payments
  paidAmount: number;
  paymentRecords: IPOPaymentRecord[];

  // Approval Workflow
  approvalHistory: IPOApprovalHistory[];
  requiredApproverRole?: string;

  // Goods Receipt
  goodsReceipts: IPOGoodsReceipt[];

  // Attachments
  attachments: IPOAttachment[];

  // Additional Info
  notes?: string;
  internalNotes?: string; // Only visible to internal staff
  shippingAddress?: {
    address: string;
    city: string;
    state?: string;
    pincode?: string;
    country?: string;
  };

  // Soft Delete
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;

  // Metadata
  metadata?: Record<string, unknown>;
  source?: 'manual' | 'reorder' | 'import' | 'api';
  referenceNumber?: string; // External reference number

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    // Identification
    poNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
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

    // Relationships
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    supplierName: { type: String },

    // Status
    status: {
      type: String,
      enum: Object.values(POStatus),
      default: POStatus.DRAFT,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(POPaymentStatus),
      default: POPaymentStatus.UNPAID,
      index: true,
    },

    // Line Items
    items: [POItemSchema],

    // Financials
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDiscount: {
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
      default: 0,
      min: 0,
    },

    // Dates
    orderDate: {
      type: Date,
      default: Date.now,
    },
    expectedDeliveryDate: Date,
    dueDate: {
      type: Date,
      index: true,
    },
    actualDeliveryDate: Date,

    // Payments
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentRecords: [POPaymentRecordSchema],

    // Approval Workflow
    approvalHistory: [POApprovalHistorySchema],
    requiredApproverRole: String,

    // Goods Receipt
    goodsReceipts: [POGoodsReceiptSchema],

    // Attachments
    attachments: [POAttachmentSchema],

    // Additional Info
    notes: String,
    internalNotes: String,
    shippingAddress: {
      address: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      country: { type: String, default: 'India' },
    },

    // Soft Delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: Date,
    deletedBy: { type: Schema.Types.ObjectId, ref: 'MerchantUser' },

    // Metadata
    metadata: Schema.Types.Mixed,
    source: {
      type: String,
      enum: ['manual', 'reorder', 'import', 'api'],
      default: 'manual',
    },
    referenceNumber: String,
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    collection: 'purchaseorders',
  },
);

// ── Indexes ─────────────────────────────────────────────────────────────────

// Compound index for common queries
PurchaseOrderSchema.index({ merchantId: 1, status: 1, createdAt: -1 });
PurchaseOrderSchema.index({ merchantId: 1, supplierId: 1, status: 1 });
PurchaseOrderSchema.index({ merchantId: 1, storeId: 1, status: 1 });

// Due date index for overdue PO queries
PurchaseOrderSchema.index({ merchantId: 1, dueDate: 1, paymentStatus: 1, isDeleted: 1 });

// PO number unique index (handled by unique: true, but explicit for clarity)
PurchaseOrderSchema.index({ poNumber: 1 }, { unique: true });

// Soft delete filter
PurchaseOrderSchema.index({ isDeleted: 1, merchantId: 1 });

// ── Pre-save Hooks ────────────────────────────────────────────────────────────

/**
 * Calculate pending quantities for items before saving
 */
PurchaseOrderSchema.pre('save', function (this: IPurchaseOrder, next) {
  if (this.isModified('items')) {
    this.items = this.items.map((item) => ({
      ...item,
      pendingQty: Math.max(0, item.quantity - item.receivedQty),
      total:
        item.quantity * item.unitPrice -
        item.discount +
        (item.quantity * item.unitPrice - item.discount) * (item.taxRate / 100),
    }));

    // Recalculate totals
    this.subtotal = this.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice - item.discount,
      0
    );
    this.totalDiscount = this.items.reduce((sum, item) => sum + item.discount, 0);
    this.taxAmount = this.items.reduce((sum, item) => sum + item.taxAmount, 0);
    this.totalAmount = this.subtotal + this.taxAmount;
  }
  next();
});

/**
 * Soft delete handler
 */
PurchaseOrderSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as Record<string, unknown>;
  if (update?.isDeleted === true && !update.deletedAt) {
    update.deletedAt = new Date();
  }
  next();
});

// ── Instance Methods ──────────────────────────────────────────────────────────

/**
 * Get remaining balance to be paid
 */
PurchaseOrderSchema.methods.getOutstandingAmount = function (): number {
  return Math.max(0, this.totalAmount - this.paidAmount);
};

/**
 * Get total received quantity for an item by SKU
 */
PurchaseOrderSchema.methods.getReceivedQtyBySKU = function (sku: string): number {
  const item = this.items.find((i) => i.sku === sku);
  return item?.receivedQty || 0;
};

/**
 * Check if PO is overdue
 */
PurchaseOrderSchema.methods.isOverdue = function (): boolean {
  if (!this.dueDate) return false;
  if (this.paymentStatus === POPaymentStatus.PAID) return false;
  return new Date() > this.dueDate;
};

/**
 * Get fill rate (percentage of items received)
 */
PurchaseOrderSchema.methods.getFillRate = function (): number {
  const totalQty = this.items.reduce((sum, item) => sum + item.quantity, 0);
  const receivedQty = this.items.reduce((sum, item) => sum + item.receivedQty, 0);
  if (totalQty === 0) return 100;
  return Math.round((receivedQty / totalQty) * 100 * 100) / 100;
};

// ── Static Methods ────────────────────────────────────────────────────────────

/**
 * Find all overdue POs for a merchant
 */
PurchaseOrderSchema.statics.findOverdue = async function (
  merchantId: Types.ObjectId
): Promise<IPurchaseOrder[]> {
  return this.find({
    merchantId,
    isDeleted: false,
    paymentStatus: { $ne: POPaymentStatus.PAID },
    dueDate: { $lt: new Date() },
  }).lean();
};

/**
 * Get POs by supplier with aging analysis
 */
PurchaseOrderSchema.statics.getSupplierAging = async function (
  merchantId: Types.ObjectId,
  supplierId?: Types.ObjectId
): Promise<
  Array<{
    supplierId: Types.ObjectId;
    totalOutstanding: number;
    current: number;
    days30: number;
    days60: number;
    days90: number;
    over90: number;
  }>
> {
  const matchStage: Record<string, unknown> = {
    merchantId,
    isDeleted: false,
    paymentStatus: { $ne: POPaymentStatus.PAID },
  };
  if (supplierId) {
    matchStage.supplierId = supplierId;
  }

  const now = new Date();
  const result = await this.aggregate([
    { $match: matchStage },
    {
      $addFields: {
        outstanding: { $subtract: ['$totalAmount', { $ifNull: ['$paidAmount', 0] }] },
        daysPastDue: {
          $divide: [{ $subtract: [now, { $ifNull: ['$dueDate', '$createdAt'] }] }, 86400000],
        },
      },
    },
    {
      $group: {
        _id: '$supplierId',
        totalOutstanding: { $sum: '$outstanding' },
        current: {
          $sum: { $cond: [{ $lte: ['$daysPastDue', 0] }, '$outstanding', 0] },
        },
        days30: {
          $sum: {
            $cond: [
              { $and: [{ $gt: ['$daysPastDue', 0] }, { $lte: ['$daysPastDue', 30] }] },
              '$outstanding',
              0,
            ],
          },
        },
        days60: {
          $sum: {
            $cond: [
              { $and: [{ $gt: ['$daysPastDue', 30] }, { $lte: ['$daysPastDue', 60] }] },
              '$outstanding',
              0,
            ],
          },
        },
        days90: {
          $sum: {
            $cond: [
              { $and: [{ $gt: ['$daysPastDue', 60] }, { $lte: ['$daysPastDue', 90] }] },
              '$outstanding',
              0,
            ],
          },
        },
        over90: {
          $sum: { $cond: [{ $gt: ['$daysPastDue', 90] }, '$outstanding', 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        supplierId: '$_id',
        totalOutstanding: 1,
        current: 1,
        days30: 1,
        days60: 1,
        days90: 1,
        over90: 1,
      },
    },
  ]);

  return result;
};

// ── Model Export ─────────────────────────────────────────────────────────────

export const PurchaseOrder =
  mongoose.models.PurchaseOrder || mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);

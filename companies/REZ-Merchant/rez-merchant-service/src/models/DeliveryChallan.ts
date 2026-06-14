/**
 * Delivery Challan Model
 *
 * Represents an outbound delivery challan (dispatch note) sent to suppliers/customers.
 * Tracks items dispatched, transportation details, and acknowledgment.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

// ── Enums ────────────────────────────────────────────────────────────────────

export type ChallanStatus = 'draft' | 'issued' | 'in_transit' | 'delivered' | 'acknowledged' | 'cancelled';
export type TransportMode = 'road' | 'rail' | 'air' | 'ship' | 'courier' | 'own_vehicle';

// ── Subdocument Schemas ────────────────────────────────────────────────────────

export interface IChallanItem {
  itemName: string;
  sku: string;
  description?: string;
  quantity: number;
  unit: string;
  rate: number;
  discount?: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  // For GRN matching
  poId?: Types.ObjectId;
  poItemIndex?: number;
  dispatchedQty: number;
}

const ChallanItemSchema = new Schema<IChallanItem>(
  {
    itemName: { type: String, required: true },
    sku: { type: String, required: true },
    description: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, required: true, default: 'pcs' },
    rate: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    poId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
    poItemIndex: { type: Number },
    dispatchedQty: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

// ── Main Document Interface ─────────────────────────────────────────────────────

export interface IDeliveryChallan extends Document {
  // Identification
  challanNumber: string; // Format: DC-YYYYMMDD-XXXX

  // Relationships
  merchantId: Types.ObjectId;
  storeId?: Types.ObjectId;

  // Reference PO
  purchaseOrderId?: Types.ObjectId;
  supplierId?: Types.ObjectId;
  supplierName?: string;

  // Customer (for sales challans)
  customerId?: Types.ObjectId;
  customerName?: string;
  customerAddress?: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  };

  // Status
  status: ChallanStatus;

  // Items
  items: IChallanItem[];
  totalQuantity: number;
  subtotal: number;
  totalDiscount: number;
  taxAmount: number;
  totalAmount: number;

  // Dates
  challanDate: Date;
  issueDate?: Date;
  dispatchDate?: Date;
  deliveryDate?: Date;
  expectedDeliveryDate?: Date;

  // Transportation
  transportMode?: TransportMode;
  transportName?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  lrNumber?: string;
  trackingUrl?: string;

  // Shipping Address
  shippingAddress: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    phone?: string;
  };

  // Acknowledgment
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  receiverName?: string;
  receiverSignature?: string;

  // Attachments
  attachments: Array<{
    filename: string;
    url: string;
    type: 'invoice' | 'lr' | 'other';
  }>;

  // Notes
  notes?: string;
  internalNotes?: string;

  // Source
  source: 'manual' | 'po' | 'return' | 'import';
  sourceReference?: string;

  // Metadata
  metadata?: Record<string, unknown>;

  // Soft delete
  isDeleted: boolean;
  deletedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const DeliveryChallanSchema = new Schema<IDeliveryChallan>(
  {
    challanNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    purchaseOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      index: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      index: true,
    },
    supplierName: { type: String },
    customerId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    customerName: { type: String },
    customerAddress: {
      name: String,
      street: String,
      city: String,
      state: String,
      pincode: String,
      phone: String,
    },
    status: {
      type: String,
      enum: Object.values(ChallanStatus),
      default: 'draft',
      index: true,
    },
    items: [ChallanItemSchema],
    totalQuantity: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    challanDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    issueDate: Date,
    dispatchDate: Date,
    deliveryDate: Date,
    expectedDeliveryDate: Date,
    transportMode: {
      type: String,
      enum: Object.values(TransportMode),
    },
    transportName: String,
    vehicleNumber: String,
    driverName: String,
    driverPhone: String,
    lrNumber: String,
    trackingUrl: String,
    shippingAddress: {
      name: String,
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
      phone: String,
    },
    acknowledgedAt: Date,
    acknowledgedBy: String,
    receiverName: String,
    receiverSignature: String,
    attachments: [
      {
        filename: String,
        url: String,
        type: { type: String, enum: ['invoice', 'lr', 'other'] },
        _id: false,
      },
    ],
    notes: String,
    internalNotes: String,
    source: {
      type: String,
      enum: ['manual', 'po', 'return', 'import'],
      default: 'manual',
    },
    sourceReference: String,
    metadata: Schema.Types.Mixed,
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
  },
  {
    timestamps: true,
    collection: 'delivery_challans',
  },
);

// ── Indexes ──────────────────────────────────────────────────────────────────

DeliveryChallanSchema.index({ merchantId: 1, status: 1 });
DeliveryChallanSchema.index({ merchantId: 1, challanDate: -1 });
DeliveryChallanSchema.index({ merchantId: 1, supplierId: 1, status: 1 });

// ── Pre-save Hook ─────────────────────────────────────────────────────────────

DeliveryChallanSchema.pre('save', function (next) {
  // Auto-calculate totals
  let subtotal = 0;
  let totalDiscount = 0;
  let taxAmount = 0;
  let totalQuantity = 0;

  for (const item of this.items) {
    const itemTotal = item.quantity * item.rate - (item.discount || 0);
    const tax = itemTotal * ((item.taxRate || 0) / 100);
    item.total = itemTotal + tax;
    item.taxAmount = tax;

    subtotal += item.quantity * item.rate;
    totalDiscount += item.discount || 0;
    taxAmount += tax;
    totalQuantity += item.quantity;
  }

  this.subtotal = subtotal;
  this.totalDiscount = totalDiscount;
  this.taxAmount = taxAmount;
  this.totalAmount = subtotal - totalDiscount + taxAmount;
  this.totalQuantity = totalQuantity;

  next();
});

// ── Methods ────────────────────────────────────────────────────────────────────

DeliveryChallanSchema.methods.issue = function () {
  if (this.status !== 'draft') {
    throw new Error('Only draft challans can be issued');
  }
  this.status = 'issued';
  this.issueDate = new Date();
  return this.save();
};

DeliveryChallanSchema.methods.dispatch = function (dispatchDetails: {
  transportMode: TransportMode;
  transportName?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  lrNumber?: string;
}) {
  if (this.status !== 'issued') {
    throw new Error('Only issued challans can be dispatched');
  }
  this.status = 'in_transit';
  this.dispatchDate = new Date();
  Object.assign(this, dispatchDetails);
  return this.save();
};

DeliveryChallanSchema.methods.acknowledge = function (receiverName: string) {
  if (!['in_transit', 'delivered'].includes(this.status)) {
    throw new Error('Challan must be in transit or delivered to acknowledge');
  }
  this.status = 'acknowledged';
  this.deliveryDate = new Date();
  this.acknowledgedAt = new Date();
  this.receiverName = receiverName;
  return this.save();
};

// ── Statics ───────────────────────────────────────────────────────────────────

DeliveryChallanSchema.statics.generateChallanNumber = async function (merchantId: string): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `DC-${dateStr}-`;

  // Find the highest counter for today
  const lastChallan = await this.findOne({
    challanNumber: { $regex: `^${prefix}` },
    merchantId: new mongoose.Types.ObjectId(merchantId),
  }).sort({ challanNumber: -1 });

  let counter = 1;
  if (lastChallan) {
    const lastNum = parseInt(lastChallan.challanNumber.split('-').pop() || '0', 10);
    counter = lastNum + 1;
  }

  return `${prefix}${counter.toString().padStart(4, '0')}`;
};

// ── Export ─────────────────────────────────────────────────────────────────────

export const DeliveryChallan = mongoose.model<IDeliveryChallan>('DeliveryChallan', DeliveryChallanSchema);

import mongoose, { Schema, Document } from 'mongoose';

export enum BillStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum SplitType {
  BY_ITEM = 'BY_ITEM',
  BY_PERSON = 'BY_PERSON',
  EQUAL = 'EQUAL',
}

export interface IOrderItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  notes?: string;
}

export interface IBillItem extends IOrderItem {
  assignedTo?: string[];
  isShared: boolean;
}

export interface ISplitShare {
  personId: string;
  personName: string;
  items: string[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
}

export interface IBill extends Document {
  billId: string;
  orderId?: string;
  restaurantId: string;
  tableId?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;

  items: IBillItem[];
  subtotal: number;
  totalTaxAmount: number;
  totalDiscount: number;
  tipAmount: number;
  grandTotal: number;

  splitType?: SplitType;
  splitShares?: ISplitShare[];

  offersApplied: {
    offerId: string;
    offerName: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    discountAmount: number;
  }[];

  status: BillStatus;

  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    itemId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    notes: { type: String },
  },
  { _id: false }
);

const SplitShareSchema = new Schema<ISplitShare>(
  {
    personId: { type: String, required: true },
    personName: { type: String, required: true },
    items: [{ type: String }],
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const BillSchema = new Schema<IBill>(
  {
    billId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, index: true },
    restaurantId: { type: String, required: true, index: true },
    tableId: { type: String, index: true },
    customerId: { type: String, index: true },
    customerName: { type: String },
    customerPhone: { type: String },

    items: [OrderItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    totalTaxAmount: { type: Number, required: true, default: 0 },
    totalDiscount: { type: Number, required: true, default: 0 },
    tipAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },

    splitType: { type: String, enum: Object.values(SplitType) },
    splitShares: [SplitShareSchema],

    offersApplied: [
      {
        offerId: { type: String, required: true },
        offerName: { type: String, required: true },
        discountType: { type: String, enum: ['PERCENTAGE', 'FIXED'], required: true },
        discountValue: { type: Number, required: true },
        discountAmount: { type: Number, required: true },
      },
    ],

    status: {
      type: String,
      enum: Object.values(BillStatus),
      default: BillStatus.DRAFT,
      index: true,
    },

    createdBy: { type: String, required: true },
    closedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'bills',
  }
);

BillSchema.index({ restaurantId: 1, createdAt: -1 });
BillSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });

export const Bill = mongoose.model<IBill>('Bill', BillSchema);

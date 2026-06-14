import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

/**
 * Transaction Types
 */
export enum TransactionType {
  CHARGE = 'CHARGE',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  ADJUSTMENT = 'ADJUSTMENT',
  TAX = 'TAX',
  DISCOUNT = 'DISCOUNT',
}

/**
 * Transaction Status
 */
export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

/**
 * Payment Methods for POS
 */
export enum POSPaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  ROOM_CHARGE = 'ROOM_CHARGE',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  CORPORATE_ACCOUNT = 'CORPORATE_ACCOUNT',
  LOYALTY_POINTS = 'LOYALTY_POINTS',
}

/**
 * Transaction - Represents a single transaction in the POS system
 * Can be a charge (from outlet) or payment (settling the folio)
 */
export interface ITransaction extends Document {
  transactionId: string;
  folioId?: string;
  propertyId: string;
  outletType: string;
  outletId: string;
  type: TransactionType;
  status: TransactionStatus;
  items: ITransactionItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethod?: POSPaymentMethod;
  paymentReference?: string;
  guestId?: string;
  guestName?: string;
  roomNumber?: string;
  tableNumber?: string;
  staffId?: string;
  staffName?: string;
  guestCount?: number;
  notes?: string;
  orderId?: string; // External order reference
  gstInvoiceId?: string;
  gstInvoiceNumber?: string;
  pmsTransactionId?: string;
  splitGroupId?: string; // For split bill tracking
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * Transaction Item - Individual item in a transaction
 */
export interface ITransactionItem {
  itemId: string;
  itemName: string;
  itemCode?: string;
  category: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  modifiers?: string[];
}

const TransactionItemSchema = new Schema<ITransactionItem>(
  {
    itemId: { type: String, required: true },
    itemName: { type: String, required: true },
    itemCode: { type: String },
    category: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discountRate: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    notes: { type: String },
    modifiers: [{ type: String }],
  },
  { _id: false }
);

const TransactionSchema = new Schema<ITransaction>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      default: () => `TXN-${uuidv4().substring(0, 12).toUpperCase()}`,
    },
    folioId: { type: String, index: true },
    propertyId: { type: String, required: true, index: true },
    outletType: { type: String, required: true, index: true },
    outletId: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
      index: true,
    },
    items: [TransactionItemSchema],
    subtotal: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    paymentMethod: {
      type: String,
      enum: Object.values(POSPaymentMethod),
    },
    paymentReference: { type: String },
    guestId: { type: String, index: true },
    guestName: { type: String },
    roomNumber: { type: String, index: true },
    tableNumber: { type: String },
    staffId: { type: String },
    staffName: { type: String },
    guestCount: { type: Number },
    notes: { type: String },
    orderId: { type: String, index: true },
    gstInvoiceId: { type: String, index: true },
    gstInvoiceNumber: { type: String },
    pmsTransactionId: { type: String },
    splitGroupId: { type: String, index: true },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for common queries
TransactionSchema.index({ propertyId: 1, createdAt: -1 });
TransactionSchema.index({ folioId: 1, createdAt: -1 });
TransactionSchema.index({ guestId: 1, createdAt: -1 });
TransactionSchema.index({ outletType: 1, status: 1, createdAt: -1 });

// Pre-save hook to calculate totals
TransactionSchema.pre('save', function (next) {
  if (this.isModified('items')) {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    this.taxAmount = this.items.reduce((sum, item) => sum + item.taxAmount, 0);
    this.discountAmount = this.items.reduce((sum, item) => sum + item.discountAmount, 0);
    this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount;
  }
  next();
});

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface ITransactionItem {
  itemId: string;
  itemType: 'service' | 'product';
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  staffId?: string;
  staffName?: string;
  commissionAmount?: number;
}

export interface IPaymentBreakdown {
  method: 'cash' | 'card' | 'upi' | 'wallet';
  amount: number;
  reference?: string;
}

export interface ITransaction extends Document {
  transactionId: string;
  invoiceId?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: ITransactionItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  totalAmount: number;
  roundOff: number;
  payments: IPaymentBreakdown[];
  amountPaid: number;
  amountDue: number;
  changeGiven: number;
  staffId: string;
  staffName: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  transactionType: 'sale' | 'refund' | 'expense' | 'advance';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionItemSchema = new Schema<ITransactionItem>(
  {
    itemId: { type: String, required: true },
    itemType: { type: String, enum: ['service', 'product'], required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true },
    staffId: { type: String },
    staffName: { type: String },
    commissionAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const PaymentBreakdownSchema = new Schema<IPaymentBreakdown>(
  {
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'wallet'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    reference: { type: String },
  },
  { _id: false }
);

const TransactionSchema = new Schema<ITransaction>(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    invoiceId: { type: String, index: true },
    customerId: { type: String, index: true },
    customerName: { type: String },
    customerPhone: { type: String },
    items: { type: [TransactionItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    discountTotal: { type: Number, default: 0, min: 0 },
    taxTotal: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    roundOff: { type: Number, default: 0 },
    payments: { type: [PaymentBreakdownSchema], default: [] },
    amountPaid: { type: Number, required: true, min: 0 },
    amountDue: { type: Number, default: 0, min: 0 },
    changeGiven: { type: Number, default: 0, min: 0 },
    staffId: { type: String, required: true, index: true },
    staffName: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending',
    },
    transactionType: {
      type: String,
      enum: ['sale', 'refund', 'expense', 'advance'],
      default: 'sale',
    },
    notes: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for reporting
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ transactionType: 1, createdAt: -1 });
TransactionSchema.index({ status: 1, createdAt: -1 });
TransactionSchema.index({ 'items.staffId': 1 });

export const Transaction = mongoose.model<ITransaction>(
  'Transaction',
  TransactionSchema
);

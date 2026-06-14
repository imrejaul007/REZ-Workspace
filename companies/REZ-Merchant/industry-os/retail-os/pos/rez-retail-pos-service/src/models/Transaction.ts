import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { TransactionStatus, PaymentMethod } from '../types';

export interface ITransactionItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  variantId?: string;
}

export interface IPaymentDetail {
  method: PaymentMethod;
  amount: number;
  reference?: string;
  cardLast4?: string;
  transactionRef?: string;
}

export interface ITransaction {
  id: string;
  transactionNumber: string;
  type: 'sale' | 'return' | 'void' | 'exchange';
  status: TransactionStatus;
  items: ITransactionItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  loyaltyPointsApplied: number;
  loyaltyPointsValue: number;
  total: number;
  paidAmount: number;
  changeGiven: number;
  payments: IPaymentDetail[];
  customerId?: string;
  customerName?: string;
  cashierId: string;
  storeId?: string;
  registerId?: string;
  notes?: string;
  refundedAmount: number;
  refundReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransactionDocument extends Omit<ITransaction, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const TransactionItemSchema = new Schema<ITransactionItem>({
  productId: { type: String, required: true },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  variantId: { type: String },
}, { _id: false });

const PaymentDetailSchema = new Schema<IPaymentDetail>({
  method: {
    type: String,
    enum: Object.values(PaymentMethod),
    required: true,
  },
  amount: { type: Number, required: true, min: 0 },
  reference: { type: String },
  cardLast4: { type: String },
  transactionRef: { type: String },
}, { _id: false });

const TransactionSchema = new Schema<ITransactionDocument>({
  id: { type: String, default: () => uuidv4(), unique: true, index: true },
  transactionNumber: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ['sale', 'return', 'void', 'exchange'],
    default: 'sale',
  },
  status: {
    type: String,
    enum: Object.values(TransactionStatus),
    default: TransactionStatus.PENDING,
    index: true,
  },
  items: [TransactionItemSchema],
  subtotal: { type: Number, required: true, min: 0 },
  taxAmount: { type: Number, default: 0, min: 0 },
  discountAmount: { type: Number, default: 0, min: 0 },
  loyaltyPointsApplied: { type: Number, default: 0, min: 0 },
  loyaltyPointsValue: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  paidAmount: { type: Number, required: true, min: 0 },
  changeGiven: { type: Number, default: 0, min: 0 },
  payments: [PaymentDetailSchema],
  customerId: { type: String, index: true },
  customerName: { type: String },
  cashierId: { type: String, required: true, index: true },
  storeId: { type: String, index: true },
  registerId: { type: String },
  notes: { type: String },
  refundedAmount: { type: Number, default: 0, min: 0 },
  refundReason: { type: String },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
}, {
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ 'payments.method': 1 });
TransactionSchema.index({ customerId: 1, createdAt: -1 });

// Generate transaction number
TransactionSchema.statics.generateTransactionNumber = function (): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `TXN-${year}${month}${day}-${random}`;
};

// Get daily sales
TransactionSchema.statics.getDailySales = async function (date: Date, storeId?: string) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const query: Record<string, unknown> = {
    createdAt: { $gte: startOfDay, $lte: endOfDay },
    status: TransactionStatus.COMPLETED,
  };

  if (storeId) {
    query.storeId = storeId;
  }

  const result = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$total' },
        totalTransactions: { $sum: 1 },
        totalItems: { $sum: { $size: '$items' } },
        averageTransaction: { $avg: '$total' },
      },
    },
  ]);

  return result[0] || { totalSales: 0, totalTransactions: 0, totalItems: 0, averageTransaction: 0 };
};

export const Transaction = mongoose.model<ITransactionDocument>('Transaction', TransactionSchema);

export default Transaction;

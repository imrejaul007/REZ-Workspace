import mongoose, { Document, Schema, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ICart extends Document {
  sessionId: Types.ObjectId;
  customerId?: Types.ObjectId;
  items: {
    productId: Types.ObjectId;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    tax: number;
    total: number;
  }[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
}

export interface ITransaction extends Document {
  transactionId: string;
  sessionId: Types.ObjectId;
  cartId: Types.ObjectId;
  customerId?: Types.ObjectId;
  storeId: Types.ObjectId;
  employeeId: Types.ObjectId;
  items: any[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'wallet' | 'mixed';
  paymentDetails: any[];
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  status: 'completed' | 'refunded' | 'partial_refund';
}

const CartSchema = new Schema({
  sessionId: { type: Schema.Types.ObjectId, ref: 'POSSession', required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true }
  }],
  subtotal: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  loyaltyPointsEarned: { type: Number, default: 0 },
  loyaltyPointsRedeemed: { type: Number, default: 0 }
}, { timestamps: true });

const TransactionSchema = new Schema({
  transactionId: { type: String, required: true, unique: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'POSSession', required: true },
  cartId: { type: Schema.Types.ObjectId, ref: 'Cart', required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  items: { type: [Schema.Types.Mixed], required: true },
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paidAmount: { type: Number, required: true },
  changeAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'wallet', 'mixed'], required: true },
  paymentDetails: { type: [Schema.Types.Mixed], default: [] },
  loyaltyPointsEarned: { type: Number, default: 0 },
  loyaltyPointsRedeemed: { type: Number, default: 0 },
  status: { type: String, enum: ['completed', 'refunded', 'partial_refund'], default: 'completed' }
}, { timestamps: true });

// Pre-save hook to generate transactionId
TransactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = `TXN-${uuidv4().slice(0, 8).toUpperCase()}`;
  }
  next();
});

export const Cart = mongoose.model<ICart>('Cart', CartSchema);
export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
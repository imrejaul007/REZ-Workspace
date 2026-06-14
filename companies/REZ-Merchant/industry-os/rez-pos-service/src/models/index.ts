import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  orderId: string;
  merchantId: string;
  customerId?: string;
  customerPhone?: string;
  items: Array<{ itemId: string; name: string; quantity: number; price: number; tax: number }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  status: 'pending' | 'completed' | 'refunded' | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'upi' | 'mixed';
  paymentStatus: 'pending' | 'paid' | 'failed';
  cashAmount?: number;
  cardAmount?: number;
  upiAmount?: number;
  changeGiven?: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  orderId: { type: String, required: true, unique: true, index: true },
  merchantId: { type: String, required: true, index: true },
  customerId: String,
  customerPhone: String,
  items: [{
    itemId: String,
    name: String,
    quantity: Number,
    price: Number,
    tax: Number,
  }],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['pending', 'completed', 'refunded', 'cancelled'], default: 'pending', index: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'mixed'], default: 'cash' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  cashAmount: Number,
  cardAmount: Number,
  upiAmount: Number,
  changeGiven: Number,
}, { timestamps: true });

OrderSchema.index({ merchantId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ customerPhone: 1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);

export interface IProduct extends Document {
  productId: string;
  merchantId: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  lowStockThreshold: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  productId: { type: String, required: true, unique: true, index: true },
  merchantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  cost: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  imageUrl: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

ProductSchema.index({ merchantId: 1, isActive: 1 });
ProductSchema.index({ sku: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);

export interface ITable extends Document {
  tableId: string;
  merchantId: string;
  tableNumber: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  createdAt: Date;
  updatedAt: Date;
}

const TableSchema = new Schema<ITable>({
  tableId: { type: String, required: true, unique: true, index: true },
  merchantId: { type: String, required: true, index: true },
  tableNumber: { type: String, required: true },
  capacity: { type: Number, required: true },
  status: { type: String, enum: ['available', 'occupied', 'reserved'], default: 'available' },
}, { timestamps: true });

export const Table = mongoose.model<ITable>('Table', TableSchema);

export interface IPayment extends Document {
  paymentId: string;
  orderId: string;
  merchantId: string;
  amount: number;
  method: 'cash' | 'card' | 'upi' | 'mixed';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference?: string;
  gatewayResponse?: any;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  paymentId: { type: String, required: true, unique: true, index: true },
  orderId: { type: String, required: true, index: true },
  merchantId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['cash', 'card', 'upi', 'mixed'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  reference: String,
  gatewayResponse: Schema.Types.Mixed,
}, { timestamps: true });

PaymentSchema.index({ merchantId: 1, createdAt: -1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);

export interface IShift extends Document {
  shiftId: string;
  merchantId: string;
  userId: string;
  userName: string;
  startTime: Date;
  endTime?: Date;
  cashIn: number;
  cashOut: number;
  ordersCount: number;
  totalSales: number;
  status: 'open' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const ShiftSchema = new Schema<IShift>({
  shiftId: { type: String, required: true, unique: true, index: true },
  merchantId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: Date,
  cashIn: { type: Number, default: 0 },
  cashOut: { type: Number, default: 0 },
  ordersCount: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, { timestamps: true });

export const Shift = mongoose.model<IShift>('Shift', ShiftSchema);

export default { Order, Product, Table, Payment, Shift };

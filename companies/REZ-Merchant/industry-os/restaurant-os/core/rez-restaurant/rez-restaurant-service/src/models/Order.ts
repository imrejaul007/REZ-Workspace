/**
 * Order Model
 *
 * Represents restaurant orders (dine-in, takeaway, delivery)
 */

import mongoose, { Schema, Document } from 'mongoose';

export type OrderType = 'dine_in' | 'takeaway' | 'delivery';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

export interface IOrderItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  customizations?: Array<{
    name: string;
    priceModifier: number;
  }>;
  specialInstructions?: string;
  subtotal: number;
}

export interface IDeliveryAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  instructions?: string;
}

export interface IOrder extends Document {
  orderId: string;
  orderNumber: string; // Human-readable order number
  restaurantId: string;
  branchId: string;
  userId: string;
  orderType: OrderType;
  status: OrderStatus;

  // Items
  items: IOrderItem[];
  itemCount: number;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  deliveryFee: number;
  packagingFee: number;
  discountAmount: number;
  totalAmount: number;
  currency: 'INR' | 'USD';

  // Payment
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial';
  paymentMethod?: string;
  razorpayOrderId?: string;

  // Dine-in specific
  tableId?: string;
  guestCount?: number;

  // Delivery specific
  deliveryAddress?: IDeliveryAddress;
  estimatedDeliveryTime?: Date;
  deliveredAt?: Date;

  // Customer info
  customerName?: string;
  customerPhone: string;
  customerEmail?: string;
  specialInstructions?: string;

  // Timestamps
  orderedAt: Date;
  confirmedAt?: Date;
  preparingAt?: Date;
  readyAt?: Date;
  servedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;

  // REZ Mind
  aiRecommended?: boolean;
  aiRecommendations?: string[];

  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  itemId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  customizations: [{
    name: { type: String },
    priceModifier: { type: Number, default: 0 },
  }],
  specialInstructions: { type: String },
  subtotal: { type: Number, required: true },
}, { _id: false });

const DeliveryAddressSchema = new Schema<IDeliveryAddress>({
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true, default: 'India' },
  pincode: { type: String, required: true },
  instructions: { type: String },
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  orderId: { type: String, required: true, unique: true, index: true },
  orderNumber: { type: String, required: true, unique: true },
  restaurantId: { type: String, required: true, index: true },
  branchId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  orderType: {
    type: String,
    enum: ['dine_in', 'takeaway', 'delivery'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
    default: 'pending',
    index: true,
  },
  items: [OrderItemSchema],
  itemCount: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  taxRate: { type: Number, required: true, default: 5 }, // 5% GST
  deliveryFee: { type: Number, default: 0 },
  packagingFee: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  currency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partial'],
    default: 'pending',
  },
  paymentMethod: { type: String },
  razorpayOrderId: { type: String },
  tableId: { type: String, index: true },
  guestCount: { type: Number },
  deliveryAddress: { type: DeliveryAddressSchema },
  estimatedDeliveryTime: { type: Date },
  deliveredAt: { type: Date },
  customerName: { type: String },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String },
  specialInstructions: { type: String },
  orderedAt: { type: Date, default: Date.now },
  confirmedAt: { type: Date },
  preparingAt: { type: Date },
  readyAt: { type: Date },
  servedAt: { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  aiRecommended: { type: Boolean, default: false },
  aiRecommendations: [{ type: String }],
}, {
  timestamps: true,
  collection: 'orders',
});

// Compound indexes
OrderSchema.index({ restaurantId: 1, createdAt: -1 });
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ branchId: 1, status: 1, orderedAt: -1 });
OrderSchema.index({ orderId: 1, status: 1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);

import mongoose, { Document, Schema } from 'mongoose';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  DISPATCHED = 'DISPATCHED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  ON_HOLD = 'ON_HOLD'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

export enum OrderType {
  WALK_IN = 'WALK_IN',
  ONLINE = 'ONLINE',
  DELIVERY = 'DELIVERY',
  PRESCRIPTION = 'PRESCRIPTION'
}

export interface IOrderItem {
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  expiryDate: Date;
  prescribedQuantity?: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount: number;
  tax: number;
  requiresPrescription: boolean;
  prescriptionId?: string;
}

export interface IShippingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  instructions?: string;
}

export interface IOrder extends Document {
  orderId: string;
  orderNumber: string;
  orderType: OrderType;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: IOrderItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  deliveryCharge: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: 'CASH' | 'CARD' | 'UPI' | 'INSURANCE' | 'CORPORATE_BILLING';
  insuranceId?: string;
  orderStatus: OrderStatus;
  prescriptionId?: string;
  shippingAddress?: IShippingAddress;
  pickupStoreId?: string;
  deliveryPartner?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  cancelledBy?: string;
  notes?: string;
  pharmacistNotes?: string;
  filledBy?: string;
  checkedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  medicineId: { type: String, required: true },
  medicineName: { type: String, required: true },
  batchNumber: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  prescribedQuantity: { type: Number },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  requiresPrescription: { type: Boolean, default: false },
  prescriptionId: { type: String }
}, { _id: false });

const ShippingAddressSchema = new Schema<IShippingAddress>({
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'India' },
  phone: { type: String, required: true },
  instructions: { type: String }
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  orderId: { type: String, required: true, unique: true, index: true },
  orderNumber: { type: String, required: true, unique: true, index: true },
  orderType: { type: String, enum: OrderType, required: true, index: true },
  customerId: { type: String, required: true, index: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String },
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true },
  discountTotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: PaymentStatus, default: PaymentStatus.PENDING, index: true },
  paymentMethod: { type: String, enum: ['CASH', 'CARD', 'UPI', 'INSURANCE', 'CORPORATE_BILLING'] },
  insuranceId: { type: String },
  orderStatus: { type: String, enum: OrderStatus, default: OrderStatus.PENDING, index: true },
  prescriptionId: { type: String, index: true },
  shippingAddress: { type: ShippingAddressSchema },
  pickupStoreId: { type: String },
  deliveryPartner: { type: String },
  trackingNumber: { type: String },
  estimatedDelivery: { type: Date },
  deliveredAt: { type: Date },
  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  cancelledBy: { type: String },
  notes: { type: String },
  pharmacistNotes: { type: String },
  filledBy: { type: String },
  checkedBy: { type: String }
}, {
  timestamps: true,
  collection: 'pharmacy_orders'
});

// Indexes
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ 'items.medicineId': 1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);

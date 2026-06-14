import mongoose, { Schema, Document } from 'mongoose';

export enum OrderType {
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  ARRIVED = 'arrived',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface IDeliveryOrder extends Document {
  orderId: string;
  customerId: string;
  restaurantId: string;
  orderType: OrderType;
  status: OrderStatus;
  items: {
    itemId: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }[];
  subtotal: number;
  deliveryFee: number;
  surgeFee: number;
  totalAmount: number;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  pickupTime?: Date;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  deliveryPersonId?: string;
  otp?: string;
  otpVerified: boolean;
  customerPhone: string;
  restaurantAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  zoneId?: string;
  statusHistory: {
    status: OrderStatus;
    timestamp: Date;
    note?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryOrderSchema = new Schema<IDeliveryOrder>(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    restaurantId: { type: String, required: true, index: true },
    orderType: { type: String, enum: Object.values(OrderType), required: true },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
      index: true,
    },
    items: [
      {
        itemId: { type: String, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
        notes: { type: String },
      },
    ],
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    surgeFee: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    deliveryAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    pickupTime: { type: Date },
    estimatedDeliveryTime: { type: Date },
    actualDeliveryTime: { type: Date },
    deliveryPersonId: { type: String, index: true },
    otp: { type: String },
    otpVerified: { type: Boolean, default: false },
    customerPhone: { type: String, required: true },
    restaurantAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
    },
    zoneId: { type: String },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  { timestamps: true }
);

DeliveryOrderSchema.index({ 'deliveryAddress.coordinates': '2dsphere' });
DeliveryOrderSchema.index({ createdAt: -1 });
DeliveryOrderSchema.index({ status: 1, createdAt: -1 });

export const DeliveryOrder = mongoose.model<IDeliveryOrder>('DeliveryOrder', DeliveryOrderSchema);

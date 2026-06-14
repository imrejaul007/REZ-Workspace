import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  itemId: mongoose.Types.ObjectId;
  itemName: string;
  quantity: number;
  serviceType: string;
  price: number;
  specialInstructions?: string;
}

export interface ILaundryOrder extends Document {
  orderNumber: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  hotelId: string;
  hotelName: string;
  items: IOrderItem[];
  serviceTypeId: mongoose.Types.ObjectId;
  serviceType: string;
  weight?: number;
  subtotal: number;
  expressCharge: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'picked-up' | 'washing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  isExpress: boolean;
  pickupTime?: Date;
  estimatedReadyTime: Date;
  deliveredTime?: Date;
  specialInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'LaundryItem', required: true },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    serviceType: { type: String, required: true },
    price: { type: Number, required: true },
    specialInstructions: String,
  },
  { _id: false }
);

const LaundryOrderSchema = new Schema<ILaundryOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    guestId: { type: String, required: true, index: true },
    guestName: { type: String, required: true },
    roomNumber: { type: String, required: true },
    hotelId: { type: String, required: true, index: true },
    hotelName: { type: String, required: true },
    items: { type: [OrderItemSchema], required: true },
    serviceTypeId: { type: Schema.Types.ObjectId, ref: 'ServiceType', required: true },
    serviceType: { type: String, required: true },
    weight: Number,
    subtotal: { type: Number, required: true },
    expressCharge: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'picked-up', 'washing', 'ready', 'delivering', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    isExpress: { type: Boolean, default: false },
    pickupTime: Date,
    estimatedReadyTime: { type: Date, required: true },
    deliveredTime: Date,
    specialInstructions: String,
  },
  { timestamps: true }
);

LaundryOrderSchema.index({ hotelId: 1, status: 1 });
LaundryOrderSchema.index({ guestId: 1, createdAt: -1 });
LaundryOrderSchema.index({ createdAt: -1 });

export const LaundryOrder = mongoose.model<ILaundryOrder>('LaundryOrder', LaundryOrderSchema);
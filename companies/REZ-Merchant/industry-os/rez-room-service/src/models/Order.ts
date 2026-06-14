import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  menuItemId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
  customizations?: string[];
}

export interface IOrder extends Document {
  orderNumber: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  hotelId: string;
  items: IOrderItem[];
  subtotal: number;
  taxes: number;
  serviceCharge: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  specialInstructions?: string;
  deliveryNotes?: string;
  estimatedDeliveryTime: Date;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    specialInstructions: String,
    customizations: [String],
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    guestId: { type: String, required: true, index: true },
    guestName: { type: String, required: true },
    roomNumber: { type: String, required: true },
    hotelId: { type: String, required: true, index: true },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    taxes: { type: Number, required: true },
    serviceCharge: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    specialInstructions: String,
    deliveryNotes: String,
    estimatedDeliveryTime: { type: Date, required: true },
    deliveredAt: Date,
  },
  { timestamps: true }
);

OrderSchema.index({ hotelId: 1, status: 1 });
OrderSchema.index({ guestId: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);

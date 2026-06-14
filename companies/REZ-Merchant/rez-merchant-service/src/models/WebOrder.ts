import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWebOrder extends Document {
  orderNumber: string;
  storeId: Types.ObjectId;
  storeSlug: string;
  storeName: string;
  customerPhone: string;
  customerName?: string;
  tableNumber?: string;
  items: Array<{
    menuItemId: Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
    category?: string;
    image?: string;
    customisation?: string;
  }>;
  subtotal: number;
  taxes: number;
  total: number;
  tipAmount: number;
  tipPercentage?: number;
  totalWithTip?: number;
  status: string;
  paymentStatus: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  specialInstructions?: string;
  scheduledFor?: Date;
  channel: string;
  coinsCredited: boolean;
  userId?: Types.ObjectId;
  billSplits: Array<{ name: string; amount: number; paid: boolean; paidAt?: Date }>;
  surveyFeedback?: {
    foodQuality?: number;
    serviceSpeed?: number;
    recommend?: boolean;
    textFeedback?: string;
    submittedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const WebOrderSchema = new Schema<IWebOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    storeSlug: { type: String, required: true },
    storeName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerName: String,
    tableNumber: String,
    items: [
      {
        menuItemId: { type: Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        quantity: Number,
        category: String,
        image: String,
        customisation: String,
      },
    ],
    subtotal: { type: Number, required: true },
    taxes: { type: Number, default: 0 },
    total: { type: Number, required: true },
    tipAmount: { type: Number, default: 0 },
    tipPercentage: Number,
    totalWithTip: Number,
    status: {
      type: String,
      enum: ['pending_payment', 'paid', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'pending_payment',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    specialInstructions: String,
    scheduledFor: Date,
    channel: { type: String, default: 'web_qr' },
    coinsCredited: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    billSplits: [{ name: String, amount: Number, paid: Boolean, paidAt: Date }],
    surveyFeedback: Schema.Types.Mixed,
  },
  { timestamps: true, strict: true, strictQuery: true },
);

WebOrderSchema.index({ storeId: 1, createdAt: -1 });
WebOrderSchema.index({ storeId: 1, status: 1, createdAt: -1 });
WebOrderSchema.index({ customerPhone: 1, createdAt: -1 });

export const WebOrder = mongoose.model<IWebOrder>('WebOrder', WebOrderSchema);

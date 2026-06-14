import mongoose, { Schema, Model } from 'mongoose';
import {
  IOrder,
  IOrderDocument,
  OrderStatus,
  IShippingAddress,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Creator',
      required: [true, 'Creator ID is required'],
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true,
    },
    customerId: {
      type: String,
      required: [true, 'Customer ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    amount: {
      type: Number,
      required: [true, 'Order amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    commissionRate: {
      type: Number,
      required: [true, 'Commission rate is required'],
      min: 0,
      max: 100,
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    netEarnings: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      lowercase: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    shippingAddress: {
      type: ShippingAddressSchema,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
OrderSchema.index({ creatorId: 1, status: 1 });
OrderSchema.index({ customerId: 1 });
OrderSchema.index({ productId: 1 });
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ creatorId: 1, createdAt: -1 });

// Generate order number before save
OrderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = uuidv4().split('-')[0].toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }

  // Calculate commission and net earnings
  if (this.isModified('amount') || this.isModified('commissionRate')) {
    this.commissionAmount = (this.amount * this.commissionRate) / 100;
    this.netEarnings = this.amount - this.commissionAmount;
  }

  next();
});

// Static methods
OrderSchema.statics.findByCreator = function (creatorId: string) {
  return this.find({ creatorId }).sort({ createdAt: -1 });
};

OrderSchema.statics.findByCreatorAndStatus = function (
  creatorId: string,
  status: OrderStatus
) {
  return this.find({ creatorId, status }).sort({ createdAt: -1 });
};

OrderSchema.statics.findByCustomer = function (customerId: string) {
  return this.find({ customerId }).sort({ createdAt: -1 });
};

OrderSchema.statics.findByOrderNumber = function (orderNumber: string) {
  return this.findOne({ orderNumber });
};

OrderSchema.statics.findPendingForCreator = function (creatorId: string) {
  return this.find({
    creatorId,
    status: { $in: [OrderStatus.PENDING, OrderStatus.PROCESSING] },
  }).sort({ createdAt: -1 });
};

OrderSchema.statics.getCreatorStats = async function (creatorId: string) {
  const stats = await this.aggregate([
    { $match: { creatorId: new mongoose.Types.ObjectId(creatorId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalCommission: { $sum: '$commissionAmount' },
        totalNetEarnings: { $sum: '$netEarnings' },
      },
    },
  ]);
  return stats;
};

// Instance method to process order
OrderSchema.methods.process = async function () {
  if (this.status !== OrderStatus.PENDING) {
    throw new Error('Only pending orders can be processed');
  }
  this.status = OrderStatus.PROCESSING;
  return this.save();
};

// Instance method to complete order
OrderSchema.methods.complete = async function () {
  if (this.status !== OrderStatus.PROCESSING) {
    throw new Error('Only processing orders can be completed');
  }
  this.status = OrderStatus.COMPLETED;
  return this.save();
};

// Instance method to cancel order
OrderSchema.methods.cancel = async function (reason?: string) {
  if (this.status === OrderStatus.COMPLETED) {
    throw new Error('Completed orders cannot be cancelled');
  }
  this.status = OrderStatus.CANCELLED;
  if (reason) {
    this.notes = `${this.notes}\nCancellation reason: ${reason}`.trim();
  }
  return this.save();
};

// Instance method to refund order
OrderSchema.methods.refund = async function (reason?: string) {
  this.status = OrderStatus.REFUNDED;
  if (reason) {
    this.notes = `${this.notes}\nRefund reason: ${reason}`.trim();
  }
  return this.save();
};

export const Order: Model<IOrderDocument> = mongoose.model<IOrderDocument>(
  'Order',
  OrderSchema
);

export default Order;
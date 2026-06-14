import mongoose, { Schema, Document } from 'mongoose';

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface IShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface IShopOrder extends Document {
  id: string;
  instagramOrderId?: string;
  productId: mongoose.Types.ObjectId;
  userId: string;
  quantity: number;
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: IShippingAddress;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  trackingNumber?: string;
  notes?: string;
}

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    street: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    zip: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      default: 'India',
    },
  },
  { _id: false }
);

const ShopOrderSchema = new Schema<IShopOrder>(
  {
    instagramOrderId: {
      type: String,
      index: true,
      sparse: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    shippingAddress: {
      type: ShippingAddressSchema,
      required: true,
    },
    confirmedAt: {
      type: Date,
    },
    shippedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    trackingNumber: {
      type: String,
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as mongoose.Types.ObjectId).toString();
        ret._id = undefined;
        ret.__v = undefined;
        return ret;
      },
    },
  }
);

ShopOrderSchema.index({ userId: 1, createdAt: -1 });
ShopOrderSchema.index({ status: 1, createdAt: -1 });
ShopOrderSchema.index({ 'shippingAddress.city': 1, 'shippingAddress.state': 1 });

export const ShopOrder = mongoose.model<IShopOrder>('ShopOrder', ShopOrderSchema);

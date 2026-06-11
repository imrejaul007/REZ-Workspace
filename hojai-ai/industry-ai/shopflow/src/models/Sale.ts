import mongoose, { Document, Schema } from 'mongoose';
import Decimal from 'decimal.js';

export type SaleStatus = 'pending' | 'completed' | 'refunded' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'digital' | 'loyalty';

export interface ISaleItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface ISale extends Document {
  customerId?: mongoose.Types.ObjectId;
  items: ISaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  createdAt: Date;
  updatedAt: Date;
}

const SaleItemSchema = new Schema<ISaleItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const SaleSchema = new Schema<ISale>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      index: true,
    },
    items: {
      type: [SaleItemSchema],
      required: true,
      validate: {
        validator: function (items: ISaleItem[]) {
          return items.length > 0;
        },
        message: 'Sale must have at least one item',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'digital', 'loyalty'],
      default: 'cash',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'refunded', 'cancelled'],
      default: 'completed',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SaleSchema.index({ createdAt: -1 });
SaleSchema.index({ 'items.productId': 1 });
SaleSchema.index({ status: 1, createdAt: -1 });
SaleSchema.index({ customerId: 1, createdAt: -1 });

// Calculate totals before saving
SaleSchema.pre('save', function (next) {
  const subtotal = this.items.reduce((sum, item) => {
    return new Decimal(sum).plus(new Decimal(item.price).times(item.quantity)).toNumber();
  }, 0);

  const totalDiscount = this.items.reduce((sum, item) => {
    return new Decimal(sum).plus(item.discount || 0).toNumber();
  }, 0);

  const afterDiscount = new Decimal(subtotal).minus(totalDiscount).toNumber();
  const tax = new Decimal(afterDiscount).times(0.08).toNumber(); // 8% tax

  this.subtotal = new Decimal(subtotal).toDecimalPlaces(2).toNumber();
  this.discount = new Decimal(totalDiscount).toDecimalPlaces(2).toNumber();
  this.total = new Decimal(afterDiscount).plus(tax).toDecimalPlaces(2).toNumber();
  this.tax = new Decimal(tax).toDecimalPlaces(2).toNumber();

  next();
});

export const Sale = mongoose.model<ISale>('Sale', SaleSchema);
export default Sale;
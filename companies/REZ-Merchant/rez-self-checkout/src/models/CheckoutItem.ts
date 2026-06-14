import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICheckoutItem {
  productId: string;
  sku: string;
  name: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  total: number;
  scannedAt: Date;
}

export interface ICheckoutItemDocument extends ICheckoutItem, Document {
  _id: mongoose.Types.ObjectId;
}

const CheckoutItemSchema = new Schema<ICheckoutItemDocument>(
  {
    productId: { type: String, required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    barcode: { type: String, required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    scannedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    _id: true,
  }
);

export const CheckoutItem: Model<ICheckoutItemDocument> = mongoose.model<ICheckoutItemDocument>(
  'CheckoutItem',
  CheckoutItemSchema
);

// Barcode index for quick lookup
CheckoutItemSchema.index({ barcode: 1 });

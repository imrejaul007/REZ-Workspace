/**
 * Salon Product Inventory Model
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISalonProduct extends Document {
  storeId: Types.ObjectId;
  name: string;
  brand: string;
  category: 'shampoo' | 'conditioner' | 'styling' | 'treatment' | 'skincare' | 'other';
  quantity: number;
  unit: string;
  reorderPoint: number;
  cost: number;
  price: number;
  supplier: string;
  expiryDate?: Date;
  status: 'active' | 'low_stock' | 'out_of_stock';
}

const SalonProductSchema = new Schema({
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  category: {
    type: String,
    enum: ['shampoo', 'conditioner', 'styling', 'treatment', 'skincare', 'other'],
    required: true
  },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  reorderPoint: { type: Number, default: 10 },
  cost: { type: Number, required: true },
  price: { type: Number, required: true },
  supplier: { type: String },
  expiryDate: Date,
  status: { type: String, enum: ['active', 'low_stock', 'out_of_stock'], default: 'active' }
}, { timestamps: true });

SalonProductSchema.pre('save', function(next) {
  if (this.quantity <= 0) {
    this.status = 'out_of_stock';
  } else if (this.quantity <= this.reorderPoint) {
    this.status = 'low_stock';
  } else {
    this.status = 'active';
  }
  next();
});

SalonProductSchema.index({ storeId: 1 });

export const SalonProduct = mongoose.model<ISalonProduct>('SalonProduct', SalonProductSchema);

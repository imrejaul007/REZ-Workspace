import mongoose, { Schema, Document } from 'mongoose';
import { Part as IPart } from '../types';

export interface PartDocument extends Omit<IPart, '_id'>, Document {}

const PartSchema = new Schema<PartDocument>(
  {
    partNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 500 },
    category: { type: String, required: true, index: true },
    brand: { type: String, required: true },
    compatibleVehicles: [{ type: String }],
    supplierId: { type: String, index: true },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    minStockLevel: { type: Number, default: 5, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    location: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    }
  }
);

PartSchema.index({ name: 'text', description: 'text' });
PartSchema.index({ category: 1, status: 1 });
PartSchema.index({ quantity: 1 });

PartSchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.minStockLevel;
});

PartSchema.set('toJSON', { virtuals: true });

PartSchema.statics.findLowStock = function() {
  return this.find({ $expr: { $lte: ['$quantity', '$minStockLevel'] }, status: 'active' });
};

export const PartModel = mongoose.model<PartDocument>('Part', PartSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface ILaundryItem extends Document {
  name: string;
  category: string;
  defaultServiceId: mongoose.Types.ObjectId;
  priceOverrides: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const LaundryItemSchema = new Schema<ILaundryItem>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    defaultServiceId: { type: Schema.Types.ObjectId, ref: 'ServiceType', required: true },
    priceOverrides: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

export const LaundryItem = mongoose.model<ILaundryItem>('LaundryItem', LaundryItemSchema);
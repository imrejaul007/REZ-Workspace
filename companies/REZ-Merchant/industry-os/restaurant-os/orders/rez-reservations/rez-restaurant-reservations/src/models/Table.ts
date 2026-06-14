import mongoose, { Document, Schema } from 'mongoose';

export interface ITable extends Document {
  tableId: string;
  merchantId: string;
  restaurantId: string;
  name: string;
  capacity: { min: number; max: number };
  location: 'indoor' | 'outdoor' | 'private' | 'bar' | 'window';
  position: { x: number; y: number };
  shape: 'round' | 'square' | 'rectangle';
  status: 'available' | 'occupied' | 'reserved' | 'blocked';
  amenities: string[];
  createdAt: Date;
  updatedAt: Date;
}

const tableSchema = new Schema<ITable>({
  tableId: { type: String, required: true, unique: true },
  merchantId: { type: String, required: true, index: true },
  restaurantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  capacity: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
  },
  location: {
    type: String,
    enum: ['indoor', 'outdoor', 'private', 'bar', 'window'],
    default: 'indoor',
  },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },
  shape: {
    type: String,
    enum: ['round', 'square', 'rectangle'],
    default: 'square',
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'blocked'],
    default: 'available',
  },
  amenities: [String],
}, { timestamps: true });

tableSchema.index({ restaurantId: 1, status: 1 });

export const Table = mongoose.model<ITable>('Table', tableSchema);

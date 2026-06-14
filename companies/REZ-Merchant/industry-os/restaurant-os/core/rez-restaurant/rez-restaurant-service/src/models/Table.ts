/**
 * Table Model
 *
 * Represents restaurant tables with capacity and status
 */

import mongoose, { Schema, Document } from 'mongoose';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'maintenance' | 'blocked';

export interface ITable extends Document {
  tableId: string;
  restaurantId: string;
  branchId: string;
  tableNumber: string;
  floor?: string; // ground, first, rooftop, etc.
  capacity: {
    min: number;
    max: number;
  };
  tableType: 'indoor' | 'outdoor' | 'private' | 'bar' | 'vip';
  position?: {
    x: number;
    y: number;
  };
  amenities?: string[]; // windows, corner, wheelchair-accessible, etc.
  status: TableStatus;
  currentReservationId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TableSchema = new Schema<ITable>({
  tableId: { type: String, required: true, unique: true, index: true },
  restaurantId: { type: String, required: true, index: true },
  branchId: { type: String, required: true, index: true },
  tableNumber: { type: String, required: true },
  floor: { type: String },
  capacity: {
    min: { type: Number, required: true, min: 1 },
    max: { type: Number, required: true, min: 1 },
  },
  tableType: {
    type: String,
    enum: ['indoor', 'outdoor', 'private', 'bar', 'vip'],
    required: true,
  },
  position: {
    x: { type: Number },
    y: { type: Number },
  },
  amenities: [{ type: String }],
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance', 'blocked'],
    default: 'available',
    index: true,
  },
  currentReservationId: { type: String },
  isActive: { type: Boolean, default: true, index: true },
}, {
  timestamps: true,
  collection: 'tables',
});

// Compound indexes
TableSchema.index({ restaurantId: 1, branchId: 1, isActive: 1 });
TableSchema.index({ restaurantId: 1, branchId: 1, status: 1 });
TableSchema.index({ restaurantId: 1, branchId: 1, 'capacity.min': 1, 'capacity.max': 1 });

export const Table = mongoose.model<ITable>('Table', TableSchema);

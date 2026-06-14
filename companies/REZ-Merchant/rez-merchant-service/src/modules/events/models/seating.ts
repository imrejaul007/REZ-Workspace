/**
 * Seating Chart Model
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISeatingChart extends Document {
  eventId: Types.ObjectId;
  name: string;
  rows: {
    row: string;
    seats: {
      seat: string;
      x: number;
      y: number;
      type: 'standard' | 'vip' | 'accessible';
      status: 'available' | 'reserved' | 'blocked';
    }[];
  }[];
  sections: {
    name: string;
    rows: string[];
    price: number;
  }[];
  createdAt: Date;
}

const SeatingChartSchema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  name: { type: String, required: true },
  rows: [{
    row: String,
    seats: [{
      seat: String,
      x: Number,
      y: Number,
      type: { type: String, enum: ['standard', 'vip', 'accessible'], default: 'standard' },
      status: { type: String, enum: ['available', 'reserved', 'blocked'], default: 'available' }
    }]
  }],
  sections: [{
    name: String,
    rows: [String],
    price: Number
  }]
}, { timestamps: true });

SeatingChartSchema.index({ eventId: 1 });

export const SeatingChart = mongoose.model<ISeatingChart>('SeatingChart', SeatingChartSchema);

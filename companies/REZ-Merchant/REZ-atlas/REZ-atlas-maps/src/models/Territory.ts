/**
 * Territory Model - Geographic territory boundaries
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface TerritoryDocument extends Document {
  name: string;
  boundaries: Array<{ lat: number; lng: number }>;
  center: { lat: number; lng: number };
  color?: string;
  manager?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TerritorySchema = new Schema<TerritoryDocument>(
  {
    name: { type: String, required: true },
    boundaries: {
      type: [
        new Schema(
          { lat: Number, lng: Number },
          { _id: false }
        ),
      ],
      required: true,
      validate: {
        validator: (v: any[]) => v.length >= 3,
        message: 'At least 3 boundary points required',
      },
    },
    center: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    color: { type: String, default: '#3B82F6' },
    manager: { type: String },
  },
  {
    timestamps: true,
  }
);

// Index for location-based queries
TerritorySchema.index({ center: '2dsphere' });

export const Territory = mongoose.model<TerritoryDocument>('Territory', TerritorySchema);
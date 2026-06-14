/**
 * Property Model
 */

import mongoose, { Schema, Document } from 'mongoose';
import { Property } from '../types';

export interface IProperty extends Omit<Property, 'id'>, Document {}

const PropertySchema = new Schema<IProperty>(
  {
    propertyId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    chain: { type: String, required: true },
    totalRooms: { type: Number, required: true, min: 1 },
    starRating: { type: Number, required: true, min: 1, max: 5 },
    openedDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'multi_property_hotels',
  }
);

PropertySchema.index({ chain: 1 });
PropertySchema.index({ isActive: 1 });

export const PropertyModel = mongoose.model<IProperty>('Property', PropertySchema);

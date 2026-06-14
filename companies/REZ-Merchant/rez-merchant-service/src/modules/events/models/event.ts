/**
 * Event Model
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEvent extends Document {
  storeId: Types.ObjectId;
  name: string;
  description?: string;
  type: string;
  venue?: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  maxAttendees: number;
  currentAttendees: number;
  ticketTypes: {
    name: string;
    price: number;
    quantity: number;
    sold: number;
  }[];
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema({
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  name: { type: String, required: true },
  description: String,
  type: { type: String, required: true },
  venue: String,
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  maxAttendees: { type: Number, default: 100 },
  currentAttendees: { type: Number, default: 0 },
  ticketTypes: [{
    name: String,
    price: Number,
    quantity: Number,
    sold: { type: Number, default: 0 }
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  imageUrl: String
}, { timestamps: true });

EventSchema.index({ storeId: 1, status: 1 });

export const Event = mongoose.model<IEvent>('Event', EventSchema);

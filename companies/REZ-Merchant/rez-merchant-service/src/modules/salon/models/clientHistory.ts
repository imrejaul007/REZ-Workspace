/**
 * Client History Model
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IClientHistory extends Document {
  clientId: string;
  storeId: Types.ObjectId;
  visits: {
    date: Date;
    service: string;
    staff: string;
    amount: number;
    rating?: number;
    notes?: string;
  }[];
  preferences: {
    preferredStaff: Types.ObjectId[];
    preferredTimes: string[];
    notes: string;
    allergies: string[];
    sensitivities: string[];
  };
  tags: string[];
  totalSpent: number;
  visitCount: number;
  lastVisit?: Date;
  avgRating?: number;
}

const ClientHistorySchema = new Schema({
  clientId: { type: String, required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  visits: [{
    date: Date,
    service: String,
    staff: String,
    amount: Number,
    rating: Number,
    notes: String
  }],
  preferences: {
    preferredStaff: [{ type: Schema.Types.ObjectId }],
    preferredTimes: [String],
    notes: { type: String, default: '' },
    allergies: [String],
    sensitivities: [String]
  },
  tags: [String],
  totalSpent: { type: Number, default: 0 },
  visitCount: { type: Number, default: 0 },
  lastVisit: Date,
  avgRating: Number
}, { timestamps: true });

ClientHistorySchema.index({ clientId: 1, storeId: 1 });

export const ClientHistory = mongoose.model<IClientHistory>('ClientHistory', ClientHistorySchema);

/**
 * Treatment Room Model
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITreatmentRoom extends Document {
  storeId: Types.ObjectId;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

const TreatmentRoomSchema = new Schema({
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  name: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const TreatmentRoom = mongoose.model<ITreatmentRoom>('TreatmentRoom', TreatmentRoomSchema);

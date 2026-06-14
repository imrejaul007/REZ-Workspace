import mongoose, { Document, Schema } from 'mongoose';

export interface IConversionMatch extends Document {
  offlineId: string;
  onlineId: string;
  matchType: 'email' | 'phone' | 'device_id' | 'fingerprint' | 'probability';
  confidence: number;
  matchData?: Record<string, any>;
  attributionWindow: number;
  matchedAt: Date;
  status: 'pending' | 'confirmed' | 'rejected' | 'disputed';
  confirmedAt?: Date;
  confirmedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversionMatchSchema = new Schema<IConversionMatch>(
  {
    offlineId: { type: String, required: true, index: true },
    onlineId: { type: String, required: true, index: true },
    matchType: {
      type: String,
      enum: ['email', 'phone', 'device_id', 'fingerprint', 'probability'],
      required: true
    },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    matchData: { type: Schema.Types.Mixed },
    attributionWindow: { type: Number, default: 30 },
    matchedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'disputed'],
      default: 'pending'
    },
    confirmedAt: { type: Date },
    confirmedBy: { type: String }
  },
  {
    timestamps: true
  }
);

ConversionMatchSchema.index({ offlineId: 1, onlineId: 1 }, { unique: true });
ConversionMatchSchema.index({ matchType: 1, confidence: -1 });
ConversionMatchSchema.index({ status: 1, matchedAt: -1 });

export const ConversionMatch = mongoose.model<IConversionMatch>(
  'ConversionMatch',
  ConversionMatchSchema
);
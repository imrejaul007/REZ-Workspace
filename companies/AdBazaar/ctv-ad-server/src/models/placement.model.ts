import mongoose, { Schema, Document } from 'mongoose';

export interface PlacementDocument extends Document {
  placementId: string;
  name: string;
  appId: string;
  format: 'preroll' | 'midroll' | 'postroll' | 'pod';
  status: 'active' | 'paused';
  defaultCpmBid: number;
  targeting: {
    geo?: string[];
    deviceTypes?: string[];
    contentCategories?: string[];
  };
  pacing: {
    type: 'even' | 'asap' | 'frontloaded';
    dailyLimit?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PlacementSchema = new Schema<PlacementDocument>({
  placementId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  appId: { type: String, required: true, index: true },
  format: {
    type: String,
    enum: ['preroll', 'midroll', 'postroll', 'pod'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paused'],
    default: 'active'
  },
  defaultCpmBid: { type: Number, default: 0 },
  targeting: {
    geo: [String],
    deviceTypes: [String],
    contentCategories: [String],
  },
  pacing: {
    type: { type: String, enum: ['even', 'asap', 'frontloaded'], default: 'even' },
    dailyLimit: Number,
  },
}, {
  timestamps: true,
  collection: 'placements',
});

export const PlacementModel = mongoose.model<PlacementDocument>('Placement', PlacementSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface IMember extends Document {
  memberId: string;
  segmentId: string;
  userId: string;
  profile: {
    demographics?: {
      age?: number;
      gender?: string;
      location?: string;
      country?: string;
      city?: string;
    };
    behavior?: {
      totalPurchases?: number;
      averageOrderValue?: number;
      lastPurchaseDate?: Date;
      frequency?: string;
    };
    preferences?: {
      categories?: string[];
      brands?: string[];
 };
    device?: {
      type?: string;
      browser?: string;
      os?: string;
    };
    custom?: Record<string, unknown>;
  };
  addedAt: Date;
  removedAt?: Date;
  status: 'active' | 'removed';
  createdAt: Date;
}

const memberSchema = new Schema<IMember>({
  memberId: { type: String, required: true, unique: true },
  segmentId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  profile: {
    demographics: {
      age: Number,
      gender: String,
      location: String,
      country: String,
      city: String
    },
    behavior: {
      totalPurchases: Number,
      averageOrderValue: Number,
      lastPurchaseDate: Date,
      frequency: String
    },
    preferences: {
      categories: [String],
      brands: [String]
    },
    device: {
      type: String,
      browser: String,
      os: String
    },
    custom: { type: Map, of: mongoose.Schema.Types.Mixed }
  },
  addedAt: { type: Date, default: Date.now },
  removedAt: { type: Date },
  status: {
    type: String,
    enum: ['active', 'removed'],
    default: 'active'
  }
}, { timestamps: true });

memberSchema.index({ memberId: 1 });
memberSchema.index({ segmentId: 1, userId: 1 }, { unique: true });
memberSchema.index({ segmentId: 1, status: 1 });
memberSchema.index({ userId: 1 });

export const Member = mongoose.model<IMember>('Member', memberSchema);
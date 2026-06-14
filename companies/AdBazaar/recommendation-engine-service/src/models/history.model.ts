import mongoose, { Document, Schema } from 'mongoose';

export interface IHistory extends Document {
  historyId: string;
  userId: string;
  interactions: Array<{
    itemId: string;
    itemType: string;
    action: 'view' | 'click' | 'purchase' | 'rate' | 'search';
    timestamp: Date;
    metadata?: Record<string, unknown>;
  }>;
  preferences: {
    categories?: string[];
    brands?: string[];
    priceRanges?: { min: number; max: number }[];
    attributes?: Record<string, string[]>;
  };
  embedding?: number[];
  lastUpdated: Date;
  createdAt: Date;
}

const interactionSchema = new Schema({
  itemId: { type: String, required: true },
  itemType: { type: String, required: true },
  action: {
    type: String,
    enum: ['view', 'click', 'purchase', 'rate', 'search'],
    required: true
  },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { _id: false });

const historySchema = new Schema<IHistory>({
  historyId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  interactions: [interactionSchema],
  preferences: {
    categories: [String],
    brands: [String],
    priceRanges: [{
      min: Number,
      max: Number
    }],
    attributes: { type: Map, of: [String] }
  },
  embedding: [Number],
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

historySchema.index({ historyId: 1 });
historySchema.index({ userId: 1 });

export const History = mongoose.model<IHistory>('History', historySchema);
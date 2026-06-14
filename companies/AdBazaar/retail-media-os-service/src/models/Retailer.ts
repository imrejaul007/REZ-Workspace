import mongoose, { Schema, Document } from 'mongoose';

export interface IRetailer extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  logo?: string;
  website?: string;
  categories: string[];
  storeCount: number;
  totalLocations: number;
  settings: {
    defaultMarkup: number;
    minBid: number;
    maxBid: number;
    targetingEnabled: boolean;
    attributionEnabled: boolean;
    salesLiftTracking: boolean;
  };
  integration: {
    posSystem?: string;
    inventorySource?: string;
    loyaltyProgram?: string;
    apiKey?: string;
    webhookUrl?: string;
  };
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

const RetailerSchema = new Schema<IRetailer>(
  {
    name: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    logo: { type: String },
    website: { type: String },
    categories: [{ type: String, index: true }],
    storeCount: { type: Number, default: 0 },
    totalLocations: { type: Number, default: 0 },
    settings: {
      defaultMarkup: { type: Number, default: 15 },
      minBid: { type: Number, default: 0.5 },
      maxBid: { type: Number, default: 10 },
      targetingEnabled: { type: Boolean, default: true },
      attributionEnabled: { type: Boolean, default: true },
      salesLiftTracking: { type: Boolean, default: true }
    },
    integration: {
      posSystem: { type: String },
      inventorySource: { type: String },
      loyaltyProgram: { type: String },
      apiKey: { type: String },
      webhookUrl: { type: String }
    },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' }
  },
  { timestamps: true }
);

// Indexes
RetailerSchema.index({ slug: 1 });
RetailerSchema.index({ categories: 1 });
RetailerSchema.index({ status: 1 });

export const Retailer = mongoose.model<IRetailer>('Retailer', RetailerSchema);
export default Retailer;
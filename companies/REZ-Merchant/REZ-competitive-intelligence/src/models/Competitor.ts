import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICompetitor extends Document {
  name: string;
  businessType: string;
  location: { city: string; state: string; address?: string };
  website?: string;
  socialMedia?: { instagram?: string; facebook?: string; twitter?: string };
  phone?: string;
  priceRange: 'budget' | 'mid' | 'premium' | 'luxury';
  rating?: number;
  reviewCount?: number;
  specialties: string[];
  openingYear?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICompetitorPrice extends Document {
  competitorId: Types.ObjectId;
  productName: string;
  price: number;
  unit?: string;
  lastUpdated: Date;
  createdAt: Date;
}

export interface IMarketAnalysis extends Document {
  region: string;
  category: string;
  date: Date;
  metrics: {
    totalCompetitors: number;
    avgPrice: number;
    avgRating: number;
    priceRange: { min: number; max: number };
    marketShare?: Record<string, number>;
  };
  trends: { metric: string; change: number; direction: 'up' | 'down' }[];
  insights: string[];
  createdAt: Date;
}

const CompetitorSchema = new Schema({
  name: { type: String, required: true, index: true },
  businessType: { type: String, required: true, index: true },
  location: {
    city: { type: String, required: true },
    state: { type: String, required: true },
    address: String,
  },
  website: String,
  socialMedia: { instagram: String, facebook: String, twitter: String },
  phone: String,
  priceRange: { type: String, enum: ['budget', 'mid', 'premium', 'luxury'], default: 'mid' },
  rating: Number,
  reviewCount: Number,
  specialties: [String],
  openingYear: Number,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const CompetitorPriceSchema = new Schema({
  competitorId: { type: Schema.Types.ObjectId, ref: 'Competitor', required: true, index: true },
  productName: { type: String, required: true },
  price: { type: Number, required: true },
  unit: String,
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

const MarketAnalysisSchema = new Schema({
  region: { type: String, required: true, index: true },
  category: { type: String, required: true, index: true },
  date: { type: Date, required: true },
  metrics: {
    totalCompetitors: Number,
    avgPrice: Number,
    avgRating: Number,
    priceRange: { min: Number, max: Number },
    marketShare: Schema.Types.Mixed,
  },
  trends: [{
    metric: String,
    change: Number,
    direction: { type: String, enum: ['up', 'down'] },
  }],
  insights: [String],
}, { timestamps: true });

MarketAnalysisSchema.index({ region: 1, category: 1, date: -1 });

export const Competitor = mongoose.models.Competitor || mongoose.model<ICompetitor>('Competitor', CompetitorSchema);
export const CompetitorPrice = mongoose.models.CompetitorPrice || mongoose.model<ICompetitorPrice>('CompetitorPrice', CompetitorPriceSchema);
export const MarketAnalysis = mongoose.models.MarketAnalysis || mongoose.model<IMarketAnalysis>('MarketAnalysis', MarketAnalysisSchema);

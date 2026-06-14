import mongoose, { Schema } from 'mongoose';
import { ISearchAd } from '../types';

const SearchAdSchema = new Schema<ISearchAd>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'SearchCampaign',
      required: true,
      index: true,
    },
    headline: {
      type: String,
      required: true,
      trim: true,
      maxlength: 90,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    description2: {
      type: String,
      trim: true,
      maxlength: 180,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    displayUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 35,
    },
    finalUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'ended', 'pending'],
      default: 'pending',
    },
    adRank: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'search_ads',
  }
);

// Indexes
SearchAdSchema.index({ campaignId: 1, status: 1 });
SearchAdSchema.index({ adRank: -1 });
SearchAdSchema.index({ campaignId: 1, createdAt: -1 });

// Methods
SearchAdSchema.methods.isActive = function(): boolean {
  return this.status === 'active';
};

SearchAdSchema.methods.pause = function() {
  this.status = 'paused';
  return this.save();
};

SearchAdSchema.methods.resume = function() {
  this.status = 'active';
  return this.save();
};

SearchAdSchema.methods.updateRank = function(rank: number) {
  this.adRank = rank;
  return this.save();
};

// Static methods
SearchAdSchema.statics.findByCampaign = function(campaignId: string) {
  return this.find({ campaignId }).sort({ adRank: -1, createdAt: -1 });
};

SearchAdSchema.statics.findActiveByCampaign = function(campaignId: string) {
  return this.find({ campaignId, status: 'active' }).sort({ adRank: -1 });
};

SearchAdSchema.statics.countByCampaign = function(campaignId: string) {
  return this.countDocuments({ campaignId });
};

export const SearchAd = mongoose.model<ISearchAd>('SearchAd', SearchAdSchema);
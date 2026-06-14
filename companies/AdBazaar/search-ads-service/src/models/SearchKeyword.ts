import mongoose, { Schema } from 'mongoose';
import { ISearchKeyword, MatchType } from '../types';

const SearchKeywordSchema = new Schema<ISearchKeyword>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'SearchCampaign',
      required: true,
      index: true,
    },
    adGroupId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    term: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
    },
    matchType: {
      type: String,
      enum: ['exact', 'phrase', 'broad', 'modified_broad'] as MatchType[],
      required: true,
    },
    bid: {
      type: Number,
      required: true,
      min: 0.01,
    },
    qualityScore: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
    },
    estimatedCpc: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'pending'],
      default: 'pending',
    },
    searchVolume: {
      type: Number,
      default: 0,
    },
    competition: {
      type: String,
      enum: ['low', 'medium', 'high'],
    },
  },
  {
    timestamps: true,
    collection: 'search_keywords',
  }
);

// Indexes
SearchKeywordSchema.index({ campaignId: 1, term: 1 }, { unique: true });
SearchKeywordSchema.index({ campaignId: 1, status: 1 });
SearchKeywordSchema.index({ qualityScore: 1 });
SearchKeywordSchema.index({ bid: -1 });

// Virtual for effective CPC
SearchKeywordSchema.virtual('effectiveCpc').get(function() {
  return this.bid * (this.qualityScore / 10);
});

// Methods
SearchKeywordSchema.methods.updateQualityScore = function(score: number) {
  this.qualityScore = Math.max(1, Math.min(10, score));
  return this.save();
};

SearchKeywordSchema.methods.updateBid = function(newBid: number) {
  this.bid = Math.max(0.01, newBid);
  return this.save();
};

SearchKeywordSchema.methods.pause = function() {
  this.status = 'paused';
  return this.save();
};

SearchKeywordSchema.methods.resume = function() {
  this.status = 'active';
  return this.save();
};

// Static methods
SearchKeywordSchema.statics.findByCampaign = function(campaignId: string) {
  return this.find({ campaignId }).sort({ qualityScore: -1, bid: -1 });
};

SearchKeywordSchema.statics.findByTerm = function(term: string) {
  return this.findOne({ term: term.toLowerCase() });
};

SearchKeywordSchema.statics.findLowQuality = function(campaignId: string, threshold: number = 5) {
  return this.find({ campaignId, qualityScore: { $lt: threshold }, status: 'active' });
};

SearchKeywordSchema.statics.calculateAverageQualityScore = function(campaignId: string) {
  return this.aggregate([
    { $match: { campaignId: new mongoose.Types.ObjectId(campaignId), status: 'active' } },
    { $group: { _id: null, avgQualityScore: { $avg: '$qualityScore' } } },
  ]);
};

export const SearchKeyword = mongoose.model<ISearchKeyword>('SearchKeyword', SearchKeywordSchema);
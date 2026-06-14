import mongoose, { Document, Schema } from 'mongoose';

export interface ISearchResult {
  hashtags: string[];
  searchQuery: string;
  analyzedCount: number;
}

export interface ISearchResultDocument extends Document {
  hashtags: string[];
  searchQuery: string;
  analyzedCount: number;
  createdAt: Date;
}

const searchResultSchema = new Schema<ISearchResultDocument>(
  {
    hashtags: {
      type: [String],
      required: true,
    },
    searchQuery: {
      type: String,
      required: true,
      index: true,
    },
    analyzedCount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index - auto-delete after 24 hours
searchResultSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export const SearchResult = mongoose.model<ISearchResultDocument>('SearchResult', searchResultSchema);
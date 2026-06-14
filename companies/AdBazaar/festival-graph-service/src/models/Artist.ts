import mongoose, { Schema, Document } from 'mongoose';

export interface IArtist extends Document {
  _id: mongoose.Types.ObjectId;
  festivalId: mongoose.Types.ObjectId;
  name: string;
  stage?: string;
  genre: string[];
  popularity: number; // 0-100 score
  bio?: string;
  image?: string;
  socialLinks?: {
    website?: string;
    instagram?: string;
    twitter?: string;
    spotify?: string;
    youtube?: string;
  };
  performanceTime?: {
    start: Date;
    end?: Date;
  };
  fee?: number;
  currency?: string;
  verified: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ArtistSchema = new Schema<IArtist>(
  {
    festivalId: {
      type: Schema.Types.ObjectId,
      ref: 'Festival',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    stage: {
      type: String,
      maxlength: 100,
    },
    genre: {
      type: [String],
      default: [],
      index: true,
    },
    popularity: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    bio: {
      type: String,
      maxlength: 2000,
    },
    image: {
      type: String,
      maxlength: 500,
    },
    socialLinks: {
      website: String,
      instagram: String,
      twitter: String,
      spotify: String,
      youtube: String,
    },
    performanceTime: {
      start: {
        type: Date,
      },
      end: {
        type: Date,
      },
    },
    fee: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    verified: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
ArtistSchema.index({ festivalId: 1, name: 1 }, { unique: true });
ArtistSchema.index({ festivalId: 1, genre: 1 });
ArtistSchema.index({ popularity: -1 });

export const Artist = mongoose.model<IArtist>('Artist', ArtistSchema);
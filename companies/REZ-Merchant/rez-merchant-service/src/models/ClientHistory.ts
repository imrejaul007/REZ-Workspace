/**
 * Client History Model - Salon OS
 * Tracks client visit history, preferences, and engagement metrics
 */

import mongoose, { Schema, Types } from 'mongoose';

export interface IVisit {
  date: Date;
  service: string;
  staff: string;
  amount: number;
  rating?: number;
  notes?: string;
}

export interface IPreferences {
  preferredStaff: Types.ObjectId[];
  preferredTimes: string[];
  notes: string;
  allergies: string[];
  sensitiveInfo: string[];
}

export interface IClientHistory {
  clientId: Types.ObjectId;
  storeId: Types.ObjectId;
  visits: IVisit[];
  preferences: IPreferences;
  tags: string[];
  totalSpent: number;
  visitCount: number;
  lastVisit?: Date;
  avgRating?: number;
}

const visitSchema = new Schema<IVisit>(
  {
    date: {
      type: Date,
      required: true,
    },
    service: {
      type: String,
      required: true,
      trim: true,
    },
    staff: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const preferencesSchema = new Schema<IPreferences>(
  {
    preferredStaff: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Staff',
      },
    ],
    preferredTimes: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    allergies: [
      {
        type: String,
        trim: true,
      },
    ],
    sensitiveInfo: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { _id: false }
);

const clientHistorySchema = new Schema<IClientHistory>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: 'Client',
    },
    storeId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: 'Store',
    },
    visits: [visitSchema],
    preferences: {
      type: preferencesSchema,
      default: () => ({
        preferredStaff: [],
        preferredTimes: [],
        notes: '',
        allergies: [],
        sensitiveInfo: [],
      }),
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    visitCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastVisit: {
      type: Date,
    },
    avgRating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
clientHistorySchema.index({ storeId: 1, clientId: 1 }, { unique: true });
clientHistorySchema.index({ storeId: 1, totalSpent: -1 });
clientHistorySchema.index({ storeId: 1, visitCount: -1 });
clientHistorySchema.index({ storeId: 1, lastVisit: -1 });
clientHistorySchema.index({ tags: 1 });

// Pre-save hook to calculate aggregate metrics
clientHistorySchema.pre('save', function (next) {
  if (this.visits && this.visits.length > 0) {
    // Calculate total spent
    this.totalSpent = this.visits.reduce((sum, visit) => sum + (visit.amount || 0), 0);

    // Update visit count
    this.visitCount = this.visits.length;

    // Get last visit date
    const sortedVisits = [...this.visits].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    this.lastVisit = sortedVisits[0]?.date;

    // Calculate average rating
    const ratedVisits = this.visits.filter((v) => v.rating !== undefined && v.rating !== null);
    if (ratedVisits.length > 0) {
      const totalRating = ratedVisits.reduce((sum, visit) => sum + (visit.rating || 0), 0);
      this.avgRating = Math.round((totalRating / ratedVisits.length) * 10) / 10;
    }
  }
  next();
});

export const ClientHistory =
  mongoose.models.ClientHistory ||
  mongoose.model<IClientHistory>('ClientHistory', clientHistorySchema, 'client_histories');

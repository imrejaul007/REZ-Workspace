import mongoose, { Schema, Document, Model } from 'mongoose';
import { ICalendarConnection, CalendarProvider } from '../types';

export interface CalendarConnectionDocument extends Omit<ICalendarConnection, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const CalendarConnectionSchema = new Schema<CalendarConnectionDocument>(
  {
    connectionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ['google', 'outlook', 'apple', 'corpperks'],
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
    tokenExpiry: {
      type: Date,
      required: true,
    },
    calendarId: {
      type: String,
    },
    calendarName: {
      type: String,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastSyncedAt: {
      type: Date,
    },
    syncToken: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'calendar_connections',
  }
);

// Compound indexes
CalendarConnectionSchema.index({ userId: 1, provider: 1 });
CalendarConnectionSchema.index({ userId: 1, isActive: 1 });
CalendarConnectionSchema.index({ companyId: 1, isActive: 1 });

// Pre-save middleware to ensure only one primary per user/provider
CalendarConnectionSchema.pre('save', async function (this: CalendarConnectionDocument) {
  if (this.isPrimary && this.isActive) {
    await this.constructor.updateMany(
      {
        userId: this.userId,
        provider: this.provider,
        _id: { $ne: this._id },
      },
      { isPrimary: false }
    );
  }
});

// Static method to find active connection
CalendarConnectionSchema.statics.findActiveConnection = async function (
  userId: string,
  provider: CalendarProvider
): Promise<CalendarConnectionDocument | null> {
  return this.findOne({
    userId,
    provider,
    isActive: true,
    isPrimary: true,
  });
};

// Static method to find all user connections
CalendarConnectionSchema.statics.findUserConnections = async function (
  userId: string
): Promise<CalendarConnectionDocument[]> {
  return this.find({ userId, isActive: true }).sort({ isPrimary: -1, createdAt: -1 });
};

// Static method to find expired tokens
CalendarConnectionSchema.statics.findExpiredTokens = async function (): Promise<CalendarConnectionDocument[]> {
  return this.find({
    isActive: true,
    tokenExpiry: { $lte: new Date() },
  });
};

export const CalendarConnection: Model<CalendarConnectionDocument> = mongoose.model<CalendarConnectionDocument>(
  'CalendarConnection',
  CalendarConnectionSchema
);

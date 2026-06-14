import mongoose, { Document, Schema } from 'mongoose';

export interface IPreference extends Document {
  userId: string;
  channels: {
    email: {
      enabled: boolean;
      frequency: 'realtime' | 'daily' | 'weekly' | 'monthly';
      quietHours?: {
        start: string;
        end: string;
        timezone: string;
      };
    };
    sms: {
      enabled: boolean;
      quietHours?: {
        start: string;
        end: string;
        timezone: string;
      };
    };
    push: {
      enabled: boolean;
      sound: boolean;
      vibration: boolean;
    };
    inApp: {
      enabled: boolean;
      sound: boolean;
    };
  };
  categories: {
    [key: string]: {
      enabled: boolean;
      channels: string[];
    };
  };
  marketing: {
    enabled: boolean;
    frequency: 'realtime' | 'daily' | 'weekly' | 'monthly';
    categories: string[];
  };
  transactional: {
    enabled: boolean;
    types: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const PreferenceSchema = new Schema<IPreference>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    channels: {
      email: {
        enabled: { type: Boolean, default: true },
        frequency: { type: String, enum: ['realtime', 'daily', 'weekly', 'monthly'], default: 'realtime' },
        quietHours: {
          start: String,
          end: String,
          timezone: { type: String, default: 'UTC' },
        },
      },
      sms: {
        enabled: { type: Boolean, default: true },
        quietHours: {
          start: String,
          end: String,
          timezone: { type: String, default: 'UTC' },
        },
      },
      push: {
        enabled: { type: Boolean, default: true },
        sound: { type: Boolean, default: true },
        vibration: { type: Boolean, default: true },
      },
      inApp: {
        enabled: { type: Boolean, default: true },
        sound: { type: Boolean, default: true },
      },
    },
    categories: {
      type: Map,
      of: new Schema({
        enabled: { type: Boolean, default: true },
        channels: [String],
      }, { _id: false }),
 default: {},
    },
    marketing: {
      enabled: { type: Boolean, default: true },
      frequency: { type: String, enum: ['realtime', 'daily', 'weekly', 'monthly'], default: 'weekly' },
      categories: [String],
    },
    transactional: {
      enabled: { type: Boolean, default: true },
      types: [String],
    },
  },
  {
    timestamps: true,
  }
);

PreferenceSchema.index({ userId: 1 });

export const Preference = mongoose.model<IPreference>('Preference', PreferenceSchema);
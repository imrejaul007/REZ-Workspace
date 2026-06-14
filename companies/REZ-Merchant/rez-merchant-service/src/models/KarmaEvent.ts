import mongoose, { Schema } from 'mongoose';

const qrCodesSchema = new Schema(
  {
    checkIn: { type: String },
    checkOut: { type: String },
  },
  { _id: false },
);

const schema = new Schema(
  {
    merchantEventId: { type: Schema.Types.Mixed, required: true },
    ngoId: { type: Schema.Types.Mixed },
    category: {
      type: String,
      enum: ['environment', 'food', 'health', 'education', 'community'],
    },
    impactUnit: { type: String }, // 'trees' | 'meals' | 'hours'
    impactMultiplier: { type: Number, default: 1 },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    expectedDurationHours: { type: Number },
    baseKarmaPerHour: { type: Number },
    maxKarmaPerEvent: { type: Number },
    qrCodes: { type: qrCodesSchema, default: () => ({}) },
    gpsRadius: { type: Number, default: 100 }, // meters
    maxVolunteers: { type: Number, default: 50 },
    confirmedVolunteers: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
      default: 'draft',
    },
    karmaEnabled: { type: Boolean, default: true },
  },
  { strict: true, strictQuery: true, timestamps: true, collection: 'karmaevents' },
);

schema.index({ merchantEventId: 1 });
schema.index({ ngoId: 1, status: 1 });
schema.index({ merchantEventId: 1, status: 1 });

export const KarmaEvent =
  mongoose.models.KarmaEvent || mongoose.model('KarmaEvent', schema);

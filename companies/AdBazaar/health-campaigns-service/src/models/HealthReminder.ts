import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type ReminderType = 'medication' | 'appointment' | 'vaccination' | 'checkup';
export type ReminderStatus = 'pending' | 'sent' | 'acknowledged' | 'snoozed' | 'failed';

export interface ITiming {
  advanceMinutes?: number; // Minutes before event (e.g., 30 min before appointment)
  repeatCount: number;     // Number of times to repeat
  repeatInterval: number;  // Interval in minutes between repeats
}

export interface IHealthReminder extends Document {
  id: string;
  reminderType: ReminderType;
  patientId: string;
  patientName?: string;
  familyIds: string[];
  familyNotify: boolean;
  channels: string[];
  eventDetails: {
    title: string;
    description?: string;
    scheduledTime: Date;
    location?: string;
    medicationName?: string;
    dosage?: string;
  };
  timing: ITiming;
  status: ReminderStatus;
  sentCount: number;
  lastSentAt?: Date;
  nextSendAt: Date;
  acknowledgedAt?: Date;
  snoozedUntil?: Date;
  engagementScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const TimingSchema = new Schema<ITiming>(
  {
    advanceMinutes: { type: Number, min: 0 },
    repeatCount: { type: Number, default: 1, min: 1 },
    repeatInterval: { type: Number, default: 60, min: 1 }, // minutes
  },
  { _id: false }
);

const EventDetailsSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    scheduledTime: { type: Date, required: true },
    location: { type: String },
    medicationName: { type: String },
    dosage: { type: String },
  },
  { _id: false }
);

const HealthReminderSchema = new Schema<IHealthReminder>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => `HR-${uuidv4().substring(0, 8).toUpperCase()}`,
    },
    reminderType: {
      type: String,
      enum: ['medication', 'appointment', 'vaccination', 'checkup'],
      required: true,
      index: true,
    },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String },
    familyIds: [{ type: String }],
    familyNotify: { type: Boolean, default: false },
    channels: [{
      type: String,
      enum: ['whatsapp', 'sms', 'push', 'email'],
      required: true,
    }],
    eventDetails: { type: EventDetailsSchema, required: true },
    timing: { type: TimingSchema, default: () => ({ repeatCount: 1, repeatInterval: 60 }) },
    status: {
      type: String,
      enum: ['pending', 'sent', 'acknowledged', 'snoozed', 'failed'],
      default: 'pending',
      index: true,
    },
    sentCount: { type: Number, default: 0 },
    lastSentAt: { type: Date },
    nextSendAt: { type: Date, required: true, index: true },
    acknowledgedAt: { type: Date },
    snoozedUntil: { type: Date },
    engagementScore: { type: Number, default: 0, min: 0, max: 100 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient querying
HealthReminderSchema.index({ patientId: 1, status: 1 });
HealthReminderSchema.index({ nextSendAt: 1, status: 1 });
HealthReminderSchema.index({ reminderType: 1, status: 1 });
HealthReminderSchema.index({ familyIds: 1 });

export const HealthReminder = mongoose.model<IHealthReminder>('HealthReminder', HealthReminderSchema);

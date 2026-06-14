import mongoose, { Schema, Document } from 'mongoose';
import { IInboxSettings } from '../types';

export interface InboxSettingsDocument extends Omit<IInboxSettings, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const AssignmentRuleSchema = new Schema({
  id: { type: String, required: true },
  keyword: { type: String, required: true },
  assignee: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
}, { _id: false });

const NotificationSettingsSchema = new Schema({
  email: { type: Boolean, default: true },
  push: { type: Boolean, default: true },
  slack: { type: Boolean, default: false },
}, { _id: false });

const WorkingHoursSchema = new Schema({
  enabled: { type: Boolean, default: false },
  timezone: { type: String, default: 'Asia/Kolkata' },
  startHour: { type: Number, default: 9 },
  endHour: { type: Number, default: 18 },
  daysOff: [{ type: Number }], // 0 = Sunday, 6 = Saturday
}, { _id: false });

const SLASettingsSchema = new Schema({
  firstResponseTime: { type: Number, default: 300 }, // seconds
  resolutionTime: { type: Number, default: 3600 }, // seconds
  warningThreshold: { type: Number, default: 0.8 }, // percentage
}, { _id: false });

const InboxSettingsSchema = new Schema<InboxSettingsDocument>({
  accountId: { type: String, required: true, unique: true, index: true },
  autoAssign: { type: Boolean, default: false },
  assignmentRules: [AssignmentRuleSchema],
  notificationSettings: { type: NotificationSettingsSchema, default: () => ({}) },
  workingHours: { type: WorkingHoursSchema, default: () => ({}) },
  slaSettings: { type: SLASettingsSchema, default: () => ({}) },
  sentimentThreshold: { type: Number, default: 0.5 },
}, {
  timestamps: true,
});

// Virtual for id field
InboxSettingsSchema.virtual('id').get(function(this: InboxSettingsDocument) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON
InboxSettingsSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const InboxSettings = mongoose.model<InboxSettingsDocument>('InboxSettings', InboxSettingsSchema);

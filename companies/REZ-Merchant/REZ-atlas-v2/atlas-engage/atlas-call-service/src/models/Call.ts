/**
 * REZ Atlas v2 - Call Service MongoDB Models
 * Call Task Management & Logging
 */

import mongoose, { Schema, Document } from 'mongoose';

// ================================================
// CallTask Schema
// ================================================
export interface ICallTask extends Document {
  contactId: string;
  contactName: string;
  phone: string;
  purpose: string;
  scheduledAt: Date;
  status: 'scheduled' | 'in-progress' | 'completed' | 'missed' | 'no-answer';
  outcome: string | null;
  notes: string | null;
  duration: number | null;
  recording: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const CallTaskSchema = new Schema<ICallTask>({
  contactId: { type: String, required: true, index: true },
  contactName: { type: String, required: true },
  phone: { type: String, required: true },
  purpose: { type: String, default: 'General' },
  scheduledAt: { type: Date, required: true, index: true },
  status: { type: String, enum: ['scheduled', 'in-progress', 'completed', 'missed', 'no-answer'], default: 'scheduled', index: true },
  outcome: { type: String, default: null },
  notes: { type: String, default: null },
  duration: { type: Number, default: null },
  recording: { type: String, default: null },
}, { timestamps: true });

CallTaskSchema.index({ contactId: 1, status: 1 });
CallTaskSchema.index({ scheduledAt: 1, status: 1 });

export const CallTask = mongoose.model<ICallTask>('CallTask', CallTaskSchema);

// ================================================
// CallLog Schema
// ================================================
export interface ICallLog extends Document {
  taskId: string;
  contactId: string;
  direction: 'outbound' | 'inbound';
  startTime: Date;
  endTime: Date | null;
  duration: number;
  status: 'connected' | 'voicemail' | 'no-answer' | 'busy';
  createdAt: Date;
}

const CallLogSchema = new Schema<ICallLog>({
  taskId: { type: String, index: true },
  contactId: { type: String, required: true, index: true },
  direction: { type: String, enum: ['outbound', 'inbound'], required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, default: null },
  duration: { type: Number, default: 0 },
  status: { type: String, enum: ['connected', 'voicemail', 'no-answer', 'busy'], required: true },
}, { timestamps: true });

CallLogSchema.index({ contactId: 1, createdAt: -1 });
CallLogSchema.index({ taskId: 1, createdAt: -1 });

export const CallLog = mongoose.model<ICallLog>('CallLog', CallLogSchema);
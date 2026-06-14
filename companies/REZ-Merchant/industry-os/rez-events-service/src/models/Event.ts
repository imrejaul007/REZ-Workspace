import mongoose, { Document, Schema } from 'mongoose';

export enum EventType {
  WEDDING = 'WEDDING',
  CORPORATE = 'CORPORATE',
  EXHIBITION = 'EXHIBITION',
  CONCERT = 'CONCERT',
  PARTY = 'PARTY',
  CONFERENCE = 'CONFERENCE'
}

export enum EventStatus {
  PLANNING = 'PLANNING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface IEvent extends Document {
  eventId: string;
  merchantId: string;
  name: string;
  type: EventType;
  description: string;
  venueId?: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  expectedGuests: number;
  confirmedGuests: number;
  status: EventStatus;
  budget: number;
  spent: number;
  category?: string;
  tags: string[];
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>({
  eventId: { type: String, required: true, unique: true, index: true },
  merchantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: EventType, required: true, index: true },
  description: { type: String, required: true },
  venueId: { type: String, index: true },
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  expectedGuests: { type: Number, default: 0 },
  confirmedGuests: { type: Number, default: 0 },
  status: { type: String, enum: EventStatus, default: EventStatus.PLANNING, index: true },
  budget: { type: Number, default: 0 },
  spent: { type: Number, default: 0 },
  category: { type: String },
  tags: [{ type: String }],
  clientName: { type: String },
  clientPhone: { type: String },
  clientEmail: { type: String }
}, {
  timestamps: true,
  collection: 'events'
});

// Compound indexes for common queries
EventSchema.index({ merchantId: 1, status: 1 });
EventSchema.index({ merchantId: 1, type: 1 });
EventSchema.index({ startDate: 1, endDate: 1 });
EventSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Virtual for remaining budget
EventSchema.virtual('remainingBudget').get(function() {
  return this.budget - this.spent;
});

// Virtual for guest confirmation rate
EventSchema.virtual('confirmationRate').get(function() {
  return this.expectedGuests > 0 ? (this.confirmedGuests / this.expectedGuests) * 100 : 0;
});

// Virtual for is past
EventSchema.virtual('isPast').get(function() {
  return new Date() > this.endDate;
});

export const Event = mongoose.model<IEvent>('Event', EventSchema);
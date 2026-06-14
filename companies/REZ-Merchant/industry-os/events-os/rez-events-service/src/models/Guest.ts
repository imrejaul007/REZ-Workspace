import mongoose, { Document, Schema } from 'mongoose';

export enum GuestCategory {
  VIP = 'VIP',
  INVITATION = 'INVITATION',
  CONFIRMED = 'CONFIRMED',
  RSVP_PENDING = 'RSVP_PENDING'
}

export enum GuestStatus {
  PENDING = 'PENDING',
  INVITED = 'INVITED',
  CONFIRMED = 'CONFIRMED',
  ATTENDED = 'ATTENDED',
  ABSENT = 'ABSENT'
}

export interface IGuest extends Document {
  guestId: string;
  eventId: string;
  merchantId: string;
  name: string;
  phone?: string;
  email?: string;
  category: GuestCategory;
  plusOnes: number;
  dietaryRestrictions: string[];
  tableNumber?: number;
  seatNumber?: number;
  status: GuestStatus;
  reminderSent: boolean;
  notes?: string;
  createdAt: Date;
}

const GuestSchema = new Schema<IGuest>({
  guestId: { type: String, required: true, unique: true, index: true },
  eventId: { type: String, required: true, index: true },
  merchantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  category: { type: String, enum: GuestCategory, required: true, index: true },
  plusOnes: { type: Number, default: 0 },
  dietaryRestrictions: [{ type: String }],
  tableNumber: { type: Number },
  seatNumber: { type: Number },
  status: { type: String, enum: GuestStatus, default: GuestStatus.PENDING, index: true },
  reminderSent: { type: Boolean, default: false },
  notes: { type: String }
}, {
  timestamps: true,
  collection: 'guests'
});

// Compound indexes for common queries
GuestSchema.index({ merchantId: 1, eventId: 1 });
GuestSchema.index({ eventId: 1, category: 1 });
GuestSchema.index({ eventId: 1, status: 1 });
GuestSchema.index({ eventId: 1, tableNumber: 1 });
GuestSchema.index({ name: 'text', email: 'text' });

// Virtual for total party size
GuestSchema.virtual('partySize').get(function() {
  return 1 + this.plusOnes;
});

// Virtual for is attending
GuestSchema.virtual('isAttending').get(function() {
  return this.status === GuestStatus.CONFIRMED || this.status === GuestStatus.ATTENDED;
});

export const Guest = mongoose.model<IGuest>('Guest', GuestSchema);
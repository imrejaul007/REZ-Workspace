import mongoose, { Document, Schema } from 'mongoose';

export enum TicketType {
  GENERAL = 'GENERAL',
  VIP = 'VIP',
  EARLY_BIRD = 'EARLY_BIRD'
}

export enum TicketStatus {
  ACTIVE = 'ACTIVE',
  SOLD_OUT = 'SOLD_OUT',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export interface ITicket extends Document {
  ticketId: string;
  eventId: string;
  merchantId: string;
  type: TicketType;
  price: number;
  totalQty: number;
  soldQty: number;
  availableQty: number;
  validFrom: Date;
  validUntil: Date;
  benefits: string[];
  status: TicketStatus;
  createdAt: Date;
}

const TicketSchema = new Schema<ITicket>({
  ticketId: { type: String, required: true, unique: true, index: true },
  eventId: { type: String, required: true, index: true },
  merchantId: { type: String, required: true, index: true },
  type: { type: String, enum: TicketType, required: true, index: true },
  price: { type: Number, required: true },
  totalQty: { type: Number, required: true },
  soldQty: { type: Number, default: 0 },
  availableQty: { type: Number, required: true },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  benefits: [{ type: String }],
  status: { type: String, enum: TicketStatus, default: TicketStatus.ACTIVE, index: true }
}, {
  timestamps: true,
  collection: 'tickets'
});

// Compound indexes for common queries
TicketSchema.index({ merchantId: 1, eventId: 1 });
TicketSchema.index({ eventId: 1, type: 1 });
TicketSchema.index({ eventId: 1, status: 1 });

// Virtual for sold percentage
TicketSchema.virtual('soldPercentage').get(function() {
  return this.totalQty > 0 ? (this.soldQty / this.totalQty) * 100 : 0;
});

// Virtual for is available
TicketSchema.virtual('isAvailable').get(function() {
  return this.status === TicketStatus.ACTIVE && this.availableQty > 0;
});

// Virtual for revenue
TicketSchema.virtual('revenue').get(function() {
  return this.soldQty * this.price;
});

export const Ticket = mongoose.model<ITicket>('Ticket', TicketSchema);
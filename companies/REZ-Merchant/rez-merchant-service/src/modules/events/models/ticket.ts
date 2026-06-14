/**
 * Event Ticket Model
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEventTicket extends Document {
  eventId: Types.ObjectId;
  ticketTypeId: string;
  ticketType: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  quantity: number;
  totalAmount: number;
  qrCode: string;
  seatId?: string;
  status: 'active' | 'used' | 'cancelled' | 'refunded';
  purchaseDate: Date;
  usedAt?: Date;
  createdAt: Date;
}

const EventTicketSchema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  ticketTypeId: { type: String, required: true },
  ticketType: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: String,
  userPhone: { type: String, required: true },
  quantity: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  qrCode: { type: String, required: true, unique: true },
  seatId: String,
  status: {
    type: String,
    enum: ['active', 'used', 'cancelled', 'refunded'],
    default: 'active'
  },
  purchaseDate: { type: Date, default: Date.now },
  usedAt: Date
}, { timestamps: true });

EventTicketSchema.index({ eventId: 1, status: 1 });
EventTicketSchema.index({ qrCode: 1 });

export const EventTicket = mongoose.model<IEventTicket>('EventTicket', EventTicketSchema);

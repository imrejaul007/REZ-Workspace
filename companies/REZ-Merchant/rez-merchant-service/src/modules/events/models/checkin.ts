/**
 * Event Check-in Model
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEventCheckin extends Document {
  eventId: Types.ObjectId;
  ticketId: Types.ObjectId;
  qrCode: string;
  attendeeName: string;
  attendeePhone: string;
  checkedInAt?: Date;
  checkedInBy?: Types.ObjectId;
  status: 'active' | 'checked_in' | 'cancelled';
  createdAt: Date;
}

const EventCheckinSchema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  ticketId: { type: Schema.Types.ObjectId, ref: 'EventTicket', required: true },
  qrCode: { type: String, required: true },
  attendeeName: { type: String, required: true },
  attendeePhone: { type: String, required: true },
  checkedInAt: Date,
  checkedInBy: { type: Schema.Types.ObjectId, ref: 'MerchantUser' },
  status: {
    type: String,
    enum: ['active', 'checked_in', 'cancelled'],
    default: 'active'
  }
}, { timestamps: true });

EventCheckinSchema.index({ eventId: 1, status: 1 });
EventCheckinSchema.index({ qrCode: 1 });

export const EventCheckin = mongoose.model<IEventCheckin>('EventCheckin', EventCheckinSchema);

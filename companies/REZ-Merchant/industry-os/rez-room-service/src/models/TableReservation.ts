import mongoose, { Schema, Document } from 'mongoose';

export interface ITableReservation extends Document {
  guestId: string;
  guestName: string;
  roomNumber: string;
  hotelId: string;
  date: Date;
  time: string;
  partySize: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const TableReservationSchema = new Schema<ITableReservation>(
  {
    guestId: { type: String, required: true, index: true },
    guestName: { type: String, required: true },
    roomNumber: { type: String, required: true },
    hotelId: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    partySize: { type: Number, required: true, min: 1, max: 20 },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'completed'],
      default: 'confirmed',
    },
  },
  { timestamps: true }
);

TableReservationSchema.index({ hotelId: 1, date: 1 });
TableReservationSchema.index({ guestId: 1 });

export const TableReservation = mongoose.model<ITableReservation>('TableReservation', TableReservationSchema);

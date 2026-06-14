import mongoose, { Document, Schema, Types } from 'mongoose';

export type ShiftStatus = 'scheduled' | 'confirmed' | 'completed' | 'absent';

export interface IShift extends Document {
  _id: Types.ObjectId;
  merchantId: string;
  staffId: Types.ObjectId;
  date: Date;
  startTime: string; // "09:00"
  endTime: string; // "18:00"
  role: string;
  status: ShiftStatus;
  breakMinutes: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShiftSchema = new Schema<IShift>(
  {
    merchantId: {
      type: String,
      required: true,
      index: true,
    },
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/, // HH:MM format
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/, // HH:MM format
    },
    role: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'absent'],
      default: 'scheduled',
    },
    breakMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient scheduling queries
ShiftSchema.index({ merchantId: 1, date: 1 });
ShiftSchema.index({ merchantId: 1, date: 1, status: 1 });
ShiftSchema.index({ staffId: 1, date: 1 });

// Virtual to calculate shift duration in hours
ShiftSchema.virtual('durationHours').get(function () {
  const [startH, startM] = this.startTime.split(':').map(Number);
  const [endH, endM] = this.endTime.split(':').map(Number);

  let hours = endH - startH;
  let minutes = endM - startM;

  if (minutes < 0) {
    hours -= 1;
    minutes += 60;
  }

  // Subtract break time
  hours -= Math.floor(this.breakMinutes / 60);
  minutes -= this.breakMinutes % 60;

  return hours + minutes / 60;
});

// Virtual to check if shift is currently active
ShiftSchema.virtual('isActive').get(function () {
  const now = new Date();
  const shiftDate = new Date(this.date);
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return shiftDate.toDateString() === now.toDateString() &&
    currentTime >= this.startTime &&
    currentTime <= this.endTime;
});

// Ensure virtuals are included in JSON
ShiftSchema.set('toJSON', { virtuals: true });
ShiftSchema.set('toObject', { virtuals: true });

export const Shift = mongoose.model<IShift>('Shift', ShiftSchema);

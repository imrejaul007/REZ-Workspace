import mongoose, { Document, Schema } from 'mongoose';

// Dose status interface
export type DoseStatus = 'taken' | 'missed' | 'skipped' | 'delayed' | 'pending';

// Dose record document interface
export interface IDoseRecord extends Document {
  id: string;
  medicationId: string;
  profileId: string;
  scheduledTime: Date;
  scheduledTimeString: string; // "08:00"
  takenTime?: Date;
  status: DoseStatus;
  quantity: number;
  method: 'manual' | 'auto' | 'partial';
  notes?: string;
  sideEffects?: string;
  skipReason?: string;
  delayMinutes?: number;
  adherenceWindow: {
    early: number; // minutes before scheduled
    late: number;  // minutes after scheduled
  };
  createdAt: Date;
  updatedAt: Date;
}

// Dose record schema
const DoseRecordSchema = new Schema<IDoseRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    medicationId: { type: String, required: true, index: true },
    profileId: { type: String, required: true, index: true },
    scheduledTime: { type: Date, required: true, index: true },
    scheduledTimeString: { type: String, required: true }, // "08:00"
    takenTime: Date,
    status: {
      type: String,
      enum: ['taken', 'missed', 'skipped', 'delayed', 'pending'],
      required: true
    },
    quantity: { type: Number, required: true, min: 1 },
    method: {
      type: String,
      enum: ['manual', 'auto', 'partial'],
      default: 'manual'
    },
    notes: String,
    sideEffects: String,
    skipReason: String,
    delayMinutes: Number,
    adherenceWindow: {
      early: { type: Number, default: 30 }, // 30 minutes before
      late: { type: Number, default: 120 } // 2 hours after
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes for efficient queries
DoseRecordSchema.index({ medicationId: 1, scheduledTime: 1 });
DoseRecordSchema.index({ profileId: 1, scheduledTime: 1 });
DoseRecordSchema.index({ profileId: 1, status: 1 });
DoseRecordSchema.index({ medicationId: 1, status: 1 });

export const DoseRecord = mongoose.model<IDoseRecord>('DoseRecord', DoseRecordSchema);

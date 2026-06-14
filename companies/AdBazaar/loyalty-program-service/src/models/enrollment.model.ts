import mongoose, { Document, Schema } from 'mongoose';

export interface IEnrollment extends Document {
  enrollmentId: string;
  programId: string;
  userId: string;
  status: 'active' | 'inactive' | 'expired' | 'cancelled';
  currentTier?: string;
  pointsBalance: number;
  lifetimePoints: number;
  pointsEarned: number;
  pointsRedeemed: number;
  currentStreak?: number;
  longestStreak?: number;
  lastActivityAt?: Date;
  enrolledAt: Date;
  tierUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>({
  enrollmentId: { type: String, required: true, unique: true },
  programId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'cancelled'],
    default: 'active'
  },
  currentTier: String,
  pointsBalance: { type: Number, default: 0 },
  lifetimePoints: { type: Number, default: 0 },
  pointsEarned: { type: Number, default: 0 },
  pointsRedeemed: { type: Number, default: 0 },
  currentStreak: Number,
  longestStreak: Number,
  lastActivityAt: Date,
  enrolledAt: { type: Date, default: Date.now },
  tierUpdatedAt: Date
}, { timestamps: true });

enrollmentSchema.index({ enrollmentId: 1 });
enrollmentSchema.index({ programId: 1, userId: 1 }, { unique: true });
enrollmentSchema.index({ userId: 1 });
enrollmentSchema.index({ pointsBalance: -1 });

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
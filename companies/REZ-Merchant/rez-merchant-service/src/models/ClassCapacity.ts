import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IClassCapacity extends Document {
  classId: Types.ObjectId;
  storeId: Types.ObjectId;
  merchantId: Types.ObjectId;
  maxCapacity: number;
  currentEnrollment: number;
  waitlistEnabled: boolean;
  waitlistLimit: number;
  waitlistCount: number;
  autoNotify: boolean;
  enrolledMembers: Types.ObjectId[];
  waitlistMembers: Array<{
    memberId: Types.ObjectId;
    joinedAt: Date;
    position: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ClassCapacitySchema = new Schema<IClassCapacity>(
  {
    classId: { type: Schema.Types.ObjectId, required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, required: true, index: true },
    merchantId: { type: Schema.Types.ObjectId, required: true, index: true },
    maxCapacity: { type: Number, required: true, default: 10, min: 1 },
    currentEnrollment: { type: Number, default: 0, min: 0 },
    waitlistEnabled: { type: Boolean, default: false },
    waitlistLimit: { type: Number, default: 0, min: 0 },
    waitlistCount: { type: Number, default: 0, min: 0 },
    autoNotify: { type: Boolean, default: true },
    enrolledMembers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    waitlistMembers: [
      {
        memberId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        joinedAt: { type: Date, default: Date.now },
        position: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
ClassCapacitySchema.index({ merchantId: 1, storeId: 1 });
ClassCapacitySchema.index({ classId: 1, merchantId: 1 }, { unique: true });

// Pre-save hook to sync currentEnrollment with enrolledMembers array length
ClassCapacitySchema.pre('save', function (next) {
  if (this.isModified('enrolledMembers')) {
    this.currentEnrollment = this.enrolledMembers.length;
  }
  if (this.isModified('waitlistMembers')) {
    this.waitlistCount = this.waitlistMembers.length;
  }
  next();
});

export const ClassCapacity = mongoose.model<IClassCapacity>('ClassCapacity', ClassCapacitySchema);

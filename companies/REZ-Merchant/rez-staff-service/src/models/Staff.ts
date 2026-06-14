import mongoose, { Document, Schema, Types } from 'mongoose';

export type StaffRole = 'manager' | 'chef' | 'waiter' | 'cashier' | 'kitchen' | 'delivery';
export type StaffStatus = 'active' | 'inactive' | 'on_leave';

export interface IStaff extends Document {
  _id: Types.ObjectId;
  merchantId: string;
  employeeId: string;
  name: string;
  phone: string;
  email?: string;
  role: StaffRole;
  status: StaffStatus;
  hireDate: Date;
  salary: number;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema = new Schema<IStaff>(
  {
    merchantId: {
      type: String,
      required: true,
      index: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ['manager', 'chef', 'waiter', 'cashier', 'kitchen', 'delivery'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave'],
      default: 'active',
    },
    hireDate: {
      type: Date,
      required: true,
    },
    salary: {
      type: Number,
      required: true,
      min: 0,
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
StaffSchema.index({ merchantId: 1, role: 1 });
StaffSchema.index({ merchantId: 1, status: 1 });

// Virtual for full-time tenure
StaffSchema.virtual('tenureMonths').get(function () {
  const now = new Date();
  const months = (now.getFullYear() - this.hireDate.getFullYear()) * 12 +
    (now.getMonth() - this.hireDate.getMonth());
  return months;
});

// Ensure virtuals are included in JSON
StaffSchema.set('toJSON', { virtuals: true });
StaffSchema.set('toObject', { virtuals: true });

export const Staff = mongoose.model<IStaff>('Staff', StaffSchema);

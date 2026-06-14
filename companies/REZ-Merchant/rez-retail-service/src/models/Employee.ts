import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEmployee extends Document {
  employeeId: string;
  name: string;
  phone: string;
  email: string;
  role: 'manager' | 'cashier' | 'stockist' | 'security' | 'supervisor';
  storeId: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ['manager', 'cashier', 'stockist', 'security', 'supervisor'],
      required: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
EmployeeSchema.index({ employeeId: 1 }, { unique: true });
EmployeeSchema.index({ phone: 1 });
EmployeeSchema.index({ storeId: 1 });
EmployeeSchema.index({ role: 1 });
EmployeeSchema.index({ isActive: 1, storeId: 1 });

export const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);
export default Employee;
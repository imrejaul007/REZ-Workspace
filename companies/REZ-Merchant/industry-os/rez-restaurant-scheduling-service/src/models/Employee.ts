/**
 * Employee Model
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployee extends Document {
  employeeId: string;
  merchantId: string;
  restaurantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'manager' | 'chef' | 'server' | 'host' | 'bartender' | 'dishwasher' | 'cashier';
  department?: string;
  hourlyRate: number;
  overtimeRate: number;
  hireDate: Date;
  status: 'active' | 'inactive' | 'terminated';
  skills: string[];
  maxHoursPerWeek: number;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>({
  employeeId: { type: String, required: true, unique: true },
  merchantId: { type: String, required: true, index: true },
  restaurantId: { type: String, required: true, index: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ['manager', 'chef', 'server', 'host', 'bartender', 'dishwasher', 'cashier']
  },
  department: String,
  hourlyRate: { type: Number, required: true },
  overtimeRate: { type: Number, default: 1.5 },
  hireDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'inactive', 'terminated'], default: 'active' },
  skills: [String],
  maxHoursPerWeek: { type: Number, default: 40 },
}, { timestamps: true });

employeeSchema.index({ merchantId: 1, restaurantId: 1, status: 1 });

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);

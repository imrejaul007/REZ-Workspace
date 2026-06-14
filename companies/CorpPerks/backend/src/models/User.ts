import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, UserRole } from '../types/index.js';

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String },
    avatar: { type: String },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'hr_manager', 'manager', 'employee'],
      default: 'employee',
    },
    tenantId: { type: String, required: true, index: true },
    employeeId: { type: String },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    emailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ email: 1, tenantId: 1 }, { unique: true });
userSchema.index({ tenantId: 1, role: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

export const User = mongoose.model<IUser>('User', userSchema);

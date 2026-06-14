import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMerchantUser extends Document {
  merchantId: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'owner' | 'manager' | 'staff' | 'cashier' | 'viewer';
  permissions: string[];
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  failedLoginAttempts: number;
  accountLockedUntil?: Date;
  lastLoginAt?: Date;
  lastLoginIP?: string;
  invitedBy?: Types.ObjectId;
  inviteToken?: string;
  inviteExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantUserSchema = new Schema<IMerchantUser>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: String,
    role: { type: String, enum: ['owner', 'manager', 'staff', 'cashier', 'viewer'], default: 'staff' },
    permissions: [String],
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    avatar: String,
    failedLoginAttempts: { type: Number, default: 0 },
    accountLockedUntil: Date,
    lastLoginAt: Date,
    lastLoginIP: String,
    invitedBy: { type: Schema.Types.ObjectId, ref: 'Merchant' },
    inviteToken: String,
    inviteExpiry: Date,
  },
  { timestamps: true },
);

MerchantUserSchema.index({ merchantId: 1, email: 1 }, { unique: true });
// DB-INDEX: Added status index for merchant user filtering by status
MerchantUserSchema.index({ merchantId: 1, status: 1 });

export const MerchantUser = mongoose.model<IMerchantUser>('MerchantUser', MerchantUserSchema);

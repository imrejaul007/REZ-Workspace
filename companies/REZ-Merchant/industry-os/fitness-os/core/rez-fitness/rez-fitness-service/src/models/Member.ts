import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const MemberStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  EXPIRED: 'expired'
} as const;

export type MemberStatusType = typeof MemberStatus[keyof typeof MemberStatus];

export const MemberSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string()
  }).optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'expired']).default('active'),
  membershipId: z.string(),
  joinedDate: z.string(),
  avatarUrl: z.string().url().optional(),
  notes: z.string().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  goals: z.array(z.string()).optional()
});

export interface IMember extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  status: MemberStatusType;
  membershipId?: mongoose.Types.ObjectId;
  joinedDate: Date;
  avatarUrl?: string;
  notes?: string;
  weight?: number;
  height?: number;
  goals?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const memberSchema = new Schema<IMember>({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: String },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String }
  },
  emergencyContact: {
    name: { type: String },
    phone: { type: String },
    relationship: { type: String }
  },
  status: { type: String, enum: ['active', 'inactive', 'suspended', 'expired'], default: 'active' },
  membershipId: { type: Schema.Types.ObjectId, ref: 'Membership' },
  joinedDate: { type: Date, default: Date.now },
  avatarUrl: { type: String },
  notes: { type: String },
  weight: { type: Number },
  height: { type: Number },
  goals: [{ type: String }]
}, { timestamps: true });

memberSchema.index({ email: 1 });
memberSchema.index({ phone: 1 });
memberSchema.index({ status: 1 });

export const Member = mongoose.model<IMember>('Member', memberSchema);

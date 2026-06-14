import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

// Zod schema for validation
export const VendorSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  companyName: z.string().min(2).max(200).optional(),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().default('India')
  }).optional(),
  category: z.enum(['food', 'grocery', 'electronics', 'furniture', 'stationery', 'uniforms', 'equipment', 'services', 'other']),
  bankDetails: z.object({
    accountName: z.string().optional(),
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/).optional(),
    branch: z.string().optional()
  }).optional(),
  documents: z.object({
    businessProof: z.string().optional(),
    addressProof: z.string().optional(),
    panCard: z.string().optional(),
    bankStatement: z.string().optional()
  }).optional(),
  status: z.enum(['pending', 'active', 'suspended', 'rejected']).default('pending'),
  rating: z.number().min(0).max(5).default(0),
  totalOrders: z.number().default(0),
  totalRevenue: z.number().default(0),
  averageDeliveryTime: z.number().default(0),
  onTimeDeliveryRate: z.number().min(0).max(100).default(100)
});

export type VendorInput = z.infer<typeof VendorSchema>;

// Mongoose interface
export interface IVendor extends Document {
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  gstin?: string;
  pan?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country: string;
  };
  category: string;
  bankDetails?: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    ifsc?: string;
    branch?: string;
  };
  documents?: {
    businessProof?: string;
    addressProof?: string;
    panCard?: string;
    bankStatement?: string;
  };
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  rating: number;
  totalOrders: number;
  totalRevenue: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema
const vendorSchema = new Schema<IVendor>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    companyName: {
      type: String,
      trim: true,
      maxlength: 200
    },
    gstin: {
      type: String,
      sparse: true,
      uppercase: true,
      trim: true
    },
    pan: {
      type: String,
      sparse: true,
      uppercase: true,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    },
    category: {
      type: String,
      required: true,
      enum: ['food', 'grocery', 'electronics', 'furniture', 'stationery', 'uniforms', 'equipment', 'services', 'other']
    },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      ifsc: String,
      branch: String
    },
    documents: {
      businessProof: String,
      addressProof: String,
      panCard: String,
      bankStatement: String
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'rejected'],
      default: 'pending'
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalOrders: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    averageDeliveryTime: {
      type: Number,
      default: 0
    },
    onTimeDeliveryRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
vendorSchema.index({ email: 1 }, { unique: true });
vendorSchema.index({ status: 1 });
vendorSchema.index({ category: 1 });
vendorSchema.index({ rating: -1 });
vendorSchema.index({ createdAt: -1 });
vendorSchema.index({ 'address.city': 1, 'address.state': 1 });

export const Vendor = mongoose.model<IVendor>('Vendor', vendorSchema);
export default Vendor;

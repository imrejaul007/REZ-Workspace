import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

// ============================================
// Zod Validation Schemas
// ============================================

export const AddressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  pincode: z.string().min(6, 'Pincode must be at least 6 characters'),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export const OperatingHoursSchema = z.object({
  monday: z.object({ open: z.string(), close: z.string() }).optional(),
  tuesday: z.object({ open: z.string(), close: z.string() }).optional(),
  wednesday: z.object({ open: z.string(), close: z.string() }).optional(),
  thursday: z.object({ open: z.string(), close: z.string() }).optional(),
  friday: z.object({ open: z.string(), close: z.string() }).optional(),
  saturday: z.object({ open: z.string(), close: z.string() }).optional(),
  sunday: z.object({ open: z.string(), close: z.string() }).optional(),
}).optional();

export const CreateStoreSchema = z.object({
  storeId: z.string().min(3, 'Store ID must be at least 3 characters'),
  name: z.string().min(2, 'Store name must be at least 2 characters'),
  ownerId: z.string().min(1, 'Owner ID is required'),
  address: AddressSchema,
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  email: z.string().email('Invalid email format'),
  status: z.enum(['active', 'inactive', 'suspended']).optional().default('inactive'),
  operatingHours: OperatingHoursSchema,
  deliveryRadius: z.number().min(0.5).max(50).optional().default(5),
  minimumOrder: z.number().min(0).optional().default(0),
  categories: z.array(z.string()).optional().default([]),
});

export const UpdateStoreSchema = z.object({
  name: z.string().min(2).optional(),
  address: AddressSchema.optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional(),
  operatingHours: OperatingHoursSchema,
  deliveryRadius: z.number().min(0.5).max(50).optional(),
  minimumOrder: z.number().min(0).optional(),
  categories: z.array(z.string()).optional(),
});

export const UpdateStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended']),
});

// TypeScript types inferred from Zod schemas
export type Address = z.infer<typeof AddressSchema>;
export type OperatingHours = z.infer<typeof OperatingHoursSchema>;
export type CreateStoreInput = z.infer<typeof CreateStoreSchema>;
export type UpdateStoreInput = z.infer<typeof UpdateStoreSchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;

// ============================================
// Mongoose Document Interface
// ============================================

export interface IStore extends Document {
  storeId: string;
  name: string;
  ownerId: string;
  address: {
    street: string;
    city: string;
    pincode: string;
    lat?: number;
    lng?: number;
  };
  phone: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  operatingHours?: {
    [key: string]: { open: string; close: string } | undefined;
  };
  deliveryRadius: number;
  minimumOrder: number;
  categories: string[];
  rating: number;
  totalOrders: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Mongoose Schema
// ============================================

const StoreSchema = new Schema<IStore>(
  {
    storeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
      lat: { type: Number },
      lng: { type: Number },
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'inactive',
      index: true,
    },
    operatingHours: {
      type: Map,
      of: new Schema(
        {
          open: { type: String },
          close: { type: String },
        },
        { _id: false }
      ),
    },
    deliveryRadius: {
      type: Number,
      default: 5,
      min: 0.5,
      max: 50,
    },
    minimumOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
    categories: {
      type: [String],
      default: [],
      index: true,
    },
    rating: {
      type: Number,
      default: 5,
      min: 0,
      max: 5,
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for efficient queries
StoreSchema.index({ 'address.city': 1, status: 1 });
StoreSchema.index({ 'address.location': '2dsphere' });

// Pre-save hook to generate storeId if not provided
StoreSchema.pre('validate', function (next) {
  if (!this.storeId) {
    this.storeId = `STORE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

// ============================================
// Model Export
// ============================================

export const Store = mongoose.model<IStore>('Store', StoreSchema);

// ============================================
// Helper Functions
// ============================================

export const generateStoreId = (): string => {
  return `STORE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

export const formatStoreResponse = (store: IStore) => {
  return {
    id: store._id,
    storeId: store.storeId,
    name: store.name,
    ownerId: store.ownerId,
    address: store.address,
    phone: store.phone,
    email: store.email,
    status: store.status,
    operatingHours: store.operatingHours ? Object.fromEntries(store.operatingHours) : undefined,
    deliveryRadius: store.deliveryRadius,
    minimumOrder: store.minimumOrder,
    categories: store.categories,
    rating: store.rating,
    totalOrders: store.totalOrders,
    createdAt: store.createdAt,
    updatedAt: store.updatedAt,
  };
};
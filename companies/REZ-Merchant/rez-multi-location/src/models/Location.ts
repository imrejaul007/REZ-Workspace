import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILocation extends Document {
  merchantId: Types.ObjectId;
  name: string;
  code: string;
  type: 'store' | 'warehouse' | 'kitchen' | 'office';
  address: { street: string; city: string; state: string; pincode: string; coordinates?: { lat: number; lng: number } };
  contact: { phone: string; email: string; managerName?: string };
  businessHours: { open: string; close: string; is24Hours: boolean };
  status: 'active' | 'inactive' | 'maintenance';
  managerId?: Types.ObjectId;
  inventory: { productId: Types.ObjectId; quantity: number; minStock: number }[];
  dailyRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  rating?: number;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILocationTransfer extends Document {
  fromLocationId: Types.ObjectId;
  toLocationId: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  initiatedBy: Types.ObjectId;
  notes?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['store', 'warehouse', 'kitchen', 'office'], required: true },
  address: {
    street: String, city: { type: String, required: true }, state: { type: String, required: true },
    pincode: String, coordinates: { lat: Number, lng: Number },
  },
  contact: { phone: String, email: String, managerName: String },
  businessHours: { open: String, close: String, is24Hours: { type: Boolean, default: false } },
  status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' },
  managerId: { type: Schema.Types.ObjectId, ref: 'User' },
  inventory: [{ productId: { type: Schema.Types.ObjectId, ref: 'Product' }, quantity: Number, minStock: Number }],
  dailyRevenue: { type: Number, default: 0 },
  monthlyRevenue: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  rating: Number,
  isPrimary: { type: Boolean, default: false },
}, { timestamps: true });

LocationSchema.index({ merchantId: 1, status: 1 });
LocationSchema.index({ merchantId: 1, type: 1 });

const LocationTransferSchema = new Schema({
  fromLocationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
  toLocationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['pending', 'in_transit', 'completed', 'cancelled'], default: 'pending' },
  initiatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  notes: String,
  completedAt: Date,
}, { timestamps: true });

LocationTransferSchema.index({ fromLocationId: 1, status: 1 });
LocationTransferSchema.index({ toLocationId: 1, status: 1 });

export const Location = mongoose.models.Location || mongoose.model<ILocation>('Location', LocationSchema);
export const LocationTransfer = mongoose.models.LocationTransfer || mongoose.model<ILocationTransfer>('LocationTransfer', LocationTransferSchema);

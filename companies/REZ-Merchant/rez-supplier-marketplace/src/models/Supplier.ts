import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  gstin: string;
  businessType: string;
  category: string[];
  address: { street: string; city: string; state: string; pincode: string };
  bankDetails?: { accountNumber: string; ifsc: string; bankName: string; accountHolder: string };
  rating: number;
  totalOrders: number;
  totalRevenue: number;
  deliveryAreas: string[];
  minOrderValue: number;
  deliveryTime: { min: number; max: number };
  paymentTerms: string[];
  isVerified: boolean;
  isActive: boolean;
  documents: { type: string; url: string; verified: boolean }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IProduct extends Document {
  supplierId: Types.ObjectId;
  name: string;
  sku: string;
  description: string;
  category: string;
  subcategory?: string;
  unit: string;
  moq: number;
  price: number;
  mrp?: number;
  stock: number;
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrder extends Document {
  buyerId: Types.ObjectId;
  supplierId: Types.ObjectId;
  items: { productId: Types.ObjectId; name: string; quantity: number; unit: string; price: number; total: number }[];
  subtotal: number;
  deliveryCharge: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  deliveryAddress: { street: string; city: string; state: string; pincode: string };
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReview extends Document {
  supplierId: Types.ObjectId;
  buyerId: Types.ObjectId;
  orderId: Types.ObjectId;
  rating: number;
  comment?: string;
  isVerified: boolean;
  createdAt: Date;
}

const SupplierSchema = new Schema({
  name: { type: String, required: true, index: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  gstin: { type: String, required: true },
  businessType: { type: String, required: true },
  category: [String],
  address: {
    street: String, city: { type: String, required: true },
    state: { type: String, required: true }, pincode: String,
  },
  bankDetails: {
    accountNumber: String, ifsc: String, bankName: String, accountHolder: String,
  },
  rating: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  deliveryAreas: [String],
  minOrderValue: { type: Number, default: 500 },
  deliveryTime: { min: { type: Number, default: 1 }, max: { type: Number, default: 7 } },
  paymentTerms: [String],
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  documents: [{
    type: String, url: String, verified: { type: Boolean, default: false },
  }],
}, { timestamps: true });

SupplierSchema.index({ 'address.city': 1, isActive: 1 });
SupplierSchema.index({ category: 1 });

const ProductSchema = new Schema({
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  description: String,
  category: { type: String, required: true, index: true },
  subcategory: String,
  unit: { type: String, default: 'piece' },
  moq: { type: Number, default: 1 },
  price: { type: Number, required: true },
  mrp: Number,
  stock: { type: Number, default: 0 },
  images: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

ProductSchema.index({ supplierId: 1, category: 1 });
ProductSchema.index({ name: 'text', description: 'text' });

const OrderSchema = new Schema({
  buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product' }, name: String,
    quantity: Number, unit: String, price: Number, total: Number,
  }],
  subtotal: { type: Number, required: true },
  deliveryCharge: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending', index: true },
  deliveryAddress: { street: String, city: String, state: String, pincode: String },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentMethod: String,
  notes: String,
}, { timestamps: true });

OrderSchema.index({ buyerId: 1, createdAt: -1 });
OrderSchema.index({ supplierId: 1, status: 1 });

const ReviewSchema = new Schema({
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
  buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  isVerified: { type: Boolean, default: true },
}, { timestamps: true });

ReviewSchema.index({ supplierId: 1, rating: -1 });

export const Supplier = mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);
export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export const Review = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

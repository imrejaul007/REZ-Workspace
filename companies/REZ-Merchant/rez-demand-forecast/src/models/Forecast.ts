import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISalesHistory {
  productId: Types.ObjectId;
  date: Date;
  quantity: number;
  revenue: number;
  region?: string;
  storeId?: string;
}

export interface IProduct extends Document {
  name: string;
  sku: string;
  category: string;
  subcategory?: string;
  currentStock: number;
  leadTime: number; // days
  safetyStock: number;
  reorderPoint: number;
  maxStock: number;
  unitCost: number;
  unitPrice: number;
  supplierId?: Types.ObjectId;
  isActive: boolean;
  seasonality?: {
    type: 'high' | 'medium' | 'low';
    months: number[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IForecast extends Document {
  productId: Types.ObjectId;
  forecastDate: Date;
  periods: {
    date: Date;
    predicted: number;
    lowerBound: number;
    upperBound: number;
  }[];
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  seasonality: 'high' | 'medium' | 'low' | 'none';
  model: string;
  accuracy?: number;
  error?: {
    mape: number;
    mae: number;
  };
  createdAt: Date;
}

export interface IAlert extends Document {
  productId: Types.ObjectId;
  type: 'low_stock' | 'overstock' | 'demand_spike' | 'demand_drop';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  currentValue: number;
  threshold: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface ISupplier extends Document {
  name: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  address?: string;
  leadTimeDays: number;
  minOrderQuantity: number;
  paymentTerms: string;
  rating: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SalesHistorySchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  date: { type: Date, required: true, index: true },
  quantity: { type: Number, required: true, min: 0 },
  revenue: { type: Number, default: 0 },
  region: String,
  storeId: String,
}, { timestamps: true });

SalesHistorySchema.index({ productId: 1, date: -1 });

const ProductSchema = new Schema({
  name: { type: String, required: true, index: true },
  sku: { type: String, required: true, unique: true, index: true },
  category: { type: String, required: true, index: true },
  subcategory: String,
  currentStock: { type: Number, default: 0, min: 0 },
  leadTime: { type: Number, required: true, default: 7 },
  safetyStock: { type: Number, default: 10 },
  reorderPoint: { type: Number, required: true },
  maxStock: { type: Number, default: 100 },
  unitCost: { type: Number, default: 0 },
  unitPrice: { type: Number, default: 0 },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
  isActive: { type: Boolean, default: true },
  seasonality: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
}, { timestamps: true });

ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ sku: 1 });

const ForecastSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  forecastDate: { type: Date, required: true },
  periods: [{
    date: { type: Date, required: true },
    predicted: { type: Number, required: true },
    lowerBound: { type: Number, required: true },
    upperBound: { type: Number, required: true },
  }],
  confidence: { type: Number, required: true, min: 0, max: 1 },
  trend: {
    type: String,
    enum: ['up', 'down', 'stable'],
    required: true
  },
  seasonality: {
    type: String,
    enum: ['high', 'medium', 'low', 'none'],
    default: 'none'
  },
  model: { type: String, required: true },
  accuracy: Number,
  error: {
    mape: Number,
    mae: Number,
  },
}, { timestamps: true });

ForecastSchema.index({ productId: 1, forecastDate: -1 });

const AlertSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  type: {
    type: String,
    enum: ['low_stock', 'overstock', 'demand_spike', 'demand_drop'],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  message: { type: String, required: true },
  currentValue: { type: Number, required: true },
  threshold: { type: Number, required: true },
  acknowledged: { type: Boolean, default: false },
  acknowledgedBy: String,
  acknowledgedAt: Date,
  resolved: { type: Boolean, default: false },
  resolvedAt: Date,
}, { timestamps: true });

AlertSchema.index({ productId: 1, type: 1, resolved: 1 });

const SupplierSchema = new Schema({
  name: { type: String, required: true, index: true },
  contactPerson: String,
  email: { type: String, required: true },
  phone: String,
  address: String,
  leadTimeDays: { type: Number, default: 7 },
  minOrderQuantity: { type: Number, default: 1 },
  paymentTerms: { type: String, default: 'NET30' },
  rating: { type: Number, default: 3, min: 1, max: 5 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const SalesHistory = mongoose.models.SalesHistory || mongoose.model<ISalesHistory>('SalesHistory', SalesHistorySchema);
export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
export const Forecast = mongoose.models.Forecast || mongoose.model<IForecast>('Forecast', ForecastSchema);
export const Alert = mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
export const Supplier = mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);

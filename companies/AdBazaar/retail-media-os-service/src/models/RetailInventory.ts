import mongoose, { Schema, Document } from 'mongoose';

export type InventoryType = 'shelf' | 'endcap' | 'checkout' | 'entrance' | 'freezer' | 'floor' | 'digital';
export type InventoryStatus = 'available' | 'booked' | 'sold' | 'reserved';

export interface IRetailInventory extends Document {
  _id: mongoose.Types.ObjectId;
  retailerId: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  inventoryType: InventoryType;
  placement: {
    aisle?: string;
    section?: string;
    position?: number;
    facing?: number;
  };
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  pricing: {
    basePrice: number;
    markup: number;
    finalPrice: number;
    currency: string;
  };
  category: string;
  productIds: string[];
  visibility: 'high' | 'medium' | 'low';
  availability: {
    startDate: Date;
    endDate: Date;
    daysAvailable: number;
  };
  status: InventoryStatus;
  metrics: {
    impressions: number;
    clicks: number;
    conversionRate: number;
    revenue: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const RetailInventorySchema = new Schema<IRetailInventory>(
  {
    retailerId: { type: Schema.Types.ObjectId, ref: 'Retailer', required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    inventoryType: {
      type: String,
      enum: ['shelf', 'endcap', 'checkout', 'entrance', 'freezer', 'floor', 'digital'],
      required: true,
      index: true
    },
    placement: {
      aisle: { type: String },
      section: { type: String },
      position: { type: Number },
      facing: { type: Number, default: 1 }
    },
    dimensions: {
      width: { type: Number, required: true },
      height: { type: Number, required: true },
      depth: { type: Number, required: true }
    },
    pricing: {
      basePrice: { type: Number, required: true },
      markup: { type: Number, default: 15 },
      finalPrice: { type: Number, required: true },
      currency: { type: String, default: 'INR' }
    },
    category: { type: String, required: true, index: true },
    productIds: [{ type: String }],
    visibility: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    availability: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      daysAvailable: { type: Number, default: 0 }
    },
    status: {
      type: String,
      enum: ['available', 'booked', 'sold', 'reserved'],
      default: 'available',
      index: true
    },
    metrics: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

// Indexes
RetailInventorySchema.index({ retailerId: 1, inventoryType: 1 });
RetailInventorySchema.index({ retailerId: 1, storeId: 1, status: 1 });
RetailInventorySchema.index({ 'availability.startDate': 1, 'availability.endDate': 1 });
RetailInventorySchema.index({ category: 1, status: 1 });

export const RetailInventory = mongoose.model<IRetailInventory>('RetailInventory', RetailInventorySchema);
export default RetailInventory;
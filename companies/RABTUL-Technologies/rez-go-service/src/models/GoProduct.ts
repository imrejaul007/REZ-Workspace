import mongoose, { Document, Schema } from 'mongoose';

// Product document interface
export interface IGoProduct extends Document {
  productId: string;
  barcode: string;
  storeIds: string[]; // Which stores have this product
  name: string;
  description?: string;
  price: number;
  mrp?: number;
  category?: string;
  brand?: string;
  imageUrl?: string;
  images?: string[];
  weight?: number; // in grams/kg
  weightUnit?: 'g' | 'kg' | 'ml' | 'l' | 'pcs';
  stock: number;
  isAvailable: boolean;
  cashbackPercent: number;
  cashbackAmount?: number;
  tags: string[];
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sodium?: number;
  };
  allergens?: string[];
  dietary?: {
    isVegan?: boolean;
    isVegetarian?: boolean;
    isGlutenFree?: boolean;
    isHalal?: boolean;
    isKosher?: boolean;
    isJain?: boolean;
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NutritionSchema = new Schema(
  {
    calories: { type: Number },
    protein: { type: Number },
    carbs: { type: Number },
    fat: { type: Number },
    fiber: { type: Number },
    sodium: { type: Number },
  },
  { _id: false }
);

const DietarySchema = new Schema(
  {
    isVegan: { type: Boolean },
    isVegetarian: { type: Boolean },
    isGlutenFree: { type: Boolean },
    isHalal: { type: Boolean },
    isKosher: { type: Boolean },
    isJain: { type: Boolean },
  },
  { _id: false }
);

const GoProductSchema = new Schema<IGoProduct>(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    barcode: {
      type: String,
      required: true,
      index: true,
    },
    storeIds: [{ type: String, index: true }],
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    category: { type: String, index: true },
    brand: { type: String, index: true },
    imageUrl: { type: String },
    images: [{ type: String }],
    weight: { type: Number },
    weightUnit: {
      type: String,
      enum: ['g', 'kg', 'ml', 'l', 'pcs'],
    },
    stock: { type: Number, default: 0, min: 0 },
    isAvailable: { type: Boolean, default: true },
    cashbackPercent: { type: Number, default: 2 },
    cashbackAmount: { type: Number },
    tags: [{ type: String, index: true }],
    nutrition: NutritionSchema,
    allergens: [{ type: String }],
    dietary: DietarySchema,
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
GoProductSchema.index({ barcode: 1, storeIds: 1 });
GoProductSchema.index({ category: 1, brand: 1 });
GoProductSchema.index({ storeIds: 1, isAvailable: 1, stock: { $gt: 0 } });
GoProductSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Virtual for actual cashback amount calculation
GoProductSchema.virtual('calculatedCashback').get(function () {
  if (this.cashbackAmount !== undefined) {
    return this.cashbackAmount;
  }
  return Math.floor(this.price * (this.cashbackPercent / 100));
});

// Ensure virtuals are included in JSON
GoProductSchema.set('toJSON', { virtuals: true });
GoProductSchema.set('toObject', { virtuals: true });

export const GoProduct = mongoose.model<IGoProduct>('GoProduct', GoProductSchema);

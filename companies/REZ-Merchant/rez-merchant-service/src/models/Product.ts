import mongoose, { Schema, Document, Types } from 'mongoose';

// RC-1 NOTE: This is a partial schema for read operations and merchant-specific fields.
// The authoritative Product schema is in rez-backend/src/models/Product.ts.
// Merchant-specific fields (merchantId, storeId, etc.) are declared here.

export interface IProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

// ADDON-001: Modifier schema for product customization (add-ons/customizations)
export interface IModifier {
  _id?: Types.ObjectId;
  name: string;                   // "Large", "Extra Cheese", "Extra Shot"
  price: number;                  // Additional price (can be 0 for free add-ons)
  isAvailable: boolean;            // Can be toggled off without deleting
  calories?: number;               // Optional nutritional info
  image?: string;                 // Optional image URL
  sortOrder?: number;             // Display order within group
}

export interface IModifierGroup {
  _id?: Types.ObjectId;
  name: string;                   // "Size", "Toppings", "Extras", "Drink Size"
  type: 'single' | 'multiple';   // Single select (radio) or multi-select (checkbox)
  minSelections: number;          // 0 = optional, 1+ = required
  maxSelections: number;          // Max choices allowed (use large number for unlimited)
  modifiers: IModifier[];         // Options within this group
  isActive: boolean;              // Can be toggled off without deleting
  sortOrder?: number;             // Display order among groups
}

export interface IProduct extends Document {
  store: Types.ObjectId;
  merchant: Types.ObjectId;
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  images: IProductImage[];
  pricing: {
    original: number;
    selling: number;
    discount?: number;
    currency: string;
    gst?: number;
  };
  inventory: {
    stock: number;
    isAvailable: boolean;
    lowStockThreshold?: number;
    variants?: Array<{
      name: string;
      sku?: string;
      priceModifier?: number;
      stock?: number;
    }>;
    unlimited: boolean;
  };
  ratings?: { average: number; count: number };
  sku?: string;
  barcode?: string;
  tags?: string[];
  isActive: boolean;
  isVeg?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  preparationTime?: number;
  weight?: number;
  itemType?: string;
  // ADDON-001: Product customization (add-ons/modifiers)
  modifierGroups?: IModifierGroup[];
  // DB-HEALTH-003: Soft delete field for sensitive data
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    store: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    merchant: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    name: { type: String, required: true, trim: true },
    // NOTE: `slug_1` unique index is owned by the rez-backend Product model on
    // the same `products` collection. We declare the field here and auto-
    // generate it below to avoid E11000 duplicate-null collisions when
    // merchant-service creates products (matches Store model behaviour).
    slug: { type: String },
    description: String,
    category: String,
    subcategory: String,
    // SCHEMA FIX: images now stored as IProductImage[] (url, alt, isPrimary) to preserve metadata.
    // Previously stored as flat string[]. Migration needed for existing data.
    images: {
      type: [{
        url: { type: String, required: true },
        alt: String,
        isPrimary: Boolean,
      }],
      maxlength: 50,
    },
    pricing: {
      // FIX: renamed from mrp to original to align with the backend canonical
      // Product model (rez-backend/src/models/Product.ts), which uses
      // pricing.original for the MRP/list price.
      // Previously: pricing.mrp. Backend canonical: pricing.original.
      original: { type: Number, required: true, min: 0 },
      selling: { type: Number, required: true, min: 0 },
      discount: Number,
      currency: { type: String, default: 'INR' },
      gst: Schema.Types.Mixed,
    },
    inventory: {
      stock: { type: Number, default: 0 },
      isAvailable: { type: Boolean, default: true },
      lowStockThreshold: Number,
      variants: Schema.Types.Mixed,
      unlimited: { type: Boolean, default: false },
    },
    ratings: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    sku: String,
    barcode: String,
    tags: [String],
    isActive: { type: Boolean, default: true },
    isVeg: Boolean,
    isFeatured: Boolean,
    sortOrder: { type: Number, default: 0 },
    preparationTime: Number,
    weight: Number,
    itemType: { type: String, default: 'product' },
    // DB-HEALTH-003: Soft delete field
    deletedAt: Date,
  },
  { timestamps: true, strict: true, strictQuery: true },
);

// PERFORMANCE: Product catalog queries
ProductSchema.index({ store: 1, isActive: 1 });
// DB-INDEX: Removed redundant { merchant: 1 } — covered by { merchant: 1, category: 1, isActive: 1 } and { merchant: 1, isFeatured: 1, sortOrder: 1 }
ProductSchema.index({ name: 'text', description: 'text' });

// DB-HEALTH-001: Compound index for merchant catalog queries (category filtering, featured products)
ProductSchema.index({ merchant: 1, category: 1, isActive: 1 });
ProductSchema.index({ merchant: 1, isFeatured: 1, sortOrder: 1 });

// DB-HEALTH-002: Index for sortOrder queries (listing order)
ProductSchema.index({ store: 1, category: 1, sortOrder: 1 });

// DB-INDEX: Added availability index for product availability filtering by store
ProductSchema.index({ store: 1, 'inventory.isAvailable': 1 });

/**
 * Auto-generate unique slug AND sku from name when missing. Same pattern
 * as the Store model — rez-backend owns the unique indexes and
 * rez-merchant-service writes bypass its pre-save hook. Without these
 * hooks, the second merchant to register their first product hits E11000
 * on either `slug: null` or `sku: null`.
 *
 * rez-backend's Product model requires sku AND marks it unique (non-sparse),
 * so we must always generate one.
 */
ProductSchema.pre('validate', function (next) {
  const idTail = (this._id as Types.ObjectId).toString().slice(-8);

  if (!this.slug && this.name) {
    const base = String(this.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'product';
    this.slug = `${base}-${idTail}`;
  }

  if (!this.sku) {
    // rez-backend uppercases sku, so match that convention.
    // Format: MRS-<last-8-of-objectId> — unique per document.
    this.sku = `MRS-${idTail.toUpperCase()}`;
  }

  next();
});

/**
 * BAK-CRIT-004 fix: Enforce non-negative pricing.selling as a last line of
 * defense. The Mongoose schema min:0 handles most paths, but bulk operations
 * and direct findOneAndUpdate calls can bypass it — this hook catches those.
 */
ProductSchema.pre('save', function (next) {
  if (this.pricing) {
    if (typeof this.pricing.selling === 'number' && this.pricing.selling < 0) {
      return next(new Error('pricing.selling cannot be negative'));
    }
    if (typeof this.pricing.original === 'number' && this.pricing.original < 0) {
      return next(new Error('pricing.original cannot be negative'));
    }
  }
  next();
});

export const Product = mongoose.model<IProduct>('Product', ProductSchema);

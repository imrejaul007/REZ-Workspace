import mongoose, { Schema, Document, Model } from 'mongoose';

// =============================================================================
// Menu Document Interface
// =============================================================================
export interface IMenu extends Document {
  _id: mongoose.Types.ObjectId;
  restaurantId: string;
  name: string;
  description?: string;
  active: boolean;
  publishedAt?: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Category Document Interface
// =============================================================================
export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  menuId: mongoose.Types.ObjectId;
  restaurantId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Variant Document Interface
// =============================================================================
export interface IVariant {
  id: string;
  name: string;
  priceModifier: number;
  available: boolean;
}

// =============================================================================
// Modifier Option Document Interface
// =============================================================================
export interface IModifierOption {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

// =============================================================================
// Modifier Document Interface
// =============================================================================
export interface IModifier {
  id: string;
  name: string;
  options: IModifierOption[];
  required: boolean;
  multiSelect: boolean;
}

// =============================================================================
// MenuItem Document Interface
// =============================================================================
export interface IMenuItem extends Document {
  _id: mongoose.Types.ObjectId;
  menuId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  restaurantId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  calories?: number;
  allergens: string[];
  dietaryFlags: string[];
  variants: IVariant[];
  modifiers: IModifier[];
  available: boolean;
  preparationTime?: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// ItemAnalytics Document Interface
// =============================================================================
export interface IItemAnalytics extends Document {
  itemId: mongoose.Types.ObjectId;
  restaurantId: string;
  periodStart: Date;
  periodEnd: Date;
  views: number;
  orders: number;
  revenue: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Menu Schema
// =============================================================================
const menuSchema = new Schema<IMenu>(
  {
    restaurantId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    active: {
      type: Boolean,
      default: true,
    },
    publishedAt: {
      type: Date,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for restaurant queries
menuSchema.index({ restaurantId: 1, active: 1 });

// =============================================================================
// Category Schema
// =============================================================================
const categorySchema = new Schema<ICategory>(
  {
    menuId: {
      type: Schema.Types.ObjectId,
      ref: 'Menu',
      required: true,
      index: true,
    },
    restaurantId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
categorySchema.index({ menuId: 1, sortOrder: 1 });
categorySchema.index({ restaurantId: 1, available: 1 });

// =============================================================================
// MenuItem Schema
// =============================================================================
const menuItemSchema = new Schema<IMenuItem>(
  {
    menuId: {
      type: Schema.Types.ObjectId,
      ref: 'Menu',
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    restaurantId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    calories: {
      type: Number,
      min: 0,
    },
    allergens: {
      type: [String],
      default: [],
    },
    dietaryFlags: {
      type: [String],
      default: [],
    },
    variants: {
      type: [
        {
          id: { type: String, required: true },
          name: { type: String, required: true },
          priceModifier: { type: Number, default: 0 },
          available: { type: Boolean, default: true },
        },
      ],
      default: [],
    },
    modifiers: {
      type: [
        {
          id: { type: String, required: true },
          name: { type: String, required: true },
          options: {
            type: [
              {
                id: { type: String, required: true },
                name: { type: String, required: true },
                price: { type: Number, default: 0 },
                available: { type: Boolean, default: true },
              },
            ],
            default: [],
          },
          required: { type: Boolean, default: false },
          multiSelect: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    available: {
      type: Boolean,
      default: true,
    },
    preparationTime: {
      type: Number,
      min: 0,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
menuItemSchema.index({ menuId: 1, categoryId: 1 });
menuItemSchema.index({ restaurantId: 1, available: 1 });
menuItemSchema.index({ name: 'text', description: 'text' }); // For text search

// =============================================================================
// ItemAnalytics Schema
// =============================================================================
const itemAnalyticsSchema = new Schema<IItemAnalytics>(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
      index: true,
    },
    restaurantId: {
      type: String,
      required: true,
      index: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    orders: {
      type: Number,
      default: 0,
      min: 0,
    },
    revenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for analytics queries
itemAnalyticsSchema.index({ itemId: 1, periodStart: 1, periodEnd: 1 });
itemAnalyticsSchema.index({ restaurantId: 1, periodStart: 1, periodEnd: 1 });

// =============================================================================
// Create and Export Models
// =============================================================================
export const MenuModel: Model<IMenu> = mongoose.model<IMenu>('Menu', menuSchema);
export const CategoryModel: Model<ICategory> = mongoose.model<ICategory>('Category', categorySchema);
export const MenuItemModel: Model<IMenuItem> = mongoose.model<IMenuItem>('MenuItem', menuItemSchema);
export const ItemAnalyticsModel: Model<IItemAnalytics> = mongoose.model<IItemAnalytics>(
  'ItemAnalytics',
  itemAnalyticsSchema
);

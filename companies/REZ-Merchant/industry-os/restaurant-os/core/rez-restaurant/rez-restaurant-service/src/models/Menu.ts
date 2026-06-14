/**
 * Menu Model
 *
 * Represents restaurant menus with categories and items
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuItem {
  itemId: string;
  name: string;
  description?: string;
  price: number;
  priceUnit: 'INR' | 'USD';
  images?: string[];
  tags?: string[]; // veg, non-veg, vegan, gluten-free, etc.
  allergens?: string[];
  spices?: 1 | 2 | 3 | 4 | 5; // Spice level
  isAvailable: boolean;
  isFeatured: boolean;
  preparationTime?: number; // minutes
  calories?: number;
  customization?: {
    required: boolean;
    options: Array<{
      name: string;
      priceModifier: number;
    }>;
  };
}

export interface IMenuCategory {
  categoryId: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  items: IMenuItem[];
}

export interface IMenu extends Document {
  menuId: string;
  restaurantId: string;
  branchId?: string; // Optional: specific to a branch
  name: string;
  description?: string;
  categories: IMenuCategory[];
  isActive: boolean;
  version: number;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>({
  itemId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  priceUnit: { type: String, enum: ['INR', 'USD'], default: 'INR' },
  images: [{ type: String }],
  tags: [{ type: String }],
  allergens: [{ type: String }],
  spices: { type: Number, enum: [1, 2, 3, 4, 5] },
  isAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  preparationTime: { type: Number },
  calories: { type: Number },
  customization: {
    required: { type: Boolean, default: false },
    options: [{
      name: { type: String },
      priceModifier: { type: Number, default: 0 },
    }],
  },
}, { _id: false });

const MenuCategorySchema = new Schema<IMenuCategory>({
  categoryId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  items: [MenuItemSchema],
}, { _id: false });

const MenuSchema = new Schema<IMenu>({
  menuId: { type: String, required: true, unique: true, index: true },
  restaurantId: { type: String, required: true, index: true },
  branchId: { type: String, index: true },
  name: { type: String, required: true },
  description: { type: String },
  categories: [MenuCategorySchema],
  isActive: { type: Boolean, default: true },
  version: { type: Number, default: 1 },
  effectiveFrom: { type: Date },
  effectiveUntil: { type: Date },
}, {
  timestamps: true,
  collection: 'menus',
});

// Compound indexes
MenuSchema.index({ restaurantId: 1, branchId: 1 });
MenuSchema.index({ restaurantId: 1, isActive: 1 });
MenuSchema.index({ 'categories.items.itemId': 1 });

export const Menu = mongoose.model<IMenu>('Menu', MenuSchema);

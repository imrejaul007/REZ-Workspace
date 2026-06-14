import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuItem extends Document {
  name: string;
  description: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'beverages' | 'desserts' | 'minibar';
  price: number;
  currency: string;
  prepTime: number;
  calories?: number;
  dietary: ('vegetarian' | 'vegan' | 'gluten-free' | 'halal' | 'kosher')[];
  allergens: string[];
  image?: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snacks', 'beverages', 'desserts', 'minibar'],
      required: true,
    },
    price: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    prepTime: { type: Number, required: true },
    calories: Number,
    dietary: [{ type: String }],
    allergens: [{ type: String }],
    image: String,
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MenuItemSchema.index({ category: 1, isAvailable: 1 });
MenuItemSchema.index({ name: 'text', description: 'text' });

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
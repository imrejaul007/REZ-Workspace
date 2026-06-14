/**
 * Dietary Preferences Model
 * Stores user dietary preferences and allergies for personalized menu recommendations
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IDietaryPreferences extends Document {
  userId: string;
  // Dietary lifestyle preferences
  vegan: boolean;
  vegetarian: boolean;
  glutenFree: boolean;
  nutFree: boolean;
  dairyFree: boolean;
  halal: boolean;
  kosher: boolean;
  jain: boolean;
  // Free-form allergies (e.g., 'shellfish', 'soy', 'eggs')
  allergies: string[];
  // Food dislikes (items user doesn't want to see recommended)
  dislikes: string[];
  // Preferred cuisines
  preferredCuisines: string[];
  // Spice tolerance level (1-5)
  spiceTolerance: number;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const DietaryPreferencesSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    vegan: { type: Boolean, default: false },
    vegetarian: { type: Boolean, default: false },
    glutenFree: { type: Boolean, default: false },
    nutFree: { type: Boolean, default: false },
    dairyFree: { type: Boolean, default: false },
    halal: { type: Boolean, default: false },
    kosher: { type: Boolean, default: false },
    jain: { type: Boolean, default: false },
    allergies: { type: [String], default: [] },
    dislikes: { type: [String], default: [] },
    preferredCuisines: { type: [String], default: [] },
    spiceTolerance: { type: Number, default: 3, min: 1, max: 5 },
  },
  { timestamps: true, collection: 'dietary_preferences' }
);

// Compound index for efficient lookups
DietaryPreferencesSchema.index({ userId: 1, updatedAt: -1 });

export const DietaryPreferences = mongoose.model<IDietaryPreferences>(
  'DietaryPreferences',
  DietaryPreferencesSchema
);

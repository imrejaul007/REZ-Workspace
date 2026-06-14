/**
 * Fitness Nutrition Plan Model
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INutritionPlan extends Document {
  storeId: Types.ObjectId;
  name: string;
  description?: string;
  type: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'custom';
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  meals: {
    name: string;
    time?: string;
    calories: number;
    items: { name: string; portion: string; calories: number }[];
  }[];
  duration: number;
  createdBy: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
}

const NutritionPlanSchema = new Schema({
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  name: { type: String, required: true },
  description: String,
  type: {
    type: String,
    enum: ['weight_loss', 'muscle_gain', 'maintenance', 'custom'],
    required: true
  },
  dailyCalories: { type: Number, required: true },
  proteinGrams: Number,
  carbsGrams: Number,
  fatGrams: Number,
  meals: [{
    name: String,
    time: String,
    calories: Number,
    items: [{
      name: String,
      portion: String,
      calories: Number
    }]
  }],
  duration: { type: Number, default: 30 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'MerchantUser' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const NutritionPlan = mongoose.model<INutritionPlan>('NutritionPlan', NutritionPlanSchema);

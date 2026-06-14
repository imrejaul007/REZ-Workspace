import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Nutrition Plan - Meal plans for gym/fitness members.
 * Supports weight loss, muscle gain, maintenance, and custom plans.
 */
export interface INutritionPlan extends Document {
  storeId: Types.ObjectId;
  name: string;
  description: string;
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
  updatedAt: Date;
}

/**
 * Member nutrition assignment - links a member to a nutrition plan
 */
export interface IMemberNutrition extends Document {
  memberId: Types.ObjectId;
  storeId: Types.ObjectId;
  planId: Types.ObjectId;
  assignedAt: Date;
  assignedBy: Types.ObjectId;
  isActive: boolean;
}

/**
 * Meal log entry - tracks what a member ate
 */
export interface IMealLog extends Document {
  memberId: Types.ObjectId;
  storeId: Types.ObjectId;
  planId?: Types.ObjectId;
  name: string;
  calories: number;
  date: Date;
  loggedAt: Date;
}

const MealItemSchema = new Schema({
  name: { type: String, required: true },
  portion: { type: String, required: true },
  calories: { type: Number, required: true, min: 0 },
}, { _id: false });

const MealSchema = new Schema({
  name: { type: String, required: true },
  time: { type: String },
  calories: { type: Number, required: true, min: 0 },
  items: [MealItemSchema],
}, { _id: false });

const NutritionPlanSchema = new Schema<INutritionPlan>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    type: {
      type: String,
      enum: ['weight_loss', 'muscle_gain', 'maintenance', 'custom'],
      required: true,
    },
    dailyCalories: { type: Number, required: true, min: 0 },
    proteinGrams: { type: Number, required: true, min: 0 },
    carbsGrams: { type: Number, required: true, min: 0 },
    fatGrams: { type: Number, required: true, min: 0 },
    meals: [MealSchema],
    duration: { type: Number, required: true, min: 1 }, // days
    createdBy: { type: Schema.Types.ObjectId, ref: 'MerchantUser', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

NutritionPlanSchema.index({ storeId: 1, isActive: 1 });
NutritionPlanSchema.index({ storeId: 1, type: 1 });
NutritionPlanSchema.index({ createdBy: 1 });

const MemberNutritionSchema = new Schema<IMemberNutrition>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'NutritionPlan', required: true },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'MerchantUser', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

MemberNutritionSchema.index({ memberId: 1, isActive: 1 });
MemberNutritionSchema.index({ storeId: 1, memberId: 1 }, { unique: true });

const MealLogSchema = new Schema<IMealLog>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'NutritionPlan' },
    name: { type: String, required: true, trim: true },
    calories: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    loggedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

MealLogSchema.index({ memberId: 1, date: 1 });
MealLogSchema.index({ memberId: 1, date: 1, loggedAt: -1 });

export const NutritionPlan = mongoose.models.NutritionPlan ||
  mongoose.model<INutritionPlan>('NutritionPlan', NutritionPlanSchema);

export const MemberNutrition = mongoose.models.MemberNutrition ||
  mongoose.model<IMemberNutrition>('MemberNutrition', MemberNutritionSchema);

export const MealLog = mongoose.models.MealLog ||
  mongoose.model<IMealLog>('MealLog', MealLogSchema);

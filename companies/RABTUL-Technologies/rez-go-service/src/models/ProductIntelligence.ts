/**
 * REZ Go Product Intelligence Model
 *
 * Stores enhanced product information:
 * - Ingredients
 * - Nutrition
 * - Allergens
 * - Tutorials/Videos
 * - Health insights
 * - Comparisons
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IProductNutrition {
  servingSize?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
  vitamins?: Record<string, number>;
  minerals?: Record<string, number>;
}

export interface IProductAllergens {
  contains: string[];
  mayContain: string[];
  traces: string[];
  dietary: {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
    dairyFree: boolean;
    nutFree: boolean;
    halal: boolean;
    kosher: boolean;
    jain: boolean;
  };
}

export interface IProductTutorial {
  type: 'video' | 'article' | 'infographic' | 'recipe';
  title: string;
  url: string;
  thumbnail?: string;
  duration?: number; // seconds for video
  author?: string;
  language: string;
}

export interface IProductHealthInsight {
  type: 'warning' | 'info' | 'tip';
  category: 'sugar' | 'calories' | 'allergen' | 'health' | 'nutrition' | 'diabetes' | 'weight';
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export interface IProductComparison {
  productIds: string[];
  criteria: string[];
  winner: string;
  scores: Record<string, number>;
}

export interface IProductIntelligence extends Document {
  productId: string;
  barcode: string;

  // Ingredients
  ingredients?: string[];
  ingredientsRaw?: string;

  // Nutrition
  nutrition?: IProductNutrition;
  servingSize?: string;

  // Allergens
  allergens?: IProductAllergens;

  // Health
  healthScore?: number; // 0-100
  healthInsights?: IProductHealthInsight[];
  healthWarnings?: string[];

  // Tutorials
  tutorials?: IProductTutorial[];

  // Comparisons
  alternatives?: string[]; // productIds
  comparisons?: IProductComparison[];

  // Usage
  howToUse?: string;
  storageInstructions?: string;
  shelfLife?: string;
  countryOfOrigin?: string;
  manufacturer?: string;
  expiryInfo?: string;

  // Reviews summary
  avgRating?: number;
  reviewCount?: number;
  topPros?: string[];
  topCons?: string[];

  // AI Insights
  aiSummary?: string;
  aiHighlights?: string[];

  // Trending
  trendingScore?: number;
  localPopularity?: number;

  updatedAt: Date;
}

const NutritionSchema = new Schema<IProductNutrition>(
  {
    servingSize: String,
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sugar: Number,
    sodium: Number,
    cholesterol: Number,
    vitamins: { type: Map, of: Number },
    minerals: { type: Map, of: Number },
  },
  { _id: false }
);

const DietarySchema = new Schema(
  {
    vegetarian: { type: Boolean, default: false },
    vegan: { type: Boolean, default: false },
    glutenFree: { type: Boolean, default: false },
    dairyFree: { type: Boolean, default: false },
    nutFree: { type: Boolean, default: false },
    halal: { type: Boolean, default: false },
    kosher: { type: Boolean, default: false },
    jain: { type: Boolean, default: false },
  },
  { _id: false }
);

const AllergensSchema = new Schema<IProductAllergens>(
  {
    contains: [String],
    mayContain: [String],
    traces: [String],
    dietary: { type: DietarySchema, default: () => ({}) },
  },
  { _id: false }
);

const HealthInsightSchema = new Schema<IProductHealthInsight>(
  {
    type: {
      type: String,
      enum: ['warning', 'info', 'tip'],
      required: true,
    },
    category: {
      type: String,
      enum: ['sugar', 'calories', 'allergen', 'health', 'nutrition', 'diabetes', 'weight'],
      required: true,
    },
    message: { type: String, required: true },
    severity: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'low',
    },
  },
  { _id: false }
);

const TutorialSchema = new Schema<IProductTutorial>(
  {
    type: {
      type: String,
      enum: ['video', 'article', 'infographic', 'recipe'],
      required: true,
    },
    title: { type: String, required: true },
    url: { type: String, required: true },
    thumbnail: String,
    duration: Number,
    author: String,
    language: { type: String, default: 'en' },
  },
  { _id: false }
);

const ComparisonSchema = new Schema<IProductComparison>(
  {
    productIds: [String],
    criteria: [String],
    winner: String,
    scores: { type: Map, of: Number },
  },
  { _id: false }
);

const ProductIntelligenceSchema = new Schema<IProductIntelligence>(
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

    // Ingredients
    ingredients: [String],
    ingredientsRaw: String,

    // Nutrition
    nutrition: NutritionSchema,
    servingSize: String,

    // Allergens
    allergens: AllergensSchema,

    // Health
    healthScore: Number,
    healthInsights: [HealthInsightSchema],
    healthWarnings: [String],

    // Tutorials
    tutorials: [TutorialSchema],

    // Comparisons
    alternatives: [String],
    comparisons: [ComparisonSchema],

    // Usage
    howToUse: String,
    storageInstructions: String,
    shelfLife: String,
    countryOfOrigin: String,
    manufacturer: String,
    expiryInfo: String,

    // Reviews
    avgRating: Number,
    reviewCount: Number,
    topPros: [String],
    topCons: [String],

    // AI
    aiSummary: String,
    aiHighlights: [String],

    // Trending
    trendingScore: Number,
    localPopularity: Number,
  },
  {
    timestamps: { updatedAt: 'updatedAt' },
  }
);

ProductIntelligenceSchema.index({ barcode: 1 });
ProductIntelligenceSchema.index({ healthScore: -1 });
ProductIntelligenceSchema.index({ trendingScore: -1 });
ProductIntelligenceSchema.index({ 'allergens.dietary.halal': 1 });
ProductIntelligenceSchema.index({ 'allergens.dietary.jain': 1 });

export const ProductIntelligence = mongoose.model<IProductIntelligence>(
  'ProductIntelligence',
  ProductIntelligenceSchema
);

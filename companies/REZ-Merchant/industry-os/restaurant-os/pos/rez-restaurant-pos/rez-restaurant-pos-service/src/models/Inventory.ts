/**
 * MongoDB Models for Inventory Service
 */

import mongoose, { Schema, Document } from 'mongoose'

// ============ INGREDIENT ============

export interface IIngredient extends Document {
  name: string
  category: string
  unit: 'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'boxes'
  currentStock: number
  minStock: number
  reorderLevel: number
  cost: number
  supplier?: string
  lastRestocked?: Date
  expiryDate?: Date
  status: 'in_stock' | 'low_stock' | 'critical' | 'out_of_stock'
  merchantId: string
  storeId?: string
  createdAt: Date
  updatedAt: Date
}

const IngredientSchema = new Schema<IIngredient>({
  name: { type: String, required: true },
  category: { type: String, required: true, index: true },
  unit: {
    type: String,
    enum: ['kg', 'g', 'l', 'ml', 'pcs', 'boxes'],
    default: 'pcs'
  },
  currentStock: { type: Number, default: 0 },
  minStock: { type: Number, default: 10 },
  reorderLevel: { type: Number, default: 25 },
  cost: { type: Number, default: 0 },
  supplier: String,
  lastRestocked: Date,
  expiryDate: Date,
  status: {
    type: String,
    enum: ['in_stock', 'low_stock', 'critical', 'out_of_stock'],
    default: 'in_stock',
    index: true
  },
  merchantId: { type: String, required: true, index: true },
  storeId: { type: String, index: true }
}, { timestamps: true })

IngredientSchema.index({ merchantId: 1, category: 1 })
IngredientSchema.index({ status: 1, merchantId: 1 })

// ============ STOCK MOVEMENT ============

export interface IStockMovement extends Document {
  ingredientId: mongoose.Types.ObjectId
  merchantId: string
  type: 'purchase' | 'usage' | 'waste' | 'adjustment' | 'return'
  quantity: number
  previousStock: number
  newStock: number
  reason?: string
  createdBy: string
  billId?: string
  createdAt: Date
}

const StockMovementSchema = new Schema<IStockMovement>({
  ingredientId: { type: Schema.Types.ObjectId, ref: 'Ingredient', required: true, index: true },
  merchantId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['purchase', 'usage', 'waste', 'adjustment', 'return'],
    required: true
  },
  quantity: { type: Number, required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  reason: String,
  createdBy: { type: String, required: true },
  billId: String
}, { timestamps: true })

StockMovementSchema.index({ ingredientId: 1, createdAt: -1 })
StockMovementSchema.index({ merchantId: 1, createdAt: -1 })

// ============ RECIPE ============

export interface IRecipe extends Document {
  name: string
  ingredients: Array<{
    ingredientId: mongoose.Types.ObjectId
    quantity: number
  }>
  yield: number
  costPerPortion: number
  merchantId: string
  createdAt: Date
  updatedAt: Date
}

const RecipeSchema = new Schema<IRecipe>({
  name: { type: String, required: true },
  ingredients: [{
    ingredientId: { type: Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    quantity: { type: Number, required: true }
  }],
  yield: { type: Number, default: 1 },
  costPerPortion: { type: Number, default: 0 },
  merchantId: { type: String, required: true, index: true }
}, { timestamps: true })

// ============ ALERT ============

export interface IStockAlert extends Document {
  ingredientId: mongoose.Types.ObjectId
  merchantId: string
  type: 'low_stock' | 'critical' | 'out_of_stock' | 'expiry_warning'
  message: string
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date
  createdAt: Date
}

const StockAlertSchema = new Schema<IStockAlert>({
  ingredientId: { type: Schema.Types.ObjectId, ref: 'Ingredient', required: true, index: true },
  merchantId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['low_stock', 'critical', 'out_of_stock', 'expiry_warning'],
    required: true
  },
  message: { type: String, required: true },
  acknowledged: { type: Boolean, default: false },
  acknowledgedBy: String,
  acknowledgedAt: Date
}, { timestamps: true })

StockAlertSchema.index({ acknowledged: 1, merchantId: 1 })

// Export models (cache to avoid re-registration)
let Ingredient: mongoose.Model<IIngredient>
let StockMovement: mongoose.Model<IStockMovement>
let Recipe: mongoose.Model<IRecipe>
let StockAlert: mongoose.Model<IStockAlert>

export function getInventoryModels(connection: mongoose.Connection) {
  Ingredient = connection.models.Ingredient || connection.model<IIngredient>('Ingredient', IngredientSchema)
  StockMovement = connection.models.StockMovement || connection.model<IStockMovement>('StockMovement', StockMovementSchema)
  Recipe = connection.models.Recipe || connection.model<IRecipe>('Recipe', RecipeSchema)
  StockAlert = connection.models.StockAlert || connection.model<IStockAlert>('StockAlert', StockAlertSchema)

  return { Ingredient, StockMovement, Recipe, StockAlert }
}

export { IngredientSchema, StockMovementSchema, RecipeSchema, StockAlertSchema }

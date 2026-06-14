import { z } from 'zod';

// ============================================================
// Recipe Ingredient Types
// ============================================================

/**
 * Supported measurement units for ingredients
 */
export const IngredientUnitSchema = z.enum([
  'g',
  'kg',
  'ml',
  'l',
  'pieces',
  'cups',
  'tbsp',
  'tsp',
  'oz',
  'lb',
  'whole',
]);
export type IngredientUnit = z.infer<typeof IngredientUnitSchema>;

/**
 * Recipe ingredient with quantity, unit, and wastage tracking
 */
export interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: IngredientUnit;
  wastagePercentage: number; // 0-100, wastage during prep/cooking
}

/**
 * Zod schema for recipe ingredient validation
 */
export const RecipeIngredientSchema = z.object({
  ingredientId: z.string().min(1, 'Ingredient ID is required'),
  ingredientName: z.string().min(1, 'Ingredient name is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: IngredientUnitSchema,
  wastagePercentage: z.number().min(0).max(100).default(0),
});
export type RecipeIngredientInput = z.infer<typeof RecipeIngredientSchema>;

// ============================================================
// Recipe Station Types
// ============================================================

/**
 * Kitchen station where recipe is prepared
 */
export const StationSchema = z.enum([
  'grill',
  'fry',
  'saute',
  'salad',
  'dessert',
  'beverage',
  'prep',
  'bake',
]);
export type Station = z.infer<typeof StationSchema>;

// ============================================================
// Recipe Types
// ============================================================

/**
 * Complete recipe for a menu item
 */
export interface Recipe {
  id: string;
  menuItemId: string;
  ingredients: RecipeIngredient[];
  prepTime: number; // minutes
  cookTime: number; // minutes
  station: Station;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Zod schema for recipe creation
 */
export const CreateRecipeSchema = z.object({
  menuItemId: z.string().min(1, 'Menu item ID is required'),
  ingredients: z.array(RecipeIngredientSchema).min(1, 'At least one ingredient is required'),
  prepTime: z.number().int().min(0).default(0),
  cookTime: z.number().int().min(0).default(0),
  station: StationSchema.default('prep'),
});
export type CreateRecipeInput = z.infer<typeof CreateRecipeSchema>;

/**
 * Zod schema for recipe update
 */
export const UpdateRecipeSchema = CreateRecipeSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateRecipeInput = z.infer<typeof UpdateRecipeSchema>;

// ============================================================
// Order Item Types
// ============================================================

/**
 * Order item with quantity for inventory calculation
 */
export interface OrderItem {
  menuItemId: string;
  menuItemName?: string;
  quantity: number;
  modifiers?: Array<{
    modifierId: string;
    name: string;
    priceChange: number;
  }>;
  notes?: string;
}

/**
 * Zod schema for order item validation
 */
export const OrderItemSchema = z.object({
  menuItemId: z.string().min(1, 'Menu item ID is required'),
  menuItemName: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  modifiers: z
    .array(
      z.object({
        modifierId: z.string(),
        name: z.string(),
        priceChange: z.number(),
      }),
    )
    .optional(),
  notes: z.string().optional(),
});
export type OrderItemInput = z.infer<typeof OrderItemSchema>;

// ============================================================
// Ingredient Requirement Types
// ============================================================

/**
 * Aggregated ingredient requirement for an order
 */
export interface IngredientRequirement {
  ingredientId: string;
  ingredientName: string;
  unit: IngredientUnit;
  requiredQuantity: number; // Total quantity needed (including wastage)
  netQuantity: number; // Quantity without wastage
  wastageQuantity: number;
  wastagePercentage: number;
  usedInItems: Array<{
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    baseQuantity: number;
  }>;
}

/**
 * Result of ingredient requirement calculation
 */
export interface IngredientRequirementResult {
  orderId?: string;
  orderNumber?: string;
  requirements: IngredientRequirement[];
  totalIngredients: number;
  calculatedAt: Date;
}

// ============================================================
// Inventory Check Types
// ============================================================

/**
 * Inventory check result for a single ingredient
 */
export interface IngredientStockCheck {
  ingredientId: string;
  ingredientName: string;
  unit: IngredientUnit;
  required: number;
  available: number;
  shortage: number;
  isLowStock: boolean;
  minStock?: number;
}

/**
 * Result of inventory availability check
 */
export interface InventoryCheckResult {
  canFulfill: boolean;
  orderId?: string;
  orderNumber?: string;
  checks: IngredientStockCheck[];
  lowStockAlerts: IngredientStockCheck[];
  insufficientItems: IngredientStockCheck[];
  allItemsAvailable: boolean;
  checkedAt: Date;
}

// ============================================================
// Substitute Types
// ============================================================

/**
 * Ingredient substitute suggestion
 */
export interface IngredientSubstitute {
  ingredientId: string;
  ingredientName: string;
  substituteId: string;
  substituteName: string;
  unit: IngredientUnit;
  conversionFactor: number; // How many units of substitute per unit of original
  notes?: string;
  isRecommended: boolean;
}

/**
 * Low stock recipe with affected ingredients
 */
export interface LowStockRecipe {
  recipeId: string;
  menuItemId: string;
  menuItemName: string;
  affectedIngredients: Array<{
    ingredientId: string;
    ingredientName: string;
    currentStock: number;
    minStock: number;
    requiredForOneServing: number;
    maxServingsPossible: number;
    unit: IngredientUnit;
  }>;
  lowestStockPercentage: number; // 0-100
  shouldFlag: boolean;
}

// ============================================================
// Deduction Types
// ============================================================

/**
 * Result of inventory deduction for an order
 */
export interface DeductionResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  deductions: Array<{
    ingredientId: string;
    ingredientName: string;
    deductedQuantity: number;
    unit: IngredientUnit;
    previousStock: number;
    newStock: number;
  }>;
  lowStockAlerts: Array<{
    ingredientId: string;
    ingredientName: string;
    currentStock: number;
    minStock: number;
  }>;
  failedDeductions: Array<{
    ingredientId: string;
    ingredientName: string;
    reason: string;
  }>;
  deductedAt: Date;
}

// ============================================================
// Unit Conversion Types
// ============================================================

/**
 * Standard unit conversion factors (to base unit)
 * Base units: g (grams), ml (milliliters), pieces (count)
 */
export const UNIT_CONVERSIONS: Record<IngredientUnit, Record<IngredientUnit, number>> = {
  g: {
    kg: 1000,
    g: 1,
    pieces: 1,
    cups: 1,
    tbsp: 1,
    tsp: 1,
    oz: 28.3495,
    lb: 453.592,
    whole: 1,
    ml: 1,
    l: 1,
  },
  kg: {
    g: 0.001,
    kg: 1,
    pieces: 1,
    cups: 1,
    tbsp: 1,
    tsp: 1,
    oz: 0.035274,
    lb: 2.20462,
    whole: 1,
    ml: 1,
    l: 1,
  },
  ml: {
    l: 1000,
    ml: 1,
    g: 1,
    kg: 1,
    pieces: 1,
    cups: 1,
    tbsp: 1,
    tsp: 1,
    oz: 1,
    lb: 1,
    whole: 1,
  },
  l: {
    ml: 0.001,
    l: 1,
    g: 1,
    kg: 1,
    pieces: 1,
    cups: 1,
    tbsp: 1,
    tsp: 1,
    oz: 1,
    lb: 1,
    whole: 1,
  },
  pieces: {
    pieces: 1,
    g: 1,
    kg: 1,
    cups: 1,
    tbsp: 1,
    tsp: 1,
    oz: 1,
    lb: 1,
    whole: 1,
    ml: 1,
    l: 1,
  },
  cups: {
    cups: 1,
    g: 1,
    kg: 1,
    ml: 240,
    l: 0.24,
    pieces: 1,
    tbsp: 16,
    tsp: 48,
    oz: 8,
    lb: 1,
    whole: 1,
  },
  tbsp: {
    tbsp: 1,
    tsp: 3,
    cups: 0.0625,
    ml: 15,
    l: 0.015,
    g: 1,
    kg: 1,
    pieces: 1,
    oz: 0.5,
    lb: 1,
    whole: 1,
  },
  tsp: {
    tsp: 1,
    tbsp: 0.333,
    cups: 0.0208,
    ml: 5,
    l: 0.005,
    g: 1,
    kg: 1,
    pieces: 1,
    oz: 0.167,
    lb: 1,
    whole: 1,
  },
  oz: {
    oz: 1,
    g: 28.3495,
    kg: 0.0283495,
    ml: 29.5735,
    l: 0.0295735,
    pieces: 1,
    cups: 0.125,
    tbsp: 2,
    tsp: 6,
    lb: 0.0625,
    whole: 1,
  },
  lb: {
    lb: 1,
    oz: 16,
    g: 453.592,
    kg: 0.453592,
    ml: 473.176,
    l: 0.473176,
    pieces: 1,
    cups: 2,
    tbsp: 32,
    tsp: 96,
    whole: 1,
  },
  whole: {
    whole: 1,
    pieces: 1,
    g: 1,
    kg: 1,
    ml: 1,
    l: 1,
    cups: 1,
    tbsp: 1,
    tsp: 1,
    oz: 1,
    lb: 1,
  },
};

/**
 * Check if two units are compatible for conversion
 */
export function areUnitsCompatible(unit1: IngredientUnit, unit2: IngredientUnit): boolean {
  // Weight units
  const weightUnits: IngredientUnit[] = ['g', 'kg', 'oz', 'lb'];
  // Volume units
  const volumeUnits: IngredientUnit[] = ['ml', 'l', 'cups', 'tbsp', 'tsp', 'oz'];
  // Count units
  const countUnits: IngredientUnit[] = ['pieces', 'whole'];

  if (weightUnits.includes(unit1) && weightUnits.includes(unit2)) return true;
  if (volumeUnits.includes(unit1) && volumeUnits.includes(unit2)) return true;
  if (countUnits.includes(unit1) && countUnits.includes(unit2)) return true;

  return false;
}

/**
 * Convert quantity between compatible units
 */
export function convertUnit(
  quantity: number,
  fromUnit: IngredientUnit,
  toUnit: IngredientUnit,
): number | null {
  if (fromUnit === toUnit) return quantity;

  const conversion = UNIT_CONVERSIONS[fromUnit]?.[toUnit];
  if (conversion === undefined) return null;

  return quantity * conversion;
}

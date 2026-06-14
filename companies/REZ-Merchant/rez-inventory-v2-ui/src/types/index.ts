export interface Ingredient {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  costPerUnit: number;
  supplier: string;
  lastRestocked: string;
  expiryDays: number;
  status: 'healthy' | 'low' | 'critical' | 'out';
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  preparationTime: number;
  sellingPrice: number;
  foodCost: number;
  margin: number;
  popularity: number;
  status: 'active' | 'seasonal' | 'discontinued';
}

export interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  cost: number;
}

export interface StockMovement {
  id: string;
  ingredientId: string;
  ingredientName: string;
  type: 'in' | 'out' | 'waste' | 'adjustment';
  quantity: number;
  date: string;
  reason: string;
  user: string;
  cost: number;
}

export interface ForecastData {
  date: string;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface Alert {
  id: string;
  ingredientId: string;
  ingredientName: string;
  type: 'low_stock' | 'critical_stock' | 'expiring_soon' | 'out_of_stock';
  message: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  status: 'active' | 'snoozed' | 'dismissed' | 'resolved';
  snoozedUntil?: string;
}

export interface StockOverview {
  totalIngredients: number;
  healthyStock: number;
  lowStock: number;
  criticalStock: number;
  outOfStock: number;
  totalValue: number;
  lowStockItems: Ingredient[];
  recentMovements: StockMovement[];
}

export interface DemandFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  weight: number;
}

export interface RecommendedOrder {
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  recommendedQuantity: number;
  urgency: 'high' | 'medium' | 'low';
  reason: string;
  estimatedCost: number;
}

export type TimeFilter = 'today' | 'week' | 'month' | 'quarter' | 'all';
export type MovementType = 'all' | 'in' | 'out' | 'waste' | 'adjustment';

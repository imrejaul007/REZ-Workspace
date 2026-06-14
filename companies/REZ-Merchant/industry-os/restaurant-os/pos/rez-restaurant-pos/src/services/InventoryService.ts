/**
 * Inventory Service
 * Stock tracking, alerts, and reorder management
 */

import { v4 as uuidv4 } from 'uuid'

export type StockStatus = 'in_stock' | 'low_stock' | 'critical' | 'out_of_stock'

export interface Ingredient {
  id: string
  name: string
  category: string
  unit: 'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'boxes'
  currentStock: number
  minStock: number
  reorderLevel: number
  cost: number // per unit
  supplier?: string
  lastRestocked?: Date
  expiryDate?: Date
  status: StockStatus
}

export interface RecipeItem {
  ingredientId: string
  quantity: number
}

export interface Recipe {
  id: string
  name: string
  ingredients: RecipeItem[]
  yield: number // portions per batch
  costPerPortion: number
}

export interface StockAlert {
  id: string
  ingredientId: string
  type: 'low_stock' | 'critical' | 'out_of_stock' | 'expiry_warning'
  message: string
  createdAt: Date
  acknowledged: boolean
}

export interface StockMovement {
  id: string
  ingredientId: string
  type: 'purchase' | 'usage' | 'waste' | 'adjustment' | 'return'
  quantity: number
  previousStock: number
  newStock: number
  reason?: string
  createdBy: string
  createdAt: Date
}

export interface InventoryStats {
  totalItems: number
  lowStock: number
  critical: number
  outOfStock: number
  totalValue: number
  expiringThisWeek: number
}

export class InventoryService {
  private ingredients: Map<string, Ingredient> = new Map()
  private recipes: Map<string, Recipe> = new Map()
  private alerts: StockAlert[] = []
  private movements: StockMovement[] = []

  constructor() {
    this.initializeDefaultIngredients()
  }

  private initializeDefaultIngredients(): void {
    const defaults: Partial<Ingredient>[] = [
      { name: 'Rice', category: 'Grains', unit: 'kg', minStock: 20, reorderLevel: 50, cost: 45 },
      { name: 'Wheat Flour', category: 'Grains', unit: 'kg', minStock: 10, reorderLevel: 25, cost: 35 },
      { name: 'Chicken Breast', category: 'Meat', unit: 'kg', minStock: 5, reorderLevel: 15, cost: 280 },
      { name: 'Onions', category: 'Vegetables', unit: 'kg', minStock: 10, reorderLevel: 30, cost: 25 },
      { name: 'Tomatoes', category: 'Vegetables', unit: 'kg', minStock: 5, reorderLevel: 20, cost: 40 },
      { name: 'Cooking Oil', category: 'Oils', unit: 'l', minStock: 5, reorderLevel: 20, cost: 180 },
      { name: 'Ginger-Garlic Paste', category: 'Spices', unit: 'kg', minStock: 2, reorderLevel: 5, cost: 200 },
      { name: 'Garam Masala', category: 'Spices', unit: 'kg', minStock: 1, reorderLevel: 3, cost: 600 },
      { name: 'Milk', category: 'Dairy', unit: 'l', minStock: 10, reorderLevel: 30, cost: 60 },
      { name: 'Paneer', category: 'Dairy', unit: 'kg', minStock: 3, reorderLevel: 10, cost: 350 },
    ]

    defaults.forEach((ing) => {
      this.addIngredient({
        name: ing.name!,
        category: ing.category!,
        unit: ing.unit!,
        currentStock: (ing.reorderLevel || 50),
        minStock: ing.minStock || 10,
        reorderLevel: ing.reorderLevel || 25,
        cost: ing.cost || 100,
        supplier: ing.supplier,
        status: 'in_stock'
      })
    })
  }

  // ============ INGREDIENTS ============

  addIngredient(data: Partial<Ingredient> & { name: string; category: string }): Ingredient {
    const id = `ing-${uuidv4().substring(0, 8)}`
    const status = this.calculateStatus(
      data.currentStock || 0,
      data.minStock || 0,
      data.reorderLevel || 0
    )

    const ingredient: Ingredient = {
      id,
      name: data.name,
      category: data.category,
      unit: data.unit || 'pcs',
      currentStock: data.currentStock || 0,
      minStock: data.minStock || 10,
      reorderLevel: data.reorderLevel || 25,
      cost: data.cost || 0,
      supplier: data.supplier,
      status
    }

    this.ingredients.set(id, ingredient)

    if (status !== 'in_stock') {
      this.createAlert(ingredient, status)
    }

    return ingredient
  }

  updateIngredient(id: string, updates: Partial<Ingredient>): Ingredient | undefined {
    const ingredient = this.ingredients.get(id)
    if (!ingredient) return undefined

    const updated = {
      ...ingredient,
      ...updates,
      id: ingredient.id // Don't allow ID change
    }

    updated.status = this.calculateStatus(
      updated.currentStock,
      updated.minStock,
      updated.reorderLevel
    )

    this.ingredients.set(id, updated)

    if (updated.status !== 'in_stock' && ingredient.status === 'in_stock') {
      this.createAlert(updated, updated.status)
    }

    return updated
  }

  getIngredient(id: string): Ingredient | undefined {
    return this.ingredients.get(id)
  }

  getAllIngredients(): Ingredient[] {
    return Array.from(this.ingredients.values())
  }

  getIngredientsByCategory(category: string): Ingredient[] {
    return this.getAllIngredients().filter(i => i.category === category)
  }

  getLowStockIngredients(): Ingredient[] {
    return this.getAllIngredients().filter(
      i => i.status === 'low_stock' || i.status === 'critical' || i.status === 'out_of_stock'
    )
  }

  // ============ STOCK MOVEMENTS ============

  adjustStock(
    ingredientId: string,
    quantity: number,
    type: StockMovement['type'],
    createdBy: string,
    reason?: string
  ): StockMovement | undefined {
    const ingredient = this.ingredients.get(ingredientId)
    if (!ingredient) return undefined

    const previousStock = ingredient.currentStock

    let newStock = previousStock
    switch (type) {
      case 'purchase':
      case 'return':
        newStock = previousStock + quantity
        break
      case 'usage':
      case 'waste':
        newStock = Math.max(0, previousStock - quantity)
        break
      case 'adjustment':
        newStock = quantity
        break
    }

    // Update ingredient
    this.updateIngredient(ingredientId, {
      currentStock: newStock,
      lastRestored: type === 'purchase' ? new Date() : ingredient.lastRestocked
    })

    // Record movement
    const movement: StockMovement = {
      id: `mov-${uuidv4().substring(0, 8)}`,
      ingredientId,
      type,
      quantity,
      previousStock,
      newStock,
      reason,
      createdBy,
      createdAt: new Date()
    }

    this.movements.unshift(movement)

    return movement
  }

  getMovements(ingredientId?: string, limit = 100): StockMovement[] {
    let movements = this.movements

    if (ingredientId) {
      movements = movements.filter(m => m.ingredientId === ingredientId)
    }

    return movements.slice(0, limit)
  }

  // ============ RECIPES ============

  addRecipe(data: {
    name: string
    ingredients: RecipeItem[]
    yield: number
  }): Recipe {
    const id = `rec-${uuidv4().substring(0, 8)}`

    // Calculate cost per portion
    let totalCost = 0
    for (const item of data.ingredients) {
      const ing = this.ingredients.get(item.ingredientId)
      if (ing) {
        totalCost += ing.cost * item.quantity
      }
    }

    const recipe: Recipe = {
      id,
      name: data.name,
      ingredients: data.ingredients,
      yield: data.yield,
      costPerPortion: totalCost / data.yield
    }

    this.recipes.set(id, recipe)
    return recipe
  }

  getRecipe(id: string): Recipe | undefined {
    return this.recipes.get(id)
  }

  getAllRecipes(): Recipe[] {
    return Array.from(this.recipes.values())
  }

  // Calculate how many portions we can make
  calculatePortions(recipeId: string): number {
    const recipe = this.recipes.get(recipeId)
    if (!recipe) return 0

    let minPortions = Infinity

    for (const item of recipe.ingredients) {
      const ing = this.ingredients.get(item.ingredientId)
      if (!ing) return 0
      const possible = Math.floor(ing.currentStock / item.quantity)
      minPortions = Math.min(minPortions, possible)
    }

    return minPortions === Infinity ? 0 : minPortions
  }

  // Deduct ingredients for a portion
  usePortion(recipeId: string, portions: number, createdBy: string): boolean {
    const recipe = this.recipes.get(recipeId)
    if (!recipe) return false

    // Check if we have enough
    for (const item of recipe.ingredients) {
      const ing = this.ingredients.get(item.ingredientId)
      if (!ing || ing.currentStock < item.quantity * portions) {
        return false
      }
    }

    // Deduct
    for (const item of recipe.ingredients) {
      this.adjustStock(
        item.ingredientId,
        item.quantity * portions,
        'usage',
        createdBy,
        `Used for ${recipe.name} x${portions}`
      )
    }

    return true
  }

  // ============ ALERTS ============

  getActiveAlerts(): StockAlert[] {
    return this.alerts.filter(a => !a.acknowledged)
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (!alert) return false
    alert.acknowledged = true
    return true
  }

  clearOldAlerts(days = 7): void {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    this.alerts = this.alerts.filter(
      a => a.acknowledged || new Date(a.createdAt) > cutoff
    )
  }

  // ============ STATS ============

  getStats(): InventoryStats {
    const ingredients = this.getAllIngredients()
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    let totalValue = 0
    let expiringThisWeek = 0

    for (const ing of ingredients) {
      totalValue += ing.currentStock * ing.cost

      if (ing.expiryDate) {
        const expiry = new Date(ing.expiryDate)
        if (expiry <= weekFromNow && expiry >= now) {
          expiringThisWeek++
        }
      }
    }

    return {
      totalItems: ingredients.length,
      lowStock: ingredients.filter(i => i.status === 'low_stock').length,
      critical: ingredients.filter(i => i.status === 'critical').length,
      outOfStock: ingredients.filter(i => i.status === 'out_of_stock').length,
      totalValue: Math.round(totalValue * 100) / 100,
      expiringThisWeek
    }
  }

  // ============ HELPERS ============

  private calculateStatus(
    current: number,
    min: number,
    reorder: number
  ): StockStatus {
    if (current === 0) return 'out_of_stock'
    if (current <= min * 0.5) return 'critical'
    if (current <= min) return 'low_stock'
    if (current <= reorder) return 'low_stock'
    return 'in_stock'
  }

  private createAlert(ingredient: Ingredient, type: StockStatus): void {
    let message = ''
    switch (type) {
      case 'out_of_stock':
        message = `${ingredient.name} is OUT OF STOCK!`
        break
      case 'critical':
        message = `${ingredient.name} critically low (${ingredient.currentStock} ${ingredient.unit})`
        break
      case 'low_stock':
        message = `${ingredient.name} below reorder level (${ingredient.currentStock}/${ingredient.reorderLevel} ${ingredient.unit})`
        break
    }

    this.alerts.unshift({
      id: `alert-${uuidv4().substring(0, 8)}`,
      ingredientId: ingredient.id,
      type: type === 'out_of_stock' ? 'out_of_stock' : type === 'critical' ? 'critical' : 'low_stock',
      message,
      createdAt: new Date(),
      acknowledged: false
    })
  }

  // Get purchase suggestions
  getPurchaseSuggestions(): Array<{ ingredient: Ingredient; suggested: number }> {
    return this.getLowStockIngredients().map(ing => ({
      ingredient: ing,
      suggested: Math.max(ing.reorderLevel - ing.currentStock, ing.minStock * 2)
    }))
  }
}

export const inventoryService = new InventoryService()

/**
 * Inventory API Routes
 * Stock tracking, alerts, and reorder management
 */

import { Router, Request, Response } from 'express'
import { inventoryService } from '../services/InventoryService.js'

const router = Router()

// Get all ingredients
router.get('/ingredients', (req: Request, res: Response) => {
  const { category, status } = req.query

  let ingredients = inventoryService.getAllIngredients()

  if (category) {
    ingredients = ingredients.filter(i => i.category === category)
  }

  if (status) {
    ingredients = ingredients.filter(i => i.status === status)
  }

  res.json({ success: true, data: ingredients })
})

// Get single ingredient
router.get('/ingredients/:id', (req: Request, res: Response) => {
  const ingredient = inventoryService.getIngredient(req.params.id)

  if (!ingredient) {
    return res.status(404).json({ success: false, error: 'Ingredient not found' })
  }

  res.json({ success: true, data: ingredient })
})

// Add ingredient
router.post('/ingredients', (req: Request, res: Response) => {
  const { name, category, unit, currentStock, minStock, reorderLevel, cost, supplier } = req.body

  if (!name || !category) {
    return res.status(400).json({ success: false, error: 'Name and category required' })
  }

  const ingredient = inventoryService.addIngredient({
    name,
    category,
    unit,
    currentStock,
    minStock,
    reorderLevel,
    cost,
    supplier,
    status: 'in_stock'
  })

  res.status(201).json({ success: true, data: ingredient })
})

// Update ingredient
router.patch('/ingredients/:id', (req: Request, res: Response) => {
  const ingredient = inventoryService.updateIngredient(req.params.id, req.body)

  if (!ingredient) {
    return res.status(404).json({ success: false, error: 'Ingredient not found' })
  }

  res.json({ success: true, data: ingredient })
})

// Adjust stock
router.post('/ingredients/:id/adjust', (req: Request, res: Response) => {
  const { quantity, type, createdBy, reason } = req.body

  if (quantity === undefined || !type || !createdBy) {
    return res.status(400).json({ success: false, error: 'quantity, type, and createdBy required' })
  }

  const movement = inventoryService.adjustStock(req.params.id, quantity, type, createdBy, reason)

  if (!movement) {
    return res.status(404).json({ success: false, error: 'Ingredient not found' })
  }

  res.json({ success: true, data: movement })
})

// Get stock movements
router.get('/movements', (req: Request, res: Response) => {
  const { ingredientId, limit } = req.query

  const movements = inventoryService.getMovements(
    ingredientId as string,
    limit ? parseInt(limit as string) : 100
  )

  res.json({ success: true, data: movements })
})

// Get inventory stats
router.get('/stats', (req: Request, res: Response) => {
  const stats = inventoryService.getStats()
  res.json({ success: true, data: stats })
})

// Get low stock items
router.get('/alerts/low-stock', (req: Request, res: Response) => {
  const items = inventoryService.getLowStockIngredients()
  res.json({ success: true, data: items })
})

// Get active alerts
router.get('/alerts', (req: Request, res: Response) => {
  const alerts = inventoryService.getActiveAlerts()
  res.json({ success: true, data: alerts })
})

// Acknowledge alert
router.post('/alerts/:id/acknowledge', (req: Request, res: Response) => {
  const success = inventoryService.acknowledgeAlert(req.params.id)

  if (!success) {
    return res.status(404).json({ success: false, error: 'Alert not found' })
  }

  res.json({ success: true })
})

// Get purchase suggestions
router.get('/suggestions', (req: Request, res: Response) => {
  const suggestions = inventoryService.getPurchaseSuggestions()
  res.json({ success: true, data: suggestions })
})

// Get recipes
router.get('/recipes', (req: Request, res: Response) => {
  const recipes = inventoryService.getAllRecipes()
  res.json({ success: true, data: recipes })
})

// Calculate portions possible
router.get('/recipes/:id/portions', (req: Request, res: Response) => {
  const portions = inventoryService.calculatePortions(req.params.id)
  res.json({ success: true, data: { recipeId: req.params.id, portions } })
})

export default router

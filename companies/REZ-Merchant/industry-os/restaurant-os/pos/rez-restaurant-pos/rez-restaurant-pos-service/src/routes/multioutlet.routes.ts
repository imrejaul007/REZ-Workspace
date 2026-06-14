/**
 * Multi-Outlet API Routes
 * Chain management, franchise controls, regional pricing
 */

import { Router, Request, Response } from 'express'
import { multiOutletService } from '../services/MultiOutletService.js'

const router = Router()

// Get all outlets
router.get('/outlets', (req: Request, res: Response) => {
  const { merchantId, region, city, activeOnly } = req.query

  let outlets = multiOutletService.getMerchantOutlets(
    merchantId as string,
    activeOnly !== 'false'
  )

  if (region) {
    outlets = outlets.filter(o => o.region === region)
  }

  if (city) {
    outlets = outlets.filter(o => o.city === city)
  }

  res.json({ success: true, data: outlets })
})

// Get single outlet
router.get('/outlets/:id', (req: Request, res: Response) => {
  const outlet = multiOutletService.getOutlet(req.params.id)

  if (!outlet) {
    return res.status(404).json({ success: false, error: 'Outlet not found' })
  }

  res.json({ success: true, data: outlet })
})

// Get outlet by code
router.get('/outlets/code/:code', (req: Request, res: Response) => {
  const outlet = multiOutletService.getOutletByCode(req.params.code)

  if (!outlet) {
    return res.status(404).json({ success: false, error: 'Outlet not found' })
  }

  res.json({ success: true, data: outlet })
})

// Add outlet
router.post('/outlets', (req: Request, res: Response) => {
  const outlet = multiOutletService.addOutlet(req.body)
  res.status(201).json({ success: true, data: outlet })
})

// Update outlet
router.patch('/outlets/:id', (req: Request, res: Response) => {
  const outlet = multiOutletService.updateOutlet(req.params.id, req.body)

  if (!outlet) {
    return res.status(404).json({ success: false, error: 'Outlet not found' })
  }

  res.json({ success: true, data: outlet })
})

// Deactivate outlet
router.post('/outlets/:id/deactivate', (req: Request, res: Response) => {
  const success = multiOutletService.deactivateOutlet(req.params.id)

  if (!success) {
    return res.status(404).json({ success: false, error: 'Outlet not found' })
  }

  res.json({ success: true })
})

// ============ MENU OVERRIDES ============

// Get menu overrides
router.get('/outlets/:id/overrides', (req: Request, res: Response) => {
  const overrides = multiOutletService.getMenuOverrides(req.params.id)
  res.json({ success: true, data: overrides })
})

// Set menu override
router.post('/outlets/:id/overrides', (req: Request, res: Response) => {
  const { itemId, price, available, category, prepTime, notes } = req.body

  if (!itemId) {
    return res.status(400).json({ success: false, error: 'itemId required' })
  }

  const override = multiOutletService.setMenuOverride({
    outletId: req.params.id,
    itemId,
    price,
    available,
    category,
    prepTime,
    notes
  })

  res.status(201).json({ success: true, data: override })
})

// Remove menu override
router.delete('/outlets/:id/overrides/:itemId', (req: Request, res: Response) => {
  const success = multiOutletService.removeMenuOverride(req.params.id, req.params.itemId)
  res.json({ success })
})

// Get effective price
router.get('/outlets/:id/price/:itemId', (req: Request, res: Response) => {
  const { basePrice } = req.query
  const price = multiOutletService.getEffectivePrice(
    req.params.id,
    req.params.itemId,
    basePrice ? parseFloat(basePrice as string) : 0
  )
  res.json({ success: true, data: { price } })
})

// ============ REGIONAL PRICING ============

// Get regional pricing
router.get('/pricing', (req: Request, res: Response) => {
  const { region } = req.query

  if (region) {
    const pricing = multiOutletService.getRegionalPricing(region as string)
    return res.json({ success: true, data: pricing || null })
  }

  const pricing = multiOutletService.getAllRegionalPricing()
  res.json({ success: true, data: pricing })
})

// Set regional pricing
router.post('/pricing', (req: Request, res: Response) => {
  const { region, minOrder, deliveryFee, freeDeliveryThreshold, taxRate, currency } = req.body

  if (!region) {
    return res.status(400).json({ success: false, error: 'region required' })
  }

  const pricing = multiOutletService.setRegionalPricing({
    region,
    minOrder: minOrder || 0,
    deliveryFee: deliveryFee || 0,
    freeDeliveryThreshold: freeDeliveryThreshold || 0,
    taxRate: taxRate || 0.05,
    currency: currency || 'INR'
  })

  res.status(201).json({ success: true, data: pricing })
})

// Calculate delivery fee
router.get('/pricing/delivery-fee', (req: Request, res: Response) => {
  const { region, distance, orderValue } = req.query

  if (!region || distance === undefined || orderValue === undefined) {
    return res.status(400).json({
      success: false,
      error: 'region, distance, and orderValue required'
    })
  }

  const fee = multiOutletService.calculateDeliveryFee(
    region as string,
    parseFloat(distance as string),
    parseFloat(orderValue as string)
  )

  res.json({ success: true, data: { fee } })
})

// ============ ANALYTICS ============

// Get chain analytics
router.get('/analytics', (req: Request, res: Response) => {
  const { merchantId, startDate, endDate } = req.query

  if (!merchantId) {
    return res.status(400).json({ success: false, error: 'merchantId required' })
  }

  const analytics = multiOutletService.getChainAnalytics(
    merchantId as string,
    startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate ? new Date(endDate as string) : new Date()
  )

  res.json({ success: true, data: analytics })
})

// Get outlet stats
router.get('/outlets/:id/stats', (req: Request, res: Response) => {
  const { days } = req.query
  const stats = multiOutletService.getOutletStats(
    req.params.id,
    days ? parseInt(days as string) : 30
  )
  res.json({ success: true, data: stats })
})

// ============ HELPERS ============

// Get regions
router.get('/regions', (req: Request, res: Response) => {
  const regions = multiOutletService.getRegions()
  res.json({ success: true, data: regions })
})

// Get cities
router.get('/cities', (req: Request, res: Response) => {
  const cities = multiOutletService.getCities()
  res.json({ success: true, data: cities })
})

// Get states
router.get('/states', (req: Request, res: Response) => {
  const states = multiOutletService.getStates()
  res.json({ success: true, data: states })
})

// Get outlets for campaign
router.post('/campaign/target-outlets', (req: Request, res: Response) => {
  const { regions, cities, minRevenue, features } = req.body

  const outlets = multiOutletService.getOutletsForCampaign({
    regions,
    cities,
    minRevenue,
    features
  })

  res.json({ success: true, data: outlets })
})

export default router

/**
 * Delivery API Routes
 * Track orders from kitchen to customer
 */

import { Router, Request, Response } from 'express'
import { deliveryTrackingService } from '../services/DeliveryTrackingService.js'

const router = Router()

// Create delivery
router.post('/', (req: Request, res: Response) => {
  const {
    orderId,
    externalOrderId,
    aggregator,
    customerName,
    customerPhone,
    deliveryAddress,
    pickupLocation,
    dropoffLocation,
    estimatedDeliveryTime,
    distance
  } = req.body

  if (!orderId || !customerName || !customerPhone || !deliveryAddress) {
    return res.status(400).json({
      success: false,
      error: 'orderId, customerName, customerPhone, and deliveryAddress required'
    })
  }

  const delivery = deliveryTrackingService.createDelivery({
    orderId,
    externalOrderId,
    aggregator: aggregator || 'inhouse',
    customerName,
    customerPhone,
    deliveryAddress,
    pickupLocation: pickupLocation || { lat: 0, lng: 0, timestamp: new Date() },
    dropoffLocation: dropoffLocation || { lat: 0, lng: 0, timestamp: new Date() },
    estimatedDeliveryTime: estimatedDeliveryTime ? new Date(estimatedDeliveryTime) : undefined,
    distance
  })

  res.status(201).json({ success: true, data: delivery })
})

// Get all deliveries
router.get('/', (req: Request, res: Response) => {
  const { status } = req.query
  const deliveries = deliveryTrackingService.getAllDeliveries(status as unknown)
  res.json({ success: true, data: deliveries })
})

// Get single delivery
router.get('/:id', (req: Request, res: Response) => {
  const delivery = deliveryTrackingService.getDelivery(req.params.id)

  if (!delivery) {
    return res.status(404).json({ success: false, error: 'Delivery not found' })
  }

  res.json({ success: true, data: delivery })
})

// Get delivery by order ID
router.get('/order/:orderId', (req: Request, res: Response) => {
  const delivery = deliveryTrackingService.getDeliveryByOrder(req.params.orderId)

  if (!delivery) {
    return res.status(404).json({ success: false, error: 'Delivery not found' })
  }

  res.json({ success: true, data: delivery })
})

// Update status
router.patch('/:id/status', (req: Request, res: Response) => {
  const { status, note } = req.body

  if (!status) {
    return res.status(400).json({ success: false, error: 'status required' })
  }

  const delivery = deliveryTrackingService.updateStatus(req.params.id, status, note)

  if (!delivery) {
    return res.status(404).json({ success: false, error: 'Delivery not found' })
  }

  res.json({ success: true, data: delivery })
})

// Assign partner
router.post('/:id/assign', (req: Request, res: Response) => {
  const { partnerId, partnerName, partnerPhone } = req.body

  if (!partnerId || !partnerName || !partnerPhone) {
    return res.status(400).json({ success: false, error: 'partnerId, partnerName, and partnerPhone required' })
  }

  const delivery = deliveryTrackingService.assignPartner(req.params.id, partnerId, partnerName, partnerPhone)

  if (!delivery) {
    return res.status(404).json({ success: false, error: 'Delivery not found' })
  }

  res.json({ success: true, data: delivery })
})

// Update partner location
router.post('/:id/location', (req: Request, res: Response) => {
  const { lat, lng, address } = req.body

  if (lat === undefined || lng === undefined) {
    return res.status(400).json({ success: false, error: 'lat and lng required' })
  }

  const delivery = deliveryTrackingService.updatePartnerLocation(req.params.id, {
    lat,
    lng,
    address,
    timestamp: new Date()
  })

  if (!delivery) {
    return res.status(404).json({ success: false, error: 'Delivery not found' })
  }

  res.json({ success: true, data: delivery })
})

// Get tracking data
router.get('/:id/tracking', (req: Request, res: Response) => {
  const tracking = deliveryTrackingService.getTrackingData(req.params.id)

  if (!tracking) {
    return res.status(404).json({ success: false, error: 'Delivery not found' })
  }

  res.json({ success: true, data: tracking })
})

// Get tracking URL
router.get('/:id/tracking-url', (req: Request, res: Response) => {
  const url = deliveryTrackingService.generateTrackingUrl(req.params.id)
  res.json({ success: true, data: { url } })
})

// Sync with Swiggy
router.post('/:id/sync/swiggy', async (req: Request, res: Response) => {
  const success = await deliveryTrackingService.syncWithSwiggy(req.params.id)
  res.json({ success })
})

// Sync with Zomato
router.post('/:id/sync/zomato', async (req: Request, res: Response) => {
  const success = await deliveryTrackingService.syncWithZomato(req.params.id)
  res.json({ success })
})

// Get delivery stats
router.get('/stats', (req: Request, res: Response) => {
  const { days } = req.query
  const stats = deliveryTrackingService.getStats(days ? parseInt(days as string) : 7)
  res.json({ success: true, data: stats })
})

// Cancel delivery
router.post('/:id/cancel', (req: Request, res: Response) => {
  const { reason } = req.body
  const delivery = deliveryTrackingService.updateStatus(req.params.id, 'cancelled', reason)

  if (!delivery) {
    return res.status(404).json({ success: false, error: 'Delivery not found' })
  }

  res.json({ success: true, data: delivery })
})

export default router

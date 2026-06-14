import { Router, Request, Response } from 'express'
import { kdsService, CreateOrderInput } from '../services/KDSService.js'
import { logger } from '../utils/logger.js'

const router = Router()

// Get all orders
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const { storeId, status, station, limit } = req.query
    if (!storeId) {
      return res.status(400).json({ error: 'storeId required' })
    }
    const orders = await kdsService.getOrders(storeId as string, {
      status: status as string,
      station: station as string,
      limit: limit ? parseInt(limit as string) : undefined
    })
    res.json({ success: true, data: orders })
  } catch (error) {
    logger.error('Get orders failed', { error })
    res.status(500).json({ error: 'Failed to get orders' })
  }
})

// Get single order
router.get('/orders/:orderId', async (req: Request, res: Response) => {
  try {
    const order = await kdsService.getOrder(req.params.orderId)
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    res.json({ success: true, data: order })
  } catch (error) {
    logger.error('Get order failed', { error, orderId: req.params.orderId })
    res.status(500).json({ error: 'Failed to get order' })
  }
})

// Create order
router.post('/orders', async (req: Request, res: Response) => {
  try {
    const order = await kdsService.createOrder(req.body as CreateOrderInput)
    res.status(201).json({ success: true, data: order })
  } catch (error) {
    logger.error('Create order failed', { error, body: req.body })
    res.status(500).json({ error: 'Failed to create order' })
  }
})

// Update item status
router.patch('/orders/:orderId/items/:itemId/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body
    if (!['pending', 'preparing', 'ready'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }
    const order = await kdsService.updateItemStatus(
      req.params.orderId,
      req.params.itemId,
      status
    )
    if (!order) {
      return res.status(404).json({ error: 'Order or item not found' })
    }
    res.json({ success: true, data: order })
  } catch (error) {
    logger.error('Update item status failed', { error })
    res.status(500).json({ error: 'Failed to update item status' })
  }
})

// Bump order
router.post('/orders/:orderId/bump', async (req: Request, res: Response) => {
  try {
    const order = await kdsService.bumpOrder(req.params.orderId)
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    res.json({ success: true, data: order })
  } catch (error) {
    logger.error('Bump order failed', { error, orderId: req.params.orderId })
    res.status(500).json({ error: 'Failed to bump order' })
  }
})

// Recall order
router.post('/orders/:orderId/recall', async (req: Request, res: Response) => {
  try {
    const order = await kdsService.recallOrder(req.params.orderId)
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    res.json({ success: true, data: order })
  } catch (error) {
    logger.error('Recall order failed', { error, orderId: req.params.orderId })
    res.status(500).json({ error: 'Failed to recall order' })
  }
})

// Cancel order
router.post('/orders/:orderId/cancel', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body
    const order = await kdsService.cancelOrder(req.params.orderId, reason)
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    res.json({ success: true, data: order })
  } catch (error) {
    logger.error('Cancel order failed', { error, orderId: req.params.orderId })
    res.status(500).json({ error: 'Failed to cancel order' })
  }
})

// Complete order
router.post('/orders/:orderId/complete', async (req: Request, res: Response) => {
  try {
    const order = await kdsService.completeOrder(req.params.orderId)
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    res.json({ success: true, data: order })
  } catch (error) {
    logger.error('Complete order failed', { error, orderId: req.params.orderId })
    res.status(500).json({ error: 'Failed to complete order' })
  }
})

// Add note
router.post('/orders/:orderId/notes', async (req: Request, res: Response) => {
  try {
    const { itemId, note } = req.body
    if (!itemId || !note) {
      return res.status(400).json({ error: 'itemId and note required' })
    }
    const order = await kdsService.addNote(req.params.orderId, itemId, note)
    if (!order) {
      return res.status(404).json({ error: 'Order or item not found' })
    }
    res.json({ success: true, data: order })
  } catch (error) {
    logger.error('Add note failed', { error })
    res.status(500).json({ error: 'Failed to add note' })
  }
})

// Get orders by station
router.get('/stations/:station/orders', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query
    if (!storeId) {
      return res.status(400).json({ error: 'storeId required' })
    }
    const orders = await kdsService.getOrdersByStation(
      storeId as string,
      req.params.station
    )
    res.json({ success: true, data: orders })
  } catch (error) {
    logger.error('Get station orders failed', { error })
    res.status(500).json({ error: 'Failed to get station orders' })
  }
})

// Get stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query
    if (!storeId) {
      return res.status(400).json({ error: 'storeId required' })
    }
    const stats = await kdsService.getStats(storeId as string)
    res.json({ success: true, data: stats })
  } catch (error) {
    logger.error('Get stats failed', { error })
    res.status(500).json({ error: 'Failed to get stats' })
  }
})

// Sync orders
router.get('/sync', async (req: Request, res: Response) => {
  try {
    const { storeId, lastSyncAt } = req.query
    if (!storeId) {
      return res.status(400).json({ error: 'storeId required' })
    }
    const since = lastSyncAt ? new Date(lastSyncAt as string) : new Date(0)
    const result = await kdsService.syncOrders(storeId as string, since)
    res.json({ success: true, data: result })
  } catch (error) {
    logger.error('Sync orders failed', { error })
    res.status(500).json({ error: 'Failed to sync orders' })
  }
})

export default router

import { KDSOrder, IKDSOrder } from '../models/KDSOrder.js'
import { Station, IStation } from '../models/Station.js'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '../utils/logger.js'

export interface CreateOrderInput {
  merchantId: string
  storeId: string
  items: Array<{
    name: string
    quantity: number
    station: string
    modifiers?: string[]
    notes?: string
  }>
  tableNumber?: string
  customerName?: string
  orderType?: 'dine_in' | 'takeaway' | 'delivery'
  priority?: 'normal' | 'rush'
}

export interface KDSStats {
  total: number
  new: number
  inProgress: number
  ready: number
  avgWaitTime: number // minutes
}

export class KDSService {
  // Create new order for KDS
  async createOrder(input: CreateOrderInput): Promise<IKDSOrder> {
    const orderId = `KDS-${Date.now()}-${uuidv4().substring(0, 8)}`
    const orderNumber = `ORD${Date.now().toString(36).toUpperCase()}`

    const orderItems = input.items.map(item => ({
      id: uuidv4(),
      name: item.name,
      quantity: item.quantity,
      station: item.station,
      status: 'pending' as const,
      modifiers: item.modifiers || [],
      notes: item.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    const order = new KDSOrder({
      orderId,
      orderNumber,
      merchantId: input.merchantId,
      storeId: input.storeId,
      items: orderItems,
      status: 'new',
      priority: input.priority || 'normal',
      tableNumber: input.tableNumber,
      customerName: input.customerName,
      orderType: input.orderType || 'dine_in'
    })

    await order.save()
    logger.info('KDS Order created', { orderId, storeId: input.storeId })
    return order
  }

  // Get orders for a store
  async getOrders(storeId: string, filters?: {
    status?: string
    station?: string
    limit?: number
  }): Promise<IKDSOrder[]> {
    const query: Record<string, unknown> = { storeId }

    if (filters?.status) {
      query.status = filters.status
    }

    let queryBuilder = KDSOrder.find(query).sort({
      priority: -1, // rush orders first
      createdAt: 1 // then by time
    })

    if (filters?.limit) {
      queryBuilder = queryBuilder.limit(filters.limit)
    }

    const orders = await queryBuilder.exec()

    // Filter by station if needed
    if (filters?.station) {
      return orders.filter(order =>
        order.items.some(item => item.station === filters.station)
      )
    }

    return orders
  }

  // Get single order
  async getOrder(orderId: string): Promise<IKDSOrder | null> {
    return KDSOrder.findOne({ orderId })
  }

  // Update item status
  async updateItemStatus(
    orderId: string,
    itemId: string,
    status: 'pending' | 'preparing' | 'ready'
  ): Promise<IKDSOrder | null> {
    const order = await KDSOrder.findOne({ orderId })
    if (!order) return null

    const item = order.items.find(i => i.id === itemId)
    if (!item) return null

    item.status = status
    item.updatedAt = new Date()
    await order.save()

    logger.info('KDS Item status updated', { orderId, itemId, status })
    return order
  }

  // Bump order (mark items as ready, order as ready)
  async bumpOrder(orderId: string): Promise<IKDSOrder | null> {
    const order = await KDSOrder.findOne({ orderId })
    if (!order) return null

    // Mark all items as ready
    order.items.forEach(item => {
      item.status = 'ready'
      item.updatedAt = new Date()
    })
    order.status = 'ready'
    order.bumpedAt = new Date()
    await order.save()

    logger.info('KDS Order bumped', { orderId })
    return order
  }

  // Complete order
  async completeOrder(orderId: string): Promise<IKDSOrder | null> {
    const order = await KDSOrder.findOne({ orderId })
    if (!order) return null

    order.status = 'completed'
    order.completedAt = new Date()
    await order.save()

    logger.info('KDS Order completed', { orderId })
    return order
  }

  // Cancel order
  async cancelOrder(orderId: string, reason?: string): Promise<IKDSOrder | null> {
    const order = await KDSOrder.findOne({ orderId })
    if (!order) return null

    order.status = 'cancelled'
    order.items.forEach(item => {
      item.status = 'pending'
    })
    await order.save()

    logger.info('KDS Order cancelled', { orderId, reason })
    return order
  }

  // Recall order (put back to in_progress)
  async recallOrder(orderId: string): Promise<IKDSOrder | null> {
    const order = await KDSOrder.findOne({ orderId })
    if (!order) return null

    order.status = 'in_progress'
    order.bumpedAt = undefined
    await order.save()

    logger.info('KDS Order recalled', { orderId })
    return order
  }

  // Add note to order
  async addNote(orderId: string, itemId: string, note: string): Promise<IKDSOrder | null> {
    const order = await KDSOrder.findOne({ orderId })
    if (!order) return null

    const item = order.items.find(i => i.id === itemId)
    if (!item) return null

    item.notes = note
    item.updatedAt = new Date()
    await order.save()

    return order
  }

  // Get orders by station
  async getOrdersByStation(
    storeId: string,
    station: string
  ): Promise<IKDSOrder[]> {
    const orders = await KDSOrder.find({
      storeId,
      status: { $in: ['new', 'in_progress'] },
      'items.station': station,
      'items.status': { $ne: 'ready' }
    }).sort({ priority: -1, createdAt: 1 })

    // Filter to only orders with items for this station that aren't ready
    return orders.filter(order =>
      order.items.some(item =>
        item.station === station && item.status !== 'ready'
      )
    )
  }

  // Get stats for a store
  async getStats(storeId: string): Promise<KDSStats> {
    const orders = await KDSOrder.find({
      storeId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })

    const now = Date.now()
    const completedOrders = orders.filter(o => o.completedAt)
    const avgWaitTime = completedOrders.length > 0
      ? completedOrders.reduce((sum, o) =>
          sum + (o.completedAt!.getTime() - o.createdAt.getTime()), 0
        ) / completedOrders.length / 60000
      : 0

    return {
      total: orders.length,
      new: orders.filter(o => o.status === 'new').length,
      inProgress: orders.filter(o => o.status === 'in_progress').length,
      ready: orders.filter(o => o.status === 'ready').length,
      avgWaitTime: Math.round(avgWaitTime)
    }
  }

  // Sync orders (for offline recovery)
  async syncOrders(storeId: string, lastSyncAt: Date): Promise<{
    created: IKDSOrder[]
    updated: IKDSOrder[]
    deleted: string[]
  }> {
    const orders = await KDSOrder.find({
      storeId,
      updatedAt: { $gt: lastSyncAt }
    })

    const created = orders.filter(o => o.createdAt > lastSyncAt)
    const updated = orders.filter(o => o.updatedAt > lastSyncAt && o.createdAt <= lastSyncAt)

    return {
      created,
      updated,
      deleted: [] // Would need soft delete tracking for this
    }
  }
}

export const kdsService = new KDSService()

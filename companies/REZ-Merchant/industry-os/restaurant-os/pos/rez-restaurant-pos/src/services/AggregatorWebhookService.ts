import logger from './utils/logger';

/**
 * Aggregator Webhook Service
 * Handles push notifications from Swiggy/Zomato
 */

import { v4 as uuidv4 } from 'uuid'

export type Aggregator = 'swiggy' | 'zomato'

export interface WebhookPayload {
  aggregator: Aggregator
  eventType: string
  orderId: string
  data: Record<string, unknown>
  timestamp: Date
  signature?: string
}

export interface WebhookHandler {
  id: string
  aggregator: Aggregator
  eventType: string
  callback: (payload: WebhookPayload) => Promise<void>
  enabled: boolean
}

export interface WebhookLog {
  id: string
  aggregator: Aggregator
  eventType: string
  orderId: string
  payload: Record<string, unknown>
  status: 'received' | 'processing' | 'processed' | 'failed'
  error?: string
  createdAt: Date
  processedAt?: Date
}

export interface OrderWebhookData {
  orderId: string
  externalOrderId: string
  customerName: string
  customerPhone: string
  items: Array<{
    name: string
    quantity: number
    price: number
    notes?: string
  }>
  subtotal: number
  tax: number
  deliveryFee: number
  total: number
  deliveryAddress?: string
  specialInstructions?: string
  orderTime: Date
}

export class AggregatorWebhookService {
  private handlers: Map<string, WebhookHandler> = new Map()
  private logs: WebhookLog[] = []
  private secretKeys: Map<Aggregator, string> = new Map()

  constructor() {
    // Set default handlers for common events
    this.registerHandler({
      aggregator: 'swiggy',
      eventType: 'order.created',
      callback: this.handleOrderCreated.bind(this)
    })
    this.registerHandler({
      aggregator: 'swiggy',
      eventType: 'order.status_changed',
      callback: this.handleStatusChanged.bind(this)
    })
    this.registerHandler({
      aggregator: 'swiggy',
      eventType: 'order.cancelled',
      callback: this.handleOrderCancelled.bind(this)
    })
    this.registerHandler({
      aggregator: 'zomato',
      eventType: 'order.placed',
      callback: this.handleOrderCreated.bind(this)
    })
    this.registerHandler({
      aggregator: 'zomato',
      eventType: 'order.status',
      callback: this.handleStatusChanged.bind(this)
    })
    this.registerHandler({
      aggregator: 'zomato',
      eventType: 'order.cancelled',
      callback: this.handleOrderCancelled.bind(this)
    })
  }

  // ============ WEBHOOK RECEIPT ============

  async receiveWebhook(aggregator: Aggregator, payload: Record<string, unknown>): Promise<{
    success: boolean
    orderId?: string
    error?: string
  }> {
    const eventType = payload.event_type as string || payload.eventType as string || 'unknown'
    const orderId = payload.order_id as string || payload.orderId as string || ''

    // Log receipt
    const log: WebhookLog = {
      id: `log-${uuidv4().substring(0, 8)}`,
      aggregator,
      eventType,
      orderId,
      payload,
      status: 'received',
      createdAt: new Date()
    }
    this.logs.unshift(log)

    // Find and execute handler
    const handler = this.handlers.get(`${aggregator}:${eventType}`)
    if (!handler || !handler.enabled) {
      logger.info(`[Webhook] No handler for ${aggregator}:${eventType}`)
      log.status = 'processed'
      return { success: true, orderId }
    }

    try {
      log.status = 'processing'
      await handler.callback({
        aggregator,
        eventType,
        orderId,
        data: payload,
        timestamp: new Date()
      })
      log.status = 'processed'
      log.processedAt = new Date()
      return { success: true, orderId }
    } catch (error) {
      log.status = 'failed'
      log.error = error instanceof Error ? error.message : 'Unknown error'
      logger.error([Webhook] Handler failed:`, error)
      return { success: false, orderId, error: log.error }
    }
  }

  // ============ HANDLER REGISTRATION ============

  registerHandler(config: {
    aggregator: Aggregator
    eventType: string
    callback: (payload: WebhookPayload) => Promise<void>
  }): void {
    const id = `${config.aggregator}:${config.eventType}`
    const handler: WebhookHandler = {
      id,
      aggregator: config.aggregator,
      eventType: config.eventType,
      callback: config.callback,
      enabled: true
    }
    this.handlers.set(id, handler)
    logger.info(`[Webhook] Registered handler: ${id}`)
  }

  unregisterHandler(aggregator: Aggregator, eventType: string): boolean {
    return this.handlers.delete(`${aggregator}:${eventType}`)
  }

  enableHandler(aggregator: Aggregator, eventType: string): void {
    const handler = this.handlers.get(`${aggregator}:${eventType}`)
    if (handler) handler.enabled = true
  }

  disableHandler(aggregator: Aggregator, eventType: string): void {
    const handler = this.handlers.get(`${aggregator}:${eventType}`)
    if (handler) handler.enabled = false
  }

  getHandlers(): WebhookHandler[] {
    return Array.from(this.handlers.values())
  }

  // ============ SECRET KEYS ============

  setSecretKey(aggregator: Aggregator, secret: string): void {
    this.secretKeys.set(aggregator, secret)
  }

  verifySignature(aggregator: Aggregator, payload: string, signature: string): boolean {
    const secret = this.secretKeys.get(aggregator)
    if (!secret) return true // Skip verification if no secret set

    // In production, implement HMAC-SHA256 verification
    // const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    // return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    return true
  }

  // ============ DEFAULT HANDLERS ============

  private async handleOrderCreated(payload: WebhookPayload): Promise<void> {
    logger.info([Webhook] New order from ${payload.aggregator}:`, payload.orderId)

    // Parse order data
    const data = payload.data as Record<string, unknown>
    const orderData: OrderWebhookData = {
      orderId: payload.orderId,
      externalOrderId: (data.order_id || data.orderId) as string,
      customerName: (data.customer_name || data.customerName) as string,
      customerPhone: (data.customer_phone || data.customerPhone) as string,
      items: (data.items || []) as OrderWebhookData['items'],
      subtotal: (data.subtotal || 0) as number,
      tax: (data.tax || 0) as number,
      deliveryFee: (data.delivery_fee || data.deliveryFee || 0) as number,
      total: (data.total || 0) as number,
      deliveryAddress: (data.delivery_address || data.deliveryAddress) as string,
      orderTime: new Date(data.order_time || data.orderTime || Date.now())
    }

    // Create local order from aggregator data
    try {
      await this.orderService.createFromAggregator(orderData);
      await this.kdsIntegration.createOrder(orderData);
      await this.channelManager.updateOrderStatus(orderData.externalOrderId, 'accepted');
      logger.info([Webhook] Order created locally:`, orderData.orderId);
    } catch (error) {
      logger.error('[Webhook] Failed to process order', { orderData, error });
      throw error;
    }
  }

  private async handleStatusChanged(payload: WebhookPayload): Promise<void> {
    logger.info([Webhook] Status changed for ${payload.orderId}:`, payload.data)

    const data = payload.data as Record<string, unknown>
    const status = data.status as string
    const externalOrderId = data.order_id || data.orderId

    // Map aggregator status to local status
    const statusMap: Record<string, string> = {
      'placed': 'pending',
      'confirmed': 'confirmed',
      'preparing': 'preparing',
      'ready': 'ready',
      'picked_up': 'out_for_delivery',
      'delivered': 'delivered'
    }

    // Update local order status and send notification
    try {
      const mappedStatus = statusMap[status] || status;
      await this.orderService.updateStatus(externalOrderId, mappedStatus);
      await this.notificationService.send({
        type: 'order_update',
        orderId: externalOrderId,
        status: mappedStatus
      });
      logger.info(`[Webhook] Status updated: ${externalOrderId} -> ${status}`);
    } catch (error) {
      logger.error('[Webhook] Failed to update order status', { externalOrderId, status, error });
    }
  }

  private async handleOrderCancelled(payload: WebhookPayload): Promise<void> {
    logger.info([Webhook] Order cancelled:`, payload.orderId)

    const data = payload.data as Record<string, unknown>
    const externalOrderId = data.order_id || data.orderId
    const reason = data.reason as string

    // Cancel local order, release KDS, and send notification
    try {
      await this.orderService.cancel(externalOrderId, reason);
      await this.kdsService.cancelOrder(externalOrderId, reason);
      await this.notificationService.send({
        type: 'order_cancelled',
        orderId: externalOrderId,
        reason
      });
      logger.info(`[Webhook] Order cancelled: ${externalOrderId}`, { reason });
    } catch (error) {
      logger.error('[Webhook] Failed to cancel order', { externalOrderId, reason, error });
    }

    logger.info(`[Webhook] Order cancelled: ${externalOrderId}, reason: ${reason}`)
  }

  // ============ LOGS ============

  getLogs(limit = 100, aggregator?: Aggregator): WebhookLog[] {
    let logs = this.logs
    if (aggregator) {
      logs = logs.filter(l => l.aggregator === aggregator)
    }
    return logs.slice(0, limit)
  }

  getFailedLogs(aggregator?: Aggregator): WebhookLog[] {
    let logs = this.logs.filter(l => l.status === 'failed')
    if (aggregator) {
      logs = logs.filter(l => l.aggregator === aggregator)
    }
    return logs
  }

  // ============ HEALTH CHECK ============

  getHealth(): {
    handlers: { total: number; enabled: number }
    logs: { received: number; processed: number; failed: number }
    aggregators: Aggregator[]
  } {
    const handlerList = this.getHandlers()
    return {
      handlers: {
        total: handlerList.length,
        enabled: handlerList.filter(h => h.enabled).length
      },
      logs: {
        received: this.logs.length,
        processed: this.logs.filter(l => l.status === 'processed').length,
        failed: this.logs.filter(l => l.status === 'failed').length
      },
      aggregators: ['swiggy', 'zomato']
    }
  }
}

export const aggregatorWebhookService = new AggregatorWebhookService()

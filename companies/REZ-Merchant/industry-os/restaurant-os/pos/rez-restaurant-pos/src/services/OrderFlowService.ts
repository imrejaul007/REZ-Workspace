/**
 * Order Flow Service
 * Connects POS → KDS → Kitchen → Payment
 */

import { v4 as uuidv4 } from 'uuid'
import { printerService, KOTData, ReceiptData } from './PrinterService.js'
import { createKDSIntegration, KDSOrder } from './KDSIntegration.js'

export interface OrderFlowConfig {
  merchantId: string
  storeId: string
  kdsUrl?: string
  autoPrintKOT?: boolean
  autoPrintReceipt?: boolean
}

export interface POSOrderItem {
  id: string
  name: string
  quantity: number
  price: number
  category: string
  modifiers?: string[]
  notes?: string
  station: string
}

export interface OrderFlowResult {
  success: boolean
  orderId: string
  kdsOrder?: KDSOrder
  kotJobId?: string
  receiptJobId?: string
  error?: string
}

export class OrderFlowService {
  private config: OrderFlowConfig
  private kds: ReturnType<typeof createKDSIntegration>

  constructor(config: OrderFlowConfig) {
    this.config = {
      kdsUrl: 'http://localhost:4014',
      autoPrintKOT: true,
      autoPrintReceipt: true,
      ...config
    }
    this.kds = createKDSIntegration(config.merchantId, config.storeId)
  }

  /**
   * Start the complete order flow when a bill is opened
   */
  async startOrder(items: POSOrderItem[]): Promise<OrderFlowResult> {
    try {
      const orderId = `ORD-${uuidv4().substring(0, 8)}`

      // Group items by station
      const itemsByStation = this.groupByStation(items)

      // Create KDS order
      const kdsOrder = await this.kds.createOrder({
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          station: item.station,
          modifiers: item.modifiers,
          notes: item.notes
        })),
        orderType: 'dine_in'
      })

      // Print KOT for kitchen
      let kotJobId: string | undefined
      if (this.config.autoPrintKOT) {
        const kotJob = await printerService.printKOT({
          orderNumber: kdsOrder.orderNumber,
          items: items,
          orderType: 'dine_in',
          createdAt: new Date()
        })
        kotJobId = kotJob.id
      }

      return {
        success: true,
        orderId,
        kdsOrder,
        kotJobId
      }
    } catch (error) {
      return {
        success: false,
        orderId: '',
        error: error instanceof Error ? error.message : 'Order flow failed'
      }
    }
  }

  /**
   * Complete the order flow when payment is received
   */
  async completeOrder(
    kdsOrderId: string,
    paymentMethod: string,
    restaurantInfo: {
      name: string
      address: string
      phone: string
    },
    items: POSOrderItem[],
    totals: {
      subtotal: number
      tax: number
      discount: number
      total: number
    }
  ): Promise<OrderFlowResult> {
    try {
      // Bump KDS order (mark ready)
      await this.kds.bumpOrder(kdsOrderId)

      // Print receipt
      let receiptJobId: string | undefined
      if (this.config.autoPrintReceipt) {
        const receiptJob = await printerService.printReceipt({
          restaurantName: restaurantInfo.name,
          address: restaurantInfo.address,
          phone: restaurantInfo.phone,
          orderNumber: kdsOrderId,
          date: new Date(),
          items: items,
          subtotal: totals.subtotal,
          tax: totals.tax,
          discount: totals.discount,
          total: totals.total,
          paymentMethod
        })
        receiptJobId = receiptJob.id
      }

      // Open cash drawer
      await printerService.openDrawer()

      return {
        success: true,
        orderId: kdsOrderId,
        receiptJobId
      }
    } catch (error) {
      return {
        success: false,
        orderId: kdsOrderId,
        error: error instanceof Error ? error.message : 'Completion failed'
      }
    }
  }

  /**
   * Cancel order flow
   */
  async cancelOrder(kdsOrderId: string, reason: string): Promise<OrderFlowResult> {
    try {
      await this.kds.cancelOrder(kdsOrderId, reason)

      return {
        success: true,
        orderId: kdsOrderId
      }
    } catch (error) {
      return {
        success: false,
        orderId: kdsOrderId,
        error: error instanceof Error ? error.message : 'Cancel failed'
      }
    }
  }

  /**
   * Get order status from KDS
   */
  async getOrderStatus(kdsOrderId: string): Promise<KDSOrder | null> {
    try {
      const orders = await this.kds.getOrders()
      return orders.find(o => o.orderId === kdsOrderId) || null
    } catch {
      return null
    }
  }

  /**
   * Recall order (put back to kitchen)
   */
  async recallOrder(kdsOrderId: string): Promise<OrderFlowResult> {
    try {
      await this.kds.recallOrder(kdsOrderId)

      // Re-print KOT
      const kotJob = await printerService.printKOT({
        orderNumber: kdsOrderId,
        items: [],
        orderType: 'dine_in',
        createdAt: new Date()
      })

      return {
        success: true,
        orderId: kdsOrderId,
        kotJobId: kotJob.id
      }
    } catch (error) {
      return {
        success: false,
        orderId: kdsOrderId,
        error: error instanceof Error ? error.message : 'Recall failed'
      }
    }
  }

  /**
   * Update item status in KDS
   */
  async updateItemStatus(
    kdsOrderId: string,
    itemId: string,
    status: 'pending' | 'preparing' | 'ready'
  ): Promise<OrderFlowResult> {
    try {
      await this.kds.updateItemStatus(kdsOrderId, itemId, status)

      return {
        success: true,
        orderId: kdsOrderId
      }
    } catch (error) {
      return {
        success: false,
        orderId: kdsOrderId,
        error: error instanceof Error ? error.message : 'Update failed'
      }
    }
  }

  /**
   * Print duplicate receipt
   */
  async printDuplicateReceipt(
    kdsOrderId: string,
    restaurantInfo: {
      name: string
      address: string
      phone: string
    },
    items: POSOrderItem[],
    totals: { subtotal: number; tax: number; total: number }
  ): Promise<string | null> {
    try {
      const job = await printerService.printReceipt({
        restaurantName: restaurantInfo.name,
        address: restaurantInfo.address,
        phone: restaurantInfo.phone,
        orderNumber: `${kdsOrderId}-DUPLICATE`,
        date: new Date(),
        items,
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        paymentMethod: 'DUPLICATE'
      })
      return job.id
    } catch {
      return null
    }
  }

  /**
   * Group items by station for kitchen routing
   */
  private groupByStation(items: POSOrderItem[]): Map<string, POSOrderItem[]> {
    const grouped = new Map<string, POSOrderItem[]>()

    for (const item of items) {
      const station = item.station || 'default'
      if (!grouped.has(station)) {
        grouped.set(station, [])
      }
      grouped.get(station)!.push(item)
    }

    return grouped
  }

  /**
   * Connect to KDS WebSocket
   */
  connect(): void {
    this.kds.connect()
  }

  /**
   * Disconnect from KDS
   */
  disconnect(): void {
    this.kds.disconnect()
  }

  /**
   * Subscribe to KDS events
   */
  on(event: string, callback: (data: unknown) => void): () => void {
    return this.kds.on(event, callback)
  }
}

// Default station mapping for restaurants
export const DEFAULT_STATION_MAP: Record<string, string> = {
  'main': 'grill',
  'curry': 'saute',
  'biryani': 'rice',
  'tandoor': 'tandoor',
  'fry': 'fry',
  'dessert': 'dessert',
  'beverage': 'bar',
  'bread': 'tandoor',
  'starter': 'grill',
  'salad': 'cold'
}

export function getStationForCategory(category: string): string {
  const lower = category.toLowerCase()
  return DEFAULT_STATION_MAP[lower] || 'grill'
}

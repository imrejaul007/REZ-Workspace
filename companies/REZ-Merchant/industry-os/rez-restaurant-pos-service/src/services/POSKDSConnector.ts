/**
 * POS to KDS Connector
 * Server-side HTTP calls from POS to KDS Service
 */

import { v4 as uuidv4 } from 'uuid'
import { printerService } from './PrinterService.js'

const KDS_SERVICE_URL = process.env.KDS_SERVICE_URL || 'http://localhost:4014'

export interface KDSOrderItem {
  name: string
  quantity: number
  station: string
  modifiers?: string[]
  notes?: string
}

export interface CreateKDSOrderRequest {
  merchantId: string
  storeId: string
  items: KDSOrderItem[]
  tableNumber?: string
  customerName?: string
  orderType?: 'dine_in' | 'takeaway' | 'delivery'
  priority?: 'normal' | 'rush'
}

export interface KDSOrderResponse {
  orderId: string
  orderNumber: string
  status: string
  items: Array<{
    id: string
    name: string
    quantity: number
    station: string
    status: string
  }>
  createdAt: string
}

export interface POSBillItem {
  id: string
  name: string
  quantity: number
  price: number
  category: string
  station: string
  modifiers?: string[]
  notes?: string
}

export interface POSBill {
  billId: string
  orderId?: string
  items: POSBillItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  tableNumber?: string
  customerName?: string
  orderType: 'dine_in' | 'takeaway' | 'delivery'
  createdAt: Date
}

export class POSKDSConnector {
  private storeId: string
  private merchantId: string

  constructor(merchantId: string, storeId: string) {
    this.merchantId = merchantId
    this.storeId = storeId
  }

  /**
   * Create KDS order from POS bill
   */
  async createKDSOrderFromBill(bill: POSBill): Promise<{
    success: boolean
    kdsOrder?: KDSOrderResponse
    error?: string
  }> {
    try {
      const request: CreateKDSOrderRequest = {
        merchantId: this.merchantId,
        storeId: this.storeId,
        items: bill.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          station: item.station || 'main',
          modifiers: item.modifiers,
          notes: item.notes
        })),
        tableNumber: bill.tableNumber,
        customerName: bill.customerName,
        orderType: bill.orderType,
        priority: 'normal'
      }

      const response = await fetch(`${KDS_SERVICE_URL}/api/v1/kds/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        const error = await response.json()
        return { success: false, error: error.message || 'Failed to create KDS order' }
      }

      const data = await response.json()
      return { success: true, kdsOrder: data.data }
    } catch (error) {
      console.error('[POS-KDS] Failed to create order:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  /**
   * Print KOT for kitchen
   */
  async printKOT(kdsOrder: KDSOrderResponse): Promise<{
    success: boolean
    jobId?: string
    error?: string
  }> {
    try {
      const kotJob = await printerService.printKOT({
        orderNumber: kdsOrder.orderNumber,
        tableNumber: kdsOrder.tableNumber as unknown as string || '',
        items: kdsOrder.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          modifiers: item.modifiers
        })),
        orderType: 'dine_in' as const,
        createdAt: new Date()
      })

      return { success: true, jobId: kotJob.id }
    } catch (error) {
      console.error('[POS-KDS] Failed to print KOT:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Print failed'
      }
    }
  }

  /**
   * Bump KDS order when items are ready
   */
  async bumpKDSOrder(orderId: string): Promise<{
    success: boolean
    kdsOrder?: KDSOrderResponse
    error?: string
  }> {
    try {
      const response = await fetch(`${KDS_SERVICE_URL}/api/v1/kds/orders/${orderId}/bump`, {
        method: 'POST',
        signal: AbortSignal.timeout(5000)
      })

      if (!response.ok) {
        const error = await response.json()
        return { success: false, error: error.message || 'Failed to bump order' }
      }

      const data = await response.json()
      return { success: true, kdsOrder: data.data }
    } catch (error) {
      console.error('[POS-KDS] Failed to bump order:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  /**
   * Complete KDS order
   */
  async completeKDSOrder(orderId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const response = await fetch(`${KDS_SERVICE_URL}/api/v1/kds/orders/${orderId}/complete`, {
        method: 'POST',
        signal: AbortSignal.timeout(5000)
      })

      if (!response.ok) {
        const error = await response.json()
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('[POS-KDS] Failed to complete order:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  /**
   * Print receipt
   */
  async printReceipt(bill: POSBill, paymentMethod: string): Promise<{
    success: boolean
    jobId?: string
    error?: string
  }> {
    try {
      const receiptJob = await printerService.printReceipt({
        restaurantName: 'Restaurant Name', // Would come from config
        address: 'Address',
        phone: '+91-XXXXXXXXXX',
        orderNumber: bill.billId,
        date: bill.createdAt,
        items: bill.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          modifiers: item.modifiers
        })),
        subtotal: bill.subtotal,
        tax: bill.tax,
        discount: bill.discount,
        total: bill.total,
        paymentMethod
      })

      return { success: true, jobId: receiptJob.id }
    } catch (error) {
      console.error('[POS-KDS] Failed to print receipt:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Print failed'
      }
    }
  }

  /**
   * Open cash drawer
   */
  async openDrawer(): Promise<void> {
    try {
      await printerService.openDrawer()
    } catch (error) {
      console.error('[POS-KDS] Failed to open drawer:', error)
    }
  }

  /**
   * Get KDS order status
   */
  async getKDSOrderStatus(orderId: string): Promise<{
    success: boolean
    kdsOrder?: KDSOrderResponse
    error?: string
  }> {
    try {
      const response = await fetch(`${KDS_SERVICE_URL}/api/v1/kds/orders/${orderId}`, {
        signal: AbortSignal.timeout(5000)
      })

      if (!response.ok) {
        return { success: false, error: 'Order not found' }
      }

      const data = await response.json()
      return { success: true, kdsOrder: data.data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  /**
   * Complete bill flow:
   * 1. Create KDS order
   * 2. Print KOT
   * 3. (Later) Bump when ready
   * 4. (Later) Print receipt on payment
   */
  async completeBillFlow(
    bill: POSBill,
    paymentMethod: string
  ): Promise<{
    success: boolean
    kdsOrder?: KDSOrderResponse
    kotJobId?: string
    receiptJobId?: string
    error?: string
  }> {
    // Step 1: Create KDS order
    const kdsResult = await this.createKDSOrderFromBill(bill)
    if (!kdsResult.success || !kdsResult.kdsOrder) {
      return { success: false, error: kdsResult.error }
    }

    // Step 2: Print KOT
    const kotResult = await this.printKOT(kdsResult.kdsOrder)
    if (!kotResult.success) {
      console.warn('[POS-KDS] KOT print failed, continuing:', kotResult.error)
    }

    return {
      success: true,
      kdsOrder: kdsResult.kdsOrder,
      kotJobId: kotResult.jobId
    }
  }

  /**
   * Mark bill as paid and complete
   */
  async completePaymentFlow(
    bill: POSBill,
    kdsOrderId: string,
    paymentMethod: string
  ): Promise<{
    success: boolean
    receiptJobId?: string
    error?: string
  }> {
    // Step 1: Bump KDS order
    await this.bumpKDSOrder(kdsOrderId)

    // Step 2: Print receipt
    const receiptResult = await this.printReceipt(bill, paymentMethod)

    // Step 3: Open drawer
    await this.openDrawer()

    // Step 4: Complete KDS order
    await this.completeKDSOrder(kdsOrderId)

    return {
      success: true,
      receiptJobId: receiptResult.jobId
    }
  }
}

// Factory function
export function createPOSKDSConnector(merchantId: string, storeId: string): POSKDSConnector {
  return new POSKDSConnector(merchantId, storeId)
}

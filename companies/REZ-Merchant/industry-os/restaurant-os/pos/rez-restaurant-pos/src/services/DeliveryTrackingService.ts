import logger from './utils/logger';

/**
 * Delivery Tracking Service
 * Track orders from kitchen to customer
 */

import { v4 as uuidv4 } from 'uuid'

export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'arriving'
  | 'delivered'
  | 'cancelled'
  | 'failed'

export type DeliveryPartner = 'swiggy' | 'zomato' | 'inhouse' | 'manual'

export interface Location {
  lat: number
  lng: number
  address?: string
  timestamp: Date
}

export interface DeliveryOrder {
  id: string
  orderId: string
  externalOrderId?: string
  aggregator: DeliveryPartner
  status: DeliveryStatus
  customerName: string
  customerPhone: string
  deliveryAddress: string
  pickupLocation: Location
  dropoffLocation: Location
  estimatedPickupTime?: Date
  estimatedDeliveryTime?: Date
  actualPickupTime?: Date
  actualDeliveryTime?: Date
  partnerId?: string
  partnerName?: string
  partnerPhone?: string
  partnerLocation?: Location
  route?: Location[]
  distance?: number // km
  createdAt: Date
  updatedAt: Date
}

export interface DeliveryEvent {
  id: string
  deliveryId: string
  type: 'status_change' | 'location_update' | 'eta_update' | 'note'
  status?: DeliveryStatus
  location?: Location
  eta?: Date
  note?: string
  createdAt: Date
}

export interface DeliveryConfig {
  autoAssign: boolean
  inhouseRadius: number // km - beyond this, use aggregator
  defaultPartner: DeliveryPartner
  allowCustomerTracking: boolean
  sendSMSUpdates: boolean
  sendPushUpdates: boolean
}

export interface DeliveryStats {
  date: Date
  total: number
  delivered: number
  cancelled: number
  failed: number
  avgDeliveryTime: number // minutes
  onTimeRate: number // percentage
}

export class DeliveryTrackingService {
  private orders: Map<string, DeliveryOrder> = new Map()
  private events: Map<string, DeliveryEvent[]> = new Map()
  private config: DeliveryConfig = {
    autoAssign: false,
    inhouseRadius: 5,
    defaultPartner: 'inhouse',
    allowCustomerTracking: true,
    sendSMSUpdates: true,
    sendPushUpdates: true
  }

  // ============ ORDER MANAGEMENT ============

  createDelivery(data: {
    orderId: string
    externalOrderId?: string
    aggregator: DeliveryPartner
    customerName: string
    customerPhone: string
    deliveryAddress: string
    pickupLocation: Location
    dropoffLocation: Location
    estimatedDeliveryTime?: Date
    distance?: number
  }): DeliveryOrder {
    const id = `del-${uuidv4().substring(0, 8)}`

    const delivery: DeliveryOrder = {
      id,
      orderId: data.orderId,
      externalOrderId: data.externalOrderId,
      aggregator: data.aggregator,
      status: 'pending',
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      deliveryAddress: data.deliveryAddress,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      estimatedDeliveryTime: data.estimatedDeliveryTime,
      distance: data.distance,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.orders.set(id, delivery)
    this.addEvent(id, { type: 'status_change', status: 'pending' })

    return delivery
  }

  getDelivery(id: string): DeliveryOrder | undefined {
    return this.orders.get(id)
  }

  getDeliveryByOrder(orderId: string): DeliveryOrder | undefined {
    return Array.from(this.orders.values()).find(d => d.orderId === orderId)
  }

  getAllDeliveries(status?: DeliveryStatus): DeliveryOrder[] {
    let deliveries = Array.from(this.orders.values())
    if (status) {
      deliveries = deliveries.filter(d => d.status === status)
    }
    return deliveries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  // ============ STATUS UPDATES ============

  updateStatus(id: string, status: DeliveryStatus, note?: string): DeliveryOrder | undefined {
    const delivery = this.orders.get(id)
    if (!delivery) return undefined

    const oldStatus = delivery.status
    delivery.status = status
    delivery.updatedAt = new Date()

    // Set timestamps for certain statuses
    if (status === 'picked_up' && !delivery.actualPickupTime) {
      delivery.actualPickupTime = new Date()
    }
    if (status === 'delivered' && !delivery.actualDeliveryTime) {
      delivery.actualDeliveryTime = new Date()
    }

    this.addEvent(id, {
      type: 'status_change',
      status,
      note: note || `Status changed from ${oldStatus} to ${status}`
    })

    // Send status update notifications
    if (this.config.sendPushUpdates && delivery.customerPhone) {
      this.sendDeliveryNotification(delivery, status);
    }

    return delivery
  }

  assignPartner(
    id: string,
    partnerId: string,
    partnerName: string,
    partnerPhone: string
  ): DeliveryOrder | undefined {
    const delivery = this.orders.get(id)
    if (!delivery) return undefined

    delivery.partnerId = partnerId
    delivery.partnerName = partnerName
    delivery.partnerPhone = partnerPhone
    delivery.status = 'assigned'
    delivery.updatedAt = new Date()

    this.addEvent(id, {
      type: 'status_change',
      status: 'assigned',
      note: `Assigned to ${partnerName}`
    })

    return delivery
  }

  // ============ LOCATION TRACKING ============

  updatePartnerLocation(id: string, location: Location): DeliveryOrder | undefined {
    const delivery = this.orders.get(id)
    if (!delivery) return undefined

    delivery.partnerLocation = location
    delivery.updatedAt = new Date()

    // Update route
    if (!delivery.route) {
      delivery.route = []
    }
    delivery.route.push(location)

    this.addEvent(id, {
      type: 'location_update',
      location
    })

    // Calculate new ETA based on location
    const eta = this.calculateETA(delivery, location)
    if (eta) {
      this.updateETA(id, eta)
    }

    return delivery
  }

  updateETA(id: string, eta: Date): DeliveryOrder | undefined {
    const delivery = this.orders.get(id)
    if (!delivery) return undefined

    const oldETA = delivery.estimatedDeliveryTime
    delivery.estimatedDeliveryTime = eta
    delivery.updatedAt = new Date()

    this.addEvent(id, {
      type: 'eta_update',
      eta,
      note: oldETA
        ? `ETA updated from ${oldETA.toLocaleTimeString()} to ${eta.toLocaleTimeString()}`
        : `ETA set to ${eta.toLocaleTimeString()}`
    })

    return delivery
  }

  // ============ AGGREGATOR SYNC ============

  async syncWithSwiggy(deliveryId: string): Promise<boolean> {
    const delivery = this.orders.get(deliveryId)
    if (!delivery) return false

    try {
      // In production, call Swiggy API
      // const response = await fetch(`https://api.swiggy.com/partner/v1/delivery/${delivery.externalOrderId}`, {
      //   headers: { 'Authorization': `Bearer ${swiggyToken}` }
      // })
      // const data = await response.json()

      // Update status based on Swiggy response
      // await this.updateStatus(deliveryId, data.status)

      logger.info(`[Delivery] Synced with Swiggy: ${deliveryId}`)
      return true
    } catch (error) {
      console.error(`[Delivery] Swiggy sync failed:`, error)
      return false
    }
  }

  async syncWithZomato(deliveryId: string): Promise<boolean> {
    const delivery = this.orders.get(deliveryId)
    if (!delivery) return false

    try {
      // In production, call Zomato API
      logger.info(`[Delivery] Synced with Zomato: ${deliveryId}`)
      return true
    } catch (error) {
      console.error(`[Delivery] Zomato sync failed:`, error)
      return false
    }
  }

  // ============ CUSTOMER TRACKING ============

  getTrackingData(id: string): {
    status: DeliveryStatus
    partnerName?: string
    partnerPhone?: string
    partnerLocation?: Location
    estimatedDeliveryTime?: Date
    route?: Location[]
    events: DeliveryEvent[]
  } | null {
    const delivery = this.orders.get(id)
    if (!delivery) return null

    if (!this.config.allowCustomerTracking && delivery.aggregator !== 'inhouse') {
      return {
        status: delivery.status,
        estimatedDeliveryTime: delivery.estimatedDeliveryTime,
        events: this.events.get(id) || []
      }
    }

    return {
      status: delivery.status,
      partnerName: delivery.partnerName,
      partnerPhone: delivery.partnerPhone,
      partnerLocation: delivery.partnerLocation,
      estimatedDeliveryTime: delivery.estimatedDeliveryTime,
      route: delivery.route,
      events: this.events.get(id) || []
    }
  }

  generateTrackingUrl(id: string): string {
    // Generate a short tracking URL
    return `https://rez.money/track/${id}`
  }

  // ============ STATISTICS ============

  getStats(days = 7): DeliveryStats[] {
    const stats: DeliveryStats[] = []
    const now = new Date()

    for (let i = 0; i < days; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayDeliveries = Array.from(this.orders.values()).filter(d =>
        d.createdAt >= date && d.createdAt < nextDate
      )

      const delivered = dayDeliveries.filter(d => d.status === 'delivered')
      const cancelled = dayDeliveries.filter(d => d.status === 'cancelled')
      const failed = dayDeliveries.filter(d => d.status === 'failed')

      // Calculate average delivery time
      const deliveredWithTimes = delivered.filter(d => d.actualDeliveryTime && d.actualPickupTime)
      const avgDeliveryTime = deliveredWithTimes.length > 0
        ? deliveredWithTimes.reduce((sum, d) => {
            const time = (d.actualDeliveryTime!.getTime() - d.actualPickupTime!.getTime()) / 60000
            return sum + time
          }, 0) / deliveredWithTimes.length
        : 0

      // Calculate on-time rate
      const onTime = delivered.filter(d =>
        d.estimatedDeliveryTime &&
        d.actualDeliveryTime &&
        d.actualDeliveryTime <= d.estimatedDeliveryTime
      )
      const onTimeRate = delivered.length > 0 ? (onTime.length / delivered.length) * 100 : 100

      stats.push({
        date,
        total: dayDeliveries.length,
        delivered: delivered.length,
        cancelled: cancelled.length,
        failed: failed.length,
        avgDeliveryTime: Math.round(avgDeliveryTime),
        onTimeRate: Math.round(onTimeRate)
      })
    }

    return stats.reverse()
  }

  // ============ NOTIFICATIONS ============

  private sendDeliveryNotification(delivery: DeliveryOrder, status: DeliveryStatus): void {
    const statusMessages: Record<DeliveryStatus, string> = {
      pending: 'Order is being prepared',
      assigned: `Driver ${delivery.partnerName} assigned`,
      picked_up: 'Order picked up',
      in_transit: 'Order on the way',
      arriving: 'Driver arriving soon',
      delivered: 'Order delivered',
      cancelled: 'Order cancelled',
      failed: 'Delivery failed',
    };

    const message = statusMessages[status] || `Status: ${status}`;
    logger.info(`[Delivery] Notification: ${message}`, { orderId: delivery.orderId });

    // In production, integrate with SMS/push notification service:
    // await smsService.send(delivery.customerPhone, message);
    // await pushService.send(delivery.customerPhone, { title: 'Delivery Update', body: message });
  }

  // ============ HELPERS ============

  private addEvent(deliveryId: string, event: Omit<DeliveryEvent, 'id' | 'deliveryId' | 'createdAt'>): void {
    if (!this.events.has(deliveryId)) {
      this.events.set(deliveryId, [])
    }

    const fullEvent: DeliveryEvent = {
      id: `evt-${uuidv4().substring(0, 8)}`,
      deliveryId,
      createdAt: new Date(),
      ...event
    }

    this.events.get(deliveryId)!.unshift(fullEvent)
  }

  private calculateETA(delivery: DeliveryOrder, currentLocation: Location): Date | null {
    if (!delivery.dropoffLocation || !delivery.distance) return null

    // Simplified ETA calculation
    // In production, use actual routing API
    const distanceRemaining = this.calculateDistance(
      currentLocation,
      delivery.dropoffLocation
    )
    const avgSpeed = 25 // km/h in city
    const timeMinutes = (distanceRemaining / avgSpeed) * 60

    const eta = new Date()
    eta.setMinutes(eta.getMinutes() + timeMinutes)

    return eta
  }

  private calculateDistance(from: Location, to: Location): number {
    // Haversine formula
    const R = 6371 // Earth's radius in km
    const dLat = this.toRad(to.lat - from.lat)
    const dLon = this.toRad(to.lng - from.lng)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(from.lat)) * Math.cos(this.toRad(to.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180)
  }

  // ============ CONFIG ============

  updateConfig(updates: Partial<DeliveryConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  getConfig(): DeliveryConfig {
    return { ...this.config }
  }
}

export const deliveryTrackingService = new DeliveryTrackingService()

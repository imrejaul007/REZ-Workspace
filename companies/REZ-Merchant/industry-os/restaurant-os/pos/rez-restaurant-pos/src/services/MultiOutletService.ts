/**
 * Multi-Outlet Service
 * Chain management, franchise controls, regional pricing
 */

import { v4 as uuidv4 } from 'uuid'

export interface Outlet {
  id: string
  merchantId: string
  name: string
  code: string // Short code like "BLR-01"
  address: string
  city: string
  region: string
  state: string
  pincode: string
  phone: string
  email: string
  managerId?: string
  status: 'active' | 'inactive' | 'pending'
  timezone: string
  currency: string
  taxNumber?: string
  fssaiNumber?: string
  openingHours: {
    [day: string]: { open: string; close: string; closed?: boolean }
  }
  features: string[] // 'delivery', 'dine_in', 'takeaway', 'catering'
  createdAt: Date
  updatedAt: Date
}

export interface MenuOverride {
  id: string
  outletId: string
  itemId: string
  price?: number
  available?: boolean
  category?: string
  prepTime?: number
  notes?: string
}

export interface RegionalPricing {
  id: string
  region: string
  minOrder: number
  deliveryFee: number
  freeDeliveryThreshold: number
  taxRate: number
  currency: string
}

export interface OutletStats {
  outletId: string
  date: Date
  orders: number
  revenue: number
  avgOrderValue: number
  customers: number
  tableOccupancy?: number
  kdsAvgTime?: number
}

export interface ChainAnalytics {
  merchantId: string
  period: { start: Date; end: Date }
  totalOutlets: number
  activeOutlets: number
  totalOrders: number
  totalRevenue: number
  avgOrderValue: number
  topOutlets: Array<{ outletId: string; name: string; revenue: number }>
  worstOutlets: Array<{ outletId: string; name: string; revenue: number }>
  outletPerformance: OutletStats[]
}

export class MultiOutletService {
  private outlets: Map<string, Outlet> = new Map()
  private menuOverrides: Map<string, MenuOverride> = new Map()
  private regionalPricing: Map<string, RegionalPricing> = new Map()
  private outletStats: Map<string, OutletStats[]> = new Map()

  constructor() {
    this.initializeDefaultOutlets()
  }

  private initializeDefaultOutlets(): void {
    this.addOutlet({
      merchantId: 'merchant-001',
      name: 'Bangalore Main',
      code: 'BLR-01',
      address: '123 MG Road',
      city: 'Bangalore',
      region: 'South',
      state: 'Karnataka',
      pincode: '560001',
      phone: '+919876543210',
      email: 'blr01@restaurant.com',
      status: 'active',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      features: ['dine_in', 'takeaway', 'delivery']
    })

    this.addOutlet({
      merchantId: 'merchant-001',
      name: 'Mumbai Bandra',
      code: 'MUM-01',
      address: '45 Linking Road',
      city: 'Mumbai',
      region: 'West',
      state: 'Maharashtra',
      pincode: '400050',
      phone: '+919876543211',
      email: 'mum01@restaurant.com',
      status: 'active',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      features: ['dine_in', 'takeaway']
    })

    this.addOutlet({
      merchantId: 'merchant-001',
      name: 'Delhi NCR',
      code: 'DEL-01',
      address: '78 Connaught Place',
      city: 'New Delhi',
      region: 'North',
      state: 'Delhi',
      pincode: '110001',
      phone: '+919876543212',
      email: 'del01@restaurant.com',
      status: 'active',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      features: ['dine_in', 'takeaway', 'delivery', 'catering']
    })
  }

  // ============ OUTLETS ============

  addOutlet(data: Omit<Outlet, 'id' | 'createdAt' | 'updatedAt'>): Outlet {
    const id = `outlet-${uuidv4().substring(0, 8)}`
    const outlet: Outlet = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.outlets.set(id, outlet)
    return outlet
  }

  updateOutlet(id: string, updates: Partial<Outlet>): Outlet | undefined {
    const outlet = this.outlets.get(id)
    if (!outlet) return undefined

    const updated = {
      ...outlet,
      ...updates,
      id: outlet.id,
      createdAt: outlet.createdAt,
      updatedAt: new Date()
    }
    this.outlets.set(id, updated)
    return updated
  }

  getOutlet(id: string): Outlet | undefined {
    return this.outlets.get(id)
  }

  getOutletByCode(code: string): Outlet | undefined {
    return Array.from(this.outlets.values()).find(o => o.code === code)
  }

  getMerchantOutlets(merchantId: string, activeOnly = true): Outlet[] {
    return Array.from(this.outlets.values()).filter(o => {
      if (o.merchantId !== merchantId) return false
      if (activeOnly && o.status !== 'active') return false
      return true
    })
  }

  getOutletsByRegion(region: string): Outlet[] {
    return Array.from(this.outlets.values()).filter(o => o.region === region)
  }

  getOutletsByCity(city: string): Outlet[] {
    return Array.from(this.outlets.values()).filter(o => o.city === city)
  }

  deactivateOutlet(id: string): boolean {
    const outlet = this.outlets.get(id)
    if (!outlet) return false
    outlet.status = 'inactive'
    outlet.updatedAt = new Date()
    return true
  }

  // ============ MENU OVERRIDES ============

  setMenuOverride(data: Omit<MenuOverride, 'id'>): MenuOverride {
    const id = `${data.outletId}-${data.itemId}`
    const override: MenuOverride = { id, ...data }
    this.menuOverrides.set(id, override)
    return override
  }

  getMenuOverrides(outletId: string): MenuOverride[] {
    return Array.from(this.menuOverrides.values()).filter(o => o.outletId === outletId)
  }

  getEffectivePrice(outletId: string, itemId: string, basePrice: number): number {
    const override = this.menuOverrides.get(`${outletId}-${itemId}`)
    return override?.price ?? basePrice
  }

  isItemAvailable(outletId: string, itemId: string): boolean {
    const override = this.menuOverrides.get(`${outletId}-${itemId}`)
    return override?.available ?? true
  }

  removeMenuOverride(outletId: string, itemId: string): boolean {
    return this.menuOverrides.delete(`${outletId}-${itemId}`)
  }

  // ============ REGIONAL PRICING ============

  setRegionalPricing(data: Omit<RegionalPricing, 'id'>): RegionalPricing {
    const id = `pricing-${data.region}`
    const pricing: RegionalPricing = { id, ...data }
    this.regionalPricing.set(id, pricing)
    return pricing
  }

  getRegionalPricing(region: string): RegionalPricing | undefined {
    return this.regionalPricing.get(`pricing-${region}`)
  }

  getAllRegionalPricing(): RegionalPricing[] {
    return Array.from(this.regionalPricing.values())
  }

  calculateDeliveryFee(region: string, distance: number, orderValue: number): number {
    const pricing = this.regionalPricing.get(`pricing-${region}`)
    if (!pricing) return 40 // Default

    if (orderValue >= pricing.freeDeliveryThreshold) return 0

    return pricing.deliveryFee + (distance > 5 ? (distance - 5) * 5 : 0)
  }

  calculateTax(region: string, subtotal: number): number {
    const pricing = this.regionalPricing.get(`pricing-${region}`)
    if (!pricing) return subtotal * 0.05 // Default 5%
    return Math.round(subtotal * pricing.taxRate * 100) / 100
  }

  // ============ OUTLET STATS ============

  recordOutletStats(stats: OutletStats): void {
    const key = `${stats.outletId}-${stats.date.toISOString().split('T')[0]}`
    if (!this.outletStats.has(stats.outletId)) {
      this.outletStats.set(stats.outletId, [])
    }
    this.outletStats.get(stats.outletId)!.push(stats)
  }

  getOutletStats(outletId: string, days = 30): OutletStats[] {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    return (this.outletStats.get(outletId) || [])
      .filter(s => s.date >= cutoff)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  getOutletDailyStats(outletId: string, date: Date): OutletStats | undefined {
    const dateStr = date.toISOString().split('T')[0]
    return (this.outletStats.get(outletId) || [])
      .find(s => s.date.toISOString().split('T')[0] === dateStr)
  }

  // ============ CHAIN ANALYTICS ============

  getChainAnalytics(merchantId: string, startDate: Date, endDate: Date): ChainAnalytics {
    const outlets = this.getMerchantOutlets(merchantId, true)
    const allStats: OutletStats[] = []

    for (const outlet of outlets) {
      const stats = this.getOutletStats(outlet.id, 30)
      allStats.push(...stats)
    }

    const totalOrders = allStats.reduce((sum, s) => sum + s.orders, 0)
    const totalRevenue = allStats.reduce((sum, s) => sum + s.revenue, 0)

    const outletPerformance = outlets.map(o => {
      const oStats = this.getOutletStats(o.id)
      const todayStats = oStats[oStats.length - 1]
      return todayStats || {
        outletId: o.id,
        date: new Date(),
        orders: 0,
        revenue: 0,
        avgOrderValue: 0,
        customers: 0
      }
    })

    const sortedByRevenue = [...outletPerformance].sort((a, b) => b.revenue - a.revenue)

    return {
      merchantId,
      period: { start: startDate, end: endDate },
      totalOutlets: outlets.length,
      activeOutlets: outlets.filter(o => o.status === 'active').length,
      totalOrders,
      totalRevenue,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      topOutlets: sortedByRevenue.slice(0, 3).map(s => ({
        outletId: s.outletId,
        name: outlets.find(o => o.id === s.outletId)?.name || '',
        revenue: s.revenue
      })),
      worstOutlets: sortedByRevenue.slice(-3).reverse().map(s => ({
        outletId: s.outletId,
        name: outlets.find(o => o.id === s.outletId)?.name || '',
        revenue: s.revenue
      })),
      outletPerformance
    }
  }

  // ============ CAMPAIGN MANAGEMENT ============

  getOutletsForCampaign(criteria: {
    regions?: string[]
    cities?: string[]
    minRevenue?: number
    features?: string[]
  }): Outlet[] {
    return Array.from(this.outlets.values()).filter(o => {
      if (o.status !== 'active') return false
      if (criteria.regions && !criteria.regions.includes(o.region)) return false
      if (criteria.cities && !criteria.cities.includes(o.city)) return false
      if (criteria.features && !criteria.features.every(f => o.features.includes(f))) return false
      return true
    })
  }

  // ============ HELPERS ============

  getRegions(): string[] {
    return [...new Set(Array.from(this.outlets.values()).map(o => o.region))]
  }

  getCities(): string[] {
    return [...new Set(Array.from(this.outlets.values()).map(o => o.city))]
  }

  getStates(): string[] {
    return [...new Set(Array.from(this.outlets.values()).map(o => o.state))]
  }
}

export const multiOutletService = new MultiOutletService()

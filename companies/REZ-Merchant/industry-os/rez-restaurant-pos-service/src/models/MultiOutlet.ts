/**
 * MongoDB Models for Multi-Outlet Service
 */

import mongoose, { Schema, Document } from 'mongoose'

// ============ OUTLET ============

export interface IOutlet extends Document {
  merchantId: string
  name: string
  code: string
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
  features: string[]
  createdAt: Date
  updatedAt: Date
}

const OutletSchema = new Schema<IOutlet>({
  merchantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  city: { type: String, required: true, index: true },
  region: { type: String, required: true, index: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  managerId: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active',
    index: true
  },
  timezone: { type: String, default: 'Asia/Kolkata' },
  currency: { type: String, default: 'INR' },
  taxNumber: String,
  fssaiNumber: String,
  openingHours: {
    type: Map,
    of: {
      open: String,
      close: String,
      closed: Boolean
    }
  },
  features: [String]
}, { timestamps: true })

OutletSchema.index({ merchantId: 1, status: 1 })
OutletSchema.index({ region: 1, city: 1 })
OutletSchema.index({ merchantId: 1, code: 1 }, { unique: true })

// ============ MENU OVERRIDE ============

export interface IMenuOverride extends Document {
  outletId: mongoose.Types.ObjectId
  itemId: string
  price?: number
  available?: boolean
  category?: string
  prepTime?: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const MenuOverrideSchema = new Schema<IMenuOverride>({
  outletId: { type: Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
  itemId: { type: String, required: true },
  price: Number,
  available: { type: Boolean, default: true },
  category: String,
  prepTime: Number,
  notes: String
}, { timestamps: true })

MenuOverrideSchema.index({ outletId: 1, itemId: 1 }, { unique: true })

// ============ REGIONAL PRICING ============

export interface IRegionalPricing extends Document {
  region: string
  minOrder: number
  deliveryFee: number
  freeDeliveryThreshold: number
  taxRate: number
  currency: string
  createdAt: Date
  updatedAt: Date
}

const RegionalPricingSchema = new Schema<IRegionalPricing>({
  region: { type: String, required: true, unique: true, index: true },
  minOrder: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  freeDeliveryThreshold: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0.05 },
  currency: { type: String, default: 'INR' }
}, { timestamps: true })

// ============ OUTLET STATS ============

export interface IOutletStats extends Document {
  outletId: mongoose.Types.ObjectId
  merchantId: string
  date: Date
  orders: number
  revenue: number
  avgOrderValue: number
  customers: number
  tableOccupancy?: number
  kdsAvgTime?: number
  createdAt: Date
}

const OutletStatsSchema = new Schema<IOutletStats>({
  outletId: { type: Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
  merchantId: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  orders: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  avgOrderValue: { type: Number, default: 0 },
  customers: { type: Number, default: 0 },
  tableOccupancy: Number,
  kdsAvgTime: Number
}, { timestamps: true })

OutletStatsSchema.index({ outletId: 1, date: -1 })
OutletStatsSchema.index({ merchantId: 1, date: -1 })

// ============ CAMPAIGN TARGET ============

export interface ICampaignTarget extends Document {
  campaignId: string
  outletId: mongoose.Types.ObjectId
  status: 'pending' | 'active' | 'paused' | 'completed'
  sentAt?: Date
  createdAt: Date
}

const CampaignTargetSchema = new Schema<ICampaignTarget>({
  campaignId: { type: String, required: true, index: true },
  outletId: { type: Schema.Types.ObjectId, ref: 'Outlet', required: true },
  status: {
    type: String,
    enum: ['pending', 'active', 'paused', 'completed'],
    default: 'pending'
  },
  sentAt: Date
}, { timestamps: true })

CampaignTargetSchema.index({ campaignId: 1, outletId: 1 }, { unique: true })

// Export models
let Outlet: mongoose.Model<IOutlet>
let MenuOverride: mongoose.Model<IMenuOverride>
let RegionalPricing: mongoose.Model<IRegionalPricing>
let OutletStats: mongoose.Model<IOutletStats>
let CampaignTarget: mongoose.Model<ICampaignTarget>

export function getMultiOutletModels(connection: mongoose.Connection) {
  Outlet = connection.models.Outlet || connection.model<IOutlet>('Outlet', OutletSchema)
  MenuOverride = connection.models.MenuOverride || connection.model<IMenuOverride>('MenuOverride', MenuOverrideSchema)
  RegionalPricing = connection.models.RegionalPricing || connection.model<IRegionalPricing>('RegionalPricing', RegionalPricingSchema)
  OutletStats = connection.models.OutletStats || connection.model<IOutletStats>('OutletStats', OutletStatsSchema)
  CampaignTarget = connection.models.CampaignTarget || connection.model<ICampaignTarget>('CampaignTarget', CampaignTargetSchema)

  return { Outlet, MenuOverride, RegionalPricing, OutletStats, CampaignTarget }
}

export { OutletSchema, MenuOverrideSchema, RegionalPricingSchema, OutletStatsSchema, CampaignTargetSchema }

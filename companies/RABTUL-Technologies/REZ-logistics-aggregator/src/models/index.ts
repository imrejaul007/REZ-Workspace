/**
 * Logistics Aggregator - Models
 * Multi-carrier shipping rates, tracking, label generation
 */

import mongoose, { Schema } from 'mongoose';

// ============================================
// SHIPMENT
// ============================================

const ShipmentSchema = new Schema({
  shipmentId: { type: String, required: true, unique: true, index: true },
  orderId: String,

  // Origin
  pickup: {
    name: String,
    phone: String,
    address1: String,
    address2: String,
    city: String,
    state: String,
    pincode: String,
  },

  // Destination
  delivery: {
    name: String,
    phone: String,
    address1: String,
    address2: String,
    city: String,
    state: String,
    pincode: String,
  },

  // Package
  package: {
    weight: Number, // kg
    length: Number, // cm
    breadth: Number, // cm
    height: Number, // cm
    volumetricWeight: Number,
  },

  // Carrier
  carrier: {
    name: String, // delhivery, dtdc, xpressbees, etc.
    service: String, // express, standard, economy
  },

  // Rate
  rate: {
    base: Number,
    fuelSurcharge: Number,
    rtoCharge: Number,
    codCharge: Number,
    total: Number,
    currency: { type: String, default: 'INR' },
  },

  // Tracking
  trackingId: String,
  trackingUrl: String,
  currentStatus: String,
  statusHistory: [{
    status: String,
    location: String,
    timestamp: Date,
    description: String,
  }],

  // Delivery
  expectedDelivery: Date,
  deliveredAt: Date,

  // COD
  codAmount: Number,
  codCollected: { type: Boolean, default: false },
  codRemittance: {
    amount: Number,
    date: Date,
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'rto', 'failed'],
    default: 'pending'
  },

  // Label
  labelUrl: String,
  manifestId: String,
}, { timestamps: true });

ShipmentSchema.index({ orderId: 1 });
ShipmentSchema.index({ 'carrier.name': 1, status: 1 });
ShipmentSchema.index({ 'delivery.pincode': 1 });

export const Shipment = mongoose.models.Shipment || mongoose.model('Shipment', ShipmentSchema);

// ============================================
// RATE QUOTE
// ============================================

const RateQuoteSchema = new Schema({
  quoteId: { type: String, required: true, unique: true },
  orderId: String,

  // Shipment details
  pickup: {
    city: String,
    pincode: String,
  },
  delivery: {
    city: String,
    pincode: String,
  },
  package: {
    weight: Number,
    length: Number,
    breadth: Number,
    height: Number,
  },
  isCOD: Boolean,
  codAmount: Number,

  // Quotes from carriers
  quotes: [{
    carrier: String,
    service: String,
    rate: Number,
    eta: String,
    codAvailable: Boolean,
    codCharge: Number,
  }],

  // Best quote
  bestQuote: {
    carrier: String,
    rate: Number,
  },

  createdAt: { type: Date, default: Date.now },
  expiresAt: Date,
});

RateQuoteSchema.index({ orderId: 1 });

export const RateQuote = mongoose.models.RateQuote || mongoose.model('RateQuote', RateQuoteSchema);

// ============================================
// CARRIER CONFIG
// ============================================

const CarrierConfigSchema = new Schema({
  carrier: { type: String, required: true, unique: true },
  name: String,
  active: { type: Boolean, default: true },

  // Zones & Rates
  zones: [{
    fromZone: String,
    toZone: String,
    rates: [{
      weightMin: Number,
      weightMax: Number,
      rate: Number,
      codRate: Number,
    }],
  }],

  // COD settings
  cod: {
    enabled: { type: Boolean, default: false },
    chargePercent: Number,
    minCharge: Number,
    maxCharge: Number,
  },

  // Service types
  services: [{
    code: String,
    name: String,
    eta: String,
    active: { type: Boolean, default: true },
  }],
});

export const CarrierConfig = mongoose.models.CarrierConfig || mongoose.model('CarrierConfig', CarrierConfigSchema);

// ============================================
// PICKUP SCHEDULE
// ============================================

const PickupScheduleSchema = new Schema({
  scheduleId: { type: String, required: true, unique: true },
  merchantId: String,

  pickup: {
    name: String,
    phone: String,
    address1: String,
    city: String,
    pincode: String,
  },

  shipments: [String], // shipmentIds
  scheduledDate: Date,
  timeSlot: {
    from: String,
    to: String,
  },

  status: {
    type: String,
    enum: ['scheduled', 'picked_up', 'cancelled'],
    default: 'scheduled'
  },

  carrier: String,
}, { timestamps: true });

PickupScheduleSchema.index({ merchantId: 1, scheduledDate: 1 });

export const PickupSchedule = mongoose.models.PickupSchedule || mongoose.model('PickupSchedule', PickupScheduleSchema);

/**
 * Dental Inventory Models
 */

const mongoose = require('mongoose');

// Dental supply categories
const SUPPLY_CATEGORIES = {
  IMPLANT: 'implant',
  ANESTHETIC: 'anesthetic',
  WHITENING: 'whitening',
  SURGICAL: 'surgical',
  RESTORATIVE: 'restorative',
  PREVENTIVE: 'preventive',
  ORTHODONTIC: 'orthodontic',
  LAB: 'lab',
  GENERAL: 'general'
};

// Predefined dental supplies catalog
const DENTAL_SUPPLIES = [
  // Implants
  { sku: 'DNT-IMP-001', name: 'Titanium Dental Implant (Standard)', category: SUPPLY_CATEGORIES.IMPLANT, unit: 'piece', cost: 2500 },
  { sku: 'DNT-IMP-002', name: 'Zirconia Dental Implant', category: SUPPLY_CATEGORIES.IMPLANT, unit: 'piece', cost: 4500 },
  { sku: 'DNT-IMP-003', name: 'Mini Implant', category: SUPPLY_CATEGORIES.IMPLANT, unit: 'piece', cost: 1200 },
  { sku: 'DNT-IMP-004', name: 'Implant Abutment (Titanium)', category: SUPPLY_CATEGORIES.IMPLANT, unit: 'piece', cost: 1800 },
  { sku: 'DNT-IMP-005', name: 'Implant Cover Screw', category: SUPPLY_CATEGORIES.IMPLANT, unit: 'piece', cost: 300 },

  // Anesthetics
  { sku: 'DNT-ANE-001', name: 'Lidocaine 2% with Epinephrine', category: SUPPLY_CATEGORIES.ANESTHETIC, unit: 'cartridge', cost: 25 },
  { sku: 'DNT-ANE-002', name: 'Articaine 4% with Epinephrine', category: SUPPLY_CATEGORIES.ANESTHETIC, unit: 'cartridge', cost: 35 },
  { sku: 'DNT-ANE-003', name: 'Bupivacaine 0.5%', category: SUPPLY_CATEGORIES.ANESTHETIC, unit: 'cartridge', cost: 45 },
  { sku: 'DNT-ANE-004', name: 'Topical Anesthetic Gel', category: SUPPLY_CATEGORIES.ANESTHETIC, unit: 'tube', cost: 80 },

  // Whitening
  { sku: 'DNT-WHT-001', name: 'Professional Whitening Gel (35%)', category: SUPPLY_CATEGORIES.WHITENING, unit: 'syringe', cost: 1200 },
  { sku: 'DNT-WHT-002', name: 'Take-Home Whitening Kit', category: SUPPLY_CATEGORIES.WHITENING, unit: 'kit', cost: 3500 },
  { sku: 'DNT-WHT-003', name: 'Whitening LED Light', category: SUPPLY_CATEGORIES.WHITENING, unit: 'unit', cost: 15000 },

  // Surgical
  { sku: 'DNT-SUR-001', name: 'Surgical Extraction Forceps (#150)', category: SUPPLY_CATEGORIES.SURGICAL, unit: 'piece', cost: 800 },
  { sku: 'DNT-SUR-002', name: 'Periotome Set', category: SUPPLY_CATEGORIES.SURGICAL, unit: 'set', cost: 2500 },
  { sku: 'DNT-SUR-003', name: 'Surgical Sutures (Resorbable)', category: SUPPLY_CATEGORIES.SURGICAL, unit: 'box', cost: 400 },
  { sku: 'DNT-SUR-004', name: 'Bone Graft Material', category: SUPPLY_CATEGORIES.SURGICAL, unit: 'gram', cost: 2000 },
  { sku: 'DNT-SUR-005', name: 'Membranes (Collagen)', category: SUPPLY_CATEGORIES.SURGICAL, unit: 'piece', cost: 1200 },

  // Restorative
  { sku: 'DNT-RES-001', name: 'Composite Resin (Universal)', category: SUPPLY_CATEGORIES.RESTORATIVE, unit: 'syringe', cost: 800 },
  { sku: 'DNT-RES-002', name: 'Glass Ionomer Cement', category: SUPPLY_CATEGORIES.RESTORATIVE, unit: 'kit', cost: 1200 },
  { sku: 'DNT-RES-003', name: 'Etching Gel (37% Phosphoric)', category: SUPPLY_CATEGORIES.RESTORATIVE, unit: 'syringe', cost: 150 },
  { sku: 'DNT-RES-004', name: 'Dental Burs (Assorted)', category: SUPPLY_CATEGORIES.RESTORATIVE, unit: 'pack', cost: 500 },
  { sku: 'DNT-RES-005', name: 'Matrix Bands', category: SUPPLY_CATEGORIES.RESTORATIVE, unit: 'pack', cost: 300 },
  { sku: 'DNT-RES-006', name: 'Filling Instruments Set', category: SUPPLY_CATEGORIES.RESTORATIVE, unit: 'set', cost: 1500 },

  // Preventive
  { sku: 'DNT-PRV-001', name: 'Dental Sealant', category: SUPPLY_CATEGORIES.PREVENTIVE, unit: 'tube', cost: 600 },
  { sku: 'DNT-PRV-002', name: 'Fluoride Varnish', category: SUPPLY_CATEGORIES.PREVENTIVE, unit: 'tube', cost: 400 },
  { sku: 'DNT-PRV-003', name: 'Prophy Paste', category: SUPPLY_CATEGORIES.PREVENTIVE, unit: 'cup', cost: 5 },
  { sku: 'DNT-PRV-004', name: 'Dental Floss (Professional)', category: SUPPLY_CATEGORIES.PREVENTIVE, unit: 'roll', cost: 50 },

  // Orthodontic
  { sku: 'DNT-ORT-001', name: 'Orthodontic Brackets (Metal)', category: SUPPLY_CATEGORIES.ORTHODONTIC, unit: 'set', cost: 3000 },
  { sku: 'DNT-ORT-002', name: 'Orthodontic Wire', category: SUPPLY_CATEGORIES.ORTHODONTIC, unit: 'roll', cost: 800 },
  { sku: 'DNT-ORT-003', name: 'Elastics (Assorted)', category: SUPPLY_CATEGORIES.ORTHODONTIC, unit: 'bag', cost: 100 },

  // Lab
  { sku: 'DNT-LAB-001', name: 'Dental Stone', category: SUPPLY_CATEGORIES.LAB, unit: 'kg', cost: 200 },
  { sku: 'DNT-LAB-002', name: 'Alginate Impression Material', category: SUPPLY_CATEGORIES.LAB, unit: 'pack', cost: 400 },
  { sku: 'DNT-LAB-003', name: 'Temporary Crown Material', category: SUPPLY_CATEGORIES.LAB, unit: 'kit', cost: 1500 },

  // General
  { sku: 'DNT-GEN-001', name: 'Dental Mirrors', category: SUPPLY_CATEGORIES.GENERAL, unit: 'piece', cost: 50 },
  { sku: 'DNT-GEN-002', name: 'Explorer Probes', category: SUPPLY_CATEGORIES.GENERAL, unit: 'piece', cost: 40 },
  { sku: 'DNT-GEN-003', name: 'Cotton Rolls', category: SUPPLY_CATEGORIES.GENERAL, unit: 'pack', cost: 30 },
  { sku: 'DNT-GEN-004', name: 'Saliva Ejectors', category: SUPPLY_CATEGORIES.GENERAL, unit: 'box', cost: 100 },
  { sku: 'DNT-GEN-005', name: 'Dental Gloves (Box of 100)', category: SUPPLY_CATEGORIES.GENERAL, unit: 'box', cost: 250 },
  { sku: 'DNT-GEN-006', name: 'Face Masks (Box of 50)', category: SUPPLY_CATEGORIES.GENERAL, unit: 'box', cost: 150 },
  { sku: 'DNT-GEN-007', name: 'Disinfectant Solution', category: SUPPLY_CATEGORIES.GENERAL, unit: 'liter', cost: 300 },
  { sku: 'DNT-GEN-008', name: 'X-Ray Sensor Covers', category: SUPPLY_CATEGORIES.GENERAL, unit: 'box', cost: 200 }
];

/**
 * Inventory Item Schema
 */
const inventoryItemSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  name: String,
  category: {
    type: String,
    enum: Object.values(SUPPLY_CATEGORIES)
  },
  currentStock: {
    type: Number,
    default: 0,
    min: 0
  },
  unit: String,
  cost: Number,
  reorderPoint: {
    type: Number,
    default: 10
  },
  reorderQuantity: {
    type: Number,
    default: 50
  },
  lastRestocked: Date,
  expiryDate: Date,
  batchNumber: String,
  suppliers: [{
    supplierId: String,
    name: String,
    leadTimeDays: Number,
    unitCost: Number
  }],
  autoReorder: {
    enabled: { type: Boolean, default: true },
    minStock: Number,
    maxStock: Number
  },
  alerts: [{
    type: { type: String, enum: ['low_stock', 'expiry', 'out_of_stock'] },
    createdAt: { type: Date, default: Date.now },
    acknowledged: { type: Boolean, default: false }
  }]
});

// Compound index
inventoryItemSchema.index({ clinicId: 1, sku: 1 }, { unique: true });

/**
 * Order Schema
 */
const orderSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  orderId: String,
  items: [{
    sku: String,
    name: String,
    quantity: Number,
    unitCost: Number,
    totalCost: Number
  }],
  totalAmount: Number,
  supplier: {
    supplierId: String,
    name: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  orderDate: { type: Date, default: Date.now },
  expectedDelivery: Date,
  actualDelivery: Date,
  nexhaOrderId: String, // Linked Nexha order
  trackingNumber: String
});

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);
const Order = mongoose.model('Order', orderSchema);

module.exports = {
  InventoryItem,
  Order,
  DENTAL_SUPPLIES,
  SUPPLY_CATEGORIES
};

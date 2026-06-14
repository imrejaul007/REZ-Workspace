/**
 * WooCommerce Connector - Models
 * Deep integration with WooCommerce
 */

import mongoose, { Schema } from 'mongoose';

// ============================================
// STORE CONFIGURATION
// ============================================

const WooStoreSchema = new Schema({
  storeId: { type: String, required: true, unique: true, index: true },
  consumerKey: { type: String, required: true },
  consumerSecret: { type: String, required: true },
  siteUrl: { type: String, required: true },

  // Sync settings
  syncSettings: {
    products: { type: Boolean, default: true },
    orders: { type: Boolean, default: true },
    customers: { type: Boolean, default: true },
    inventory: { type: Boolean, default: true },
    codHandling: { type: Boolean, default: true },
  },

  // Status
  status: { type: String, enum: ['active', 'inactive', 'error'], default: 'active' },
  lastSync: Date,
  syncError: String,
}, { timestamps: true });

export const WooStore = mongoose.models.WooStore || mongoose.model('WooStore', WooStoreSchema);

// ============================================
// PRODUCT MAPPING
// ============================================

/**
 * MISSING COMPOUND INDEX RECOMMENDATIONS:
 * ------------------------------------------
 * Current indexes: { wooProductId: 1 }, { storeId: 1 }
 * Compound index: { storeId: 1, wooProductId: 1 } (unique - already exists)
 *
 * RECOMMENDED ADDITIONAL INDEXES:
 * 1. { storeId: 1, syncStatus: 1 }
 *    - Use case: Find pending syncs by store for retry logic
 *    - Query: db.productMappings.find({ storeId, syncStatus: 'pending' })
 *
 * 2. { lastSync: 1 }
 *    - Use case: Find stale mappings for reconciliation
 *    - Query: db.productMappings.find({ lastSync: { $lt: yesterday } })
 *
 * 3. { storeId: 1, lastSync: 1 }
 *    - Use case: Batch find stale products per store
 *    - Query: db.productMappings.find({ storeId, lastSync: { $lt: cutoff })
 */
const ProductMappingSchema = new Schema({
  wooProductId: { type: Number, required: true, index: true },
  localProductId: { type: String, required: true },
  storeId: { type: String, required: true, index: true },

  // Sync status
  lastSync: Date,
  syncStatus: { type: String, enum: ['synced', 'pending', 'error'], default: 'synced' },
  variations: [{
    wooVariationId: Number,
    localVariationId: String,
  }],
}, { timestamps: true });

ProductMappingSchema.index({ storeId: 1, wooProductId: 1 }, { unique: true });

export const ProductMapping = mongoose.models.ProductMapping || mongoose.model('ProductMapping', ProductMappingSchema);

// ============================================
// ORDER SYNC
// ============================================

/**
 * MISSING COMPOUND INDEX RECOMMENDATIONS:
 * ------------------------------------------
 * Current indexes: { wooOrderId: 1 }, { storeId: 1 }
 * Compound index: { storeId: 1, wooOrderId: 1 } (unique - already exists)
 *
 * RECOMMENDED ADDITIONAL INDEXES:
 * 1. { storeId: 1, syncStatus: 1 }
 *    - Use case: Find orders needing sync by store
 *    - Query: db.orderMappings.find({ storeId, syncStatus: 'pending' })
 *
 * 2. { localOrderId: 1 }
 *    - Use case: Quick lookup by local order ID (frequent in internal ops)
 *    - Query: db.orderMappings.find({ localOrderId: 'WOO-12345' })
 *
 * 3. { paymentMethod: 1, syncStatus: 1 }
 *    - Use case: Find COD orders needing processing
 *    - Query: db.orderMappings.find({ paymentMethod: 'cod', syncStatus: 'pending' })
 *
 * 4. { storeId: 1, createdAt: -1 }
 *    - Use case: Recent orders per store (for dashboard)
 *    - Query: db.orderMappings.find({ storeId }).sort({ createdAt: -1 }).limit(100)
 */
const OrderMappingSchema = new Schema({
  wooOrderId: { type: Number, required: true, index: true },
  localOrderId: { type: String, required: true },
  storeId: { type: String, required: true },

  // COD handling
  paymentMethod: String,
  codAmount: Number,
  codCollected: { type: Boolean, default: false },

  // Sync status
  lastSync: Date,
  syncStatus: { type: String, enum: ['synced', 'pending', 'error'], default: 'synced' },
}, { timestamps: true });

OrderMappingSchema.index({ storeId: 1, wooOrderId: 1 }, { unique: true });

export const OrderMapping = mongoose.models.OrderMapping || mongoose.model('OrderMapping', OrderMappingSchema);

// ============================================
// INVENTORY SYNC
// ============================================

/**
 * MISSING COMPOUND INDEX RECOMMENDATIONS:
 * ------------------------------------------
 * Current index: { storeId: 1, productId: 1 } (unique - already exists)
 *
 * RECOMMENDED ADDITIONAL INDEXES:
 * 1. { pendingUpdates: 1, lastWooSync: 1 }
 *    - Use case: Find inventory needing sync (pendingUpdates > 0)
 *    - Query: db.inventorySyncs.find({ pendingUpdates: { $gt: 0 } }).sort({ lastWooSync: 1 })
 *
 * 2. { storeId: 1, lastWooSync: 1 }
 *    - Use case: Stale inventory per store for reconciliation
 *    - Query: db.inventorySyncs.find({ storeId, lastWooSync: { $lt: cutoff } })
 *
 * 3. { wooProductId: 1 }
 *    - Use case: Lookup by WooCommerce product ID
 *    - Query: db.inventorySyncs.find({ wooProductId: 123 })
 *
 * 4. { storeId: 1, syncedStock: 1 }
 *    - Use case: Stock discrepancy report by store
 *    - Query: db.inventorySyncs.aggregate([{ $match: { storeId } }, { $group: { _id: null, totalDiscrepancy: { $sum: { $abs: { $subtract: ['$localStock', '$wooStock'] } } } } }])
 */
const InventorySyncSchema = new Schema({
  storeId: { type: String, required: true },
  productId: { type: String, required: true },

  wooProductId: Number,
  wooVariationId: Number,

  // Stock levels
  localStock: Number,
  wooStock: Number,
  syncedStock: Number,

  // Tracking
  lastLocalUpdate: Date,
  lastWooSync: Date,
  pendingUpdates: { type: Number, default: 0 },
}, { timestamps: true });

InventorySyncSchema.index({ storeId: 1, productId: 1 }, { unique: true });

export const InventorySync = mongoose.models.InventorySync || mongoose.model('InventorySync', InventorySyncSchema);

/**
 * Store Entry Models
 * FreshMart 10AM Story: "Customer scans REZ QR at entrance → Shopping Twin activated"
 */

const mongoose = require('mongoose');

const storeEntrySchema = new mongoose.Schema({
  entry_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Store
  store_id: {
    type: String,
    required: true,
    index: true
  },
  store_name: String,

  // Customer
  customer_id: {
    type: String,
    required: true,
    index: true
  },
  customer_name: String,

  // Entry method
  entry_method: {
    type: String,
    enum: ['qr_scan', 'beacon', 'wifi', 'manual', 'face_recognition'],
    default: 'qr_scan'
  },

  // Session
  session_id: {
    type: String,
    index: true
  },
  session_started: {
    type: Date,
    default: Date.now
  },
  session_ended: Date,

  // Location in store
  entrance: String,

  // Customer profile at entry
  customer_profile: {
    loyalty_tier: String,
    total_visits: Number,
    last_visit: Date,
    average_basket: Number,
    favorite_categories: [String]
  },

  // What's known about customer
  recognized_data: {
    loyalty: Boolean,
    karma: Boolean,
    purchase_history: Boolean,
    preferences: Boolean
  },

  // Notifications sent
  notifications: [{
    type: String,
    sent_at: Date,
    opened: Boolean
  }],

  // Shopping data
  shopping_started: {
    type: Boolean,
    default: false
  },
  cart_created: {
    type: Boolean,
    default: false
  },

  // Exit
  exit_method: String,
  items_purchased: Number,
  total_spent: Number,

  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }

}, { timestamps: true });

storeEntrySchema.index({ store_id: 1, created_at: -1 });
storeEntrySchema.index({ customer_id: 1, created_at: -1 });
storeEntrySchema.index({ session_id: 1 });

const StoreEntry = mongoose.model('StoreEntry', storeEntrySchema);

// ============================================================================
// Customer Session
// ============================================================================

const customerSessionSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  customer_id: {
    type: String,
    required: true,
    index: true
  },
  store_id: {
    type: String,
    required: true,
    index: true
  },

  // Timeline
  entry_time: {
    type: Date,
    default: Date.now
  },
  exit_time: Date,
  duration: Number,

  // Location tracking
  zones_visited: [{
    zone: String,
    enter_time: Date,
    exit_time: Date,
    dwell_time: Number
  }],

  // Products of interest
  products_viewed: [{
    sku: String,
    name: String,
    category: String,
    view_time: Date,
    added_to_cart: Boolean
  }],

  // Cart
  cart_id: String,
  cart_value: Number,

  // Checkout
  checkout_started: Date,
  checkout_completed: Date,
  payment_method: String,

  // Status
  status: {
    type: String,
    enum: ['active', 'browsing', 'checkout', 'completed', 'abandoned'],
    default: 'active'
  }

}, { timestamps: true });

customerSessionSchema.index({ store_id: 1, status: 1 });
customerSessionSchema.index({ entry_time: -1 });

const CustomerSession = mongoose.model('CustomerSession', customerSessionSchema);

module.exports = {
  StoreEntry,
  CustomerSession
};

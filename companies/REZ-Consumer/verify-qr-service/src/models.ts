/**
 * REZ Verify QR - COMPLETE MODELS
 * Serial Registry + Scan Logs + Ownership + Claims
 */

// ============================================
// 1. SERIAL REGISTRY (Product Serial Master Table)
// ============================================
const serialRegistrySchema = {
  serial_number: String,           // UNIQUE
  merchant_id: String,
  merchant_name: String,
  product_id: String,
  sku: String,

  // Product details
  brand: String,
  model: String,
  category: String,
  subcategory: String,
  description: String,

  // Manufacturing
  batch_id: String,
  manufactured_at: Date,
  expiry_date: Date,

  // Status
  status: {
    type: String,
    enum: ['active', 'deactivated', 'recalled', 'expired'],
    default: 'active'
  },

  // Tracking
  verification_count: { type: Number, default: 0 },
  last_verified_at: Date,
  last_verified_location: { lat: Number, lng: Number },

  // Ownership
  ownership_status: {
    type: String,
    enum: ['unowned', 'owned', 'transferred', 'resale', 'revoked'],
    default: 'unowned'
  },

  // Audit
  created_at: Date,
  updated_at: Date
};

// ============================================
// 2. SCAN LOG (Every scan event)
// ============================================
const scanLogSchema = {
  serial_number: String,
  scanned_at: Date,

  // Location
  location: {
    lat: Number,
    lng: Number,
    city: String,
    state: String,
    country: String
  },

  // Device
  device_id: String,
  device_type: String,
  app_version: String,

  // User
  user_id: String,
  user_type: String,

  // Result
  verification_result: {
    type: String,
    enum: ['authentic', 'suspicious', 'invalid', 'already_claimed']
  },

  // Flags
  flags: {
    first_scan: Boolean,
    repeat_scan: Boolean,
    geo_anomaly: Boolean,
    device_anomaly: Boolean
  },

  // Metadata
  metadata: Object
};

// ============================================
// 3. OWNERSHIP TRANSFER
// ============================================
const ownershipSchema = {
  serial_number: String,

  // Current owner
  current_owner_id: String,
  current_owner_name: String,
  current_owner_phone: String,
  current_owner_email: String,
  ownership_start_date: Date,

  // Previous owners (for resale tracking)
  previous_owners: [{
    owner_id: String,
    owner_name: String,
    transfer_date: Date,
    transfer_type: String,
    verified: Boolean
  }],

  // Status
  status: {
    type: String,
    enum: ['active', 'transferred', 'revoked'],
    default: 'active'
  },

  // Transfer history
  transfer_count: { type: Number, default: 0 }
};

// ============================================
// 4. CLAIMS (Full Claim System)
// ============================================
const claimSchema = {
  claim_id: String,
  serial_number: String,
  warranty_id: String,

  // Customer
  customer_id: String,
  customer_name: String,
  customer_phone: String,
  customer_email: String,

  // Product
  product_name: String,
  merchant_id: String,
  merchant_name: String,
  purchase_date: Date,
  purchase_price: Number,

  // Claim Details
  issue_type: {
    type: String,
    enum: ['defective', 'damaged', 'not_working', 'missing_parts', 'other']
  },
  issue_description: String,
  issue_date: Date,

  // Photos (proof)
  photos: [String],
  invoice_url: String,

  // Service Center
  preferred_service_center: String,
  assigned_service_center: String,
  service_center_address: String,

  // Resolution
  resolution_type: {
    type: String,
    enum: ['repair', 'replace', 'refund', 'reject']
  },

  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Timeline
  status: {
    type: String,
    enum: [
      'submitted',
      'under_review',
      'inspection_scheduled',
      'inspection_complete',
      'approved',
      'rejected',
      'in_repair',
      'replacement_shipped',
      'refund_processed',
      'resolved',
      'closed'
    ],
    default: 'submitted'
  },

  // Tracking
  timeline: [{
    status: String,
    note: String,
    updated_by: String,
    updated_at: Date
  }],

  created_at: Date,
  updated_at: Date
};

// ============================================
// 5. SERVICE CENTERS
// ============================================
const serviceCenterSchema = {
  center_id: String,
  name: String,
  merchant_id: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
  phone: String,
  email: String,
  services: [String],  // repair, replace, refund
  brands: [String],       // authorized brands
  working_hours: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
};

// ============================================
// 6. FRAUD RULES
// ============================================
const fraudRuleSchema = {
  rule_id: String,
  name: String,
  description: String,
  type: {
    type: String,
    enum: ['geo', 'device', 'behavior', 'pattern']
  },

  // Condition
  condition: {
    field: String,
    operator: String,
    value,
    threshold: Number
  },

  // Action
  action: {
    type: String,
    enum: ['flag', 'block', 'alert', 'escalate']
  },

  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
  enabled: { type: Boolean, default: true }
};

// ============================================
// 7. VERIFICATION QUEUE (for fraud review)
// ============================================
const verificationQueueSchema = {
  queue_id: String,
  serial_number: String,

  // Why flagged
  reason: [String],

  // Scan details
  scan: Object,  // scan log object

  // Review status
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'approved', 'rejected'],
    default: 'pending'
  },

  reviewed_by: String,
  reviewed_at: Date,
  review_notes: String
};

// ============================================
// 8. PRODUCT SYNC (Merchant Catalog Sync)
// ============================================
const productSyncSchema = {
  product_id: String,
  merchant_id: String,

  // Product details
  brand: String,
  model: String,
  category: String,

  // QR settings
  default_warranty_months: { type: Number, default: 12 },
  auto_generate: { type: Boolean, default: false },

  // Sync status
  last_synced: Date,
  sync_status: {
    type: String,
    enum: ['synced', 'pending', 'failed'],
    default: 'pending'
  }
};

// ============================================
// 9. MERCHANT LOYALTY (Loyalty Program Integration)
// ============================================
const merchantLoyaltySchema = {
  user_id: String,
  merchant_id: String,

  // Customer info
  customer_name: String,
  customer_phone: String,
  customer_email: String,

  // Loyalty status
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },

  // Points
  points: { type: Number, default: 0 },
  lifetime_points: { type: Number, default: 0 },

  // Status
  registered_at: Date,
  last_activity: Date,

  // Stats
  total_warranties: { type: Number, default: 0 },
  total_claims: { type: Number, default: 0 },
  referrals: { type: Number, default: 0 }
};

// ============================================
// 10. MERCHANT ANALYTICS (Shared Metrics)
// ============================================
const merchantAnalyticsSchema = {
  merchant_id: String,
  date: Date,

  // Verification metrics
  total_products: { type: Number, default: 0 },
  verified_products: { type: Number, default: 0 },
  verification_count: { type: Number, default: 0 },

  // Warranty metrics
  active_warranties: { type: Number, default: 0 },
  expired_warranties: { type: Number, default: 0 },
  warranty_activations: { type: Number, default: 0 },

  // Claim metrics
  total_claims: { type: Number, default: 0 },
  pending_claims: { type: Number, default: 0 },
  resolved_claims: { type: Number, default: 0 },

  // Booking metrics
  total_bookings: { type: Number, default: 0 },
  completed_bookings: { type: Number, default: 0 },

  // Revenue (if applicable)
  warranty_revenue: { type: Number, default: 0 },
  service_revenue: { type: Number, default: 0 }
};

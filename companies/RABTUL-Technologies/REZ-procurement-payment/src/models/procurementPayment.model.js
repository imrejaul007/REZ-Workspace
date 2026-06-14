/**
 * Procurement Payment Models
 * FreshMart 6AM Story: "RABTUL schedules payment"
 */

const mongoose = require('mongoose');

// ============================================================================
// Scheduled Payment Model
// ============================================================================

const scheduledPaymentSchema = new mongoose.Schema({
  payment_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Procurement Reference
  procurement_id: String,
  rfq_id: String,
  order_id: String,

  // Supplier Info
  supplier_id: {
    type: String,
    required: true,
    index: true
  },
  supplier_name: String,
  supplier_account: String,

  // Store/Merchant Info
  store_id: {
    type: String,
    required: true,
    index: true
  },
  store_name: String,

  // Payment Details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },

  // Schedule
  payment_type: {
    type: String,
    enum: ['immediate', 'scheduled', 'milestone', 'on_delivery', 'on_acceptance'],
    default: 'on_delivery'
  },
  scheduled_date: {
    type: Date,
    required: true,
    index: true
  },

  // Delivery Reference
  expected_delivery_date: Date,
  actual_delivery_date: Date,

  // Status
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },

  // RABTUL Payment Reference
  rabtul_payment_id: String,
  rabtul_transaction_id: String,

  // Reconciliation
  reconciliation: {
    invoice_number: String,
    invoice_date: Date,
    verified: Boolean,
    verified_at: Date,
    verified_by: String
  },

  // Metadata
  items: [{
    sku: String,
    name: String,
    quantity: Number,
    unit_price: Number,
    total: Number
  }],

  notes: String,
  created_by: String

}, {
  timestamps: true
});

// Indexes
scheduledPaymentSchema.index({ store_id: 1, status: 1 });
scheduledPaymentSchema.index({ supplier_id: 1, status: 1 });
scheduledPaymentSchema.index({ scheduled_date: 1, status: 1 });

const ScheduledPayment = mongoose.model('ScheduledPayment', scheduledPaymentSchema);

// ============================================================================
// Payment Schedule Template
// ============================================================================

const paymentTemplateSchema = new mongoose.Schema({
  template_id: {
    type: String,
    required: true,
    unique: true
  },

  name: {
    type: String,
    required: true
  },

  // For supplier type
  supplier_id: String,
  supplier_category: {
    type: String,
    enum: ['farm', 'dairy', 'wholesale', 'distributor', 'other'],
    default: 'other'
  },

  // Payment terms
  payment_terms: {
    type: {
      type: String,
      enum: ['advance', 'on_delivery', 'net_15', 'net_30', 'net_45', 'milestone'],
      default: 'on_delivery'
    },
    advance_percentage: {
      type: Number,
      default: 0
    },
    milestone_percentage: {
      type: Number,
      default: 100
    }
  },

  // Schedule rules
  schedule_rules: {
    auto_schedule: Boolean,
    schedule_before_hours: {
      type: Number,
      default: 24
    },
    reminder_before_hours: {
      type: Number,
      default: 4
    }
  },

  // Active status
  active: {
    type: Boolean,
    default: true
  }
});

const PaymentTemplate = mongoose.model('PaymentTemplate', paymentTemplateSchema);

module.exports = {
  ScheduledPayment,
  PaymentTemplate
};

/**
 * Auto Markdown Models
 * FreshMart 3PM Story: "Tomatoes Expiry Risk: 24 Hours → Quick Sale Campaign"
 */

const mongoose = require('mongoose');

// ============================================================================
// Expiring Item Model
// Tracks items approaching expiry that need markdown
// ============================================================================

const expiringItemSchema = new mongoose.Schema({
  // Store and product info
  store_id: {
    type: String,
    required: true,
    index: true
  },
  product_sku: {
    type: String,
    required: true,
    index: true
  },
  product_name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['produce', 'dairy', 'bakery', 'meat', 'frozen', 'deli', 'prepared', 'other'],
    default: 'other'
  },

  // Stock info
  current_stock: {
    type: Number,
    required: true,
    min: 0
  },
  original_price: {
    type: Number,
    required: true
  },

  // Expiry info
  expiry_date: {
    type: Date,
    required: true
  },
  hours_until_expiry: {
    type: Number,
    required: true
  },
  expiry_risk: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },

  // Markdown decision
  markdown_price: {
    type: Number
  },
  markdown_percentage: {
    type: Number
  },
  minimum_price: {
    type: Number  // Floor price to avoid losses
  },

  // Status
  status: {
    type: String,
    enum: ['detected', 'evaluating', 'approved', 'published', 'sold_out', 'expired', 'cancelled'],
    default: 'detected'
  },

  // Campaign info
  campaign_id: {
    type: String
  },
  adbazaar_campaign_id: {
    type: String
  },

  // Value at risk
  value_at_risk: {
    type: Number,
    default: 0  // current_stock * original_price
  },
  potential_recovery: {
    type: Number,
    default: 0  // Amount recoverable via markdown
  },

  // Timestamps
  detected_at: {
    type: Date,
    default: Date.now
  },
  approved_at: Date,
  published_at: Date,
  expires_at: Date

}, {
  timestamps: true
});

// Indexes
expiringItemSchema.index({ store_id: 1, status: 1 });
expiringItemSchema.index({ store_id: 1, category: 1, expiry_risk: 1 });
expiringItemSchema.index({ expiry_date: 1 }, { expireAfterSeconds: 0 });

// Calculate markdown price based on hours remaining
expiringItemSchema.methods.calculateMarkdown = function() {
  const now = new Date();
  const hoursRemaining = (this.expiry_date - now) / (1000 * 60 * 60);

  // Markdown rules based on hours remaining
  const rules = {
    24: { markdown: 0.20, label: '20% off - Same day' },      // 20% off if <24hrs
    48: { markdown: 0.15, label: '15% off - 2 days left' },  // 15% off if <48hrs
    72: { markdown: 0.10, label: '10% off - 3 days left' },  // 10% off if <72hrs
    168: { markdown: 0.05, label: '5% off - 1 week left' }   // 5% off if <1 week
  };

  let markdownRate = 0;
  let label = 'No markdown needed';

  if (hoursRemaining <= 24) {
    markdownRate = rules[24].markdown;
    label = rules[24].label;
  } else if (hoursRemaining <= 48) {
    markdownRate = rules[48].markdown;
    label = rules[48].label;
  } else if (hoursRemaining <= 72) {
    markdownRate = rules[72].markdown;
    label = rules[72].label;
  } else if (hoursRemaining <= 168) {
    markdownRate = rules[168].markdown;
    label = rules[168].label;
  }

  this.markdown_percentage = markdownRate * 100;
  this.markdown_price = Math.round(this.original_price * (1 - markdownRate) * 100) / 100;
  this.hours_until_expiry = hoursRemaining;

  // Set expiry risk
  if (hoursRemaining <= 24) this.expiry_risk = 'critical';
  else if (hoursRemaining <= 48) this.expiry_risk = 'high';
  else if (hoursRemaining <= 72) this.expiry_risk = 'medium';
  else this.expiry_risk = 'low';

  // Calculate value at risk
  this.value_at_risk = this.current_stock * this.original_price;
  this.potential_recovery = this.current_stock * this.markdown_price;

  return {
    markdown_price: this.markdown_price,
    markdown_percentage: this.markdown_percentage,
    hours_remaining: hoursRemaining,
    label,
    value_at_risk: this.value_at_risk,
    potential_recovery: this.potential_recovery
  };
};

const ExpiringItem = mongoose.model('ExpiringItem', expiringItemSchema);

// ============================================================================
// Markdown Campaign Model
// Groups multiple items into a single campaign
// ============================================================================

const markdownCampaignSchema = new mongoose.Schema({
  store_id: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,

  // Items in this campaign
  items: [{
    expiring_item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpiringItem'
    },
    product_sku: String,
    product_name: String,
    original_price: Number,
    markdown_price: Number,
    markdown_percentage: Number,
    stock: Number,
    sold: {
      type: Number,
      default: 0
    }
  }],

  // Campaign timing
  starts_at: {
    type: Date,
    default: Date.now
  },
  ends_at: {
    type: Date,
    required: true
  },
  extended: {
    type: Boolean,
    default: false
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },

  // AdBazaar integration
  adbazaar_campaign_id: String,
  notifications_sent: {
    type: Number,
    default: 0
  },
  reach: {
    type: Number,
    default: 0
  },
  conversions: {
    type: Number,
    default: 0
  },

  // Financials
  total_value_at_risk: Number,
  total_recovery: Number,
  total_revenue: {
    type: Number,
    default: 0
  },
  waste_prevented: {
    type: Number,
    default: 0  // kg/liters saved
  },

  // Source
  source: {
    type: String,
    enum: ['automatic', 'manual', 'scheduled'],
    default: 'automatic'
  }

}, {
  timestamps: true
});

markdownCampaignSchema.index({ store_id: 1, status: 1 });
markdownCampaignSchema.index({ starts_at: 1, ends_at: 1 });

// Calculate campaign totals
markdownCampaignSchema.methods.calculateTotals = function() {
  this.total_revenue = this.items.reduce((sum, item) => {
    return sum + (item.markdown_price * item.sold);
  }, 0);

  const originalValue = this.items.reduce((sum, item) => {
    return sum + (item.original_price * item.stock);
  }, 0);

  this.total_recovery = this.items.reduce((sum, item) => {
    return sum + (item.markdown_price * item.stock);
  }, 0);

  this.total_value_at_risk = originalValue;
  return this;
};

const MarkdownCampaign = mongoose.model('MarkdownCampaign', markdownCampaignSchema);

// ============================================================================
// Model Exports
// ============================================================================

module.exports = {
  ExpiringItem,
  MarkdownCampaign
};

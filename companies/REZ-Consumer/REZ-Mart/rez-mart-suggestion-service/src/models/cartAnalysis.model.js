/**
 * Cart Analysis Model
 * Tracks cart contents for basket analysis
 * Used for Smart Cart suggestions (FreshMart 11AM story)
 */

const mongoose = require('mongoose');

const cartAnalysisSchema = new mongoose.Schema({
  // Session/cart ID
  cartId: {
    type: String,
    required: true,
    index: true
  },

  // User ID (if logged in)
  userId: {
    type: String,
    index: true,
    sparse: true
  },

  // Store ID
  storeId: {
    type: String,
    required: true,
    index: true
  },

  // Cart items at time of analysis
  items: [{
    sku: String,
    name: String,
    quantity: Number,
    price: Number,
    category: String
  }],

  // Suggested items (what we recommended)
  suggestions: [{
    sku: String,
    name: String,
    reason: String,
    confidence: Number,
    suggestedFrom: [String],  // SKUs that triggered this suggestion
    accepted: Boolean,
    suggestedAt: Date
  }],

  // Total cart value
  totalValue: {
    type: Number,
    default: 0
  },

  // Item count
  itemCount: {
    type: Number,
    default: 0
  },

  // Analysis metadata
  analysisType: {
    type: String,
    enum: ['add_item', 'remove_item', 'view_cart', 'checkout', 'manual'],
    default: 'view_cart'
  },

  // Session context
  context: {
    timeOfDay: String,  // morning, afternoon, evening, night
    dayOfWeek: String,
    isReturningCustomer: Boolean,
    weather: String,
    festival: String
  },

  // Result
  outcome: {
    type: String,
    enum: ['completed', 'abandoned', 'viewed'],
    default: 'viewed'
  }
}, {
  timestamps: true
});

// Index for analytics
cartAnalysisSchema.index({ storeId: 1, createdAt: -1 });
cartAnalysisSchema.index({ userId: 1, createdAt: -1 });
cartAnalysisSchema.index({ 'items.sku': 1 });

// Calculate cart value
cartAnalysisSchema.methods.calculateTotal = function() {
  this.totalValue = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.itemCount = this.items.length;
  return this;
};

// Check if item is already in cart
cartAnalysisSchema.methods.hasItem = function(sku) {
  return this.items.some(item => item.sku === sku);
};

// Add suggestion with tracking
cartAnalysisSchema.methods.addSuggestion = function(sku, name, reason, confidence, suggestedFrom) {
  if (this.hasItem(sku)) return null;

  this.suggestions.push({
    sku,
    name,
    reason,
    confidence,
    suggestedFrom,
    accepted: false,
    suggestedAt: new Date()
  });

  return this.suggestions[this.suggestions.length - 1];
};

// Mark suggestion as accepted
cartAnalysisSchema.methods.acceptSuggestion = function(sku) {
  const suggestion = this.suggestions.find(s => s.sku === sku);
  if (suggestion) {
    suggestion.accepted = true;
    return true;
  }
  return false;
};

// Get acceptance rate
cartAnalysisSchema.statics.getAcceptanceRate = function(storeId, startDate, endDate) {
  return this.aggregate([
    { $match: { storeId, createdAt: { $gte: startDate, $lte: endDate } } },
    { $unwind: '$suggestions' },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        accepted: { $sum: { $cond: ['$suggestions.accepted', 1, 0] } }
      }
    },
    {
      $project: {
        acceptanceRate: { $divide: ['$accepted', '$total'] },
        total: 1,
        accepted: 1
      }
    }
  ]);
};

// Get top suggestions by category
cartAnalysisSchema.statics.getTopSuggestionsByCategory = function(category, limit = 10) {
  return this.aggregate([
    { $unwind: '$suggestions' },
    { $match: { 'suggestions.accepted': true } },
    {
      $lookup: {
        from: 'products',
        localField: 'suggestions.sku',
        foreignField: 'sku',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    { $match: { 'product.category': category } },
    {
      $group: {
        _id: '$suggestions.sku',
        name: { $first: '$suggestions.name' },
        acceptedCount: { $sum: 1 },
        avgConfidence: { $avg: '$suggestions.confidence' }
      }
    },
    { $sort: { acceptedCount: -1 } },
    { $limit: limit }
  ]);
};

module.exports = mongoose.model('CartAnalysis', cartAnalysisSchema);

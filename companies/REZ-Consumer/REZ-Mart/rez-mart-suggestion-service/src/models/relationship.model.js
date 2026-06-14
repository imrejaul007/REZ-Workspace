/**
 * Product Relationship Model
 * Tracks which products are frequently bought together
 * Used for Smart Cart suggestions (FreshMart 11AM story)
 */

const mongoose = require('mongoose');

const relationshipSchema = new mongoose.Schema({
  // Primary product SKU
  productSku: {
    type: String,
    required: true,
    index: true
  },

  // Related product SKU
  relatedSku: {
    type: String,
    required: true,
    index: true
  },

  // Relationship type
  type: {
    type: String,
    enum: ['frequently_bought_together', 'substitute', 'complementary', 'accessory'],
    default: 'frequently_bought_together'
  },

  // How often these are bought together (0-1)
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },

  // Number of times bought together
  coPurchaseCount: {
    type: Number,
    default: 0
  },

  // Total times primary product was purchased
  primaryPurchaseCount: {
    type: Number,
    default: 0
  },

  // Category of relationship
  category: {
    type: String,
    enum: ['grocery', 'dairy', 'produce', 'bakery', 'beverages', 'snacks', 'household', 'personal_care'],
    default: 'grocery'
  },

  // When customers buy this, they also buy those (ranked)
  rank: {
    type: Number,
    default: 0
  },

  // Is this relationship active?
  active: {
    type: Boolean,
    default: true
  },

  // Last updated timestamp
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient lookups
relationshipSchema.index({ productSku: 1, relatedSku: 1 }, { unique: true });
relationshipSchema.index({ productSku: 1, confidence: -1 });

// Static method to update relationship
relationshipSchema.statics.updateRelationship = async function(productSku, relatedSku, category = 'grocery') {
  const existing = await this.findOne({ productSku, relatedSku });

  if (existing) {
    existing.coPurchaseCount += 1;
    existing.lastUpdated = new Date();
    await existing.save();
  } else {
    await this.create({
      productSku,
      relatedSku,
      coPurchaseCount: 1,
      category,
      type: 'frequently_bought_together'
    });
  }

  // Recalculate confidence for all relationships of this product
  await this.recalculateConfidence(productSku);
};

// Recalculate confidence scores
relationshipSchema.statics.recalculateConfidence = async function(productSku) {
  const relationships = await this.find({ productSku, active: true })
    .sort({ coPurchaseCount: -1 })
    .limit(20);

  const totalPurchases = relationships.length > 0
    ? relationships.reduce((sum, r) => sum + r.coPurchaseCount, 0)
    : 1;

  for (let i = 0; i < relationships.length; i++) {
    relationships[i].confidence = relationships[i].coPurchaseCount / totalPurchases;
    relationships[i].rank = i + 1;
    await relationships[i].save();
  }
};

// Get top suggestions for a product
relationshipSchema.statics.getSuggestions = async function(productSku, limit = 5) {
  return this.find({ productSku, active: true })
    .sort({ confidence: -1 })
    .limit(limit);
};

// Get all suggestions for a cart
relationshipSchema.statics.getCartSuggestions = async function(cartItems, limit = 10) {
  const suggestions = new Map();

  for (const item of cartItems) {
    const related = await this.find({ productSku: item.sku, active: true })
      .sort({ confidence: -1 })
      .limit(5);

    for (const r of related) {
      // Skip if already in cart
      if (cartItems.some(c => c.sku === r.relatedSku)) continue;

      if (suggestions.has(r.relatedSku)) {
        suggestions.get(r.relatedSku).score += r.confidence;
      } else {
        suggestions.set(r.relatedSku, {
          sku: r.relatedSku,
          score: r.confidence,
          suggestedFrom: item.sku,
          type: r.type
        });
      }
    }
  }

  return Array.from(suggestions.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

module.exports = mongoose.model('ProductRelationship', relationshipSchema);

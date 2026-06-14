/**
 * Smart Cart Suggestion Service
 * FreshMart 11AM Story: "Customer adds cereal → suggests milk, honey, fresh fruit"
 */

const ProductRelationship = require('../models/relationship.model');
const CartAnalysis = require('../models/cartAnalysis.model');

class SuggestionService {
  /**
   * Get suggestions for a single product
   * Example: Add cereal → suggest milk, honey, fruit
   */
  async getProductSuggestions(productSku, limit = 5) {
    const relationships = await ProductRelationship.getSuggestions(productSku, limit);

    return relationships.map(r => ({
      sku: r.relatedSku,
      type: r.type,
      confidence: Math.round(r.confidence * 100),
      reason: this.getSuggestionReason(r.type, productSku, r.relatedSku),
      rank: r.rank
    }));
  }

  /**
   * Get suggestions for entire cart
   * Analyzes all items and finds complementary products
   */
  async getCartSuggestions(cartItems, options = {}) {
    const { limit = 10, includePersonalized = true, userId = null } = options;

    // Get all suggestions from cart items
    const allSuggestions = await ProductRelationship.getCartSuggestions(cartItems, limit * 2);

    // Filter out items already in cart
    const cartSkus = new Set(cartItems.map(i => i.sku));
    const filteredSuggestions = allSuggestions.filter(s => !cartSkus.has(s.sku));

    // Add product details and reasons
    const enrichedSuggestions = await Promise.all(
      filteredSuggestions.slice(0, limit).map(async (s) => {
        // In production, fetch product details from product service
        return {
          sku: s.sku,
          score: Math.round(s.score * 100),
          type: s.type,
          reason: this.getSuggestionReason(s.type, s.suggestedFrom, s.sku),
          suggestedFrom: s.suggestedFrom,
          action: 'add_to_cart'
        };
      })
    );

    return {
      suggestions: enrichedSuggestions,
      totalItems: cartItems.length,
      potentialValueIncrease: this.calculatePotentialValue(enrichedSuggestions)
    };
  }

  /**
   * Get personalized suggestions based on user history
   */
  async getPersonalizedSuggestions(userId, cartItems, limit = 5) {
    // Get cart suggestions
    const cartSuggestions = await this.getCartSuggestions(cartItems, { limit });

    // Get user preference-based suggestions
    // In production, fetch from user profile/twin
    const userPreferences = await this.getUserPreferences(userId);

    // Combine and rank
    const combined = [
      ...cartSuggestions.suggestions.map(s => ({ ...s, source: 'cart_analysis' })),
      ...userPreferences.map(p => ({ ...p, source: 'user_preference' }))
    ];

    // Remove duplicates, prioritize cart_analysis
    const seen = new Set();
    const prioritized = combined.filter(s => {
      if (seen.has(s.sku) && s.source !== 'cart_analysis') return false;
      seen.add(s.sku);
      return true;
    });

    return prioritized.slice(0, limit);
  }

  /**
   * Record a purchase event to update relationships
   * Should be called after successful checkout
   */
  async recordPurchase(cartId, userId, storeId, items, context = {}) {
    // Create cart analysis record
    const analysis = new CartAnalysis({
      cartId,
      userId,
      storeId,
      items,
      context: {
        timeOfDay: this.getTimeOfDay(),
        dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        ...context
      }
    });
    analysis.calculateTotal();

    // Update product relationships based on co-purchases
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        await ProductRelationship.updateRelationship(
          items[i].sku,
          items[j].sku,
          items[i].category || 'grocery'
        );
      }
    }

    await analysis.save();
    return analysis;
  }

  /**
   * Get suggestion reason text
   */
  getSuggestionReason(type, fromSku, toSku) {
    const reasons = {
      frequently_bought_together: 'Frequently bought together',
      complementary: 'Goes great with this',
      accessory: 'Perfect搭配',
      substitute: 'You might also like'
    };
    return reasons[type] || 'Recommended for you';
  }

  /**
   * Calculate potential value increase from suggestions
   */
  calculatePotentialValue(suggestions) {
    // In production, fetch actual prices
    const avgPrice = 50; // Default average price
    return suggestions.length * avgPrice;
  }

  /**
   * Get time of day context
   */
  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Get user preferences (placeholder)
   * In production, fetch from user profile/twin
   */
  async getUserPreferences(userId) {
    // TODO: Integrate with user profile/twin service
    return [];
  }

  /**
   * Get analytics on suggestion performance
   */
  async getSuggestionAnalytics(storeId, startDate, endDate) {
    const [acceptanceRate, topSuggestions] = await Promise.all([
      CartAnalysis.getAcceptanceRate(storeId, startDate, endDate),
      CartAnalysis.getTopSuggestionsByCategory('grocery', 10)
    ]);

    return {
      acceptanceRate: acceptanceRate[0]?.acceptanceRate || 0,
      totalSuggestions: acceptanceRate[0]?.total || 0,
      acceptedSuggestions: acceptanceRate[0]?.accepted || 0,
      topSuggestions
    };
  }
}

module.exports = new SuggestionService();

/**
 * Customer Preferences Service
 * FreshMart 10AM Story: Track dietary preferences, family size, baby products
 */

const { DietaryPreferences, FamilyProfile, BabyProductHistory } = require('../models/customerPreferences.model');

class PreferencesService {

  /**
   * Get all preferences for a customer
   */
  async getAllPreferences(customerId) {
    const [dietary, family, baby] = await Promise.all([
      DietaryPreferences.findOne({ customer_id: customerId }),
      FamilyProfile.findOne({ customer_id: customerId }),
      BabyProductHistory.findOne({ customer_id: customerId })
    ]);

    return {
      dietary,
      family,
      baby,
      summary: this.generateSummary(dietary, family, baby)
    };
  }

  /**
   * Update dietary preferences
   */
  async updateDietaryPreferences(customerId, data) {
    const preferences = await DietaryPreferences.findOneAndUpdate(
      { customer_id: customerId },
      { ...data, last_updated: new Date() },
      { upsert: true, new: true }
    );
    return preferences;
  }

  /**
   * Update family profile
   */
  async updateFamilyProfile(customerId, data) {
    const profile = await FamilyProfile.findOneAndUpdate(
      { customer_id: customerId },
      { ...data, last_updated: new Date() },
      { upsert: true, new: true }
    );
    return profile;
  }

  /**
   * Update baby product history
   */
  async updateBabyHistory(customerId, data) {
    const history = await BabyProductHistory.findOneAndUpdate(
      { customer_id: customerId },
      { ...data, last_updated: new Date() },
      { upsert: true, new: true }
    );
    return history;
  }

  /**
   * Record baby product purchase
   */
  async recordBabyPurchase(customerId, productData) {
    let history = await BabyProductHistory.findOne({ customer_id: customerId });

    if (!history) {
      history = new BabyProductHistory({
        customer_id: customerId,
        has_baby: true
      });
    }

    history.has_baby = true;
    if (productData.baby_dob) {
      history.baby_dob = productData.baby_dob;
      history.baby_age_months = Math.floor((Date.now() - new Date(productData.baby_dob)) / (30 * 24 * 60 * 60 * 1000));
    }

    // Update product categories
    const category = history.product_categories.find(c => c.category === productData.category);
    if (category) {
      category.last_purchase_date = new Date();
      category.purchase_count += 1;
    } else {
      history.product_categories.push({
        category: productData.category,
        subcategory: productData.subcategory,
        first_purchase_date: new Date(),
        last_purchase_date: new Date(),
        purchase_count: 1
      });
    }

    await history.save();
    return history;
  }

  /**
   * Get baby product recommendations
   */
  async getBabyRecommendations(customerId) {
    const history = await BabyProductHistory.findOne({ customer_id: customerId });
    if (!history || !history.has_baby) return [];

    const recommendations = [];

    // Check for low stock products
    for (const product of history.tracked_products) {
      if (product.reorder_recommended) {
        recommendations.push({
          sku: product.sku,
          name: product.name,
          reason: 'Time to reorder',
          category: product.category
        });
      }
    }

    // Suggest products based on baby age
    if (history.baby_age_months !== undefined) {
      if (history.baby_age_months >= 6 && history.baby_age_months < 12) {
        recommendations.push({
          type: 'suggestion',
          message: 'Your baby might be ready for solid foods!',
          categories: ['cerelac', 'purees', 'baby cereal']
        });
      }
    }

    return recommendations;
  }

  /**
   * Check if customer has special dietary needs
   */
  async hasDietaryRestrictions(customerId) {
    const dietary = await DietaryPreferences.findOne({ customer_id: customerId });
    if (!dietary) return { hasRestrictions: false };

    const restrictions = [];

    if (dietary.diet_type === 'vegetarian' || dietary.diet_type === 'vegan') {
      restrictions.push('vegetarian');
    }

    if (dietary.allergies?.length > 0) {
      restrictions.push(...dietary.allergies.map(a => a.allergen));
    }

    if (dietary.religious_restrictions?.length > 0) {
      restrictions.push(...dietary.religious_restrictions.map(r => r.type));
    }

    return {
      hasRestrictions: restrictions.length > 0,
      restrictions,
      details: dietary
    };
  }

  /**
   * Generate preferences summary
   */
  generateSummary(dietary, family, baby) {
    const summary = [];

    if (dietary?.diet_type && dietary.diet_type !== 'non_vegetarian') {
      summary.push(dietary.diet_type);
    }

    if (dietary?.allergies?.length > 0) {
      summary.push(`Allergic to: ${dietary.allergies.map(a => a.allergen).join(', ')}`);
    }

    if (family?.family_size) {
      summary.push(`Family of ${family.family_size}`);
    }

    if (baby?.has_baby) {
      summary.push(`Baby (${baby.baby_age_months || '?'} months)`);
    }

    return summary;
  }

  /**
   * Get customer segment based on preferences
   */
  async getCustomerSegment(customerId) {
    const prefs = await this.getAllPreferences(customerId);

    const segments = [];

    // Family segment
    if (prefs.family?.family_size >= 4) {
      segments.push('family_household');
    }

    // Health conscious
    if (prefs.dietary?.preferences?.organic_only || prefs.dietary?.preferences?.gluten_free) {
      segments.push('health_conscious');
    }

    // Budget
    if (prefs.dietary?.price_sensitivity === 'budget') {
      segments.push('budget_shopper');
    }

    // Premium
    if (prefs.dietary?.price_sensitivity === 'premium' || prefs.dietary?.price_sensitivity === 'luxury') {
      segments.push('premium_shopper');
    }

    // New parent
    if (prefs.baby?.has_baby) {
      segments.push('new_parent');
    }

    return segments;
  }
}

module.exports = new PreferencesService();

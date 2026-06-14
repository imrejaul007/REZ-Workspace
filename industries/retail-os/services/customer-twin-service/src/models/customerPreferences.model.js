/**
 * Customer Preferences Extension
 * FreshMart 10AM Story: "Mother enters → GroceryIQ knows she buys baby products"
 */

const mongoose = require('mongoose');

/**
 * Dietary Preferences
 * Track vegetarian, vegan, religious restrictions, allergies
 */
const dietaryPreferencesSchema = new mongoose.Schema({
  customer_id: {
    type: String,
    required: true,
    index: true
  },

  // Diet type
  diet_type: {
    type: String,
    enum: ['vegetarian', 'vegan', 'non_vegetarian', 'eggetarian', 'pescatarian', 'keto', 'paleo', 'other'],
    default: 'non_vegetarian'
  },

  // Religious/Ethical
  religious_restrictions: [{
    type: {
      type: String,
      enum: ['halal', 'kosher', 'jain', 'Buddhist', 'hindu_veg', 'sikh_veg']
    },
    strict: {
      type: Boolean,
      default: true
    }
  }],

  // Allergies
  allergies: [{
    allergen: {
      type: String,
      enum: ['nuts', 'peanuts', 'dairy', 'eggs', 'wheat', 'soy', 'fish', 'shellfish', 'sesame', 'other']
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    }
  }],

  // Preferences
  preferences: {
    organic_only: { type: Boolean, default: false },
    local_only: { type: Boolean, default: false },
    low_sugar: { type: Boolean, default: false },
    gluten_free: { type: Boolean, default: false },
    low_sodium: { type: Boolean, default: false },
    whole_grain: { type: Boolean, default: false }
  },

  // Spending preferences
  price_sensitivity: {
    type: String,
    enum: ['budget', 'moderate', 'premium', 'luxury'],
    default: 'moderate'
  },

  // Updated
  last_updated: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

dietaryPreferencesSchema.index({ customer_id: 1 }, { unique: true });

const DietaryPreferences = mongoose.model('DietaryPreferences', dietaryPreferencesSchema);

/**
 * Family Profile
 * Track family size, members, for better recommendations
 */
const familyProfileSchema = new mongoose.Schema({
  customer_id: {
    type: String,
    required: true,
    index: true
  },

  // Family size
  family_size: {
    type: Number,
    default: 1,
    min: 1,
    max: 15
  },

  // Family composition
  members: [{
    role: {
      type: String,
      enum: ['adult_male', 'adult_female', 'child', 'infant', 'elderly', 'teen']
    },
    age_group: {
      type: String,
      enum: ['0-2', '3-12', '13-19', '20-35', '36-50', '51-65', '65+']
    },
    count: {
      type: Number,
      default: 1
    }
  }],

  // Special needs
  special_needs: [{
    type: {
      type: String,
      enum: ['diabetes', 'heart_condition', 'pregnancy', 'nursing', 'allergies', 'elderly_care', 'infant_care']
    },
    details: String
  }],

  // Household type
  household_type: {
    type: String,
    enum: ['single', 'couple', 'family_with_kids', 'joint_family', 'senior_couple', 'roommates', 'other'],
    default: 'single'
  },

  // Consumption patterns based on family
  monthly_budget: Number,
  avg_monthly_grocery_spend: Number,

  last_updated: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

familyProfileSchema.index({ customer_id: 1 }, { unique: true });

const FamilyProfile = mongoose.model('FamilyProfile', familyProfileSchema);

/**
 * Baby/Infant Products History
 * Track purchases of baby products for new parent detection
 */
const babyProductHistorySchema = new mongoose.Schema({
  customer_id: {
    type: String,
    required: true,
    index: true
  },

  // Baby info
  has_baby: {
    type: Boolean,
    default: false
  },
  baby_dob: Date,
  baby_age_months: Number,

  // Product categories purchased
  product_categories: [{
    category: String,
    subcategory: String,
    first_purchase_date: Date,
    last_purchase_date: Date,
    purchase_count: {
      type: Number,
      default: 0
    },
    avg_quantity_per_month: Number
  }],

  // Specific products tracked
  tracked_products: [{
    sku: String,
    name: String,
    category: String,
    purchase_frequency: Number,  // days between purchases
    last_purchase: Date,
    next_expected: Date,
    is_regular: Boolean
  }],

  // Consumption patterns
  consumption_patterns: [{
    sku: String,
    avg_consumption_per_day: Number,
    days_supply_remaining: Number,
    reorder_recommended: Boolean
  }],

  // Notifications
  notifications: {
    low_stock_alerts: { type: Boolean, default: true },
    reorder_reminders: { type: Boolean, default: true },
    new_product_suggestions: { type: Boolean, default: true }
  },

  last_updated: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

babyProductHistorySchema.index({ customer_id: 1 }, { unique: true });
babyProductHistorySchema.index({ 'tracked_products.sku': 1 });

const BabyProductHistory = mongoose.model('BabyProductHistory', babyProductHistorySchema);

module.exports = {
  DietaryPreferences,
  FamilyProfile,
  BabyProductHistory
};

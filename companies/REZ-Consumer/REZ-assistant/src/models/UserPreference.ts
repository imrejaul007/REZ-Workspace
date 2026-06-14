/**
 * UserPreference Model
 * Learns and stores user preferences across categories
 */

import { IntentCategory } from './SearchIntent';

export interface PricePreference {
  min: number;
  max: number;
  currency: string;
  volatility: number; // How much price affects decisions (0-1)
}

export interface LocationPreference {
  preferred_locations: Array<{
    lat: number;
    lng: number;
    radius_km: number;
    weight: number;
  }>;
  location_type: 'always_same' | 'varies_by_context' | 'exploratory';
}

export interface BrandPreference {
  brand_id: string;
  brand_name: string;
  affinity_score: number; // -1 to 1
  category: IntentCategory;
  last_interaction: Date;
  interaction_count: number;
}

export interface AmenityPreference {
  amenity: string;
  weight: number; // 0-1, importance
  category: IntentCategory;
}

export interface TimePreference {
  day_of_week: number; // 0-6 (Sunday-Saturday)
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
  advance_booking_hours: number;
}

export interface WishlistItem {
  item_id: string;
  merchant_id: string;
  category: IntentCategory;
  added_at: Date;
  price: number;
  price_alert_threshold?: number;
  notify_on_discount: boolean;
  expires_at?: Date;
}

export interface ComparisonTracker {
  session_id: string;
  item_ids: string[];
  compared_fields: string[];
  decision_made: boolean;
  chosen_item_id?: string;
  decision_time_ms: number;
  price_sensitivity_score: number;
}

export interface UserPreference {
  user_id: string;
  updated_at: Date;

  // Category preferences
  category_affinities: Record<IntentCategory, number>;

  // Price preferences
  price_preferences: Record<IntentCategory, PricePreference>;

  // Location preferences
  location_preferences: LocationPreference;

  // Brand preferences
  brand_preferences: BrandPreference[];

  // Amenity preferences
  amenity_preferences: AmenityPreference[];

  // Time preferences
  time_preferences: TimePreference[];

  // Wishlist
  wishlist: WishlistItem[];

  // Comparison behavior
  comparison_history: ComparisonTracker[];

  // Engagement patterns
  avg_session_duration_ms: number;
  avg_ctr: number;
  wishlist_to_purchase_rate: number;

  // Seasonality
  seasonal_patterns: Array<{
    month: number;
    category: IntentCategory;
    intensity: number;
  }>;
}

export interface PreferenceInsight {
  insight_type: 'price_sensitivity' | 'brand_loyalty' | 'location_loyalty' | 'timing_pattern' | 'bargain_hunter' | 'quality_seeker';
  confidence: number; // 0-1
  description: string;
  actionable_recommendation: string;
  data_points_used: number;
}

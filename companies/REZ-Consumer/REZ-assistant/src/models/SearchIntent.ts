/**
 * SearchIntent Model
 * Tracks user search behavior and intent signals
 */

export type IntentCategory = 'hotel' | 'restaurant' | 'shopping' | 'events' | 'services';

export interface Location {
  lat: number;
  lng: number;
}

export interface SearchFilters {
  priceRange?: [number, number];
  rating?: number;
  distance?: number;
  amenities?: string[];
  cuisine?: string[];
  brand?: string[];
  [key: string]: unknown;
}

export interface SearchIntent {
  intent_id: string;
  user_id: string;
  category: IntentCategory;
  query: string;
  filters: SearchFilters;
  results_viewed: number;
  clicked_merchant_id?: string;
  location: Location;
  timestamp: Date;
  abandoned: boolean;
  session_id: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
  referrer?: string;
  dwell_time_ms: number;
}

export interface SearchIntentCreateInput {
  user_id: string;
  category: IntentCategory;
  query: string;
  filters?: SearchFilters;
  location: Location;
  session_id: string;
  device_type?: 'mobile' | 'tablet' | 'desktop';
  referrer?: string;
}

export interface SearchIntentUpdateInput {
  results_viewed?: number;
  clicked_merchant_id?: string;
  abandoned?: boolean;
  dwell_time_ms?: number;
}

/**
 * Intent engagement metrics
 */
export interface EngagementMetrics {
  intent_id: string;
  impressions: number;
  clicks: number;
  ctr: number;
  time_to_click_ms: number;
  scroll_depth: number;
  add_to_wishlist: boolean;
  share: boolean;
}

/**
 * Search pattern detection
 */
export interface SearchPattern {
  pattern_type: 'comparison' | 'refinement' | 'exploration' | 'repeat' | 'abandoned';
  previous_intent_ids: string[];
  similarity_score: number;
  inferred_preference: Record<string, unknown>;
}
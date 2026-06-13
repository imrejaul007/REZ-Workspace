/**
 * Rider Twin Types
 *
 * Type definitions for Rider Twin service based on Transport OS specification
 */

// Configuration
export interface RiderTwinConfig {
  port: number;
  nodeEnv: string;
  corsOrigins: string[];
  logLevel: string;
  eventBusUrl?: string;
}

// Rider Profile Types
export interface RiderProfile {
  first: string;
  last: string;
  email: string;
  phone: string;
  photo_url?: string;
}

export interface RiderName {
  first: string;
  last: string;
}

// Payment Types
export interface PaymentMethod {
  card_id: string;
  last_four: string;
  brand: string;
  is_default: boolean;
}

export interface RiderPayment {
  default_payment_method: string;
  saved_cards: PaymentMethod[];
  cash_enabled: boolean;
}

// Rider Preferences
export interface RiderPreferences {
  preferred_vehicle_type: string;
  preferred_payment: string;
  smoking_policy: 'no_preference' | 'no_smoking';
  music_preference: 'no_preference' | 'quiet' | 'any';
  air_conditioning: 'no_preference' | 'on' | 'off';
  special_assistance: string[];
}

// Address Types
export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface SavedAddress {
  lat: number;
  lng: number;
  address: string;
  label: string;
}

export interface RiderAddresses {
  home?: SavedAddress;
  work?: SavedAddress;
  favorites: SavedAddress[];
}

// Loyalty Types
export type LoyaltyTier = 'basic' | 'silver' | 'gold' | 'platinum';

export interface RiderLoyalty {
  member_id?: string;
  tier: LoyaltyTier;
  points_balance: number;
  lifetime_points: number;
}

// Activity Types
export interface FavoriteRoute {
  from: string;
  to: string;
  count: number;
}

export interface RiderActivity {
  total_trips: number;
  total_spend: number;
  avg_trip_cost: number;
  last_trip?: string;
  favorite_routes: FavoriteRoute[];
}

// Feedback Types
export interface RiderFeedback {
  avg_rating: number;
  given_count: number;
  reports_count: number;
}

// Main Rider Twin Entity
export interface RiderTwin {
  rider_id: string;
  profile: RiderProfile;
  payment: RiderPayment;
  preferences: RiderPreferences;
  addresses: RiderAddresses;
  loyalty: RiderLoyalty;
  activity: RiderActivity;
  feedback: RiderFeedback;
  created_at: string;
  updated_at: string;
}

// API Request/Response Types
export interface CreateRiderRequest {
  profile: RiderProfile;
  payment?: Partial<RiderPayment>;
  preferences?: Partial<RiderPreferences>;
}

export interface UpdateRiderRequest {
  profile?: Partial<RiderProfile>;
  preferences?: Partial<RiderPreferences>;
}

export interface AddPaymentMethodRequest {
  card_id: string;
  last_four: string;
  brand: string;
  set_as_default?: boolean;
}

export interface AddAddressRequest {
  type: 'home' | 'work' | 'favorite';
  label: string;
  address: string;
  lat: number;
  lng: number;
}

export interface SetPreferencesRequest {
  preferred_vehicle_type?: string;
  preferred_payment?: string;
  smoking_policy?: RiderPreferences['smoking_policy'];
  music_preference?: RiderPreferences['music_preference'];
  air_conditioning?: RiderPreferences['air_conditioning'];
  special_assistance?: string[];
}

export interface AddFavoriteRouteRequest {
  from: string;
  to: string;
}

export interface RiderListParams {
  page?: number;
  limit?: number;
  tier?: LoyaltyTier;
  sort_by?: 'created_at' | 'total_trips' | 'total_spend';
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Event Types
export interface RiderEvent {
  event_type: string;
  rider_id: string;
  timestamp: string;
  data?: Record<string, any>;
}

export interface OrderCreatedEvent extends RiderEvent {
  event_type: 'order_created';
  data: {
    order_id: string;
    pickup_location: GeoLocation;
    dropoff_location: GeoLocation;
    service_type: string;
  };
}

export interface JourneyCompletedEvent extends RiderEvent {
  event_type: 'journey_completed';
  data: {
    journey_id: string;
    distance_km: number;
    duration_minutes: number;
    fare: number;
  };
}

// WebSocket Message Types
export interface WSSubscribeMessage {
  type: 'subscribe';
  rider_id: string;
}

export interface WSRiderUpdateMessage {
  type: 'rider_update';
  rider_id: string;
  event: {
    type: string;
    [key: string]: any;
  };
  timestamp: string;
}

// TwinOS Entity ID format: twin.transport.rider.{rider_id}
export function getRiderTwinId(riderId: string): string {
  return `twin.transport.rider.${riderId}`;
}

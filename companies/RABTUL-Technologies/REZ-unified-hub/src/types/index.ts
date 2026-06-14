/**
 * REZ Unified Hub - Type Definitions
 */

// ============================================
// SERVICE URLs
// ============================================

export const SERVICES = {
  // RABTUL Core
  AUTH: process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com',
  PAYMENT: process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com',
  WALLET: process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service.onrender.com',
  ORDER: process.env.ORDER_SERVICE_URL || 'https://rez-order-service.onrender.com',
  CATALOG: process.env.CATALOG_SERVICE_URL || 'https://rez-catalog-service.onrender.com',
  SEARCH: process.env.SEARCH_SERVICE_URL || 'https://rez-search-service.onrender.com',
  DELIVERY: process.env.DELIVERY_SERVICE_URL || 'https://rez-delivery-service.onrender.com',
  NOTIFICATIONS: process.env.NOTIFICATIONS_SERVICE_URL || 'https://rez-notifications-service.onrender.com',
  PROFILE: process.env.PROFILE_SERVICE_URL || 'https://rez-profile-service.onrender.com',
  BOOKING: process.env.BOOKING_SERVICE_URL || 'https://rez-booking-service.onrender.com',

  // RABTUL Infrastructure
  CIRCUIT_BREAKER: process.env.CB_SERVICE_URL || 'https://rez-circuit-breaker.onrender.com',
  RETRY: process.env.RETRY_SERVICE_URL || 'https://REZ-retry-service.onrender.com',
  DLQ: process.env.DLQ_SERVICE_URL || 'https://REZ-dlq-service.onrender.com',
  IDEMPOTENCY: process.env.IDEMPOTENCY_SERVICE_URL || 'https://REZ-idempotency-service.onrender.com',
  SECRETS: process.env.SECRETS_SERVICE_URL || 'https://REZ-secrets-manager.onrender.com',
  SCHEDULER: process.env.SCHEDULER_SERVICE_URL || 'https://REZ-scheduler-service.onrender.com',

  // REZ Intelligence
  INTENT: process.env.INTENT_URL || 'https://rez-intent-predictor.onrender.com',
  FRAUD: process.env.FRAUD_URL || 'https://rez-fraud-agent.onrender.com',
  RECOMMEND: process.env.RECOMMEND_URL || 'https://REZ-recommendation-engine.onrender.com',
  PREDICT: process.env.PREDICT_URL || 'https://REZ-predictive-engine.onrender.com',
  SIGNAL: process.env.SIGNAL_URL || 'https://REZ-signal-aggregator.onrender.com',
  PERSONAL: process.env.PERSONAL_URL || 'https://REZ-personalization-engine.onrender.com',
  SEGMENTS: process.env.SEGMENTS_URL || 'https://REZ-realtime-segments.onrender.com',
  CDP: process.env.CDP_URL || 'https://REZ-cdp-service.onrender.com',
  RFM: process.env.RFM_URL || 'https://REZ-rfm-service.onrender.com',
  IDENTITY: process.env.IDENTITY_URL || 'https://REZ-identity-graph.onrender.com',

  // REZ Media
  ADS: process.env.ADS_URL || 'https://REZ-ads-platform.onrender.com',
  KARMA: process.env.KARMA_URL || 'https://rez-gamification-service.onrender.com',
  ATTRIBUTION: process.env.ATTRIBUTION_URL || 'https://REZ-attribution-hub.onrender.com',
  CRM: process.env.CRM_URL || 'https://REZ-crm-hub.onrender.com',

  // QR Services
  VERIFY_QR: process.env.VERIFY_QR_URL || 'https://verify-qr.onrender.com',
  SAFE_QR: process.env.SAFE_QR_URL || 'https://safe-qr.onrender.com',
  CREATOR_QR: process.env.CREATOR_QR_URL || 'https://creator-qr.onrender.com',
  ADS_QR: process.env.ADS_QR_URL || 'https://ads-qr.onrender.com',
  ROOM_QR: process.env.ROOM_QR_URL || 'https://room-qr.onrender.com',

  // CorpPerks
  PEOPLE_OS: process.env.PEOPLE_OS_URL || 'https://peopleos.onrender.com',
  TALENT_AI: process.env.TALENT_AI_URL || 'https://talentai.onrender.com',
  INSIGHT_CAMPUS: process.env.INSIGHT_URL || 'https://insight-campus.onrender.com',
  HR_APP: process.env.HR_APP_URL || 'https://hr-app.onrender.com',

  // REZ Mind & Agent
  MIND: process.env.MIND_API || 'https://REZ-mind.onrender.com',
  AGENT: process.env.AGENT_API || 'https://REZ-agent.onrender.com',
  CARE: process.env.CARE_API || 'https://REZ-care.onrender.com',

  // ============================================
  // HOJAI AI CORE (4500-4590)
  // ============================================
  HOJAI_GATEWAY: process.env.HOJAI_GATEWAY || 'http://localhost:4500',
  HOJAI_GOVERNANCE: process.env.HOJAI_GOVERNANCE || 'http://localhost:4501',
  HOJAI_EVENT_BUS: process.env.HOJAI_EVENT_BUS || 'http://localhost:4510',
  HOJAI_MEMORY: process.env.HOJAI_MEMORY || 'http://localhost:4520',
  HOJAI_INTELLIGENCE: process.env.HOJAI_INTELLIGENCE || 'http://localhost:4530',
  HOJAI_AGENTS: process.env.HOJAI_AGENTS || 'http://localhost:4550',
  HOJAI_WORKFLOWS: process.env.HOJAI_WORKFLOWS || 'http://localhost:4560',
  HOJAI_COMMS: process.env.HOJAI_COMMS || 'http://localhost:4570',
  HOJAI_HYPERLOCAL: process.env.HOJAI_HYPERLOCAL || 'http://localhost:4580',
  HOJAI_DATA: process.env.HOJAI_DATA || 'http://localhost:4590',

  // ============================================
  // HOJAI GENIE (4703-4707)
  // ============================================
  GENIE_MEMORY: process.env.GENIE_MEMORY || 'http://localhost:4703',
  GENIE_RELATION: process.env.GENIE_RELATION || 'http://localhost:4704',
  GENIE_BRIEFING: process.env.GENIE_BRIEFING || 'http://localhost:4706',

  // ============================================
  // HOJAI INTELLIGENCE SUITE (4750-4754)
  // ============================================
  COMMERCE_AI: process.env.COMMERCE_AI || 'http://localhost:4750',
  MERCHANT_AI: process.env.MERCHANT_AI || 'http://localhost:4751',
  CUSTOMER_AI: process.env.CUSTOMER_AI || 'http://localhost:4752',
  MARKETING_AI: process.env.MARKETING_AI || 'http://localhost:4753',
  FINANCIAL_AI: process.env.FINANCIAL_AI || 'http://localhost:4754',

  // ============================================
  // SUTAR OS (4140-4254)
  // ============================================
  SUTAR_GATEWAY: process.env.SUTAR_GATEWAY || 'http://localhost:4140',
  SUTAR_TWIN_OS: process.env.SUTAR_TWIN_OS || 'http://localhost:4142',
  SUTAR_MEMORY: process.env.SUTAR_MEMORY || 'http://localhost:4143',
  SUTAR_AGENT_ID: process.env.SUTAR_AGENT_ID || 'http://localhost:4146',
  SUTAR_SUPPLIER: process.env.SUTAR_SUPPLIER || 'http://localhost:4147',
  SUTAR_TRUST: process.env.SUTAR_TRUST || 'http://localhost:4148',
  SUTAR_DISCOVERY: process.env.SUTAR_DISCOVERY || 'http://localhost:4149',
  SUTAR_INTENT: process.env.SUTAR_INTENT || 'http://localhost:4154',
  SUTAR_DECISION: process.env.SUTAR_DECISION || 'http://localhost:4240',
  SUTAR_SIMULATION: process.env.SUTAR_SIMULATION || 'http://localhost:4241',
  SUTAR_GOAL: process.env.SUTAR_GOAL || 'http://localhost:4242',
  SUTAR_NETWORK: process.env.SUTAR_NETWORK || 'http://localhost:4243',
  SUTAR_MARKETPLACE: process.env.SUTAR_MARKETPLACE || 'http://localhost:4250',
  SUTAR_ECONOMY: process.env.SUTAR_ECONOMY || 'http://localhost:4251',
  SUTAR_POLICY: process.env.SUTAR_POLICY || 'http://localhost:4254',

  // ============================================
  // HOSPITALITY (StayOwn)
  // ============================================
  STAYOWN_API: process.env.STAYOWN_API || 'http://localhost:4801',
  STAYOWN_BOOKING: process.env.STAYOWN_BOOKING || 'http://localhost:4802',

  // ============================================
  // REAL ESTATE (RisnaEstate)
  // ============================================
  RISNAESTATE_API: process.env.RISNAESTATE_API || 'http://localhost:4901',
  RISNAESTATE_CRM: process.env.RISNAESTATE_CRM || 'http://localhost:4902',

  // ============================================
  // COMMERCE NETWORK (Nexha)
  // ============================================
  NEXHA_API: process.env.NEXHA_API || 'http://localhost:5001',
  NEXHA_FRANCHISE: process.env.NEXHA_FRANCHISE || 'http://localhost:5002',
  NEXHA_DISTRIBUTION: process.env.NEXHA_DISTRIBUTION || 'http://localhost:5003',

  // ============================================
  // VOICE AI (4760-4799)
  // ============================================
  VOICE_OS: process.env.VOICE_OS || 'http://localhost:4760',
  VOICE_AGENTS: process.env.VOICE_AGENTS || 'http://localhost:4780',

  // ============================================
  // COSMIC TWIN
  // ============================================
  COSMIC_TWIN: process.env.COSMIC_TWIN || 'http://localhost:4780',
} as const;

export type ServiceName = keyof typeof SERVICES;

// ============================================
// UNIFIED PROFILE TYPES
// ============================================

export interface UnifiedProfile {
  user_id: string;
  cdp: CDPProfile | null;
  profile: UserProfile | null;
  rfm: RFMScore | null;
  segments: string[];
  companies: string[];
}

export interface CDPProfile {
  user_id: string;
  email?: string;
  phone?: string;
  name?: string;
  lifetime_value: number;
  order_count: number;
  avg_order_value: number;
  last_order_date?: string;
  preferred_categories: string[];
  preferred_payment_method?: string;
}

export interface UserProfile {
  user_id: string;
  consumer_id?: string;
  merchant_id?: string;
  employee_id?: string;
  guest_id?: string;
  email?: string;
  phone?: string;
  name?: string;
  avatar?: string;
  addresses?: Address[];
  preferences?: UserPreferences;
}

export interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default?: boolean;
}

export interface UserPreferences {
  language: string;
  currency: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    whatsapp: boolean;
  };
  dietary_restrictions?: string[];
}

export interface RFMScore {
  user_id: string;
  recency_score: number; // 1-5
  frequency_score: number; // 1-5
  monetary_score: number; // 1-5
  total_score: number; // 3-15
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

// ============================================
// LOYALTY TYPES
// ============================================

export interface LoyaltyBalance {
  wallet_balance: number;
  karma_points: number;
  total_points: number;
  tier: string;
}

export interface KarmaPointsAward {
  user_id: string;
  company: string;
  points: number;
  action: string;
  reference?: string;
}

// ============================================
// COMMERCE TYPES
// ============================================

export interface CrossCompanyOrderItem {
  product_id: string;
  quantity: number;
  price: number;
  company: string;
}

export interface CrossCompanyOrder {
  user_id: string;
  company: string;
  items: CrossCompanyOrderItem[];
  payment_method: 'wallet' | 'upi' | 'card';
  total_amount?: number;
  status?: string;
  order_id?: string;
}

export interface RecommendationContext {
  location?: { lat: number; lng: number };
  time_of_day?: string;
  weather?: string;
  device?: string;
}

export interface Recommendations {
  products: ProductRecommendation[];
  services: ServiceRecommendation[];
  content: ContentRecommendation[];
}

export interface ProductRecommendation {
  product_id: string;
  name: string;
  price: number;
  image?: string;
  score: number;
  reason: string;
}

export interface ServiceRecommendation {
  service_id: string;
  name: string;
  price: number;
  provider?: string;
  score: number;
}

export interface ContentRecommendation {
  content_id: string;
  type: string;
  title: string;
  url?: string;
  score: number;
}

// ============================================
// HOSPITALITY TYPES
// ============================================

export interface HotelBooking {
  guest_id: string;
  hotel_id: string;
  room_type: string;
  check_in: string;
  check_out: string;
  use_karma?: boolean;
}

export interface HotelBookingResponse {
  booking_id: string;
  guest_id: string;
  hotel_id: string;
  room_type: string;
  check_in: string;
  check_out: string;
  total: number;
  status: string;
}

// ============================================
// QR TYPES
// ============================================

export type QRType = 'verify' | 'safe' | 'creator' | 'ads' | 'room';

export interface QRExperienceParams {
  qr_type: QRType;
  qr_id: string;
  user_id?: string;
  location?: { lat: number; lng: number };
}

export interface QRExperience {
  qr_data: unknown;
  personalization: unknown;
  fraud_score: FraudScore | null;
  recommendations: ProductRecommendation[];
  user_segments: string[];
}

export interface FraudScore {
  risk_level: 'low' | 'medium' | 'high';
  score: number;
  reasons?: string[];
}

// ============================================
// ADVERTISING TYPES
// ============================================

export type AdEventType = 'view' | 'click' | 'conversion';

export interface AdConversionParams {
  user_id: string;
  campaign_id: string;
  channel: string;
  event: AdEventType;
  value?: number;
}

export interface CampaignTargeting {
  segments?: string[];
  rfm_tiers?: string[];
  behaviors?: string[];
}

export interface CampaignCreateParams {
  name: string;
  targeting: CampaignTargeting;
  budget: number;
  channels: string[];
}

// ============================================
// EMPLOYEE TYPES
// ============================================

export interface EmployeeOnboardParams {
  employee_id: string;
  company: string;
  email: string;
  name: string;
  department: string;
  benefits_eligible: string[];
}

export interface EmployeeOnboardResponse {
  user_id: string;
  employee_id: string;
}

export interface EmployeeBenefits {
  benefits: string[];
  karma_points: number;
  available_perks: unknown[];
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

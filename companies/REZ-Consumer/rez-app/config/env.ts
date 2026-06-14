/**
 * Environment Configuration
 * Central place to manage all environment variables
 */

// Application Settings
export const APP_CONFIG = {
  name: process.env.EXPO_PUBLIC_APP_NAME || 'REZ App',
  version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
} as const;

// Production guard: EXPO_PUBLIC_API_BASE_URL must be the API gateway URL.
// All traffic routes through the gateway — never call the backend directly.
if (process.env.EXPO_PUBLIC_ENVIRONMENT === 'production') {
  if (!process.env.EXPO_PUBLIC_API_BASE_URL) {
    throw new Error('[config/env] FATAL: EXPO_PUBLIC_API_BASE_URL is not set in production.');
  }
}

// API Configuration
// SECURITY FIX: Removed localhost fallback in production. API_BASE_URL must be explicitly set.
export const API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || '',
  timeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000'),
  devUrl: process.env.EXPO_PUBLIC_DEV_API_URL || 'http://localhost:5001/api',
  prodUrl: process.env.EXPO_PUBLIC_PROD_API_URL || '',
} as const;

// API Endpoints - All routes through API Gateway
// INTEGRATION (2026-05-15): Complete ecosystem integration - RABTUL + REZ-Media + REZ-Intelligence + RTNM-Group + StayOwn
export const ENDPOINTS = {
  // RABTUL-Technologies Core (Infrastructure)
  auth: process.env.EXPO_PUBLIC_AUTH_ENDPOINT || '/user/auth',
  products: process.env.EXPO_PUBLIC_PRODUCTS_ENDPOINT || '/products',
  cart: process.env.EXPO_PUBLIC_CART_ENDPOINT || '/cart',
  categories: process.env.EXPO_PUBLIC_CATEGORIES_ENDPOINT || '/categories',
  stores: process.env.EXPO_PUBLIC_STORES_ENDPOINT || '/stores',
  orders: process.env.EXPO_PUBLIC_ORDERS_ENDPOINT || '/orders',
  videos: process.env.EXPO_PUBLIC_VIDEOS_ENDPOINT || '/videos',
  projects: process.env.EXPO_PUBLIC_PROJECTS_ENDPOINT || '/projects',
  notifications: process.env.EXPO_PUBLIC_NOTIFICATIONS_ENDPOINT || '/notifications',
  reviews: process.env.EXPO_PUBLIC_REVIEWS_ENDPOINT || '/reviews',
  wishlist: process.env.EXPO_PUBLIC_WISHLIST_ENDPOINT || '/wishlist',
  wallet: process.env.EXPO_PUBLIC_WALLET_ENDPOINT || '/wallet',
  payment: process.env.EXPO_PUBLIC_PAYMENT_ENDPOINT || '/payment',
  search: process.env.EXPO_PUBLIC_SEARCH_ENDPOINT || '/search',

  // RABTUL Service Direct URLs
  // Core Services
  delivery: process.env.EXPO_PUBLIC_DELIVERY_SERVICE_URL || 'https://rez-delivery-service.onrender.com',
  booking: process.env.EXPO_PUBLIC_BOOKING_SERVICE_URL || 'https://rez-booking-service.onrender.com',
  observability: process.env.EXPO_PUBLIC_OBSERVABILITY_URL || 'https://rez-observability.onrender.com',
  checkoutOptimization: process.env.EXPO_PUBLIC_CHECKOUT_URL || 'https://rez-checkout-optimization.onrender.com',
  // Extended Services
  workflowBuilder: process.env.EXPO_PUBLIC_WORKFLOW_BUILDER_URL || 'https://rez-workflow-builder.onrender.com',
  rfmPlus: process.env.EXPO_PUBLIC_RFM_PLUS_URL || 'https://rez-rfm-plus.onrender.com',
  logisticsAggregator: process.env.EXPO_PUBLIC_LOGISTICS_URL || 'https://rez-logistics-aggregator.onrender.com',
  woocommerceConnector: process.env.EXPO_PUBLIC_WOOCOMMERCE_URL || 'https://rez-woocommerce-connector.onrender.com',
  insights: process.env.EXPO_PUBLIC_INSIGHTS_URL || 'https://rez-insights-service.onrender.com',
  gamification: process.env.EXPO_PUBLIC_GAMIFICATION_URL || 'https://rez-gamification-service-3b5d.onrender.com',
  economicEngine: process.env.EXPO_PUBLIC_ECONOMIC_ENGINE_URL || 'https://rez-economic-engine.onrender.com',
  identityGraph: process.env.EXPO_PUBLIC_IDENTITY_GRAPH_URL || 'https://rez-identity-graph.onrender.com',
  circuitBreaker: process.env.EXPO_PUBLIC_CIRCUIT_BREAKER_URL || 'https://rez-circuit-breaker.onrender.com',
  idempotency: process.env.EXPO_PUBLIC_IDEMPOTENCY_URL || 'https://rez-idempotency-service.onrender.com',

  // REZ-Media Services (Marketing & Engagement)
  karma: process.env.EXPO_PUBLIC_KARMA_URL || 'https://karma-service.onrender.com',
  ads: process.env.EXPO_PUBLIC_ADS_URL || 'https://REZ-ads-service.onrender.com',
  engagement: process.env.EXPO_PUBLIC_ENGAGEMENT_URL || 'https://REZ-engagement-platform.onrender.com',
  attribution: process.env.EXPO_PUBLIC_ATTRIBUTION_URL || 'https://REZ-attribution-platform.onrender.com',
  supportToolsHub: process.env.EXPO_PUBLIC_SUPPORT_TOOLS_HUB_URL || 'https://REZ-support-tools-hub.onrender.com',
  crmHub: process.env.EXPO_PUBLIC_CRM_HUB_URL || 'https://REZ-crm-hub.onrender.com',
  whatsappCommerce: process.env.EXPO_PUBLIC_WHATSAPP_URL || 'https://reks-whatsapp-commerce.onrender.com',

  // REZ-Intelligence Services (AI & ML)
  intentGraph: process.env.EXPO_PUBLIC_INTENT_GRAPH_URL || 'https://rez-intent-graph.onrender.com',
  feedbackCollector: process.env.EXPO_PUBLIC_FEEDBACK_URL || 'https://REZ-feedback-collector.onrender.com',
  leadIntelligence: process.env.EXPO_PUBLIC_LEAD_URL || 'https://REZ-lead-intelligence.onrender.com',
  cdp: process.env.EXPO_PUBLIC_CDP_URL || 'https://REZ-cdp-service.onrender.com',
  personalization: process.env.EXPO_PUBLIC_PERSONALIZATION_URL || 'https://REZ-personalization-engine.onrender.com',
  recommendations: process.env.EXPO_PUBLIC_RECOMMENDATIONS_URL || 'https://REZ-recommendation-engine.onrender.com',

  // RTNM-Group Services (Core Platform)
  identityService: process.env.EXPO_PUBLIC_IDENTITY_SERVICE_URL || 'https://REZ-identity-service.onrender.com',
  permissions: process.env.EXPO_PUBLIC_PERMISSIONS_URL || 'https://REZ-central-permissions.onrender.com',
  capitalService: process.env.EXPO_PUBLIC_CAPITAL_URL || 'https://REZ-capital-service.onrender.com',
  supportDashboard: process.env.EXPO_PUBLIC_SUPPORT_DASHBOARD_URL || 'https://rez-support-dashboard.onrender.com',

  // StayOwn-Hospitality Services
  hotelOta: process.env.EXPO_PUBLIC_HOTEL_OTA_URL || 'https://hotel-ota-api.onrender.com',
  supportCopilot: process.env.EXPO_PUBLIC_SUPPORT_COPILOT_URL || 'https://REZ-support-copilot.onrender.com',
} as const;

// Authentication Settings
export const AUTH_CONFIG = {
  jwtStorageKey: process.env.EXPO_PUBLIC_JWT_STORAGE_KEY || 'rez_app_token',
  refreshTokenKey: process.env.EXPO_PUBLIC_REFRESH_TOKEN_KEY || 'rez_app_refresh_token',
  userDataKey: process.env.EXPO_PUBLIC_USER_DATA_KEY || 'rez_app_user',
  sessionTimeout: parseInt(process.env.EXPO_PUBLIC_SESSION_TIMEOUT || '1440'), // minutes
} as const;

// External Services
export const EXTERNAL_SERVICES = {
  googleMaps: {
    // DEPRECATED for geocoding: geocoding now routes through the backend proxy
    // (/location/geocode, /location/search) so the key is never exposed in the APK.
    // This key is still needed for native MapView rendering on the client side.
    apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  },
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  },
  payment: {
    razorpay: {
      keyId: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '',
    },
  },
  analytics: {
    googleAnalytics: process.env.EXPO_PUBLIC_GA_TRACKING_ID || '',
    sentry: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
    mixpanel: process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || '',
  },
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  enablePushNotifications: process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true',
  enableLocationServices: process.env.EXPO_PUBLIC_ENABLE_LOCATION_SERVICES === 'true',
  enableCameraFeatures: process.env.EXPO_PUBLIC_ENABLE_CAMERA_FEATURES === 'true',
  enableVideoUpload: process.env.EXPO_PUBLIC_ENABLE_VIDEO_UPLOAD === 'true',
  enableSocialSharing: process.env.EXPO_PUBLIC_ENABLE_SOCIAL_SHARING === 'true',
  enableOfflineMode: process.env.EXPO_PUBLIC_ENABLE_OFFLINE_MODE === 'true',
  enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableCrashReporting: process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING === 'true',
} as const;

// Media Configuration
// NOTE: For file upload limits and validation, use utils/fileUploadConstants.ts
// These values are kept for backward compatibility and can be overridden via env vars
export const MEDIA_CONFIG = {
  maxImageSize: parseInt(process.env.EXPO_PUBLIC_MAX_IMAGE_SIZE || '5242880'), // 5MB (matches fileUploadConstants)
  maxVideoSize: parseInt(process.env.EXPO_PUBLIC_MAX_VIDEO_SIZE || '52428800'), // 50MB (matches fileUploadConstants)
  allowedImageTypes: (process.env.EXPO_PUBLIC_ALLOWED_IMAGE_TYPES || 'jpg,jpeg,png,heic,heif').split(','), // Updated to match fileUploadConstants
  allowedVideoTypes: (process.env.EXPO_PUBLIC_ALLOWED_VIDEO_TYPES || 'mp4,mov,webm').split(','), // Updated to match fileUploadConstants
} as const;

// Development Settings
export const DEV_CONFIG = {
  debugMode: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
  mockApi: process.env.EXPO_PUBLIC_MOCK_API === 'true',
  logLevel: process.env.EXPO_PUBLIC_LOG_LEVEL || 'info',
  showDevTools: process.env.EXPO_PUBLIC_SHOW_DEV_TOOLS === 'true',
} as const;

// Business Configuration
export const BUSINESS_CONFIG = {
  support: {
    email: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@rezapp.com',
    phone: process.env.EXPO_PUBLIC_SUPPORT_PHONE || '+91-1234567890',
  },
  legal: {
    privacyPolicy: process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || 'https://www.rezapp.com/privacy',
    termsOfService: process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL || 'https://www.rezapp.com/terms',
    helpCenter: process.env.EXPO_PUBLIC_HELP_CENTER_URL || 'https://help.rezapp.com',
  },
  social: {
    facebook: process.env.EXPO_PUBLIC_FACEBOOK_URL || 'https://facebook.com/rezapp',
    instagram: process.env.EXPO_PUBLIC_INSTAGRAM_URL || 'https://instagram.com/rezapp',
    twitter: process.env.EXPO_PUBLIC_TWITTER_URL || 'https://twitter.com/rezapp',
  },
  app: {
    website: process.env.EXPO_PUBLIC_WEBSITE_URL || 'https://www.rezapp.com',
    appStore: process.env.EXPO_PUBLIC_APP_STORE_URL || 'https://apps.apple.com/search?term=rez+app',
    playStore: process.env.EXPO_PUBLIC_PLAY_STORE_URL || 'https://play.google.com/store/apps/details?id=com.rez.app',
    deepLinkScheme: process.env.EXPO_PUBLIC_DEEP_LINK_SCHEME || 'rezapp',
  },
} as const;

// Location & Maps
export const LOCATION_CONFIG = {
  defaultLatitude: parseFloat(process.env.EXPO_PUBLIC_DEFAULT_LATITUDE || '28.6139'),
  defaultLongitude: parseFloat(process.env.EXPO_PUBLIC_DEFAULT_LONGITUDE || '77.2090'),
  defaultCity: process.env.EXPO_PUBLIC_DEFAULT_CITY || 'Delhi',
  defaultCountry: process.env.EXPO_PUBLIC_DEFAULT_COUNTRY || 'India',
  mapZoomLevel: parseInt(process.env.EXPO_PUBLIC_MAP_ZOOM_LEVEL || '15'),
} as const;

// UI/UX Settings
export const UI_CONFIG = {
  defaultTheme: process.env.EXPO_PUBLIC_DEFAULT_THEME || 'light',
  enableDarkMode: process.env.EXPO_PUBLIC_ENABLE_DARK_MODE === 'true',
  animationDuration: parseInt(process.env.EXPO_PUBLIC_ANIMATION_DURATION || '300'),
  hapticFeedback: process.env.EXPO_PUBLIC_HAPTIC_FEEDBACK === 'true',
} as const;

// Caching Configuration
export const CACHE_CONFIG = {
  duration: parseInt(process.env.EXPO_PUBLIC_CACHE_DURATION || '300000'), // 5 minutes
  imageCacheDuration: parseInt(process.env.EXPO_PUBLIC_IMAGE_CACHE_DURATION || '86400000'), // 24 hours
  apiCacheDuration: parseInt(process.env.EXPO_PUBLIC_API_CACHE_DURATION || '60000'), // 1 minute
} as const;

// Helper function to check if we're in development
export const isDevelopment = () => APP_CONFIG.environment === 'development';
export const isProduction = () => APP_CONFIG.environment === 'production';

// SECURITY FIX: Validate API URL is configured in production
if (isProduction() && !API_CONFIG.baseUrl) {
  throw new Error('[env] FATAL: EXPO_PUBLIC_API_BASE_URL is not set in production. API calls will fail.');
}

// All traffic routes through the single API gateway.
// SECURITY FIX: No localhost fallback in production - require explicit configuration.
export const getApiUrl = () => {
  if (isDevelopment()) {
    return API_CONFIG.devUrl;
  }
  if (!API_CONFIG.baseUrl) {
    throw new Error('[env] FATAL: getApiUrl() called in production but API_CONFIG.baseUrl is not set.');
  }
  return API_CONFIG.baseUrl;
};

// Export all configs as a single object for easy access
export const ENV = {
  APP: APP_CONFIG,
  API: API_CONFIG,
  ENDPOINTS,
  AUTH: AUTH_CONFIG,
  EXTERNAL: EXTERNAL_SERVICES,
  FEATURES: FEATURE_FLAGS,
  MEDIA: MEDIA_CONFIG,
  DEV: DEV_CONFIG,
  BUSINESS: BUSINESS_CONFIG,
  LOCATION: LOCATION_CONFIG,
  UI: UI_CONFIG,
  CACHE: CACHE_CONFIG,
  isDevelopment,
  isProduction,
  getApiUrl,
} as const;

export default ENV;
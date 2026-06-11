/**
 * GLAMAI - Configuration Management
 * Salon AI Operating System
 *
 * All configuration values are managed here with environment variable support.
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ============================================
// SERVER CONFIGURATION
// ============================================

export const PORT = parseInt(process.env.PORT || '4860', 10);
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const HOST = process.env.HOST || '0.0.0.0';

// ============================================
// MONGODB CONFIGURATION
// ============================================

export const MONGODB_URI = process.env.MONGO_URL ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/glamai';

export const MONGODB_OPTIONS = {
  serverSelectionTimeoutMS: parseInt(process.env.MONGO_TIMEOUT || '5000', 10),
  socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT || '45000', 10),
  maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE || '10', 10),
};

// ============================================
// AUTHENTICATION CONFIGURATION
// ============================================

export const JWT_SECRET = process.env.JWT_SECRET || 'hojai-glamai-dev-secret-change-in-production';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_TOKEN ||
  process.env.INTERNAL_SERVICE_TOKEN ||
  'hojai-glamai-dev-token-change-in-production';

// ============================================
// SERVICE URLS (Ecosystem Integration)
// ============================================

export const SERVICES = {
  // HOJAI Core Services
  HOJAI_URL: process.env.HOJAI_URL || 'http://localhost:4800',
  HOJAI_ENTERPRISE_BRAIN: process.env.HOJAI_ENTERPRISE_BRAIN_URL || 'http://localhost:4600',

  // RABTUL Services
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
  WALLET_SERVICE_URL: process.env.WALLET_SERVICE_URL || 'http://localhost:4003',
  NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4095',

  // Webhook & Event Bus
  WEBHOOK_SERVICE_URL: process.env.WEBHOOK_SERVICE_URL || 'http://localhost:4090',
  EVENT_BUS_URL: process.env.EVENT_BUS_URL || 'http://localhost:4091',

  // REZ Intelligence
  REZ_MIND_URL: process.env.REZ_MIND_URL || 'http://localhost:4300',
  INTENT_GRAPH_URL: process.env.INTENT_GRAPH_URL || 'http://localhost:4301',
};

// ============================================
// RATE LIMITING CONFIGURATION
// ============================================

export const RATE_LIMITS = {
  // General API
  API: {
    windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_API_MAX || '100', 10),
  },
  // Authentication endpoints
  AUTH: {
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW || '60000', 10), // 1 minute
    max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '10', 10),
  },
  // AI endpoints (higher limits for AI processing)
  AI: {
    windowMs: parseInt(process.env.RATE_LIMIT_AI_WINDOW || '60000', 10), // 1 minute
    max: parseInt(process.env.RATE_LIMIT_AI_MAX || '30', 10),
  },
  // Strict limits for sensitive operations
  STRICT: {
    windowMs: parseInt(process.env.RATE_LIMIT_STRICT_WINDOW || '60000', 10), // 1 minute
    max: parseInt(process.env.RATE_LIMIT_STRICT_MAX || '5', 10),
  },
};

// ============================================
// CORS CONFIGURATION
// ============================================

export const CORS = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Internal-Token',
    'X-Request-ID',
    'X-API-Key',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// ============================================
// LOGGING CONFIGURATION
// ============================================

export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
export const LOG_DIR = process.env.LOG_DIR || 'logs';

// ============================================
// AI EMPLOYEE CONFIGURATION
// ============================================

export const AI_EMPLOYEES = {
  BEAUTY_ADVISOR: {
    id: 'beauty-advisor',
    name: 'Beauty Advisor AI',
    description: 'Product recommendations, styling tips, beauty consultations',
    capabilities: ['recommendations', 'styling-tips', 'product-matching', 'occasion-based'],
    maxRecommendations: 5,
  },
  APPOINTMENT_MANAGER: {
    id: 'appointment-manager',
    name: 'Appointment Manager AI',
    description: 'Scheduling, reminders, conflict resolution',
    capabilities: ['booking', 'rescheduling', 'reminders', 'cancellations', 'waitlist'],
    defaultSlotDuration: 30, // minutes
  },
  CAMPAIGN_AGENT: {
    id: 'campaign-agent',
    name: 'Campaign Agent AI',
    description: 'Marketing, offers, loyalty programs',
    capabilities: ['campaigns', 'promotions', 'loyalty-programs', 'targeting', 'segmentation'],
    campaignTypes: ['birthday', 'loyalty', 'promotion', 'winback', 'seasonal', 'referral'],
  },
  RETENTION_AGENT: {
    id: 'retention-agent',
    name: 'Retention Agent AI',
    description: 'Churn prevention, re-engagement, loyalty upgrades',
    capabilities: ['churn-analysis', 're-engagement', 'loyalty-upgrades', 'risk-scoring'],
    riskThresholds: {
      critical: 90,
      high: 60,
      medium: 30,
      low: 0,
    },
  },
};

// ============================================
// LOYALTY PROGRAM CONFIGURATION
// ============================================

export const LOYALTY = {
  TIERS: {
    bronze: {
      name: 'Bronze',
      minSpent: 0,
      discountPercent: 0,
      pointsMultiplier: 1,
      benefits: ['Base rewards', 'Birthday bonus'],
    },
    silver: {
      name: 'Silver',
      minSpent: 2000,
      discountPercent: 5,
      pointsMultiplier: 1.25,
      benefits: ['5% discount', 'Priority booking', 'Birthday bonus'],
    },
    gold: {
      name: 'Gold',
      minSpent: 5000,
      discountPercent: 10,
      pointsMultiplier: 1.5,
      benefits: ['10% discount', 'Priority booking', 'Free add-ons', 'Birthday bonus'],
    },
    platinum: {
      name: 'Platinum',
      minSpent: 10000,
      discountPercent: 15,
      pointsMultiplier: 2,
      benefits: ['15% discount', 'VIP treatment', 'Free premium services', 'Exclusive events'],
    },
  },
  POINTS_PER_RUPEE: 1, // 1 point per rupee spent
  REDEMPTION_RATE: 0.01, // 1 point = 0.01 rupee
  BIRTHDAY_BONUS: 500, // Bonus points on birthday
};

// ============================================
// SERVICE CATEGORIES
// ============================================

export const SERVICE_CATEGORIES = [
  'Hair',
  'Skin',
  'Nails',
  'Spa',
  'Massage',
  'Makeup',
  'Other',
] as const;

// ============================================
// OCCASION MAPPING
// ============================================

export const OCCASION_SERVICES: Record<string, string[]> = {
  wedding: ['Hair Coloring', 'Facial', 'Manicure', 'Pedicure', 'Makeup', 'Massage'],
  party: ['Makeup', 'Facial', 'Manicure', 'Hair Styling'],
  interview: ['Haircut', 'Facial'],
  date: ['Massage', 'Facial', 'Manicure'],
  graduation: ['Hair Styling', 'Makeup', 'Manicure'],
  regular: ['Haircut', 'Manicure', 'Pedicure'],
  anniversary: ['Spa', 'Massage', 'Facial'],
  festival: ['Hair Styling', 'Makeup', 'Nail Art'],
};

// ============================================
// BUSINESS HOURS
// ============================================

export const BUSINESS_HOURS = {
  start: process.env.BUSINESS_START || '09:00',
  end: process.env.BUSINESS_END || '21:00',
  slotInterval: parseInt(process.env.SLOT_INTERVAL || '30', 10), // minutes
  advanceBookingDays: parseInt(process.env.ADVANCE_BOOKING_DAYS || '30', 10),
  minCancellationHours: parseInt(process.env.MIN_CANCELLATION_HOURS || '2', 10),
};

// ============================================
// PREPARATION INSTRUCTIONS
// ============================================

export const PREP_INSTRUCTIONS: Record<string, string> = {
  Hair: 'Please wash your hair before coming and avoid using hair products.',
  Skin: 'Please remove any makeup and avoid new skincare products 24h before.',
  Nails: 'Please remove old nail polish if possible.',
  Spa: 'Arrive 15 minutes early. Avoid eating heavy meals.',
  Massage: 'Wear comfortable clothing. Stay hydrated before and after.',
  Makeup: 'Please come with a clean face. Avoid heavy moisturizers.',
  Other: 'Please arrive 10 minutes early for your appointment.',
};

// ============================================
// CAMPAIGN TEMPLATES
// ============================================

export const CAMPAIGN_TEMPLATES: Record<string, {
  type: string;
  discount: number;
  subject: string;
  message: string;
  bestTiming: string;
}> = {
  birthday: {
    type: 'birthday',
    discount: 20,
    subject: 'Happy Birthday! Special Gift for You',
    message: 'Happy Birthday! As our valued customer, enjoy a special birthday discount! Book now and celebrate in style.',
    bestTiming: 'Send 7 days before birthday',
  },
  loyalty: {
    type: 'loyalty',
    discount: 15,
    subject: 'Thank You for Being Loyal!',
    message: 'Thank you for being a loyal customer! Enjoy exclusive rewards and discounts on your next visit.',
    bestTiming: 'Send on the 1st of every month',
  },
  promotion: {
    type: 'promotion',
    discount: 10,
    subject: 'Special Offer Just for You!',
    message: 'We have an exciting offer for you! Avail a special discount on our premium services.',
    bestTiming: 'Send during off-peak hours (2PM-5PM)',
  },
  winback: {
    type: 'winback',
    discount: 25,
    subject: 'We Miss You!',
    message: "It's been a while since your last visit. Come back and enjoy an exclusive welcome-back discount!",
    bestTiming: 'Send on weekday evenings',
  },
  seasonal: {
    type: 'seasonal',
    discount: 15,
    subject: 'Seasonal Special Offer',
    message: 'Celebrate the season with special discounts on our most popular services!',
    bestTiming: 'Send 2 weeks before season starts',
  },
  referral: {
    type: 'referral',
    discount: 20,
    subject: 'Refer a Friend, Earn Rewards!',
    message: 'Share the love! Refer a friend and both of you get rewards on your next visit.',
    bestTiming: 'Send on weekends',
  },
};

// ============================================
// HEALTH CHECK CONFIGURATION
// ============================================

export const HEALTH_CHECK = {
  mongoTimeout: 5000,
  serviceTimeout: 3000,
  maxResponseTime: 100, // ms
};

// ============================================
// FEATURE FLAGS
// ============================================

export const FEATURES = {
  ENABLE_WEBHOOKS: process.env.ENABLE_WEBHOOKS !== 'false',
  ENABLE_HOJAI_SYNC: process.env.ENABLE_HOJAI_SYNC !== 'false',
  ENABLE_NOTIFICATIONS: process.env.ENABLE_NOTIFICATIONS !== 'false',
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS !== 'false',
  ENABLE_AUTO_UPGRADE: process.env.ENABLE_AUTO_UPGRADE === 'true',
  DEMO_MODE: process.env.DEMO_MODE === 'true',
};

// ============================================
// EXPORT ALL CONFIG
// ============================================

export default {
  PORT,
  NODE_ENV,
  HOST,
  MONGODB_URI,
  MONGODB_OPTIONS,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  INTERNAL_SERVICE_TOKEN,
  SERVICES,
  RATE_LIMITS,
  CORS,
  LOG_LEVEL,
  LOG_DIR,
  AI_EMPLOYEES,
  LOYALTY,
  SERVICE_CATEGORIES,
  OCCASION_SERVICES,
  BUSINESS_HOURS,
  PREP_INSTRUCTIONS,
  CAMPAIGN_TEMPLATES,
  HEALTH_CHECK,
  FEATURES,
};
/**
 * NEIGHBORAI - Configuration
 * Environment configuration and constants
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ============================================
// SERVER CONFIGURATION
// ============================================

export const CONFIG = {
  // Server
  PORT: parseInt(process.env.PORT || '4806', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/neighborai',
  MONGODB_OPTIONS: {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2
  },

  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'neighborai-super-secret-2024',
  JWT_EXPIRES_IN: '7d',

  // Security
  BCRYPT_ROUNDS: 12,
  INTERNAL_SERVICE_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || 'hojai-dev-token',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 100,
  AUTH_RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute
  AUTH_RATE_LIMIT_MAX: 10,

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_DIR: 'logs',
  LOG_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  LOG_MAX_FILES: 5,

  // External Services
  WEBHOOK_SERVICE_URL: process.env.WEBHOOK_SERVICE_URL || 'http://localhost:4090',
  HOJAI_URL: process.env.HOJAI_URL || 'http://localhost:4800',
  NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4095',

  // Maintenance Billing Defaults
  DEFAULT_MAINTENANCE_AMOUNT: 3000,
  WATER_CHARGES: 200,
  PARKING_CHARGES: 300,

  // Complaint SLA (in days)
  COMPLAINT_SLA: {
    urgent: 1,
    high: 3,
    medium: 7,
    low: 14
  },

  // Visitor Entry Code
  ENTRY_CODE_LENGTH: 6,

  // Pagination
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100
};

// ============================================
// SERVICE URLs
// ============================================

export const SERVICES = {
  // HOJAI Services
  HOJAI_CORE: process.env.HOJAI_URL || 'http://localhost:4800',
  HOJAI_ANALYTICS: process.env.HOJAI_ANALYTICS_URL || 'http://localhost:4604',

  // RABTUL Services
  RABTUL_AUTH: process.env.RABTUL_AUTH_URL || 'http://localhost:4000',
  RABTUL_WALLET: process.env.RABTUL_WALLET_URL || 'http://localhost:4002',
  RABTUL_NOTIFICATION: process.env.RABTUL_NOTIFICATION_URL || 'http://localhost:4095',

  // Webhook
  WEBHOOK: process.env.WEBHOOK_SERVICE_URL || 'http://localhost:4090',

  // REZ Ecosystem
  REZ_MIND: process.env.REZ_MIND_URL || 'http://localhost:4100',
  REZ_INTENT_GRAPH: process.env.REZ_INTENT_GRAPH_URL || 'http://localhost:4105'
};

// ============================================
// COMPLAINT CATEGORIES
// ============================================

export const COMPLAINT_CATEGORIES = [
  'maintenance',
  'plumbing',
  'electrical',
  'security',
  'cleanliness',
  'noise',
  'parking',
  'water',
  'lift',
  'common-area',
  'other'
];

// ============================================
// MAINTENANCE CATEGORIES
// ============================================

export const MAINTENANCE_CATEGORIES = [
  'monthly-maintenance',
  'water-charges',
  'parking-charges',
  'sinking-fund',
  'special-charges',
  'repair',
  'other'
];

// ============================================
// VISITOR PURPOSES
// ============================================

export const VISITOR_PURPOSES = [
  'family-visit',
  'friends-visit',
  'delivery',
  'cab-service',
  'relative-visit',
  'maintenance-staff',
  'guest',
  'other'
];

// ============================================
// USER ROLES
// ============================================

export const USER_ROLES = {
  ADMIN: 'admin',
  RESIDENT: 'resident',
  SECURITY: 'security'
};

// ============================================
// STATUS ENUMS
// ============================================

export const RESIDENT_STATUS = {
  OWNER: 'owner',
  TENANT: 'tenant'
};

export const VISITOR_STATUS = {
  PENDING: 'pending',
  CHECKED_IN: 'checked-in',
  CHECKED_OUT: 'checked-out',
  DENIED: 'denied'
};

export const COMPLAINT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

export const COMPLAINT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

export const MAINTENANCE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  PARTIAL: 'partial'
};

// ============================================
// AUTO-ASSIGNMENT MAPPING
// ============================================

export const COMPLAINT_AUTO_ASSIGNMENT: Record<string, string> = {
  maintenance: 'Maintenance Team',
  plumbing: 'Plumbing Team',
  electrical: 'Electrical Team',
  security: 'Security Team',
  cleanliness: 'Sanitation Team',
  noise: 'Society Committee',
  parking: 'Parking Committee',
  water: 'Plumbing Team',
  lift: 'Maintenance Team',
  'common-area': 'Society Committee',
  other: 'Society Committee'
};

// ============================================
// DEFAULT ADMIN CREDENTIALS
// ============================================

export const DEFAULT_ADMIN = {
  email: 'admin@neighborai.com',
  password: 'admin123'
};

// ============================================
// AI EMPLOYEES CONFIGURATION
// ============================================

export const AI_EMPLOYEES = {
  SOCIETY_MANAGER: {
    name: 'Society Manager AI',
    status: 'active',
    capabilities: ['Operations', 'Billing', 'Maintenance', 'Resident Directory'],
    description: 'Handles society operations, billing queries, and maintenance tracking'
  },
  VISITOR_AGENT: {
    name: 'Visitor Agent AI',
    status: 'active',
    capabilities: ['Pre-approval', 'Check-in', 'Check-out', 'Entry codes'],
    description: 'Manages visitor registration, approvals, and gate entry'
  },
  COMPLAINT_AGENT: {
    name: 'Complaint Agent AI',
    status: 'active',
    capabilities: ['Registration', 'Tracking', 'Escalation', 'Resolution'],
    description: 'Tracks complaints, monitors SLAs, and escalates issues'
  },
  COMMUNITY_AGENT: {
    name: 'Community Agent AI',
    status: 'active',
    capabilities: ['Event Planning', 'RSVP Management', 'Announcements', 'Analytics'],
    description: 'Coordinates community events and manages communications'
  }
};

// ============================================
// EXPORT ALL CONFIG
// ============================================

export default {
  CONFIG,
  SERVICES,
  COMPLAINT_CATEGORIES,
  MAINTENANCE_CATEGORIES,
  VISITOR_PURPOSES,
  USER_ROLES,
  RESIDENT_STATUS,
  VISITOR_STATUS,
  COMPLAINT_STATUS,
  COMPLAINT_PRIORITY,
  MAINTENANCE_STATUS,
  COMPLAINT_AUTO_ASSIGNMENT,
  DEFAULT_ADMIN,
  AI_EMPLOYEES
};

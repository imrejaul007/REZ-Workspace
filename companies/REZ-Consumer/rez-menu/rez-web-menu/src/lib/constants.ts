/**
 * Application Constants
 * Centralized magic numbers and configuration values
 */

// API Timeouts (in milliseconds)
export const API_TIMEOUT_MS = 10000
export const AI_TIMEOUT_MS = 8000
export const SEARCH_DEBOUNCE_MS = 300
export const SEARCH_MIN_LENGTH = 2
export const SEARCH_MAX_LENGTH = 100

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// Cart
export const CART_RECOVERY_CHECK_KEY = 'cart_recovery_shown'
export const CART_ABANDON_TIMEOUT_MINUTES = 30

// UI
export const SKELETON_ITEMS_COUNT = 6
export const TRENDING_ITEMS_LIMIT = 5
export const SEARCH_RESULTS_LIMIT = 10
export const RECENT_ITEMS_SHOWN = 3

// Validation
export const PHONE_MIN_LENGTH = 10
export const PHONE_MAX_LENGTH = 15
export const OTP_LENGTH = 6
export const NAME_MIN_LENGTH = 2
export const NAME_MAX_LENGTH = 100

// Bundle Builder
export const BUNDLE_DISCOUNT_PERCENT = 15
export const SIDES_MAX_SELECTIONS = 2

// Dietary Tags
export const DIETARY_TAGS = [
  'vegan',
  'vegetarian',
  'non-veg',
  'gluten-free',
  'lactose-free',
  'halal',
  'jain',
  'low-carb',
  'keto',
  'organic',
] as const

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
} as const

// Scarcity Status
export const SCARCITY_STATUS = {
  AVAILABLE: 'available',
  LOW: 'low',
  SCARCE: 'scarce',
  SOLDOUT: 'soldout',
} as const

export default {
  API_TIMEOUT_MS,
  AI_TIMEOUT_MS,
  SEARCH_DEBOUNCE_MS,
  SEARCH_MIN_LENGTH,
  SEARCH_MAX_LENGTH,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  SKELETON_ITEMS_COUNT,
  TRENDING_ITEMS_LIMIT,
  SEARCH_RESULTS_LIMIT,
  RECENT_ITEMS_SHOWN,
  BUNDLE_DISCOUNT_PERCENT,
  SIDES_MAX_SELECTIONS,
  DIETARY_TAGS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  SCARCITY_STATUS,
}

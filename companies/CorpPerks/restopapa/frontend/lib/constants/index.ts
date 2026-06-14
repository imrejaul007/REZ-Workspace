// Application constants

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh',
  
  // User management
  USER_PROFILE: '/api/user/profile',
  UPDATE_PROFILE: '/api/user/update',
  
  // Marketplace
  PRODUCTS: '/api/marketplace/products',
  PRODUCT_DETAILS: (id: string) => `/api/marketplace/products/${id}`,
  VENDORS: '/api/marketplace/vendors',
  VENDOR_DETAILS: (id: string) => `/api/marketplace/vendors/${id}`,
  CATEGORIES: '/api/marketplace/categories',
  
  // Cart & Orders
  CART: '/api/marketplace/cart',
  ADD_TO_CART: '/api/marketplace/cart/add',
  UPDATE_CART: '/api/marketplace/cart/update',
  REMOVE_FROM_CART: '/api/marketplace/cart/remove',
  CHECKOUT: '/api/marketplace/checkout',
  ORDERS: '/api/marketplace/orders',
  ORDER_DETAILS: (id: string) => `/api/marketplace/orders/${id}`,
  
  // Jobs
  JOBS: '/api/jobs',
  JOB_DETAILS: (id: string) => `/api/jobs/${id}`,
  JOB_APPLICATIONS: '/api/jobs/applications',
  CREATE_JOB: '/api/jobs/create',
  
  // Payments
  PAYMENT_METHODS: '/api/payments/methods',
  PROCESS_PAYMENT: '/api/payments/process',
  PAYMENT_STATUS: (id: string) => `/api/payments/${id}/status`,
  
  // Credit system
  CREDIT_ACCOUNT: '/api/credit/account',
  APPLY_CREDIT: '/api/credit/apply',
  CREDIT_TRANSACTIONS: '/api/credit/transactions',
  
  // Reviews
  REVIEWS: '/api/reviews',
  ADD_REVIEW: '/api/reviews/add',
  PRODUCT_REVIEWS: (productId: string) => `/api/reviews/product/${productId}`,
  
  // Admin
  ADMIN_DASHBOARD: '/api/admin/dashboard',
  ADMIN_USERS: '/api/admin/users',
  ADMIN_ORDERS: '/api/admin/orders',
  ADMIN_VENDORS: '/api/admin/vendors'
} as const

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  PRODUCTS_PER_PAGE: 12,
  JOBS_PER_PAGE: 15,
  ORDERS_PER_PAGE: 10
} as const

export const VALIDATION_LIMITS = {
  // Text fields
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 1000,
  MIN_ADDRESS_LENGTH: 5,
  MAX_ADDRESS_LENGTH: 200,
  
  // Numbers
  MIN_PRICE: 0,
  MAX_PRICE: 1000000,
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 10000,
  MIN_RATING: 1,
  MAX_RATING: 5,
  
  // Business
  GST_LENGTH: 15,
  FSSAI_LENGTH: 14,
  PINCODE_LENGTH: 6,
  PHONE_LENGTH: 10,
  
  // Files
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png']
} as const

export const USER_ROLES = {
  ADMIN: 'admin',
  RESTAURANT_OWNER: 'restaurant_owner',
  EMPLOYEE: 'employee',
  VENDOR: 'vendor'
} as const

export const ORDER_STATUS = {
  PLACED: 'placed',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned'
} as const

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIAL: 'partial'
} as const

export const PAYMENT_METHODS = {
  UPI: 'upi',
  NET_BANKING: 'netbanking',
  CARD: 'card',
  WALLET: 'wallet',
  COD: 'cod',
  CREDIT: 'credit'
} as const

export const JOB_TYPES = {
  FULL_TIME: 'full-time',
  PART_TIME: 'part-time',
  CONTRACT: 'contract',
  INTERNSHIP: 'internship'
} as const

export const LOCATION_TYPES = {
  ON_SITE: 'on-site',
  REMOTE: 'remote',
  HYBRID: 'hybrid'
} as const

export const EXPERIENCE_LEVELS = {
  ENTRY: 'entry',
  MID: 'mid',
  SENIOR: 'senior',
  LEAD: 'lead'
} as const

export const PRODUCT_CATEGORIES = {
  VEGETABLES: 'vegetables',
  FRUITS: 'fruits',
  GRAINS: 'grains',
  DAIRY: 'dairy',
  MEAT: 'meat',
  SPICES: 'spices',
  OILS: 'oils',
  BEVERAGES: 'beverages',
  EQUIPMENT: 'equipment',
  PACKAGING: 'packaging'
} as const

export const VENDOR_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING_VERIFICATION: 'pending_verification'
} as const

export const CREDIT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  CLOSED: 'closed'
} as const

export const NOTIFICATION_TYPES = {
  ORDER_UPDATE: 'order_update',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  JOB_APPLICATION: 'job_application',
  CREDIT_APPROVED: 'credit_approved',
  CREDIT_DUE: 'credit_due',
  VENDOR_MESSAGE: 'vendor_message',
  SYSTEM_MAINTENANCE: 'system_maintenance'
} as const

export const LOCAL_STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PROFILE: 'user_profile',
  CART_ITEMS: 'cart_items',
  WISHLIST: 'wishlist',
  SEARCH_HISTORY: 'search_history',
  FILTER_PREFERENCES: 'filter_preferences',
  THEME_PREFERENCE: 'theme_preference'
} as const

export const SESSION_STORAGE_KEYS = {
  CHECKOUT_DATA: 'checkout_data',
  JOB_APPLICATION_DRAFT: 'job_application_draft',
  FORM_DRAFT: 'form_draft'
} as const

export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  RATE_LIMIT: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 60000 // 1 minute
  }
} as const

export const IMAGE_SIZES = {
  THUMBNAIL: { width: 100, height: 100 },
  SMALL: { width: 200, height: 200 },
  MEDIUM: { width: 400, height: 400 },
  LARGE: { width: 800, height: 600 },
  BANNER: { width: 1200, height: 400 }
} as const

export const CURRENCY = {
  SYMBOL: '₹',
  CODE: 'INR',
  DECIMAL_PLACES: 2
} as const

export const DATE_FORMATS = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  TIME: 'HH:mm',
  DATETIME: 'MMM dd, yyyy HH:mm',
  ISO: 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\''
} as const

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+91)?[6-9]\d{9}$/,
  GST: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  FSSAI: /^\d{14}$/,
  PINCODE: /^\d{6}$/,
  IFSC: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
} as const

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input.',
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You don\'t have permission for this action.',
  NOT_FOUND: 'Resource not found.',
  RATE_LIMITED: 'Too many requests. Please try again later.',
  FILE_TOO_LARGE: 'File size exceeds the limit.',
  INVALID_FILE_TYPE: 'Invalid file type.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  WEAK_PASSWORD: 'Password must be at least 8 characters with letters and numbers.'
} as const

export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully',
  ORDER_PLACED: 'Order placed successfully',
  PAYMENT_SUCCESS: 'Payment completed successfully',
  JOB_APPLIED: 'Job application submitted successfully',
  REVIEW_ADDED: 'Review added successfully',
  ITEM_ADDED_TO_CART: 'Item added to cart',
  ITEM_REMOVED_FROM_CART: 'Item removed from cart',
  VENDOR_CONTACTED: 'Message sent to vendor successfully'
} as const
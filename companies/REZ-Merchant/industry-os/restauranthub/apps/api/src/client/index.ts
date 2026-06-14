// Main client exports
export { RestoPapaApiClient, createApiClient, getApiClient } from './api-client';
export { RestoPapaSocketClient, createSocketClient, getSocketClient } from './socket-client';

// Type exports
export * from './types';

// React hooks (if using React)
export * from './react-hooks';

// Vue composables (if using Vue)
// export * from './vue-composables'; // Disabled for now due to missing vue dependency

// Default configuration
export const DEFAULT_CONFIG = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  version: 'v1',
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
};

// Utility functions
export const createFullApiUrl = (baseURL: string, version: string = 'v1') => {
  return `${baseURL.replace(/\/$/, '')}/api/${version}`;
};

export interface ApiError {
  statusCode?: number;
  message?: string;
}

export const isApiError = (error: unknown): error is ApiError => {
  return error !== null && typeof error === 'object' && typeof (error as ApiError).statusCode === 'number';
};

export const formatApiError = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message || `API Error: ${error.statusCode}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error occurred';
};

// Constants
export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: '/auth/signup',
    SIGNIN: '/auth/signin',
    SIGNOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
    UPLOAD_AVATAR: '/users/avatar',
  },
  RESTAURANTS: {
    BASE: '/restaurants',
    BY_ID: (id: string) => `/restaurants/${id}`,
    MENUS: (id: string) => `/restaurants/${id}/menus`,
    MENU_BY_ID: (restaurantId: string, menuId: string) => `/restaurants/${restaurantId}/menus/${menuId}`,
    ANALYTICS: (id: string) => `/restaurants/${id}/analytics`,
  },
  ORDERS: {
    BASE: '/orders',
    BY_ID: (id: string) => `/orders/${id}`,
    STATUS: (id: string) => `/orders/${id}/status`,
    CANCEL: (id: string) => `/orders/${id}/cancel`,
  },
  PAYMENTS: {
    STRIPE_INTENT: '/payments/stripe/create-intent',
    STRIPE_CONFIRM: (id: string) => `/payments/stripe/confirm/${id}`,
    RAZORPAY_ORDER: '/payments/razorpay/create-order',
    RAZORPAY_VERIFY: '/payments/razorpay/verify',
  },
  FILES: {
    UPLOAD: '/files/upload',
    UPLOAD_MULTIPLE: '/files/upload-multiple',
    DELETE: (id: string) => `/files/${id}`,
  },
  SEARCH: {
    GLOBAL: '/search/global',
    RESTAURANTS: '/search/restaurants',
    PRODUCTS: '/search/products',
    SUGGESTIONS: '/search/suggestions',
  },
  ANALYTICS: {
    BUSINESS: '/analytics/business/metrics',
    DATABASE: '/analytics/database/metrics',
    REVENUE: '/analytics/revenue',
  },
  JOBS: {
    BASE: '/jobs',
    BY_ID: (id: string) => `/jobs/${id}`,
    APPLY: (id: string) => `/jobs/${id}/apply`,
    APPLICATIONS: '/jobs/applications',
  },
  PRODUCTS: {
    BASE: '/products',
    BY_ID: (id: string) => `/products/${id}`,
    BY_VENDOR: (vendorId: string) => `/vendors/${vendorId}/products`,
  },
  VENDOR_ORDERS: {
    BASE: '/vendor-orders',
    BY_ID: (id: string) => `/vendor-orders/${id}`,
    BY_VENDOR: (vendorId: string) => `/vendors/${vendorId}/orders`,
  },
  HEALTH: {
    CHECK: '/health',
    DETAILED: '/health/detailed',
    READY: '/health/ready',
    LIVE: '/health/live',
  },
} as const;

// Socket event constants
export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT: 'reconnect',
  
  // Authentication
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',
  AUTH_ERROR: 'authError',
  
  // Orders
  ORDER_UPDATE: 'orderUpdate',
  ORDER_STATUS_CHANGE: 'orderStatusChange',
  NEW_ORDER: 'newOrder',
  SUBSCRIBE_TO_ORDERS: 'subscribeToOrders',
  UNSUBSCRIBE_FROM_ORDERS: 'unsubscribeFromOrders',
  JOIN_ORDER_ROOM: 'joinOrderRoom',
  LEAVE_ORDER_ROOM: 'leaveOrderRoom',
  
  // Kitchen
  KITCHEN_ORDER_UPDATE: 'kitchenOrderUpdate',
  SUBSCRIBE_TO_KITCHEN: 'subscribeToKitchen',
  
  // Restaurant
  RESTAURANT_STATUS_UPDATE: 'restaurantStatusUpdate',
  MENU_ITEM_UPDATE: 'menuItemUpdate',
  JOIN_RESTAURANT_ROOM: 'joinRestaurantRoom',
  LEAVE_RESTAURANT_ROOM: 'leaveRestaurantRoom',
  
  // Messaging
  SEND_MESSAGE: 'sendMessage',
  NEW_MESSAGE: 'newMessage',
  SUBSCRIBE_TO_MESSAGES: 'subscribeToMessages',
  
  // Notifications
  NOTIFICATION: 'notification',
  SUBSCRIBE_TO_NOTIFICATIONS: 'subscribeToNotifications',
  MARK_NOTIFICATION_READ: 'markNotificationRead',
  
  // Driver tracking
  DRIVER_LOCATION_UPDATE: 'driverLocationUpdate',
  TRACK_DRIVER: 'trackDriver',
  
  // Payments
  PAYMENT_UPDATE: 'paymentUpdate',
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// Error codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;
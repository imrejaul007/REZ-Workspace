/**
 * Service URLs Configuration
 * All internal service endpoints
 */

export const SERVICE_URLS = {
  // Restaurant Services
  POS_SERVICE: process.env.POS_SERVICE_URL || 'http://localhost:4081',
  MENU_SERVICE: process.env.MENU_SERVICE_URL || 'http://localhost:4030',
  KDS_SERVICE: process.env.KDS_SERVICE_URL || 'http://localhost:4006',
  STAFF_SERVICE: process.env.STAFF_SERVICE_URL || 'http://localhost:4005',
  TABLE_BOOKING: process.env.TABLE_BOOKING_URL || 'http://localhost:4007',
  WAITLIST_SERVICE: process.env.WAITLIST_SERVICE_URL || 'http://localhost:4008',
  FOOD_DELIVERY: process.env.FOOD_DELIVERY_URL || 'http://localhost:4009',
  INVOICE_SERVICE: process.env.INVOICE_SERVICE_URL || 'http://localhost:4028',
  PROCUREMENT_SERVICE: process.env.PROCUREMENT_SERVICE_URL || 'http://localhost:4083',

  // RABTUL Platform Services
  AUTH_SERVICE: process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com',
  PAYMENT_SERVICE: process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com',
  WALLET_SERVICE: process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service.onrender.com',
  NOTIFICATIONS_SERVICE: process.env.NOTIFICATIONS_SERVICE_URL || 'https://rez-notifications-service.onrender.com',
  ANALYTICS_SERVICE: process.env.ANALYTICS_SERVICE_URL || 'https://rez-analytics-service.onrender.com',

  // Internal Service Token
  INTERNAL_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || '',
};

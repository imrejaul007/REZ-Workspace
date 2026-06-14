/**
 * RABTUL API Client Library
 * Centralized service for all RABTUL shared services
 *
 * Services: Auth, Payment, Order, Catalog, Search, Wallet, Profile, Notification
 */

import type {
  MenuItem,
  Category,
  User,
  Order,
  PaymentResult,
  WalletBalance,
  SearchResult,
  DietaryPreference,
  NotificationPayload,
} from './types'
import { logger } from '@/lib/logger'
import { API_TIMEOUT_MS } from '@/lib/constants'

// ============================================================
// CONFIGURATION
// ============================================================

interface RABTULServiceConfig {
  auth: string
  payment: string
  order: string
  catalog: string
  search: string
  wallet: string
  profile: string
  notification: string
  booking: string
}

function getRABTULServices(): RABTULServiceConfig {
  const services: RABTULServiceConfig = {
    auth: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || '',
    payment: process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || '',
    order: process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || '',
    catalog: process.env.NEXT_PUBLIC_CATALOG_SERVICE_URL || '',
    search: process.env.NEXT_PUBLIC_SEARCH_SERVICE_URL || '',
    wallet: process.env.NEXT_PUBLIC_WALLET_SERVICE_URL || '',
    profile: process.env.NEXT_PUBLIC_PROFILE_SERVICE_URL || '',
    notification: process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || '',
    booking: process.env.NEXT_PUBLIC_BOOKING_SERVICE_URL || '',
  }

  // Validate required services
  const missingServices = Object.entries(services)
    .filter(([, url]) => !url)
    .map(([name]) => name)

  if (missingServices.length > 0) {
    logger.warn('Missing service configuration', { services: missingServices })
  }

  return services
}

const RABTUL_SERVICES = getRABTULServices()
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || ''

// ============================================================
// TYPES
// ============================================================

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

interface MenuFilters {
  category?: string
  dietary?: string[]
  priceMin?: number
  priceMax?: number
  search?: string
  storeSlug?: string
}

// ============================================================
// HTTP CLIENT
// ============================================================

type ServiceKey = keyof typeof RABTUL_SERVICES

async function fetchApi<T>(
  service: ServiceKey,
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const baseUrl = RABTUL_SERVICES[service]

  if (!baseUrl) {
    return {
      success: false,
      error: `Service ${String(service)} not configured. Set NEXT_PUBLIC_${String(service).toUpperCase()}_SERVICE_URL`,
    }
  }

  const url = `${baseUrl}${endpoint}`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(INTERNAL_TOKEN && { 'X-Internal-Token': INTERNAL_TOKEN }),
        ...options.headers,
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timeout' }
      }
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Unknown error' }
  }
}

// ============================================================
// AUTH SERVICE (Port 4002)
// ============================================================

export const AuthService = {
  /**
   * Send OTP to phone number
   */
  async sendOtp(phone: string): Promise<ApiResponse<{ message: string }>> {
    return fetchApi('auth', '/user/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    })
  },

  /**
   * Verify OTP and get tokens
   */
  async verifyOtp(
    phone: string,
    otp: string
  ): Promise<ApiResponse<{ accessToken: string; refreshToken: string; user: User }>> {
    return fetchApi('auth', '/user/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    })
  },

  /**
   * Get current user profile
   */
  async getMe(token: string): Promise<ApiResponse<User>> {
    return fetchApi('auth', '/user/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  /**
   * Refresh access token
   */
  async refreshToken(
    refreshToken: string
  ): Promise<ApiResponse<{ accessToken: string }>> {
    return fetchApi('auth', '/user/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  },

  /**
   * Logout (invalidate session)
   */
  async logout(token: string): Promise<ApiResponse<{ message: string }>> {
    return fetchApi('auth', '/user/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  /**
   * OAuth login (Google, Facebook)
   */
  async oauthLogin(
    provider: 'google' | 'facebook',
    token: string
  ): Promise<ApiResponse<{ accessToken: string; user: User }>> {
    return fetchApi('auth', '/user/auth/oauth', {
      method: 'POST',
      body: JSON.stringify({ provider, token }),
    })
  },
}

// ============================================================
// CATALOG SERVICE (Port 4007)
// ============================================================

export const CatalogService = {
  /**
   * Get all products (menu items)
   */
  async getProducts(
    storeSlug: string,
    filters?: MenuFilters,
    pagination?: PaginationParams
  ): Promise<ApiResponse<{ items: MenuItem[]; total: number; page: number }>> {
    const params = new URLSearchParams()
    if (storeSlug) params.set('storeSlug', storeSlug)
    if (filters?.category) params.set('category', filters.category)
    if (filters?.search) params.set('search', filters.search)
    if (filters?.priceMin) params.set('priceMin', String(filters.priceMin))
    if (filters?.priceMax) params.set('priceMax', String(filters.priceMax))
    if (pagination?.page) params.set('page', String(pagination.page))
    if (pagination?.limit) params.set('limit', String(pagination.limit))

    return fetchApi('catalog', `/products?${params.toString()}`, { method: 'GET' })
  },

  /**
   * Get single product by ID
   */
  async getProduct(productId: string): Promise<ApiResponse<MenuItem>> {
    return fetchApi('catalog', `/products/${productId}`, { method: 'GET' })
  },

  /**
   * Get product stock status
   */
  async getProductStock(
    productId: string
  ): Promise<ApiResponse<{ quantity: number; available: boolean }>> {
    return fetchApi('catalog', `/products/${productId}/stock`, { method: 'GET' })
  },

  /**
   * Get all categories
   */
  async getCategories(
    storeSlug?: string
  ): Promise<ApiResponse<{ categories: Category[] }>> {
    const params = storeSlug ? `?storeSlug=${storeSlug}` : ''
    return fetchApi('catalog', `/categories${params}`, { method: 'GET' })
  },

  /**
   * Search products with filters
   */
  async searchProducts(
    query: string,
    filters?: MenuFilters
  ): Promise<ApiResponse<{ items: MenuItem[] }>> {
    const params = new URLSearchParams({ q: query })
    if (filters?.category) params.set('category', filters.category)
    if (filters?.dietary?.length) params.set('dietary', filters.dietary.join(','))

    return fetchApi('catalog', `/products/search?${params.toString()}`, { method: 'GET' })
  },
}

// ============================================================
// ORDER SERVICE (Port 4006)
// ============================================================

export const OrderService = {
  /**
   * Create new order
   */
  async createOrder(
    orderData: {
      storeSlug: string
      items: Array<{ productId: string; quantity: number; customizations?: Record<string, string> }>
      deliveryAddress?: {
        address: string
        city: string
        pincode: string
        coordinates?: { lat: number; lng: number }
      }
      scheduledTime?: string
      notes?: string
    },
    token: string
  ): Promise<ApiResponse<{ orderId: string; order: Order }>> {
    return fetchApi('order', '/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(orderData),
    })
  },

  /**
   * Get user orders
   */
  async getOrders(
    token: string,
    pagination?: PaginationParams
  ): Promise<ApiResponse<{ orders: Order[]; total: number }>> {
    const params = new URLSearchParams()
    if (pagination?.page) params.set('page', String(pagination.page))
    if (pagination?.limit) params.set('limit', String(pagination.limit))

    return fetchApi('order', `/orders?${params.toString()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  /**
   * Get order by ID
   */
  async getOrder(orderId: string, token: string): Promise<ApiResponse<Order>> {
    return fetchApi('order', `/orders/${orderId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  /**
   * Update order (modify items)
   */
  async updateOrder(
    orderId: string,
    updates: Partial<Order>,
    token: string
  ): Promise<ApiResponse<Order>> {
    return fetchApi('order', `/orders/${orderId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    })
  },

  /**
   * Cancel order
   */
  async cancelOrder(
    orderId: string,
    token: string,
    reason?: string
  ): Promise<ApiResponse<{ message: string }>> {
    return fetchApi('order', `/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason }),
    })
  },

  /**
   * Reorder (duplicate previous order)
   */
  async reorder(orderId: string, token: string): Promise<ApiResponse<{ orderId: string }>> {
    return fetchApi('order', `/orders/${orderId}/reorder`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}

// ============================================================
// PAYMENT SERVICE (Port 4001)
// ============================================================

export const PaymentService = {
  /**
   * Initiate payment (create Razorpay order)
   */
  async initiatePayment(
    paymentData: {
      orderId: string
      amount: number // in paise
      currency?: string
      method?: 'upi' | 'card' | 'wallet' | 'netbanking'
    },
    token: string
  ): Promise<ApiResponse<PaymentResult>> {
    return fetchApi('payment', '/payment/initiate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(paymentData),
    })
  },

  /**
   * Verify payment signature
   */
  async verifyPayment(
    verificationData: {
      razorpay_order_id: string
      razorpay_payment_id: string
      razorpay_signature: string
    },
    token: string
  ): Promise<ApiResponse<{ verified: boolean }>> {
    return fetchApi('payment', '/payment/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(verificationData),
    })
  },

  /**
   * Get payment details
   */
  async getPayment(paymentId: string, token: string): Promise<ApiResponse<PaymentResult>> {
    return fetchApi('payment', `/payment/${paymentId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  /**
   * Request refund
   */
  async requestRefund(
    paymentId: string,
    token: string,
    amount?: number,
    reason?: string
  ): Promise<ApiResponse<{ refundId: string }>> {
    return fetchApi('payment', '/payment/refund', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paymentId, amount, reason }),
    })
  },

  /**
   * Generate payment link
   */
  async createPaymentLink(
    linkData: {
      amount: number
      purpose: string
      buyerPhone: string
      expireBy?: number
    },
    token: string
  ): Promise<ApiResponse<{ shortUrl: string; paymentLinkId: string }>> {
    return fetchApi('payment', '/payment/link', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(linkData),
    })
  },
}

// ============================================================
// WALLET SERVICE (Port 4004)
// ============================================================

export const WalletService = {
  /**
   * Get wallet balance
   */
  async getBalance(token: string): Promise<ApiResponse<WalletBalance>> {
    return fetchApi('wallet', '/wallet/balance', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  /**
   * Get transaction history
   */
  async getTransactions(
    token: string,
    pagination?: PaginationParams
  ): Promise<ApiResponse<{ transactions: Array<{
    id: string
    type: 'credit' | 'debit'
    amount: number
    description: string
    createdAt: string
  }>; total: number }>> {
    const params = new URLSearchParams()
    if (pagination?.page) params.set('page', String(pagination.page))
    if (pagination?.limit) params.set('limit', String(pagination.limit))

    return fetchApi('wallet', `/wallet/transactions?${params.toString()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  /**
   * Withdraw to bank
   */
  async withdrawToBank(
    amount: number,
    token: string
  ): Promise<ApiResponse<{ transactionId: string }>> {
    return fetchApi('wallet', '/wallet/withdraw', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount }),
    })
  },

  /**
   * Add reward to wallet (admin/internal)
   */
  async addReward(
    userId: string,
    amount: number,
    reason: string,
    token: string
  ): Promise<ApiResponse<{ transactionId: string }>> {
    return fetchApi('wallet', '/wallet/reward', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, amount, reason }),
    })
  },
}

// ============================================================
// SEARCH SERVICE (Port 4008)
// ============================================================

export const SearchService = {
  /**
   * Full-text search
   */
  async search(
    query: string,
    options?: {
      filters?: Record<string, string | string[]>
      location?: { lat: number; lng: number; radius?: number }
      limit?: number
    }
  ): Promise<ApiResponse<SearchResult>> {
    const params = new URLSearchParams({ q: query })
    if (options?.limit) params.set('limit', String(options.limit))

    return fetchApi('search', `/search?${params.toString()}`, {
      method: 'GET',
    })
  },

  /**
   * Autocomplete suggestions
   */
  async suggest(query: string): Promise<ApiResponse<{ suggestions: string[] }>> {
    return fetchApi('search', `/search/suggest?q=${encodeURIComponent(query)}`, {
      method: 'GET',
    })
  },

  /**
   * Get trending searches
   */
  async getTrending(
    location?: { lat: number; lng: number }
  ): Promise<ApiResponse<{ trends: Array<{ query: string; count: number }> }>> {
    const params = location ? `?lat=${location.lat}&lng=${location.lng}` : ''
    return fetchApi('search', `/search/trending${params}`, { method: 'GET' })
  },
}

// ============================================================
// PROFILE SERVICE (Port 4013)
// ============================================================

export const ProfileService = {
  /**
   * Get user profile
   */
  async getProfile(token: string): Promise<ApiResponse<User>> {
    return fetchApi('profile', '/profiles/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  /**
   * Update profile
   */
  async updateProfile(
    updates: Partial<User>,
    token: string
  ): Promise<ApiResponse<User>> {
    return fetchApi('profile', '/profiles/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    })
  },

  /**
   * Get saved addresses
   */
  async getAddresses(
    token: string
  ): Promise<ApiResponse<{ addresses: Array<{
    id: string
    label: string
    address: string
    city: string
    pincode: string
    coordinates?: { lat: number; lng: number }
    isDefault: boolean
  }> }>> {
    return fetchApi('profile', '/profiles/me/addresses', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  /**
   * Add address
   */
  async addAddress(
    address: {
      label: string
      address: string
      city: string
      pincode: string
      coordinates?: { lat: number; lng: number }
      isDefault?: boolean
    },
    token: string
  ): Promise<ApiResponse<{ addressId: string }>> {
    return fetchApi('profile', '/profiles/me/addresses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(address),
    })
  },

  /**
   * Get dietary preferences
   */
  async getDietaryPreferences(
    token: string
  ): Promise<ApiResponse<{ preferences: DietaryPreference[] }>> {
    return fetchApi('profile', '/profiles/me/dietary', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  /**
   * Update dietary preferences
   */
  async updateDietaryPreferences(
    preferences: DietaryPreference[],
    token: string
  ): Promise<ApiResponse<{ message: string }>> {
    return fetchApi('profile', '/profiles/me/dietary', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ preferences }),
    })
  },

  /**
   * Get favorite restaurants
   */
  async getFavorites(
    token: string
  ): Promise<ApiResponse<{ favorites: string[] }>> {
    return fetchApi('profile', '/profiles/me/favorites', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}

// ============================================================
// NOTIFICATION SERVICE (Port 4011)
// ============================================================

export const NotificationService = {
  /**
   * Get user notifications
   */
  async getNotifications(
    token: string,
    pagination?: PaginationParams
  ): Promise<ApiResponse<{ notifications: NotificationPayload[]; total: number }>> {
    const params = new URLSearchParams()
    if (pagination?.page) params.set('page', String(pagination.page))
    if (pagination?.limit) params.set('limit', String(pagination.limit))

    return fetchApi('notification', `/notifications?${params.toString()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  /**
   * Mark notification as read
   */
  async markAsRead(
    notificationId: string,
    token: string
  ): Promise<ApiResponse<{ message: string }>> {
    return fetchApi('notification', `/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  /**
   * Send notification (internal/admin)
   */
  async sendNotification(
    notification: {
      userId: string
      title: string
      body: string
      data?: Record<string, string>
      channel?: 'push' | 'sms' | 'email' | 'whatsapp'
    },
    token: string
  ): Promise<ApiResponse<{ notificationId: string }>> {
    return fetchApi('notification', '/notifications/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(notification),
    })
  },

  /**
   * Update notification preferences
   */
  async updatePreferences(
    preferences: {
      push?: boolean
      sms?: boolean
      email?: boolean
      whatsapp?: boolean
    },
    token: string
  ): Promise<ApiResponse<{ message: string }>> {
    return fetchApi('notification', '/notifications/preferences', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(preferences),
    })
  },
}

// ============================================================
// BOOKING SERVICE (Port 4020)
// ============================================================

export const BookingService = {
  /**
   * Get available slots
   */
  async getAvailableSlots(
    storeSlug: string,
    date: string,
    partySize: number
  ): Promise<ApiResponse<{ slots: Array<{
    time: string
    available: boolean
    capacity: number
  }> }>> {
    const params = new URLSearchParams({
      storeSlug,
      date,
      partySize: String(partySize),
    })
    return fetchApi('booking', `/bookings/slots?${params.toString()}`, { method: 'GET' })
  },

  /**
   * Create reservation
   */
  async createReservation(
    reservation: {
      storeSlug: string
      date: string
      time: string
      partySize: number
      name: string
      phone: string
      email?: string
      notes?: string
    },
    token: string
  ): Promise<ApiResponse<{ bookingId: string; confirmationCode: string }>> {
    return fetchApi('booking', '/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(reservation),
    })
  },

  /**
   * Get booking details
   */
  async getBooking(
    bookingId: string,
    token: string
  ): Promise<ApiResponse<{
    bookingId: string
    confirmationCode: string
    status: string
    date: string
    time: string
    partySize: number
  }>> {
    return fetchApi('booking', `/bookings/${bookingId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  /**
   * Cancel booking
   */
  async cancelBooking(
    bookingId: string,
    token: string,
    reason?: string,
  ): Promise<ApiResponse<{ message: string }>> {
    return fetchApi('booking', `/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason }),
    })
  },
}

// ============================================================
// EXPORTS
// ============================================================

export const RABTUL = {
  auth: AuthService,
  catalog: CatalogService,
  order: OrderService,
  payment: PaymentService,
  wallet: WalletService,
  search: SearchService,
  profile: ProfileService,
  notification: NotificationService,
  booking: BookingService,
}

export default RABTUL

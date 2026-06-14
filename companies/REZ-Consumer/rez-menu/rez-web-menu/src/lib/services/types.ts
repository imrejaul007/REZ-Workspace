/**
 * Shared Types for RABTUL Integration
 * Used across ReZ Web Menu and ReZ Now
 */

// ============================================================
// USER & AUTH
// ============================================================

export interface User {
  id: string
  phone: string
  email?: string
  name?: string
  avatar?: string
  createdAt: string
  updatedAt: string
  preferences?: UserPreferences
}

export interface UserPreferences {
  language?: string
  notifications?: NotificationPreferences
  dietary?: DietaryPreference[]
  favoriteCategories?: string[]
}

export interface NotificationPreferences {
  push: boolean
  sms: boolean
  email: boolean
  whatsapp: boolean
}

export interface DietaryPreference {
  type: 'allergy' | 'diet' | 'restriction'
  name: string
  value: string
}

// ============================================================
// MENU & CATALOG
// ============================================================

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  currency?: string
  category: string
  subcategory?: string
  images?: string[]
  thumbnail?: string
  available: boolean
  preparationTime?: number // minutes
  calories?: number
  allergens?: string[]
  dietaryTags?: DietaryTag[]
  customizations?: MenuCustomization[]
  addOns?: MenuAddOn[]
  variants?: MenuVariant[]
  rating?: number
  reviewCount?: number
  tags?: string[] // 'trending', 'popular', 'new', 'chef-special'
  storeSlug?: string
  merchantId?: string
  metadata?: Record<string, unknown>
}

export type DietaryTag =
  | 'vegan'
  | 'vegetarian'
  | 'non-veg'
  | 'gluten-free'
  | 'lactose-free'
  | 'halal'
  | 'jain'
  | 'low-carb'
  | 'keto'
  | 'organic'

export interface MenuCustomization {
  id: string
  name: string
  type: 'single' | 'multiple'
  required: boolean
  options: Array<{
    id: string
    name: string
    price: number
    available: boolean
  }>
}

export interface MenuAddOn {
  id: string
  name: string
  price: number
  available: boolean
  maxQuantity?: number
}

export interface MenuVariant {
  id: string
  name: string
  priceModifier: number
  available: boolean
  stock?: number
}

export interface Category {
  id: string
  name: string
  description?: string
  image?: string
  icon?: string
  parentId?: string
  sortOrder?: number
  itemCount?: number
  children?: Category[]
}

export interface Store {
  id: string
  slug: string
  name: string
  description?: string
  logo?: string
  banner?: string
  address: Address
  phone?: string
  email?: string
  timing?: {
    open: string
    close: string
    days?: string[]
  }
  rating?: number
  reviewCount?: number
  cuisine?: string[]
  priceRange?: 'budget' | 'moderate' | 'expensive' | 'premium'
  isOpen: boolean
  isDeliveryAvailable: boolean
  isPickupAvailable: boolean
  minOrderAmount?: number
  deliveryFee?: number
  estimatedDeliveryTime?: number
}

// ============================================================
// ORDERS
// ============================================================

export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  customerId: string
  storeSlug: string
  items: OrderItem[]
  subtotal: number
  tax: number
  deliveryFee?: number
  discount?: number
  total: number
  currency?: string
  paymentMethod?: PaymentMethod
  paymentStatus?: PaymentStatus
  deliveryAddress?: Address
  scheduledTime?: string
  notes?: string
  couponCode?: string
  createdAt: string
  updatedAt: string
  estimatedDelivery?: string
  actualDelivery?: string
  timeline: OrderTimeline[]
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export interface OrderItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  customizations?: Record<string, string | string[]>
  addOns?: Array<{ id: string; name: string; price: number }>
  notes?: string
  subtotal: number
}

export interface OrderTimeline {
  status: OrderStatus
  timestamp: string
  message?: string
  actor?: string
}

export interface Address {
  id?: string
  label?: string
  address: string
  city: string
  state?: string
  pincode: string
  country?: string
  coordinates?: {
    lat: number
    lng: number
  }
  landmark?: string
  isDefault?: boolean
}

// ============================================================
// PAYMENTS
// ============================================================

export type PaymentMethod =
  | 'upi'
  | 'card'
  | 'wallet'
  | 'netbanking'
  | 'cod'
  | 'corporate'

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled'

export interface PaymentResult {
  id: string
  orderId: string
  amount: number
  currency: string
  status: PaymentStatus
  method?: PaymentMethod
  razorpayOrderId?: string
  razorpayPaymentId?: string
  createdAt: string
  updatedAt: string
}

export interface WalletBalance {
  coins: number
  cashback: number
  total: number
  currency?: string
  pending?: number
}

// ============================================================
// SEARCH
// ============================================================

export interface SearchResult {
  items: MenuItem[]
  stores: Store[]
  categories: Category[]
  total: number
  query: string
  facets?: SearchFacets
}

export interface SearchFacets {
  categories?: Array<{ name: string; count: number }>
  priceRanges?: Array<{ range: string; count: number }>
  dietary?: Array<{ tag: DietaryTag; count: number }>
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export interface NotificationPayload {
  id: string
  userId: string
  title: string
  body: string
  type: NotificationType
  data?: Record<string, string>
  read: boolean
  createdAt: string
}

export type NotificationType =
  | 'order_update'
  | 'payment'
  | 'promotion'
  | 'reminder'
  | 'system'

// ============================================================
// AI & INTELLIGENCE
// ============================================================

export interface AIBadge {
  type: 'trending' | 'popular' | 'scarce' | 'new' | 'chef-special'
  label: string
  icon: string
  color: string
  data?: Record<string, unknown>
}

export interface CartRecovery {
  userId: string
  abandonedItems: Array<{
    itemId: string
    name: string
    price: number
    image?: string
    quantity: number
    abandonedAt: string
  }>
  nudgeEligible: boolean
  lastNudgeSent?: string
  nudgeCount: number
}

export interface PairingItem {
  itemId: string
  name: string
  price: number
  image?: string
  confidence: number
  type: 'frequently_bought' | 'goes_well' | 'alternative'
}

export interface PersonalizedRecommendation {
  itemId: string
  name: string
  price: number
  image?: string
  score: number
  reason: 'taste' | 'history' | 'similar' | 'trending' | 'seasonal' | 'location'
  reasonText?: string
}

export interface TrendingItem {
  itemId: string
  name: string
  rank: number
  ordersToday: number
  ordersThisWeek: number
  velocity: number
  trend: 'rising' | 'stable' | 'falling'
  confidence: number
}

export interface ScarcityStatus {
  itemId: string
  status: 'available' | 'low' | 'scarce' | 'soldout'
  quantity: number
  velocity: number
  lastOrdered: string
  estimatedStockout?: string
}

export interface TrendingData {
  itemId: string
  rank: number
  ordersToday: number
  velocity: number // orders per hour
  trend: 'rising' | 'stable' | 'falling'
}

export interface ScarcityData {
  itemId: string
  status: 'available' | 'low' | 'scarce' | 'soldout'
  quantity: number
  velocity: number
  lastOrdered?: string
}

export interface PairingSuggestion {
  itemId: string
  pairedWith: MenuItem[]
  confidence: number
  reason: string
}

export interface PersonalizedRanking {
  itemId: string
  score: number
  reason: 'taste' | 'history' | 'similar' | 'trending' | 'promotion'
}

// ============================================================
// CART
// ============================================================

export interface CartItem {
  id: string
  productId: string
  name: string
  description?: string
  price: number
  quantity: number
  image?: string
  customizations?: Record<string, string | string[]>
  addOns?: MenuAddOn[]
  notes?: string
  // Dine-in metadata
  metadata?: {
    tableNumber?: string
    orderType?: 'dine_in' | 'delivery' | 'pickup'
  }
}

export interface Cart {
  storeSlug: string
  items: CartItem[]
  subtotal: number
  tax: number
  discount?: number
  total: number
  itemCount: number
  lastUpdated: string
  // Dine-in context
  dineInContext?: {
    tableNumber: string
    orderType: 'dine_in'
  }
}

// ============================================================
// DINE-IN / QR ORDERING
// ============================================================

export interface DineInOrder {
  id: string
  orderNumber: string
  status: OrderStatus
  customerId?: string
  storeSlug: string
  tableNumber: string
  items: OrderItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod?: PaymentMethod
  paymentStatus?: PaymentStatus
  notes?: string
  createdAt: string
  updatedAt: string
  timeline: OrderTimeline[]
}

export interface TableQRInfo {
  tableId: string
  tableNumber: string
  tableName?: string
  capacity?: number
  menuUrl: string
  restaurantName?: string
  restaurantSlug: string
}

// ============================================================
// CORPORATE (CORPPERKS)
// ============================================================

export interface CorporateWallet {
  personal: WalletBalance
  corporate: {
    balance: number
    spent: number
    limit: number
    category: 'food' | 'dining' | 'groceries' | 'restaurant' | 'cafe'
    expiresAt?: string
  }
}

export interface MealBenefit {
  id: string
  employeeId: string
  balance: number
  limit: number
  period: 'daily' | 'weekly' | 'monthly'
  resetDate: string
  categories: string[]
}

export interface CorporateOrder {
  id: string
  companyId: string
  employeeId: string
  items: OrderItem[]
  total: number
  benefitApplied: number
  benefitDeduction: number
  personalAmount: number
  gstInvoiceNumber?: string
  irn?: string
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// ── Store ─────────────────────────────────────────────────────────────────────

export type StoreType =
  | 'restaurant'
  | 'cafe'
  | 'cloud_kitchen'
  | 'retail'
  | 'salon'
  | 'hotel'
  | 'service'
  | 'general';

export type DisplayMode = 'menu' | 'catalog' | 'services' | 'appointments';

export interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  banner: string | null;
  address: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  storeType: StoreType;
  displayMode: DisplayMode;       // Determines how store items are displayed
  hasMenu: boolean;              // true = Order & Pay; false = Scan & Pay only
  isProgramMerchant: boolean;    // true = show coin/wallet UI
  estimatedPrepMinutes: number;  // 0 = don't show wait badge
  gstEnabled: boolean;
  gstPercent: number;
  isOpen: boolean;
  nextChangeLabel: string;
  operatingHours: Record<string, { open: string; close: string; closed: boolean } | null>;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    website?: string;
  };
  gstNumber?: string;
  fssaiNumber?: string;
  googlePlaceId: string | null;
  rewardRules: {
    baseCashbackPercent: number;
    coinsEnabled: boolean;
  };
  activePromos?: Array<{ text: string; code?: string; bgColor?: string }>;
  deliveryEnabled: boolean;
  deliveryRadiusKm: number;
  deliveryFee: number;
  reservationsEnabled?: boolean;
  maxTableCapacity?: number;
}

// ── Menu ──────────────────────────────────────────────────────────────────────

export interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;          // in paise
  originalPrice: number | null;
  isVeg: boolean;
  isAvailable?: boolean;
  spicyLevel?: 0 | 1 | 2 | 3;
  image: string | null;
  categoryId?: string;
  available?: boolean;
  isFeatured?: boolean;
  preparationTime?: number;
  customizations?: MenuCustomization[];
  // ── Enhanced Menu QR Features ─────────────────────────────────────────────────
  /** High-quality image for zoom/detail view */
  imageHd?: string | null;
  /** Short badge text like "Chef's Special", "Best Seller", "New" */
  badge?: string | null;
  /** Badge color variant */
  badgeVariant?: 'gold' | 'red' | 'green' | 'blue' | 'purple';
  /** Mark item as seasonal/limited time */
  isSeasonal?: boolean;
  /** Mark item as popular/highlighted */
  isPopular?: boolean;
  /** Mark item as chef's recommendation */
  isChefSpecial?: boolean;
  /** Allergen warnings: 'gluten', 'dairy', 'nuts', 'eggs', 'soy', 'shellfish', 'fish', 'peanuts' */
  allergens?: string[];
  /** Dietary labels */
  dietary?: {
    isVegan?: boolean;
    isVegetarian?: boolean;
    isGlutenFree?: boolean;
    isHalal?: boolean;
    isKosher?: boolean;
    isJain?: boolean;
  };
  /** Nutritional information per serving */
  nutrition?: {
    calories?: number;
    protein?: number;  // grams
    carbs?: number;    // grams
    fat?: number;      // grams
    fiber?: number;    // grams
    sodium?: number;   // mg
  };
  /** Direct calories field for mock data compatibility */
  calories?: number;
  /** Direct allergens field for mock data compatibility */
  allergens?: string[];
  /** Wine/beverage pairing suggestions */
  pairings?: Array<{
    name: string;
    type: 'wine' | 'beer' | 'cocktail' | 'beverage' | 'dessert_wine';
    description?: string;
  }>;
  /** Portion size options (e.g., Half, Full, Sharing) */
  portionSizes?: Array<{
    id: string;
    label: string;
    priceModifier: number; // in paise, can be negative for smaller
  }>;
  /** Video URL for dish preview */
  videoUrl?: string | null;
  /** Brief story/origin of the dish */
  story?: string | null;
  /** Cooking method (Grilled, Tandoor, Fried, Steamed, etc.) */
  cookingMethod?: string | null;
  /** Key ingredients breakdown */
  ingredients?: string[];
  /** Spice level description (Mild, Medium, Hot, Extra Hot) */
  spiceDescription?: string;
  /** Preparation time in minutes */
  prepTime?: number;
  /** Average rating (1-5) */
  rating?: number;
  /** Number of reviews */
  reviewCount?: number;
  /** Customization groups for menu items */
  customizableGroups?: Array<{
    id: string;
    name: string;
    required?: boolean;
    min?: number;
    max?: number;
    maxSelect?: number;
    options: Array<{
      id: string;
      name: string;
      priceModifier?: number;
      price?: number;
      isDefault?: boolean;
    }>;
  }>;
}

export interface MenuCustomization {
  id: string;
  name: string;
  required: boolean;
  /** 'single' = radio (pick exactly one), 'multiple' = checkbox (pick many) */
  type: 'single' | 'multiple';
  minSelect?: number;   // only for type='multiple'
  maxSelect?: number;   // only for type='multiple'
  options: Array<{ id: string; name: string; priceAdd: number }>;
}

// ── Cart ──────────────────────────────────────────────────────────────────────

export interface CartItem {
  itemId: string;
  name: string;
  price: number;           // in paise, base + customizationTotal
  basePrice: number;       // in paise, base price only
  quantity: number;
  /** customizationId → one or more optionIds (array supports multi-select groups) */
  customizations: Record<string, string[]>;
  customizationTotal: number; // in paise, sum of all selected priceAdd values
  isVeg: boolean;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  isOnboarded: boolean;
  referralCode?: string;
  membershipTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  defaultAddress?: string;
  token?: string;
}

export interface AuthTokens {
  accessToken: string | null; // null when tokens live in httpOnly cookies (NW-CRIT-014)
  refreshToken: string | null;
}

// ── Order ─────────────────────────────────────────────────────────────────────

// DM-CRIT-01 FIX: Added canonical backend statuses 'placed' and 'delivered'.
// The backend sends 'placed' for new orders and 'delivered' for completed orders.
// 'pending_payment' and 'completed' are kept for backward compat with cached/local data.
export type WebOrderStatus =
  | 'pending_payment'  // frontend legacy alias for 'placed'
  | 'placed'           // backend canonical — new order, awaiting payment
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'        // backend canonical — order completed
  | 'completed'         // frontend legacy alias for 'delivered'
  | 'cancelled';

// DM-CRIT-01 FIX: Normalize any incoming status to a display-compatible WebOrderStatus.
// Backend sends 'placed' and 'delivered'; frontend also uses 'pending_payment' and 'completed'.
// normalizeWebOrderStatus('placed') → 'pending_payment' (for display step index)
// normalizeWebOrderStatus('delivered') → 'completed' (for display step index)
const _ORDER_STATUS_MAP: Record<string, WebOrderStatus> = {
  placed: 'pending_payment',
  delivered: 'completed',
};
export function normalizeWebOrderStatus(status: string): WebOrderStatus {
  return (_ORDER_STATUS_MAP[status] ?? status) as WebOrderStatus;
}

export interface DeliveryAddress {
  line1: string;
  city: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

export interface WebOrder {
  id: string;
  orderNumber: string;
  status: WebOrderStatus;
  paymentStatus?: string;
  items: Array<{
    id?: string;
    menuItemId?: string;
    name: string;
    quantity: number;
    price: number;
    customizations?: Record<string, string[]>;
  }>;
  subtotal: number;
  gst: number;
  tip: number;
  donation: number;
  discount: number;
  deliveryFee?: number;
  total: number;
  customerPhone: string | null;
  tableNumber: string | null;
  orderType?: 'dine_in' | 'takeaway' | 'delivery';
  deliveryAddress?: DeliveryAddress;
  storeId?: string;
  storeSlug: string;
  storeName: string;
  createdAt: string;
  updatedAt: string;
  /** 1-5 star rating submitted by the customer after the order was completed */
  rating?: number;
}

// NW-HIGH-012: Canonical OrderHistoryItem — single definition, no duplicates.
// The API layer must not redefine this type. Missing pagination fields added below.
export interface OrderHistoryItem {
  orderNumber: string;
  status: WebOrderStatus;
  total: number;
  itemCount: number;
  storeName: string;
  storeLogo?: string;
  storeSlug: string;
  createdAt: string;
  paymentStatus: string;
  scheduledFor?: string;
  /** NW-CRIT-009 FIX: items returned with menuItemId + price for reorder pre-fill. */
  items?: OrderHistoryItemProduct[];
}

// NW-CRIT-009 FIX: individual item in order history with full fields for reorder.
export interface OrderHistoryItemProduct {
  menuItemId: string | null;
  name: string;
  quantity: number;
  price: number;
}

export interface OrderHistoryResponse {
  orders: OrderHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

// ── Socket ───────────────────────────────────────────────────────────────────

export interface OrderStatusUpdateEvent {
  orderNumber: string;
  status: WebOrderStatus;
  storeId: string;
}

// ── Wallet ────────────────────────────────────────────────────────────────────

export interface WalletBalance {
  coins: number;
  /** Derived: equals coins / 100. Always compute from coins — do not set independently. */
  rupees: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  coinType: string;
  source: string;
  description: string;
  createdAt: string;
}

// ── Reconciliation ──────────────────────────────────────────────────────────────

// NW-MED-059: Canonical definitions — previously duplicated in merchant.ts and reconcile.ts.
// Import from here in all API files. Delete local definitions after migration.
export interface ReconciliationTransaction {
  paymentId: string;
  type: 'digital' | 'cash';
  amount: number;
  status: 'completed' | 'pending';
  createdAt: string;
}

export interface ReconciliationResult {
  date: string;
  storeSlug: string;
  totalDigital: number;
  totalCash: number;
  expectedCash: number;
  discrepancy: number;
  discrepancyPercent: number;
  status: 'open' | 'reconciled' | 'flagged';
  reconciledAt?: string;
  reconciledBy?: string;
  transactions: ReconciliationTransaction[];
}

// ── Payment ───────────────────────────────────────────────────────────────────

export interface RazorpayOrderResponse {
  razorpayOrderId: string;
  amount: number;          // in paise
  currency: string;
  keyId: string;
  orderNumber: string;
}

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// ── Coupon ────────────────────────────────────────────────────────────────────

export interface CouponValidateResponse {
  success: boolean;
  couponCode: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  discountAmount: number;  // computed discount in paise
  message?: string;
}

// NW-MED-005 FIX: AvailableCoupon is now an alias for Coupon from lib/api/coupons.
// Both names resolve to the same canonical interface, preventing the split-brain problem.
export type { Coupon as AvailableCoupon } from '@/lib/api/coupons';
export type { Coupon } from '@/lib/api/coupons';

// ── Bill Split ────────────────────────────────────────────────────────────────

export interface SplitBillResponse {
  billId: string;
  totalAmount: number;
  splitCount: number;
  perPersonAmount: number;
}

// ── Group Order ───────────────────────────────────────────────────────────────

export interface GroupOrder {
  groupId: string;
  storeSlug: string;
  members: Array<{ phone: string; name?: string; itemCount: number }>;
  items: CartItem[];
  status: 'open' | 'checking_out' | 'paid';
}

// ── Loyalty ───────────────────────────────────────────────────────────────────

export interface StampCard {
  totalStamps: number;
  stampsRequired: number;
  rewardDescription: string;
}

// ── Scan & Pay ────────────────────────────────────────────────────────────────

// NW-HIGH-005: Canonical payment status used across all payment flows.
// Previously three incompatible definitions existed: BillStatus (pending|paid|cancelled|expired),
// PayDisplayClient PendingPayment (pending|confirmed|rejected), TransactionList (completed|pending).
// All code should use this union.
export type PaymentStatus = 'pending' | 'paid' | 'confirmed' | 'rejected' | 'cancelled' | 'expired';
/** @deprecated Use PaymentStatus */
export type BillStatus = PaymentStatus;

export interface MerchantBill {
  id: string;
  storeSlug: string;
  storeName: string;
  items: Array<{
    name: string;
    qty: number;
    price: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  billNumber: string;
  status: BillStatus;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
  expiresAt: string;
}

// NW-CRIT-010: paymentId is assigned by Razorpay only after successful payment.
// It is NOT returned by the backend order-creation endpoint. The Razorpay SDK
// callback returns razorpay_payment_id. Use razorpayOrderId as the stable identifier
// for redirects and verification.
export interface ScanPayOrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

// ── Catalog (Universal Catalog — R5) ───────────────────────────────────────────────

export interface VariantOption {
  label: string;
  value: string;
  priceModifier: number;
  inStock: boolean;
  image?: string;
  color?: string;
}

export interface VariantGroup {
  name: string;
  type: 'color' | 'size' | 'text' | 'button';
  options: VariantOption[];
}

export interface BulkTier {
  minQty: number;
  pricePerUnit: number;
}

export interface StaffMember {
  id: string;
  name: string;
  rating: number;
}

export interface CatalogItem {
  id: string;
  type: 'product' | 'service';
  name: string;
  description: string;
  basePrice: number;
  formattedPrice: string;
  images: string[];
  tags: string[];
  isAvailable: boolean;
  variants?: VariantGroup[];
  stock?: number;
  mrp?: number;
  formattedMrp?: string;
  savings?: number;
  bulkPricing?: BulkTier[];
  durationMinutes?: number;
  staff?: StaffMember[];
  bookingRequiresDeposit?: boolean;
  depositAmount?: number;
}

export interface TimeSlot {
  time: string; // "09:00"
  available: boolean;
  bookedBy?: string;
}

export interface AppointmentSlot {
  date: string;
  slots: TimeSlot[];
}

// ── API responses ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ── Merchant CRM ────────────────────────────────────────────────────────────────

export type CustomerSegmentType = 'new' | 'repeat' | 'at_risk' | 'vip';

export interface CustomerSegment {
  type: CustomerSegmentType;
  count: number;
  avgOrderValue: number; // in paise
  totalRevenue: number; // in paise
}

export interface CustomerSegments {
  segments: CustomerSegment[];
  totalCustomers: number;
}

export interface OrderSummary {
  orderNumber: string;
  total: number; // in paise
  createdAt: string;
  status: string;
}

export interface CustomerSummary {
  customerId: string;
  name?: string;
  phone: string;
  visitCount: number;
  totalSpent: number; // in paise
  lastVisit: string; // ISO date
  avgOrderValue: number; // in paise
}

export interface CustomerDetail extends CustomerSummary {
  orders: OrderSummary[];
  firstVisit: string;
  segment: CustomerSegmentType;
}

export interface AtRiskCustomer extends CustomerSummary {
  daysSinceLastVisit: number;
}

// ── Room QR Types ────────────────────────────────────────────────────────────────

export type QRType = 'room' | 'store' | 'table' | 'unknown';

export type ServiceRequestPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ServiceRequestStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type ServiceType =
  | 'housekeeping'
  | 'room_service'
  | 'laundry'
  | 'transport'
  | 'spa'
  | 'maintenance'
  | 'concierge'
  | 'fitness'
  | 'late_checkout'
  | 'early_checkin'
  | 'minibar'
  | 'express_checkout'
  | 'turndown'
  | 'amenity';

export type FeedbackType = 'in_stay' | 'checkout' | 'post_stay' | 'incident';
export type SupportedLanguage = 'en' | 'hi' | 'ar' | 'zh' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'ru';

export interface RoomHubContext {
  bookingId: string;
  roomId: string;
  roomNumber: string;
  hotelId: string;
  hotelName: string;
  hotelSlug: string;
  guestName?: string;
  checkIn?: string;
  checkOut?: string;
  roomTypeName?: string;
  floor?: string;
  features?: RoomFeatures;
}

export interface RoomFeatures {
  hasMinibar: boolean;
  hasSafe: boolean;
  hasBalcony: boolean;
  hasBathtub: boolean;
  maxOccupancy: number;
}

export interface ServiceRequestItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export interface ServiceRequest {
  id: string;
  bookingId: string;
  roomId: string;
  roomNumber: string;
  serviceType: ServiceType;
  description?: string;
  items?: ServiceRequestItem[];
  totalAmountPaise: number;
  status: ServiceRequestStatus;
  priority: ServiceRequestPriority;
  scheduledFor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HousekeepingExtra {
  id: string;
  name: string;
  price: number;
  icon: string;
  available: boolean;
}

export interface MinibarItem {
  id: string;
  name: string;
  price: number;
  category: 'beverage' | 'snack' | 'alcohol' | 'misc';
  image?: string;
  stock?: number;
}

export interface MinibarConsumption {
  itemId: string;
  itemName: string;
  quantity: number;
  timestamp: string;
  totalPrice: number;
}

export interface MinibarBill {
  id: string;
  roomId: string;
  roomNumber: string;
  items: MinibarConsumption[];
  subtotal: number;
  tax: number;
  total: number;
  checkedInAt: string;
  checkedOutAt?: string;
  status: 'active' | 'settled' | 'disputed';
}

export interface CheckoutBillItem {
  description: string;
  category: string;
  amount: number;
  quantity?: number;
}

export interface CheckoutCharge {
  type: 'room' | 'minibar' | 'laundry' | 'restaurant' | 'spa' | 'transport' | 'other' | 'tax' | 'discount';
  description: string;
  amount: number;
}

export interface CheckoutBill {
  id: string;
  bookingId: string;
  roomId: string;
  roomNumber: string;
  guestName: string;
  items: CheckoutBillItem[];
  charges: CheckoutCharge[];
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: 'pending' | 'partial' | 'settled';
  checkoutTime: string;
  generatedAt: string;
}

export interface RoomPreference {
  preferenceType: 'pillow' | 'towel' | 'temperature' | 'lighting' | 'noise' | 'wakeup' | 'dietary' | 'general';
  value: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GuestPreferences {
  guestId: string;
  roomId: string;
  preferences: RoomPreference[];
  dietaryRestrictions?: string[];
  allergies?: string[];
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface GuestFeedbackRatings {
  overall?: number;
  cleanliness?: number;
  service?: number;
  amenities?: number;
  comfort?: number;
}

export interface GuestFeedback {
  id: string;
  bookingId: string;
  roomId: string;
  feedbackType: FeedbackType;
  ratings: GuestFeedbackRatings;
  comment?: string;
  improvements?: string[];
  wouldRecommend?: boolean;
  submittedAt: string;
}

export interface VoiceCommandResult {
  success: boolean;
  intent: string;
  entities: Record<string, string>;
  confidence: number;
  message: string;
  action?: ServiceRequest;
}

export interface LanguageContext {
  language: SupportedLanguage;
  locale: string;
  currency: string;
  currencySymbol: string;
}

export interface QRValidationResult {
  valid: boolean;
  qrType: QRType;
  roomContext?: RoomHubContext;
  storeSlug?: string;
  error?: string;
}

// ── Menu QR Types ────────────────────────────────────────────────────────────────

export type TimeOfDay = 'breakfast' | 'lunch' | 'dinner' | 'late_night';

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'hot' | 'cold' | 'mild';

export interface DietaryPreferences {
  userId: string;
  vegan: boolean;
  vegetarian: boolean;
  glutenFree: boolean;
  nutFree: boolean;
  dairyFree: boolean;
  halal: boolean;
  kosher: boolean;
  jain: boolean;
  allergies: string[];
  dislikes: string[];
  preferredCuisines: string[];
  spiceTolerance: number;
  createdAt: string;
  updatedAt: string;
}

export interface TasteProfile {
  userId: string;
  spiceTolerance: number;
  preferredCuisines: string[];
  avgOrderValue: number;
  orderingFrequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
  preferredPortionSize: 'small' | 'medium' | 'large' | 'sharing';
  tipPercentage: number;
  dietaryRestrictions: string[];
  totalOrders: number;
  totalSpent: number;
  favoriteCategories: string[];
  favoriteItems: string[];
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeatherData {
  locationKey: string;
  temperature: number;
  condition: WeatherCondition;
  humidity: number;
  description: string;
  isComfortable: boolean;
  fetchedAt: string;
  expiresAt: string;
}

export interface WeatherRecommendations {
  recommendedCategories: string[];
  recommendedItems: string[];
  beverages: string[];
  reason: string;
}

export interface MenuRecommendationItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  formattedPrice?: string;
  image?: string;
  images?: string[];
  category?: string;
  tags?: string[];
  isAvailable?: boolean;
  dietary?: {
    isVegan?: boolean;
    isVegetarian?: boolean;
    isGlutenFree?: boolean;
    isHalal?: boolean;
    isKosher?: boolean;
    isJain?: boolean;
  };
  allergens?: string[];
  spicyLevel?: number;
  rating?: number;
  reviewCount?: number;
  isPopular?: boolean;
  isChefSpecial?: boolean;
}

export interface MenuRecommendation {
  item: MenuRecommendationItem;
  score: number;
  reason: string;
  category: string;
}

export interface MenuRecommendationResponse {
  recommendations: MenuRecommendation[];
  weatherContext?: {
    condition: string;
    temperature: number;
    recommendation: string;
  };
  timeContext: string;
  personalizedAt: string;
}

export interface BillSplitPerson {
  personId: string;
  personName?: string;
  itemIds: string[];
  itemTotal: number;
  sharePercent: number;
  amount: number;
  settled: boolean;
  settledAt?: string;
}

export interface BillSplit {
  _id: string;
  orderId: string;
  storeId: string;
  totalAmount: number;
  splits: BillSplitPerson[];
  status: 'pending' | 'partial' | 'settled';
  createdAt: string;
  updatedAt: string;
}

export interface BillSplitSummary {
  orderId: string;
  totalAmount: number;
  splitCount: number;
  status: 'pending' | 'partial' | 'settled';
  perPerson: {
    personId: string;
    personName?: string;
    amount: number;
    sharePercent: number;
    settled: boolean;
    settledAt?: string;
  }[];
  remaining: number;
  settledAmount: number;
}

// ── Group Ordering ───────────────────────────────────────────────────────────────

export type GroupSessionStatus = 'active' | 'completed' | 'cancelled';

export interface GroupMember {
  id: string;
  name: string;
  phone: string;
  isHost: boolean;
  joinedAt: string;
  items: CartItem[];
  totalAmount: number;
}

export interface SharedItem {
  id: string;
  itemId: string;
  name: string;
  price: number;
  addedBy: string;
  addedByName: string;
  addedAt: string;
  quantity: number;
}

export interface GroupSession {
  id: string;
  code: string;
  storeId: string;
  storeSlug: string;
  storeName: string;
  hostId: string;
  members: GroupMember[];
  items: SharedItem[];
  status: GroupSessionStatus;
  createdAt: string;
  totalAmount: number;
  tableNumber?: string;
}

export interface GroupOrderSummary {
  sessionId: string;
  code: string;
  storeName: string;
  totalAmount: number;
  perPerson: {
    memberId: string;
    name: string;
    items: Array<{
      name: string;
      price: number;
      quantity: number;
      shared: boolean;
    }>;
    subtotal: number;
    tax: number;
    total: number;
  }[];
  sharedItems: SharedItem[];
  tax: number;
  grandTotal: number;
}

// ── Kitchen Display System (KDS) ────────────────────────────────────────────────

export type KDSItemStatus = 'received' | 'preparing' | 'ready' | 'served';
export type KDSOrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';

export interface KDSItem {
  id: string;
  orderId: string;
  menuItemId: string;
  name: string;
  quantity: number;
  customizations?: Record<string, string[]>;
  status: KDSItemStatus;
  updatedAt: string;
  notes?: string;
  preparedBy?: string;
}

export interface KDSOrder {
  id: string;
  orderNumber: string;
  orderId: string;
  storeId: string;
  storeSlug: string;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  items: KDSItem[];
  status: KDSOrderStatus;
  createdAt: string;
  updatedAt?: string;
  elapsedSeconds: number;
  priority: 'normal' | 'rush' | 'vip';
  notes?: string;
}

export interface KDSOrderUpdate {
  orderId: string;
  status: KDSOrderStatus;
  updatedBy?: string;
  updatedAt: string;
}

export interface KDSItemUpdate {
  orderId: string;
  itemId: string;
  status: KDSItemStatus;
  preparedBy?: string;
  notes?: string;
  updatedAt: string;
}

// KDS WebSocket Events
export interface KDSEvent {
  type: 'order.created' | 'order.updated' | 'item.updated' | 'order.ready' | 'order.cancelled';
  payload: KDSOrder | KDSOrderUpdate | KDSItemUpdate;
  timestamp: string;
}

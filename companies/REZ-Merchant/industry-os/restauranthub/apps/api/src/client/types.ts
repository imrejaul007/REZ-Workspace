// Authentication types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  profile?: UserProfile;
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  RESTAURANT_OWNER = 'RESTAURANT_OWNER',
  RESTAURANT_STAFF = 'RESTAURANT_STAFF',
  DELIVERY_PARTNER = 'DELIVERY_PARTNER',
  VENDOR = 'VENDOR',
  HR_MANAGER = 'HR_MANAGER',
  JOB_SEEKER = 'JOB_SEEKER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export interface UserProfile {
  bio?: string;
  address?: Address;
  dateOfBirth?: string;
  preferences?: UserPreferences;
  socialLinks?: SocialLinks;
}

export interface UserPreferences {
  language: string;
  currency: string;
  timezone: string;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  newsletter: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
  showEmail: boolean;
  showPhoneNumber: boolean;
  showAddress: boolean;
}

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  website?: string;
}

// Restaurant types
export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  cuisine: string[];
  address: Address;
  phoneNumber: string;
  email: string;
  website?: string;
  socialLinks?: SocialLinks;
  images: string[];
  status: RestaurantStatus;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isFeatured: boolean;
  openingHours: OpeningHours[];
  deliveryRadius: number;
  minimumOrderValue: number;
  deliveryFee: number;
  estimatedDeliveryTime: number;
  acceptsOnlinePayment: boolean;
  acceptsCashOnDelivery: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  owner: User;
  menus: Menu[];
  orders: Order[];
  reviews: Review[];
}

export enum RestaurantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  SUSPENDED = 'SUSPENDED',
  CLOSED_TEMPORARILY = 'CLOSED_TEMPORARILY',
}

export interface OpeningHours {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  openTime: string; // HH:MM format
  closeTime: string; // HH:MM format
  isClosed: boolean;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Menu types
export interface Menu {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  categories: MenuCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  images: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isSpicy: boolean;
  allergens: string[];
  ingredients: string[];
  nutritionInfo?: NutritionInfo;
  preparationTime: number;
  isAvailable: boolean;
  displayOrder: number;
  variants?: MenuItemVariant[];
  addons?: MenuItemAddon[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemVariant {
  id: string;
  name: string;
  description?: string;
  price: number;
  isDefault: boolean;
}

export interface MenuItemAddon {
  id: string;
  name: string;
  description?: string;
  price: number;
  isRequired: boolean;
  maxQuantity?: number;
  options?: AddonOption[];
}

export interface AddonOption {
  id: string;
  name: string;
  price: number;
  isDefault: boolean;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

// Order types
export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  restaurantId: string;
  status: OrderStatus;
  type: OrderType;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryAddress?: Address;
  deliveryInstructions?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  driverId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer: User;
  restaurant: Restaurant;
  driver?: User;
  payments: Payment[];
  reviews: Review[];
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum OrderType {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP',
  DINE_IN = 'DINE_IN',
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
  selectedVariant?: MenuItemVariant;
  selectedAddons?: SelectedAddon[];
  menuItem: MenuItem;
}

export interface SelectedAddon {
  addon: MenuItemAddon;
  selectedOptions: AddonOption[];
  quantity: number;
}

// Payment types
export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  gateway: PaymentGateway;
  status: PaymentStatus;
  gatewayTransactionId?: string;
  gatewayResponse?;
  failureReason?: string;
  refundAmount?: number;
  refundStatus?: RefundStatus;
  createdAt: string;
  updatedAt: string;
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  UPI = 'UPI',
  WALLET = 'WALLET',
  NET_BANKING = 'NET_BANKING',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
}

export enum PaymentGateway {
  STRIPE = 'STRIPE',
  RAZORPAY = 'RAZORPAY',
  PAYPAL = 'PAYPAL',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum RefundStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// Review types
export interface Review {
  id: string;
  customerId: string;
  restaurantId?: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  isVerified: boolean;
  isReported: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  customer: User;
  restaurant?: Restaurant;
  order?: Order;
  responses: ReviewResponse[];
}

export interface ReviewResponse {
  id: string;
  reviewId: string;
  responderId: string;
  content: string;
  createdAt: string;
  responder: User;
}

// Job types
export interface Job {
  id: string;
  restaurantId?: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  employmentType: EmploymentType;
  workLocation: WorkLocation;
  salaryRange?: SalaryRange;
  benefits?: string[];
  skills: string[];
  experienceLevel: ExperienceLevel;
  location: Address;
  isRemote: boolean;
  status: JobStatus;
  publishedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  restaurant?: Restaurant;
  applications: JobApplication[];
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERNSHIP = 'INTERNSHIP',
  TEMPORARY = 'TEMPORARY',
}

export enum WorkLocation {
  ON_SITE = 'ON_SITE',
  REMOTE = 'REMOTE',
  HYBRID = 'HYBRID',
}

export enum ExperienceLevel {
  ENTRY_LEVEL = 'ENTRY_LEVEL',
  MID_LEVEL = 'MID_LEVEL',
  SENIOR_LEVEL = 'SENIOR_LEVEL',
  EXECUTIVE = 'EXECUTIVE',
}

export enum JobStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  PAUSED = 'PAUSED',
  CLOSED = 'CLOSED',
  EXPIRED = 'EXPIRED',
}

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  period: 'HOURLY' | 'MONTHLY' | 'YEARLY';
}

export interface JobApplication {
  id: string;
  jobId: string;
  applicantId: string;
  resume?: string;
  coverLetter?: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  job: Job;
  applicant: User;
  interviews: Interview[];
}

export enum ApplicationStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEWED = 'INTERVIEWED',
  OFFERED = 'OFFERED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export interface Interview {
  id: string;
  applicationId: string;
  type: InterviewType;
  scheduledAt: string;
  duration: number;
  location?: string;
  meetingLink?: string;
  notes?: string;
  status: InterviewStatus;
  feedback?: InterviewFeedback;
  createdAt: string;
  updatedAt: string;
}

export enum InterviewType {
  PHONE = 'PHONE',
  VIDEO = 'VIDEO',
  IN_PERSON = 'IN_PERSON',
  TECHNICAL = 'TECHNICAL',
}

export enum InterviewStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export interface InterviewFeedback {
  rating: number;
  strengths: string[];
  weaknesses: string[];
  comments: string;
  recommendation: 'HIRE' | 'NOT_HIRE' | 'MAYBE';
}

// B2B Marketplace types
export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  category: ProductCategory;
  subcategory?: string;
  images: string[];
  specifications?: ProductSpecification[];
  pricing: ProductPricing;
  inventory: ProductInventory;
  minimumOrderQuantity: number;
  maximumOrderQuantity?: number;
  leadTime: number;
  tags: string[];
  isVerified: boolean;
  status: ProductStatus;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  vendor: User;
  reviews: Review[];
}

export enum ProductCategory {
  FRESH_PRODUCE = 'FRESH_PRODUCE',
  MEAT_SEAFOOD = 'MEAT_SEAFOOD',
  DAIRY_EGGS = 'DAIRY_EGGS',
  PANTRY_STAPLES = 'PANTRY_STAPLES',
  BEVERAGES = 'BEVERAGES',
  FROZEN_FOODS = 'FROZEN_FOODS',
  EQUIPMENT = 'EQUIPMENT',
  PACKAGING = 'PACKAGING',
  CLEANING_SUPPLIES = 'CLEANING_SUPPLIES',
  OTHER = 'OTHER',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
}

export interface ProductSpecification {
  name: string;
  value: string;
  unit?: string;
}

export interface ProductPricing {
  basePrice: number;
  currency: string;
  tierPricing?: TierPricing[];
  discounts?: ProductDiscount[];
}

export interface TierPricing {
  minQuantity: number;
  maxQuantity?: number;
  price: number;
}

export interface ProductDiscount {
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  minQuantity?: number;
  validFrom: string;
  validTo: string;
}

export interface ProductInventory {
  availableQuantity: number;
  reservedQuantity: number;
  unit: string;
  lowStockThreshold: number;
  lastRestockedAt?: string;
}

// Vendor Order types
export interface VendorOrder {
  id: string;
  orderNumber: string;
  restaurantId: string;
  vendorId: string;
  items: VendorOrderItem[];
  subtotal: number;
  taxAmount: number;
  shippingFee: number;
  totalAmount: number;
  status: VendorOrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryAddress: Address;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  restaurant: Restaurant;
  vendor: User;
  payments: Payment[];
}

export enum VendorOrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

export interface VendorOrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: Product;
}

// Analytics types
export interface BusinessMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalRestaurants: number;
  totalCustomers: number;
  averageOrderValue: number;
  conversionRate: number;
  customerRetentionRate: number;
  period: string;
  previousPeriodComparison?: {
    revenueGrowth: number;
    orderGrowth: number;
    customerGrowth: number;
  };
}

export interface RestaurantAnalytics {
  restaurantId: string;
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  customerCount: number;
  rating: number;
  reviewCount: number;
  popularItems: PopularItem[];
  peakHours: PeakHour[];
  customerDemographics: CustomerDemographics;
  period: string;
}

export interface PopularItem {
  menuItemId: string;
  name: string;
  orderCount: number;
  revenue: number;
}

export interface PeakHour {
  hour: number;
  orderCount: number;
}

export interface CustomerDemographics {
  ageGroups: AgeGroup[];
  genderDistribution: GenderDistribution;
  locationDistribution: LocationDistribution[];
}

export interface AgeGroup {
  range: string;
  percentage: number;
}

export interface GenderDistribution {
  male: number;
  female: number;
  other: number;
}

export interface LocationDistribution {
  city: string;
  percentage: number;
}

// Search types
export interface SearchFilters {
  category?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  deliveryTime?: number;
  cuisine?: string[];
  dietaryPreferences?: string[];
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  sortBy?: 'relevance' | 'rating' | 'price' | 'delivery_time' | 'distance';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult<T = unknown> {
  items: T[];
  total: number;
  filters: AppliedFilters;
  suggestions?: string[];
}

export interface AppliedFilters {
  categories: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  location?: string;
}

// File upload types
export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  key: string;
  category: string;
  isPublic: boolean;
  uploadedBy: string;
  createdAt: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  data?;
  isRead: boolean;
  isActionable: boolean;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
}

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export enum NotificationCategory {
  ORDER = 'ORDER',
  PAYMENT = 'PAYMENT',
  PROMOTION = 'PROMOTION',
  SYSTEM = 'SYSTEM',
  REVIEW = 'REVIEW',
  JOB = 'JOB',
  VENDOR = 'VENDOR',
}

// Error types
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  details?;
  timestamp: string;
  path: string;
}

// Additional API Types for compatibility
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  query?: string;
  filters?: Record<string, unknown>;
}

export interface OrderUpdate {
  orderId: string;
  status: string;
  message?: string;
  timestamp: string;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}
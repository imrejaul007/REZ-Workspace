/**
 * REZ-Consumer Type Definitions
 *
 * Comprehensive types for all consumer services including:
 * - User profile and authentication
 * - Wallet and payments
 * - Safe QR and emergency modes
 * - QR verification and authenticity
 * - Social connections
 * - Rewards and loyalty
 * - RiderCircle adventure mobility
 * - Airzy airport ecosystem
 * - Go4Food restaurant discovery
 */

// ============================================
// CORE TYPES
// ============================================

export interface ServiceConfig {
  name: string;
  version: string;
  port: number;
  environment: string;
}

// ============================================
// USER & AUTHENTICATION
// ============================================

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  avatar?: string;
  bloodGroup?: string;
  emergencyContacts: EmergencyContact[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  expiresAt?: Date;
}

export interface OTPRequest {
  phone: string;
  purpose: 'login' | 'verify' | 'emergency';
}

export interface OTPVerify {
  phone: string;
  otp: string;
}

// ============================================
// WALLET & PAYMENTS
// ============================================

export interface WalletBalance {
  userId: string;
  balance: number;
  currency: string;
  coins: number;
  cashback: number;
  lastUpdated: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  method: 'wallet' | 'upi' | 'card' | 'cashback';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  description: string;
  reference?: string;
  createdAt: Date;
}

export interface PaymentRequest {
  userId: string;
  amount: number;
  method: 'wallet' | 'upi' | 'card';
  description?: string;
  merchantId?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed';
  message?: string;
}

// ============================================
// SAFE QR - 15 EMERGENCY MODES
// ============================================

export type EmergencyMode =
  | 'accident'      // Road accident
  | 'breakdown'     // Vehicle breakdown
  | 'medical'       // Medical emergency
  | 'fire'          // Fire emergency
  | 'crime'         // Crime in progress
  | 'assault'       // Physical assault
  | 'harassment'    // Harassment/stalking
  | 'panic'         // Panic button
  | 'lost'          // Lost mode - device lost
  | 'kidnap'        // Kidnap alert
  | 'robbery'       // Robbery in progress
  | 'earthquake'    // Earthquake
  | 'flood'         // Flood emergency
  | 'safety'        // Personal safety
  | 'custom';       // Custom emergency

export interface SafeQRCode {
  id: string;
  userId: string;
  code: string;
  mode: EmergencyMode;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  scannedCount: number;
  lastScanned?: Date;
}

export interface SafeQREmergency {
  id: string;
  userId: string;
  mode: EmergencyMode;
  location?: GeoLocation;
  timestamp: Date;
  status: 'active' | 'resolved' | 'cancelled';
  responders: Responder[];
  messages: EmergencyMessage[];
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: Date;
}

export interface Responder {
  id: string;
  type: 'police' | 'ambulance' | 'fire' | 'contact' | 'volunteer';
  name?: string;
  phone?: string;
  status: 'notified' | 'dispatched' | 'arrived' | 'resolved';
  notifiedAt: Date;
  respondedAt?: Date;
}

export interface EmergencyMessage {
  id: string;
  senderId: string;
  senderType: 'user' | 'responder' | 'system';
  message: string;
  timestamp: Date;
}

// ============================================
// QR VERIFICATION - PRODUCT AUTHENTICITY
// ============================================

export interface VerifyQRCode {
  id: string;
  serialNumber: string;
  qrCode: string;
  productId: string;
  brandId: string;
  manufacturerId: string;
  manufacturedAt?: Date;
  warrantyMonths?: number;
  isAuthentic: boolean;
  scannedCount: number;
  lastScanned?: Date;
  verifiedAt?: Date;
}

export interface VerifyResult {
  isAuthentic: boolean;
  product?: ProductInfo;
  warranty?: WarrantyInfo;
  serviceCenters?: ServiceCenter[];
  claims?: ClaimInfo;
  brand?: BrandInfo;
}

export interface ProductInfo {
  id: string;
  name: string;
  category: string;
  brand: string;
  model?: string;
  imageUrl?: string;
  manufacturedAt?: Date;
  batchNumber?: string;
}

export interface WarrantyInfo {
  isValid: boolean;
  monthsRemaining?: number;
  expiresAt?: Date;
  status: 'active' | 'expired' | 'void';
  terms?: string;
}

export interface ServiceCenter {
  id: string;
  name: string;
  address: string;
  phone: string;
  distance?: number;
  isAuthorized: boolean;
}

export interface ClaimInfo {
  hasClaim: boolean;
  claimId?: string;
  status?: 'pending' | 'approved' | 'rejected';
  amount?: number;
  filedAt?: Date;
}

export interface BrandInfo {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  supportPhone?: string;
  supportEmail?: string;
}

// ============================================
// CREATOR QR - PERSONAL COMMERCE
// ============================================

export interface CreatorQRProfile {
  id: string;
  userId: string;
  businessName: string;
  tagline?: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  category: string;
  isVerified: boolean;
  followerCount: number;
  totalEarnings: number;
}

export interface CreatorProduct {
  id: string;
  creatorId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  stock: number;
  isActive: boolean;
  createdAt: Date;
}

export interface CreatorOrder {
  id: string;
  creatorId: string;
  buyerId: string;
  productId: string;
  quantity: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress?: Address;
  createdAt: Date;
}

// ============================================
// SOCIAL CONNECTIONS
// ============================================

export interface SocialConnection {
  id: string;
  userId: string;
  connectedUserId: string;
  type: 'friend' | 'family' | 'colleague' | 'neighbor' | 'custom';
  nickname?: string;
  strength: number; // 0-100
  createdAt: Date;
  lastInteraction?: Date;
}

export interface FamilyGroup {
  id: string;
  name: string;
  ownerId: string;
  members: FamilyMember[];
  inviteCode?: string;
  createdAt: Date;
}

export interface FamilyMember {
  userId: string;
  name: string;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export interface SocialFeed {
  id: string;
  userId: string;
  type: 'post' | 'share' | 'achievement';
  content: string;
  media?: string[];
  likes: number;
  comments: Comment[];
  createdAt: Date;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

// ============================================
// REWARDS & LOYALTY
// ============================================

export interface LoyaltyPoints {
  userId: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  lifetimePoints: number;
  pointsToNextTier: number;
  updatedAt: Date;
}

export interface Reward {
  id: string;
  userId: string;
  type: 'cashback' | 'discount' | 'voucher' | 'gift';
  title: string;
  description: string;
  value: number;
  currency: string;
  minPurchase?: number;
  expiresAt?: Date;
  isRedeemed: boolean;
  redeemedAt?: Date;
}

export interface KarmaScore {
  userId: string;
  score: number; // -100 to +100
  level: 'dark' | 'neutral' | 'light' | 'guardian' | 'legend';
  totalActions: number;
  positiveActions: number;
  negativeActions: number;
  lastAction?: Date;
}

export interface KarmaAction {
  id: string;
  userId: string;
  type: 'help_given' | 'help_received' | 'report_submitted' | 'emergency_responded' | 'community_support';
  description: string;
  points: number;
  timestamp: Date;
}

// ============================================
// RIDER CIRCLE - ADVENTURE MOBILITY
// ============================================

export interface RiderProfile {
  id: string;
  userId: string;
  displayName: string;
  phone: string;
  bloodGroup: string;
  emergencyContacts: EmergencyContact[];
  ridingStyle: 'commuter' | 'tourer' | 'adventure' | 'sport';
  trustScore: number; // 0-100
  totalRides: number;
  totalDistance: number;
  bikeIds: string[];
  safeQRCode?: string;
  createdAt: Date;
}

export interface BikeDigitalTwin {
  id: string;
  riderId: string;
  nickname: string;
  make: string;
  model: string;
  year?: number;
  registrationNumber?: string;
  odometer: number;
  overallHealth: number; // 0-100
  components: BikeComponents;
  lastService?: Date;
  nextServiceDue?: Date;
  createdAt: Date;
}

export interface BikeComponents {
  tireHealth: { front: number; rear: number };
  chainCondition: number;
  brakeHealth: { front: number; rear: number };
  engineHealth?: number;
  suspensionHealth?: number;
}

export interface Ride {
  id: string;
  riderId: string;
  bikeId: string;
  title: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
  route: RideRoute;
  stats: RideStats;
}

export interface RideRoute {
  startLocation?: GeoLocation;
  endLocation?: GeoLocation;
  distance: number; // meters
  track: GPSPoint[];
  waypoints: Waypoint[];
}

export interface GPSPoint {
  coordinates: [number, number]; // [longitude, latitude]
  speed?: number; // km/h
  altitude?: number; // meters
  timestamp: Date;
}

export interface Waypoint {
  name: string;
  type: 'fuel' | 'food' | 'rest' | 'scenic' | 'custom';
  coordinates: [number, number];
}

export interface RideStats {
  distance: number;
  duration: number; // seconds
  avgSpeed: number;
  maxSpeed: number;
  caloriesBurned?: number;
}

export interface SOSAlert {
  id: string;
  riderId: string;
  rideId?: string;
  type: EmergencyMode;
  location: GeoLocation;
  status: 'active' | 'responding' | 'resolved' | 'cancelled';
  createdAt: Date;
  responders: SOSResponder[];
}

export interface SOSResponder {
  id: string;
  name: string;
  type: 'rider' | 'mechanic' | 'ambulance' | 'police';
  distance?: number;
  eta?: number; // minutes
  status: 'en_route' | 'arrived' | 'helping';
}

// ============================================
// AIRZY - AIRPORT ECOSYSTEM
// ============================================

export interface AirzyUser {
  id: string;
  userId: string;
  membershipTier: 'basic' | 'silver' | 'gold' | 'platinum';
  passportNumber?: string;
  frequentFlyerNumber?: string;
  preferences: AirzyPreferences;
}

export interface AirzyPreferences {
  seatPreference?: 'window' | 'aisle' | 'middle';
  mealPreference?: string;
  specialAssistance?: string[];
  loungeAccess: boolean;
  priorityBoarding: boolean;
}

export interface FlightBooking {
  id: string;
  userId: string;
  pnr: string;
  airline: string;
  flightNumber: string;
  departure: FlightEndpoint;
  arrival: FlightEndpoint;
  class: 'economy' | 'premium_economy' | 'business' | 'first';
  status: 'confirmed' | 'check_in' | 'boarded' | 'departed' | 'arrived' | 'cancelled';
  seatNumber?: string;
  baggage?: BaggageInfo;
}

export interface FlightEndpoint {
  airport: string;
  city: string;
  terminal?: string;
  gate?: string;
  scheduledTime: Date;
  actualTime?: Date;
}

export interface BaggageInfo {
  checkIn: number;
  cabin: number;
  weight?: number;
}

export interface AirportLounge {
  id: string;
  airport: string;
  terminal: string;
  name: string;
  amenities: string[];
  accessTier: 'basic' | 'silver' | 'gold' | 'platinum';
  capacity: number;
  currentOccupancy?: number;
  rating?: number;
}

export interface AirportTransfer {
  id: string;
  userId: string;
  type: 'pickup' | 'dropoff';
  airport: string;
  vehicleType: 'sedan' | 'suv' | 'premium' | 'luxury';
  pickupLocation: string;
  dropoffLocation: string;
  scheduledTime: Date;
  status: 'pending' | 'confirmed' | 'driver_assigned' | 'en_route' | 'completed' | 'cancelled';
  driver?: DriverInfo;
  price: number;
}

export interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  rating: number;
  vehicleNumber?: string;
  vehicleModel?: string;
}

// ============================================
// GO4FOOD - RESTAURANT DISCOVERY
// ============================================

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string[];
  rating: number;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  address: string;
  city: string;
  location: GeoLocation;
  distance?: number;
  deliveryTime?: string;
  minimumOrder?: number;
  deliveryFee?: number;
  isOpen: boolean;
  imageUrl?: string;
  menuUrl?: string;
  platforms: string[]; // swiggy, zomato, etc.
}

export interface RestaurantMenu {
  restaurantId: string;
  categories: MenuCategory[];
  lastUpdated: Date;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  imageUrl?: string;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTime?: string;
  calories?: number;
  ratings?: number;
  platformPrices?: PlatformPrice[];
}

export interface PlatformPrice {
  platform: string;
  price: number;
  discount?: number;
  url?: string;
}

export interface FoodSearch {
  query: string;
  filters?: {
    cuisine?: string[];
    priceRange?: string[];
    rating?: number;
    deliveryTime?: number;
    distance?: number;
  };
  location?: GeoLocation;
}

export interface FoodAdvisor {
  preferences: string[];
  restrictions: string[];
  budget?: number;
  healthGoals?: string[];
  recentOrders?: string[];
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  timestamp: Date;
  checks: Record<string, boolean>;
}

// ============================================
// ADDRESS TYPES
// ============================================

export interface Address {
  id?: string;
  type: 'home' | 'work' | 'other';
  name: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: GeoLocation;
  instructions?: string;
}

// ============================================
// REQUEST/RESPONSE INTERFACES
// ============================================

export interface CreateSafeQROptions {
  mode: EmergencyMode;
  expiresIn?: number; // hours
  shareWithContacts?: boolean;
}

export interface VerifyQROptions {
  includeWarranty?: boolean;
  includeServiceCenters?: boolean;
  includeClaims?: boolean;
}

export interface CreateOrderOptions {
  productId: string;
  quantity: number;
  shippingAddress?: Address;
  paymentMethod?: 'wallet' | 'upi' | 'card';
  couponCode?: string;
}

export interface RideTrackingOptions {
  includeWeather?: boolean;
  includeTraffic?: boolean;
  includePOI?: boolean;
}

export interface FlightSearchOptions {
  from: string;
  to: string;
  date: Date;
  returnDate?: Date;
  passengers: number;
  class?: 'economy' | 'premium_economy' | 'business' | 'first';
  airline?: string;
}

export interface RestaurantSearchOptions {
  query?: string;
  cuisines?: string[];
  priceRange?: string[];
  rating?: number;
  openNow?: boolean;
  deliveryAvailable?: boolean;
  sortBy?: 'rating' | 'distance' | 'price' | 'delivery_time';
}
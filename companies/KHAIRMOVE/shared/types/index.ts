// KHAIRMOVE Shared Types
// Canonical type definitions for all KHAIRMOVE services

// ============================================
// ENUMS
// ============================================

export enum VehicleType {
  BIKE = 'bike',
  AUTO = 'auto',
  CAB = 'cab',
  SUV = 'suv',
}

export enum RideStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  ARRIVED = 'arrived',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum DriverStatus {
  OFFLINE = 'offline',
  ONLINE = 'online',
  BUSY = 'busy',
  IN_RIDE = 'in_ride',
}

export enum PaymentMethod {
  WALLET = 'wallet',
  RAZORPAY = 'razorpay',
  UPI = 'upi',
  CASH = 'cash',
}

export enum DeliveryStatus {
  PENDING = 'pending',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETURNED = 'returned',
}

export enum DeliveryPriority {
  STANDARD = 'standard',
  EXPRESS = 'express',
  INSTANT = 'instant',
}

export enum FleetStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive',
}

export enum RentalStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  ON_RENTAL = 'on_rental',
  MAINTENANCE = 'maintenance',
}

// ============================================
// CORE INTERFACES
// ============================================

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  pincode?: string;
}

export interface LocationUpdate {
  driverId: string;
  location: Location;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

export interface FareEstimate {
  vehicleType: VehicleType;
  baseFare: number;
  perKmRate: number;
  perMinRate: number;
  estimatedFare: number;
  estimatedDistance: number;
  estimatedDuration: number;
  surgeMultiplier?: number;
  discount?: number;
  finalFare?: number;
}

export interface RideRequest {
  userId: string;
  pickup: Location;
  drop: Location;
  vehicleType: VehicleType;
  scheduledTime?: Date;
  couponCode?: string;
  notes?: string;
}

export interface Ride {
  id: string;
  userId: string;
  driverId?: string;
  pickup: Location;
  drop: Location;
  vehicleType: VehicleType;
  status: RideStatus;
  fare: FareDetails;
  paymentMethod: PaymentMethod;
  otp?: string;
  requestedAt: Date;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  rating?: number;
  feedback?: string;
  route?: RouteDetails;
}

export interface FareDetails {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeFare: number;
  discount: number;
  couponAmount: number;
  subtotal: number;
  cashback: number;
  finalFare: number;
}

export interface RouteDetails {
  distance: number;
  duration: number;
  polyline: string;
  waypoints?: Location[];
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  profileImage?: string;
  vehicle?: Vehicle;
  currentLocation?: Location;
  status: DriverStatus;
  rating: number;
  totalRides: number;
  documents: DriverDocuments;
  bankDetails?: BankDetails;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  driverId: string;
  type: VehicleType;
  make: string;
  model: string;
  year: number;
  color: string;
  registrationNumber: string;
  insuranceExpiry: Date;
  pollutionCertExpiry: Date;
  imageUrls: string[];
  isVerified: boolean;
}

export interface DriverDocuments {
  license: DocumentInfo;
  rcBook: DocumentInfo;
  aadhar: DocumentInfo;
  policeVerification?: DocumentInfo;
}

export interface DocumentInfo {
  number: string;
  imageUrl: string;
  expiryDate?: Date;
  verified: boolean;
}

export interface BankDetails {
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
}

// ============================================
// DELIVERY INTERFACES
// ============================================

export interface DeliveryRequest {
  id?: string;
  userId: string;
  pickup: Location;
  drop: Location;
  items: DeliveryItem[];
  priority: DeliveryPriority;
  receiverName?: string;
  receiverPhone?: string;
  instructions?: string;
  estimatedWeight?: number;
}

export interface DeliveryItem {
  name: string;
  quantity: number;
  weight?: number;
  description?: string;
  imageUrl?: string;
}

export interface Delivery {
  id: string;
  requestId: string;
  userId: string;
  driverId?: string;
  pickup: Location;
  drop: Location;
  items: DeliveryItem[];
  status: DeliveryStatus;
  priority: DeliveryPriority;
  otp?: string;
  fare: DeliveryFare;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  proofOfDelivery?: DeliveryProof;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryFare {
  baseFare: number;
  weightFare: number;
  distanceFare: number;
  priorityFare: number;
  totalFare: number;
  cashback: number;
}

export interface DeliveryProof {
  otpVerified: boolean;
  signature?: string;
  photoUrl?: string;
  notes?: string;
}

// ============================================
// FLEET INTERFACES
// ============================================

export interface Fleet {
  id: string;
  name: string;
  ownerId: string;
  vehicles: string[];
  drivers: string[];
  status: FleetStatus;
  stats: FleetStats;
  createdAt: Date;
}

export interface FleetVehicle extends Vehicle {
  fleetId: string;
  assignedDriverId?: string;
  status: FleetStatus;
  lastServiceDate?: Date;
  nextServiceDate?: Date;
  odometer: number;
  fuelLevel?: number;
}

export interface FleetStats {
  totalVehicles: number;
  activeVehicles: number;
  totalRides: number;
  totalEarnings: number;
  averageRating: number;
  utilizationRate: number;
}

export interface DispatchRequest {
  fleetId: string;
  pickup: Location;
  drop: Location;
  vehicleType: VehicleType;
  scheduledTime?: Date;
  priority?: DeliveryPriority;
}

export interface DispatchResult {
  assigned: boolean;
  driverId?: string;
  estimatedPickupTime?: Date;
  alternatives?: string[];
}

// ============================================
// RENTAL INTERFACES
// ============================================

export interface RentalPackage {
  id: string;
  vehicleType: VehicleType;
  duration: number; // hours
  name: string;
  description: string;
  price: number;
  includesKms: number;
  extraKmRate: number;
  extraHrRate: number;
  available: boolean;
}

export interface RentalBooking {
  id: string;
  userId: string;
  driverId?: string;
  packageId: string;
  vehicleType: VehicleType;
  pickup: Location;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  status: RentalStatus;
  fare: RentalFare;
  startOdometer?: number;
  endOdometer?: number;
  totalKms?: number;
  totalHours?: number;
}

export interface RentalFare {
  packagePrice: number;
  extraHours: number;
  extraKms: number;
  totalFare: number;
  deposit: number;
  depositStatus: 'pending' | 'held' | 'refunded';
}

// ============================================
// SUBSCRIPTION INTERFACES
// ============================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  benefits: SubscriptionBenefit[];
  surgeDiscount: number;
  freeCancellations: number;
  extraCashback: number;
  features: string[];
}

export interface SubscriptionBenefit {
  type: 'cashback' | 'discount' | 'free_ride' | 'lounge' | 'priority';
  value: number;
  description: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  cancellationsUsed: number;
}

// ============================================
// ANALYTICS & INSIGHTS
// ============================================

export interface RideAnalytics {
  date: string;
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  totalDistance: number;
  totalEarnings: number;
  averageFare: number;
  averageRating: number;
  peakHours: PeakHourData[];
}

export interface PeakHourData {
  hour: number;
  rideCount: number;
  averageFare: number;
  surgeMultiplier: number;
}

export interface DriverAnalytics {
  driverId: string;
  date: string;
  totalRides: number;
  totalEarnings: number;
  totalDistance: number;
  totalHours: number;
  averageRating: number;
  acceptanceRate: number;
  cancellationRate: number;
}

export interface DemandHeatmap {
  lat: number;
  lng: number;
  intensity: number;
  rideCount: number;
  avgWaitTime: number;
}

// ============================================
// SAFETY & SOS
// ============================================

export interface SOSAlert {
  id: string;
  rideId: string;
  type: 'emergency' | 'accident' | 'harassment';
  userId: string;
  driverId?: string;
  location: Location;
  timestamp: Date;
  status: 'active' | 'resolved' | 'escalated';
  resolvedAt?: Date;
  notes?: string;
}

export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  relation: string;
  notifyOnRide: boolean;
}

// ============================================
// CORPORATE INTERFACES
// ============================================

export interface CorporateAccount {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstin?: string;
  address: Location;
  creditLimit: number;
  usedCredit: number;
  balance: number;
  employees: string[];
  policies: CorporatePolicy;
  createdAt: Date;
}

export interface CorporatePolicy {
  maxPerRide: number;
  allowedVehicleTypes: VehicleType[];
  allowedDays: number[];
  blackoutDates?: Date[];
  requiresApproval: boolean;
  approvers?: string[];
}

// ============================================
// VOUCHER & CAMPAIGN
// ============================================

export interface Voucher {
  id: string;
  code: string;
  type: 'discount' | 'cashback' | 'free_ride';
  value: number;
  minOrderValue: number;
  maxDiscount: number;
  validFrom: Date;
  validTo: Date;
  usageLimit: number;
  usedCount: number;
  userLimit: number;
  applicableVehicles?: VehicleType[];
  isActive: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'surge' | 'discount' | 'cashback' | 'awareness';
  targetAreas: Location[];
  radius: number;
  startDate: Date;
  endDate: Date;
  budget: number;
  spent: number;
  stats: CampaignStats;
  isActive: boolean;
}

export interface CampaignStats {
  impressions: number;
  rides: number;
  conversions: number;
  revenue: number;
  cashback: number;
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================
// REAL-TIME EVENTS
// ============================================

export interface RideEvent {
  type: 'ride.requested' | 'ride.accepted' | 'ride.arrived' | 'ride.started' | 'ride.completed' | 'ride.cancelled';
  rideId: string;
  userId: string;
  driverId?: string;
  location?: Location;
  timestamp: Date;
  data?: Record<string, unknown>;
}

export interface DriverLocationEvent {
  driverId: string;
  location: Location;
  status: DriverStatus;
  timestamp: Date;
}

export interface DemandUpdateEvent {
  areaId: string;
  lat: number;
  lng: number;
  activeDrivers: number;
  pendingRequests: number;
  surgeMultiplier: number;
  timestamp: Date;
}

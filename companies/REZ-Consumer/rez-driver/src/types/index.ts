// ============================================================================
// DELIVERY TYPES - All supported delivery/mobility service types
// ============================================================================

/**
 * DeliveryType - All supported service types in the REZ platform
 * Organized by category:
 * - Delivery services (Phase 1-2)
 * - Mobility services (Phase 3-4)
 */
export type DeliveryType =
  // Delivery Services
  | 'food'
  | 'grocery'
  | 'medicine'
  | 'courier'
  | 'furniture'
  // Mobility Services (Future)
  | 'cab'
  | 'ride_share';

// ============================================================================
// DELIVERY SUBTYPES - Specific categories within each delivery type
// ============================================================================

export type FoodDeliverySubtype = 'restaurant' | 'fast_food' | 'cafe' | 'bakery' | 'dessert';
export type GroceryDeliverySubtype = 'supermarket' | 'convenience' | 'farmers_market' | 'organic';
export type MedicineDeliverySubtype = 'pharmacy' | 'prescription' | 'otc' | 'medical_supplies';
export type CourierDeliverySubtype = 'document' | 'package' | 'fragile' | 'express' | 'overnight';
export type FurnitureDeliverySubtype = 'small_appliance' | 'flat_pack' | 'full_furniture' | 'assembly_required';
export type CabSubtype = 'standard' | 'premium' | 'suv' | 'van';
export type RideShareSubtype = 'economy' | 'comfort' | 'pool' | 'women_only';

// ============================================================================
// VEHICLE TYPES - Vehicles supported by the driver
// ============================================================================

export type VehicleType =
  // Personal Vehicles
  | 'bicycle'
  | 'motorcycle'
  | 'car_sedan'
  | 'car_suv'
  | 'car_van'
  | 'car_pickup'
  // Commercial Vehicles
  | 'cargo_bike'
  | 'delivery_van'
  | 'delivery_truck'
  | 'flatbed';

// ============================================================================
// VEHICLE CATEGORIES - Groupings for filtering and matching
// ============================================================================

export type VehicleCategory = 'bike' | 'motorcycle' | 'car' | 'van' | 'truck';

// ============================================================================
// VEHICLE CAPACITY - Capacity information for different vehicles
// ============================================================================

export interface VehicleCapacity {
  maxWeight: number; // in kg
  maxVolume: number; // in liters
  maxDimensions: {
    length: number; // in cm
    width: number; // in cm
    height: number; // in cm
  };
  maxItems: number;
}

// ============================================================================
// VEHICLE INFO - Complete vehicle information
// ============================================================================

export interface VehicleInfo {
  type: VehicleType;
  category: VehicleCategory;
  make?: string;
  model?: string;
  year?: number;
  licensePlate: string;
  color?: string;
  capacity: VehicleCapacity;
  isElectric: boolean;
  isVerified: boolean;
  registrationExpiry?: Date;
  insuranceExpiry?: Date;
}

// ============================================================================
// DELIVERY TYPE INFO - Metadata for each delivery type
// ============================================================================

export interface DeliveryTypeInfo {
  type: DeliveryType;
  name: string;
  description: string;
  icon: string;
  color: string;
  estimatedPickupTime: number; // in minutes
  baseEarning: number;
  perKmRate: number;
  perKgRate: number;
  peakMultiplier: number;
  requiresInsulation?: boolean;
  requiresAssembly?: boolean;
  isHazmatAllowed?: boolean;
  vehicleRequirements: VehicleCategory[];
}

// ============================================================================
// DELIVERY TYPE CONFIG - Per-delivery-type earnings breakdown
// ============================================================================

export interface DeliveryTypeEarnings {
  baseFee: number;
  distanceFee: number;
  weightFee: number;
  volumeFee: number;
  surgeMultiplier: number;
  tip: number;
  bonus: number;
  total: number;
  breakdown: {
    pickup: number;
    perKm: number;
    perKg: number;
    handling: number;
    delivery: number;
  };
}

// ============================================================================
// DELIVERY STATUS - All possible delivery states
// ============================================================================

export type DeliveryStatus =
  | 'pending'        // Awaiting driver acceptance
  | 'accepted'       // Driver accepted, heading to pickup
  | 'arrived_pickup' // Driver arrived at pickup location
  | 'picked_up'      // Package collected from merchant
  | 'in_transit'     // On the way to customer
  | 'arrived_dropoff' // Driver arrived at destination
  | 'delivered'      // Successfully delivered
  | 'cancelled'      // Cancelled by driver, merchant, or system
  | 'failed';        // Delivery attempt failed

// ============================================================================
// RIDE STATUS - Status for cab/ride-share trips
// ============================================================================

export type RideStatus =
  | 'pending'        // Awaiting driver acceptance
  | 'accepted'       // Driver accepted, heading to pickup
  | 'arrived'        // Driver arrived at pickup
  | 'in_progress'    // Trip in progress
  | 'completed'      // Trip completed
  | 'cancelled'      // Cancelled
  | 'no_show';       // Customer/Rider no-show

// ============================================================================
// LOCATION - Geographic location with optional metadata
// ============================================================================

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  instructions?: string;
  landmark?: string;
  floor?: string;
  accessCode?: string;
}

// ============================================================================
// DRIVER - Driver profile and information
// ============================================================================

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  rating: number;
  totalDeliveries: number;
  totalRides: number;
  isOnline: boolean;
  isAvailable: boolean;
  currentLocation?: Location;
  registeredVehicles: VehicleInfo[];
  activeVehicle?: VehicleInfo;
  deliveryTypes: DeliveryType[]; // Services driver is registered for
  workingZones: string[];
  createdAt: Date;
  documentsVerified: boolean;
  backgroundChecked: boolean;
}

// ============================================================================
// MERCHANT - Business/organization for deliveries
// ============================================================================

export interface Merchant {
  id: string;
  name: string;
  phone: string;
  address: string;
  location: Location;
  logo?: string;
  rating?: number;
  deliveryTypes: DeliveryType[];
  prepTime?: number; // Average preparation time in minutes
}

// ============================================================================
// CUSTOMER - End customer/recipient
// ============================================================================

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  location?: Location;
  rating?: number;
}

// ============================================================================
// PACKAGE - Item/package information for deliveries
// ============================================================================

export interface Package {
  id: string;
  description: string;
  category?: string;
  weight?: number; // in kg
  dimensions?: {
    length: number; // in cm
    width: number;  // in cm
    height: number; // in cm
  };
  image?: string;
  quantity: number;
  price?: number;
  isFragile?: boolean;
  isPerishable?: boolean;
  requiresSignature?: boolean;
  barcode?: string;
}

// ============================================================================
// DELIVERY - Core delivery object
// ============================================================================

export interface Delivery {
  id: string;
  orderId: string;
  deliveryType: DeliveryType;
  status: DeliveryStatus;
  driver?: Driver;
  merchant: Merchant;
  customer: Customer;
  packages: Package[];
  pickupLocation: Location;
  deliveryLocation: Location;
  estimatedPickupTime?: Date;
  estimatedDeliveryTime?: Date;
  actualPickupTime?: Date;
  actualDeliveryTime?: Date;
  distance: number; // in kilometers
  duration: number; // in minutes
  totalWeight: number; // calculated from packages, in kg
  totalVolume: number; // calculated from packages, in liters
  fee: number;
  tip?: number;
  surgeFee?: number;
  totalEarnings: number;
  earningsBreakdown: DeliveryTypeEarnings;
  specialInstructions?: string;
  proofOfDelivery?: {
    signature?: string;
    photo?: string;
    timestamp: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date; // Time by which request expires if not accepted
}

// ============================================================================
// RIDE - Cab/ride-share trip object
// ============================================================================

export interface Ride {
  id: string;
  bookingId: string;
  rideType: CabSubtype | RideShareSubtype;
  status: RideStatus;
  driver?: Driver;
  customer: Customer;
  pickupLocation: Location;
  dropoffLocation: Location;
  estimatedPickupTime?: Date;
  estimatedArrival?: Date;
  actualPickupTime?: Date;
  actualDropoffTime?: Date;
  distance: number; // in kilometers
  duration: number; // in minutes
  vehicle?: VehicleInfo;
  fare: number;
  tip?: number;
  surgeMultiplier?: number;
  totalEarnings: number;
  estimatedEarnings: number;
  route?: {
    polyline: string;
    waypoints?: Location[];
  };
  passengerCount?: number;
  flightNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// EARNINGS TYPES
// ============================================================================

export interface EarningTransaction {
  id: string;
  deliveryId?: string;
  rideId?: string;
  type: 'delivery' | 'ride' | 'bonus' | 'adjustment' | 'withdrawal' | 'surge' | 'peak';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  deliveryType?: DeliveryType;
  createdAt: Date;
}

export interface DailyEarnings {
  date: string;
  totalEarnings: number;
  totalDeliveries: number;
  totalRides: number;
  totalDistance: number;
  totalHours: number;
  bonus: number;
  breakdown: {
    food: number;
    grocery: number;
    medicine: number;
    courier: number;
    furniture: number;
    cab: number;
    rideShare: number;
  };
}

export interface WeeklyEarnings {
  weekStart: string;
  weekEnd: string;
  totalEarnings: number;
  totalDeliveries: number;
  totalRides: number;
  dailyAverage: number;
  dailyBreakdown: DailyEarnings[];
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface Notification {
  id: string;
  type: 'delivery_request' | 'ride_request' | 'delivery_update' | 'ride_update' | 'earnings' | 'system';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  deliveryType?: DeliveryType;
  read: boolean;
  createdAt: Date;
}

// ============================================================================
// DELIVERY REQUEST - Request object shown to drivers
// ============================================================================

export interface DeliveryRequest {
  delivery: Delivery;
  estimatedEarnings: number;
  surgeActive: boolean;
  surgeMultiplier: number;
  distance: number;
  duration: number;
  expiresIn: number; // seconds until request expires
  requiresVehicle?: VehicleCategory[];
  isPriority?: boolean;
  isScheduled?: boolean;
}

// ============================================================================
// RIDE REQUEST - Request object for cab/ride-share
// ============================================================================

export interface RideRequest {
  ride: Ride;
  estimatedEarnings: number;
  surgeActive: boolean;
  surgeMultiplier: number;
  pickupDistance: number;
  estimatedPickupTime: number;
  expiresIn: number;
  requiresVehicle?: VehicleCategory[];
}

// ============================================================================
// SETTINGS TYPES
// ============================================================================

export interface DriverSettings {
  notifications: {
    sound: boolean;
    vibration: boolean;
    deliveryRequests: boolean;
    rideRequests: boolean;
    earningsUpdates: boolean;
    promotions: boolean;
  };
  availability: {
    autoAccept: boolean;
    preferNearMe: boolean;
    maxDistance: number; // in km
    maxWeight: number; // in kg
    workingHours: {
      enabled: boolean;
      start: string; // HH:mm format
      end: string;
    };
  };
  deliveryTypes: {
    food: boolean;
    grocery: boolean;
    medicine: boolean;
    courier: boolean;
    furniture: boolean;
    cab: boolean;
    rideShare: boolean;
  };
  navigation: {
    preferredApp: 'google' | 'waze' | 'apple';
    avoidHighways: boolean;
    avoidTolls: boolean;
  };
  privacy: {
    showPhoneToMerchant: boolean;
    showPhoneToCustomer: boolean;
    showPhoneToRider: boolean;
  };
  safety: {
    recordAudio: boolean;
    shareTrip: boolean;
    emergencyContact?: string;
  };
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// LOCATION UPDATE TYPE
// ============================================================================

export interface LocationUpdate {
  driverId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  heading?: number;
  speed?: number;
  timestamp: Date;
}

// ============================================================================
// FLEET TYPES - For fleet management (Phase 4)
// ============================================================================

export interface FleetVehicle {
  id: string;
  fleetId: string;
  vehicleInfo: VehicleInfo;
  assignedDriver?: Driver;
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  currentDelivery?: Delivery;
  currentRide?: Ride;
  odometer: number;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
}

export interface Fleet {
  id: string;
  name: string;
  ownerId: string;
  vehicles: FleetVehicle[];
  totalDrivers: number;
  activeDrivers: number;
  createdAt: Date;
}

// ============================================================================
// DELIVERY TYPE CONSTANTS
// ============================================================================

export const DELIVERY_TYPE_CONFIG: Record<DeliveryType, DeliveryTypeInfo> = {
  food: {
    type: 'food',
    name: 'Food Delivery',
    description: 'Restaurant and food deliveries',
    icon: 'restaurant',
    color: '#FF6B35',
    estimatedPickupTime: 15,
    baseEarning: 5.00,
    perKmRate: 1.50,
    perKgRate: 0.50,
    peakMultiplier: 1.5,
    requiresInsulation: true,
    vehicleRequirements: ['bike', 'motorcycle', 'car', 'van'],
  },
  grocery: {
    type: 'grocery',
    name: 'Grocery Delivery',
    description: 'Supermarket and convenience items',
    icon: 'shopping-cart',
    color: '#4CAF50',
    estimatedPickupTime: 20,
    baseEarning: 6.00,
    perKmRate: 2.00,
    perKgRate: 0.75,
    peakMultiplier: 1.3,
    vehicleRequirements: ['bike', 'motorcycle', 'car', 'van'],
  },
  medicine: {
    type: 'medicine',
    name: 'Medicine Delivery',
    description: 'Pharmacy and medical supplies',
    icon: 'medical-bag',
    color: '#2196F3',
    estimatedPickupTime: 10,
    baseEarning: 7.00,
    perKmRate: 2.50,
    perKgRate: 0.30,
    peakMultiplier: 1.4,
    vehicleRequirements: ['bike', 'motorcycle', 'car', 'van'],
  },
  courier: {
    type: 'courier',
    name: 'Courier Service',
    description: 'Documents and packages',
    icon: 'package-variant',
    color: '#9C27B0',
    estimatedPickupTime: 30,
    baseEarning: 8.00,
    perKmRate: 3.00,
    perKgRate: 1.00,
    peakMultiplier: 1.2,
    vehicleRequirements: ['bike', 'motorcycle', 'car', 'van', 'truck'],
  },
  furniture: {
    type: 'furniture',
    name: 'Furniture Delivery',
    description: 'Large items and furniture',
    icon: 'sofa',
    color: '#795548',
    estimatedPickupTime: 45,
    baseEarning: 15.00,
    perKmRate: 4.00,
    perKgRate: 2.00,
    peakMultiplier: 1.1,
    requiresAssembly: true,
    vehicleRequirements: ['van', 'truck'],
  },
  cab: {
    type: 'cab',
    name: 'Cab Service',
    description: 'Premium cab rides',
    icon: 'car',
    color: '#FFC107',
    estimatedPickupTime: 5,
    baseEarning: 5.00,
    perKmRate: 2.50,
    perKgRate: 0,
    peakMultiplier: 2.0,
    vehicleRequirements: ['car'],
  },
  ride_share: {
    type: 'ride_share',
    name: 'Ride Sharing',
    description: 'Shared rides with multiple passengers',
    icon: 'account-group',
    color: '#00BCD4',
    estimatedPickupTime: 5,
    baseEarning: 4.00,
    perKmRate: 1.80,
    perKgRate: 0,
    peakMultiplier: 1.8,
    vehicleRequirements: ['car'],
  },
};

// ============================================================================
// VEHICLE CAPACITY CONSTANTS
// ============================================================================

export const VEHICLE_CAPACITY: Record<VehicleType, VehicleCapacity> = {
  bicycle: { maxWeight: 15, maxVolume: 50, maxDimensions: { length: 40, width: 30, height: 40 }, maxItems: 3 },
  motorcycle: { maxWeight: 30, maxVolume: 80, maxDimensions: { length: 50, width: 40, height: 40 }, maxItems: 5 },
  car_sedan: { maxWeight: 100, maxVolume: 400, maxDimensions: { length: 80, width: 60, height: 50 }, maxItems: 15 },
  car_suv: { maxWeight: 200, maxVolume: 600, maxDimensions: { length: 100, width: 70, height: 60 }, maxItems: 20 },
  car_van: { maxWeight: 500, maxVolume: 1200, maxDimensions: { length: 150, width: 100, height: 80 }, maxItems: 50 },
  car_pickup: { maxWeight: 800, maxVolume: 1500, maxDimensions: { length: 180, width: 120, height: 80 }, maxItems: 30 },
  cargo_bike: { maxWeight: 50, maxVolume: 150, maxDimensions: { length: 60, width: 50, height: 50 }, maxItems: 10 },
  delivery_van: { maxWeight: 1000, maxVolume: 2500, maxDimensions: { length: 200, width: 120, height: 100 }, maxItems: 100 },
  delivery_truck: { maxWeight: 3000, maxVolume: 8000, maxDimensions: { length: 300, width: 150, height: 150 }, maxItems: 200 },
  flatbed: { maxWeight: 5000, maxVolume: 15000, maxDimensions: { length: 400, width: 200, height: 200 }, maxItems: 500 },
};

export const VEHICLE_CATEGORIES: Record<VehicleCategory, VehicleType[]> = {
  bike: ['bicycle', 'cargo_bike'],
  motorcycle: ['motorcycle'],
  car: ['car_sedan', 'car_suv', 'car_van', 'car_pickup'],
  van: ['delivery_van', 'car_van'],
  truck: ['delivery_truck', 'flatbed', 'car_pickup'],
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export * from './index';

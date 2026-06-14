import {
  Driver,
  Delivery,
  DeliveryStatus,
  DeliveryType,
  DailyEarnings,
  EarningTransaction,
  Notification,
  Location,
  VehicleInfo,
  VehicleType,
  VEHICLE_CAPACITY,
  Ride,
  RideStatus,
  DeliveryTypeEarnings,
} from '../types';

// ============================================================================
// VEHICLE INFO
// ============================================================================

const createVehicle = (type: VehicleType): VehicleInfo => ({
  type,
  category: getVehicleCategory(type),
  licensePlate: `${type.substring(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
  capacity: VEHICLE_CAPACITY[type],
  isElectric: type.includes('bike') || Math.random() > 0.7,
  isVerified: true,
  registrationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  insuranceExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
});

const getVehicleCategory = (type: VehicleType): 'bike' | 'motorcycle' | 'car' | 'van' | 'truck' => {
  if (type.includes('bike')) return 'bike';
  if (type.includes('motorcycle')) return 'motorcycle';
  if (type.includes('van') || type.includes('truck') || type === 'car_van') return 'van';
  if (type === 'flatbed' || type === 'delivery_truck') return 'truck';
  return 'car';
};

// ============================================================================
// MOCK DRIVER
// ============================================================================

export const mockDriver: Driver = {
  id: 'driver_001',
  name: 'John Martinez',
  email: 'john.martinez@rez.delivery',
  phone: '+1 (555) 123-4567',
  avatar: 'https://i.pravatar.cc/150?img=11',
  rating: 4.8,
  totalDeliveries: 1247,
  totalRides: 0,
  isOnline: true,
  isAvailable: true,
  currentLocation: {
    latitude: 37.7749,
    longitude: -122.4194,
    address: '123 Main St, San Francisco, CA',
  },
  registeredVehicles: [
    createVehicle('car_sedan'),
    createVehicle('bicycle'),
  ],
  activeVehicle: createVehicle('car_sedan'),
  deliveryTypes: ['food', 'grocery', 'medicine', 'courier', 'furniture'],
  workingZones: ['zone_001', 'zone_002', 'zone_003'],
  createdAt: new Date('2023-06-15'),
  documentsVerified: true,
  backgroundChecked: true,
};

// ============================================================================
// MERCHANT DATA BY DELIVERY TYPE
// ============================================================================

const merchantsByType: Record<DeliveryType, Omit<import('../types').Merchant, 'id' | 'phone' | 'address' | 'location'>[]> = {
  food: [
    {
      name: 'Sakura Sushi',
      location: { latitude: 37.7849, longitude: -122.4094, address: '456 Market St, San Francisco, CA' },
      logo: 'https://example.com/sakura.png',
      rating: 4.9,
      deliveryTypes: ['food'],
      prepTime: 15,
    },
    {
      name: 'Burger Palace',
      location: { latitude: 37.7649, longitude: -122.3994, address: '789 Mission St, San Francisco, CA' },
      logo: 'https://example.com/burger.png',
      rating: 4.5,
      deliveryTypes: ['food'],
      prepTime: 12,
    },
    {
      name: 'Green Garden Thai',
      location: { latitude: 37.7899, longitude: -122.3944, address: '321 Howard St, San Francisco, CA' },
      logo: 'https://example.com/green.png',
      rating: 4.7,
      deliveryTypes: ['food'],
      prepTime: 18,
    },
  ],
  grocery: [
    {
      name: 'Fresh Mart Supermarket',
      location: { latitude: 37.7799, longitude: -122.4144, address: '500 Market St, San Francisco, CA' },
      rating: 4.6,
      deliveryTypes: ['grocery'],
      prepTime: 20,
    },
    {
      name: 'QuickStop Convenience',
      location: { latitude: 37.7699, longitude: -122.4244, address: '200 Van Ness Ave, San Francisco, CA' },
      rating: 4.2,
      deliveryTypes: ['grocery'],
      prepTime: 10,
    },
  ],
  medicine: [
    {
      name: 'HealthPlus Pharmacy',
      location: { latitude: 37.7749, longitude: -122.4044, address: '350 California St, San Francisco, CA' },
      rating: 4.8,
      deliveryTypes: ['medicine'],
      prepTime: 5,
    },
  ],
  courier: [
    {
      name: 'SwiftDoc Delivery',
      location: { latitude: 37.7829, longitude: -122.3994, address: '150 Fremont St, San Francisco, CA' },
      rating: 4.9,
      deliveryTypes: ['courier'],
      prepTime: 10,
    },
    {
      name: 'Express Pak',
      location: { latitude: 37.7679, longitude: -122.3944, address: '600 Howard St, San Francisco, CA' },
      rating: 4.4,
      deliveryTypes: ['courier'],
      prepTime: 15,
    },
  ],
  furniture: [
    {
      name: 'HomeStyle Furniture',
      location: { latitude: 37.7599, longitude: -122.3894, address: '800 Brannan St, San Francisco, CA' },
      rating: 4.3,
      deliveryTypes: ['furniture'],
      prepTime: 30,
    },
    {
      name: 'IKEA San Francisco',
      location: { latitude: 37.7499, longitude: -122.3794, address: '1000 Van Ness Ave, San Francisco, CA' },
      rating: 4.5,
      deliveryTypes: ['furniture'],
      prepTime: 45,
    },
  ],
  cab: [],
  ride_share: [],
};

// ============================================================================
// CUSTOMER DATA
// ============================================================================

const customers = [
  {
    id: 'customer_001',
    name: 'Alice Johnson',
    phone: '+1 (555) 567-8901',
    email: 'alice@example.com',
    address: '100 Folsom St, San Francisco, CA',
    location: { latitude: 37.7879, longitude: -122.3894, address: '100 Folsom St, San Francisco, CA' },
    rating: 4.9,
  },
  {
    id: 'customer_002',
    name: 'Bob Smith',
    phone: '+1 (555) 678-9012',
    email: 'bob@example.com',
    address: '200 Pine St, San Francisco, CA',
    location: { latitude: 37.7929, longitude: -122.3994, address: '200 Pine St, San Francisco, CA' },
    rating: 4.7,
  },
  {
    id: 'customer_003',
    name: 'Carol Williams',
    phone: '+1 (555) 789-0123',
    email: 'carol@example.com',
    address: '300 California St, San Francisco, CA',
    location: { latitude: 37.7929, longitude: -122.4044, address: '300 California St, San Francisco, CA' },
    rating: 4.8,
  },
  {
    id: 'customer_004',
    name: 'David Brown',
    phone: '+1 (555) 890-1234',
    email: 'david@example.com',
    address: '400 Market St, San Francisco, CA',
    location: { latitude: 37.7949, longitude: -122.3994, address: '400 Market St, San Francisco, CA' },
    rating: 4.5,
  },
  {
    id: 'customer_005',
    name: 'Emma Davis',
    phone: '+1 (555) 901-2345',
    email: 'emma@example.com',
    address: '500 Howard St, San Francisco, CA',
    location: { latitude: 37.7869, longitude: -122.3944, address: '500 Howard St, San Francisco, CA' },
    rating: 4.6,
  },
];

// ============================================================================
// PACKAGE DATA BY DELIVERY TYPE
// ============================================================================

const packagesByType: Record<DeliveryType, Omit<import('../types').Package, 'id' | 'quantity' | 'price'>[]> = {
  food: [
    { description: 'Chicken Teriyaki Bento', weight: 0.8, dimensions: { length: 20, width: 15, height: 10 }, isPerishable: true },
    { description: 'Vegetable Ramen', weight: 0.9, dimensions: { length: 22, width: 16, height: 12 }, isPerishable: true },
    { description: 'Assorted Sushi Platter', weight: 1.2, dimensions: { length: 25, width: 20, height: 8 }, isPerishable: true },
    { description: 'BBQ Burger Meal', weight: 0.7, dimensions: { length: 18, width: 14, height: 12 }, isPerishable: true },
    { description: 'Pad Thai with Spring Rolls', weight: 1.0, dimensions: { length: 22, width: 18, height: 10 }, isPerishable: true },
  ],
  grocery: [
    { description: 'Organic Vegetables Pack', weight: 3.5, dimensions: { length: 35, width: 25, height: 20 } },
    { description: 'Fresh Fruits Bundle', weight: 4.0, dimensions: { length: 40, width: 30, height: 25 } },
    { description: 'Dairy Products Box', weight: 2.5, dimensions: { length: 30, width: 20, height: 15 }, isPerishable: true },
    { description: 'Household Essentials', weight: 5.0, dimensions: { length: 45, width: 35, height: 30 } },
    { description: 'Fresh Bread & Pastries', weight: 1.5, dimensions: { length: 30, width: 20, height: 15 }, isPerishable: true },
  ],
  medicine: [
    { description: 'Prescription Medication', weight: 0.2, dimensions: { length: 12, width: 8, height: 5 } },
    { description: 'First Aid Kit', weight: 0.5, dimensions: { length: 20, width: 15, height: 10 } },
    { description: 'Vitamin Supplements', weight: 0.3, dimensions: { length: 15, width: 10, height: 8 } },
    { description: 'Medical Supplies', weight: 0.8, dimensions: { length: 25, width: 20, height: 15 } },
  ],
  courier: [
    { description: 'Legal Documents', weight: 0.3, dimensions: { length: 35, width: 25, height: 2 }, requiresSignature: true },
    { description: 'Business Package', weight: 1.5, dimensions: { length: 40, width: 30, height: 20 } },
    { description: 'Electronics Device', weight: 2.0, dimensions: { length: 30, width: 25, height: 15 }, isFragile: true },
    { description: 'Important Files', weight: 0.5, dimensions: { length: 30, width: 20, height: 5 }, requiresSignature: true },
    { description: 'Artwork Print', weight: 1.0, dimensions: { length: 50, width: 40, height: 5 }, isFragile: true },
  ],
  furniture: [
    { description: 'Office Chair', weight: 15.0, dimensions: { length: 70, width: 65, height: 120 }, requiresAssembly: true },
    { description: 'Small Coffee Table', weight: 12.0, dimensions: { length: 90, width: 50, height: 45 } },
    { description: 'Bookshelf Unit', weight: 25.0, dimensions: { length: 80, width: 30, height: 180 }, requiresAssembly: true },
    { description: 'Floor Lamp', weight: 5.0, dimensions: { length: 40, width: 40, height: 160 }, isFragile: true },
    { description: 'Dining Chair Set (2)', weight: 18.0, dimensions: { length: 50, width: 45, height: 90 } },
  ],
  cab: [],
  ride_share: [],
};

// ============================================================================
// EARNINGS CONFIG BY DELIVERY TYPE
// ============================================================================

const earningsConfigByType: Record<DeliveryType, { baseFee: number; perKmRate: number; perKgRate: number }> = {
  food: { baseFee: 5.00, perKmRate: 1.50, perKgRate: 0.50 },
  grocery: { baseFee: 6.00, perKmRate: 2.00, perKgRate: 0.75 },
  medicine: { baseFee: 7.00, perKmRate: 2.50, perKgRate: 0.30 },
  courier: { baseFee: 8.00, perKmRate: 3.00, perKgRate: 1.00 },
  furniture: { baseFee: 15.00, perKmRate: 4.00, perKgRate: 2.00 },
  cab: { baseFee: 5.00, perKmRate: 2.50, perKgRate: 0 },
  ride_share: { baseFee: 4.00, perKmRate: 1.80, perKgRate: 0 },
};

// ============================================================================
// GENERATE DELIVERY
// ============================================================================

const generateDelivery = (
  id: number,
  status: DeliveryStatus,
  deliveryType: DeliveryType = 'food'
): Delivery => {
  const merchantTemplates = merchantsByType[deliveryType] || merchantsByType.food;
  const packageTemplates = packagesByType[deliveryType] || packagesByType.food;

  const merchantTemplate = merchantTemplates[id % merchantTemplates.length];
  const customer = customers[id % customers.length];
  const selectedPackages = packageTemplates.slice(0, (id % 3) + 1).map((pkg, i) => ({
    ...pkg,
    id: `pkg_${id}_${i + 1}`,
    quantity: 1,
    price: 10 + Math.random() * 50,
  }));

  const distances = [2.5, 3.2, 4.1, 5.0, 6.3, 7.5, 8.0];
  const durations = [15, 20, 25, 30, 35, 40, 45];
  const config = earningsConfigByType[deliveryType];

  const distance = distances[id % distances.length];
  const duration = durations[id % durations.length];
  const totalWeight = selectedPackages.reduce((sum, p) => sum + (p.weight || 0), 0);

  const fee = config.baseFee + (distance * config.perKmRate) + (totalWeight * config.perKgRate);
  const tip = Math.random() > 0.5 ? Math.round(Math.random() * 10 * 100) / 100 : 0;
  const surgeFee = Math.random() > 0.8 ? fee * 0.3 : 0;

  const now = new Date();
  const createdAt = new Date(now.getTime() - Math.random() * 3600000);

  const earningsBreakdown: DeliveryTypeEarnings = {
    baseFee: config.baseFee,
    distanceFee: distance * config.perKmRate,
    weightFee: totalWeight * config.perKgRate,
    volumeFee: 0,
    surgeMultiplier: surgeFee > 0 ? 1.3 : 1.0,
    tip,
    bonus: 0,
    total: fee + tip + surgeFee,
    breakdown: {
      pickup: config.baseFee,
      perKm: distance * config.perKmRate,
      perKg: totalWeight * config.perKgRate,
      handling: 2.0,
      delivery: 3.0,
    },
  };

  const merchant: import('../types').Merchant = {
    id: `merchant_${deliveryType}_${id}`,
    name: merchantTemplate.name,
    phone: `+1 (555) ${100 + id}${200 + id}`,
    address: merchantTemplate.location.address,
    location: merchantTemplate.location,
    logo: merchantTemplate.logo,
    rating: merchantTemplate.rating,
    deliveryTypes: merchantTemplate.deliveryTypes,
    prepTime: merchantTemplate.prepTime,
  };

  return {
    id: `delivery_${String(id).padStart(3, '0')}`,
    orderId: `ORD-${deliveryType.substring(0, 2).toUpperCase()}-${String(1000 + id).padStart(6, '0')}`,
    deliveryType,
    status,
    driver: status !== 'pending' ? mockDriver : undefined,
    merchant,
    customer,
    packages: selectedPackages,
    pickupLocation: merchantTemplate.location,
    deliveryLocation: customer.location!,
    estimatedPickupTime: new Date(createdAt.getTime() + 10 * 60000),
    estimatedDeliveryTime: new Date(createdAt.getTime() + (duration + 10) * 60000),
    actualPickupTime: ['picked_up', 'in_transit', 'delivered'].includes(status)
      ? new Date(createdAt.getTime() + 8 * 60000)
      : undefined,
    distance,
    duration,
    totalWeight,
    totalVolume: selectedPackages.reduce((sum, p) => {
      const d = p.dimensions || { length: 20, width: 15, height: 10 };
      return sum + (d.length * d.width * d.height) / 1000;
    }, 0),
    fee,
    tip,
    surgeFee,
    totalEarnings: fee + tip + surgeFee,
    earningsBreakdown,
    specialInstructions:
      id % 3 === 0
        ? 'Leave at door. Call on arrival.'
        : id % 3 === 1
        ? 'Ring doorbell twice'
        : undefined,
    createdAt,
    updatedAt: new Date(),
    expiresAt: status === 'pending' ? new Date(now.getTime() + 60 * 1000) : undefined,
  };
};

// ============================================================================
// GENERATE RIDE
// ============================================================================

const generateRide = (
  id: number,
  status: RideStatus,
  rideType: 'cab' = 'cab'
): Ride => {
  const customer = customers[id % customers.length];
  const pickupLocation: Location = {
    latitude: 37.7749 + (Math.random() - 0.5) * 0.05,
    longitude: -122.4194 + (Math.random() - 0.5) * 0.05,
    address: `${100 + id * 10} ${['Market', 'Mission', 'Howard', 'Folsom', 'Pine'][id % 5]} St, San Francisco, CA`,
  };
  const dropoffLocation: Location = {
    latitude: 37.7849 + (Math.random() - 0.5) * 0.05,
    longitude: -122.4094 + (Math.random() - 0.5) * 0.05,
    address: `${200 + id * 10} ${['California', 'Sacramento', 'Washington', 'Jackson', 'Van Ness'][id % 5]} St, San Francisco, CA`,
  };

  const distance = 3 + Math.random() * 10;
  const duration = Math.round(distance * 3 + Math.random() * 10);
  const baseFare = 5.0;
  const perKmRate = 2.5;
  const perMinuteRate = 0.5;
  const fare = baseFare + (distance * perKmRate) + (duration * perMinuteRate);
  const surgeMultiplier = Math.random() > 0.8 ? 1.5 : 1.0;

  const now = new Date();
  const createdAt = new Date(now.getTime() - Math.random() * 1800000);

  return {
    id: `ride_${String(id).padStart(3, '0')}`,
    bookingId: `RIDE-${String(1000 + id).padStart(6, '0')}`,
    rideType,
    status,
    driver: status !== 'pending' ? mockDriver : undefined,
    customer,
    pickupLocation,
    dropoffLocation,
    estimatedPickupTime: new Date(createdAt.getTime() + 5 * 60000),
    estimatedArrival: new Date(createdAt.getTime() + (duration + 5) * 60000),
    actualPickupTime: ['arrived', 'in_progress', 'completed'].includes(status)
      ? new Date(createdAt.getTime() + 6 * 60000)
      : undefined,
    distance,
    duration,
    vehicle: mockDriver.activeVehicle,
    fare,
    surgeMultiplier,
    totalEarnings: fare * surgeMultiplier,
    estimatedEarnings: fare,
    passengerCount: 1 + (id % 3),
    createdAt,
    updatedAt: new Date(),
  };
};

// ============================================================================
// MOCK DELIVERIES - Generate various delivery types
// ============================================================================

export const mockDeliveries: Delivery[] = [
  generateDelivery(1, 'accepted', 'food'),
  generateDelivery(2, 'picked_up', 'grocery'),
  generateDelivery(3, 'in_transit', 'medicine'),
];

export const mockPendingRequests: Delivery[] = [
  generateDelivery(4, 'pending', 'food'),
  generateDelivery(5, 'pending', 'courier'),
  generateDelivery(6, 'pending', 'furniture'),
];

export const mockCompletedDeliveries: Delivery[] = [
  // Food deliveries
  generateDelivery(10, 'delivered', 'food'),
  generateDelivery(11, 'delivered', 'food'),
  generateDelivery(12, 'delivered', 'food'),
  // Grocery deliveries
  generateDelivery(20, 'delivered', 'grocery'),
  generateDelivery(21, 'delivered', 'grocery'),
  // Medicine deliveries
  generateDelivery(30, 'delivered', 'medicine'),
  generateDelivery(31, 'delivered', 'medicine'),
  // Courier deliveries
  generateDelivery(40, 'delivered', 'courier'),
  // Furniture deliveries
  generateDelivery(50, 'delivered', 'furniture'),
];

// ============================================================================
// MOCK RIDES
// ============================================================================

export const mockRides: Ride[] = [
  generateRide(1, 'accepted'),
  generateRide(2, 'in_progress'),
];

export const mockPendingRideRequests: Ride[] = [
  generateRide(10, 'pending'),
  generateRide(11, 'pending'),
];

export const mockCompletedRides: Ride[] = [
  generateRide(20, 'completed'),
  generateRide(21, 'completed'),
  generateRide(22, 'completed'),
];

// ============================================================================
// MOCK EARNINGS
// ============================================================================

export const mockTodayEarnings: DailyEarnings = {
  date: new Date().toISOString().split('T')[0],
  totalEarnings: 127.50,
  totalDeliveries: 8,
  totalRides: 0,
  totalDistance: 42.5,
  totalHours: 6.5,
  bonus: 15.00,
  breakdown: {
    food: 55.00,
    grocery: 28.50,
    medicine: 18.00,
    courier: 16.00,
    furniture: 10.00,
    cab: 0,
    rideShare: 0,
  },
};

export const mockWeeklyEarnings: DailyEarnings[] = [
  { date: '2024-01-08', totalEarnings: 145.00, totalDeliveries: 10, totalRides: 0, totalDistance: 48.2, totalHours: 7.2, bonus: 20.00, breakdown: { food: 65.00, grocery: 32.50, medicine: 15.00, courier: 22.50, furniture: 10.00, cab: 0, rideShare: 0 } },
  { date: '2024-01-07', totalEarnings: 112.50, totalDeliveries: 7, totalRides: 0, totalDistance: 35.1, totalHours: 5.8, bonus: 10.00, breakdown: { food: 45.00, grocery: 25.00, medicine: 18.50, courier: 14.00, furniture: 10.00, cab: 0, rideShare: 0 } },
  { date: '2024-01-06', totalEarnings: 98.00, totalDeliveries: 6, totalRides: 0, totalDistance: 28.9, totalHours: 4.5, bonus: 0, breakdown: { food: 38.00, grocery: 22.00, medicine: 12.00, courier: 16.00, furniture: 10.00, cab: 0, rideShare: 0 } },
  { date: '2024-01-05', totalEarnings: 156.75, totalDeliveries: 11, totalRides: 0, totalDistance: 52.3, totalHours: 8.0, bonus: 25.00, breakdown: { food: 72.25, grocery: 35.00, medicine: 19.50, courier: 20.00, furniture: 10.00, cab: 0, rideShare: 0 } },
  { date: '2024-01-04', totalEarnings: 89.25, totalDeliveries: 5, totalRides: 0, totalDistance: 24.8, totalHours: 4.2, bonus: 0, breakdown: { food: 35.00, grocery: 20.25, medicine: 14.00, courier: 10.00, furniture: 10.00, cab: 0, rideShare: 0 } },
  { date: '2024-01-03', totalEarnings: 134.50, totalDeliveries: 9, totalRides: 0, totalDistance: 44.6, totalHours: 6.5, bonus: 15.00, breakdown: { food: 58.00, grocery: 30.00, medicine: 16.50, courier: 20.00, furniture: 10.00, cab: 0, rideShare: 0 } },
  { date: '2024-01-02', totalEarnings: 178.00, totalDeliveries: 12, totalRides: 0, totalDistance: 58.9, totalHours: 8.8, bonus: 30.00, breakdown: { food: 78.00, grocery: 40.00, medicine: 20.00, courier: 25.00, furniture: 15.00, cab: 0, rideShare: 0 } },
];

export const mockRecentTransactions: EarningTransaction[] = [
  { id: 'txn_001', deliveryId: 'delivery_010', type: 'delivery', amount: 12.50, description: 'Food delivery to Alice Johnson', status: 'completed', deliveryType: 'food', createdAt: new Date(Date.now() - 3600000) },
  { id: 'txn_002', deliveryId: 'delivery_011', type: 'delivery', amount: 10.00, description: 'Food delivery to Bob Smith', status: 'completed', deliveryType: 'food', createdAt: new Date(Date.now() - 7200000) },
  { id: 'txn_003', type: 'bonus', amount: 15.00, description: 'Peak hour bonus', status: 'completed', createdAt: new Date(Date.now() - 14400000) },
  { id: 'txn_004', deliveryId: 'delivery_020', type: 'delivery', amount: 8.50, description: 'Grocery delivery to Carol Williams', status: 'completed', deliveryType: 'grocery', createdAt: new Date(Date.now() - 21600000) },
  { id: 'txn_005', deliveryId: 'delivery_030', type: 'delivery', amount: 14.00, description: 'Medicine delivery to David Brown', status: 'completed', deliveryType: 'medicine', createdAt: new Date(Date.now() - 28800000) },
  { id: 'txn_006', type: 'surge', amount: 5.50, description: 'Surge pricing bonus', status: 'completed', createdAt: new Date(Date.now() - 43200000) },
  { id: 'txn_007', type: 'withdrawal', amount: -100.00, description: 'Withdrawal to bank account', status: 'completed', createdAt: new Date(Date.now() - 86400000) },
];

// ============================================================================
// MOCK NOTIFICATIONS
// ============================================================================

export const mockNotifications: Notification[] = [
  {
    id: 'notif_001',
    type: 'delivery_request',
    title: 'New Delivery Request',
    message: 'New delivery available from Sakura Sushi. Earn $15.00',
    data: { deliveryId: 'delivery_004' },
    deliveryType: 'food',
    read: false,
    createdAt: new Date(Date.now() - 300000),
  },
  {
    id: 'notif_002',
    type: 'delivery_request',
    title: 'High-Paying Courier Request',
    message: 'Urgent document delivery from SwiftDoc. Earn $22.00',
    data: { deliveryId: 'delivery_005' },
    deliveryType: 'courier',
    read: false,
    createdAt: new Date(Date.now() - 600000),
  },
  {
    id: 'notif_003',
    type: 'delivery_update',
    title: 'Delivery Completed',
    message: 'Your delivery to Alice Johnson has been completed. +$12.50',
    data: { deliveryId: 'delivery_010' },
    deliveryType: 'food',
    read: false,
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: 'notif_004',
    type: 'earnings',
    title: 'Bonus Earned',
    message: 'You earned a $15.00 peak hour bonus!',
    data: {},
    read: true,
    createdAt: new Date(Date.now() - 14400000),
  },
  {
    id: 'notif_005',
    type: 'system',
    title: 'Rating Updated',
    message: 'You received a 5-star rating from Bob Smith. Your rating is now 4.8',
    data: {},
    read: true,
    createdAt: new Date(Date.now() - 28800000),
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const updateDeliveryStatus = (
  deliveryId: string,
  status: DeliveryStatus
): Promise<Delivery> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const delivery = mockDeliveries.find((d) => d.id === deliveryId);
      if (delivery) {
        const updated = { ...delivery, status, updatedAt: new Date() };
        resolve(updated);
      } else {
        resolve(mockDeliveries[0]);
      }
    }, 500);
  });
};

export const getDeliveriesByType = (type: DeliveryType): Delivery[] => {
  return [
    ...mockDeliveries,
    ...mockPendingRequests,
    ...mockCompletedDeliveries,
  ].filter((d) => d.deliveryType === type);
};

export const getEarningsByType = (earnings: DailyEarnings): Record<DeliveryType, number> => {
  return earnings.breakdown;
};

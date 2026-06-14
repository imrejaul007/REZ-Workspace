import {
  Delivery,
  DeliveryStatus,
  DeliveryType,
  Driver,
  DailyEarnings,
  EarningTransaction,
  Notification,
  DriverSettings,
  LocationUpdate,
  ApiResponse,
  Ride,
  RideStatus,
  DeliveryRequest,
  RideRequest,
  DeliveryTypeEarnings,
  VehicleInfo,
  Fleet,
} from '../types';
import {
  mockDriver,
  mockDeliveries,
  mockPendingRequests,
  mockCompletedDeliveries,
  mockTodayEarnings,
  mockWeeklyEarnings,
  mockRecentTransactions,
  mockNotifications,
  mockRides,
  mockPendingRideRequests,
  mockCompletedRides,
} from './mockData';

// Simulated network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================================
// API CONFIGURATION
// ============================================================================

const API_CONFIG = {
  // Delivery Service - Handles all delivery and ride requests
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.rez.delivery',
  deliveryServiceUrl: process.env.EXPO_PUBLIC_DELIVERY_SERVICE_URL || 'http://localhost:4010',

  // API Versions
  apiVersion: 'v1',

  // Timeouts
  requestTimeout: 30000,
  uploadTimeout: 120000,

  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000,
};

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  baseUrl: string = API_CONFIG.deliveryServiceUrl
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: data.code || 'API_ERROR',
          message: data.message || 'An error occurred',
        },
      };
    }

    return data;
  } catch (error) {
    logger.error('API call failed:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed. Please try again.',
      },
    };
  }
}

// ============================================================================
// DELIVERY API - Handles all delivery operations
// ============================================================================

export const deliveryApi = {
  // Get all active deliveries for driver
  getActiveDeliveries: async (): Promise<ApiResponse<Delivery[]>> => {
    // In production, this would call: GET /api/v1/deliveries/active
    // For now, use mock data with a simulated delay
    await delay(500);
    return {
      success: true,
      data: mockDeliveries,
    };
  },

  // Get pending delivery requests
  getPendingRequests: async (
    deliveryType?: DeliveryType
  ): Promise<ApiResponse<DeliveryRequest[]>> => {
    // In production: GET /api/v1/deliveries/requests?type={deliveryType}
    await delay(500);
    const requests: DeliveryRequest[] = mockPendingRequests.map((d) => ({
      delivery: d,
      estimatedEarnings: d.totalEarnings,
      surgeActive: Math.random() > 0.8,
      surgeMultiplier: 1.0 + Math.random() * 0.5,
      distance: d.distance,
      duration: d.duration,
      expiresIn: 60 + Math.floor(Math.random() * 60),
      requiresVehicle: ['bike', 'motorcycle', 'car', 'van'],
    }));
    return {
      success: true,
      data: requests,
    };
  },

  // Get completed deliveries
  getCompletedDeliveries: async (
    page = 1,
    limit = 20,
    deliveryType?: DeliveryType
  ): Promise<ApiResponse<Delivery[]>> => {
    // In production: GET /api/v1/deliveries/history?page={page}&limit={limit}&type={deliveryType}
    await delay(500);
    return {
      success: true,
      data: mockCompletedDeliveries,
      pagination: {
        page,
        limit,
        total: mockCompletedDeliveries.length,
        totalPages: Math.ceil(mockCompletedDeliveries.length / limit),
      },
    };
  },

  // Get single delivery details
  getDelivery: async (id: string): Promise<ApiResponse<Delivery>> => {
    // In production: GET /api/v1/deliveries/{id}
    await delay(300);
    const delivery =
      mockDeliveries.find((d) => d.id === id) ||
      mockPendingRequests.find((d) => d.id === id) ||
      mockCompletedDeliveries.find((d) => d.id === id) ||
      mockDeliveries[0];
    return {
      success: true,
      data: delivery,
    };
  },

  // Accept a delivery request
  acceptDelivery: async (id: string): Promise<ApiResponse<Delivery>> => {
    // In production: POST /api/v1/deliveries/{id}/accept
    await delay(500);
    const delivery = mockPendingRequests.find((d) => d.id === id);
    if (delivery) {
      return {
        success: true,
        data: { ...delivery, status: 'accepted' as DeliveryStatus },
      };
    }
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Delivery not found' },
    };
  },

  // Decline a delivery request
  declineDelivery: async (id: string): Promise<ApiResponse<null>> => {
    // In production: POST /api/v1/deliveries/{id}/decline
    await delay(300);
    return { success: true, data: null };
  },

  // Update delivery status
  updateDeliveryStatus: async (
    id: string,
    status: DeliveryStatus
  ): Promise<ApiResponse<Delivery>> => {
    // In production: PATCH /api/v1/deliveries/{id}/status
    await delay(500);
    const delivery = mockDeliveries.find((d) => d.id === id);
    if (delivery) {
      const updated: Delivery = {
        ...delivery,
        status,
        updatedAt: new Date(),
        ...(status === 'picked_up' ? { actualPickupTime: new Date() } : {}),
        ...(status === 'delivered' ? { actualDeliveryTime: new Date() } : {}),
      };
      return { success: true, data: updated };
    }
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Delivery not found' },
    };
  },

  // Submit proof of delivery
  submitProofOfDelivery: async (
    id: string,
    proof: { signature?: string; photo?: string }
  ): Promise<ApiResponse<Delivery>> => {
    // In production: POST /api/v1/deliveries/{id}/proof
    await delay(500);
    const delivery = mockDeliveries.find((d) => d.id === id);
    if (delivery) {
      return {
        success: true,
        data: {
          ...delivery,
          proofOfDelivery: {
            ...proof,
            timestamp: new Date(),
          },
        },
      };
    }
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Delivery not found' },
    };
  },

  // Calculate estimated earnings for a delivery
  calculateEarnings: async (
    distance: number,
    weight: number,
    deliveryType: DeliveryType
  ): Promise<ApiResponse<DeliveryTypeEarnings>> => {
    // In production: POST /api/v1/deliveries/calculate-earnings
    await delay(200);
    const baseFee = 5.0;
    const perKmRate = 1.5;
    const perKgRate = 0.5;
    const distanceFee = distance * perKmRate;
    const weightFee = weight * perKgRate;
    const surgeMultiplier = 1.0;

    return {
      success: true,
      data: {
        baseFee,
        distanceFee,
        weightFee,
        volumeFee: 0,
        surgeMultiplier,
        tip: 0,
        bonus: 0,
        total: (baseFee + distanceFee + weightFee) * surgeMultiplier,
        breakdown: {
          pickup: baseFee,
          perKm: distanceFee,
          perKg: weightFee,
          handling: 2.0,
          delivery: 3.0,
        },
      },
    };
  },

  // Get delivery types available in driver's zone
  getAvailableDeliveryTypes: async (): Promise<ApiResponse<DeliveryType[]>> => {
    // In production: GET /api/v1/deliveries/types
    await delay(200);
    return {
      success: true,
      data: ['food', 'grocery', 'medicine', 'courier', 'furniture'],
    };
  },
};

// ============================================================================
// RIDE API - Handles cab and ride-sharing operations
// ============================================================================

export const rideApi = {
  // Get active rides for driver
  getActiveRides: async (): Promise<ApiResponse<Ride[]>> => {
    // In production: GET /api/v1/rides/active
    await delay(500);
    return {
      success: true,
      data: mockRides,
    };
  },

  // Get pending ride requests
  getPendingRequests: async (): Promise<ApiResponse<RideRequest[]>> => {
    // In production: GET /api/v1/rides/requests
    await delay(500);
    const requests: RideRequest[] = mockPendingRideRequests.map((r) => ({
      ride: r,
      estimatedEarnings: r.estimatedEarnings,
      surgeActive: Math.random() > 0.7,
      surgeMultiplier: 1.0 + Math.random() * 1.0,
      pickupDistance: 2 + Math.random() * 3,
      estimatedPickupTime: 5 + Math.floor(Math.random() * 10),
      expiresIn: 30 + Math.floor(Math.random() * 30),
      requiresVehicle: ['car'],
    }));
    return {
      success: true,
      data: requests,
    };
  },

  // Get completed rides
  getCompletedRides: async (
    page = 1,
    limit = 20
  ): Promise<ApiResponse<Ride[]>> => {
    // In production: GET /api/v1/rides/history
    await delay(500);
    return {
      success: true,
      data: mockCompletedRides,
      pagination: {
        page,
        limit,
        total: mockCompletedRides.length,
        totalPages: Math.ceil(mockCompletedRides.length / limit),
      },
    };
  },

  // Get single ride details
  getRide: async (id: string): Promise<ApiResponse<Ride>> => {
    // In production: GET /api/v1/rides/{id}
    await delay(300);
    const ride =
      mockRides.find((r) => r.id === id) ||
      mockPendingRideRequests.find((r) => r.id === id) ||
      mockCompletedRides.find((r) => r.id === id) ||
      mockRides[0];
    return {
      success: true,
      data: ride,
    };
  },

  // Accept a ride request
  acceptRide: async (id: string): Promise<ApiResponse<Ride>> => {
    // In production: POST /api/v1/rides/{id}/accept
    await delay(500);
    const ride = mockPendingRideRequests.find((r) => r.id === id);
    if (ride) {
      return {
        success: true,
        data: { ...ride, status: 'accepted' as RideStatus },
      };
    }
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Ride not found' },
    };
  },

  // Decline a ride request
  declineRide: async (id: string): Promise<ApiResponse<null>> => {
    // In production: POST /api/v1/rides/{id}/decline
    await delay(300);
    return { success: true, data: null };
  },

  // Update ride status
  updateRideStatus: async (
    id: string,
    status: RideStatus
  ): Promise<ApiResponse<Ride>> => {
    // In production: PATCH /api/v1/rides/{id}/status
    await delay(500);
    const ride = mockRides.find((r) => r.id === id);
    if (ride) {
      const updated: Ride = {
        ...ride,
        status,
        updatedAt: new Date(),
        ...(status === 'arrived' ? { actualPickupTime: new Date() } : {}),
        ...(status === 'completed' ? { actualDropoffTime: new Date() } : {}),
      };
      return { success: true, data: updated };
    }
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Ride not found' },
    };
  },

  // Calculate estimated earnings for a ride
  calculateEarnings: async (
    distance: number,
    duration: number,
    rideType: 'cab' | 'ride_share'
  ): Promise<ApiResponse<{ estimatedEarnings: number; breakdown: Record<string, number> }>> => {
    // In production: POST /api/v1/rides/calculate-earnings
    await delay(200);
    const baseFare = rideType === 'cab' ? 5.0 : 3.0;
    const perKmRate = rideType === 'cab' ? 2.5 : 1.8;
    const perMinuteRate = rideType === 'cab' ? 0.5 : 0.3;

    return {
      success: true,
      data: {
        estimatedEarnings: baseFare + (distance * perKmRate) + (duration * perMinuteRate),
        breakdown: {
          baseFare,
          distanceFare: distance * perKmRate,
          timeFare: duration * perMinuteRate,
        },
      },
    };
  },

  // Share trip with emergency contact
  shareTrip: async (rideId: string, contactId: string): Promise<ApiResponse<null>> => {
    // In production: POST /api/v1/rides/{rideId}/share
    await delay(300);
    return { success: true, data: null };
  },

  // Report safety issue during ride
  reportSafetyIssue: async (
    rideId: string,
    issue: string,
    description: string
  ): Promise<ApiResponse<null>> => {
    // In production: POST /api/v1/rides/{rideId}/report
    await delay(500);
    return { success: true, data: null };
  },
};

// ============================================================================
// DRIVER API - Driver profile and vehicle management
// ============================================================================

export const driverApi = {
  // Get driver profile
  getProfile: async (): Promise<ApiResponse<Driver>> => {
    // In production: GET /api/v1/drivers/me
    await delay(300);
    return { success: true, data: mockDriver };
  },

  // Update driver profile
  updateProfile: async (
    updates: Partial<Driver>
  ): Promise<ApiResponse<Driver>> => {
    // In production: PATCH /api/v1/drivers/me
    await delay(500);
    return {
      success: true,
      data: { ...mockDriver, ...updates },
    };
  },

  // Update driver location
  updateLocation: async (
    location: LocationUpdate['location'],
    heading?: number,
    speed?: number
  ): Promise<ApiResponse<null>> => {
    // In production: POST /api/v1/drivers/location
    // This would typically use WebSocket for real-time updates
    await delay(100);
    return { success: true, data: null };
  },

  // Set driver online/offline status
  setOnlineStatus: async (isOnline: boolean): Promise<ApiResponse<Driver>> => {
    // In production: PATCH /api/v1/drivers/me/status
    await delay(300);
    return {
      success: true,
      data: { ...mockDriver, isOnline },
    };
  },

  // Set driver availability
  setAvailability: async (isAvailable: boolean): Promise<ApiResponse<Driver>> => {
    // In production: PATCH /api/v1/drivers/me/availability
    await delay(300);
    return {
      success: true,
      data: { ...mockDriver, isAvailable },
    };
  },

  // Upload profile photo
  uploadPhoto: async (photoUri: string): Promise<ApiResponse<string>> => {
    // In production: POST /api/v1/drivers/me/photo
    await delay(1000);
    return {
      success: true,
      data: photoUri,
    };
  },

  // Register a new vehicle
  registerVehicle: async (
    vehicle: VehicleInfo
  ): Promise<ApiResponse<VehicleInfo>> => {
    // In production: POST /api/v1/drivers/me/vehicles
    await delay(500);
    return {
      success: true,
      data: vehicle,
    };
  },

  // Get registered vehicles
  getVehicles: async (): Promise<ApiResponse<VehicleInfo[]>> => {
    // In production: GET /api/v1/drivers/me/vehicles
    await delay(300);
    return {
      success: true,
      data: mockDriver.registeredVehicles,
    };
  },

  // Set active vehicle
  setActiveVehicle: async (vehicleId: string): Promise<ApiResponse<Driver>> => {
    // In production: PATCH /api/v1/drivers/me/vehicles/{vehicleId}/activate
    await delay(300);
    const vehicle = mockDriver.registeredVehicles.find((v) => v.type === vehicleId);
    return {
      success: true,
      data: { ...mockDriver, activeVehicle: vehicle },
    };
  },

  // Update enabled delivery types
  updateDeliveryTypes: async (
    types: string[]
  ): Promise<ApiResponse<Driver>> => {
    // In production: PATCH /api/v1/drivers/me/delivery-types
    await delay(400);
    return {
      success: true,
      data: {
        ...mockDriver,
        deliveryTypes: types as unknown[],
      },
    };
  },
};

// ============================================================================
// EARNINGS API - Earnings and payout management
// ============================================================================

export const earningsApi = {
  // Get today's earnings
  getTodayEarnings: async (): Promise<ApiResponse<DailyEarnings>> => {
    // In production: GET /api/v1/earnings/today
    await delay(300);
    return { success: true, data: mockTodayEarnings };
  },

  // Get weekly earnings
  getWeeklyEarnings: async (): Promise<ApiResponse<DailyEarnings[]>> => {
    // In production: GET /api/v1/earnings/week
    await delay(400);
    return { success: true, data: mockWeeklyEarnings };
  },

  // Get earnings by delivery type
  getEarningsByType: async (
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<Record<DeliveryType, number>>> => {
    // In production: GET /api/v1/earnings/by-type?start={startDate}&end={endDate}
    await delay(400);
    return {
      success: true,
      data: {
        food: 450.50,
        grocery: 280.00,
        medicine: 150.75,
        courier: 320.25,
        furniture: 180.00,
        cab: 0,
        ride_share: 0,
      },
    };
  },

  // Get recent transactions
  getRecentTransactions: async (
    limit = 20
  ): Promise<ApiResponse<EarningTransaction[]>> => {
    // In production: GET /api/v1/earnings/transactions?limit={limit}
    await delay(300);
    return {
      success: true,
      data: mockRecentTransactions.slice(0, limit),
    };
  },

  // Request payout
  requestPayout: async (amount: number): Promise<ApiResponse<{ id: string }>> => {
    // In production: POST /api/v1/earnings/payout
    await delay(800);
    return {
      success: true,
      data: { id: `payout_${Date.now()}` },
    };
  },

  // Get payout methods
  getPayoutMethods: async (): Promise<ApiResponse<{ id: string; type: string; last4: string }[]>> => {
    // In production: GET /api/v1/earnings/payout-methods
    await delay(300);
    return {
      success: true,
      data: [
        { id: 'pm_001', type: 'bank_account', last4: '1234' },
        { id: 'pm_002', type: 'debit_card', last4: '5678' },
      ],
    };
  },

  // Get total earnings
  getTotalEarnings: async (): Promise<ApiResponse<{ total: number; pending: number }>> => {
    // In production: GET /api/v1/earnings/total
    await delay(200);
    return {
      success: true,
      data: {
        total: 2847.50,
        pending: 127.50,
      },
    };
  },

  // Get earnings summary for a period
  getEarningsSummary: async (
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<{
    total: number;
    deliveries: number;
    rides: number;
    bonus: number;
    avgPerDelivery: number;
    avgPerHour: number;
  }>> => {
    // In production: GET /api/v1/earnings/summary?start={startDate}&end={endDate}
    await delay(400);
    return {
      success: true,
      data: {
        total: 1381.50,
        deliveries: 42,
        rides: 0,
        bonus: 85.00,
        avgPerDelivery: 32.89,
        avgPerHour: 28.50,
      },
    };
  },
};

// ============================================================================
// NOTIFICATIONS API - Push notifications management
// ============================================================================

export const notificationsApi = {
  // Get all notifications
  getNotifications: async (): Promise<ApiResponse<Notification[]>> => {
    // In production: GET /api/v1/notifications
    await delay(300);
    return { success: true, data: mockNotifications };
  },

  // Mark notification as read
  markAsRead: async (id: string): Promise<ApiResponse<null>> => {
    // In production: PATCH /api/v1/notifications/{id}/read
    await delay(200);
    return { success: true, data: null };
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<ApiResponse<null>> => {
    // In production: POST /api/v1/notifications/read-all
    await delay(300);
    return { success: true, data: null };
  },

  // Delete notification
  deleteNotification: async (id: string): Promise<ApiResponse<null>> => {
    // In production: DELETE /api/v1/notifications/{id}
    await delay(200);
    return { success: true, data: null };
  },

  // Register for push notifications (returns token)
  registerPushToken: async (token: string): Promise<ApiResponse<null>> => {
    // In production: POST /api/v1/notifications/token
    await delay(300);
    return { success: true, data: null };
  },

  // Update notification preferences
  updatePreferences: async (
    preferences: Partial<DriverSettings['notifications']>
  ): Promise<ApiResponse<null>> => {
    // In production: PATCH /api/v1/notifications/preferences
    await delay(300);
    return { success: true, data: null };
  },
};

// ============================================================================
// SETTINGS API - Driver settings management
// ============================================================================

export const settingsApi = {
  // Get driver settings
  getSettings: async (): Promise<ApiResponse<DriverSettings>> => {
    // In production: GET /api/v1/settings
    await delay(200);
    return {
      success: true,
      data: {
        notifications: {
          sound: true,
          vibration: true,
          deliveryRequests: true,
          rideRequests: true,
          earningsUpdates: true,
          promotions: false,
        },
        availability: {
          autoAccept: false,
          preferNearMe: true,
          maxDistance: 10,
          maxWeight: 50,
          workingHours: {
            enabled: false,
            start: '09:00',
            end: '21:00',
          },
        },
        deliveryTypes: {
          food: true,
          grocery: true,
          medicine: true,
          courier: true,
          furniture: true,
          cab: false,
          rideShare: false,
        },
        navigation: {
          preferredApp: 'google',
          avoidHighways: false,
          avoidTolls: false,
        },
        privacy: {
          showPhoneToMerchant: false,
          showPhoneToCustomer: false,
          showPhoneToRider: false,
        },
        safety: {
          recordAudio: false,
          shareTrip: true,
          emergencyContact: undefined,
        },
      },
    };
  },

  // Update driver settings
  updateSettings: async (
    settings: Partial<DriverSettings>
  ): Promise<ApiResponse<DriverSettings>> => {
    // In production: PATCH /api/v1/settings
    await delay(400);
    return { success: true, data: settings as DriverSettings };
  },

  // Get working zones
  getWorkingZones: async (): Promise<ApiResponse<{ id: string; name: string }[]>> => {
    // In production: GET /api/v1/settings/zones
    await delay(200);
    return {
      success: true,
      data: [
        { id: 'zone_001', name: 'Downtown' },
        { id: 'zone_002', name: 'Midtown' },
        { id: 'zone_003', name: 'Uptown' },
        { id: 'zone_004', name: 'Suburbs' },
      ],
    };
  },
};

// ============================================================================
// NAVIGATION API - External navigation app integration
// ============================================================================

export const navigationApi = {
  // Get directions URL for external navigation apps
  getDirectionsUrl: (
    destination: { latitude: number; longitude: number },
    preferredApp: 'google' | 'waze' | 'apple' = 'google'
  ): string => {
    const { latitude, longitude } = destination;
    switch (preferredApp) {
      case 'waze':
        return `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
      case 'apple':
        return `http://maps.apple.com/?daddr=${latitude},${longitude}`;
      case 'google':
      default:
        return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    }
  },

  // Get directions URL with waypoints
  getDirectionsWithWaypoint: (
    origin: { latitude: number; longitude: number },
    waypoint: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    preferredApp: 'google' | 'waze' | 'apple' = 'google'
  ): string => {
    const originStr = `${origin.latitude},${origin.longitude}`;
    const waypointStr = `${waypoint.latitude},${waypoint.longitude}`;
    const destStr = `${destination.latitude},${destination.longitude}`;

    switch (preferredApp) {
      case 'waze':
        return `https://waze.com/ul?ll=${waypoint.latitude},${waypoint.longitude}&navigate=yes`;
      case 'apple':
        return `http://maps.apple.com/?daddr=${destStr}&dirflg=r`;
      case 'google':
      default:
        return `https://www.google.com/maps/dir/${originStr}/${waypointStr}/${destStr}`;
    }
  },

  // Get ride route with ETA
  getRouteInfo: async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<ApiResponse<{ distance: number; duration: number; polyline?: string }>> => {
    // In production: GET /api/v1/navigation/route
    await delay(300);
    return {
      success: true,
      data: {
        distance: 5.2,
        duration: 15,
      },
    };
  },
};

// ============================================================================
// FLEET API - Fleet management (Phase 4)
// ============================================================================

export const fleetApi = {
  // Get fleet details
  getFleet: async (fleetId: string): Promise<ApiResponse<Fleet>> => {
    // In production: GET /api/v1/fleets/{fleetId}
    await delay(300);
    return {
      success: true,
      data: {
        id: fleetId,
        name: 'My Fleet',
        ownerId: 'owner_001',
        vehicles: [],
        totalDrivers: 5,
        activeDrivers: 3,
        createdAt: new Date(),
      },
    };
  },

  // Get fleet vehicles
  getFleetVehicles: async (
    fleetId: string
  ): Promise<ApiResponse<{ id: string; status: string; assignedDriver?: string }[]>> => {
    // In production: GET /api/v1/fleets/{fleetId}/vehicles
    await delay(300);
    return {
      success: true,
      data: [],
    };
  },

  // Assign vehicle to driver
  assignVehicle: async (
    fleetId: string,
    vehicleId: string,
    driverId: string
  ): Promise<ApiResponse<null>> => {
    // In production: POST /api/v1/fleets/{fleetId}/vehicles/{vehicleId}/assign
    await delay(500);
    return { success: true, data: null };
  },

  // Get fleet analytics
  getFleetAnalytics: async (
    fleetId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<{
    totalDeliveries: number;
    totalRevenue: number;
    activeVehicles: number;
    avgDeliveryTime: number;
  }>> => {
    // In production: GET /api/v1/fleets/{fleetId}/analytics
    await delay(400);
    return {
      success: true,
      data: {
        totalDeliveries: 150,
        totalRevenue: 4500.00,
        activeVehicles: 8,
        avgDeliveryTime: 25,
      },
    };
  },
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  delivery: deliveryApi,
  ride: rideApi,
  driver: driverApi,
  earnings: earningsApi,
  notifications: notificationsApi,
  settings: settingsApi,
  navigation: navigationApi,
  fleet: fleetApi,
  config: API_CONFIG,
};

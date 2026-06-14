import { create } from 'zustand';
import {
  Driver,
  Delivery,
  Notification,
  DriverSettings,
  DailyEarnings,
  EarningTransaction,
  LocationUpdate,
  DeliveryType,
  Ride,
  DeliveryRequest,
  RideRequest,
  VehicleInfo,
} from '../types';

// ============================================================================
// STORE STATE INTERFACE
// ============================================================================

interface DriverState {
  // Driver Profile
  driver: Driver | null;
  isLoading: boolean;
  error: string | null;

  // Deliveries
  activeDeliveries: Delivery[];
  completedDeliveries: Delivery[];
  pendingRequests: DeliveryRequest[];
  currentDelivery: Delivery | null;

  // Rides (Cab/Ride-share)
  activeRides: Ride[];
  completedRides: Ride[];
  pendingRideRequests: RideRequest[];
  currentRide: Ride | null;

  // Notifications
  notifications: Notification[];
  unreadCount: number;

  // Earnings
  todayEarnings: DailyEarnings | null;
  weeklyEarnings: DailyEarnings[];
  recentTransactions: EarningTransaction[];
  totalEarnings: number;
  pendingPayout: number;
  earningsByType: Record<DeliveryType, number>;

  // Settings
  settings: DriverSettings;

  // Vehicle
  activeVehicle: VehicleInfo | null;
  registeredVehicles: VehicleInfo[];

  // Actions - Driver
  setDriver: (driver: Driver | null) => void;
  updateDriverLocation: (location: LocationUpdate['location']) => void;
  setDriverOnline: (isOnline: boolean) => void;
  setDriverAvailable: (isAvailable: boolean) => void;
  setDeliveryTypes: (types: DeliveryType[]) => void;

  // Actions - Deliveries
  setActiveDeliveries: (deliveries: Delivery[]) => void;
  setCompletedDeliveries: (deliveries: Delivery[]) => void;
  setPendingRequests: (requests: DeliveryRequest[]) => void;
  setCurrentDelivery: (delivery: Delivery | null) => void;
  addDelivery: (delivery: Delivery) => void;
  updateDelivery: (id: string, updates: Partial<Delivery>) => void;
  removeDelivery: (id: string) => void;

  // Actions - Rides
  setActiveRides: (rides: Ride[]) => void;
  setCompletedRides: (rides: Ride[]) => void;
  setPendingRideRequests: (requests: RideRequest[]) => void;
  setCurrentRide: (ride: Ride | null) => void;
  addRide: (ride: Ride) => void;
  updateRide: (id: string, updates: Partial<Ride>) => void;
  removeRide: (id: string) => void;

  // Actions - Notifications
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Actions - Earnings
  setTodayEarnings: (earnings: DailyEarnings) => void;
  setWeeklyEarnings: (earnings: DailyEarnings[]) => void;
  setRecentTransactions: (transactions: EarningTransaction[]) => void;
  setTotalEarnings: (amount: number) => void;
  setPendingPayout: (amount: number) => void;
  setEarningsByType: (earnings: Record<DeliveryType, number>) => void;

  // Actions - Settings
  updateSettings: (settings: Partial<DriverSettings>) => void;
  toggleDeliveryType: (type: DeliveryType, enabled: boolean) => void;

  // Actions - Vehicles
  setActiveVehicle: (vehicle: VehicleInfo | null) => void;
  setRegisteredVehicles: (vehicles: VehicleInfo[]) => void;
  addVehicle: (vehicle: VehicleInfo) => void;

  // Actions - General
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

const defaultSettings: DriverSettings = {
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
};

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState = {
  driver: null,
  isLoading: false,
  error: null,
  activeDeliveries: [],
  completedDeliveries: [],
  pendingRequests: [],
  currentDelivery: null,
  activeRides: [],
  completedRides: [],
  pendingRideRequests: [],
  currentRide: null,
  notifications: [],
  unreadCount: 0,
  todayEarnings: null,
  weeklyEarnings: [],
  recentTransactions: [],
  totalEarnings: 0,
  pendingPayout: 0,
  earningsByType: {
    food: 0,
    grocery: 0,
    medicine: 0,
    courier: 0,
    furniture: 0,
    cab: 0,
    ride_share: 0,
  } as Record<DeliveryType, number>,
  settings: defaultSettings,
  activeVehicle: null,
  registeredVehicles: [],
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useDriverStore = create<DriverState>((set) => ({
  ...initialState,

  // ==========================================================================
  // DRIVER ACTIONS
  // ==========================================================================

  setDriver: (driver) => set({ driver }),

  updateDriverLocation: (location) =>
    set((state) => ({
      driver: state.driver
        ? {
            ...state.driver,
            currentLocation: {
              latitude: location.latitude,
              longitude: location.longitude,
              address: '',
            },
          }
        : null,
    })),

  setDriverOnline: (isOnline) =>
    set((state) => ({
      driver: state.driver ? { ...state.driver, isOnline } : null,
    })),

  setDriverAvailable: (isAvailable) =>
    set((state) => ({
      driver: state.driver ? { ...state.driver, isAvailable } : null,
    })),

  setDeliveryTypes: (types) =>
    set((state) => ({
      driver: state.driver ? { ...state.driver, deliveryTypes: types } : null,
    })),

  // ==========================================================================
  // DELIVERY ACTIONS
  // ==========================================================================

  setActiveDeliveries: (deliveries) => set({ activeDeliveries: deliveries }),

  setCompletedDeliveries: (deliveries) => set({ completedDeliveries: deliveries }),

  setPendingRequests: (requests) => set({ pendingRequests: requests }),

  setCurrentDelivery: (delivery) => set({ currentDelivery: delivery }),

  addDelivery: (delivery) =>
    set((state) => ({
      activeDeliveries: [...state.activeDeliveries, delivery],
    })),

  updateDelivery: (id, updates) =>
    set((state) => ({
      activeDeliveries: state.activeDeliveries.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: new Date() } : d
      ),
      currentDelivery:
        state.currentDelivery?.id === id
          ? { ...state.currentDelivery, ...updates, updatedAt: new Date() }
          : state.currentDelivery,
    })),

  removeDelivery: (id) =>
    set((state) => ({
      activeDeliveries: state.activeDeliveries.filter((d) => d.id !== id),
      currentDelivery: state.currentDelivery?.id === id ? null : state.currentDelivery,
    })),

  // ==========================================================================
  // RIDE ACTIONS
  // ==========================================================================

  setActiveRides: (rides) => set({ activeRides: rides }),

  setCompletedRides: (rides) => set({ completedRides: rides }),

  setPendingRideRequests: (requests) => set({ pendingRideRequests: requests }),

  setCurrentRide: (ride) => set({ currentRide: ride }),

  addRide: (ride) =>
    set((state) => ({
      activeRides: [...state.activeRides, ride],
    })),

  updateRide: (id, updates) =>
    set((state) => ({
      activeRides: state.activeRides.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
      ),
      currentRide:
        state.currentRide?.id === id
          ? { ...state.currentRide, ...updates, updatedAt: new Date() }
          : state.currentRide,
    })),

  removeRide: (id) =>
    set((state) => ({
      activeRides: state.activeRides.filter((r) => r.id !== id),
      currentRide: state.currentRide?.id === id ? null : state.currentRide,
    })),

  // ==========================================================================
  // NOTIFICATION ACTIONS
  // ==========================================================================

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.read ? 0 : 1),
    })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  // ==========================================================================
  // EARNINGS ACTIONS
  // ==========================================================================

  setTodayEarnings: (earnings) => set({ todayEarnings: earnings }),

  setWeeklyEarnings: (earnings) => set({ weeklyEarnings: earnings }),

  setRecentTransactions: (transactions) => set({ recentTransactions: transactions }),

  setTotalEarnings: (amount) => set({ totalEarnings: amount }),

  setPendingPayout: (amount) => set({ pendingPayout: amount }),

  setEarningsByType: (earnings) => set({ earningsByType: earnings }),

  // ==========================================================================
  // SETTINGS ACTIONS
  // ==========================================================================

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  toggleDeliveryType: (type, enabled) =>
    set((state) => ({
      settings: {
        ...state.settings,
        deliveryTypes: {
          ...state.settings.deliveryTypes,
          [type]: enabled,
        },
      },
    })),

  // ==========================================================================
  // VEHICLE ACTIONS
  // ==========================================================================

  setActiveVehicle: (vehicle) => set({ activeVehicle: vehicle }),

  setRegisteredVehicles: (vehicles) => set({ registeredVehicles: vehicles }),

  addVehicle: (vehicle) =>
    set((state) => ({
      registeredVehicles: [...state.registeredVehicles, vehicle],
    })),

  // ==========================================================================
  // GENERAL ACTIONS
  // ==========================================================================

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));

// ============================================================================
// SELECTORS
// ============================================================================

export const selectActiveDeliveriesCount = (state: DriverState) =>
  state.activeDeliveries.length;

export const selectPendingRequestsCount = (state: DriverState) =>
  state.pendingRequests.length;

export const selectActiveRidesCount = (state: DriverState) =>
  state.activeRides.length;

export const selectUnreadNotificationsCount = (state: DriverState) =>
  state.unreadCount;

export const selectTodayTotalEarnings = (state: DriverState) =>
  state.todayEarnings?.totalEarnings ?? 0;

export const selectDeliveriesByType = (state: DriverState, type: DeliveryType) =>
  state.activeDeliveries.filter((d) => d.deliveryType === type);

export const selectPendingRequestsByType = (state: DriverState, type: DeliveryType) =>
  state.pendingRequests.filter((r) => r.delivery.deliveryType === type);

export const selectIsDriverOnline = (state: DriverState) =>
  state.driver?.isOnline ?? false;

export const selectIsDriverAvailable = (state: DriverState) =>
  state.driver?.isAvailable ?? false;

export const selectEnabledDeliveryTypes = (state: DriverState) =>
  Object.entries(state.settings.deliveryTypes)
    .filter(([, enabled]) => enabled)
    .map(([type]) => type as DeliveryType);

export const selectHasActiveWork = (state: DriverState) =>
  state.activeDeliveries.length > 0 || state.activeRides.length > 0;

export const selectTotalActiveJobs = (state: DriverState) =>
  state.activeDeliveries.length + state.activeRides.length;

export const selectTotalPendingJobs = (state: DriverState) =>
  state.pendingRequests.length + state.pendingRideRequests.length;

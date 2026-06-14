import { create } from 'zustand';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface User {
  id: string;
  name: string;
  phone: string;
  photoUrl?: string;
}

interface Vehicle {
  type: string;
  make: string;
  model: string;
  color: string;
  plate: string;
}

interface Ride {
  id: string;
  status: string;
  pickup: Location;
  drop: Location;
  fare: {
    total: number;
  };
  user: User;
  otp?: string;
}

type DriverStatus = 'offline' | 'online' | 'busy' | 'riding';

interface DriverState {
  // Driver info
  isAuthenticated: boolean;
  driverId: string | null;
  name: string;
  phone: string;
  vehicle: Vehicle | null;
  status: DriverStatus;

  // Location
  currentLocation: { lat: number; lng: number } | null;

  // Active ride
  activeRide: Ride | null;
  rideStatus: string;

  // Stats
  todayEarnings: number;
  todayRides: number;
  rating: number;
  acceptanceRate: number;

  // Earnings
  weekEarnings: number;
  monthEarnings: number;
  pendingPayout: number;

  // Loading
  isLoading: boolean;

  // Actions
  setAuthenticated: (authenticated: boolean) => void;
  setDriverInfo: (info: Partial<DriverState>) => void;
  setStatus: (status: DriverStatus) => void;
  setLocation: (location: { lat: number; lng: number }) => void;
  setActiveRide: (ride: Ride | null) => void;
  setRideStatus: (status: string) => void;
  updateEarnings: (earnings: Partial<{ todayEarnings: number; weekEarnings: number; monthEarnings: number }>) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  reset: () => void;
}

export const useDriverStore = create<DriverState>((set) => ({
  // Initial state
  isAuthenticated: false,
  driverId: null,
  name: '',
  phone: '',
  vehicle: null,
  status: 'offline',
  currentLocation: null,
  activeRide: null,
  rideStatus: '',
  todayEarnings: 0,
  todayRides: 0,
  rating: 5.0,
  acceptanceRate: 100,
  weekEarnings: 0,
  monthEarnings: 0,
  pendingPayout: 0,
  isLoading: false,

  // Actions
  setAuthenticated: (authenticated) =>
    set({ isAuthenticated: authenticated }),

  setDriverInfo: (info) =>
    set((state) => ({ ...state, ...info })),

  setStatus: (status) =>
    set({ status }),

  setLocation: (location) =>
    set({ currentLocation: location }),

  setActiveRide: (ride) =>
    set({ activeRide: ride }),

  setRideStatus: (status) =>
    set({ rideStatus: status }),

  updateEarnings: (earnings) =>
    set((state) => ({
      todayEarnings: earnings.todayEarnings ?? state.todayEarnings,
      weekEarnings: earnings.weekEarnings ?? state.weekEarnings,
      monthEarnings: earnings.monthEarnings ?? state.monthEarnings,
    })),

  setLoading: (loading) =>
    set({ isLoading: loading }),

  logout: () =>
    set({
      isAuthenticated: false,
      driverId: null,
      status: 'offline',
      activeRide: null,
    }),

  reset: () =>
    set({
      isAuthenticated: false,
      driverId: null,
      name: '',
      phone: '',
      vehicle: null,
      status: 'offline',
      currentLocation: null,
      activeRide: null,
      rideStatus: '',
      todayEarnings: 0,
      todayRides: 0,
      rating: 5.0,
      acceptanceRate: 100,
      weekEarnings: 0,
      monthEarnings: 0,
      pendingPayout: 0,
      isLoading: false,
    }),
}));

import { create } from 'zustand';

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  photoUrl?: string;
  rating: number;
  vehicle: {
    type: string;
    make: string;
    model: string;
    color: string;
    plate: string;
  };
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

interface Ride {
  id: string;
  status: RideStatus;
  pickup: Location;
  drop: Location;
  vehicleType: string;
  fare: {
    base: number;
    distanceCharge: number;
    timeCharge: number;
    total: number;
  };
  driver?: Driver;
  otp?: string;
  cashbackAmount?: number;
  voucherApplied?: {
    id: string;
    amount: number;
  };
}

type RideStatus =
  | 'idle'
  | 'requested'
  | 'assigned'
  | 'accepted'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

interface Voucher {
  id: string;
  type: string;
  value: number;
  maxValue?: number;
  validUntil: string;
  merchantName?: string;
}

interface RideState {
  // Current ride
  currentRide: Ride | null;
  rideStatus: RideStatus;

  // Location
  pickupLocation: Location | null;
  dropLocation: Location | null;
  stops: Location[]; // Intermediate stops
  driverLocation: { lat: number; lng: number } | null;

  // Estimates
  estimate: {
    total: number;
    distanceKm: number;
    durationMinutes: number;
    cashback: number;
  } | null;

  // Vehicle
  selectedVehicleType: string;

  // Vouchers
  vouchers: Voucher[];
  selectedVoucher: Voucher | null;

  // Wallet
  walletBalance: number;
  rideCredits: number;

  // History
  rideHistory: Ride[];

  // Loading states
  isLoading: boolean;
  isFindingDriver: boolean;

  // Actions
  setPickupLocation: (location: Location | null) => void;
  setDropLocation: (location: Location | null) => void;
  addStop: (location: Location) => void;
  removeStop: (index: number) => void;
  updateStop: (index: number, location: Location) => void;
  clearStops: () => void;
  setSelectedVehicleType: (type: string) => void;
  setEstimate: (estimate: RideState['estimate']) => void;
  setRide: (ride: any) => void;
  updateRideStatus: (status: RideStatus) => void;
  setDriverLocation: (location: { lat: number; lng: number }) => void;
  setRideCompleted: (data: any) => void;
  cancelRide: (reason?: string) => void;
  setVouchers: (vouchers: Voucher[]) => void;
  selectVoucher: (voucher: Voucher | null) => void;
  setWalletBalance: (balance: number, rideCredits: number) => void;
  setRideHistory: (rides: Ride[]) => void;
  addToRideHistory: (ride: Ride) => void;
  setLoading: (loading: boolean) => void;
  setFindingDriver: (finding: boolean) => void;
  reset: () => void;
}

const initialState = {
  currentRide: null,
  rideStatus: 'idle' as RideStatus,
  pickupLocation: null,
  dropLocation: null,
  stops: [],
  driverLocation: null,
  estimate: null,
  selectedVehicleType: 'cab',
  vouchers: [],
  selectedVoucher: null,
  walletBalance: 0,
  rideCredits: 0,
  rideHistory: [],
  isLoading: false,
  isFindingDriver: false,
};

export const useRideStore = create<RideState>((set) => ({
  ...initialState,

  setPickupLocation: (location) =>
    set({ pickupLocation: location }),

  setDropLocation: (location) =>
    set({ dropLocation: location }),

  addStop: (location) =>
    set((state) => ({
      stops: [...state.stops, location],
    })),

  removeStop: (index) =>
    set((state) => ({
      stops: state.stops.filter((_, i) => i !== index),
    })),

  updateStop: (index, location) =>
    set((state) => ({
      stops: state.stops.map((stop, i) => (i === index ? location : stop)),
    })),

  clearStops: () =>
    set({ stops: [] }),

  setSelectedVehicleType: (type) =>
    set({ selectedVehicleType: type }),

  setEstimate: (estimate) =>
    set({ estimate }),

  setRide: (ride) =>
    set({
      currentRide: ride,
      rideStatus: ride.status,
    }),

  updateRideStatus: (status) =>
    set({ rideStatus: status }),

  setDriverLocation: (location) =>
    set({ driverLocation: location }),

  setRideCompleted: (data) =>
    set({
      rideStatus: 'completed',
      currentRide: {
        ...useRideStore.getState().currentRide,
        ...data,
        status: 'completed',
      },
    }),

  cancelRide: (reason) =>
    set((state) => ({
      rideStatus: 'cancelled' as RideStatus,
      currentRide: state.currentRide ? {
        ...state.currentRide,
        status: 'cancelled' as RideStatus,
      } : null,
    })),

  setVouchers: (vouchers) =>
    set({ vouchers }),

  selectVoucher: (voucher) =>
    set({ selectedVoucher: voucher }),

  setWalletBalance: (balance, rideCredits) =>
    set({ walletBalance: balance, rideCredits }),

  setRideHistory: (rides) =>
    set({ rideHistory: rides }),

  addToRideHistory: (ride) =>
    set((state) => ({
      rideHistory: [ride, ...state.rideHistory],
    })),

  setLoading: (loading) =>
    set({ isLoading: loading }),

  setFindingDriver: (finding) =>
    set({ isFindingDriver: finding }),

  reset: () =>
    set(initialState),
}));

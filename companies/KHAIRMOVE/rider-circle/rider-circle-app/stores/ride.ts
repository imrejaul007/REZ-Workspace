/**
 * Ride Store
 * Manages active ride state
 */

import { create } from 'zustand';
import { api } from '../services/api';

interface GPSPoint {
  coordinates: [number, number];
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
}

interface Waypoint {
  name?: string;
  coordinates: [number, number];
  type: 'start' | 'stop' | 'fuel' | 'food' | 'viewpoint' | 'checkpoint' | 'end';
  timestamp?: Date;
}

interface Ride {
  _id: string;
  title: string;
  status: 'planned' | 'active' | 'paused' | 'completed';
  startTime: Date;
  route: {
    distance: number;
    track: GPSPoint[];
    waypoints: Waypoint[];
    startLocation: { name?: string; coordinates: [number, number] };
    endLocation?: { name?: string; coordinates: [number, number] };
  };
  stats: {
    distance: number;
    avgSpeed: number;
    maxSpeed: number;
    duration: number;
  };
}

interface RideState {
  activeRide: Ride | null;
  isRiding: boolean;
  isPaused: boolean;
  trackPoints: GPSPoint[];
  totalDistance: number;
  currentSpeed: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  startRide: (bikeId: string, title: string, startLocation: { name?: string; coordinates: [number, number] }) => Promise<void>;
  updateLocation: (point: GPSPoint) => Promise<void>;
  addWaypoint: (waypoint: Omit<Waypoint, 'timestamp'>) => Promise<void>;
  pauseRide: () => Promise<void>;
  resumeRide: () => Promise<void>;
  completeRide: (endLocation?: { name?: string; coordinates: [number, number] }, expenses?: { fuel?: number; tolls?: number; food?: number }) => Promise<void>;
  checkActiveRide: () => Promise<void>;
  clearError: () => void;
}

export const useRideStore = create<RideState>((set, get) => ({
  activeRide: null,
  isRiding: false,
  isPaused: false,
  trackPoints: [],
  totalDistance: 0,
  currentSpeed: 0,
  isLoading: false,
  error: null,

  startRide: async (bikeId, title, startLocation) => {
    set({ isLoading: true, error: null });

    try {
      const ride = await api.startRide({
        title,
        bikeId,
        startLocation,
      });

      set({
        activeRide: ride,
        isRiding: true,
        isPaused: false,
        trackPoints: [],
        totalDistance: 0,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to start ride',
        isLoading: false,
      });
    }
  },

  updateLocation: async (point) => {
    const { activeRide, trackPoints } = get();

    if (!activeRide || !activeRide._id) return;

    try {
      const result = await api.addTrackPoint(activeRide._id, point);

      set({
        trackPoints: [...trackPoints, point],
        totalDistance: result.totalDistance,
        currentSpeed: point.speed || 0,
      });
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  },

  addWaypoint: async (waypoint) => {
    const { activeRide } = get();

    if (!activeRide || !activeRide._id) return;

    try {
      const newWaypoint = await api.addWaypoint(activeRide._id, waypoint);

      if (get().activeRide) {
        set({
          activeRide: {
            ...get().activeRide!,
            route: {
              ...get().activeRide!.route,
              waypoints: [...get().activeRide!.route.waypoints, newWaypoint],
            },
          },
        });
      }
    } catch (error) {
      console.error('Failed to add waypoint:', error);
    }
  },

  pauseRide: async () => {
    const { activeRide } = get();

    if (!activeRide || !activeRide._id) return;

    try {
      const ride = await api.pauseRide(activeRide._id);
      set({ activeRide: ride, isPaused: true });
    } catch (error) {
      console.error('Failed to pause ride:', error);
    }
  },

  resumeRide: async () => {
    const { activeRide } = get();

    if (!activeRide || !activeRide._id) return;

    try {
      const ride = await api.resumeRide(activeRide._id);
      set({ activeRide: ride, isPaused: false });
    } catch (error) {
      console.error('Failed to resume ride:', error);
    }
  },

  completeRide: async (endLocation, expenses) => {
    const { activeRide } = get();

    if (!activeRide || !activeRide._id) return;

    set({ isLoading: true });

    try {
      const ride = await api.completeRide(activeRide._id, { endLocation, expenses });

      set({
        activeRide: null,
        isRiding: false,
        isPaused: false,
        trackPoints: [],
        totalDistance: 0,
        currentSpeed: 0,
        isLoading: false,
      });

      return ride;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to complete ride',
        isLoading: false,
      });
    }
  },

  checkActiveRide: async () => {
    try {
      const ride = await api.getActiveRide();

      if (ride) {
        set({
          activeRide: ride,
          isRiding: ride.status === 'active',
          isPaused: ride.status === 'paused',
        });
      } else {
        set({
          activeRide: null,
          isRiding: false,
          isPaused: false,
        });
      }
    } catch {
      // No active ride
      set({
        activeRide: null,
        isRiding: false,
        isPaused: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
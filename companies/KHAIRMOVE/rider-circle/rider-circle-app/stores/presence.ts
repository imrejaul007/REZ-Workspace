/**
 * Presence Store
 * Manages live presence and nearby riders
 */

import { create } from 'zustand';
import { api } from '../services/api';

interface RiderPresence {
  riderId: string;
  displayName: string;
  avatar?: string;
  coordinates: [number, number];
  status: 'riding' | 'idle' | 'online';
  bikeNickname?: string;
  lastUpdate: Date;
}

interface PresenceStats {
  total: number;
  riding: number;
  idle: number;
  online: number;
  topCities: { city: string; count: number }[];
}

interface PresenceState {
  nearbyRiders: RiderPresence[];
  liveStats: PresenceStats | null;
  isTracking: boolean;
  currentLocation: [number, number] | null;
  lastUpdate: Date | null;

  // Actions
  updateLocation: (coordinates: [number, number], speed?: number, heading?: number) => Promise<void>;
  goOffline: () => Promise<void>;
  getNearbyRiders: (radius?: number) => Promise<void>;
  getLiveStats: () => Promise<void>;
  startTracking: () => void;
  stopTracking: () => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  nearbyRiders: [],
  liveStats: null,
  isTracking: false,
  currentLocation: null,
  lastUpdate: null,

  updateLocation: async (coordinates, speed, heading) => {
    const { isTracking } = get();

    set({ currentLocation: coordinates, lastUpdate: new Date() });

    if (!isTracking) return;

    try {
      await api.updatePresence({
        coordinates,
        speed,
        heading,
        status: 'online',
      });

      // Also update ride presence if riding
      const { activeRide } = await import('./ride').then(m => m.useRideStore.getState());
      if (activeRide?._id) {
        await api.updatePresence({
          coordinates,
          speed,
          heading,
          status: 'riding',
          rideId: activeRide._id,
        });
      }
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  },

  goOffline: async () => {
    try {
      await api.goOffline();
      set({
        isTracking: false,
        currentLocation: null,
      });
    } catch (error) {
      console.error('Failed to go offline:', error);
    }
  },

  getNearbyRiders: async (radius = 10) => {
    const { currentLocation } = get();

    if (!currentLocation) return;

    try {
      const result = await api.getNearbyRiders(
        currentLocation[1], // lat
        currentLocation[0], // lng
        radius
      );

      set({ nearbyRiders: result.riders });
    } catch (error) {
      console.error('Failed to get nearby riders:', error);
    }
  },

  getLiveStats: async () => {
    try {
      const stats = await api.getLiveStats();
      set({ liveStats: stats });
    } catch (error) {
      console.error('Failed to get live stats:', error);
    }
  },

  startTracking: () => set({ isTracking: true }),
  stopTracking: () => set({ isTracking: false }),
}));
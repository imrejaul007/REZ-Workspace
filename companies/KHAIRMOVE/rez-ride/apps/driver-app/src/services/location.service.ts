import { logger } from '../../shared/logger';
/**
 * Location Tracking Service for Driver App
 * Handles GPS tracking and driver location updates
 */

import * as Location from 'expo-location';
import { driverApi } from './api.service';

export interface DriverLocation {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  accuracy: number;
  timestamp: number;
}

type LocationCallback = (location: DriverLocation) => void;
type StatusCallback = (status: 'active' | 'paused' | 'error', error?: string) => void;

class LocationService {
  private isTracking = false;
  private watchSubscription: Location.LocationSubscription | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private lastLocation: DriverLocation | null = null;
  private locationCallbacks: LocationCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];
  private updateQueue: DriverLocation[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private readonly UPDATE_INTERVAL_MS = 3000; // Send location every 3 seconds
  private readonly MIN_DISTANCE_METERS = 10; // Minimum distance to trigger update

  /**
   * Initialize location service
   */
  async initialize(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        logger.warn('Location permission denied');
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        logger.warn('Background location permission denied - limited tracking');
      }

      // Get initial location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      this.lastLocation = this.transformLocation(location);
      return true;
    } catch (error) {
      logger.error('Location initialization failed:', error);
      return false;
    }
  }

  /**
   * Start tracking driver location
   */
  async startTracking(): Promise<boolean> {
    if (this.isTracking) {
      logger.info('Location tracking already active');
      return true;
    }

    try {
      // Verify permissions
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const granted = await this.initialize();
        if (!granted) {
          this.notifyStatus('error', 'Location permission not granted');
          return false;
        }
      }

      this.isTracking = true;
      this.notifyStatus('active');

      // Start watching location
      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: this.MIN_DISTANCE_METERS,
          timeInterval: this.UPDATE_INTERVAL_MS,
        },
        (location) => {
          const driverLocation = this.transformLocation(location);
          this.handleLocationUpdate(driverLocation);
        }
      );

      // Start periodic flush
      this.flushInterval = setInterval(() => {
        this.flushUpdates();
      }, this.UPDATE_INTERVAL_MS * 2);

      logger.info('Location tracking started');
      return true;
    } catch (error) {
      logger.error('Failed to start location tracking:', error);
      this.isTracking = false;
      this.notifyStatus('error', 'Failed to start tracking');
      return false;
    }
  }

  /**
   * Stop tracking driver location
   */
  stopTracking(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    this.isTracking = false;
    this.flushUpdates(); // Final flush
    this.notifyStatus('paused');
    logger.info('Location tracking stopped');
  }

  /**
   * Handle incoming location update
   */
  private handleLocationUpdate(location: DriverLocation): void {
    this.lastLocation = location;
    this.locationCallbacks.forEach((cb) => cb(location));

    // Add to queue
    this.updateQueue.push(location);
  }

  /**
   * Flush pending location updates to server
   */
  private async flushUpdates(): Promise<void> {
    if (this.updateQueue.length === 0) return;

    // Get the latest location
    const latest = this.updateQueue[this.updateQueue.length - 1];
    this.updateQueue = [];

    try {
      await driverApi.updateLocation({
        lat: latest.lat,
        lng: latest.lng,
        heading: latest.heading,
        speed: latest.speed,
      });
    } catch (error) {
      logger.error('Failed to send location update:', error);
      // Re-add to queue on failure
      this.updateQueue.push(latest);
    }
  }

  /**
   * Transform raw location to driver location
   */
  private transformLocation(location: Location.LocationObject): DriverLocation {
    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      heading: location.coords.heading || 0,
      speed: location.coords.speed || 0,
      accuracy: location.coords.accuracy || 0,
      timestamp: location.timestamp,
    };
  }

  /**
   * Get last known location
   */
  getLastLocation(): DriverLocation | null {
    return this.lastLocation;
  }

  /**
   * Check if tracking is active
   */
  isActive(): boolean {
    return this.isTracking;
  }

  /**
   * Subscribe to location updates
   */
  onLocationUpdate(callback: LocationCallback): () => void {
    this.locationCallbacks.push(callback);
    return () => {
      this.locationCallbacks = this.locationCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Notify all status callbacks
   */
  private notifyStatus(status: 'active' | 'paused' | 'error', error?: string): void {
    this.statusCallbacks.forEach((cb) => cb(status, error));
  }

  /**
   * Calculate distance between two points (Haversine)
   */
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stopTracking();
    this.locationCallbacks = [];
    this.statusCallbacks = [];
  }
}

export const locationService = new LocationService();
export default locationService;

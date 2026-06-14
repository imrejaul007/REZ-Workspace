/**
 * Location Intelligence Service Integration
 *
 * Connects to REZ-location-intelligence (4040)
 * - Location patterns
 * - Geofencing
 * - Frequent routes
 * - Destination prediction
 */

import axios from 'axios';
import { Logger } from '@nestjs/common';

export interface LocationPattern {
  userId: string;
  frequentLocations: {
    type: 'home' | 'work' | 'frequent';
    address: string;
    lat: number;
    lng: number;
    visitsPerWeek: number;
    avgStayDuration: number;
  }[];
  frequentRoutes: {
    from: { lat: number; lng: number; address: string };
    to: { lat: number; lng: number; address: string };
    count: number;
    avgDistance: number;
    avgDuration: number;
  }[];
  peakHours: {
    dayOfWeek: number;
    hour: number;
    activityType: 'pickup' | 'drop' | 'both';
  }[];
}

export interface Geofence {
  id: string;
  name: string;
  type: 'zone' | 'corridor' | 'poi';
  center: { lat: number; lng: number };
  radius: number; // meters
  polygon?: { lat: number; lng: number }[];
}

export interface GeofenceEvent {
  geofenceId: string;
  userId: string;
  type: 'enter' | 'exit' | 'dwell';
  location: { lat: number; lng: number };
  timestamp: Date;
  dwellTime?: number;
}

export class LocationIntelligenceService {
  private readonly logger = new Logger('LocationIntelligenceService');

  private readonly LOCATION_URL = process.env.REZ_LOCATION_INTELLIGENCE_URL || 'http://localhost:4040';
  private readonly INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

  private http = axios.create({
    timeout: 500,
    headers: {
      'X-Internal-Token': this.INTERNAL_TOKEN,
      'Content-Type': 'application/json',
    },
  });

  // Local cache for patterns
  private patternCache = new Map<string, LocationPattern>();

  /**
   * Get user's location patterns
   */
  async getUserPatterns(userId: string): Promise<LocationPattern | null> {
    // Check cache
    if (this.patternCache.has(userId)) {
      return this.patternCache.get(userId)!;
    }

    try {
      const response = await this.http.get(`${this.LOCATION_URL}/api/patterns/${userId}`);
      const patterns = response.data;
      this.patternCache.set(userId, patterns);
      return patterns;
    } catch (error) {
      this.logger.warn(`Location patterns lookup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Predict next destination
   */
  async predictDestination(userId: string, context: {
    currentLocation: { lat: number; lng: number };
    time: Date;
    dayOfWeek: number;
  }): Promise<{
    predictions: {
      address: string;
      lat: number;
      lng: number;
      probability: number;
      type: 'home' | 'work' | 'frequent' | 'new';
    }[];
  }> {
    try {
      const response = await this.http.post(`${this.LOCATION_URL}/api/predict/destination`, {
        userId,
        ...context,
      });
      return response.data;
    } catch (error) {
      this.logger.warn(`Destination prediction failed: ${error.message}`);
      return { predictions: [] };
    }
  }

  /**
   * Get optimal pickup zone
   */
  async getOptimalPickupZone(lat: number, lng: number): Promise<{
    zoneId: string;
    address: string;
    lat: number;
    lng: number;
    avgPickupTime: number;
    driverAvailability: number;
  } | null> {
    try {
      const response = await this.http.get(`${this.LOCATION_URL}/api/zones/pickup`, {
        params: { lat, lng },
      });
      return response.data;
    } catch (error) {
      this.logger.warn(`Optimal zone lookup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Record user location
   */
  async recordLocation(userId: string, data: {
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: Date;
    activity: 'moving' | 'stationary' | 'pickup' | 'drop';
  }): Promise<void> {
    try {
      await this.http.post(`${this.LOCATION_URL}/api/locations`, {
        userId,
        ...data,
      });
    } catch (error) {
      this.logger.warn(`Location recording failed: ${error.message}`);
    }
  }

  /**
   * Get geofences for area
   */
  async getGeofences(lat: number, lng: number, radiusMeters: number = 5000): Promise<Geofence[]> {
    try {
      const response = await this.http.get(`${this.LOCATION_URL}/api/geofences`, {
        params: { lat, lng, radius: radiusMeters },
      });
      return response.data.geofences;
    } catch (error) {
      this.logger.warn(`Geofences lookup failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Check if location is inside geofence
   */
  async checkGeofence(geofenceId: string, lat: number, lng: number): Promise<boolean> {
    try {
      const response = await this.http.get(`${this.LOCATION_URL}/api/geofences/${geofenceId}/check`, {
        params: { lat, lng },
      });
      return response.data.inside;
    } catch (error) {
      // Local check
      return this.isInsideGeofenceLocal(lat, lng, geofenceId);
    }
  }

  /**
   * Get hot zones (high demand areas)
   */
  async getHotZones(lat: number, lng: number, radiusKm: number = 10): Promise<{
    zones: {
      lat: number;
      lng: number;
      intensity: number;
      type: 'demand' | 'supply' | 'balanced';
    }[];
    timestamp: Date;
  }> {
    try {
      const response = await this.http.get(`${this.LOCATION_URL}/api/hot-zones`, {
        params: { lat, lng, radius: radiusKm },
      });
      return response.data;
    } catch (error) {
      this.logger.warn(`Hot zones lookup failed: ${error.message}`);
      return { zones: [], timestamp: new Date() };
    }
  }

  /**
   * Get route statistics
   */
  async getRouteStats(userId: string, from: { lat: number; lng: number }, to: { lat: number; lng: number }): Promise<{
    avgDistance: number;
    avgDuration: number;
    avgPrice: number;
    bestTimeToTravel: { hour: number; dayOfWeek: number };
    alternatives: {
      route: string;
      distance: number;
      duration: number;
    }[];
  } | null> {
    try {
      const response = await this.http.post(`${this.LOCATION_URL}/api/routes/stats`, {
        userId,
        from,
        to,
      });
      return response.data;
    } catch (error) {
      this.logger.warn(`Route stats lookup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Record geofence event
   */
  async recordGeofenceEvent(event: GeofenceEvent): Promise<void> {
    try {
      await this.http.post(`${this.LOCATION_URL}/api/geofences/events`, event);
    } catch (error) {
      this.logger.warn(`Geofence event recording failed: ${error.message}`);
    }
  }

  // Local fallback for geofence check
  private isInsideGeofenceLocal(lat: number, lng: number, geofenceId: string): boolean {
    // Simplified: just return false (service will handle)
    return false;
  }
}

export const locationIntelligenceService = new LocationIntelligenceService();

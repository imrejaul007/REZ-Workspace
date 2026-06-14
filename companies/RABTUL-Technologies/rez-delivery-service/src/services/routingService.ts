import axios from 'axios';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import redisClient from '../config/redis';

// Location interface
interface Location {
  lat: number;
  lng: number;
}

// Destination interface
interface Destination {
  id: string;
  lat: number;
  lng: number;
  type: 'pickup' | 'dropoff' | 'rider';
}

// Route result interface
interface RouteResult {
  distance: number; // in meters
  duration: number; // in seconds
  geometry?;
  steps?: Array<{
    instruction: string;
    distance: number;
    duration: number;
  }>;
}

// Optimization result
interface OptimizationResult {
  optimizedOrder: string[];
  totalDistance: number;
  totalDuration: number;
  routes: RouteResult[];
}

class RoutingService {
  private readonly MAPBOX_API = 'https://api.mapbox.com/directions/v5/mapbox/driving-traffic';
  private readonly OSRM_API = 'https://router.project-osrm.org/route/v1/driving';
  private readonly apiKey: string;

  // In-memory destination cache for route optimization
  private destinationCache: Map<string, Destination> = new Map();

  constructor() {
    this.apiKey = process.env.MAPBOX_API_KEY || '';
  }

  /**
   * Calculate distance and ETA between two points
   */
  async calculateDistance(
    origin: Location,
    destination: Location,
    options: { traffic?: boolean } = {}
  ): Promise<RouteResult> {
    try {
      const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;

      // Try Mapbox first
      if (this.apiKey) {
        try {
          const response = await axios.get(`${this.MAPBOX_API}/${coordinates}`, {
            params: {
              access_token: this.apiKey,
              geometries: 'geojson',
              overview: 'full',
              steps: true
            },
            timeout: 5000
          });

          if (response.data.routes && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            return {
              distance: route.distance,
              duration: options.traffic ? route.duration : route.duration,
              geometry: route.geometry,
              steps: this.parseSteps(response.data.routes[0].legs?.[0]?.steps)
            };
          }
        } catch (mapboxError) {
          logger.warn('Mapbox API failed, falling back to OSRM', { error: mapboxError });
        }
      }

      // Fallback to OSRM
      const osrmResponse = await axios.get(`${this.OSRM_API}/${coordinates}`, {
        params: {
          overview: 'full',
          geometries: 'geojson',
          steps: true
        },
        timeout: 5000
      });

      if (osrmResponse.data.code === 'Ok' && osrmResponse.data.routes.length > 0) {
        const route = osrmResponse.data.routes[0];
        return {
          distance: route.distance,
          duration: route.duration,
          geometry: route.geometry,
          steps: this.parseSteps(route.legs?.[0]?.steps)
        };
      }

      // Fallback to Haversine distance
      return this.calculateFallback(origin, destination);
    } catch (error) {
      logger.error('Route calculation failed', { origin, destination, error: error.message });
      return this.calculateFallback(origin, destination);
    }
  }

  /**
   * Parse route steps for turn-by-turn directions
   */
  private parseSteps(steps: unknown[]): Array<{
    instruction: string;
    distance: number;
    duration: number;
  }> {
    if (!steps) return [];

    return steps.map(step => ({
      instruction: step.maneuver?.instruction || step.maneuver?.type || 'Continue',
      distance: step.distance || 0,
      duration: step.duration || 0
    }));
  }

  /**
   * Fallback calculation using Haversine formula
   */
  private calculateFallback(origin: Location, destination: Location): RouteResult {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (origin.lat * Math.PI) / 180;
    const φ2 = (destination.lat * Math.PI) / 180;
    const Δφ = ((destination.lat - origin.lat) * Math.PI) / 180;
    const Δλ = ((destination.lng - origin.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Estimate duration at 30 km/h average speed (including traffic)
    const duration = (distance / 1000 / 30) * 3600;

    return {
      distance,
      duration
    };
  }

  /**
   * Add destination to cache for route optimization
   */
  addDestination(destination: Destination): void {
    this.destinationCache.set(destination.id, destination);
  }

  /**
   * Remove destination from cache
   */
  removeDestination(id: string): void {
    this.destinationCache.delete(id);
  }

  /**
   * Clear all cached destinations
   */
  clearDestinations(): void {
    this.destinationCache.clear();
  }

  /**
   * Optimize route for multiple stops using nearest neighbor algorithm
   */
  async optimizeRoute(
    startLocation: Location,
    destinationIds: string[],
    options: { minimize?: 'distance' | 'time' } = {}
  ): Promise<OptimizationResult> {
    try {
      if (destinationIds.length === 0) {
        return {
          optimizedOrder: [],
          totalDistance: 0,
          totalDuration: 0,
          routes: []
        };
      }

      // Get destinations from cache
      const destinations = destinationIds
        .map(id => this.destinationCache.get(id))
        .filter((d): d is Destination => d !== undefined);

      if (destinations.length !== destinationIds.length) {
        throw new AppError('Some destination IDs not found in cache', 400);
      }

      // Use nearest neighbor algorithm for optimization
      const optimizedOrder = this.nearestNeighborOptimization(startLocation, destinations);

      // Calculate routes for the optimized order
      const routes: RouteResult[] = [];
      let currentLocation = startLocation;
      let totalDistance = 0;
      let totalDuration = 0;

      for (const destId of optimizedOrder) {
        const destination = this.destinationCache.get(destId);
        if (!destination) continue;

        const route = await this.calculateDistance(currentLocation, {
          lat: destination.lat,
          lng: destination.lng
        });

        routes.push(route);
        totalDistance += route.distance;
        totalDuration += route.duration;
        currentLocation = { lat: destination.lat, lng: destination.lng };
      }

      // Cache the optimized route in Redis
      const cacheKey = `route:optimized:${destinationIds.sort().join(':')}`;
      await redisClient.setex(cacheKey, 3600, JSON.stringify({
        optimizedOrder,
        totalDistance,
        totalDuration
      }));

      logger.info('Route optimized', {
        stops: destinationIds.length,
        totalDistance: Math.round(totalDistance),
        totalDuration: Math.round(totalDuration / 60)
      });

      return {
        optimizedOrder,
        totalDistance,
        totalDuration,
        routes
      };
    } catch (error) {
      logger.error('Route optimization failed', { destinationIds, error: error.message });
      throw error;
    }
  }

  /**
   * Nearest neighbor algorithm for route optimization
   */
  private nearestNeighborOptimization(
    start: Location,
    destinations: Destination[]
  ): string[] {
    const result: string[] = [];
    const remaining = new Set(destinations.map(d => d.id));
    let currentLocation = start;

    while (remaining.size > 0) {
      let nearestId: string | null = null;
      let nearestDistance = Infinity;

      for (const id of remaining) {
        const dest = this.destinationCache.get(id);
        if (!dest) continue;

        const distance = this.calculateHaversineDistance(
          currentLocation.lat,
          currentLocation.lng,
          dest.lat,
          dest.lng
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestId = id;
        }
      }

      if (nearestId) {
        const dest = this.destinationCache.get(nearestId);
        result.push(nearestId);
        remaining.delete(nearestId);
        currentLocation = { lat: dest!.lat, lng: dest!.lng };
      }
    }

    return result;
  }

  /**
   * Calculate Haversine distance between two points
   */
  private calculateHaversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Get live tracking for a delivery
   */
  async getLiveTracking(orderId: string): Promise<{
    currentLocation: Location;
    eta: number;
    destination: Location;
    progress: number;
    route?;
  } | null> {
    try {
      // Try to get from Redis cache first
      const cacheKey = `tracking:${orderId}`;
      const cached = await redisClient.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      // Return null if no tracking data available
      return null;
    } catch (error) {
      logger.error('Failed to get live tracking', { orderId, error: error.message });
      return null;
    }
  }

  /**
   * Update live tracking data in cache
   */
  async updateLiveTracking(
    orderId: string,
    location: Location,
    eta: number,
    destination: Location
  ): Promise<void> {
    try {
      const progress = this.calculateProgress(location, destination);

      const trackingData = {
        currentLocation: location,
        eta,
        destination,
        progress,
        updatedAt: new Date().toISOString()
      };

      // Cache for 5 minutes
      const cacheKey = `tracking:${orderId}`;
      await redisClient.setex(cacheKey, 300, JSON.stringify(trackingData));

      // Also publish to tracking channel for real-time updates
      await redisClient.publish(`tracking:${orderId}`, JSON.stringify(trackingData));
    } catch (error) {
      logger.error('Failed to update live tracking', { orderId, error: error.message });
    }
  }

  /**
   * Calculate progress percentage
   */
  private calculateProgress(current: Location, destination: Location): number {
    // This would typically use the route geometry for accurate progress
    // For simplicity, using straight-line distance
    const totalDistance = this.calculateHaversineDistance(
      current.lat,
      current.lng,
      destination.lat,
      destination.lng
    );

    // Assume starting point was at least 10km away for meaningful progress
    const startDistance = Math.max(totalDistance + 1, 10);
    const progress = ((startDistance - totalDistance) / startDistance) * 100;

    return Math.min(Math.max(progress, 0), 100);
  }

  /**
   * Geocode an address to coordinates
   */
  async geocodeAddress(address: string): Promise<Location | null> {
    try {
      if (!this.apiKey) {
        // Fallback to Nominatim (OpenStreetMap)
        const response = await axios.get(
          'https://nominatim.openstreetmap.org/search',
          {
            params: {
              q: address,
              format: 'json',
              limit: 1
            },
            headers: {
              'User-Agent': 'ReZDeliveryService/1.0'
            },
            timeout: 5000
          }
        );

        if (response.data.length > 0) {
          return {
            lat: parseFloat(response.data[0].lat),
            lng: parseFloat(response.data[0].lon)
          };
        }
        return null;
      }

      // Use Mapbox Geocoding API
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`,
        {
          params: {
            access_token: this.apiKey,
            limit: 1
          },
          timeout: 5000
        }
      );

      if (response.data.features && response.data.features.length > 0) {
        const [lng, lat] = response.data.features[0].center;
        return { lat, lng };
      }

      return null;
    } catch (error) {
      logger.error('Geocoding failed', { address, error: error.message });
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const url = this.apiKey
        ? `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`
        : `https://nominatim.openstreetmap.org/reverse`;

      const params = this.apiKey
        ? { access_token: this.apiKey }
        : { format: 'json' };

      const response = await axios.get(url, {
        params,
        timeout: 5000
      });

      if (this.apiKey) {
        if (response.data.features && response.data.features.length > 0) {
          return response.data.features[0].place_name;
        }
      } else {
        if (response.data.display_name) {
          return response.data.display_name;
        }
      }

      return null;
    } catch (error) {
      logger.error('Reverse geocoding failed', { lat, lng, error: error.message });
      return null;
    }
  }

  /**
   * Check if a point is within a zone (polygon)
   */
  async isWithinZone(
    location: Location,
    zonePolygon: Array<{ lat: number; lng: number }>
  ): Promise<boolean> {
    // Ray casting algorithm for point-in-polygon
    let inside = false;
    const x = location.lng;
    const y = location.lat;

    for (let i = 0, j = zonePolygon.length - 1; i < zonePolygon.length; j = i++) {
      const xi = zonePolygon[i].lng;
      const yi = zonePolygon[i].lat;
      const xj = zonePolygon[j].lng;
      const yj = zonePolygon[j].lat;

      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }
}

export default new RoutingService();

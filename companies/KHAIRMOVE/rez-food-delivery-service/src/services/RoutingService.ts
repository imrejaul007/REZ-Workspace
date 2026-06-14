import Redis from 'ioredis';
import { DeliveryPerson } from '../models/DeliveryPerson';
import { DeliveryOrder } from '../models/DeliveryOrder';

export interface Route {
  distance: number; // km
  duration: number; // seconds
  polyline?: string; // encoded polyline for map
  waypoints?: { lat: number; lng: number }[];
}

export interface ETAResult {
  eta: number; // seconds
  distance: number; // km
}

export class RoutingService {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Calculate ETA between two points using Haversine distance
   * In production, this would call a routing API (Google Maps, Mapbox, OSRM)
   */
  async calculateETA(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<number> {
    const distance = this.calculateHaversineDistance(origin, destination);

    // Determine average speed based on distance
    let avgSpeedKmh: number;
    if (distance < 1) {
      avgSpeedKmh = 15; // Slow speed for short distances (traffic, stops)
    } else if (distance < 3) {
      avgSpeedKmh = 20;
    } else if (distance < 5) {
      avgSpeedKmh = 25;
    } else {
      avgSpeedKmh = 30; // Higher speed for longer distances (highways)
    }

    // Apply time-based congestion factor
    const congestionFactor = this.getCongestionFactor();
    const effectiveSpeed = avgSpeedKmh / congestionFactor;

    // Calculate ETA in seconds
    const etaSeconds = Math.round((distance / effectiveSpeed) * 3600);
    return etaSeconds;
  }

  /**
   * Get route between two points
   * In production, this would call a routing API
   */
  async getRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<Route> {
    const distance = this.calculateHaversineDistance(origin, destination);
    const eta = await this.calculateETA(origin, destination);

    return {
      distance: Math.round(distance * 100) / 100,
      duration: eta,
      // Polyline would come from actual routing API
      waypoints: [origin, destination],
    };
  }

  /**
   * Optimize multi-stop route
   */
  async optimizeRoute(
    start: { lat: number; lng: number },
    stops: { lat: number; lng: number; orderId: string }[]
  ): Promise<{
    order: number[];
    totalDistance: number;
    totalDuration: number;
    estimatedTimes: { stopIndex: number; eta: Date }[];
  }> {
    if (stops.length === 0) {
      return { order: [], totalDistance: 0, totalDuration: 0, estimatedTimes: [] };
    }

    // Simple nearest-neighbor optimization
    // In production, use OR-Tools VRP solver or similar
    const optimizedOrder: number[] = [];
    const remaining = stops.map((_, i) => i);
    let currentLocation = start;
    let totalDistance = 0;
    let totalDuration = 0;
    const estimatedTimes: { stopIndex: number; eta: Date }[] = [];

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let nearestDistance = Infinity;

      for (const idx of remaining) {
        const dist = this.calculateHaversineDistance(currentLocation, stops[idx]);
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestIdx = idx;
        }
      }

      optimizedOrder.push(nearestIdx);
      remaining.splice(remaining.indexOf(nearestIdx), 1);
      totalDistance += nearestDistance;

      const legEta = await this.calculateETA(currentLocation, stops[nearestIdx]);
      totalDuration += legEta;
      estimatedTimes.push({
        stopIndex: nearestIdx,
        eta: new Date(Date.now() + totalDuration * 1000),
      });

      currentLocation = stops[nearestIdx];
    }

    return {
      order: optimizedOrder,
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalDuration,
      estimatedTimes,
    };
  }

  /**
   * Find drivers near a location
   */
  async findDriversNearLocation(
    location: { lat: number; lng: number },
    radiusKm: number = 5,
    limit: number = 10
  ): Promise<{
    driverId: string;
    name: string;
    distance: number;
    location: { lat: number; lng: number };
  }[]> {
    const drivers = await DeliveryPerson.find({
      'currentLocation.coordinates': {
        $near: {
          $geometry: { type: 'Point', coordinates: [location.lng, location.lat] },
          $maxDistance: radiusKm * 1000,
        },
      },
    }).limit(limit);

    return drivers.map((driver) => ({
      driverId: driver.driverId,
      name: driver.name,
      distance: this.calculateHaversineDistance(location, driver.currentLocation!),
      location: driver.currentLocation!,
    }));
  }

  /**
   * Get traffic conditions for an area (mock implementation)
   */
  async getTrafficConditions(
    location: { lat: number; lng: number },
    radiusKm: number = 5
  ): Promise<{
    congestionLevel: 'low' | 'moderate' | 'high' | 'severe';
    averageSpeed: number; // km/h
    incidents?: { type: string; location: { lat: number; lng: number }; description: string }[];
  }> {
    // In production, call traffic API
    const hour = new Date().getHours();

    let congestionLevel: 'low' | 'moderate' | 'high' | 'severe';
    let avgSpeed: number;

    if (hour >= 9 && hour <= 11) {
      congestionLevel = 'moderate';
      avgSpeed = 20;
    } else if (hour >= 17 && hour <= 19) {
      congestionLevel = 'high';
      avgSpeed = 15;
    } else if (hour >= 12 && hour <= 14) {
      congestionLevel = 'moderate';
      avgSpeed = 22;
    } else {
      congestionLevel = 'low';
      avgSpeed = 30;
    }

    return {
      congestionLevel,
      averageSpeed: avgSpeed,
      incidents: [],
    };
  }

  private getCongestionFactor(): number {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    // Higher factor = more congestion = slower travel
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend
      if (hour >= 11 && hour <= 15) return 1.2;
      if (hour >= 18 && hour <= 21) return 1.3;
      return 1.0;
    }

    // Weekday
    if (hour >= 8 && hour <= 10) return 1.5; // Morning rush
    if (hour >= 12 && hour <= 14) return 1.3; // Lunch rush
    if (hour >= 17 && hour <= 19) return 1.6; // Evening rush
    if (hour >= 21 && hour <= 23) return 1.2; // Late evening

    return 1.0; // Off-peak
  }

  private calculateHaversineDistance(
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLng = this.toRad(coord2.lng - coord1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coord1.lat)) *
        Math.cos(this.toRad(coord2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

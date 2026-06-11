/**
 * FLEETIQ - Route Agent Service
 * AI-powered route optimization and navigation
 */

import { logger } from '../utils/logger';

// ============================================
// TYPES
// ============================================

export interface Waypoint {
  lat: number;
  lng: number;
  address?: string;
  order?: number;
}

export interface RouteRequest {
  stops: Waypoint[];
  optimize?: boolean;
  preferences?: {
    avoidTolls?: boolean;
    avoidHighways?: boolean;
    fastestRoute?: boolean;
  };
}

export interface RouteSegment {
  from: Waypoint;
  to: Waypoint;
  distance: number; // km
  duration: number; // minutes
  instructions: string[];
}

export interface RouteResult {
  success: boolean;
  route?: {
    stops: Waypoint[];
    totalDistance: number;
    totalDuration: number;
    segments: RouteSegment[];
    waypoints: Array<{ lat: number; lng: number }>;
    instructions: string[];
  };
  alternatives?: RouteResult['route'][];
  message: string;
  metrics?: {
    optimizationGain: number;
    originalDistance: number;
    optimizedDistance: number;
  };
}

// ============================================
// DISTANCE CALCULATIONS
// ============================================

const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ============================================
// GENERATE NAVIGATION INSTRUCTIONS
// ============================================

const generateInstructions = (from: Waypoint, to: Waypoint, distance: number): string[] => {
  const instructions: string[] = [];
  const direction = getDirection(from, to);

  instructions.push(`Head ${direction} from ${from.address || 'starting point'}`);
  instructions.push(`Continue for ${distance.toFixed(1)} km`);
  instructions.push(`Arrive at ${to.address || 'destination'}`);

  return instructions;
};

const getDirection = (from: Waypoint, to: Waypoint): string => {
  const dLat = to.lat - from.lat;
  const dLng = to.lng - from.lng;

  const angle = Math.atan2(dLng, dLat) * 180 / Math.PI;

  if (angle >= -22.5 && angle < 22.5) return 'North';
  if (angle >= 22.5 && angle < 67.5) return 'Northeast';
  if (angle >= 67.5 && angle < 112.5) return 'East';
  if (angle >= 112.5 && angle < 157.5) return 'Southeast';
  if (angle >= 157.5 || angle < -157.5) return 'South';
  if (angle >= -157.5 && angle < -112.5) return 'Southwest';
  if (angle >= -112.5 && angle < -67.5) return 'West';
  return 'Northwest';
};

// ============================================
// NEAREST NEIGHBOR OPTIMIZATION
// ============================================

const nearestNeighborOptimize = (stops: Waypoint[]): Waypoint[] => {
  if (stops.length <= 2) return stops;

  const optimized: Waypoint[] = [stops[0]];
  const remaining = stops.slice(1);

  while (remaining.length > 0) {
    const current = optimized[optimized.length - 1];
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const distance = haversineDistance(current.lat, current.lng, remaining[i].lat, remaining[i].lng);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    optimized.push(remaining.splice(nearestIndex, 1)[0]);
  }

  return optimized;
};

// ============================================
// 2-OPT IMPROVEMENT (local search optimization)
// ============================================

const twoOptOptimize = (stops: Waypoint[], maxIterations: number = 100): Waypoint[] => {
  if (stops.length <= 3) return stops;

  let route = [...stops];
  let improved = true;
  let iterations = 0;

  const calculateTotalDistance = (r: Waypoint[]): number => {
    let total = 0;
    for (let i = 0; i < r.length - 1; i++) {
      total += haversineDistance(r[i].lat, r[i].lng, r[i + 1].lat, r[i + 1].lng);
    }
    return total;
  };

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < route.length - 2; i++) {
      for (let j = i + 2; j < route.length; j++) {
        if (j === route.length - 1 && i === 0) continue;

        // Current edges
        const d1 = haversineDistance(route[i].lat, route[i].lng, route[i + 1].lat, route[i + 1].lng);
        const d2 = haversineDistance(route[j].lat, route[j].lng, route[(j + 1) % route.length].lat, route[(j + 1) % route.length].lng);

        // New edges after swap
        const d3 = haversineDistance(route[i].lat, route[i].lng, route[j].lat, route[j].lng);
        const d4 = haversineDistance(route[i + 1].lat, route[i + 1].lng, route[(j + 1) % route.length].lat, route[(j + 1) % route.length].lng);

        if (d3 + d4 < d1 + d2) {
          // Reverse the segment between i+1 and j
          const segment = route.slice(i + 1, j + 1).reverse();
          route = [...route.slice(0, i + 1), ...segment, ...route.slice(j + 1)];
          improved = true;
        }
      }
    }
  }

  return route;
};

// ============================================
// CALCULATE ROUTE
// ============================================

export const calculateRoute = async (request: RouteRequest): Promise<RouteResult> => {
  const startTime = Date.now();

  try {
    logger.info('Calculating optimal route', { stops: request.stops.length });

    if (request.stops.length < 2) {
      return {
        success: false,
        message: 'At least 2 stops are required to calculate a route'
      };
    }

    // Sort stops if they have order
    const orderedStops = request.stops
      .filter(s => s.order !== undefined)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const unorderedStops = request.stops.filter(s => s.order === undefined);

    // Calculate original route distance (if ordered)
    let originalDistance = 0;
    if (orderedStops.length >= 2) {
      for (let i = 0; i < orderedStops.length - 1; i++) {
        originalDistance += haversineDistance(
          orderedStops[i].lat, orderedStops[i].lng,
          orderedStops[i + 1].lat, orderedStops[i + 1].lng
        );
      }
    }

    // Optimize if requested
    let optimizedStops: Waypoint[];
    if (request.optimize && unorderedStops.length >= 2) {
      // First apply nearest neighbor, then 2-opt for fine-tuning
      const nnResult = nearestNeighborOptimize(unorderedStops);
      optimizedStops = orderedStops.length > 0
        ? [...orderedStops.slice(0, -1), ...nnResult, orderedStops[orderedStops.length - 1]]
        : nnResult;

      if (optimizedStops.length >= 3) {
        optimizedStops = twoOptOptimize(optimizedStops);
      }
    } else {
      optimizedStops = [...orderedStops, ...unorderedStops];
    }

    // Build route segments
    const segments: RouteSegment[] = [];
    const waypoints: Array<{ lat: number; lng: number }> = [];
    const instructions: string[] = [];
    let totalDistance = 0;
    let totalDuration = 0;

    // Average speed based on preferences
    const avgSpeed = request.preferences?.fastestRoute ? 50 :
                     request.preferences?.avoidHighways ? 30 : 40;

    for (let i = 0; i < optimizedStops.length - 1; i++) {
      const from = optimizedStops[i];
      const to = optimizedStops[i + 1];

      const distance = haversineDistance(from.lat, from.lng, to.lat, to.lng);
      const duration = Math.round(distance / avgSpeed * 60); // minutes

      totalDistance += distance;
      totalDuration += duration;

      waypoints.push({ lat: from.lat, lng: from.lng });
      instructions.push(...generateInstructions(from, to, distance));

      segments.push({
        from,
        to,
        distance,
        duration,
        instructions: generateInstructions(from, to, distance)
      });
    }

    // Add final waypoint
    waypoints.push({
      lat: optimizedStops[optimizedStops.length - 1].lat,
      lng: optimizedStops[optimizedStops.length - 1].lng
    });

    const processingTime = Date.now() - startTime;

    logger.info('Route calculated', {
      stops: optimizedStops.length,
      totalDistance: Math.round(totalDistance),
      processingTime
    });

    return {
      success: true,
      route: {
        stops: optimizedStops,
        totalDistance: Math.round(totalDistance * 10) / 10,
        totalDuration: Math.round(totalDuration),
        segments,
        waypoints,
        instructions
      },
      message: `Optimized route with ${optimizedStops.length} stops found`,
      metrics: {
        originalDistance: Math.round(originalDistance),
        optimizedDistance: Math.round(totalDistance * 10) / 10,
        optimizationGain: originalDistance > 0
          ? Math.round((originalDistance - totalDistance) / originalDistance * 100)
          : 0
      }
    };

  } catch (error) {
    logger.error('Route calculation failed', { error });
    throw error;
  }
};

// ============================================
// ESTIMATE ETA
// ============================================

export const estimateETA = async (
  origin: Waypoint,
  destination: Waypoint,
  trafficFactor: number = 1.0
): Promise<{ eta: Date; duration: number; distance: number }> => {
  const distance = haversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
  const baseSpeed = 40; // km/h
  const durationMinutes = (distance / baseSpeed) * 60 * trafficFactor;

  const eta = new Date(Date.now() + durationMinutes * 60 * 1000);

  return {
    eta,
    duration: Math.round(durationMinutes),
    distance: Math.round(distance * 10) / 10
  };
};

export default {
  calculateRoute,
  estimateETA
};
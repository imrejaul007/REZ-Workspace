/**
 * Navigation Service
 * Gate-to-gate and gate-to-facility navigation
 */

import { AIRPORTS, getAirport, getGate, calculateDistance, calculateWalkingTime, findNearestFacility } from './airportData';
import {
  NavigationRoute,
  NavigationStep,
  Coordinate,
  NearestFacility,
  Amenity
} from './types';

/**
 * Generate navigation route between two points
 */
export function generateRoute(
  airportCode: string,
  from: string | Coordinate,
  to: string | Coordinate
): NavigationRoute {
  const airport = getAirport(airportCode);
  if (!airport) {
    throw new Error(`Airport ${airportCode} not found`);
  }

  // Resolve from coordinate
  const fromCoord = typeof from === 'string'
    ? getGate(airportCode, `${airportCode}-${from}`)?.position || { lat: 0, lng: 0 }
    : from;

  // Resolve to coordinate
  const toCoord = typeof to === 'string'
    ? getGate(airportCode, `${airportCode}-${to}`)?.position || { lat: 0, lng: 0 }
    : to;

  const distance = calculateDistance(fromCoord, toCoord);
  const walkingTime = calculateWalkingTime(fromCoord, toCoord);

  // Generate steps based on distance
  const steps = generateSteps(fromCoord, toCoord, distance);

  return {
    from: fromCoord,
    to: toCoord,
    path: [fromCoord, toCoord], // Simplified - would use actual pathfinding
    distance: Math.round(distance),
    estimatedTime: walkingTime,
    steps,
  };
}

/**
 * Generate navigation steps
 */
function generateSteps(from: Coordinate, to: Coordinate, distance: number): NavigationStep[] {
  const steps: NavigationStep[] = [];

  // Calculate bearing direction
  const bearing = calculateBearing(from, to);
  const direction = getDirection(bearing);

  if (distance < 50) {
    steps.push({
      instruction: `Walk ${direction.toLowerCase()} to your destination`,
      distance: Math.round(distance),
      duration: Math.round(distance * 1.2), // seconds
    });
  } else {
    // First step: head in direction
    steps.push({
      instruction: `Head ${direction}`,
      distance: Math.round(distance * 0.3),
      duration: Math.round(distance * 0.3 * 1.2),
    });

    // Middle step: continue straight
    steps.push({
      instruction: 'Continue straight',
      distance: Math.round(distance * 0.4),
      duration: Math.round(distance * 0.4 * 1.2),
      landmark: 'Follow signs to your terminal',
    });

    // Final step: arrive
    steps.push({
      instruction: `Turn ${getFinalDirection(bearing)} and arrive at destination`,
      distance: Math.round(distance * 0.3),
      duration: Math.round(distance * 0.3 * 1.2),
    });
  }

  return steps;
}

/**
 * Calculate bearing between two points
 */
function calculateBearing(from: Coordinate, to: Coordinate): number {
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = Math.atan2(y, x);

  return (bearing * 180 / Math.PI + 360) % 360;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Get direction from bearing
 */
function getDirection(bearing: number): string {
  if (bearing >= 337.5 || bearing < 22.5) return 'North';
  if (bearing >= 22.5 && bearing < 67.5) return 'Northeast';
  if (bearing >= 67.5 && bearing < 112.5) return 'East';
  if (bearing >= 112.5 && bearing < 157.5) return 'Southeast';
  if (bearing >= 157.5 && bearing < 202.5) return 'South';
  if (bearing >= 202.5 && bearing < 247.5) return 'Southwest';
  if (bearing >= 247.5 && bearing < 292.5) return 'West';
  if (bearing >= 292.5 && bearing < 337.5) return 'Northwest';
  return 'North';
}

/**
 * Get final turn direction
 */
function getFinalDirection(bearing: number): string {
  if (bearing >= 337.5 || bearing < 22.5) return 'left (straight)';
  if (bearing >= 22.5 && bearing < 67.5) return 'slightly left';
  if (bearing >= 67.5 && bearing < 112.5) return 'right';
  if (bearing >= 112.5 && bearing < 157.5) return 'right';
  if (bearing >= 157.5 && bearing < 202.5) return 'around';
  if (bearing >= 202.5 && bearing < 247.5) return 'around';
  if (bearing >= 247.5 && bearing < 292.5) return 'left';
  if (bearing >= 292.5 && bearing < 337.5) return 'slightly right';
  return 'left';
}

/**
 * Navigate from gate to nearest facility type
 */
export function navigateToNearestFacility(
  airportCode: string,
  gateId: string,
  facilityType: Amenity['type']
): { route: NavigationRoute; facility: Amenity } | undefined {
  const result = findNearestFacility(airportCode, gateId, facilityType);
  if (!result) return undefined;

  const route = generateRoute(
    airportCode,
    gateId,
    { lat: result.amenity.position.lat, lng: result.amenity.position.lng }
  );

  return { route, facility: result.amenity };
}

/**
 * Get all nearest facilities for a gate
 */
export function getNearestFacilities(airportCode: string, gateId: string): NearestFacility[] {
  const airport = getAirport(airportCode);
  if (!airport) return [];

  const gate = getGate(airportCode, `${airportCode}-${gateId}`);
  if (!gate) return [];

  const facilityTypes: Amenity['type'][] = ['lounge', 'restaurant', 'restroom', 'shop', 'atmmachine'];
  const nearest: NearestFacility[] = [];

  for (const type of facilityTypes) {
    const result = findNearestFacility(airportCode, gateId, type);
    if (result) {
      nearest.push({
        type,
        facility: result.amenity,
        walkingTime: result.walkingTime,
        direction: 'Check airport map',
      });
    }
  }

  return nearest.sort((a, b) => a.walkingTime - b.walkingTime);
}

/**
 * Generate step-by-step directions
 */
export function generateDirections(
  airportCode: string,
  fromGateId: string,
  toGateId: string
): string[] {
  const route = generateRoute(airportCode, fromGateId, toGateId);
  return route.steps.map(step => step.instruction);
}

import { GeoLocation, ETACalculation } from '../types';
import config from '../config';

export function calculateDistance(loc1: GeoLocation, loc2: GeoLocation): number {
  const R = 6371;
  const dLat = toRadians(loc2.latitude - loc1.latitude);
  const dLon = toRadians(loc2.longitude - loc1.longitude);
  const lat1 = toRadians(loc1.latitude);
  const lat2 = toRadians(loc2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function calculateETA(
  currentLocation: GeoLocation,
  destination: GeoLocation,
  trafficCondition: 'low' | 'medium' | 'high' = 'medium'
): ETACalculation {
  const remainingDistance = calculateDistance(currentLocation, destination);
  const baseSpeed = config.eta.averageSpeedKmh;
  const trafficMultiplier = config.eta.trafficMultiplier[trafficCondition];
  const effectiveSpeed = baseSpeed / trafficMultiplier;
  const remainingDurationMinutes = (remainingDistance / effectiveSpeed) * 60;
  const remainingDurationMs = remainingDurationMinutes * 60 * 1000;
  const estimatedArrival = new Date(Date.now() + remainingDurationMs);

  return {
    estimatedArrival,
    remainingDistance: Math.round(remainingDistance * 100) / 100,
    remainingDuration: Math.round(remainingDurationMinutes),
    trafficCondition
  };
}

export function calculateDeliveryPricing(
  distance: number,
  basePrice: number
): { distanceFee: number; totalPrice: number } {
  const distanceFeePerKm = 2.5;
  const distanceFee = Math.ceil(distance) * distanceFeePerKm;
  const totalPrice = basePrice + distanceFee;

  return {
    distanceFee: Math.round(distanceFee * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100
  };
}

export function generateRoute(
  origin: GeoLocation,
  destination: GeoLocation,
  waypoints?: GeoLocation[]
): {
  distance: number;
  estimatedDuration: number;
  waypoints: GeoLocation[];
} {
  let totalDistance = 0;
  const allWaypoints: GeoLocation[] = [];

  if (waypoints && waypoints.length > 0) {
    let prevPoint = origin;
    for (const wp of waypoints) {
      totalDistance += calculateDistance(prevPoint, wp);
      allWaypoints.push(wp);
      prevPoint = wp;
    }
    totalDistance += calculateDistance(waypoints[waypoints.length - 1], destination);
  } else {
    totalDistance = calculateDistance(origin, destination);
  }

  const estimatedDurationMinutes = (totalDistance / config.eta.averageSpeedKmh) * 60;

  return {
    distance: Math.round(totalDistance * 100) / 100,
    estimatedDuration: Math.round(estimatedDurationMinutes),
    waypoints: allWaypoints
  };
}

export function isPointInRadius(
  point: GeoLocation,
  center: GeoLocation,
  radiusKm: number
): boolean {
  const distance = calculateDistance(point, center);
  return distance <= radiusKm;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

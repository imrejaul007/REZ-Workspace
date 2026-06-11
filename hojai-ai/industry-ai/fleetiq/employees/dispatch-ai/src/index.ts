/**
 * Dispatch AI - Vehicle Allocation Agent
 * Part of FLEETIQ - Fleet Management AI
 */

import { v4 as uuidv4 } from 'uuid';

export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: 'truck' | 'van' | 'car' | 'bike';
  capacity: number;
  status: 'available' | 'on-trip' | 'maintenance' | 'idle';
  fuelLevel: number;
  lastServiceDate: string;
}

export interface Driver {
  id: string;
  name: string;
  status: 'available' | 'on-trip' | 'off-duty';
  rating: number;
}

export interface Location {
  address: string;
  lat: number;
  lng: number;
}

export interface TripRequest {
  origin: Location;
  destination: Location;
  cargoWeight: number;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  preferredVehicleType?: string;
}

export interface Allocation {
  id: string;
  vehicle: Vehicle;
  driver: Driver;
  tripId: string;
  estimatedCost: number;
  estimatedTime: number;
  matchScore: number;
  reasoning: string;
}

export class DispatchAI {
  private readonly baseRates: Record<string, number> = {
    truck: 15,
    van: 12,
    car: 8,
    bike: 5
  };

  async allocateVehicle(
    vehicles: Vehicle[],
    drivers: Driver[],
    request: TripRequest
  ): Promise<Allocation | null> {
    // Filter suitable vehicles
    const suitableVehicles = vehicles
      .filter(v => v.status === 'available')
      .filter(v => v.capacity >= request.cargoWeight)
      .filter(v => v.fuelLevel > 30)
      .filter(v => !request.preferredVehicleType || v.type === request.preferredVehicleType);

    if (suitableVehicles.length === 0) {
      return null;
    }

    // Score vehicles
    const scoredVehicles = suitableVehicles.map(v => ({
      vehicle: v,
      score: this.calculateVehicleScore(v, request)
    })).sort((a, b) => b.score - a.score);

    const bestVehicle = scoredVehicles[0].vehicle;

    // Select best driver
    const availableDrivers = drivers.filter(d => d.status === 'available');
    if (availableDrivers.length === 0) {
      return null;
    }

    const bestDriver = availableDrivers.sort((a, b) => b.rating - a.rating)[0];

    const distance = this.calculateDistance(request.origin, request.destination);
    const estimatedTime = (distance / 40) * 60; // Assume 40 km/h average
    const estimatedCost = this.calculateCost(bestVehicle, distance, estimatedTime);

    return {
      id: uuidv4(),
      vehicle: bestVehicle,
      driver: bestDriver,
      tripId: uuidv4(),
      estimatedCost,
      estimatedTime: Math.round(estimatedTime),
      matchScore: scoredVehicles[0].score,
      reasoning: this.generateReasoning(bestVehicle, bestDriver, request)
    };
  }

  async batchAllocate(
    vehicles: Vehicle[],
    drivers: Driver[],
    requests: TripRequest[]
  ): Promise<Allocation[]> {
    const allocations: Allocation[] = [];
    const usedVehicles = new Set<string>();
    const usedDrivers = new Set<string>();

    for (const request of requests) {
      const availableVehicles = vehicles.filter(v => !usedVehicles.has(v.id));
      const availableDrivers = drivers.filter(d => !usedDrivers.has(d.id));

      const allocation = await this.allocateVehicle(availableVehicles, availableDrivers, request);
      if (allocation) {
        allocations.push(allocation);
        usedVehicles.add(allocation.vehicle.id);
        usedDrivers.add(allocation.driver.id);
      }
    }

    return allocations;
  }

  private calculateVehicleScore(vehicle: Vehicle, request: TripRequest): number {
    let score = 50;

    // Fuel level contribution
    score += vehicle.fuelLevel * 0.2;

    // Service recency
    const daysSinceService = Math.floor(
      (Date.now() - new Date(vehicle.lastServiceDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    score += Math.max(0, 30 - daysSinceService);

    // Capacity match
    const capacityRatio = vehicle.capacity / request.cargoWeight;
    if (capacityRatio >= 1 && capacityRatio < 1.5) score += 20;
    else if (capacityRatio >= 1.5 && capacityRatio < 2) score += 10;

    // Urgency bonus
    if (request.urgency === 'urgent') score += 15;
    else if (request.urgency === 'high') score += 10;

    return Math.min(100, score);
  }

  private calculateDistance(origin: Location, destination: Location): number {
    const latDiff = Math.abs(origin.lat - destination.lat);
    const lngDiff = Math.abs(origin.lng - destination.lng);
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
  }

  private calculateCost(vehicle: Vehicle, distance: number, time: number): number {
    const baseRate = this.baseRates[vehicle.type] || 10;
    return Math.round(distance * baseRate + distance * 0.1 + time * 2);
  }

  private generateReasoning(vehicle: Vehicle, driver: Driver, request: TripRequest): string {
    return `${vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1)} ${vehicle.registrationNumber} with driver ${driver.name} (rating: ${driver.rating}) is the best match for your ${request.urgency} priority delivery.`;
  }
}

export default DispatchAI;
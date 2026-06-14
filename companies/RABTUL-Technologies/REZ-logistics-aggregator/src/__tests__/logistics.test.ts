/**
 * Logistics Aggregator Tests
 * Tests for multi-carrier routing, rate comparison, and tracking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface Carrier {
  id: string;
  name: string;
  code: string;
  supportedServices: string[];
  baseRate: number;
  ratePerKg: number;
}

interface Shipment {
  id: string;
  carrier: string;
  weight: number;
  dimensions: { l: number; w: number; h: number };
  origin: string;
  destination: string;
  service: string;
  rate: number;
  eta: Date;
}

interface TrackingEvent {
  timestamp: Date;
  status: string;
  location: string;
  description: string;
}

// Rate calculation
function calculateRate(
  carrier: Carrier,
  weight: number,
  distance: number,
  service: string
): number {
  const baseCharge = carrier.baseRate;
  const weightCharge = carrier.ratePerKg * weight;
  const distanceFactor = 1 + (distance / 1000) * 0.01;

  // Service multipliers
  const serviceMultipliers: Record<string, number> = {
    'standard': 1.0,
    'express': 1.5,
    'overnight': 2.5,
    'economy': 0.8,
  };

  const multiplier = serviceMultipliers[service] || 1.0;
  return Math.round((baseCharge + weightCharge) * distanceFactor * multiplier * 100) / 100;
}

// Multi-carrier comparison
function compareCarriers(
  carriers: Carrier[],
  weight: number,
  distance: number,
  service: string
): { carrier: Carrier; rate: number }[] {
  return carriers
    .map(carrier => ({
      carrier,
      rate: calculateRate(carrier, weight, distance, service),
    }))
    .sort((a, b) => a.rate - b.rate);
}

// Best route selection
function selectBestRoute(
  carriers: Carrier[],
  weight: number,
  distance: number,
  criteria: 'cheapest' | 'fastest' | 'recommended'
): { carrier: Carrier; rate: number; estimatedDays: number } {
  const comparison = compareCarriers(carriers, weight, distance, 'standard');

  if (comparison.length === 0) {
    throw new Error('No carriers available');
  }

  // Base estimated days on carrier
  const estimatedDaysMap: Record<string, number> = {
    'dhl': 2,
    'fedex': 2,
    'bluedart': 3,
    'delhivery': 4,
    'standard': 5,
  };

  const best = comparison[0];
  const days = estimatedDaysMap[best.carrier.code.toLowerCase()] || 5;

  if (criteria === 'cheapest') {
    return { ...best, estimatedDays: days };
  }

  // For fastest, prioritize express carriers
  if (criteria === 'fastest') {
    const fastest = carriers.find(c =>
      c.supportedServices.includes('express') || c.supportedServices.includes('overnight')
    );

    if (fastest) {
      return {
        carrier: fastest,
        rate: calculateRate(fastest, weight, distance, 'express'),
        estimatedDays: 1,
      };
    }
  }

  return { ...best, estimatedDays: days };
}

// Tracking event parsing
function parseTrackingEvent(raw: string): TrackingEvent {
  const parts = raw.split('|');

  return {
    timestamp: new Date(parts[0]),
    status: parts[1] || 'unknown',
    location: parts[2] || 'unknown',
    description: parts[3] || '',
  };
}

// Volumetric weight calculation
function calculateVolumetricWeight(
  length: number,
  width: number,
  height: number,
  divisor: number = 5000
): number {
  return (length * width * height) / divisor;
}

// Chargeable weight
function getChargeableWeight(actual: number, volumetric: number): number {
  return Math.max(actual, volumetric);
}

describe('Rate Calculation', () => {
  const carrier: Carrier = {
    id: 'c1',
    name: 'Delhivery',
    code: 'delhivery',
    supportedServices: ['standard', 'express', 'economy'],
    baseRate: 50,
    ratePerKg: 40,
  };

  it('should calculate standard rate', () => {
    const rate = calculateRate(carrier, 5, 500, 'standard');
    expect(rate).toBeGreaterThan(0);
  });

  it('should apply express multiplier', () => {
    const standardRate = calculateRate(carrier, 5, 500, 'standard');
    const expressRate = calculateRate(carrier, 5, 500, 'express');
    expect(expressRate).toBeGreaterThan(standardRate);
  });

  it('should apply economy discount', () => {
    const standardRate = calculateRate(carrier, 5, 500, 'standard');
    const economyRate = calculateRate(carrier, 5, 500, 'economy');
    expect(economyRate).toBeLessThan(standardRate);
  });
});

describe('Carrier Comparison', () => {
  const carriers: Carrier[] = [
    { id: 'dhl', name: 'DHL', code: 'dhl', supportedServices: ['standard', 'express'], baseRate: 100, ratePerKg: 50 },
    { id: 'fedex', name: 'FedEx', code: 'fedex', supportedServices: ['standard', 'express', 'overnight'], baseRate: 120, ratePerKg: 45 },
    { id: 'delhivery', name: 'Delhivery', code: 'delhivery', supportedServices: ['standard', 'express'], baseRate: 50, ratePerKg: 35 },
  ];

  it('should compare and sort by rate', () => {
    const comparison = compareCarriers(carriers, 5, 500, 'standard');
    expect(comparison[0].rate).toBeLessThanOrEqual(comparison[1].rate);
  });

  it('should return all carriers', () => {
    const comparison = compareCarriers(carriers, 5, 500, 'standard');
    expect(comparison).toHaveLength(3);
  });
});

describe('Route Selection', () => {
  const carriers: Carrier[] = [
    { id: 'dhl', name: 'DHL', code: 'dhl', supportedServices: ['express'], baseRate: 100, ratePerKg: 50 },
    { id: 'delhivery', name: 'Delhivery', code: 'delhivery', supportedServices: ['standard'], baseRate: 50, ratePerKg: 35 },
  ];

  it('should select cheapest route', () => {
    const route = selectBestRoute(carriers, 5, 500, 'cheapest');
    expect(route.carrier.code).toBe('delhivery');
  });

  it('should select fastest route', () => {
    const route = selectBestRoute(carriers, 5, 500, 'fastest');
    expect(route.carrier.code).toBe('dhl');
    expect(route.estimatedDays).toBe(1);
  });
});

describe('Tracking Event Parsing', () => {
  it('should parse tracking event', () => {
    const raw = '2024-01-15T10:30:00Z|picked_up|Mumbai|Order picked up from sender';
    const event = parseTrackingEvent(raw);

    expect(event.timestamp).toBeInstanceOf(Date);
    expect(event.status).toBe('picked_up');
    expect(event.location).toBe('Mumbai');
  });
});

describe('Volumetric Weight', () => {
  it('should calculate volumetric weight', () => {
    const volumetric = calculateVolumetricWeight(50, 40, 30);
    expect(volumetric).toBe(12); // 50*40*30/5000 = 12
  });

  it('should use custom divisor', () => {
    const volumetric = calculateVolumetricWeight(50, 40, 30, 6000);
    expect(volumetric).toBe(10); // 50*40*30/6000 = 10
  });
});

describe('Chargeable Weight', () => {
  it('should return actual weight when greater', () => {
    expect(getChargeableWeight(10, 5)).toBe(10);
  });

  it('should return volumetric when greater', () => {
    expect(getChargeableWeight(5, 10)).toBe(10);
  });

  it('should return either when equal', () => {
    expect(getChargeableWeight(8, 8)).toBe(8);
  });
});

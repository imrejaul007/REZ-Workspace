/**
 * Delivery Service Tests
 * Tests for delivery tracking, driver assignment, and route optimization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Delivery Types
interface Delivery {
  id: string;
  orderId: string;
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  pickup: { lat: number; lng: number; address: string };
  dropoff: { lat: number; lng: number; address: string };
  driverId?: string;
  estimatedTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Driver {
  id: string;
  name: string;
  vehicle: 'bike' | 'scooter' | 'car';
  status: 'available' | 'busy' | 'offline';
  currentLocation: { lat: number; lng: number };
}

// Status transitions
const VALID_TRANSITIONS: Record<Delivery['status'], Delivery['status'][]> = {
  pending: ['assigned'],
  assigned: ['picked_up'],
  picked_up: ['in_transit'],
  in_transit: ['delivered', 'failed'],
  delivered: [],
  failed: []
};

function canTransition(from: Delivery['status'], to: Delivery['status']): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// Driver assignment
function findNearestDriver(
  drivers: Driver[],
  pickup: { lat: number; lng: number }
): Driver | null {
  let nearest: Driver | null = null;
  let minDistance = Infinity;

  for (const driver of drivers) {
    if (driver.status !== 'available') continue;

    const distance = calculateDistance(
      pickup.lat, pickup.lng,
      driver.currentLocation.lat, driver.currentLocation.lng
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = driver;
    }
  }

  return nearest;
}

// Haversine distance calculation
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// ETA calculation
function calculateETA(distance: number, vehicle: Driver['vehicle']): number {
  const speeds = { bike: 25, scooter: 30, car: 40 }; // km/h
  const speed = speeds[vehicle];
  return Math.round((distance / speed) * 60); // minutes
}

describe('Delivery Status Transitions', () => {
  it('should allow pending to assigned', () => {
    expect(canTransition('pending', 'assigned')).toBe(true);
  });

  it('should allow assigned to picked_up', () => {
    expect(canTransition('assigned', 'picked_up')).toBe(true);
  });

  it('should allow picked_up to in_transit', () => {
    expect(canTransition('picked_up', 'in_transit')).toBe(true);
  });

  it('should allow in_transit to delivered', () => {
    expect(canTransition('in_transit', 'delivered')).toBe(true);
  });

  it('should allow in_transit to failed', () => {
    expect(canTransition('in_transit', 'failed')).toBe(true);
  });

  it('should not allow pending to delivered', () => {
    expect(canTransition('pending', 'delivered')).toBe(false);
  });

  it('should not allow backward transitions', () => {
    expect(canTransition('in_transit', 'assigned')).toBe(false);
    expect(canTransition('delivered', 'in_transit')).toBe(false);
  });

  it('should not allow transitions from terminal states', () => {
    expect(canTransition('delivered', 'pending')).toBe(false);
    expect(canTransition('failed', 'pending')).toBe(false);
  });
});

describe('Driver Assignment', () => {
  const drivers: Driver[] = [
    { id: 'd1', name: 'Driver 1', vehicle: 'bike', status: 'available', currentLocation: { lat: 12.9716, lng: 77.5946 } },
    { id: 'd2', name: 'Driver 2', vehicle: 'car', status: 'available', currentLocation: { lat: 12.9816, lng: 77.6046 } },
    { id: 'd3', name: 'Driver 3', vehicle: 'scooter', status: 'busy', currentLocation: { lat: 12.9616, lng: 77.5846 } },
    { id: 'd4', name: 'Driver 4', vehicle: 'bike', status: 'offline', currentLocation: { lat: 12.9516, lng: 77.5746 } },
  ];

  it('should find nearest available driver', () => {
    const pickup = { lat: 12.9750, lng: 77.5900 };
    const driver = findNearestDriver(drivers, pickup);

    expect(driver).not.toBeNull();
    expect(driver?.status).toBe('available');
  });

  it('should not assign to busy driver', () => {
    const pickup = { lat: 12.9616, lng: 77.5846 }; // Near d3 (busy)
    const driver = findNearestDriver(drivers, pickup);

    expect(driver?.id).not.toBe('d3');
  });

  it('should not assign to offline driver', () => {
    const pickup = { lat: 12.9516, lng: 77.5746 }; // Near d4 (offline)
    const driver = findNearestDriver(drivers, pickup);

    expect(driver?.id).not.toBe('d4');
  });

  it('should return null when no drivers available', () => {
    const allBusy = drivers.map(d => ({ ...d, status: 'busy' as const }));
    const pickup = { lat: 12.9750, lng: 77.5900 };

    const driver = findNearestDriver(allBusy, pickup);
    expect(driver).toBeNull();
  });
});

describe('Distance Calculation', () => {
  it('should calculate distance between two points', () => {
    // Bangalore to Mysore (~140 km)
    const distance = calculateDistance(12.9716, 77.5946, 12.2958, 76.6394);
    expect(distance).toBeGreaterThan(130);
    expect(distance).toBeLessThan(150);
  });

  it('should return 0 for same location', () => {
    const distance = calculateDistance(12.9716, 77.5946, 12.9716, 77.5946);
    expect(distance).toBe(0);
  });

  it('should calculate short distances accurately', () => {
    // ~1 km apart
    const distance = calculateDistance(12.9716, 77.5946, 12.9800, 77.6000);
    expect(distance).toBeGreaterThan(0.5);
    expect(distance).toBeLessThan(2);
  });
});

describe('ETA Calculation', () => {
  it('should calculate ETA for bike', () => {
    const eta = calculateETA(10, 'bike'); // 10 km at 25 km/h
    expect(eta).toBe(24); // 24 minutes
  });

  it('should calculate ETA for car', () => {
    const eta = calculateETA(20, 'car'); // 20 km at 40 km/h
    expect(eta).toBe(30); // 30 minutes
  });

  it('should calculate ETA for scooter', () => {
    const eta = calculateETA(15, 'scooter'); // 15 km at 30 km/h
    expect(eta).toBe(30); // 30 minutes
  });

  it('should handle 0 distance', () => {
    const eta = calculateETA(0, 'bike');
    expect(eta).toBe(0);
  });
});

describe('Delivery Validation', () => {
  function validateDelivery(delivery: Partial<Delivery>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!delivery.orderId) errors.push('orderId is required');
    if (!delivery.pickup?.lat || !delivery.pickup?.lng) errors.push('pickup location is required');
    if (!delivery.dropoff?.lat || !delivery.dropoff?.lng) errors.push('dropoff location is required');
    if (!delivery.pickup?.address) errors.push('pickup address is required');
    if (!delivery.dropoff?.address) errors.push('dropoff address is required');

    return { valid: errors.length === 0, errors };
  }

  it('should validate complete delivery', () => {
    const delivery = {
      orderId: 'ord_123',
      pickup: { lat: 12.97, lng: 77.59, address: 'Pickup Address' },
      dropoff: { lat: 12.98, lng: 77.60, address: 'Dropoff Address' }
    };

    const result = validateDelivery(delivery);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing orderId', () => {
    const delivery = {
      pickup: { lat: 12.97, lng: 77.59, address: 'Pickup Address' },
      dropoff: { lat: 12.98, lng: 77.60, address: 'Dropoff Address' }
    };

    const result = validateDelivery(delivery);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('orderId is required');
  });

  it('should reject missing addresses', () => {
    const delivery = {
      orderId: 'ord_123',
      pickup: { lat: 12.97, lng: 77.59 },
      dropoff: { lat: 12.98, lng: 77.60 }
    };

    const result = validateDelivery(delivery);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('pickup address is required');
    expect(result.errors).toContain('dropoff address is required');
  });
});

describe('Delivery Priority', () => {
  function prioritizeDeliveries(deliveries: Delivery[]): Delivery[] {
    return deliveries.sort((a, b) => {
      // Priority: failed > in_transit > picked_up > assigned > pending > delivered
      const priority: Record<Delivery['status'], number> = {
        failed: 5,
        in_transit: 4,
        picked_up: 3,
        assigned: 2,
        pending: 1,
        delivered: 0
      };
      return priority[b.status] - priority[a.status];
    });
  }

  it('should prioritize failed deliveries', () => {
    const deliveries: Delivery[] = [
      { id: '1', orderId: 'o1', status: 'pending', pickup: { lat: 0, lng: 0, address: '' }, dropoff: { lat: 0, lng: 0, address: '' }, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', orderId: 'o2', status: 'failed', pickup: { lat: 0, lng: 0, address: '' }, dropoff: { lat: 0, lng: 0, address: '' }, createdAt: new Date(), updatedAt: new Date() },
    ];

    const prioritized = prioritizeDeliveries(deliveries);
    expect(prioritized[0].status).toBe('failed');
  });

  it('should prioritize in_transit over assigned', () => {
    const deliveries: Delivery[] = [
      { id: '1', orderId: 'o1', status: 'assigned', pickup: { lat: 0, lng: 0, address: '' }, dropoff: { lat: 0, lng: 0, address: '' }, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', orderId: 'o2', status: 'in_transit', pickup: { lat: 0, lng: 0, address: '' }, dropoff: { lat: 0, lng: 0, address: '' }, createdAt: new Date(), updatedAt: new Date() },
    ];

    const prioritized = prioritizeDeliveries(deliveries);
    expect(prioritized[0].status).toBe('in_transit');
  });
});

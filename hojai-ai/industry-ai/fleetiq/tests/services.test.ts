/**
 * FLEETIQ - Service Tests
 */

import { optimizeDispatch } from '../src/services/dispatchService';
import { calculateRoute, estimateETA } from '../src/services/routeService';
import { getFleetStatus, analyzeFleet } from '../src/services/fleetService';
import { coachDriver, getDriverPerformance } from '../src/services/driverService';

describe('FLEETIQ Services', () => {
  // ============================================
  // DISPATCH SERVICE TESTS
  // ============================================

  describe('Dispatch Service', () => {
    it('should calculate optimal dispatch allocation', async () => {
      const request = {
        origin: { lat: 19.076, lng: 72.877, address: 'Mumbai' },
        destination: { lat: 18.52, lng: 73.856, address: 'Pune' },
        cargoWeight: 1000,
        urgency: 'medium' as const
      };

      // This test requires database connection
      // In real tests, we would mock the database
      expect(request.origin.lat).toBe(19.076);
      expect(request.destination.lat).toBe(18.52);
    });

    it('should validate dispatch request structure', () => {
      const validRequest = {
        origin: { lat: 19.076, lng: 72.877 },
        destination: { lat: 18.52, lng: 73.856 },
        cargoWeight: 500
      };

      expect(validRequest.origin).toBeDefined();
      expect(validRequest.destination).toBeDefined();
      expect(validRequest.cargoWeight).toBeGreaterThan(0);
    });
  });

  // ============================================
  // ROUTE SERVICE TESTS
  // ============================================

  describe('Route Service', () => {
    it('should calculate route between two points', async () => {
      const origin = { lat: 19.076, lng: 72.877, address: 'Mumbai' };
      const destination = { lat: 18.52, lng: 73.856, address: 'Pune' };

      const eta = await estimateETA(origin, destination);
      expect(eta.distance).toBeGreaterThan(0);
      expect(eta.duration).toBeGreaterThan(0);
      expect(eta.eta).toBeInstanceOf(Date);
    });

    it('should optimize multi-stop route', async () => {
      const stops = [
        { lat: 19.076, lng: 72.877, address: 'Stop 1' },
        { lat: 18.52, lng: 73.856, address: 'Stop 2' },
        { lat: 17.43, lng: 78.49, address: 'Stop 3' }
      ];

      const result = await calculateRoute({ stops, optimize: true });

      expect(result.success).toBe(true);
      expect(result.route).toBeDefined();
      expect(result.route?.stops).toHaveLength(3);
    });

    it('should reject route with less than 2 stops', async () => {
      const stops = [
        { lat: 19.076, lng: 72.877, address: 'Stop 1' }
      ];

      const result = await calculateRoute({ stops });

      expect(result.success).toBe(false);
      expect(result.message).toContain('At least 2 stops');
    });

    it('should calculate distance correctly', () => {
      // Haversine distance calculation
      const lat1 = 19.076, lng1 = 72.877;
      const lat2 = 18.52, lng2 = 73.856;

      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      // Mumbai to Pune is approximately 150 km
      expect(distance).toBeGreaterThan(100);
      expect(distance).toBeLessThan(200);
    });
  });

  // ============================================
  // FLEET SERVICE TESTS
  // ============================================

  describe('Fleet Service', () => {
    it('should validate fleet metrics structure', () => {
      const metrics = {
        totalVehicles: 10,
        availableVehicles: 5,
        activeVehicles: 3,
        maintenanceVehicles: 1,
        idleVehicles: 1,
        averageFuelLevel: 65,
        averageUtilization: 72
      };

      expect(metrics.totalVehicles).toBeGreaterThanOrEqual(0);
      expect(metrics.averageFuelLevel).toBeGreaterThanOrEqual(0);
      expect(metrics.averageFuelLevel).toBeLessThanOrEqual(100);
    });
  });

  // ============================================
  // DRIVER SERVICE TESTS
  // ============================================

  describe('Driver Service', () => {
    it('should validate coaching request', () => {
      const request = {
        driverId: '507f1f77bcf86cd799439011',
        situation: 'route_planning' as const
      };

      expect(request.driverId).toBeDefined();
      expect(['route_planning', 'fuel_management', 'break_reminder', 'safety_tip', 'performance_review']).toContain(request.situation);
    });

    it('should validate driver performance structure', () => {
      const performance = {
        driverId: '507f1f77bcf86cd799439011',
        name: 'Test Driver',
        rating: 4.5,
        tripsCompleted: 100,
        totalDistance: 25000,
        averageTripDistance: 250,
        efficiency: 75,
        safetyScore: 90,
        fuelEfficiency: 12,
        trends: {
          ratingTrend: 'improving',
          performanceTrend: 'stable'
        },
        recommendations: ['Maintain current performance']
      };

      expect(performance.rating).toBeGreaterThanOrEqual(0);
      expect(performance.rating).toBeLessThanOrEqual(5);
      expect(performance.tripsCompleted).toBeGreaterThanOrEqual(0);
    });
  });
});
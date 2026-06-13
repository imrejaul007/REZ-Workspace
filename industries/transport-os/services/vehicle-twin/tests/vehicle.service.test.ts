import { vehicleService } from '../src/services/vehicle.service';
import { Vehicle } from '../src/models/vehicle';
import mongoose from 'mongoose';

describe('VehicleService', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vehicle_twin_test');
    }
  });

  afterAll(async () => {
    await Vehicle.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Vehicle.deleteMany({});
  });

  describe('createVehicle', () => {
    it('should create a new vehicle', async () => {
      const vehicleData = {
        profile: {
          vin: '1HGBH41JXMN109186',
          licensePlate: 'ABC-1234',
          make: 'Toyota',
          model: 'Camry',
          year: 2023,
          color: 'Silver',
          category: 'sedan' as const,
          capacity: {
            passengers: 5,
            cargoWeightKg: 500,
            cargoVolumeM3: 0.5
          }
        },
        ownership: {
          type: 'owned' as const,
          ownerId: 'OWNER-001',
          fleetId: 'FLEET-001'
        }
      };

      const vehicle = await vehicleService.createVehicle(vehicleData);

      expect(vehicle.vehicleId).toBeDefined();
      expect(vehicle.vehicleId.startsWith('VTWIN-')).toBe(true);
      expect(vehicle.profile.vin).toBe(vehicleData.profile.vin);
      expect(vehicle.profile.licensePlate).toBe(vehicleData.profile.licensePlate);
      expect(vehicle.status.current).toBe('offline');
      expect(vehicle.isActive).toBe(true);
    });

    it('should create vehicle with custom status', async () => {
      const vehicleData = {
        profile: {
          vin: '1HGBH41JXMN109186',
          licensePlate: 'ABC-1234',
          make: 'Toyota',
          model: 'Camry',
          year: 2023,
          color: 'Silver',
          category: 'sedan' as const,
          capacity: {
            passengers: 5,
            cargoWeightKg: 500,
            cargoVolumeM3: 0.5
          }
        },
        ownership: {
          type: 'owned' as const,
          ownerId: 'OWNER-001'
        },
        status: 'available' as const
      };

      const vehicle = await vehicleService.createVehicle(vehicleData);

      expect(vehicle.status.current).toBe('available');
    });
  });

  describe('getVehicle', () => {
    beforeEach(async () => {
      await Vehicle.create({
        vehicleId: 'VTWIN-TEST001',
        profile: {
          vin: 'VIN001',
          licensePlate: 'PLATE001',
          make: 'Toyota',
          model: 'Camry',
          year: 2023,
          color: 'Silver',
          category: 'sedan',
          capacity: { passengers: 5, cargoWeightKg: 500, cargoVolumeM3: 0.5 }
        },
        ownership: {
          type: 'owned',
          ownerId: 'OWNER-001'
        },
        isActive: true
      });
    });

    it('should return vehicle by ID', async () => {
      const vehicle = await vehicleService.getVehicle('VTWIN-TEST001');

      expect(vehicle).not.toBeNull();
      expect(vehicle?.vehicleId).toBe('VTWIN-TEST001');
    });

    it('should return null for non-existent vehicle', async () => {
      const vehicle = await vehicleService.getVehicle('VTWIN-NONEXISTENT');

      expect(vehicle).toBeNull();
    });

    it('should not return soft-deleted vehicles', async () => {
      await Vehicle.updateOne(
        { vehicleId: 'VTWIN-TEST001' },
        { isActive: false }
      );

      const vehicle = await vehicleService.getVehicle('VTWIN-TEST001');

      expect(vehicle).toBeNull();
    });
  });

  describe('updateVehicleStatus', () => {
    beforeEach(async () => {
      await Vehicle.create({
        vehicleId: 'VTWIN-TEST001',
        profile: {
          vin: 'VIN001',
          licensePlate: 'PLATE001',
          make: 'Toyota',
          model: 'Camry',
          year: 2023,
          color: 'Silver',
          category: 'sedan',
          capacity: { passengers: 5, cargoWeightKg: 500, cargoVolumeM3: 0.5 }
        },
        ownership: {
          type: 'owned',
          ownerId: 'OWNER-001'
        },
        status: { current: 'offline' },
        isActive: true
      });
    });

    it('should update vehicle status', async () => {
      const vehicle = await vehicleService.updateVehicleStatus('VTWIN-TEST001', {
        status: 'available'
      });

      expect(vehicle).not.toBeNull();
      expect(vehicle?.status.current).toBe('available');
    });

    it('should update status with location', async () => {
      const vehicle = await vehicleService.updateVehicleStatus('VTWIN-TEST001', {
        status: 'available',
        location: {
          lat: 25.2048,
          lng: 55.2708,
          address: 'Dubai, UAE',
          updatedAt: new Date()
        }
      });

      expect(vehicle).not.toBeNull();
      expect(vehicle?.status.location.lat).toBe(25.2048);
      expect(vehicle?.status.location.lng).toBe(55.2708);
    });

    it('should return null for non-existent vehicle', async () => {
      const vehicle = await vehicleService.updateVehicleStatus('VTWIN-NONEXISTENT', {
        status: 'available'
      });

      expect(vehicle).toBeNull();
    });
  });

  describe('queryVehicles', () => {
    beforeEach(async () => {
      await Vehicle.insertMany([
        {
          vehicleId: 'VTWIN-001',
          profile: {
            vin: 'VIN001',
            licensePlate: 'PLATE001',
            make: 'Toyota',
            model: 'Camry',
            year: 2023,
            color: 'Silver',
            category: 'sedan',
            capacity: { passengers: 5, cargoWeightKg: 500, cargoVolumeM3: 0.5 }
          },
          ownership: {
            type: 'owned',
            ownerId: 'OWNER-001',
            fleetId: 'FLEET-001'
          },
          status: { current: 'available' },
          isActive: true
        },
        {
          vehicleId: 'VTWIN-002',
          profile: {
            vin: 'VIN002',
            licensePlate: 'PLATE002',
            make: 'Honda',
            model: 'Accord',
            year: 2022,
            color: 'Black',
            category: 'sedan',
            capacity: { passengers: 5, cargoWeightKg: 500, cargoVolumeM3: 0.5 }
          },
          ownership: {
            type: 'leased',
            ownerId: 'OWNER-002',
            fleetId: 'FLEET-001'
          },
          status: { current: 'busy' },
          isActive: true
        },
        {
          vehicleId: 'VTWIN-003',
          profile: {
            vin: 'VIN003',
            licensePlate: 'PLATE003',
            make: 'Ford',
            model: 'Transit',
            year: 2021,
            color: 'White',
            category: 'van',
            capacity: { passengers: 8, cargoWeightKg: 1000, cargoVolumeM3: 2.0 }
          },
          ownership: {
            type: 'partner',
            ownerId: 'OWNER-003',
            fleetId: null
          },
          status: { current: 'maintenance' },
          isActive: true
        }
      ]);
    });

    it('should return all vehicles', async () => {
      const result = await vehicleService.queryVehicles({});

      expect(result.vehicles.length).toBe(3);
      expect(result.total).toBe(3);
    });

    it('should filter by status', async () => {
      const result = await vehicleService.queryVehicles({
        status: 'available'
      });

      expect(result.vehicles.length).toBe(1);
      expect(result.vehicles[0].status.current).toBe('available');
    });

    it('should filter by category', async () => {
      const result = await vehicleService.queryVehicles({
        category: 'van'
      });

      expect(result.vehicles.length).toBe(1);
      expect(result.vehicles[0].profile.category).toBe('van');
    });

    it('should filter by fleetId', async () => {
      const result = await vehicleService.queryVehicles({
        fleetId: 'FLEET-001'
      });

      expect(result.vehicles.length).toBe(2);
    });

    it('should support pagination', async () => {
      const result = await vehicleService.queryVehicles({
        limit: 2,
        skip: 0
      });

      expect(result.vehicles.length).toBe(2);
      expect(result.total).toBe(3);
    });
  });

  describe('deleteVehicle', () => {
    beforeEach(async () => {
      await Vehicle.create({
        vehicleId: 'VTWIN-TEST001',
        profile: {
          vin: 'VIN001',
          licensePlate: 'PLATE001',
          make: 'Toyota',
          model: 'Camry',
          year: 2023,
          color: 'Silver',
          category: 'sedan',
          capacity: { passengers: 5, cargoWeightKg: 500, cargoVolumeM3: 0.5 }
        },
        ownership: {
          type: 'owned',
          ownerId: 'OWNER-001'
        },
        isActive: true
      });
    });

    it('should soft delete vehicle', async () => {
      const result = await vehicleService.deleteVehicle('VTWIN-TEST001');

      expect(result).toBe(true);

      const vehicle = await Vehicle.findOne({ vehicleId: 'VTWIN-TEST001' });
      expect(vehicle?.isActive).toBe(false);
    });

    it('should return false for non-existent vehicle', async () => {
      const result = await vehicleService.deleteVehicle('VTWIN-NONEXISTENT');

      expect(result).toBe(false);
    });
  });

  describe('getVehicleStatistics', () => {
    beforeEach(async () => {
      await Vehicle.insertMany([
        {
          vehicleId: 'VTWIN-001',
          profile: {
            vin: 'VIN001',
            licensePlate: 'PLATE001',
            make: 'Toyota',
            model: 'Camry',
            year: 2023,
            color: 'Silver',
            category: 'sedan',
            capacity: { passengers: 5, cargoWeightKg: 500, cargoVolumeM3: 0.5 }
          },
          ownership: {
            type: 'owned',
            ownerId: 'OWNER-001'
          },
          status: { current: 'available' },
          utilization: { utilizationRate: 75 },
          isActive: true
        },
        {
          vehicleId: 'VTWIN-002',
          profile: {
            vin: 'VIN002',
            licensePlate: 'PLATE002',
            make: 'Honda',
            model: 'Accord',
            year: 2022,
            color: 'Black',
            category: 'sedan',
            capacity: { passengers: 5, cargoWeightKg: 500, cargoVolumeM3: 0.5 }
          },
          ownership: {
            type: 'leased',
            ownerId: 'OWNER-002'
          },
          status: { current: 'busy' },
          utilization: { utilizationRate: 90 },
          isActive: true
        },
        {
          vehicleId: 'VTWIN-003',
          profile: {
            vin: 'VIN003',
            licensePlate: 'PLATE003',
            make: 'Ford',
            model: 'Transit',
            year: 2021,
            color: 'White',
            category: 'van',
            capacity: { passengers: 8, cargoWeightKg: 1000, cargoVolumeM3: 2.0 }
          },
          ownership: {
            type: 'partner',
            ownerId: 'OWNER-003'
          },
          status: { current: 'maintenance' },
          utilization: { utilizationRate: 50 },
          isActive: true
        }
      ]);
    });

    it('should return vehicle statistics', async () => {
      const stats = await vehicleService.getVehicleStatistics();

      expect(stats.total).toBe(3);
      expect(stats.byStatus.available).toBe(1);
      expect(stats.byStatus.busy).toBe(1);
      expect(stats.byStatus.maintenance).toBe(1);
      expect(stats.byCategory.sedan).toBe(2);
      expect(stats.byCategory.van).toBe(1);
      expect(stats.avgUtilization).toBeGreaterThan(0);
    });
  });
});

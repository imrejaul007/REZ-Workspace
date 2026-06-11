/**
 * FLEETIQ - Model Tests
 */

import mongoose from 'mongoose';
import { Vehicle, Driver, Trip, Maintenance } from '../src/models';
import { VehicleSchemaValidation, DriverSchemaValidation, TripSchemaValidation } from '../src/models';

describe('FLEETIQ Models', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fleetiq-test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Vehicle.deleteMany({});
    await Driver.deleteMany({});
    await Trip.deleteMany({});
    await Maintenance.deleteMany({});
  });

  // ============================================
  // VEHICLE MODEL TESTS
  // ============================================

  describe('Vehicle Model', () => {
    it('should create a vehicle with valid data', async () => {
      const vehicleData = {
        registrationNumber: 'MH12AB1234',
        type: 'truck',
        capacity: 5000,
        status: 'available',
        fuelLevel: 85
      };

      const vehicle = await Vehicle.create(vehicleData);

      expect(vehicle.registrationNumber).toBe('MH12AB1234');
      expect(vehicle.type).toBe('truck');
      expect(vehicle.capacity).toBe(5000);
      expect(vehicle.status).toBe('available');
      expect(vehicle.fuelLevel).toBe(85);
      expect(vehicle.createdAt).toBeDefined();
    });

    it('should fail with duplicate registration number', async () => {
      const vehicleData = {
        registrationNumber: 'MH12AB1234',
        type: 'truck',
        capacity: 5000
      };

      await Vehicle.create(vehicleData);

      await expect(Vehicle.create(vehicleData)).rejects.toThrow();
    });

    it('should reject invalid vehicle type', async () => {
      const vehicleData = {
        registrationNumber: 'MH12AB5678',
        type: 'invalid',
        capacity: 5000
      };

      await expect(Vehicle.create(vehicleData)).rejects.toThrow();
    });

    it('should validate with Zod schema', () => {
      const validData = {
        registrationNumber: 'MH12AB1234',
        type: 'truck',
        capacity: 5000,
        fuelLevel: 85
      };

      const result = VehicleSchemaValidation.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid Zod schema', () => {
      const invalidData = {
        registrationNumber: 'AB',
        type: 'invalid',
        capacity: -100
      };

      const result = VehicleSchemaValidation.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // DRIVER MODEL TESTS
  // ============================================

  describe('Driver Model', () => {
    it('should create a driver with valid data', async () => {
      const driverData = {
        name: 'Ramesh Kumar',
        phone: '+919876543210',
        licenseNumber: 'DL-2024001234',
        status: 'available',
        rating: 4.8
      };

      const driver = await Driver.create(driverData);

      expect(driver.name).toBe('Ramesh Kumar');
      expect(driver.phone).toBe('+919876543210');
      expect(driver.licenseNumber).toBe('DL-2024001234');
      expect(driver.status).toBe('available');
      expect(driver.rating).toBe(4.8);
    });

    it('should reject invalid driver status', async () => {
      const driverData = {
        name: 'Ramesh Kumar',
        phone: '+919876543210',
        licenseNumber: 'DL-2024001234',
        status: 'invalid'
      };

      await expect(Driver.create(driverData)).rejects.toThrow();
    });

    it('should validate with Zod schema', () => {
      const validData = {
        name: 'Ramesh Kumar',
        phone: '+919876543210',
        licenseNumber: 'DL-2024001234'
      };

      const result = DriverSchemaValidation.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid phone number', () => {
      const invalidData = {
        name: 'Ramesh Kumar',
        phone: '123',
        licenseNumber: 'DL-2024001234'
      };

      const result = DriverSchemaValidation.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // TRIP MODEL TESTS
  // ============================================

  describe('Trip Model', () => {
    let vehicle: any;
    let driver: any;

    beforeEach(async () => {
      vehicle = await Vehicle.create({
        registrationNumber: 'MH12AB1234',
        type: 'truck',
        capacity: 5000,
        status: 'available'
      });

      driver = await Driver.create({
        name: 'Ramesh Kumar',
        phone: '+919876543210',
        licenseNumber: 'DL-2024001234',
        status: 'available'
      });
    });

    it('should create a trip with valid data', async () => {
      const tripData = {
        vehicleId: vehicle._id,
        driverId: driver._id,
        origin: {
          address: 'Mumbai',
          lat: 19.076,
          lng: 72.877
        },
        destination: {
          address: 'Pune',
          lat: 18.52,
          lng: 73.856
        },
        distance: 150,
        estimatedTime: 180
      };

      const trip = await Trip.create(tripData);

      expect(trip.vehicleId.toString()).toBe(vehicle._id.toString());
      expect(trip.driverId.toString()).toBe(driver._id.toString());
      expect(trip.distance).toBe(150);
      expect(trip.status).toBe('pending');
    });

    it('should validate with Zod schema', () => {
      const validData = {
        vehicleId: new mongoose.Types.ObjectId().toString(),
        driverId: new mongoose.Types.ObjectId().toString(),
        origin: { address: 'Mumbai', lat: 19.076, lng: 72.877 },
        destination: { address: 'Pune', lat: 18.52, lng: 73.856 }
      };

      const result = TripSchemaValidation.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // MAINTENANCE MODEL TESTS
  // ============================================

  describe('Maintenance Model', () => {
    let vehicle: any;

    beforeEach(async () => {
      vehicle = await Vehicle.create({
        registrationNumber: 'MH12AB1234',
        type: 'truck',
        capacity: 5000
      });
    });

    it('should create a maintenance record', async () => {
      const maintenanceData = {
        vehicleId: vehicle._id,
        type: 'scheduled',
        description: 'Regular oil change and inspection',
        cost: 5000,
        date: new Date()
      };

      const maintenance = await Maintenance.create(maintenanceData);

      expect(maintenance.vehicleId.toString()).toBe(vehicle._id.toString());
      expect(maintenance.type).toBe('scheduled');
      expect(maintenance.status).toBe('pending');
    });

    it('should reject invalid maintenance type', async () => {
      const maintenanceData = {
        vehicleId: vehicle._id,
        type: 'invalid',
        description: 'Test maintenance',
        cost: 5000,
        date: new Date()
      };

      await expect(Maintenance.create(maintenanceData)).rejects.toThrow();
    });
  });
});
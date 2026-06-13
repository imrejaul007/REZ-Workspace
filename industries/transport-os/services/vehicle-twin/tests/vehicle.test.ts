import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { Vehicle } from '../src/models/vehicle';
import vehicleRoutes from '../src/routes/vehicle.routes';
import { errorHandler } from '../src/middleware/error-handler';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/vehicles', vehicleRoutes);
  app.use(errorHandler);
  return app;
};

describe('Vehicle API', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = createTestApp();
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vehicle_twin_test');
    }
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear vehicles collection before each test
    await Vehicle.deleteMany({});
  });

  describe('POST /api/vehicles', () => {
    it('should create a new vehicle', async () => {
      const vehicleData = {
        profile: {
          vin: '1HGBH41JXMN109186',
          licensePlate: 'ABC-1234',
          make: 'Toyota',
          model: 'Camry',
          year: 2023,
          color: 'Silver',
          category: 'sedan',
          capacity: {
            passengers: 5,
            cargoWeightKg: 500,
            cargoVolumeM3: 0.5
          }
        },
        ownership: {
          type: 'owned',
          ownerId: 'OWNER-001',
          fleetId: 'FLEET-001'
        }
      };

      const response = await request(app)
        .post('/api/vehicles')
        .send(vehicleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.vehicleId).toBeDefined();
      expect(response.body.data.profile.vin).toBe(vehicleData.profile.vin);
      expect(response.body.data.profile.licensePlate).toBe(vehicleData.profile.licensePlate);
    });

    it('should return 400 for invalid vehicle data', async () => {
      const invalidData = {
        profile: {
          // Missing required fields
          vin: '1HGBH41JXMN109186'
          // Missing licensePlate, make, model, etc.
        },
        ownership: {
          type: 'owned',
          ownerId: 'OWNER-001'
        }
      };

      const response = await request(app)
        .post('/api/vehicles')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for duplicate VIN', async () => {
      const vehicleData = {
        profile: {
          vin: '1HGBH41JXMN109186',
          licensePlate: 'ABC-1234',
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
        }
      };

      // Create first vehicle
      await request(app).post('/api/vehicles').send(vehicleData).expect(201);

      // Try to create second vehicle with same VIN
      const response = await request(app)
        .post('/api/vehicles')
        .send(vehicleData)
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/vehicles', () => {
    beforeEach(async () => {
      // Create test vehicles
      const vehicles = [
        {
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
            ownerId: 'OWNER-001',
            fleetId: 'FLEET-001'
          },
          status: { current: 'available' },
          isActive: true
        },
        {
          vehicleId: 'VTWIN-TEST002',
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
          vehicleId: 'VTWIN-TEST003',
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
      ];

      await Vehicle.insertMany(vehicles);
    });

    it('should return all vehicles', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.pagination.total).toBe(3);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/vehicles?status=available')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status.current).toBe('available');
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/vehicles?category=van')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].profile.category).toBe('van');
    });

    it('should filter by fleetId', async () => {
      const response = await request(app)
        .get('/api/vehicles?fleetId=FLEET-001')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/vehicles?limit=2&skip=0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.hasMore).toBe(true);
    });
  });

  describe('GET /api/vehicles/:vehicleId', () => {
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
          ownerId: 'OWNER-001',
          fleetId: 'FLEET-001'
        },
        isActive: true
      });
    });

    it('should return vehicle by ID', async () => {
      const response = await request(app)
        .get('/api/vehicles/VTWIN-TEST001')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.vehicleId).toBe('VTWIN-TEST001');
    });

    it('should return 404 for non-existent vehicle', async () => {
      const response = await request(app)
        .get('/api/vehicles/VTWIN-NONEXISTENT')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VEHICLE_NOT_FOUND');
    });
  });

  describe('PATCH /api/vehicles/:vehicleId/status', () => {
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
      const response = await request(app)
        .patch('/api/vehicles/VTWIN-TEST001/status')
        .send({ status: 'available' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status.current).toBe('available');
    });

    it('should update status with location', async () => {
      const response = await request(app)
        .patch('/api/vehicles/VTWIN-TEST001/status')
        .send({
          status: 'available',
          location: {
            lat: 25.2048,
            lng: 55.2708,
            address: 'Dubai, UAE'
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status.location.lat).toBe(25.2048);
      expect(response.body.data.status.location.lng).toBe(55.2708);
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .patch('/api/vehicles/VTWIN-TEST001/status')
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/vehicles/:vehicleId', () => {
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
      const response = await request(app)
        .delete('/api/vehicles/VTWIN-TEST001')
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify vehicle is soft deleted
      const vehicle = await Vehicle.findOne({ vehicleId: 'VTWIN-TEST001' });
      expect(vehicle?.isActive).toBe(false);
    });

    it('should return 404 for non-existent vehicle', async () => {
      const response = await request(app)
        .delete('/api/vehicles/VTWIN-NONEXISTENT')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});

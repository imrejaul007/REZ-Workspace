import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// Mock mongoose before importing routes
jest.mock('mongoose', () => {
  const mockModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    save: jest.fn(),
  };

  return {
    connect: jest.fn().mockResolvedValue(undefined),
    connection: {
      readyState: 1,
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    },
    model: jest.fn().mockReturnValue(mockModel),
    Schema: jest.fn().mockImplementation(() => ({
      index: jest.fn(),
      pre: jest.fn(),
    })),
  };
});

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock auth endpoint
  const JWT_SECRET = 'test-secret';
  app.post('/api/auth/token', (req, res) => {
    const { userId, email, role } = req.body;
    const token = jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  });

  // Mock apartment routes
  const apartments: Map<string, object> = new Map();

  app.post('/api/apartments', (req, res) => {
    const id = `APT-${Date.now().toString(36).toUpperCase()}`;
    const apartment = { apartmentId: id, ...req.body, createdAt: new Date(), updatedAt: new Date() };
    apartments.set(id, apartment);
    res.status(201).json({ success: true, data: apartment });
  });

  app.get('/api/apartments', (req, res) => {
    const { city, incomeLevel, type } = req.query;
    let filtered = Array.from(apartments.values()) as Array<Record<string, unknown>>;

    if (city) filtered = filtered.filter(a => a.address?.city === city);
    if (incomeLevel) filtered = filtered.filter(a => a.demographics?.incomeLevel === incomeLevel);
    if (type) filtered = filtered.filter(a => a.type === type);

    res.json({
      success: true,
      data: filtered,
      pagination: { page: 1, limit: 20, total: filtered.length, totalPages: 1 }
    });
  });

  app.get('/api/apartments/nearby', (req, res) => {
    res.json({ success: true, data: [], count: 0 });
  });

  app.get('/api/apartments/:id', (req, res) => {
    const apartment = apartments.get(req.params.id);
    if (!apartment) {
      return res.status(404).json({ success: false, error: 'Apartment not found' });
    }
    res.json({ success: true, data: apartment });
  });

  app.put('/api/apartments/:id', (req, res) => {
    const apartment = apartments.get(req.params.id);
    if (!apartment) {
      return res.status(404).json({ success: false, error: 'Apartment not found' });
    }
    const updated = { ...apartment, ...req.body, updatedAt: new Date() };
    apartments.set(req.params.id, updated);
    res.json({ success: true, data: updated });
  });

  app.delete('/api/apartments/:id', (req, res) => {
    if (!apartments.has(req.params.id)) {
      return res.status(404).json({ success: false, error: 'Apartment not found' });
    }
    apartments.delete(req.params.id);
    res.json({ success: true, message: 'Apartment deleted successfully' });
  });

  app.get('/api/apartments/:id/residents', (req, res) => {
    const apartment = apartments.get(req.params.id) as Record<string, unknown> | undefined;
    if (!apartment) {
      return res.status(404).json({ success: false, error: 'Apartment not found' });
    }
    const demo = apartment.demographics as Record<string, number>;
    res.json({
      success: true,
      data: {
        apartmentId: req.params.id,
        totalFlats: demo.totalFlats,
        occupiedFlats: demo.occupiedFlats,
        estimatedResidents: demo.estimatedResidents,
        avgFamilySize: demo.avgFamilySize,
        occupancyRate: (demo.occupiedFlats / demo.totalFlats) * 100,
        incomeLevel: demo.incomeLevel,
        estimatedHouseholds: demo.occupiedFlats,
        estimatedTargetableDevices: demo.occupiedFlats * 2,
      },
    });
  });

  app.post('/api/apartments/:id/target', (req, res) => {
    const apartment = apartments.get(req.params.id);
    if (!apartment) {
      return res.status(404).json({ success: false, error: 'Apartment not found' });
    }
    const targetingId = `TGT-${Date.now().toString(36).toUpperCase()}`;
    const config = { targetingId, apartmentId: req.params.id, ...req.body, createdAt: new Date(), updatedAt: new Date() };
    res.status(201).json({ success: true, data: config });
  });

  // Health endpoints
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
};

describe('API Endpoints', () => {
  let app: express.Application;
  let adminToken: string;

  beforeAll(() => {
    app = createTestApp();
    adminToken = jwt.sign({ userId: 'admin-1', email: 'admin@test.com', role: 'admin' }, 'test-secret', { expiresIn: '1h' });
  });

  describe('Authentication', () => {
    it('should generate JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/token')
        .send({ userId: 'user-1', email: 'test@test.com', role: 'admin' });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });
  });

  describe('POST /api/apartments', () => {
    it('should create a new apartment', async () => {
      const response = await request(app)
        .post('/api/apartments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sunrise Heights',
          type: 'gated_community',
          address: {
            street: 'MG Road',
            area: 'Koramangala',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560034',
            country: 'India',
          },
          location: { lat: 12.9352, lng: 77.6245 },
          demographics: {
            totalFlats: 500,
            occupiedFlats: 450,
            avgFamilySize: 4,
            estimatedResidents: 1800,
            incomeLevel: 'upper_middle',
          },
          amenities: ['gym', 'pool'],
          nearbyPOIs: ['Metro Station'],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.apartmentId).toMatch(/^APT-/);
    });

    it('should reject invalid apartment data', async () => {
      const response = await request(app)
        .post('/api/apartments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test',
          type: 'invalid_type',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/apartments', () => {
    it('should list apartments with filters', async () => {
      const response = await request(app)
        .get('/api/apartments')
        .query({ city: 'Bangalore', incomeLevel: 'upper_middle' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
    });
  });

  describe('GET /api/apartments/nearby', () => {
    it('should find nearby apartments', async () => {
      const response = await request(app)
        .get('/api/apartments/nearby')
        .query({ lat: 12.9352, lng: 77.6245, radius: 5000, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/apartments/:id', () => {
    it('should return 404 for non-existent apartment', async () => {
      const response = await request(app)
        .get('/api/apartments/NONEXISTENT');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/apartments/:id', () => {
    it('should update an apartment', async () => {
      // First create an apartment
      const createRes = await request(app)
        .post('/api/apartments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Apartment',
          type: 'apartment',
          address: {
            street: 'Test St',
            area: 'Test Area',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            country: 'India',
          },
          location: { lat: 19.076, lng: 72.8777 },
          demographics: {
            totalFlats: 100,
            occupiedFlats: 80,
            avgFamilySize: 4,
            estimatedResidents: 320,
            incomeLevel: 'middle',
          },
        });

      const apartmentId = createRes.body.data.apartmentId;

      const response = await request(app)
        .put(`/api/apartments/${apartmentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
    });
  });

  describe('DELETE /api/apartments/:id', () => {
    it('should delete an apartment', async () => {
      // First create an apartment
      const createRes = await request(app)
        .post('/api/apartments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'To Delete',
          type: 'apartment',
          address: {
            street: 'Test St',
            area: 'Test Area',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110001',
            country: 'India',
          },
          location: { lat: 28.7041, lng: 77.1025 },
          demographics: {
            totalFlats: 50,
            occupiedFlats: 40,
            avgFamilySize: 4,
            estimatedResidents: 160,
            incomeLevel: 'middle',
          },
        });

      const apartmentId = createRes.body.data.apartmentId;

      const response = await request(app)
        .delete(`/api/apartments/${apartmentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/apartments/:id/residents', () => {
    it('should return resident statistics', async () => {
      // First create an apartment
      const createRes = await request(app)
        .post('/api/apartments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Stats Test',
          type: 'gated_community',
          address: {
            street: 'Test St',
            area: 'Test Area',
            city: 'Pune',
            state: 'Maharashtra',
            pincode: '411001',
            country: 'India',
          },
          location: { lat: 18.5204, lng: 73.8567 },
          demographics: {
            totalFlats: 200,
            occupiedFlats: 180,
            avgFamilySize: 4,
            estimatedResidents: 720,
            incomeLevel: 'high',
          },
        });

      const apartmentId = createRes.body.data.apartmentId;

      const response = await request(app)
        .get(`/api/apartments/${apartmentId}/residents`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalFlats).toBe(200);
      expect(response.body.data.occupiedFlats).toBe(180);
      expect(response.body.data.occupancyRate).toBe(90);
    });
  });

  describe('POST /api/apartments/:id/target', () => {
    it('should create targeting configuration', async () => {
      // First create an apartment
      const createRes = await request(app)
        .post('/api/apartments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Targeting Test',
          type: 'apartment',
          address: {
            street: 'Test St',
            area: 'Test Area',
            city: 'Chennai',
            state: 'Tamil Nadu',
            pincode: '600001',
            country: 'India',
          },
          location: { lat: 13.0827, lng: 80.2707 },
          demographics: {
            totalFlats: 150,
            occupiedFlats: 130,
            avgFamilySize: 4,
            estimatedResidents: 520,
            incomeLevel: 'upper_middle',
          },
        });

      const apartmentId = createRes.body.data.apartmentId;

      const response = await request(app)
        .post(`/api/apartments/${apartmentId}/target`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          enabled: true,
          minAge: 25,
          maxAge: 45,
          interests: ['tech', 'finance'],
          incomeBrackets: ['upper_middle', 'high'],
          targetDevices: 500,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.targetingId).toMatch(/^TGT-/);
      expect(response.body.data.minAge).toBe(25);
      expect(response.body.data.maxAge).toBe(45);
    });
  });

  describe('Health Endpoints', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });
});
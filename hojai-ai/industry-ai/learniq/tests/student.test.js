const request = require('supertest');
const mongoose = require('mongoose');
const { Student, Course } = require('../src/models');

jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const app = require('../src/app');

describe('Student API', () => {
  beforeAll(async () => {
    const mongoUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/learniq_test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('POST /api/students', () => {
    it('should create a new student', async () => {
      const studentData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        status: 'active'
      };

      const res = await request(app)
        .post('/api/students')
        .set('Authorization', 'Bearer test-token')
        .send(studentData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(studentData.name);
      expect(res.body.data.email).toBe(studentData.email);
    });

    it('should reject duplicate email', async () => {
      const studentData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890'
      };

      await request(app)
        .post('/api/students')
        .set('Authorization', 'Bearer test-token')
        .send(studentData);

      const res = await request(app)
        .post('/api/students')
        .set('Authorization', 'Bearer test-token')
        .send(studentData);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', 'Bearer test-token')
        .send({ name: 'John' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/students', () => {
    it('should return empty array when no students', async () => {
      const res = await request(app)
        .get('/api/students');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('should return paginated students', async () => {
      for (let i = 0; i < 5; i++) {
        await new Student({
          name: `Student ${i}`,
          email: `student${i}@example.com`,
          phone: '1234567890'
        }).save();
      }

      const res = await request(app)
        .get('/api/students')
        .query({ page: 1, limit: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.total).toBe(5);
      expect(res.body.pagination.pages).toBe(3);
    });
  });

  describe('GET /api/students/:id', () => {
    it('should return student by id', async () => {
      const student = await new Student({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '1234567890'
      }).save();

      const res = await request(app)
        .get(`/api/students/${student._id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Jane Doe');
    });

    it('should return 404 for non-existent student', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/students/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/students/:id', () => {
    it('should update student', async () => {
      const student = await new Student({
        name: 'Original Name',
        email: 'original@example.com',
        phone: '1234567890'
      }).save();

      const res = await request(app)
        .put(`/api/students/${student._id}`)
        .set('Authorization', 'Bearer test-token')
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    });
  });

  describe('DELETE /api/students/:id', () => {
    it('should delete student', async () => {
      const student = await new Student({
        name: 'To Delete',
        email: 'delete@example.com',
        phone: '1234567890'
      }).save();

      const res = await request(app)
        .delete(`/api/students/${student._id}`)
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deleted = await Student.findById(student._id);
      expect(deleted).toBeNull();
    });
  });
});
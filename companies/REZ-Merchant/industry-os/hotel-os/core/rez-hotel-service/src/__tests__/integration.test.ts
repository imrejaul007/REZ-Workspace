import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../index';
import { Room } from '../models/Room';
import { Guest } from '../models/Guest';
import { Booking } from '../models/Booking';

describe('Hotel OS Integration Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test-hotel');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Room.deleteMany({});
    await Guest.deleteMany({});
    await Booking.deleteMany({});
  });

  describe('Room Management', () => {
    it('POST /api/rooms should create a room', async () => {
      const room = {
        roomNumber: '101',
        floor: 1,
        type: 'deluxe',
        price: 5000,
        maxOccupancy: 2,
        amenities: ['wifi', 'ac', 'tv']
      };

      const res = await request(app)
        .post('/api/rooms')
        .send(room);

      expect(res.status).toBe(201);
      expect(res.body.roomNumber).toBe('101');
      expect(res.body.status).toBe('available');
    });

    it('GET /api/rooms should list available rooms', async () => {
      await Room.create([
        { roomNumber: '101', floor: 1, type: 'standard', status: 'available' },
        { roomNumber: '102', floor: 1, type: 'deluxe', status: 'occupied' }
      ]);

      const res = await request(app).get('/api/rooms?status=available');

      expect(res.status).toBe(200);
      expect(res.body.rooms).toHaveLength(1);
      expect(res.body.rooms[0].roomNumber).toBe('101');
    });
  });

  describe('Guest Management', () => {
    it('POST /api/guests should register a guest', async () => {
      const guest = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+919876543210',
        idType: 'passport',
        idNumber: 'AB123456'
      };

      const res = await request(app)
        .post('/api/guests')
        .send(guest);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('John Doe');
    });

    it('GET /api/guests/:id should return guest details', async () => {
      const guest = await Guest.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+919876543211'
      });

      const res = await request(app).get(`/api/guests/${guest._id}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Jane Doe');
    });
  });

  describe('Booking Flow', () => {
    it('POST /api/bookings should create a booking', async () => {
      const room = await Room.create({
        roomNumber: '201',
        floor: 2,
        type: 'suite',
        status: 'available'
      });

      const guest = await Guest.create({
        name: 'Test Guest',
        email: 'test@example.com',
        phone: '+919876543212'
      });

      const booking = {
        guestId: guest._id,
        roomId: room._id,
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000 * 3) // 3 days
      };

      const res = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('confirmed');
      expect(res.body.roomId.toString()).toBe(room._id.toString());
    });
  });

  describe('Health Check', () => {
    it('GET /health should return service status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('rez-hotel-service');
    });
  });
});

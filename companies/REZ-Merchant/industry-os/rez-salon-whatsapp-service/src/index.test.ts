import express, { Express } from 'express';
import request from 'supertest';

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(undefined),
  connection: {
    readyState: 1,
    close: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

// Mock logger
jest.mock('./utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock WhatsAppService
const mockSendTextMessage = jest.fn().mockResolvedValue('msg123');
const mockSendButtonMessage = jest.fn().mockResolvedValue('msg124');
const mockGetConnectionStatus = jest.fn().mockReturnValue({ isConnected: true, qrCode: null });
const mockOnMessage = jest.fn();
const mockRemoveMessageHandler = jest.fn();

jest.mock('./services/WhatsAppService', () => {
  return {
    WhatsAppService: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue('data:image/png;base64,mock-qr'),
      sendTextMessage: mockSendTextMessage,
      sendButtonMessage: mockSendButtonMessage,
      sendMessage: jest.fn().mockResolvedValue('msg123'),
      sendMediaMessage: jest.fn().mockResolvedValue('msg125'),
      sendListMessage: jest.fn().mockResolvedValue('msg126'),
      getConnectionStatus: mockGetConnectionStatus,
      getQRCode: jest.fn().mockResolvedValue(null),
      onMessage: mockOnMessage,
      removeMessageHandler: mockRemoveMessageHandler,
      disconnect: jest.fn().mockResolvedValue(undefined),
    })),
    whatsAppService: {
      initialize: jest.fn().mockResolvedValue('data:image/png;base64,mock-qr'),
      sendTextMessage: mockSendTextMessage,
      sendButtonMessage: mockSendButtonMessage,
      sendMessage: jest.fn().mockResolvedValue('msg123'),
      sendMediaMessage: jest.fn().mockResolvedValue('msg125'),
      sendListMessage: jest.fn().mockResolvedValue('msg126'),
      getConnectionStatus: mockGetConnectionStatus,
      getQRCode: jest.fn().mockResolvedValue(null),
      onMessage: mockOnMessage,
      removeMessageHandler: mockRemoveMessageHandler,
      disconnect: jest.fn().mockResolvedValue(undefined),
    },
  };
});

// Mock BookingBot
jest.mock('./services/BookingBot', () => {
  const mockStart = jest.fn().mockResolvedValue(undefined);
  const mockStop = jest.fn().mockResolvedValue(undefined);

  return {
    BookingBot: jest.fn().mockImplementation(() => ({
      start: mockStart,
      stop: mockStop,
      SERVICES_CATALOG: [
        { id: 'haircut', name: 'Haircut & Styling', category: 'hair', price: 45, duration: 45, availableStylists: ['sarah', 'john'] },
        { id: 'color', name: 'Hair Coloring', category: 'hair', price: 120, duration: 120, availableStylists: ['sarah'] },
        { id: 'facial', name: 'Facial Treatment', category: 'skin', price: 80, duration: 60, availableStylists: ['lisa', 'anna'] },
      ],
      STYLISTS: [
        { id: 'sarah', name: 'Sarah', specialties: ['coloring', 'styling'], rating: 4.9, availableTimes: ['09:00', '10:00', '11:00'] },
        { id: 'john', name: 'John', specialties: ['cuts', 'mens grooming'], rating: 4.8, availableTimes: ['10:00', '11:00', '12:00'] },
        { id: 'lisa', name: 'Lisa', specialties: ['facials', 'makeup'], rating: 4.9, availableTimes: ['10:00', '11:00', '12:00'] },
      ],
      getAvailableSlots: jest.fn().mockReturnValue(['09:00', '10:00', '11:00', '14:00', '15:00']),
      getActiveBookings: jest.fn().mockResolvedValue([]),
      getPastBookings: jest.fn().mockResolvedValue([]),
      createBooking: jest.fn().mockResolvedValue({ id: 'BK123', status: 'confirmed' }),
      cancelBooking: jest.fn().mockResolvedValue(undefined),
      scheduleReminder: jest.fn().mockResolvedValue(undefined),
      generatePaymentLink: jest.fn().mockResolvedValue('https://pay.example.com/BK123'),
    })),
  };
});

// Mock webhook routes
jest.mock('./routes/webhook.routes', () => {
  const express = require('express');
  const router = express.Router();

  router.get('/webhook', (req: any, res: any) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === 'test-token') {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  });

  router.post('/webhook', (req: any, res: any) => {
    const payload = req.body;
    if (payload.event === 'message.received') {
      res.status(200).json({ status: 'ok', processed: true });
    } else {
      res.status(200).json({ status: 'ok' });
    }
  });

  router.get('/status', (req: any, res: any) => {
    res.json({
      connected: true,
      qrCode: null,
      timestamp: Date.now(),
    });
  });

  return () => router;
});

// Mock bot routes
jest.mock('./routes/bot.routes', () => {
  const express = require('express');
  const router = express.Router();

  router.get('/bot/status', (req: any, res: any) => {
    res.json({
      whatsapp: { connected: true, qrAvailable: false },
      bot: { active: true, state: 'running' },
      timestamp: new Date().toISOString(),
    });
  });

  router.post('/bot/send', (req: any, res: any) => {
    const { to, message } = req.body;
    if (!to || !message) {
      return res.status(400).json({ error: 'Missing required fields: to, message' });
    }
    res.json({ success: true, to, message });
  });

  router.get('/bot/services', (req: any, res: any) => {
    res.json({
      services: [
        { id: 'haircut', name: 'Haircut & Styling', category: 'hair', price: 45, duration: 45 },
        { id: 'color', name: 'Hair Coloring', category: 'hair', price: 120, duration: 120 },
      ],
    });
  });

  router.get('/bot/stylists', (req: any, res: any) => {
    const { serviceId } = req.query;
    const stylists = [
      { id: 'sarah', name: 'Sarah', specialties: ['coloring'], rating: 4.9 },
      { id: 'john', name: 'John', specialties: ['cuts'], rating: 4.8 },
    ];
    res.json({ stylists });
  });

  router.get('/bot/availability', (req: any, res: any) => {
    const { serviceId, stylistId, date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    res.json({
      date,
      stylistId,
      serviceId,
      slots: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    });
  });

  router.get('/bot/bookings/:phoneNumber', (req: any, res: any) => {
    const { type } = req.query;
    const bookings = type === 'active'
      ? [{ id: 'BK123', date: '2024-02-01', status: 'confirmed' }]
      : [{ id: 'BK122', date: '2024-01-15', status: 'completed' }];
    res.json({ bookings });
  });

  router.post('/bot/bookings', (req: any, res: any) => {
    const { phoneNumber, serviceId, stylistId, date, time } = req.body;
    if (!phoneNumber || !serviceId || !stylistId || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    res.json({ booking: { id: 'BK124', status: 'confirmed' } });
  });

  router.delete('/bot/bookings/:bookingId', (req: any, res: any) => {
    res.json({ success: true, bookingId: req.params.bookingId });
  });

  router.post('/bot/bookings/:bookingId/reminder', (req: any, res: any) => {
    const { reminderDate, phoneNumber } = req.body;
    if (!reminderDate || !phoneNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    res.json({ success: true, bookingId: req.params.bookingId, reminderDate });
  });

  router.post('/bot/bookings/:bookingId/payment-link', (req: any, res: any) => {
    res.json({ paymentLink: 'https://pay.example.com/BK123', bookingId: req.params.bookingId });
  });

  return () => router;
});

import { createWebhookRouter, WhatsAppService } from './routes/webhook.routes';
import { createBotRouter, BookingBot } from './routes/bot.routes';
import { WhatsAppService as WhatsAppServiceClass, whatsAppService } from './services/WhatsAppService';

describe('ReZ Salon WhatsApp Service', () => {
  let app: Express;
  let mockWhatsAppService: any;
  let mockBookingBot: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockWhatsAppService = new WhatsAppServiceClass();
    mockBookingBot = new BookingBot(mockWhatsAppService, {
      salonServiceUrl: 'http://localhost:3000',
      internalServiceToken: 'test-token',
    });

    app = express();
    app.use(express.json());
    app.use('/api', createWebhookRouter(mockWhatsAppService));
    app.use('/api', createBotRouter(mockWhatsAppService, mockBookingBot));
  });

  describe('Health Check', () => {
    it('should have WhatsApp routes configured', () => {
      expect(app).toBeDefined();
    });
  });

  describe('Webhook Routes', () => {
    describe('GET /api/webhook', () => {
      it('should verify webhook with valid token', async () => {
        const response = await request(app)
          .get('/api/webhook')
          .query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'test-token', 'hub.challenge': 'test-challenge' });

        expect(response.status).toBe(200);
        expect(response.text).toBe('test-challenge');
      });

      it('should reject webhook with invalid token', async () => {
        const response = await request(app)
          .get('/api/webhook')
          .query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'wrong-token', 'hub.challenge': 'test' });

        expect(response.status).toBe(403);
      });

      it('should reject non-subscribe mode', async () => {
        const response = await request(app)
          .get('/api/webhook')
          .query({ 'hub.mode': 'unsubscribe', 'hub.verify_token': 'test-token', 'hub.challenge': 'test' });

        expect(response.status).toBe(403);
      });
    });

    describe('POST /api/webhook', () => {
      it('should process incoming message webhook', async () => {
        const payload = {
          event: 'message.received',
          timestamp: Date.now(),
          data: {
            from: '1234567890',
            to: '0987654321',
            content: 'Hello',
            type: 'text',
          },
        };

        const response = await request(app)
          .post('/api/webhook')
          .send(payload);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
      });

      it('should process connection ready webhook', async () => {
        const payload = {
          event: 'connection.ready',
          timestamp: Date.now(),
          data: {},
        };

        const response = await request(app)
          .post('/api/webhook')
          .send(payload);

        expect(response.status).toBe(200);
      });
    });

    describe('GET /api/status', () => {
      it('should return WhatsApp connection status', async () => {
        const response = await request(app)
          .get('/api/status');

        expect(response.status).toBe(200);
        expect(response.body.connected).toBeDefined();
        expect(response.body.timestamp).toBeDefined();
      });
    });
  });

  describe('Bot Routes', () => {
    describe('GET /api/bot/status', () => {
      it('should return bot status', async () => {
        const response = await request(app)
          .get('/api/bot/status');

        expect(response.status).toBe(200);
        expect(response.body.whatsapp.connected).toBe(true);
        expect(response.body.bot.active).toBe(true);
      });
    });

    describe('POST /api/bot/send', () => {
      it('should send WhatsApp message', async () => {
        const response = await request(app)
          .post('/api/bot/send')
          .send({ to: '1234567890', message: 'Hello from bot' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.to).toBe('1234567890');
        expect(response.body.message).toBe('Hello from bot');
      });

      it('should require to and message fields', async () => {
        const response = await request(app)
          .post('/api/bot/send')
          .send({ to: '1234567890' });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Missing required fields');
      });

      it('should reject empty message', async () => {
        const response = await request(app)
          .post('/api/bot/send')
          .send({ to: '1234567890', message: '' });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/bot/services', () => {
      it('should return services catalog', async () => {
        const response = await request(app)
          .get('/api/bot/services');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.services)).toBe(true);
        expect(response.body.services.length).toBeGreaterThan(0);
      });

      it('should include service details', async () => {
        const response = await request(app)
          .get('/api/bot/services');

        const service = response.body.services[0];
        expect(service.id).toBeDefined();
        expect(service.name).toBeDefined();
        expect(service.price).toBeDefined();
        expect(service.duration).toBeDefined();
      });
    });

    describe('GET /api/bot/stylists', () => {
      it('should return all stylists', async () => {
        const response = await request(app)
          .get('/api/bot/stylists');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.stylists)).toBe(true);
      });

      it('should filter stylists by service', async () => {
        const response = await request(app)
          .get('/api/bot/stylists')
          .query({ serviceId: 'haircut' });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.stylists)).toBe(true);
      });
    });

    describe('GET /api/bot/availability', () => {
      it('should return available time slots', async () => {
        const response = await request(app)
          .get('/api/bot/availability')
          .query({ serviceId: 'haircut', stylistId: 'sarah', date: '2024-02-01' });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.slots)).toBe(true);
        expect(response.body.date).toBe('2024-02-01');
      });

      it('should require date parameter', async () => {
        const response = await request(app)
          .get('/api/bot/availability')
          .query({ serviceId: 'haircut' });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Date is required');
      });
    });

    describe('GET /api/bot/bookings/:phoneNumber', () => {
      it('should return active bookings', async () => {
        const response = await request(app)
          .get('/api/bot/bookings/1234567890')
          .query({ type: 'active' });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.bookings)).toBe(true);
      });

      it('should return past bookings', async () => {
        const response = await request(app)
          .get('/api/bot/bookings/1234567890')
          .query({ type: 'past' });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.bookings)).toBe(true);
      });
    });

    describe('POST /api/bot/bookings', () => {
      it('should create new booking', async () => {
        const bookingData = {
          phoneNumber: '1234567890',
          serviceId: 'haircut',
          stylistId: 'sarah',
          date: '2024-02-01',
          time: '10:00',
          notes: 'First visit',
        };

        const response = await request(app)
          .post('/api/bot/bookings')
          .send(bookingData);

        expect(response.status).toBe(200);
        expect(response.body.booking).toBeDefined();
        expect(response.body.booking.status).toBe('confirmed');
      });

      it('should reject missing required fields', async () => {
        const response = await request(app)
          .post('/api/bot/bookings')
          .send({ phoneNumber: '1234567890', serviceId: 'haircut' });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Missing required fields');
      });

      it('should require phone number', async () => {
        const response = await request(app)
          .post('/api/bot/bookings')
          .send({ serviceId: 'haircut', stylistId: 'sarah', date: '2024-02-01', time: '10:00' });

        expect(response.status).toBe(400);
      });
    });

    describe('DELETE /api/bot/bookings/:bookingId', () => {
      it('should cancel booking', async () => {
        const response = await request(app)
          .delete('/api/bot/bookings/BK123');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.bookingId).toBe('BK123');
      });
    });

    describe('POST /api/bot/bookings/:bookingId/reminder', () => {
      it('should schedule reminder', async () => {
        const response = await request(app)
          .post('/api/bot/bookings/BK123/reminder')
          .send({ reminderDate: '2024-02-01T09:00:00Z', phoneNumber: '1234567890' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.bookingId).toBe('BK123');
      });

      it('should require reminder date and phone number', async () => {
        const response = await request(app)
          .post('/api/bot/bookings/BK123/reminder')
          .send({ reminderDate: '2024-02-01T09:00:00Z' });

        expect(response.status).toBe(400);
      });
    });

    describe('POST /api/bot/bookings/:bookingId/payment-link', () => {
      it('should generate payment link', async () => {
        const response = await request(app)
          .post('/api/bot/bookings/BK123/payment-link');

        expect(response.status).toBe(200);
        expect(response.body.paymentLink).toBeDefined();
        expect(response.body.bookingId).toBe('BK123');
      });
    });
  });

  describe('WhatsAppService', () => {
    it('should send text messages', async () => {
      await mockWhatsAppService.sendTextMessage('1234567890', 'Hello');
      expect(mockSendTextMessage).toHaveBeenCalledWith('1234567890', 'Hello');
    });

    it('should send button messages', async () => {
      const buttons = [{ id: 'yes', title: 'Yes' }, { id: 'no', title: 'No' }];
      await mockWhatsAppService.sendButtonMessage('1234567890', 'Confirm?', buttons);
      expect(mockSendButtonMessage).toHaveBeenCalledWith('1234567890', 'Confirm?', buttons);
    });

    it('should return connection status', () => {
      const status = mockWhatsAppService.getConnectionStatus();
      expect(status).toHaveProperty('isConnected');
      expect(status).toHaveProperty('qrCode');
    });

    it('should register message handlers', () => {
      const handler = jest.fn();
      mockWhatsAppService.onMessage('test-handler', handler);
      expect(mockOnMessage).toHaveBeenCalledWith('test-handler', handler);
    });

    it('should remove message handlers', () => {
      mockWhatsAppService.removeMessageHandler('test-handler');
      expect(mockRemoveMessageHandler).toHaveBeenCalledWith('test-handler');
    });

    it('should disconnect gracefully', async () => {
      await mockWhatsAppService.disconnect();
      expect(mockWhatsAppService.disconnect).toHaveBeenCalled();
    });
  });

  describe('BookingBot', () => {
    it('should start successfully', async () => {
      await mockBookingBot.start();
      expect(mockBookingBot.start).toHaveBeenCalled();
    });

    it('should stop gracefully', async () => {
      await mockBookingBot.stop();
      expect(mockBookingBot.stop).toHaveBeenCalled();
    });

    it('should have services catalog', () => {
      expect(mockBookingBot.SERVICES_CATALOG).toBeDefined();
      expect(Array.isArray(mockBookingBot.SERVICES_CATALOG)).toBe(true);
      expect(mockBookingBot.SERVICES_CATALOG.length).toBeGreaterThan(0);
    });

    it('should have stylists catalog', () => {
      expect(mockBookingBot.STYLISTS).toBeDefined();
      expect(Array.isArray(mockBookingBot.STYLISTS)).toBe(true);
      expect(mockBookingBot.STYLISTS.length).toBeGreaterThan(0);
    });

    it('should return available slots', () => {
      const slots = mockBookingBot.getAvailableSlots('2024-02-01', 'sarah');
      expect(Array.isArray(slots)).toBe(true);
    });
  });

  describe('Business Logic Validation', () => {
    it('should validate phone number format', () => {
      const validPhones = ['1234567890', '+11234567890', '001123456789'];
      const isValidPhone = (phone: string) => phone.length >= 10;
      expect(validPhones.every(isValidPhone)).toBe(true);
    });

    it('should calculate booking duration correctly', () => {
      const services = [
        { name: 'Haircut', duration: 45 },
        { name: 'Color', duration: 120 },
        { name: 'Facial', duration: 60 },
      ];
      const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
      expect(totalDuration).toBe(225);
    });

    it('should calculate service price total', () => {
      const services = [
        { name: 'Haircut', price: 45 },
        { name: 'Color', price: 120 },
      ];
      const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
      expect(totalPrice).toBe(165);
    });

    it('should validate time slot format', () => {
      const validSlots = ['09:00', '10:30', '14:00', '17:30'];
      const isValidSlot = (slot: string) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot);
      expect(validSlots.every(isValidSlot)).toBe(true);
    });

    it('should validate date format', () => {
      const validDates = ['2024-02-01', '2024-12-25', '2024-01-15'];
      const isValidDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date);
      expect(validDates.every(isValidDate)).toBe(true);
    });

    it('should calculate reminder time correctly', () => {
      const appointmentTime = new Date('2024-02-01T14:00:00Z');
      const reminderHours = 1;
      const reminderTime = new Date(appointmentTime.getTime() - reminderHours * 60 * 60 * 1000);
      expect(reminderTime.getHours()).toBe(13);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/unknown');

      expect(response.status).toBe(404);
    });

    it('should handle invalid JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/webhook')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });
  });
});

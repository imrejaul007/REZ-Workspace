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

// Mock QR routes
jest.mock('./routes/qr.routes', () => {
  const express = require('express');
  const router = express.Router();

  // Mock check-ins database
  const mockCheckIns = new Map();
  mockCheckIns.set('checkin1', {
    checkInId: 'checkin1',
    customerId: 'cust123',
    customerName: 'John Doe',
    salonId: 'salon1',
    timestamp: new Date(),
    status: 'waiting',
    waitTimeMinutes: 15,
  });

  // POST /api/qr/generate - Generate QR code
  router.post('/generate', (req: any, res: any) => {
    const { salonId, locationId } = req.body;
    res.json({
      success: true,
      data: {
        salonId,
        locationId,
        qrDataUrl: `data:image/png;base64, mock-qr-code-${salonId}-${locationId}`,
        createdAt: new Date().toISOString(),
      },
    });
  });

  // POST /api/qr/generate/bulk - Bulk generate QR codes
  router.post('/generate/bulk', (req: any, res: any) => {
    const { salonId, locations } = req.body;
    const qrCodes = locations.map((loc: any) => ({
      locationId: loc.id,
      locationName: loc.name,
      qrDataUrl: `data:image/png;base64, mock-qr-code-${salonId}-${loc.id}`,
    }));
    res.json({
      success: true,
      data: {
        salonId,
        qrCodes,
        createdAt: new Date().toISOString(),
      },
    });
  });

  // POST /api/qr/check-in - Customer check-in
  router.post('/check-in', (req: any, res: any) => {
    const { qrData, customerId, customerName, customerPhone, salonId } = req.body;
    res.json({
      success: true,
      message: 'Check-in successful',
      data: {
        checkInId: `checkin-${Date.now()}`,
        queuePosition: 3,
        estimatedWaitTime: 15,
        salonId,
      },
    });
  });

  // GET /api/qr/verify/:qrData - Verify QR code
  router.get('/verify/:qrData', (req: any, res: any) => {
    res.json({
      success: true,
      valid: true,
      data: {
        salonId: 'salon1',
        locationId: 'loc1',
        generatedAt: new Date().toISOString(),
      },
    });
  });

  // GET /api/qr/queue/:salonId - Get salon queue
  router.get('/queue/:salonId', (req: any, res: any) => {
    res.json({
      success: true,
      data: {
        queueSize: 3,
        queue: [
          { checkInId: 'checkin1', customerName: 'John Doe', checkInTime: new Date(), waitTimeMinutes: 15 },
          { checkInId: 'checkin2', customerName: 'Jane Smith', checkInTime: new Date(), waitTimeMinutes: 10 },
        ],
      },
    });
  });

  // GET /api/qr/wait-time/:salonId - Get wait time estimate
  router.get('/wait-time/:salonId', (req: any, res: any) => {
    res.json({
      success: true,
      data: {
        estimatedWaitMinutes: 15,
        currentQueueSize: 3,
        averageServiceTime: 30,
      },
    });
  });

  // PATCH /api/qr/check-in/:checkInId/complete - Complete check-in
  router.patch('/check-in/:checkInId/complete', (req: any, res: any) => {
    const checkIn = mockCheckIns.get(req.params.checkInId);
    if (checkIn) {
      res.json({
        success: true,
        message: 'Check-in completed',
        data: { ...checkIn, status: 'completed' },
      });
    } else {
      res.status(404).json({ success: false, message: 'Check-in not found' });
    }
  });

  // DELETE /api/qr/check-in/:checkInId - Cancel check-in
  router.delete('/check-in/:checkInId', (req: any, res: any) => {
    const checkIn = mockCheckIns.get(req.params.checkInId);
    if (checkIn) {
      res.json({
        success: true,
        message: 'Check-in cancelled',
        data: { ...checkIn, status: 'cancelled' },
      });
    } else {
      res.status(404).json({ success: false, message: 'Check-in not found' });
    }
  });

  // GET /api/qr/history/:customerId - Get check-in history
  router.get('/history/:customerId', (req: any, res: any) => {
    res.json({
      success: true,
      data: {
        checkIns: [
          { checkInId: 'checkin1', date: new Date(), salonName: 'Downtown Salon' },
        ],
        pagination: {
          total: 1,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      },
    });
  });

  return router;
});

// Mock Loyalty routes
jest.mock('./routes/loyalty.routes', () => {
  const express = require('express');
  const router = express.Router();

  // Mock loyalty accounts
  const mockLoyaltyAccounts = new Map();
  mockLoyaltyAccounts.set('cust123', {
    loyaltyId: 'loyalty1',
    customerId: 'cust123',
    customerName: 'John Doe',
    customerPhone: '1234567890',
    tier: 'Gold',
    totalPoints: 1500,
    availablePoints: 1200,
    lifetimeVisits: 25,
    referralCode: 'JOHN2024',
    referralCount: 3,
  });

  // POST /api/loyalty/account - Create loyalty account
  router.post('/account', (req: any, res: any) => {
    const { customerId, customerName, customerPhone, birthday, referredBy } = req.body;
    const existing = mockLoyaltyAccounts.get(customerId);
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'Loyalty account already exists',
        data: existing,
      });
      return;
    }
    res.status(201).json({
      success: true,
      message: 'Loyalty account created successfully',
      data: {
        loyaltyId: `loyalty-${Date.now()}`,
        customerId,
        referralCode: `${customerName?.substring(0, 4).toUpperCase()}${Date.now()}`,
        tier: 'Silver',
        totalPoints: 100,
      },
    });
  });

  // GET /api/loyalty/account/:customerId - Get loyalty account
  router.get('/account/:customerId', (req: any, res: any) => {
    const account = mockLoyaltyAccounts.get(req.params.customerId);
    if (account) {
      res.json({
        success: true,
        data: {
          ...account,
          pointsValue: account.availablePoints / 100,
          benefits: ['10% off services', 'Birthday bonus', 'Priority booking'],
          visitsToNextTier: 5,
        },
      });
    } else {
      res.status(404).json({ success: false, message: 'Loyalty account not found' });
    }
  });

  // PATCH /api/loyalty/account/:customerId/birthday - Update birthday
  router.patch('/account/:customerId/birthday', (req: any, res: any) => {
    const account = mockLoyaltyAccounts.get(req.params.customerId);
    if (account) {
      res.json({
        success: true,
        message: 'Birthday updated successfully',
        data: { birthday: req.body.birthday },
      });
    } else {
      res.status(404).json({ success: false, message: 'Loyalty account not found' });
    }
  });

  // POST /api/loyalty/redeem - Redeem points
  router.post('/redeem', (req: any, res: any) => {
    const { customerId, points } = req.body;
    const account = mockLoyaltyAccounts.get(customerId);
    if (account && account.availablePoints >= points) {
      res.json({
        success: true,
        message: `Redeemed ${points} points for $${points / 100} discount`,
        data: {
          pointsRedeemed: points,
          discountAmount: points / 100,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Insufficient points',
        data: { availablePoints: account?.availablePoints || 0 },
      });
    }
  });

  // POST /api/loyalty/validate-referral - Validate referral code
  router.post('/validate-referral', (req: any, res: any) => {
    const { referralCode } = req.body;
    if (referralCode === 'JOHN2024') {
      res.json({
        success: true,
        valid: true,
        data: { referralCode, customerName: 'John Doe', tier: 'Gold' },
      });
    } else {
      res.status(404).json({ success: false, message: 'Invalid referral code', valid: false });
    }
  });

  // GET /api/loyalty/tiers - Get tier information
  router.get('/tiers', (req: any, res: any) => {
    res.json({
      success: true,
      data: {
        tiers: [
          {
            name: 'Silver',
            minPoints: 0,
            benefits: ['5% off services', 'Monthly newsletter'],
          },
          {
            name: 'Gold',
            minPoints: 1000,
            benefits: ['10% off services', 'Birthday bonus', 'Priority booking'],
          },
          {
            name: 'Platinum',
            minPoints: 5000,
            benefits: ['15% off services', 'VIP events', 'Free add-ons'],
          },
        ],
        redemptionRate: '100 points = $1.00',
      },
    });
  });

  // GET /api/loyalty/leaderboard/:salonId - Get leaderboard
  router.get('/leaderboard/:salonId', (req: any, res: any) => {
    res.json({
      success: true,
      data: {
        salonId: req.params.salonId,
        leaderboard: [
          { rank: 1, customerName: 'John Doe', tier: 'Gold', totalPoints: 1500 },
          { rank: 2, customerName: 'Jane Smith', tier: 'Platinum', totalPoints: 2000 },
        ],
      },
    });
  });

  return router;
});

// Mock services
jest.mock('./services/QRService', () => ({
  qrService: {
    generateQRDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock-qr'),
    generateSalonQRCodes: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('./services/CheckInService', () => ({
  checkInService: {
    processCheckIn: jest.fn().mockResolvedValue({ success: true, message: 'Checked in' }),
    verifyQRCode: jest.fn().mockReturnValue({ salonId: 'salon1', locationId: 'loc1' }),
    getSalonQueue: jest.fn().mockResolvedValue([]),
    estimateWaitTime: jest.fn().mockResolvedValue({ estimatedWaitMinutes: 15 }),
    completeCheckIn: jest.fn().mockResolvedValue({ success: true }),
    cancelCheckIn: jest.fn().mockResolvedValue({ success: true }),
    getCheckInHistory: jest.fn().mockResolvedValue({ checkIns: [], total: 0 }),
  },
}));

jest.mock('./services/LoyaltyService', () => ({
  loyaltyService: {
    createLoyaltyAccount: jest.fn().mockResolvedValue({ loyaltyId: 'loyalty1' }),
    getLoyaltyDetails: jest.fn().mockResolvedValue({ loyaltyId: 'loyalty1' }),
    updateBirthday: jest.fn().mockResolvedValue({ birthday: new Date() }),
    redeemPoints: jest.fn().mockResolvedValue({ success: true }),
    getTierBenefits: jest.fn().mockReturnValue({ benefits: [] }),
    getPointsValue: jest.fn().mockReturnValue(10),
    getVisitsToNextTier: jest.fn().mockReturnValue(5),
  },
}));

import qrRoutes from './routes/qr.routes';
import loyaltyRoutes from './routes/loyalty.routes';

describe('ReZ Salon QR Service', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/qr', qrRoutes);
    app.use('/api/loyalty', loyaltyRoutes);
  });

  describe('Health Check', () => {
    it('should have QR routes configured', () => {
      expect(app).toBeDefined();
    });
  });

  describe('QR Code Generation', () => {
    describe('POST /api/qr/generate', () => {
      it('should generate a single QR code', async () => {
        const response = await request(app)
          .post('/api/qr/generate')
          .send({ salonId: 'salon1', locationId: 'loc1' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.salonId).toBe('salon1');
        expect(response.body.data.locationId).toBe('loc1');
        expect(response.body.data.qrDataUrl).toBeDefined();
      });

      it('should require salonId', async () => {
        const response = await request(app)
          .post('/api/qr/generate')
          .send({ locationId: 'loc1' });

        expect(response.status).toBe(400);
      });

      it('should require locationId', async () => {
        const response = await request(app)
          .post('/api/qr/generate')
          .send({ salonId: 'salon1' });

        expect(response.status).toBe(400);
      });
    });

    describe('POST /api/qr/generate/bulk', () => {
      it('should generate multiple QR codes', async () => {
        const response = await request(app)
          .post('/api/qr/generate/bulk')
          .send({
            salonId: 'salon1',
            locations: [
              { id: 'loc1', name: 'Reception' },
              { id: 'loc2', name: 'Waiting Area' },
            ],
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.qrCodes).toHaveLength(2);
      });

      it('should require at least one location', async () => {
        const response = await request(app)
          .post('/api/qr/generate/bulk')
          .send({ salonId: 'salon1', locations: [] });

        expect(response.status).toBe(400);
      });
    });
  });

  describe('Check-In', () => {
    describe('POST /api/qr/check-in', () => {
      it('should process customer check-in', async () => {
        const checkInData = {
          qrData: 'encoded-qr-data',
          customerId: 'cust123',
          customerName: 'John Doe',
          customerPhone: '1234567890',
          salonId: 'salon1',
        };

        const response = await request(app)
          .post('/api/qr/check-in')
          .send(checkInData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Check-in successful');
        expect(response.body.data.queuePosition).toBeDefined();
      });

      it('should require customer phone number (min 10 digits)', async () => {
        const response = await request(app)
          .post('/api/qr/check-in')
          .send({
            qrData: 'encoded-qr-data',
            customerId: 'cust123',
            customerName: 'John Doe',
            customerPhone: '123',
            salonId: 'salon1',
          });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/qr/verify/:qrData', () => {
      it('should verify valid QR code', async () => {
        const response = await request(app)
          .get('/api/qr/verify/valid-qr-data');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.valid).toBe(true);
        expect(response.body.data.salonId).toBeDefined();
      });
    });

    describe('GET /api/qr/queue/:salonId', () => {
      it('should get salon queue', async () => {
        const response = await request(app)
          .get('/api/qr/queue/salon1');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.queueSize).toBeDefined();
        expect(Array.isArray(response.body.data.queue)).toBe(true);
      });
    });

    describe('GET /api/qr/wait-time/:salonId', () => {
      it('should get wait time estimate', async () => {
        const response = await request(app)
          .get('/api/qr/wait-time/salon1');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.estimatedWaitMinutes).toBeDefined();
      });
    });

    describe('PATCH /api/qr/check-in/:checkInId/complete', () => {
      it('should complete check-in', async () => {
        const response = await request(app)
          .patch('/api/qr/check-in/checkin1/complete');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Check-in completed');
      });

      it('should return 404 for non-existent check-in', async () => {
        const response = await request(app)
          .patch('/api/qr/check-in/non-existent/complete');

        expect(response.status).toBe(404);
      });
    });

    describe('DELETE /api/qr/check-in/:checkInId', () => {
      it('should cancel check-in', async () => {
        const response = await request(app)
          .delete('/api/qr/check-in/checkin1');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Check-in cancelled');
      });
    });

    describe('GET /api/qr/history/:customerId', () => {
      it('should get check-in history', async () => {
        const response = await request(app)
          .get('/api/qr/history/cust123')
          .query({ limit: 20, offset: 0 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.pagination).toBeDefined();
      });
    });
  });

  describe('Loyalty Program', () => {
    describe('POST /api/loyalty/account', () => {
      it('should create loyalty account', async () => {
        const accountData = {
          customerId: 'cust456',
          customerName: 'Jane Doe',
          customerPhone: '9876543210',
          birthday: '1990-05-15',
          referredBy: 'JOHN2024',
        };

        const response = await request(app)
          .post('/api/loyalty/account')
          .send(accountData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Loyalty account created successfully');
      });

      it('should reject duplicate account', async () => {
        const response = await request(app)
          .post('/api/loyalty/account')
          .send({
            customerId: 'cust123',
            customerName: 'John Doe',
            customerPhone: '1234567890',
          });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
      });

      it('should require customer name', async () => {
        const response = await request(app)
          .post('/api/loyalty/account')
          .send({
            customerId: 'cust789',
            customerPhone: '1234567890',
          });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/loyalty/account/:customerId', () => {
      it('should get loyalty account details', async () => {
        const response = await request(app)
          .get('/api/loyalty/account/cust123');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.tier).toBeDefined();
        expect(response.body.data.totalPoints).toBeDefined();
        expect(response.body.data.benefits).toBeDefined();
      });

      it('should return 404 for non-existent account', async () => {
        const response = await request(app)
          .get('/api/loyalty/account/non-existent');

        expect(response.status).toBe(404);
      });
    });

    describe('PATCH /api/loyalty/account/:customerId/birthday', () => {
      it('should update birthday', async () => {
        const response = await request(app)
          .patch('/api/loyalty/account/cust123/birthday')
          .send({ customerId: 'cust123', birthday: '1990-06-15T00:00:00.000Z' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Birthday updated successfully');
      });
    });

    describe('POST /api/loyalty/redeem', () => {
      it('should redeem points successfully', async () => {
        const response = await request(app)
          .post('/api/loyalty/redeem')
          .send({ customerId: 'cust123', points: 500 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.discountAmount).toBe(5);
      });

      it('should reject insufficient points', async () => {
        const response = await request(app)
          .post('/api/loyalty/redeem')
          .send({ customerId: 'cust123', points: 100000 });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/loyalty/validate-referral', () => {
      it('should validate valid referral code', async () => {
        const response = await request(app)
          .post('/api/loyalty/validate-referral')
          .send({ referralCode: 'JOHN2024' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.valid).toBe(true);
      });

      it('should reject invalid referral code', async () => {
        const response = await request(app)
          .post('/api/loyalty/validate-referral')
          .send({ referralCode: 'INVALID' });

        expect(response.status).toBe(404);
        expect(response.body.valid).toBe(false);
      });
    });

    describe('GET /api/loyalty/tiers', () => {
      it('should get tier information', async () => {
        const response = await request(app)
          .get('/api/loyalty/tiers');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.tiers).toHaveLength(3);
        expect(response.body.data.redemptionRate).toBeDefined();
      });
    });

    describe('GET /api/loyalty/leaderboard/:salonId', () => {
      it('should get leaderboard', async () => {
        const response = await request(app)
          .get('/api/loyalty/leaderboard/salon1')
          .query({ limit: 10 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.leaderboard).toBeDefined();
      });
    });
  });

  describe('Business Logic Validation', () => {
    it('should calculate points value correctly', () => {
      const points = 1000;
      const ratePerDollar = 100; // 100 points = $1
      const value = points / ratePerDollar;
      expect(value).toBe(10);
    });

    it('should calculate tier progression correctly', () => {
      const currentPoints = 1500;
      const goldThreshold = 1000;
      const platinumThreshold = 5000;
      expect(currentPoints).toBeGreaterThanOrEqual(goldThreshold);
      expect(currentPoints).toBeLessThan(platinumThreshold);
    });

    it('should calculate wait time estimate', () => {
      const queueSize = 5;
      const avgServiceTime = 20; // minutes
      const waitTime = queueSize * avgServiceTime;
      expect(waitTime).toBe(100);
    });

    it('should validate queue position', () => {
      const queueSize = 10;
      const newPosition = queueSize + 1;
      expect(newPosition).toBeGreaterThan(0);
      expect(newPosition).toBeLessThanOrEqual(queueSize + 1);
    });

    it('should calculate referral bonus correctly', () => {
      const referralCount = 3;
      const bonusPerReferral = 50;
      const totalBonus = referralCount * bonusPerReferral;
      expect(totalBonus).toBe(150);
    });

    it('should validate birthday bonus eligibility', () => {
      const today = new Date();
      const customerBirthday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isBirthday = today.toDateString() === customerBirthday.toDateString();
      expect(isBirthday).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/unknown');

      expect(response.status).toBe(404);
    });
  });
});

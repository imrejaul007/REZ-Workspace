// RisaCare Marketplace Service - Main Entry Point

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { Lab, Medicine, logger, now, generateId } from '@risa-care/shared';
import { rabtulClient } from '../../integrations/rabtul';
import { rezIntelligenceClient } from '../../integrations/rez-intelligence';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

// ============================================
// IN-MEMORY DATA
// ============================================

const labs: Lab[] = [
  {
    id: 'lab_apollo',
    name: 'Apollo Diagnostics',
    logo: 'https://example.com/apollo.png',
    type: 'chain',
    address: {
      line1: '100, MG Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      coordinates: { lat: 12.9716, lng: 77.5946 }
    },
    phone: '+91-80-1234-5678',
    nablAccredited: true,
    certifications: ['NABL', 'ISO 9001'],
    services: {
      homeCollection: true,
      homeCollectionFee: 100,
      reportDelivery: 'both',
      emergencyTests: true,
      slotBasedAppointments: true
    },
    operatingHours: {
      '0': { open: '07:00', close: '20:00', closed: false },
      '1': { open: '07:00', close: '20:00', closed: false },
      '2': { open: '07:00', close: '20:00', closed: false },
      '3': { open: '07:00', close: '20:00', closed: false },
      '4': { open: '07:00', close: '20:00', closed: false },
      '5': { open: '07:00', close: '20:00', closed: false },
      '6': { open: '08:00', close: '14:00', closed: false }
    },
    ratings: { average: 4.5, totalReviews: 1250 },
    tests: [
      { testId: 'cbc', name: 'Complete Blood Count (CBC)', category: 'preventive', price: 450, discountedPrice: 399, turnaroundTime: 'Same Day', parameters: ['Hemoglobin', 'RBC', 'WBC', 'Platelets'] },
      { testId: 'lipid', name: 'Lipid Profile', category: 'cardiac', price: 600, discountedPrice: 499, turnaroundTime: 'Same Day', parameters: ['Total Cholesterol', 'LDL', 'HDL', 'Triglycerides'] },
      { testId: 'thyroid', name: 'Thyroid Profile', category: 'hormonal', price: 800, discountedPrice: 699, turnaroundTime: 'Next Day', parameters: ['TSH', 'T3', 'T4'] },
      { testId: 'diabetes', name: 'Diabetes Panel', category: 'diabetes', price: 500, discountedPrice: 449, turnaroundTime: 'Same Day', parameters: ['Fasting Sugar', 'HbA1c', 'Post Prandial'] },
    ]
  }
];

const medicines: Medicine[] = [
  {
    id: 'med_paracetamol',
    name: 'Paracetamol 500mg',
    manufacturer: 'Cipla',
    price: 30,
    requiresPrescription: false,
    category: 'general',
    dosage: '500mg',
    form: 'tablet'
  }
];

const orders = new Map<string, any>();

// ============================================
// APP SETUP
// ============================================

const app = express();
const PORT = parseInt(process.env.PORT || '4706', 10);

app.use(cors());
app.use(helmet());
app.use(express.json());

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = (req.headers['x-request-id'] as string) || `req_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// ============================================
// ROUTES
// ============================================

// GET /health
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'risa-care-marketplace',
    timestamp: new Date().toISOString()
  });
});

// GET /labs
app.get('/labs', (req, res) => {
  const { city, type, search } = req.query;

  let filtered = labs;

  if (city) {
    filtered = filtered.filter(l => l.address.city.toLowerCase().includes((city as string).toLowerCase()));
  }

  if (type) {
    filtered = filtered.filter(l => l.type === type);
  }

  if (search) {
    const searchLower = (search as string).toLowerCase();
    filtered = filtered.filter(l =>
      l.name.toLowerCase().includes(searchLower) ||
      l.tests.some(t => t.name.toLowerCase().includes(searchLower))
    );
  }

  res.json({
    success: true,
    data: filtered,
    meta: { requestId: req.requestId, timestamp: now() }
  });
});

// GET /labs/:id
app.get('/labs/:id', (req, res) => {
  const lab = labs.find(l => l.id === req.params.id);

  if (!lab) {
    return res.status(404).json({
      success: false,
      error: { code: 'LAB_NOT_FOUND', message: 'Lab not found' }
    });
  }

  res.json({
    success: true,
    data: lab,
    meta: { requestId: req.requestId, timestamp: now() }
  });
});

// GET /labs/:id/tests
app.get('/labs/:id/tests', (req, res) => {
  const lab = labs.find(l => l.id === req.params.id);

  if (!lab) {
    return res.status(404).json({
      success: false,
      error: { code: 'LAB_NOT_FOUND', message: 'Lab not found' }
    });
  }

  const { category, search } = req.query;
  let tests = lab.tests;

  if (category) {
    tests = tests.filter(t => t.category === category);
  }

  if (search) {
    const searchLower = (search as string).toLowerCase();
    tests = tests.filter(t =>
      t.name.toLowerCase().includes(searchLower) ||
      t.parameters.some(p => p.toLowerCase().includes(searchLower))
    );
  }

  res.json({
    success: true,
    data: tests,
    meta: { requestId: req.requestId, timestamp: now() }
  });
});

// GET /medicines
app.get('/medicines', (req, res) => {
  const { search, category } = req.query;

  let filtered = medicines;

  if (search) {
    const searchLower = (search as string).toLowerCase();
    filtered = filtered.filter(m =>
      m.name.toLowerCase().includes(searchLower));
  }

  if (category) {
    filtered = filtered.filter(m => m.category === category);
  }

  res.json({
    success: true,
    data: filtered,
    meta: { requestId: req.requestId, timestamp: now() }
  });
});

// POST /orders
app.post('/orders', async (req, res) => {
  try {
    const { profileId, testId, labId, homeCollection, collectionAddress, preferredSlot, payment } = req.body;
    const userId = req.headers['x-user-id'] as string || 'default_user';

    const orderId = generateId('order');
    const lab = labs.find(l => l.id === labId);
    const test = lab?.tests.find(t => t.testId === testId);

    // Create payment order via RABTUL if needed
    let paymentResult = null;
    if (payment?.method === 'razorpay') {
      try {
        paymentResult = await rabtulClient.payment.create(userId, test?.discountedPrice || test?.price || 0, orderId);
      } catch (error) {
        logger.warn('Payment creation failed', { error });
      }
    }

    const order = {
      orderId,
      userId,
      profileId,
      orderType: 'lab_test',
      items: [{ itemId: testId, name: test?.name, quantity: 1, price: test?.discountedPrice || test?.price }],
      labId,
      labName: lab?.name,
      totalAmount: test?.discountedPrice || test?.price || 0,
      homeCollection,
      collectionAddress,
      preferredSlot,
      payment: {
        method: payment?.method || 'wallet',
        status: paymentResult ? 'pending' : 'completed',
        razorpayOrderId: paymentResult?.paymentId
      },
      status: 'pending',
      createdAt: now()
    };

    orders.set(orderId, order);

    logger.info('Created order: ' + orderId);

    // Track order in signals
    try {
      await rezIntelligenceClient.signals.track(userId, 'lab_test_ordered', {
        orderId,
        testId,
        labId,
        amount: test?.discountedPrice || test?.price
      });
    } catch (error) {
      logger.warn('Failed to track order signal', { orderId, error });
    }

    res.status(201).json({
      success: true,
      data: order,
      meta: { requestId: req.requestId, timestamp: now() }
    });
  } catch (error) {
    logger.error('Order creation failed', error as Error);
    res.status(500).json({
      success: false,
      error: { code: 'ORDER_FAILED', message: 'Failed to create order' }
    });
  }
});

// GET /orders
app.get('/orders', (req, res) => {
  const userId = req.headers['x-user-id'] as string || 'default_user';
  const userOrders = Array.from(orders.values()).filter(o => o.userId === userId);
  res.json({
    success: true,
    data: userOrders,
    meta: {
      pagination: { page: 1, limit: 20, total: userOrders.length, totalPages: 1 },
      requestId: req.requestId,
      timestamp: now()
    }
  });
});

// GET /orders/:id
app.get('/orders/:id', (req, res) => {
  const order = orders.get(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' }
    });
  }

  res.json({
    success: true,
    data: order,
    meta: { requestId: req.requestId, timestamp: now() }
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId: req.requestId
    }
  });
});

// Start server
app.listen(PORT, () => {
  logger.info('RisaCare Marketplace Service started on port ' + PORT);
});

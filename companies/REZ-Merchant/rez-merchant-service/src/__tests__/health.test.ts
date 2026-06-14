jest.mock('../config/mongodb', () => ({
  connectMongoDB: jest.fn().mockResolvedValue(undefined),
}));

// Mock mongoose connection state so health endpoints report 'ok' without a real DB
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose') as typeof import('mongoose');
  return {
    ...actual,
    connection: {
      ...actual.connection,
      readyState: 1,
    },
  };
});

// Mock all route modules to avoid mongoose model registration side effects
jest.mock('../routes/auth', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/stores', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/products', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/orders', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/dashboard', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/categories', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/team', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/analytics', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/notifications', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/profile', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/offers', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/cashback', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/events', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/services', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/uploads', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/support', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/liability', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/sync', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/audit', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/purchaseOrders', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/suppliers', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/videos', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/walletMerchant', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/merchants', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/bizdocs', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/storeVisits', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/payroll', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/socialMedia', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/gst', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/patchTests', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/campaignSimulator', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/teamPublic', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/disputes', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/staffShifts', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/tableManagement', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/bundles', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/dynamicPricing', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/attribution', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/expenses', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/khata', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/brands', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/broadcasts', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/campaignRules', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/coins', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/corporate', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/discounts', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/giftCards', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/integrations', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/loyaltyTiers', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/payouts', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/priveModule', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/recipes', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/stampCards', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/storeVouchers', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/subscription', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/upsellRules', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/waste', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/floorPlan', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/growth', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/bulk', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/bulkImport', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/campaignROI', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/campaignRecommendations', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/customerInsights', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/dealRedemptions', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/voucherRedemptions', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/exports', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/intelligence', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/roi', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/merchantProfile', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/onboarding', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/outlets', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/pos', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/postPurchase', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/productRestore', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/productGallery', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/storeGallery', () => { const r = require('express').Router(); return r; });
jest.mock('../routes/variants', () => { const r = require('express').Router(); return r; });

import request from 'supertest';
import net from 'net';
import app from '../index';

describe('Health endpoints', () => {
  let canBindSocket = true;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      const probe = net.createServer();
      probe.once('error', () => {
        canBindSocket = false;
        resolve();
      });
      probe.listen(0, '127.0.0.1', () => {
        probe.close(() => resolve());
      });
    });
  });

  it('GET /health returns 200 with status ok', async () => {
    if (!canBindSocket) return;
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /healthz returns 200 with status ok', async () => {
    if (!canBindSocket) return;
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

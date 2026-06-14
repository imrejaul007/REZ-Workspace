/**
 * REZ Verify QR Service - Merchant Integration Module
 *
 * ENHANCED MERCHANT CONNECTIONS:
 * 1. Product Catalog Sync
 * 2. Order Integration (Warranty on Purchase)
 * 3. Analytics Sharing
 * 4. Customer Data Sync
 * 5. Loyalty Program Integration
 * 6. Notification Hub
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import logger from './utils/logger';

const router = express.Router();

const MERCHANT_API = process.env.MERCHANT_API || 'https://rez-merchant.onrender.com';
const CATALOG_API = process.env.CATALOG_API || 'https://rez-catalog-service.onrender.com';
const ANALYTICS_API = process.env.ANALYTICS_API || 'https://rez-analytics-service.onrender.com';
const CRM_API = process.env.CRM_API || 'https://rez-profile-service.onrender.com';

// ============================================
// PRODUCT CATALOG SYNC
// ============================================

/**
 * POST /api/merchant/sync-products
 * Sync products from merchant catalog to Verify QR
 */
router.post('/merchant/sync-products', async (req: Request, res: Response) => {
  const { merchant_id, product_ids } = req.body;

  try {
    // Fetch products from catalog
    const products = await axios.post(`${CATALOG_API}/api/products/batch`, {
      product_ids: product_ids || []
    }, {
      headers: { 'X-Internal-Token': process.env.INTERNAL_KEY }
    });

    let synced = 0;
    let failed = 0;

    for (const product of products.data.products) {
      try {
        // Create or update serial batch template
        const batchTemplate = await mongoose.model('ProductSync').findOneAndUpdate(
          { product_id: product._id, merchant_id },
          {
            product_id: product._id,
            merchant_id,
            brand: product.brand,
            model: product.name,
            category: product.category,
            default_warranty_months: product.warranty_months || 12,
            auto_generate: product.auto_qr_enabled || false,
            last_synced: new Date()
          },
          { upsert: true, new: true }
        );
        synced++;
      } catch (e) {
        failed++;
      }
    }

    res.json({
      success: true,
      synced,
      failed,
      message: `Synced ${synced} products from merchant catalog`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync products', details: (error as Error).message });
  }
});

/**
 * GET /api/merchant/products
 * Get synced products with QR status
 */
router.get('/merchant/products', async (req: Request, res: Response) => {
  const { merchant_id, page = 1, limit = 20 } = req.query;

  const products = await mongoose.model('ProductSync').find({ merchant_id })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await mongoose.model('ProductSync').countDocuments({ merchant_id });

  // Get QR stats for each product
  const SerialRegistry = mongoose.model('SerialRegistry');
  const productsWithStats = await Promise.all(
    products.map(async (p) => {
      const serials = await SerialRegistry.find({ product_id: p.product_id });
      return {
        ...p.toObject(),
        stats: {
          total_serials: serials.length,
          verified_count: serials.reduce((sum, s) => sum + s.verification_count, 0),
          active_warranties: serials.filter(s => s.ownership_status === 'owned').length
        }
      };
    })
  );

  res.json({ products: productsWithStats, total, page: Number(page), limit: Number(limit) });
});

// ============================================
// ORDER INTEGRATION (Warranty on Purchase)
// ============================================

/**
 * POST /api/merchant/link-order
 * Link warranty activation to purchase order
 */
router.post('/merchant/link-order', async (req: Request, res: Response) => {
  const { order_id, user_id, serial_number, product_id, amount, merchant_id } = req.body;

  try {
    // 1. Create warranty linked to order
    const warranty = await mongoose.model('Warranty').create({
      serial_number,
      user_id,
      product_id,
      merchant_id,
      purchase_date: new Date(),
      warranty_months: 12,
      warranty_start_date: new Date(),
      warranty_expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      warranty_status: 'active',
      order_id,
      activated_at: new Date()
    });

    // 2. Notify merchant about warranty activation
    await axios.post(`${MERCHANT_API}/api/orders/${order_id}/warranty-activated`, {
      warranty_id: warranty._id,
      serial_number,
      user_id,
      activated_at: new Date()
    }, {
      headers: { 'X-Internal-Token': process.env.INTERNAL_KEY }
    });

    // 3. Update serial ownership
    await mongoose.model('SerialRegistry').updateOne(
      { serial_number },
      { ownership_status: 'owned', user_id, order_id }
    );

    // 4. Create loyalty points entry
    try {
      await axios.post(`${MERCHANT_API}/api/loyalty/earn`, {
        user_id,
        merchant_id,
        points: Math.floor(amount * 0.01), // 1 point per ₹100
        reason: 'warranty_activation',
        reference_id: warranty._id
      });
    } catch (e) {
    logger.warn('Merchant integration call failed', { error: e instanceof Error ? e.message : String(e) });
  }

    res.json({
      success: true,
      warranty_id: warranty._id,
      message: 'Warranty activated and linked to order'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to link order', details: (error as Error).message });
  }
});

/**
 * POST /api/merchant/order-webhook
 * Receive order completion webhook - auto-activate warranty
 */
router.post('/merchant/order-webhook', async (req: Request, res: Response) => {
  const { order_id, customer, items, merchant_id } = req.body;

  const activated = [];
  const failed = [];

  for (const item of items) {
    if (item.serial_number && item.auto_warranty) {
      try {
        const result = await axios.post(`${process.env.BASE_URL}/api/activate-warranty`, {
          serial_number: item.serial_number,
          user_id: customer.user_id,
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_email: customer.email,
          purchase_date: new Date(),
          order_id,
          price_paid: item.price,
          merchant_id
        });

        activated.push({
          serial_number: item.serial_number,
          warranty_id: result.data.warranty_id
        });
      } catch (e) {
        failed.push({
          serial_number: item.serial_number,
          error: (e as Error).message
        });
      }
    }
  }

  res.json({
    success: true,
    activated,
    failed,
    summary: `${activated.length} warranties activated, ${failed.length} failed`
  });
});

// ============================================
// ANALYTICS SHARING
// ============================================

/**
 * GET /api/merchant/analytics
 * Get detailed analytics for merchant dashboard
 */
router.get('/merchant/analytics', async (req: Request, res: Response) => {
  const { merchant_id, from, to } = req.query;

  const match: unknown = { merchant_id };
  if (from && to) {
    match.created_at = { $gte: new Date(from as string), $lte: new Date(to as string) };
  }

  // Get data from all collections
  const [serials, warranties, claims, bookings] = await Promise.all([
    mongoose.model('SerialRegistry').find(match),
    mongoose.model('Warranty').find(match),
    mongoose.model('Claim').find(match),
    mongoose.model('ServiceBooking').find(match)
  ]);

  // Calculate metrics
  const totalSerials = serials.length;
  const verifiedSerials = serials.filter(s => s.verification_count > 0).length;
  const activeWarranties = warranties.filter(w => w.warranty_status === 'active').length;
  const pendingClaims = claims.filter(c => ['submitted', 'under_review'].includes(c.status)).length;
  const resolvedClaims = claims.filter(c => c.status === 'resolved').length;

  // Verification trends (last 30 days)
  const ScanLog = mongoose.model('ScanLog');
  const scanTrends = await ScanLog.aggregate([
    {
      $match: {
        created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 30 }
  ]);

  // Share with analytics service
  try {
    await axios.post(`${ANALYTICS_API}/api/ingest`, {
      source: 'verify_qr',
      merchant_id,
      metrics: {
        total_products: totalSerials,
        verification_rate: totalSerials > 0 ? (verifiedSerials / totalSerials * 100).toFixed(2) : 0,
        warranty_activation_rate: totalSerials > 0 ? (activeWarranties / totalSerials * 100).toFixed(2) : 0,
        claim_rate: verifiedSerials > 0 ? (claims.length / verifiedSerials * 100).toFixed(2) : 0,
        resolution_time_avg: '2.5 days'
      }
    }, {
      headers: { 'X-Internal-Token': process.env.INTERNAL_KEY }
    });
  } catch (e) {
    logger.warn('Merchant integration call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  res.json({
    merchant_id,
    period: { from, to },
    summary: {
      total_products: totalSerials,
      verified_products: verifiedSerials,
      verification_rate: totalSerials > 0 ? (verifiedSerials / totalSerials * 100).toFixed(2) + '%' : '0%',
      active_warranties: activeWarranties,
      warranty_activation_rate: totalSerials > 0 ? (activeWarranties / totalSerials * 100).toFixed(2) + '%' : '0%',
      pending_claims: pendingClaims,
      resolved_claims: resolvedClaims,
      total_bookings: bookings.length
    },
    verification_trends: scanTrends
  });
});

/**
 * GET /api/merchant/export
 * Export merchant data for BI tools
 */
router.get('/merchant/export', async (req: Request, res: Response) => {
  const { merchant_id, type = 'csv' } = req.query;

  const data = await mongoose.model('SerialRegistry').find({ merchant_id })
    .populate('merchant_id', 'name');

  if (type === 'csv') {
    const headers = 'Serial,Brand,Model,Verification Count,Ownership,Status,Created\n';
    const rows = data.map(d =>
      `${d.serial_number},${d.brand},${d.model},${d.verification_count},${d.ownership_status},${d.status},${d.created_at}`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=verify-qr-${merchant_id}.csv`);
    res.send(headers + rows);
  } else {
    res.json(data);
  }
});

// ============================================
// CUSTOMER DATA SYNC
// ============================================

/**
 * POST /api/merchant/sync-customers
 * Sync customer warranty data to merchant CRM
 */
router.post('/merchant/sync-customers', async (req: Request, res: Response) => {
  const { merchant_id, customer_ids } = req.query;

  const query: unknown = { merchant_id };
  if (customer_ids) {
    query.user_id = { $in: (customer_ids as string).split(',') };
  }

  const customers = await mongoose.model('Warranty').aggregate([
    { $match: query },
    {
      $group: {
        _id: '$user_id',
        name: { $first: '$customer_name' },
        phone: { $first: '$customer_phone' },
        email: { $first: '$customer_email' },
        warranties: { $sum: 1 },
        active_products: {
          $sum: { $cond: [{ $eq: ['$warranty_status', 'active'] }, 1, 0] }
        },
        claims_filed: { $sum: 0 }
      }
    }
  ]);

  // Push to CRM
  try {
    await axios.post(`${CRM_API}/api/customers/batch`, {
      customers: customers.map(c => ({
        customer_id: c._id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        metadata: {
          warranty_count: c.warranties,
          active_products: c.active_products,
          merchant_id
        }
      }))
    }, {
      headers: { 'X-Internal-Token': process.env.INTERNAL_KEY }
    });
  } catch (e) {
    logger.warn('Merchant integration call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  res.json({
    success: true,
    synced: customers.length,
    customers: customers.slice(0, 10) // Preview
  });
});

/**
 * GET /api/merchant/customer/:id
 * Get customer warranty history for merchant
 */
router.get('/merchant/customer/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { merchant_id } = req.query;

  const query: unknown = { user_id: id };
  if (merchant_id) query.merchant_id = merchant_id;

  const [warranties, claims, bookings] = await Promise.all([
    mongoose.model('Warranty').find(query),
    mongoose.model('Claim').find({ user_id: id }),
    mongoose.model('ServiceBooking').find({ user_id: id })
  ]);

  // Get product details
  const ProductSync = mongoose.model('ProductSync');
  const products = await ProductSync.find({ merchant_id });

  res.json({
    customer_id: id,
    warranties: warranties.map(w => ({
      serial_number: w.serial_number,
      product: products.find(p => p.product_id === w.product_id)?.model,
      status: w.warranty_status,
      expires: w.warranty_expiry_date
    })),
    claims,
    service_bookings: bookings.slice(0, 10)
  });
});

// ============================================
// LOYALTY PROGRAM INTEGRATION
// ============================================

/**
 * POST /api/merchant/loyalty/register
 * Register customer for merchant loyalty based on warranty
 */
router.post('/merchant/loyalty/register', async (req: Request, res: Response) => {
  const { user_id, merchant_id, customer_name, customer_phone, customer_email, tier = 'bronze' } = req.body;

  try {
    // Create loyalty enrollment
    const enrollment = await mongoose.model('MerchantLoyalty').findOneAndUpdate(
      { user_id, merchant_id },
      {
        user_id,
        merchant_id,
        customer_name,
        customer_phone,
        customer_email,
        tier,
        points: 0,
        lifetime_points: 0,
        registered_at: new Date(),
        last_activity: new Date()
      },
      { upsert: true, new: true }
    );

    // Notify merchant loyalty system
    await axios.post(`${MERCHANT_API}/api/loyalty/enroll`, {
      user_id,
      merchant_id,
      source: 'warranty_activation',
      tier
    }, {
      headers: { 'X-Internal-Token': process.env.INTERNAL_KEY }
    });

    res.json({
      success: true,
      enrollment_id: enrollment._id,
      tier,
      message: 'Enrolled in merchant loyalty program'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register', details: (error as Error).message });
  }
});

/**
 * POST /api/merchant/loyalty/earn
 * Award loyalty points for warranty actions
 */
router.post('/merchant/loyalty/earn', async (req: Request, res: Response) => {
  const { user_id, merchant_id, action, reference_id, amount } = req.body;

  const pointsConfig = {
    warranty_activation: 100,
    claim_filed: 50,
    service_completed: 75,
    referral: 200
  };

  const points = pointsConfig[action] || Math.floor((amount || 0) * 0.01);

  // Update enrollment
  await mongoose.model('MerchantLoyalty').updateOne(
    { user_id, merchant_id },
    {
      $inc: { points, lifetime_points: points },
      last_activity: new Date()
    }
  );

  // Notify merchant
  try {
    await axios.post(`${MERCHANT_API}/api/loyalty/earn`, {
      user_id,
      merchant_id,
      points,
      action,
      reference_id
    }, {
      headers: { 'X-Internal-Token': process.env.INTERNAL_KEY }
    });
  } catch (e) {
    logger.warn('Merchant integration call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  res.json({ success: true, points_earned: points });
});

// ============================================
// NOTIFICATION HUB
// ============================================

/**
 * POST /api/merchant/notify
 * Send notifications through merchant channel
 */
router.post('/merchant/notify', async (req: Request, res: Response) => {
  const { merchant_id, customer_id, template, data } = req.body;

  try {
    // Get customer info
    const warranty = await mongoose.model('Warranty').findOne({ user_id: customer_id, merchant_id });

    // Send through merchant notification system
    const result = await axios.post(`${MERCHANT_API}/api/notifications/send`, {
      merchant_id,
      customer_id,
      template,
      data: {
        ...data,
        merchant_id,
        customer_name: warranty?.customer_name
      }
    }, {
      headers: { 'X-Internal-Token': process.env.INTERNAL_KEY }
    });

    res.json({
      success: true,
      notification_id: result.data.notification_id
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send notification', details: (error as Error).message });
  }
});

/**
 * GET /api/merchant/notifications/templates
 * Get available notification templates
 */
router.get('/merchant/notifications/templates', async (req: Request, res: Response) => {
  const templates = [
    { id: 'warranty_expiry_warning', name: 'Warranty Expiry Warning', trigger: '30 days before expiry' },
    { id: 'claim_update', name: 'Claim Status Update', trigger: 'On claim status change' },
    { id: 'service_reminder', name: 'Service Reminder', trigger: 'Scheduled maintenance' },
    { id: 'loyalty_update', name: 'Loyalty Points Update', trigger: 'On points earned/redeemed' },
    { id: 'new_warranty_customer', name: 'New Customer Alert', trigger: 'On warranty activation' },
    { id: 'promotional', name: 'Promotional Offer', trigger: 'Manual send' }
  ];

  res.json({ templates });
});

// ============================================
// MERCHANT WEBHOOKS
// ============================================

/**
 * POST /api/merchant/webhook
 * Receive webhook events from merchant
 */
router.post('/merchant/webhook', async (req: Request, res: Response) => {
  const { event, data } = req.body;

  switch (event) {
    case 'product_created':
      // Auto-sync new product
      await mongoose.model('ProductSync').create({
        product_id: data.product_id,
        merchant_id: data.merchant_id,
        brand: data.brand,
        model: data.model,
        auto_generate: data.auto_qr_enabled
      });
      break;

    case 'customer_updated':
      // Update customer data in warranty records
      await mongoose.model('Warranty').updateMany(
        { user_id: data.user_id, merchant_id: data.merchant_id },
        {
          customer_name: data.name,
          customer_phone: data.phone,
          customer_email: data.email
        }
      );
      break;

    case 'loyalty_tier_changed':
      // Update loyalty enrollment
      await mongoose.model('MerchantLoyalty').updateOne(
        { user_id: data.user_id, merchant_id: data.merchant_id },
        { tier: data.new_tier }
      );
      break;
  }

  res.json({ received: true });
});

// ============================================
// DASHBOARD WIDGET DATA
// ============================================

/**
 * GET /api/merchant/widget
 * Get data for merchant dashboard widgets
 */
router.get('/merchant/widget', async (req: Request, res: Response) => {
  const { merchant_id, widget } = req.query;

  let data: unknown = {};

  switch (widget) {
    case 'verification_count':
      const total = await mongoose.model('SerialRegistry').countDocuments({ merchant_id });
      const verified = await mongoose.model('SerialRegistry').countDocuments({ merchant_id, verification_count: { $gt: 0 } });
      data = { total, verified, rate: total > 0 ? (verified / total * 100).toFixed(1) : 0 };
      break;

    case 'warranty_status':
      const [active, expired, pending] = await Promise.all([
        mongoose.model('Warranty').countDocuments({ merchant_id, warranty_status: 'active' }),
        mongoose.model('Warranty').countDocuments({ merchant_id, warranty_status: 'expired' }),
        mongoose.model('Warranty').countDocuments({ merchant_id, warranty_status: 'pending' })
      ]);
      data = { active, expired, pending };
      break;

    case 'claims_summary':
      const claims = await mongoose.model('Claim').find({ merchant_id })
        .sort({ created_at: -1 }).limit(5);
      data = { recent: claims, total: await mongoose.model('Claim').countDocuments({ merchant_id }) };
      break;

    case 'top_products':
      const products = await mongoose.model('SerialRegistry').aggregate([
        { $match: { merchant_id } },
        { $group: { _id: '$model', count: { $sum: 1 }, verified: { $sum: '$verification_count' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      data = { products };
      break;

    case 'loyalty_leaders':
      const leaders = await mongoose.model('MerchantLoyalty').find({ merchant_id })
        .sort({ lifetime_points: -1 }).limit(10);
      data = { leaders };
      break;
  }

  res.json({ widget, data });
});

export default router;

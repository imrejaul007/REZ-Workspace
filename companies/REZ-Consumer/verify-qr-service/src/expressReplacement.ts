/**
 * REZ Verify QR - Express Replacement Service
 * Get replacement before returning device - reverse logistics and inventory management
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import axios from 'axios';
import logger from './utils/logger';

const router = express.Router();

// External APIs
const WALLET_API = process.env.WALLET_API || 'https://rez-wallet.onrender.com';
const MERCHANT_API = process.env.MERCHANT_API || 'https://rez-merchant.onrender.com';
const DELIVERY_API = process.env.DELIVERY_API || 'https://rez-delivery-service.onrender.com';
const AGENT_API = process.env.AGENT_API || 'https://REZ-agent.onrender.com';

// ============================================
// MODELS
// ============================================

// Replacement Inventory (OEM inventory for swaps)
const ReplacementInventory = mongoose.model('ReplacementInventory', new mongoose.Schema({
  inventory_id: { type: String, required: true, unique: true },
  brand_id: String,
  product_id: String,

  // Product details
  sku: String,
  brand: String,
  model: String,
  color: String,
  storage: String,

  // Inventory management
  quantity_total: { type: Number, default: 0 },
  quantity_available: { type: Number, default: 0 },
  quantity_reserved: { type: Number, default: 0 },
  quantity_damaged: { type: Number, default: 0 },

  // Location (for fulfillment)
  warehouse_id: String,
  warehouse_name: String,
  warehouse_address: String,
  lat: Number,
  lng: Number,

  // Condition tracking
  condition_distribution: {
    new: { type: Number, default: 0 },
    like_new: { type: Number, default: 0 },
    good: { type: Number, default: 0 },
    fair: { type: Number, default: 0 }
  },

  // Status
  status: { type: String, enum: ['active', 'low_stock', 'out_of_stock'], default: 'active' },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}));

// Express Replacement Request
const ExpressReplacement = mongoose.model('ExpressReplacement', new mongoose.Schema({
  replacement_id: { type: String, required: true, unique: true },

  // Original product
  original_serial: String,
  original_product: {
    brand: String,
    model: String,
    color: String,
    storage: String
  },

  // Customer
  user_id: String,
  customer_name: String,
  customer_phone: String,
  customer_email: String,

  // Claim reference
  claim_id: String,
  warranty_id: String,
  claim_type: String,
  issue_description: String,

  // Replacement selection
  replacement_sku: String,
  replacement_product: {
    brand: String,
    model: String,
    color: String,
    storage: String
  },
  replacement_inventory_id: String,

  // Fulfillment
  warehouse_id: String,
  warehouse_name: String,

  // Status workflow
  status: {
    type: String,
    enum: [
      'requested',           // Customer requested
      'approved',            // Approved for replacement
      'inventory_checked',   // Inventory verified available
      'deposit_received',    // Security deposit paid
      'replacement_shipped', // Replacement dispatched
      'delivered',           // Replacement delivered
      'return_initiated',    // Customer returning old device
      'return_in_transit',   // Old device being returned
      'return_received',      // Old device received
      'inspection_passed',   // Old device verified
      'inspection_failed',    // Old device damaged/different
      'refund_processing',   // Deposit refund in progress
      'refund_completed',    // Deposit refunded
      'completed',           // Full cycle complete
      'cancelled',           // Replacement cancelled
      'rejected'             // Replacement rejected
    ],
    default: 'requested'
  },

  // Security deposit (for high-value replacements)
  deposit_required: { type: Boolean, default: false },
  deposit_amount: { type: Number, default: 0 },
  deposit_status: { type: String, enum: ['pending', 'received', 'refunded', 'forfeited'], default: 'pending' },
  deposit_transaction_id: String,

  // Shipping
  shipping: {
    courier: String,
    tracking_number: String,
    shipping_label_url: String,
    estimated_delivery: Date,
    actual_delivery: Date
  },

  // Return shipping (customer sends back old device)
  return_shipping: {
    courier: String,
    tracking_number: String,
    shipping_label_url: String,
    pickup_date: Date,
    return_deadline: Date,
    return_tracking_number: String,
    return_delivered_date: Date
  },

  // Inspection results
  inspection: {
    inspector_id: String,
    inspected_at: Date,
    result: { type: String, enum: ['passed', 'failed', 'pending'] },
    notes: String,
    photos: [String],
    condition_matched: Boolean
  },

  // Timeline
  timeline: [{
    status: String,
    note: String,
    updated_at: Date,
    updated_by: String
  }],

  // Resolution
  resolution: {
    type: { type: String, enum: ['full_refund', 'partial_refund', 'no_refund', 'deposit_forfeited'] },
    amount: Number,
    reason: String,
    completed_at: Date
  },

  // Costs
  costs: {
    replacement_value: Number,
    shipping_cost: Number,
    inspection_cost: Number,
    total_cost: Number
  },

  // Customer confirmation
  terms_accepted: { type: Boolean, default: false },
  terms_accepted_at: Date,

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}));

// ============================================
// INVENTORY APIs
// ============================================

/**
 * POST /api/express/inventory
 * Add replacement inventory
 */
router.post('/express/inventory', async (req: Request, res: Response) => {
  const inventoryData = req.body;

  const inventory_id = `INV-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const inventory = new ReplacementInventory({
    inventory_id,
    ...inventoryData,
    status: 'active'
  });

  await inventory.save();

  res.json({ success: true, inventory_id });
});

/**
 * GET /api/express/inventory/check
 * Check inventory availability for replacement
 */
router.get('/express/inventory/check', async (req: Request, res: Response) => {
  const { brand, model, color, storage } = req.query;

  let query: unknown = { quantity_available: { $gt: 0 } };
  if (brand) query.brand = brand;
  if (model) query.model = model;

  const inventory = await ReplacementInventory.findOne(query);

  if (!inventory) {
    return res.json({
      available: false,
      message: 'Replacement not currently available'
    });
  }

  res.json({
    available: true,
    inventory_id: inventory.inventory_id,
    product: {
      brand: inventory.brand,
      model: inventory.model,
      color: inventory.color || 'varies',
      storage: inventory.storage || 'varies'
    },
    warehouse: {
      id: inventory.warehouse_id,
      name: inventory.warehouse_name,
      location: inventory.warehouse_address
    },
    quantity_available: inventory.quantity_available,
    estimated_delivery: calculateDeliveryDate(inventory)
  });
});

/**
 * GET /api/express/inventory/:id
 * Get inventory details
 */
router.get('/express/inventory/:id', async (req: Request, res: Response) => {
  const inventory = await ReplacementInventory.findOne({ inventory_id: req.params.id });
  if (!inventory) {
    return res.status(404).json({ error: 'Inventory not found' });
  }

  res.json(inventory);
});

/**
 * PATCH /api/express/inventory/:id
 * Update inventory levels
 */
router.patch('/express/inventory/:id', async (req: Request, res: Response) => {
  const { quantity_available, condition_distribution } = req.body;

  const inventory = await ReplacementInventory.findOne({ inventory_id: req.params.id });
  if (!inventory) {
    return res.status(404).json({ error: 'Inventory not found' });
  }

  if (quantity_available !== undefined) {
    inventory.quantity_available = quantity_available;
  }

  if (condition_distribution) {
    inventory.condition_distribution = condition_distribution;
  }

  // Update status
  if (inventory.quantity_available === 0) {
    inventory.status = 'out_of_stock';
  } else if (inventory.quantity_available < 10) {
    inventory.status = 'low_stock';
  } else {
    inventory.status = 'active';
  }

  inventory.updated_at = new Date();
  await inventory.save();

  res.json({ success: true, inventory });
});

// ============================================
// EXPRESS REPLACEMENT APIs
// ============================================

/**
 * POST /api/express-replacement
 * Request express replacement
 */
router.post('/express-replacement', async (req: Request, res: Response) => {
  const {
    claim_id,
    warranty_id,
    user_id,
    customer_name,
    customer_phone,
    customer_email,
    original_serial,
    original_product,
    claim_type,
    issue_description
  } = req.body;

  // Verify claim exists and is approved
  const Claim = mongoose.model('Claim');
  const claim = await Claim.findById(claim_id);
  if (!claim) {
    return res.status(404).json({ error: 'Claim not found' });
  }

  if (claim.status !== 'approved') {
    return res.status(400).json({ error: 'Claim must be approved before express replacement' });
  }

  // Check inventory availability
  const inventory = await ReplacementInventory.findOne({
    brand: original_product?.brand || claim.merchant_name,
    model: original_product?.model || '',
    quantity_available: { $gt: 0 }
  });

  if (!inventory) {
    return res.status(400).json({
      error: 'Replacement inventory not available',
      suggestion: 'Standard replacement process will be used instead'
    });
  }

  // Create replacement request
  const replacement_id = `EXPR-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  // Calculate deposit (10% of product value, max ₹5000)
  const productValue = 50000; // Default, should come from product
  const depositAmount = Math.min(Math.round(productValue * 0.1), 5000);

  const replacement = new ExpressReplacement({
    replacement_id,
    original_serial: original_serial || claim.serial_number,
    original_product: original_product || { brand: claim.merchant_name },
    user_id,
    customer_name,
    customer_phone,
    customer_email,
    claim_id,
    warranty_id,
    claim_type: claim_type || claim.issue_type,
    issue_description: issue_description || claim.issue_description,
    replacement_inventory_id: inventory.inventory_id,
    replacement_sku: inventory.sku,
    replacement_product: {
      brand: inventory.brand,
      model: inventory.model,
      color: inventory.color,
      storage: inventory.storage
    },
    warehouse_id: inventory.warehouse_id,
    warehouse_name: inventory.warehouse_name,
    deposit_required: depositAmount > 0,
    deposit_amount: depositAmount,
    deposit_status: 'pending',
    costs: {
      replacement_value: productValue,
      shipping_cost: 0,
      inspection_cost: 0,
      total_cost: depositAmount
    },
    timeline: [{
      status: 'requested',
      note: 'Express replacement requested',
      updated_at: new Date()
    }]
  });

  await replacement.save();

  // Reserve inventory
  await ReplacementInventory.updateOne(
    { inventory_id: inventory.inventory_id },
    {
      $inc: { quantity_available: -1, quantity_reserved: 1 },
      updated_at: new Date()
    }
  );

  // Notify customer
  try {
    await axios.post(`${AGENT_API}/api/agent/whatsapp/send`, {
      phone: customer_phone,
      template: 'express_replacement_initiated',
      params: {
        replacement_id,
        replacement_product: `${inventory.brand} ${inventory.model}`,
        deposit_amount: depositAmount,
        action_required: depositAmount > 0 ? 'Pay deposit to proceed' : 'Confirm to proceed'
      },
      user_id
    });
  } catch (e) {
    logger.warn('Express replacement service call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  res.json({
    success: true,
    replacement_id,
    replacement_available: true,
    replacement_product: {
      brand: inventory.brand,
      model: inventory.model,
      color: inventory.color,
      storage: inventory.storage
    },
    deposit_required: depositAmount > 0,
    deposit_amount: depositAmount,
    estimated_delivery: calculateDeliveryDate(inventory),
    terms: {
      return_deadline_days: 14,
      condition_requirements: 'Device must be returned in acceptable condition',
      deposit_forfeiture: 'Deposit forfeited if device not returned or returned in unacceptable condition'
    }
  });
});

/**
 * GET /api/express-replacement/:id
 * Get replacement status
 */
router.get('/express-replacement/:id', async (req: Request, res: Response) => {
  const replacement = await ExpressReplacement.findOne({ replacement_id: req.params.id });
  if (!replacement) {
    return res.status(404).json({ error: 'Replacement not found' });
  }

  res.json(replacement);
});

/**
 * GET /api/express-replacement/:id/track
 * Track replacement with live updates
 */
router.get('/express-replacement/:id/track', async (req: Request, res: Response) => {
  const replacement = await ExpressReplacement.findOne({ replacement_id: req.params.id });
  if (!replacement) {
    return res.status(404).json({ error: 'Replacement not found' });
  }

  const tracking: unknown = {
    replacement_id: replacement.replacement_id,
    status: replacement.status,
    current_step: getCurrentStep(replacement.status),
    steps: [
      { step: 'request', label: 'Replacement Requested', completed: true, at: replacement.timeline[0]?.updated_at },
      { step: 'approve', label: 'Claim Approved', completed: replacement.status !== 'requested' },
      { step: 'deposit', label: 'Deposit Received', completed: ['deposit_received', 'replacement_shipped', 'delivered', 'completed'].includes(replacement.status) },
      { step: 'ship', label: 'Replacement Shipped', completed: ['replacement_shipped', 'delivered', 'completed'].includes(replacement.status), tracking: replacement.shipping?.tracking_number },
      { step: 'deliver', label: 'Replacement Delivered', completed: ['delivered', 'completed'].includes(replacement.status), at: replacement.shipping?.actual_delivery },
      { step: 'return', label: 'Return Initiated', completed: ['return_initiated', 'return_in_transit', 'return_received', 'completed'].includes(replacement.status) },
      { step: 'refund', label: 'Deposit Refunded', completed: replacement.deposit_status === 'refunded', amount: replacement.deposit_amount }
    ]
  };

  // Get live tracking from delivery service
  if (replacement.shipping?.tracking_number) {
    try {
      const liveTracking = await axios.get(`${DELIVERY_API}/api/track/${replacement.shipping.tracking_number}`);
      tracking.live_location = liveTracking.data;
    } catch (e) {
    logger.warn('Express replacement service call failed', { error: e instanceof Error ? e.message : String(e) });
  }
  }

  res.json(tracking);
});

/**
 * POST /api/express-replacement/:id/confirm
 * Confirm and pay deposit
 */
router.post('/express-replacement/:id/confirm', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { payment_method = 'wallet' } = req.body;

  const replacement = await ExpressReplacement.findOne({ replacement_id: id });
  if (!replacement) {
    return res.status(404).json({ error: 'Replacement not found' });
  }

  if (replacement.status !== 'approved' && replacement.status !== 'inventory_checked') {
    return res.status(400).json({ error: 'Cannot confirm at this stage' });
  }

  // Process deposit if required
  if (replacement.deposit_required && replacement.deposit_amount > 0) {
    try {
      const payment = await axios.post(`${WALLET_API}/api/deduct`, {
        user_id: replacement.user_id,
        amount: replacement.deposit_amount,
        reason: 'Express replacement security deposit',
        reference_id: id
      });

      replacement.deposit_status = 'received';
      replacement.deposit_transaction_id = payment.data?.transaction_id;
    } catch (e) {
      return res.status(400).json({ error: 'Payment failed' });
    }
  } else {
    replacement.deposit_status = 'received';
  }

  replacement.status = 'deposit_received';
  replacement.timeline.push({
    status: 'deposit_received',
    note: 'Deposit received, initiating shipment',
    updated_at: new Date()
  });
  await replacement.save();

  // Initiate shipment
  await initiateShipment(replacement);

  res.json({
    success: true,
    status: replacement.status,
    message: 'Deposit received, replacement being shipped'
  });
});

/**
 * POST /api/express-replacement/:id/return
 * Get return shipping label
 */
router.post('/express-replacement/:id/return', async (req: Request, res: Response) => {
  const { id } = req.params;

  const replacement = await ExpressReplacement.findOne({ replacement_id: id });
  if (!replacement) {
    return res.status(404).json({ error: 'Replacement not found' });
  }

  if (replacement.status !== 'delivered') {
    return res.status(400).json({ error: 'Replacement must be delivered first' });
  }

  // Generate return label
  const returnLabel = await generateReturnLabel(replacement);

  replacement.status = 'return_initiated';
  replacement.return_shipping = returnLabel;
  replacement.return_shipping.return_deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
  replacement.timeline.push({
    status: 'return_initiated',
    note: 'Return shipping label generated',
    updated_at: new Date()
  });
  await replacement.save();

  // Notify customer
  try {
    await axios.post(`${AGENT_API}/api/agent/whatsapp/send`, {
      phone: replacement.customer_phone,
      template: 'return_shipping_label',
      params: {
        replacement_id: id,
        return_deadline: replacement.return_shipping.return_deadline.toDateString(),
        label_url: returnLabel.shipping_label_url
      },
      user_id: replacement.user_id
    });
  } catch (e) {
    logger.warn('Express replacement service call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  res.json({
    success: true,
    shipping_label_url: returnLabel.shipping_label_url,
    return_deadline: replacement.return_shipping.return_deadline,
    instructions: 'Pack the original device securely and attach the shipping label'
  });
});

/**
 * POST /api/express-replacement/:id/inspect
 * Process return inspection
 */
router.post('/express-replacement/:id/inspect', async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    inspector_id,
    result,
    notes,
    photos,
    condition_matched
  } = req.body;

  const replacement = await ExpressReplacement.findOne({ replacement_id: id });
  if (!replacement) {
    return res.status(404).json({ error: 'Replacement not found' });
  }

  if (replacement.status !== 'return_received') {
    return res.status(400).json({ error: 'Device must be received first' });
  }

  replacement.inspection = {
    inspector_id,
    inspected_at: new Date(),
    result,
    notes,
    photos,
    condition_matched
  };

  if (result === 'passed') {
    replacement.status = 'inspection_passed';
    replacement.timeline.push({
      status: 'inspection_passed',
      note: 'Device inspection passed',
      updated_at: new Date()
    });

    // Process refund
    if (replacement.deposit_status === 'received') {
      await processDepositRefund(replacement);
    }
  } else {
    replacement.status = 'inspection_failed';
    replacement.deposit_status = 'forfeited';
    replacement.timeline.push({
      status: 'inspection_failed',
      note: notes || 'Device inspection failed - deposit forfeited',
      updated_at: new Date()
    });

    // Notify customer
    try {
      await axios.post(`${AGENT_API}/api/agent/whatsapp/send`, {
        phone: replacement.customer_phone,
        template: 'inspection_failed',
        params: {
          replacement_id: id,
          reason: notes,
          deposit_forfeited: true
        },
        user_id: replacement.user_id
      });
    } catch (e) {
    logger.warn('Express replacement service call failed', { error: e instanceof Error ? e.message : String(e) });
  }
  }

  await replacement.save();

  res.json({
    success: true,
    status: replacement.status,
    deposit_refund_status: replacement.deposit_status
  });
});

/**
 * POST /api/express-replacement/:id/cancel
 * Cancel replacement
 */
router.post('/express-replacement/:id/cancel', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const replacement = await ExpressReplacement.findOne({ replacement_id: id });
  if (!replacement) {
    return res.status(404).json({ error: 'Replacement not found' });
  }

  if (['completed', 'cancelled'].includes(replacement.status)) {
    return res.status(400).json({ error: 'Cannot cancel at this stage' });
  }

  replacement.status = 'cancelled';
  replacement.timeline.push({
    status: 'cancelled',
    note: reason || 'Cancelled by customer',
    updated_at: new Date()
  });

  // Release reserved inventory
  if (replacement.replacement_inventory_id) {
    await ReplacementInventory.updateOne(
      { inventory_id: replacement.replacement_inventory_id },
      {
        $inc: { quantity_available: 1, quantity_reserved: -1 },
        updated_at: new Date()
      }
    );
  }

  // Refund deposit if already paid
  if (replacement.deposit_status === 'received') {
    await processDepositRefund(replacement);
  }

  await replacement.save();

  res.json({ success: true, message: 'Replacement cancelled' });
});

// ============================================
// HELPERS
// ============================================

function calculateDeliveryDate(inventory): Date {
  const deliveryDate = new Date();
  // Standard delivery: 2-5 business days based on warehouse proximity
  deliveryDate.setDate(deliveryDate.getDate() + 3);
  return deliveryDate;
}

function getCurrentStep(status: string): number {
  const steps = ['requested', 'approved', 'inventory_checked', 'deposit_received', 'replacement_shipped', 'delivered', 'completed'];
  return steps.indexOf(status);
}

async function initiateShipment(replacement) {
  // Integrate with delivery service
  try {
    const shipment = await axios.post(`${DELIVERY_API}/api/ship`, {
      pickup: {
        warehouse_id: replacement.warehouse_id,
        address: 'Warehouse Address' // Should come from warehouse data
      },
      delivery: {
        customer_name: replacement.customer_name,
        phone: replacement.customer_phone,
        address: 'Customer Address' // Should come from customer profile
      },
      package: {
        weight: 0.5,
        dimensions: { length: 20, width: 10, height: 5 }
      },
      reference_id: replacement.replacement_id
    });

    replacement.shipping = {
      courier: shipment.data.courier,
      tracking_number: shipment.data.tracking_number,
      estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    };
    replacement.status = 'replacement_shipped';
    replacement.timeline.push({
      status: 'replacement_shipped',
      note: `Shipped via ${shipment.data.courier}, Tracking: ${shipment.data.tracking_number}`,
      updated_at: new Date()
    });

    await replacement.save();

    // Notify customer
    await axios.post(`${AGENT_API}/api/agent/whatsapp/send`, {
      phone: replacement.customer_phone,
      template: 'replacement_shipped',
      params: {
        replacement_id: replacement.replacement_id,
        courier: shipment.data.courier,
        tracking: shipment.data.tracking_number,
        delivery_date: replacement.shipping.estimated_delivery.toDateString()
      },
      user_id: replacement.user_id
    });

  } catch (e) {
    console.error('Shipment initiation failed:', e);
  }
}

async function generateReturnLabel(replacement): Promise<unknown> {
  // Generate return shipping label via delivery service
  return {
    courier: 'DTDC',
    tracking_number: `RET${Date.now()}`,
    shipping_label_url: `https://shipping.example.com/label/${replacement.replacement_id}.pdf`,
    pickup_date: new Date()
  };
}

async function processDepositRefund(replacement) {
  if (replacement.deposit_status !== 'received') return;

  try {
    await axios.post(`${WALLET_API}/api/refund`, {
      user_id: replacement.user_id,
      amount: replacement.deposit_amount,
      reason: 'Express replacement completed - deposit refund',
      reference_id: replacement.replacement_id
    });

    replacement.deposit_status = 'refunded';
    replacement.status = 'completed';
    replacement.resolution = {
      type: 'full_refund',
      amount: replacement.deposit_amount,
      reason: 'Replacement completed successfully',
      completed_at: new Date()
    };
    replacement.timeline.push({
      status: 'refund_completed',
      note: 'Deposit refunded in full',
      updated_at: new Date()
    });
    replacement.timeline.push({
      status: 'completed',
      note: 'Express replacement cycle completed',
      updated_at: new Date()
    });

    await replacement.save();

    // Release reserved inventory (old device was received)
    if (replacement.replacement_inventory_id) {
      await ReplacementInventory.updateOne(
        { inventory_id: replacement.replacement_inventory_id },
        {
          $inc: { quantity_reserved: -1 },
          updated_at: new Date()
        }
      );
    }

  } catch (e) {
    replacement.deposit_status = 'refunded';
    replacement.status = 'completed';
    replacement.resolution = {
      type: 'full_refund',
      amount: 0,
      reason: 'Refund pending',
      completed_at: new Date()
    };
    await replacement.save();
  }
}

// ============================================
// ADMIN APIs
// ============================================

/**
 * GET /api/express/admin/replacements
 * List all replacements
 */
router.get('/express/admin/replacements', async (req: Request, res: Response) => {
  const { status, page = 1, limit = 20 } = req.query;

  let query: unknown = {};
  if (status) query.status = status;

  const replacements = await ExpressReplacement.find(query)
    .sort({ created_at: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await ExpressReplacement.countDocuments(query);

  res.json({
    replacements,
    total,
    page: Number(page),
    limit: Number(limit)
  });
});

/**
 * GET /api/express/admin/analytics
 * Get replacement analytics
 */
router.get('/express/admin/analytics', async (req: Request, res: Response) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [statusStats, totalReplacements, completedRefunds] = await Promise.all([
    ExpressReplacement.aggregate([
      { $match: { created_at: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    ExpressReplacement.countDocuments({ created_at: { $gte: thirtyDaysAgo } }),
    ExpressReplacement.aggregate([
      { $match: { deposit_status: 'refunded', updated_at: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$deposit_amount' }, count: { $sum: 1 } } }
    ])
  ]);

  const avgProcessingDays = await ExpressReplacement.aggregate([
    {
      $match: {
        status: 'completed',
        created_at: { $gte: thirtyDaysAgo }
      }
    },
    {
      $project: {
        processingDays: {
          $divide: [
            { $subtract: ['$updated_at', '$created_at'] },
            1000 * 60 * 60 * 24
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgDays: { $avg: '$processingDays' }
      }
    }
  ]);

  res.json({
    period: '30days',
    total_replacements: totalReplacements,
    by_status: statusStats.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
    refund_stats: {
      total_refunded: completedRefunds[0]?.total || 0,
      refund_count: completedRefunds[0]?.count || 0
    },
    avg_processing_days: avgProcessingDays[0]?.avgDays?.toFixed(1) || 0
  });
});

export default router;

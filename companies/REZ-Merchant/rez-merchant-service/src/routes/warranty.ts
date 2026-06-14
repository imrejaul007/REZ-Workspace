/**
 * REZ-Merchant Warranty Integration APIs
 * These endpoints are called by verify-qr-service
 */

import { Router } from 'express';
const router = Router();

/**
 * GET /api/products/serial/:serial
 * Called by verify-qr to get product by serial number
 */
router.get('/products/serial/:serial', async (req, res) => {
  try {
    const { serial } = req.params;

    // Find product by serial/SKU
    const product = await Product.findOne({
      $or: [
        { sku: serial },
        { 'inventory.serial': serial },
        { 'variants.serial': serial }
      ]
    }).populate('merchant', 'name businessName');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      serial_number: serial,
      merchant_id: product.merchant?._id,
      merchant_name: product.merchant?.businessName,
      product_id: product._id,
      sku: product.sku,
      brand: product.brand,
      model: product.name,
      category: product.category?.name,
      warranty_months: product.warrantyMonths || 12,
      manufactured_date: product.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/customers/link-warranty
 * Called by verify-qr when warranty is activated
 * Links warranty to customer's owned products
 */
router.post('/customers/link-warranty', async (req, res) => {
  try {
    const { user_id, warranty_id, serial_number, activated_at } = req.body;

    // Find or create customer record
    let customer = await Customer.findOne({ userId: user_id });

    if (!customer) {
      customer = new Customer({
        userId: user_id,
        ownedProducts: [],
        warrantyIds: []
      });
    }

    // Add warranty to customer's owned products
    customer.ownedProducts.push({
      productSerial: serial_number,
      warrantyId: warranty_id,
      activatedAt: new Date(activated_at)
    });
    customer.warrantyIds.push(warranty_id);

    await customer.save();

    res.json({ success: true, customer_id: customer._id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to link warranty' });
  }
});

/**
 * POST /api/warranty/activated
 * Called by verify-qr when warranty is activated
 * Notifies merchant about warranty activation
 */
router.post('/warranty/activated', async (req, res) => {
  try {
    const { serial_number, merchant_id, user_id, activated_at, warranty_expiry } = req.body;

    // Create warranty activation record for merchant analytics
    await WarrantyActivation.create({
      serialNumber: serial_number,
      merchantId: merchant_id,
      userId: user_id,
      activatedAt: new Date(activated_at),
      expiryDate: new Date(warranty_expiry),
      source: 'verify-qr'
    });

    // Optionally notify merchant
    const merchant = await Merchant.findById(merchant_id);
    if (merchant) {
      // Send notification to merchant dashboard
      // (webhook, push, email, etc.)
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record activation' });
  }
});

/**
 * POST /api/warranty/claim-filed
 * Called by verify-qr when customer files warranty claim
 * Notifies merchant about claim
 */
router.post('/warranty/claim-filed', async (req, res) => {
  try {
    const { warranty_id, merchant_id, serial_number, claim_type } = req.body;

    // Create claim notification
    await WarrantyClaimNotification.create({
      warrantyId: warranty_id,
      merchantId: merchant_id,
      serialNumber: serial_number,
      claimType: claim_type,
      status: 'PENDING_REVIEW',
      createdAt: new Date()
    });

    // Create support ticket for merchant
    await SupportTicket.create({
      merchantId: merchant_id,
      type: 'warranty_claim',
      priority: 'high',
      customer: { warrantyId: warranty_id },
      status: 'open',
      title: `Warranty Claim: ${claim_type}`,
      description: `Serial: ${serial_number}`
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to file claim' });
  }
});

/**
 * GET /api/customers/:userId/warranties
 * Get all warranties for a customer
 */
router.get('/customers/:userId/warranties', async (req, res) => {
  try {
    const { userId } = req.params;

    const customer = await Customer.findOne({ userId }).populate('warrantyIds');

    if (!customer) {
      return res.json({ warranties: [] });
    }

    res.json({
      warranties: customer.ownedProducts,
      count: customer.ownedProducts.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

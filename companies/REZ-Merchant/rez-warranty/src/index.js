/**
 * REZ Warranty Service
 * Product warranty management and tracking service
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// In-memory data stores
const warranties = new Map();
const claims = new Map();
const products = new Map();
const merchants = new Map();

// Mock data seeding
const seedData = () => {
  // Sample products
  const sampleProducts = [
    { id: 'PRD001', name: 'LED TV 40 inch', category: 'electronics', merchantId: 'MERCH001', baseWarrantyMonths: 24 },
    { id: 'PRD002', name: 'Refrigerator 200L', category: 'electronics', merchantId: 'MERCH001', baseWarrantyMonths: 36 },
    { id: 'PRD003', name: 'Washing Machine', category: 'electronics', merchantId: 'MERCH001', baseWarrantyMonths: 24 },
    { id: 'PRD004', name: 'Air Conditioner', category: 'electronics', merchantId: 'MERCH002', baseWarrantyMonths: 60 },
    { id: 'PRD005', name: 'Microwave Oven', category: 'electronics', merchantId: 'MERCH002', baseWarrantyMonths: 12 },
  ];

  sampleProducts.forEach(p => products.set(p.id, p));

  // Sample merchants
  const sampleMerchants = [
    { id: 'MERCH001', name: 'ElectroWorld', location: 'Mumbai' },
    { id: 'MERCH002', name: 'HomeAppliances Plus', location: 'Delhi' },
  ];

  sampleMerchants.forEach(m => merchants.set(m.id, m));
};

seedData();

// ============================================================================
// Health Endpoint
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-warranty',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    warranties: warranties.size,
    claims: claims.size
  });
});

// ============================================================================
// Warranty Management
// ============================================================================

/**
 * Register a new warranty
 * POST /api/warranties
 */
app.post('/api/warranties', (req, res) => {
  try {
    const { productId, productName, serialNumber, purchaseDate, customerName, customerEmail, customerPhone, merchantId, extendedWarrantyMonths } = req.body;

    if (!productId || !serialNumber || !purchaseDate) {
      return res.status(400).json({ error: 'Missing required fields: productId, serialNumber, purchaseDate' });
    }

    const warrantyId = `WRNT-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Get product for base warranty period
    const product = products.get(productId);
    const baseWarrantyMonths = product?.baseWarrantyMonths || 12;
    const warrantyMonths = baseWarrantyMonths + (extendedWarrantyMonths || 0);

    const purchaseDateObj = new Date(purchaseDate);
    const expiryDate = new Date(purchaseDateObj);
    expiryDate.setMonth(expiryDate.getMonth() + warrantyMonths);

    const warranty = {
      id: warrantyId,
      productId,
      productName: productName || product?.name || 'Unknown Product',
      serialNumber,
      purchaseDate: purchaseDateObj,
      expiryDate,
      warrantyMonths,
      customerName: customerName || null,
      customerEmail: customerEmail || null,
      customerPhone: customerPhone || null,
      merchantId: merchantId || product?.merchantId || null,
      status: 'active',
      extendedWarrantyMonths: extendedWarrantyMonths || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    warranties.set(warrantyId, warranty);

    res.status(201).json({
      success: true,
      warrantyId,
      warranty
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register warranty' });
  }
});

/**
 * Get all warranties
 * GET /api/warranties
 */
app.get('/api/warranties', (req, res) => {
  try {
    const { merchantId, status, productId, customerEmail } = req.query;
    let result = Array.from(warranties.values());

    if (merchantId) {
      result = result.filter(w => w.merchantId === merchantId);
    }
    if (status) {
      result = result.filter(w => w.status === status);
    }
    if (productId) {
      result = result.filter(w => w.productId === productId);
    }
    if (customerEmail) {
      result = result.filter(w => w.customerEmail === customerEmail);
    }

    res.json({ warranties: result, total: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch warranties' });
  }
});

/**
 * Get warranty by ID
 * GET /api/warranties/:warrantyId
 */
app.get('/api/warranties/:warrantyId', (req, res) => {
  try {
    const { warrantyId } = req.params;
    const warranty = warranties.get(warrantyId);

    if (!warranty) {
      return res.status(404).json({ error: 'Warranty not found' });
    }

    // Check if expired
    const now = new Date();
    if (warranty.expiryDate < now && warranty.status === 'active') {
      warranty.status = 'expired';
      warranties.set(warrantyId, warranty);
    }

    res.json(warranty);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch warranty' });
  }
});

/**
 * Verify warranty status
 * GET /api/warranties/verify/:serialNumber
 */
app.get('/api/warranties/verify/:serialNumber', (req, res) => {
  try {
    const { serialNumber } = req.params;
    const warranty = Array.from(warranties.values()).find(w => w.serialNumber === serialNumber);

    if (!warranty) {
      return res.status(404).json({ error: 'No warranty found for this serial number' });
    }

    const now = new Date();
    const isExpired = warranty.expiryDate < now;

    res.json({
      warrantyId: warranty.id,
      serialNumber: warranty.serialNumber,
      productName: warranty.productName,
      status: isExpired ? 'expired' : warranty.status,
      purchaseDate: warranty.purchaseDate,
      expiryDate: warranty.expiryDate,
      daysRemaining: isExpired ? 0 : Math.ceil((warranty.expiryDate - now) / (1000 * 60 * 60 * 24))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify warranty' });
  }
});

/**
 * Extend warranty
 * POST /api/warranties/:warrantyId/extend
 */
app.post('/api/warranties/:warrantyId/extend', (req, res) => {
  try {
    const { warrantyId } = req.params;
    const { additionalMonths } = req.body;

    if (!additionalMonths) {
      return res.status(400).json({ error: 'additionalMonths is required' });
    }

    const warranty = warranties.get(warrantyId);
    if (!warranty) {
      return res.status(404).json({ error: 'Warranty not found' });
    }

    // Extend expiry date
    const newExpiry = new Date(warranty.expiryDate);
    newExpiry.setMonth(newExpiry.getMonth() + additionalMonths);

    warranty.expiryDate = newExpiry;
    warranty.extendedWarrantyMonths = (warranty.extendedWarrantyMonths || 0) + additionalMonths;
    warranty.warrantyMonths = warranty.warrantyMonths + additionalMonths;
    warranty.status = 'active';
    warranty.updatedAt = new Date();

    warranties.set(warrantyId, warranty);

    res.json({ success: true, warranty });
  } catch (error) {
    res.status(500).json({ error: 'Failed to extend warranty' });
  }
});

/**
 * Transfer warranty
 * POST /api/warranties/:warrantyId/transfer
 */
app.post('/api/warranties/:warrantyId/transfer', (req, res) => {
  try {
    const { warrantyId } = req.params;
    const { newOwnerName, newOwnerEmail, newOwnerPhone } = req.body;

    if (!newOwnerName && !newOwnerEmail) {
      return res.status(400).json({ error: 'newOwnerName or newOwnerEmail is required' });
    }

    const warranty = warranties.get(warrantyId);
    if (!warranty) {
      return res.status(404).json({ error: 'Warranty not found' });
    }

    const previousOwner = {
      name: warranty.customerName,
      email: warranty.customerEmail,
      phone: warranty.customerPhone
    };

    warranty.customerName = newOwnerName || warranty.customerName;
    warranty.customerEmail = newOwnerEmail || warranty.customerEmail;
    warranty.customerPhone = newOwnerPhone || warranty.customerPhone;
    warranty.previousOwner = previousOwner;
    warranty.updatedAt = new Date();

    warranties.set(warrantyId, warranty);

    res.json({ success: true, warranty });
  } catch (error) {
    res.status(500).json({ error: 'Failed to transfer warranty' });
  }
});

/**
 * Cancel warranty
 * DELETE /api/warranties/:warrantyId
 */
app.delete('/api/warranties/:warrantyId', (req, res) => {
  try {
    const { warrantyId } = req.params;
    const warranty = warranties.get(warrantyId);

    if (!warranty) {
      return res.status(404).json({ error: 'Warranty not found' });
    }

    warranty.status = 'cancelled';
    warranty.updatedAt = new Date();
    warranties.set(warrantyId, warranty);

    res.json({ success: true, message: 'Warranty cancelled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel warranty' });
  }
});

// ============================================================================
// Warranty Claims
// ============================================================================

/**
 * File a warranty claim
 * POST /api/claims
 */
app.post('/api/claims', (req, res) => {
  try {
    const { warrantyId, issueDescription, issueCategory, customerName, customerPhone } = req.body;

    if (!warrantyId || !issueDescription) {
      return res.status(400).json({ error: 'Missing required fields: warrantyId, issueDescription' });
    }

    const warranty = warranties.get(warrantyId);
    if (!warranty) {
      return res.status(404).json({ error: 'Warranty not found' });
    }

    // Check if warranty is active
    const now = new Date();
    if (warranty.expiryDate < now) {
      return res.status(400).json({ error: 'Warranty has expired', expiryDate: warranty.expiryDate });
    }

    const claimId = `CLM-${uuidv4().slice(0, 8).toUpperCase()}`;

    const claim = {
      id: claimId,
      warrantyId,
      serialNumber: warranty.serialNumber,
      productName: warranty.productName,
      issueDescription,
      issueCategory: issueCategory || 'general',
      customerName: customerName || warranty.customerName,
      customerPhone: customerPhone || warranty.customerPhone,
      status: 'pending',
      priority: 'normal',
      assignedTo: null,
      resolution: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    claims.set(claimId, claim);

    res.status(201).json({
      success: true,
      claimId,
      claim
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to file claim' });
  }
});

/**
 * Get all claims
 * GET /api/claims
 */
app.get('/api/claims', (req, res) => {
  try {
    const { warrantyId, status, priority } = req.query;
    let result = Array.from(claims.values());

    if (warrantyId) {
      result = result.filter(c => c.warrantyId === warrantyId);
    }
    if (status) {
      result = result.filter(c => c.status === status);
    }
    if (priority) {
      result = result.filter(c => c.priority === priority);
    }

    res.json({ claims: result, total: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

/**
 * Get claim by ID
 * GET /api/claims/:claimId
 */
app.get('/api/claims/:claimId', (req, res) => {
  try {
    const { claimId } = req.params;
    const claim = claims.get(claimId);

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    res.json(claim);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch claim' });
  }
});

/**
 * Update claim status
 * PUT /api/claims/:claimId
 */
app.put('/api/claims/:claimId', (req, res) => {
  try {
    const { claimId } = req.params;
    const { status, priority, assignedTo, resolution } = req.body;

    const claim = claims.get(claimId);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    if (status) claim.status = status;
    if (priority) claim.priority = priority;
    if (assignedTo) claim.assignedTo = assignedTo;
    if (resolution) claim.resolution = resolution;
    claim.updatedAt = new Date();

    claims.set(claimId, claim);

    res.json({ success: true, claim });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update claim' });
  }
});

/**
 * Assign claim to agent
 * POST /api/claims/:claimId/assign
 */
app.post('/api/claims/:claimId/assign', (req, res) => {
  try {
    const { claimId } = req.params;
    const { agentId, agentName } = req.body;

    const claim = claims.get(claimId);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    claim.assignedTo = agentId || 'AGENT001';
    claim.assignedName = agentName || 'Service Agent';
    claim.status = 'in-progress';
    claim.updatedAt = new Date();

    claims.set(claimId, claim);

    res.json({ success: true, claim });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign claim' });
  }
});

/**
 * Resolve claim
 * POST /api/claims/:claimId/resolve
 */
app.post('/api/claims/:claimId/resolve', (req, res) => {
  try {
    const { claimId } = req.params;
    const { resolution, replacementIssued, refundAmount } = req.body;

    const claim = claims.get(claimId);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    claim.status = 'resolved';
    claim.resolution = {
      description: resolution || 'Issue resolved',
      resolvedAt: new Date(),
      replacementIssued: replacementIssued || false,
      refundAmount: refundAmount || null
    };
    claim.updatedAt = new Date();

    claims.set(claimId, claim);

    res.json({ success: true, claim });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve claim' });
  }
});

/**
 * Reject claim
 * POST /api/claims/:claimId/reject
 */
app.post('/api/claims/:claimId/reject', (req, res) => {
  try {
    const { claimId } = req.params;
    const { reason } = req.body;

    const claim = claims.get(claimId);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    claim.status = 'rejected';
    claim.resolution = {
      description: reason || 'Claim rejected - warranty terms not met',
      rejectedAt: new Date()
    };
    claim.updatedAt = new Date();

    claims.set(claimId, claim);

    res.json({ success: true, claim });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject claim' });
  }
});

// ============================================================================
// Product Management
// ============================================================================

/**
 * Register product for warranty tracking
 * POST /api/products
 */
app.post('/api/products', (req, res) => {
  try {
    const { id, name, category, merchantId, baseWarrantyMonths } = req.body;

    if (!id || !name || !category) {
      return res.status(400).json({ error: 'Missing required fields: id, name, category' });
    }

    const product = {
      id,
      name,
      category,
      merchantId: merchantId || null,
      baseWarrantyMonths: baseWarrantyMonths || 12,
      createdAt: new Date()
    };

    products.set(id, product);

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register product' });
  }
});

/**
 * Get all products
 * GET /api/products
 */
app.get('/api/products', (req, res) => {
  try {
    const { category, merchantId } = req.query;
    let result = Array.from(products.values());

    if (category) {
      result = result.filter(p => p.category === category);
    }
    if (merchantId) {
      result = result.filter(p => p.merchantId === merchantId);
    }

    res.json({ products: result, total: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/**
 * Get product by ID
 * GET /api/products/:productId
 */
app.get('/api/products/:productId', (req, res) => {
  try {
    const { productId } = req.params;
    const product = products.get(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// ============================================================================
// Reports & Analytics
// ============================================================================

/**
 * Get warranty statistics
 * GET /api/reports/stats
 */
app.get('/api/reports/stats', (req, res) => {
  try {
    const { merchantId } = req.query;

    let warrantyList = Array.from(warranties.values());
    if (merchantId) {
      warrantyList = warrantyList.filter(w => w.merchantId === merchantId);
    }

    const now = new Date();
    const active = warrantyList.filter(w => w.status === 'active' && w.expiryDate > now).length;
    const expired = warrantyList.filter(w => w.expiryDate < now).length;
    const cancelled = warrantyList.filter(w => w.status === 'cancelled').length;

    let claimList = Array.from(claims.values());
    if (merchantId) {
      const warrantyIds = warrantyList.map(w => w.id);
      claimList = claimList.filter(c => warrantyIds.includes(c.warrantyId));
    }

    const pendingClaims = claimList.filter(c => c.status === 'pending').length;
    const resolvedClaims = claimList.filter(c => c.status === 'resolved').length;
    const rejectedClaims = claimList.filter(c => c.status === 'rejected').length;

    res.json({
      warranties: {
        total: warrantyList.length,
        active,
        expired,
        cancelled
      },
      claims: {
        total: claimList.length,
        pending: pendingClaims,
        resolved: resolvedClaims,
        rejected: rejectedClaims
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * Get claims by warranty
 * GET /api/warranties/:warrantyId/claims
 */
app.get('/api/warranties/:warrantyId/claims', (req, res) => {
  try {
    const { warrantyId } = req.params;
    const warrantyClaims = Array.from(claims.values()).filter(c => c.warrantyId === warrantyId);

    res.json({ claims: warrantyClaims, total: warrantyClaims.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

// ============================================================================
// Start Server
// ============================================================================

const PORT = process.env.PORT || 4620;

const server = app.listen(PORT, () => {
  console.log(`REZ Warranty Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
export { server };
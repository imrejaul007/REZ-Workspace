/**
 * ADBAZAR Brand Registry Service
 * Port: 4973
 *
 * Features:
 * - Brand management
 * - Brand verification
 * - Brand-customer associations
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';

// Types
interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  banner?: string;
  website?: string;
  supportEmail?: string;
  supportPhone?: string;
  socialMedia: Record<string, string>;
  categories: string[];
  tier: 'basic' | 'standard' | 'premium' | 'enterprise';
  verification: {
    status: 'pending' | 'verified' | 'rejected' | 'expired';
    verifiedAt?: Date;
    documents: string[];
  };
  settings: {
    autoResponse: boolean;
    businessHours: string;
    timezone: string;
    primaryColor?: string;
  };
  stats: {
    totalCustomers: number;
    totalTickets: number;
    avgResponseTime: number;
    trustScore: number;
  };
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

interface BrandUser {
  id: string;
  brandId: string;
  userId: string;
  role: 'owner' | 'admin' | 'agent' | 'viewer';
  permissions: string[];
  status: 'active' | 'inactive';
  addedAt: Date;
}

interface BrandProduct {
  id: string;
  brandId: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  images: string[];
  qrCodes: string[];
  verified: boolean;
  createdAt: Date;
}

const app = express();
const PORT = parseInt(process.env.PORT || '4973', 10);

// In-memory stores
const brands = new Map<string, Brand>();
const brandUsers = new Map<string, BrandUser>();
const brandProducts = new Map<string, BrandProduct>();
const qrCodes = new Map<string, { brandId: string; productId?: string; verified: boolean; verifiedAt?: Date }>();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-Id', requestId as string);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'brand-registry',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// BRANDS
// ============================================

/**
 * POST /brands
 * Create brand
 */
app.post('/brands', (req: Request, res: Response) => {
  try {
    const { name, description, website, supportEmail, supportPhone, categories, tier } = req.body;

    if (!name) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name is required' } });
      return;
    }

    const brand: Brand = {
      id: uuidv4(),
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: description || '',
      socialMedia: {},
      categories: categories || [],
      tier: tier || 'basic',
      verification: { status: 'pending', documents: [] },
      settings: {
        autoResponse: false,
        businessHours: '09:00-18:00',
        timezone: 'Asia/Dhaka',
      },
      stats: { totalCustomers: 0, totalTickets: 0, avgResponseTime: 0, trustScore: 100 },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (website) brand.website = website;
    if (supportEmail) brand.supportEmail = supportEmail;
    if (supportPhone) brand.supportPhone = supportPhone;

    brands.set(brand.id, brand);

    res.json({ success: true, data: brand });
  } catch (error) {
    logger.error('Create brand error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create brand' } });
  }
});

/**
 * GET /brands
 * List brands
 */
app.get('/brands', (req: Request, res: Response) => {
  const { status, tier, category, search } = req.query;

  let list = Array.from(brands.values());

  if (status) list = list.filter(b => b.status === status);
  if (tier) list = list.filter(b => b.tier === tier);
  if (category) list = list.filter(b => b.categories.includes(category as string));
  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json({ success: true, data: { brands: list, total: list.length } });
});

/**
 * GET /brands/:id
 * Get brand by ID
 */
app.get('/brands/:id', (req: Request, res: Response) => {
  const brand = brands.get(req.params.id);

  if (!brand) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Brand not found' } });
    return;
  }

  res.json({ success: true, data: brand });
});

/**
 * PATCH /brands/:id
 * Update brand
 */
app.patch('/brands/:id', (req: Request, res: Response) => {
  const brand = brands.get(req.params.id);

  if (!brand) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Brand not found' } });
    return;
  }

  const { name, description, logo, banner, website, supportEmail, supportPhone, socialMedia, categories, settings } = req.body;

  if (name) { brand.name = name; brand.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
  if (description !== undefined) brand.description = description;
  if (logo !== undefined) brand.logo = logo;
  if (banner !== undefined) brand.banner = banner;
  if (website !== undefined) brand.website = website;
  if (supportEmail !== undefined) brand.supportEmail = supportEmail;
  if (supportPhone !== undefined) brand.supportPhone = supportPhone;
  if (socialMedia) brand.socialMedia = { ...brand.socialMedia, ...socialMedia };
  if (categories) brand.categories = categories;
  if (settings) brand.settings = { ...brand.settings, ...settings };
  brand.updatedAt = new Date();

  res.json({ success: true, data: brand });
});

/**
 * DELETE /brands/:id
 * Delete brand
 */
app.delete('/brands/:id', (req: Request, res: Response) => {
  const deleted = brands.delete(req.params.id);
  res.json({ success: deleted, data: { deleted } });
});

// ============================================
// VERIFICATION
// ============================================

/**
 * POST /brands/:id/verify
 * Submit brand for verification
 */
app.post('/brands/:id/verify', (req: Request, res: Response) => {
  const brand = brands.get(req.params.id);

  if (!brand) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Brand not found' } });
    return;
  }

  const { documents } = req.body;

  brand.verification.status = 'pending';
  brand.verification.documents = documents || [];
  brand.updatedAt = new Date();

  res.json({ success: true, data: brand });
});

/**
 * POST /brands/:id/verification/approve
 * Approve brand verification
 */
app.post('/brands/:id/verification/approve', (req: Request, res: Response) => {
  const brand = brands.get(req.params.id);

  if (!brand) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Brand not found' } });
    return;
  }

  brand.verification.status = 'verified';
  brand.verification.verifiedAt = new Date();
  brand.updatedAt = new Date();

  res.json({ success: true, data: brand });
});

/**
 * POST /brands/:id/verification/reject
 * Reject brand verification
 */
app.post('/brands/:id/verification/reject', (req: Request, res: Response) => {
  const brand = brands.get(req.params.id);

  if (!brand) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Brand not found' } });
    return;
  }

  const { reason } = req.body;

  brand.verification.status = 'rejected';
  brand.updatedAt = new Date();

  res.json({ success: true, data: brand });
});

/**
 * GET /brands/:id/verification/status
 * Get verification status
 */
app.get('/brands/:id/verification/status', (req: Request, res: Response) => {
  const brand = brands.get(req.params.id);

  if (!brand) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Brand not found' } });
    return;
  }

  res.json({
    success: true,
    data: {
      status: brand.verification.status,
      verifiedAt: brand.verification.verifiedAt,
      documentsCount: brand.verification.documents.length,
    },
  });
});

// ============================================
// BRAND USERS
// ============================================

/**
 * POST /brands/:id/users
 * Add user to brand
 */
app.post('/brands/:id/users', (req: Request, res: Response) => {
  const brand = brands.get(req.params.id);

  if (!brand) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Brand not found' } });
    return;
  }

  const { userId, role, permissions } = req.body;

  if (!userId || !role) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'userId and role are required' } });
    return;
  }

  const brandUser: BrandUser = {
    id: uuidv4(),
    brandId: brand.id,
    userId,
    role,
    permissions: permissions || [],
    status: 'active',
    addedAt: new Date(),
  };

  brandUsers.set(brandUser.id, brandUser);

  // Update brand stats
  brand.stats.totalCustomers++;
  brand.updatedAt = new Date();

  res.json({ success: true, data: brandUser });
});

/**
 * GET /brands/:id/users
 * List brand users
 */
app.get('/brands/:id/users', (req: Request, res: Response) => {
  const { role, status } = req.query;

  let list = Array.from(brandUsers.values()).filter(u => u.brandId === req.params.id);

  if (role) list = list.filter(u => u.role === role);
  if (status) list = list.filter(u => u.status === status);

  res.json({ success: true, data: { users: list, total: list.length } });
});

/**
 * PATCH /brands/:id/users/:userId
 * Update brand user
 */
app.patch('/brands/:id/users/:userId', (req: Request, res: Response) => {
  const brandUser = Array.from(brandUsers.values()).find(
    u => u.brandId === req.params.id && u.userId === req.params.userId
  );

  if (!brandUser) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Brand user not found' } });
    return;
  }

  const { role, permissions, status } = req.body;

  if (role) brandUser.role = role;
  if (permissions) brandUser.permissions = permissions;
  if (status) brandUser.status = status;

  res.json({ success: true, data: brandUser });
});

/**
 * DELETE /brands/:id/users/:userId
 * Remove user from brand
 */
app.delete('/brands/:id/users/:userId', (req: Request, res: Response) => {
  const brandUser = Array.from(brandUsers.values()).find(
    u => u.brandId === req.params.id && u.userId === req.params.userId
  );

  if (brandUser) {
    brandUsers.delete(brandUser.id);
  }

  res.json({ success: true, data: { removed: true } });
});

// ============================================
// BRAND PRODUCTS
// ============================================

/**
 * POST /brands/:id/products
 * Add product to brand
 */
app.post('/brands/:id/products', (req: Request, res: Response) => {
  const brand = brands.get(req.params.id);

  if (!brand) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Brand not found' } });
    return;
  }

  const { name, sku, description, category, images } = req.body;

  if (!name) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name is required' } });
    return;
  }

  const product: BrandProduct = {
    id: uuidv4(),
    brandId: brand.id,
    name,
    sku: sku || `SKU-${Date.now().toString(36).toUpperCase()}`,
    description: description || '',
    category: category || 'general',
    images: images || [],
    qrCodes: [],
    verified: false,
    createdAt: new Date(),
  };

  brandProducts.set(product.id, product);

  res.json({ success: true, data: product });
});

/**
 * GET /brands/:id/products
 * List brand products
 */
app.get('/brands/:id/products', (req: Request, res: Response) => {
  const list = Array.from(brandProducts.values()).filter(p => p.brandId === req.params.id);

  res.json({ success: true, data: { products: list, total: list.length } });
});

/**
 * GET /brands/:id/products/:productId
 * Get product
 */
app.get('/brands/:id/products/:productId', (req: Request, res: Response) => {
  const product = brandProducts.get(req.params.productId);

  if (!product || product.brandId !== req.params.id) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
    return;
  }

  res.json({ success: true, data: product });
});

// ============================================
// QR CODES
// ============================================

/**
 * POST /qr/generate
 * Generate QR code for product
 */
app.post('/qr/generate', (req: Request, res: Response) => {
  const { brandId, productId } = req.body;

  if (!brandId) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'brandId is required' } });
    return;
  }

  const brand = brands.get(brandId);
  if (!brand) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Brand not found' } });
    return;
  }

  const qrCode = `QR-${brand.slug.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  qrCodes.set(qrCode, {
    brandId,
    productId,
    verified: false,
  });

  // Add to product if productId provided
  if (productId) {
    const product = brandProducts.get(productId);
    if (product && product.brandId === brandId) {
      product.qrCodes.push(qrCode);
    }
  }

  res.json({
    success: true,
    data: {
      qrCode,
      brandId,
      productId,
      url: `https://adbazar.com/verify/${qrCode}`,
    },
  });
});

/**
 * POST /qr/verify
 * Verify QR code
 */
app.post('/qr/verify', (req: Request, res: Response) => {
  const { qrCode } = req.body;

  if (!qrCode) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'qrCode is required' } });
    return;
  }

  const record = qrCodes.get(qrCode);

  if (!record) {
    res.json({
      success: true,
      data: {
        valid: false,
        message: 'QR code not found',
      },
    });
    return;
  }

  // Mark as verified
  record.verified = true;
  record.verifiedAt = new Date();

  const brand = brands.get(record.brandId);

  res.json({
    success: true,
    data: {
      valid: true,
      verified: true,
      verifiedAt: record.verifiedAt,
      brand: brand ? { id: brand.id, name: brand.name, tier: brand.tier } : null,
      productId: record.productId,
      trustScore: brand?.stats.trustScore || 0,
    },
  });
});

/**
 * GET /qr/:code
 * Get QR code details
 */
app.get('/qr/:code', (req: Request, res: Response) => {
  const record = qrCodes.get(req.params.code);

  if (!record) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'QR code not found' } });
    return;
  }

  const brand = brands.get(record.brandId);

  res.json({
    success: true,
    data: {
      qrCode: req.params.code,
      brandId: record.brandId,
      brandName: brand?.name,
      productId: record.productId,
      verified: record.verified,
      verifiedAt: record.verifiedAt,
    },
  });
});

// ============================================
// STATISTICS
// ============================================

/**
 * GET /stats
 * Get brand registry statistics
 */
app.get('/stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      brands: {
        total: brands.size,
        active: Array.from(brands.values()).filter(b => b.status === 'active').length,
        verified: Array.from(brands.values()).filter(b => b.verification.status === 'verified').length,
      },
      users: {
        total: brandUsers.size,
      },
      products: {
        total: brandProducts.size,
      },
      qrCodes: {
        total: qrCodes.size,
        verified: Array.from(qrCodes.values()).filter(q => q.verified).length,
      },
    },
  });
});

/**
 * GET /brands/:id/stats
 * Get brand statistics
 */
app.get('/brands/:id/stats', (req: Request, res: Response) => {
  const brand = brands.get(req.params.id);

  if (!brand) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Brand not found' } });
    return;
  }

  const users = Array.from(brandUsers.values()).filter(u => u.brandId === brand.id);
  const products = Array.from(brandProducts.values()).filter(p => p.brandId === brand.id);

  res.json({
    success: true,
    data: {
      ...brand.stats,
      users: users.length,
      products: products.length,
      tiers: Array.from(brands.values()).filter(b => b.tier === brand.tier).length,
    },
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', { error: err instanceof Error ? err.message : String(err) });
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  });
});

// Startup
app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════════╗
║                     ADBAZAR Brand Registry Service              ║
╠══════════════════════════════════════════════════════════════════╣
║  Status:      RUNNING                                          ║
║  Port:        ${PORT}                                                  ║
║  Version:     1.0.0                                           ║
╠══════════════════════════════════════════════════════════════════╣
║  Endpoints:                                                 ║
║  POST /brands              - Create brand                    ║
║  GET  /brands              - List brands                     ║
║  GET  /brands/:id          - Get brand                       ║
║  POST /brands/:id/verify   - Verify brand                    ║
║  POST /brands/:id/users    - Add user to brand               ║
║  POST /qr/generate         - Generate QR code                ║
║  POST /qr/verify           - Verify QR code                  ║
║  GET  /stats              - Statistics                       ║
╚══════════════════════════════════════════════════════════════════╝
  `);
});

export default app;
/**
 * Vendor Portal Routes
 */

import { Router, Request, Response } from 'express';
import { merchantAuth } from '../middleware/auth';
import {
  generateVendorAccess,
  validateVendorAccess,
  revokeVendorAccess,
  getVendorDashboard,
  getVendorOrders,
  getVendorOrderDetails,
  getVendorPayments,
  getVendorDocuments,
} from '../services/vendorPortalService';
import { errorResponse, errors } from '../utils/response';
import { vendorAccessTokenSchema, vendorQuerySchema, validateBody } from '../utils/validation';

const router = Router();

// ── Public Routes (Vendor Access) ─────────────────────────────────────────────

/**
 * POST /vendor-portal/login
 * Vendor login with access token
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validation = validateBody(vendorAccessTokenSchema)(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    const { accessToken } = validation.data;
    const access = await validateVendorAccess(accessToken);

    if (!access) {
      errorResponse(res, errors.unauthorized('Invalid or expired access token'));
      return;
    }

    res.json({
      success: true,
      data: {
        supplierId: access.supplierId,
        supplierName: access.supplierName,
        email: access.email,
        phone: access.phone,
        lastLoginAt: access.lastLoginAt,
      },
    });
  } catch (err) {
    errorResponse(res, errors.internalError('Login failed'));
  }
});

/**
 * POST /vendor-portal/validate
 * Validate access token (for middleware)
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;

    const access = await validateVendorAccess(accessToken);

    if (!access) {
      res.status(401).json({ valid: false });
      return;
    }

    res.json({
      valid: true,
      data: {
        supplierId: access.supplierId,
        merchantId: access.merchantId,
        supplierName: access.supplierName,
      },
    });
  } catch (err) {
    res.status(500).json({ valid: false });
  }
});

// ── Merchant Routes ─────────────────────────────────────────────────────────────

/**
 * POST /vendor-portal/access
 * Generate vendor portal access (merchant action)
 */
router.post('/access', merchantAuth, async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.body;

    if (!supplierId) {
      errorResponse(res, errors.badRequest('Supplier ID required'));
      return;
    }

    const result = await generateVendorAccess(supplierId, req.merchantId);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Vendor access generated. Share credentials with supplier.',
    });
  } catch (err) {
    errorResponse(res, errors.internalError('Failed to generate access'));
  }
});

/**
 * DELETE /vendor-portal/access/:token
 * Revoke vendor portal access
 */
router.delete('/access/:token', merchantAuth, async (req: Request, res: Response) => {
  try {
    const result = await revokeVendorAccess(req.params.token);

    if (!result) {
      errorResponse(res, errors.notFound('Access not found'));
      return;
    }

    res.json({ success: true, message: 'Access revoked' });
  } catch (err) {
    errorResponse(res, errors.internalError('Failed to revoke access'));
  }
});

// ── Vendor Dashboard ────────────────────────────────────────────────────────────

// Middleware to extract vendor access token
const vendorAccessMiddleware = async (req: Request, res: Response, next: Function) => {
  const vendorToken = req.headers['x-vendor-token'] as string || req.body?.vendorToken as string;

  if (!vendorToken) {
    return errorResponse(res, errors.unauthorized('Vendor access token required'));
  }

  try {
    const access = await validateVendorAccess(vendorToken);
    if (!access) {
      return errorResponse(res, errors.unauthorized('Invalid or expired vendor token'));
    }

    // Attach vendor info to request
    (req as unknown).vendorAccess = access;
    next();
  } catch (err) {
    return errorResponse(res, errors.internalError('Vendor authentication failed'));
  }
};

/**
 * GET /vendor-portal/dashboard
 * Get vendor dashboard data
 */
router.get('/dashboard', vendorAccessMiddleware, async (req: Request, res: Response) => {
  try {
    const vendorAccess = (req as unknown).vendorAccess;

    const dashboard = await getVendorDashboard(vendorAccess.supplierId, vendorAccess.merchantId);

    res.json({ success: true, data: dashboard });
  } catch (err) {
    errorResponse(res, errors.internalError('Failed to get dashboard'));
  }
});

/**
 * GET /vendor-portal/orders
 * Get vendor's orders
 */
router.get('/orders', vendorAccessMiddleware, async (req: Request, res: Response) => {
  try {
    const vendorAccess = (req as unknown).vendorAccess;
    const { status, fromDate, toDate, page, limit } = req.query;

    const result = await getVendorOrders(vendorAccess.supplierId, vendorAccess.merchantId, {
      status: status as string,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    errorResponse(res, errors.internalError('Failed to get orders'));
  }
});

/**
 * GET /vendor-portal/orders/:id
 * Get order details
 */
router.get('/orders/:id', vendorAccessMiddleware, async (req: Request, res: Response) => {
  try {
    const vendorAccess = (req as unknown).vendorAccess;

    const order = await getVendorOrderDetails(vendorAccess.supplierId, vendorAccess.merchantId, req.params.id);

    if (!order) {
      errorResponse(res, errors.notFound('Order'));
      return;
    }

    res.json({ success: true, data: order });
  } catch (err) {
    errorResponse(res, errors.internalError('Failed to get order'));
  }
});

/**
 * GET /vendor-portal/payments
 * Get vendor's payment history
 */
router.get('/payments', vendorAccessMiddleware, async (req: Request, res: Response) => {
  try {
    const vendorAccess = (req as unknown).vendorAccess;
    const { status, fromDate, toDate, page, limit } = req.query;

    const result = await getVendorPayments(vendorAccess.supplierId, vendorAccess.merchantId, {
      status: status as string,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    errorResponse(res, errors.internalError('Failed to get payments'));
  }
});

/**
 * GET /vendor-portal/documents
 * Get available documents
 */
router.get('/documents', vendorAccessMiddleware, async (req: Request, res: Response) => {
  try {
    const vendorAccess = (req as unknown).vendorAccess;

    const documents = await getVendorDocuments(vendorAccess.supplierId, vendorAccess.merchantId);

    res.json({ success: true, data: documents });
  } catch (err) {
    errorResponse(res, errors.internalError('Failed to get documents'));
  }
});

export default router;

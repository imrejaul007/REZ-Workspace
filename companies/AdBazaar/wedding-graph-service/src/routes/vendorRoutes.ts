import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { vendorService, CreateVendorDto, UpdateVendorDto } from '../services/vendorService';
import { recordVendorCreated, recordVendorBooked } from '../utils/metrics';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createVendorSchema = z.object({
  category: z.enum([
    'venue', 'catering', 'photography', 'videography', 'florist', 'decorator',
    'dj', 'band', 'makeup_artist', 'mehndi_artist', 'wedding_planner', 'priest',
    'transportation', 'cake', 'invitation', 'gift', 'accommodation', 'other'
  ]),
  name: z.string().min(1).max(200),
  businessName: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1),
  website: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  service: z.string().min(1),
  description: z.string().optional(),
  price: z.object({
    amount: z.number().min(0),
    currency: z.string().optional(),
    breakdown: z.object({
      basePrice: z.number().optional(),
      tax: z.number().optional(),
      tip: z.number().optional(),
      extra: z.number().optional()
    }).optional()
  }).optional(),
  hashtags: z.array(z.string()).optional(),
  referralSource: z.string().optional()
});

const bulkVendorSchema = z.object({
  vendors: z.array(createVendorSchema).min(1).max(100)
});

const updateVendorSchema = z.object({
  category: z.enum([
    'venue', 'catering', 'photography', 'videography', 'florist', 'decorator',
    'dj', 'band', 'makeup_artist', 'mehndi_artist', 'wedding_planner', 'priest',
    'transportation', 'cake', 'invitation', 'gift', 'accommodation', 'other'
  ]).optional(),
  name: z.string().min(1).max(200).optional(),
  businessName: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  service: z.string().optional(),
  description: z.string().optional(),
  booked: z.boolean().optional(),
  bookingDate: z.string().datetime().or(z.date()).optional(),
  price: z.object({
    amount: z.number().min(0).optional(),
    currency: z.string().optional(),
    breakdown: z.object({
      basePrice: z.number().optional(),
      tax: z.number().optional(),
      tip: z.number().optional(),
      extra: z.number().optional()
    }).optional()
  }).optional(),
  status: z.enum(['inquiry', 'quoted', 'negotiating', 'booked', 'paid', 'confirmed', 'completed', 'cancelled']).optional(),
  contractSigned: z.boolean().optional(),
  contractUrl: z.string().optional(),
  paymentStatus: z.enum(['pending', 'partial', 'paid', 'refunded']).optional(),
  paymentAmount: z.number().optional(),
  paymentDueDate: z.string().datetime().or(z.date()).optional(),
  notes: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  hashtags: z.array(z.string()).optional()
});

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional()
});

const paymentSchema = z.object({
  amount: z.number().min(0),
  paymentStatus: z.enum(['pending', 'partial', 'paid', 'refunded'])
});

/**
 * POST /api/weddings/:weddingId/vendors - Add vendor(s) to wedding
 */
router.post('/:weddingId/vendors', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const weddingId = req.params.weddingId;

    // Check if bulk or single vendor
    if (Array.isArray(req.body.vendors)) {
      // Bulk vendor creation
      const validationResult = bulkVendorSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid bulk vendor data',
          details: validationResult.error.errors
        });
        return;
      }

      const result = await vendorService.createBulkVendors({
        weddingId,
        vendors: validationResult.data.vendors
      });

      result.vendors.forEach((v) => recordVendorCreated(v.category));

      logger.info('Bulk vendors created via API', {
        weddingId,
        created: result.created,
        failed: result.failed
      });

      res.status(201).json({
        success: true,
        data: result.vendors,
        summary: {
          created: result.created,
          failed: result.failed
        }
      });
    } else {
      // Single vendor creation
      const validationResult = createVendorSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid vendor data',
          details: validationResult.error.errors
        });
        return;
      }

      const data: CreateVendorDto = {
        weddingId,
        ...validationResult.data
      };

      const vendor = await vendorService.createVendor(data);

      recordVendorCreated(vendor.category);

      logger.info('Vendor created via API', {
        vendorId: vendor.vendorId,
        weddingId,
        category: vendor.category
      });

      res.status(201).json({
        success: true,
        data: vendor
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/weddings/:weddingId/vendors - List vendors for a wedding
 */
router.get('/:weddingId/vendors', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const weddingId = req.params.weddingId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const filters = {
      weddingId,
      category: req.query.category as any,
      status: req.query.status as any,
      booked: req.query.booked === 'true' ? true : req.query.booked === 'false' ? false : undefined
    };

    const result = await vendorService.listVendors(filters, page, limit);

    res.json({
      success: true,
      data: result.vendors,
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/weddings/:weddingId/vendors/stats - Get vendor statistics
 */
router.get('/:weddingId/vendors/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await vendorService.getVendorStats(req.params.weddingId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/weddings/:weddingId/vendors/by-category - Get vendors grouped by category
 */
router.get('/:weddingId/vendors/by-category', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const grouped = await vendorService.getVendorsByCategory(req.params.weddingId);

    res.json({
      success: true,
      data: grouped
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/weddings/:weddingId/vendors/payments - Get upcoming vendor payments
 */
router.get('/:weddingId/vendors/payments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payments = await vendorService.getUpcomingPayments(req.params.weddingId);

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/weddings/:weddingId/vendors/:vendorId - Get specific vendor
 */
router.get('/:weddingId/vendors/:vendorId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await vendorService.getVendorById(req.params.vendorId);

    if (!vendor) {
      res.status(404).json({
        error: 'Not Found',
        message: `Vendor ${req.params.vendorId} not found`
      });
      return;
    }

    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/weddings/:weddingId/vendors/:vendorId - Update vendor
 */
router.put('/:weddingId/vendors/:vendorId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = updateVendorSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid vendor update data',
        details: validationResult.error.errors
      });
      return;
    }

    const vendor = await vendorService.updateVendor(req.params.vendorId, validationResult.data);

    if (!vendor) {
      res.status(404).json({
        error: 'Not Found',
        message: `Vendor ${req.params.vendorId} not found`
      });
      return;
    }

    logger.info('Vendor updated via API', {
      vendorId: vendor.vendorId,
      updatedFields: Object.keys(validationResult.data)
    });

    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/weddings/:weddingId/vendors/:vendorId/book - Book a vendor
 */
router.post('/:weddingId/vendors/:vendorId/book', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookingDate = req.body.bookingDate ? new Date(req.body.bookingDate) : undefined;

    const vendor = await vendorService.bookVendor(req.params.vendorId, bookingDate);

    if (!vendor) {
      res.status(404).json({
        error: 'Not Found',
        message: `Vendor ${req.params.vendorId} not found`
      });
      return;
    }

    recordVendorBooked(vendor.category, vendor.price.amount);

    logger.info('Vendor booked via API', {
      vendorId: vendor.vendorId,
      bookingDate: vendor.bookingDate
    });

    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/weddings/:weddingId/vendors/:vendorId/payment - Record payment
 */
router.post('/:weddingId/vendors/:vendorId/payment', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = paymentSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid payment data',
        details: validationResult.error.errors
      });
      return;
    }

    const vendor = await vendorService.recordPayment(
      req.params.vendorId,
      validationResult.data.amount,
      validationResult.data.paymentStatus
    );

    if (!vendor) {
      res.status(404).json({
        error: 'Not Found',
        message: `Vendor ${req.params.vendorId} not found`
      });
      return;
    }

    logger.info('Vendor payment recorded via API', {
      vendorId: vendor.vendorId,
      amount: validationResult.data.amount,
      status: validationResult.data.paymentStatus
    });

    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/weddings/:weddingId/vendors/:vendorId/review - Add review
 */
router.post('/:weddingId/vendors/:vendorId/review', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = reviewSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid review data',
        details: validationResult.error.errors
      });
      return;
    }

    const vendor = await vendorService.addVendorReview(
      req.params.vendorId,
      validationResult.data.rating,
      validationResult.data.comment
    );

    if (!vendor) {
      res.status(404).json({
        error: 'Not Found',
        message: `Vendor ${req.params.vendorId} not found`
      });
      return;
    }

    logger.info('Vendor review added via API', {
      vendorId: vendor.vendorId,
      rating: validationResult.data.rating
    });

    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/weddings/:weddingId/vendors/:vendorId - Remove vendor
 */
router.delete('/:weddingId/vendors/:vendorId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const success = await vendorService.deleteVendor(req.params.vendorId);

    if (!success) {
      res.status(404).json({
        error: 'Not Found',
        message: `Vendor ${req.params.vendorId} not found`
      });
      return;
    }

    logger.info('Vendor deleted via API', {
      vendorId: req.params.vendorId,
      weddingId: req.params.weddingId
    });

    res.json({
      success: true,
      message: 'Vendor removed successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
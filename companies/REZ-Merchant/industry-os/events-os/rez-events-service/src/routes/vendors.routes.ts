import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Vendor, VendorCategory, VendorStatus, PriceRange } from '../models';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const createVendorSchema = z.object({
  merchantId: z.string().min(1),
  name: z.string().min(1),
  category: z.nativeEnum(VendorCategory),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  priceRange: z.nativeEnum(PriceRange).optional(),
  notes: z.string().optional()
});

const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.nativeEnum(VendorCategory).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  priceRange: z.nativeEnum(PriceRange).optional(),
  status: z.nativeEnum(VendorStatus).optional(),
  notes: z.string().optional()
});

const searchQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  merchantId: z.string().optional(),
  priceRange: z.string().optional(),
  minRating: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional()
});

const assignToEventSchema = z.object({
  eventId: z.string().min(1),
  status: z.nativeEnum(VendorStatus).optional()
});

/**
 * POST /api/vendors - Create a new vendor
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createVendorSchema.parse(req.body);

    const vendor = new Vendor({
      ...validatedData,
      vendorId: `VND-${uuidv4().substring(0, 8).toUpperCase()}`,
      rating: validatedData.rating || 0,
      priceRange: validatedData.priceRange || PriceRange.MEDIUM,
      status: VendorStatus.AVAILABLE
    });

    await vendor.save();

    res.status(201).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/vendors - List/search vendors
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = searchQuerySchema.parse(req.query);

    const filter: Record<string, unknown> = {};

    if (query.q) {
      filter.$text = { $search: query.q };
    }
    if (query.category) {
      filter.category = query.category;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.merchantId) {
      filter.merchantId = query.merchantId;
    }
    if (query.priceRange) {
      filter.priceRange = query.priceRange;
    }
    if (query.minRating) {
      filter.rating = { $gte: parseFloat(query.minRating) };
    }

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 20;
    const skip = (page - 1) * limit;

    const [vendors, total] = await Promise.all([
      Vendor.find(filter)
        .sort({ rating: -1, name: 1 })
        .skip(skip)
        .limit(limit),
      Vendor.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        vendors,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/vendors/:id - Get vendor by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const vendor = await Vendor.findOne({ vendorId: req.params.id });

    if (!vendor) {
      res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
      return;
    }

    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * PUT /api/vendors/:id - Update vendor
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validatedData = updateVendorSchema.parse(req.body);

    const vendor = await Vendor.findOneAndUpdate(
      { vendorId: req.params.id },
      { $set: validatedData },
      { new: true }
    );

    if (!vendor) {
      res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
      return;
    }

    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * DELETE /api/vendors/:id - Delete vendor
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const vendor = await Vendor.findOneAndDelete({ vendorId: req.params.id });

    if (!vendor) {
      res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/vendors/:id/assign - Assign vendor to event
 */
router.post('/:id/assign', async (req: Request, res: Response) => {
  try {
    const validatedData = assignToEventSchema.parse(req.body);

    const vendor = await Vendor.findOneAndUpdate(
      { vendorId: req.params.id },
      {
        $set: {
          eventId: validatedData.eventId,
          status: validatedData.status || VendorStatus.BOOKED
        }
      },
      { new: true }
    );

    if (!vendor) {
      res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
      return;
    }

    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/vendors/event/:eventId - Get vendors for event
 */
router.get('/event/:eventId', async (req: Request, res: Response) => {
  try {
    const vendors = await Vendor.find({ eventId: req.params.eventId })
      .sort({ category: 1, name: 1 });

    // Group by category
    const groupedVendors: Record<string, typeof vendors> = {};
    for (const vendor of vendors) {
      if (!groupedVendors[vendor.category]) {
        groupedVendors[vendor.category] = [];
      }
      groupedVendors[vendor.category].push(vendor);
    }

    res.json({
      success: true,
      data: {
        vendors,
        groupedByCategory: groupedVendors,
        total: vendors.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/vendors/:id/release - Release vendor from event
 */
router.post('/:id/release', async (req: Request, res: Response) => {
  try {
    const vendor = await Vendor.findOneAndUpdate(
      { vendorId: req.params.id },
      {
        $set: {
          eventId: undefined,
          status: VendorStatus.AVAILABLE
        }
      },
      { new: true }
    );

    if (!vendor) {
      res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
      return;
    }

    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/vendors/meta/categories - Get all vendor categories
 */
router.get('/meta/categories', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.values(VendorCategory)
  });
});

export default router;
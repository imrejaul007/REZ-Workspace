import { Router, Request, Response } from 'express';
import { Merchant, RevenueRecord, ProductPerformance, Customer, Competitor } from '../models/index.js';
import {
  validateCreateMerchant,
  validateMerchantId,
  asyncHandler,
} from '../middleware/index.js';
import logger from '../config/logger.js';

const router = Router();

/**
 * POST /api/merchants
 * Create a new merchant
 */
router.post(
  '/',
  validateCreateMerchant,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { merchantId, name, category, subcategory, location } = req.body;

    logger.info('Creating merchant', { merchantId, name });

    // Check if merchant already exists
    const existing = await Merchant.findOne({ merchantId });
    if (existing) {
      res.status(409).json({
        success: false,
        error: {
          code: 'MERCHANT_EXISTS',
          message: 'Merchant with this ID already exists',
        },
      });
      return;
    }

    const merchant = new Merchant({
      merchantId,
      name,
      category,
      subcategory,
      location,
    });

    await merchant.save();

    const duration = Date.now() - startTime;

    res.status(201).json({
      success: true,
      data: merchant,
      meta: {
        timestamp: new Date().toISOString(),
        duration,
      },
    });
  })
);

/**
 * GET /api/merchants/:merchantId
 * Get merchant details
 */
router.get(
  '/:merchantId',
  validateMerchantId,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { merchantId } = req.params;

    logger.info('Getting merchant', { merchantId });

    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant) {
      res.status(404).json({
        success: false,
        error: {
          code: 'MERCHANT_NOT_FOUND',
          message: `Merchant not found: ${merchantId}`,
        },
      });
      return;
    }

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: merchant,
      meta: {
        timestamp: new Date().toISOString(),
        duration,
      },
    });
  })
);

/**
 * PUT /api/merchants/:merchantId
 * Update merchant details
 */
router.put(
  '/:merchantId',
  validateMerchantId,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { merchantId } = req.params;
    const updates = req.body;

    logger.info('Updating merchant', { merchantId });

    const merchant = await Merchant.findOneAndUpdate(
      { merchantId },
      { $set: updates },
      { new: true }
    );

    if (!merchant) {
      res.status(404).json({
        success: false,
        error: {
          code: 'MERCHANT_NOT_FOUND',
          message: `Merchant not found: ${merchantId}`,
        },
      });
      return;
    }

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: merchant,
      meta: {
        timestamp: new Date().toISOString(),
        duration,
      },
    });
  })
);

/**
 * DELETE /api/merchants/:merchantId
 * Delete a merchant and all related data
 */
router.delete(
  '/:merchantId',
  validateMerchantId,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { merchantId } = req.params;

    logger.info('Deleting merchant', { merchantId });

    // Delete all related data
    await Promise.all([
      Merchant.deleteOne({ merchantId }),
      RevenueRecord.deleteMany({ merchantId }),
      ProductPerformance.deleteMany({ merchantId }),
      Customer.deleteMany({ merchantId }),
      Competitor.deleteMany({ merchantId }),
    ]);

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: { deleted: true, merchantId },
      meta: {
        timestamp: new Date().toISOString(),
        duration,
      },
    });
  })
);

/**
 * GET /api/merchants
 * List all merchants (with pagination)
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    logger.info('Listing merchants', { page, limit });

    const [merchants, total] = await Promise.all([
      Merchant.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      Merchant.countDocuments(),
    ]);

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        merchants,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        duration,
      },
    });
  })
);

export default router;
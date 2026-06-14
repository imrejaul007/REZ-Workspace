/**
 * Brand Routes
 */

import { Router, Request, Response } from 'express';
import { brandService } from '../services';
import { verifyAuth, AuthenticatedRequest, asyncHandler, AppError } from '../middleware';
import { validateBody } from '../middleware';
import { brandRegisterSchema, brandUpdateSchema } from '../utils/validation';
import logger from 'utils/logger.js';

const router = Router();

/**
 * POST /api/brands/register
 * Register a new brand
 */
router.post('/register',
  verifyAuth,
  validateBody(brandRegisterSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const existingBrand = await brandService.getBrandByUserId(req.userId!);
    if (existingBrand) {
      throw new AppError('Brand already registered for this user', 400);
    }

    const brand = await brandService.createBrand(req.body);
    res.status(201).json({
      success: true,
      data: brand
    });
  })
);

/**
 * GET /api/brands/:id
 * Get brand by ID
 */
router.get('/:id',
  verifyAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const brand = await brandService.getBrandById(req.params.id);
    if (!brand) {
      throw new AppError('Brand not found', 404);
    }
    res.json({
      success: true,
      data: brand
    });
  })
);

/**
 * GET /api/brands/user/:userId
 * Get brand by user ID
 */
router.get('/user/:userId',
  verifyAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const brand = await brandService.getBrandByUserId(req.params.userId);
    if (!brand) {
      throw new AppError('Brand not found', 404);
    }
    res.json({
      success: true,
      data: brand
    });
  })
);

/**
 * PATCH /api/brands/:id
 * Update brand
 */
router.patch('/:id',
  verifyAuth,
  validateBody(brandUpdateSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const brand = await brandService.getBrandById(req.params.id);
    if (!brand) {
      throw new AppError('Brand not found', 404);
    }

    // Check ownership
    if (brand.userId !== req.userId && !req.isInternal) {
      throw new AppError('Access denied', 403);
    }

    const updatedBrand = await brandService.updateBrand(req.params.id, req.body);
    res.json({
      success: true,
      data: updatedBrand
    });
  })
);

/**
 * POST /api/brands/:id/verify
 * Verify brand (admin only)
 */
router.post('/:id/verify',
  verifyAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // In production, this would be admin-only
    const brand = await brandService.getBrandById(req.params.id);
    if (!brand) {
      throw new AppError('Brand not found', 404);
    }

    const verifiedBrand = await brandService.verifyBrand(req.params.id);
    res.json({
      success: true,
      data: verifiedBrand,
      message: 'Brand verified successfully'
    });
  })
);

/**
 * GET /api/brands
 * List brands
 */
router.get('/',
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, industry, tier, verified } = req.query as any;
    const result = await brandService.listBrands({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      industry,
      tier,
      verified: verified !== undefined ? verified === 'true' : undefined
    });

    res.json({
      success: true,
      data: result.brands,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages
      }
    });
  })
);

export default router;
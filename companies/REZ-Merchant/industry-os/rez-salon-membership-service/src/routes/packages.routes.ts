import { Router, Request, Response, NextFunction } from 'express';
import { packageService } from '../services/PackageService';
import { createPackageSchema, updatePackageSchema, packageQuerySchema } from '../schemas/package.schemas';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { verifyInternalToken } from '../config/env';

const router = Router();

// Internal auth middleware
const internalAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-internal-token'] as string;
  if (!token || !verifyInternalToken(token)) {
    return next(new AppError('Unauthorized', 401));
  }
  next();
};

/**
 * @route POST /api/v1/packages
 * @desc Create a new package
 */
router.post('/', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createPackageSchema.parse(req.body);
    const pkg = await packageService.createPackage(validated);

    res.status(201).json({
      success: true,
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/packages
 * @desc List packages with filtering
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = packageQuerySchema.parse(req.query);
    const result = await packageService.listPackages(query);

    res.json({
      success: true,
      data: result.packages,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/packages/hair
 * @desc Get hair packages
 */
router.get('/hair', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const packages = await packageService.getHairPackages();

    res.json({
      success: true,
      data: packages,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/packages/prepaid
 * @desc Get prepaid cards
 */
router.get('/prepaid', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const packages = await packageService.getPrepaidCards();

    res.json({
      success: true,
      data: packages,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/packages/family
 * @desc Get family plans
 */
router.get('/family', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const packages = await packageService.getFamilyPlans();

    res.json({
      success: true,
      data: packages,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/packages/corporate
 * @desc Get corporate eligible packages
 */
router.get('/corporate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const packages = await packageService.getCorporatePackages();

    res.json({
      success: true,
      data: packages,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/packages/:packageId
 * @desc Get package by ID
 */
router.get('/:packageId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pkg = await packageService.getPackageById(req.params.packageId);

    res.json({
      success: true,
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/v1/packages/:packageId
 * @desc Update package
 */
router.put('/:packageId', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = updatePackageSchema.parse(req.body);
    const pkg = await packageService.updatePackage(req.params.packageId, validated);

    res.json({
      success: true,
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/v1/packages/:packageId
 * @desc Delete/discontinue package
 */
router.delete('/:packageId', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pkg = await packageService.deletePackage(req.params.packageId);

    res.json({
      success: true,
      data: pkg,
      message: 'Package discontinued successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/packages/:packageId/corporate-price
 * @desc Calculate corporate price for a package
 */
router.post('/:packageId/corporate-price', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { discount } = req.body;
    const pkg = await packageService.getPackageById(req.params.packageId);
    const corporatePrice = packageService.calculateCorporatePrice(pkg, discount);

    res.json({
      success: true,
      data: {
        originalPrice: pkg.price,
        corporatePrice,
        discount: discount || pkg.corporateDiscount,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

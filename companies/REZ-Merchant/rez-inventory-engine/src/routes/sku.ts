import { Router, Request, Response, NextFunction } from 'express';
import { skuService, CreateSKUInput, UpdateSKUInput } from '../services/skuService';

const router = Router();

// Middleware to handle async errors
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * @route   POST /api/sku
 * @desc    Create a new SKU
 * @access  Public (add authentication middleware in production)
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const input: CreateSKUInput = req.body;

    // Validate required fields
    const requiredFields = ['merchantId', 'storeId', 'name', 'category', 'hsnCode', 'mrp', 'costPrice', 'sellingPrice', 'taxRate', 'unit', 'reorderPoint'];
    const missingFields = requiredFields.filter((field) => !input[field as keyof CreateSKUInput]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    const sku = await skuService.createSKU(input);

    res.status(201).json({
      success: true,
      message: 'SKU created successfully',
      data: sku,
    });
  })
);

/**
 * @route   GET /api/sku/:id
 * @desc    Get SKU by ID
 * @access  Public
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const sku = await skuService.getSKU(req.params.id);

    if (!sku) {
      return res.status(404).json({
        success: false,
        message: 'SKU not found',
      });
    }

    res.json({
      success: true,
      data: sku,
    });
  })
);

/**
 * @route   GET /api/sku/code/:code
 * @desc    Get SKU by SKU code
 * @access  Public
 */
router.get(
  '/code/:code',
  asyncHandler(async (req: Request, res: Response) => {
    const sku = await skuService.getSKUByCode(req.params.code);

    if (!sku) {
      return res.status(404).json({
        success: false,
        message: 'SKU not found',
      });
    }

    res.json({
      success: true,
      data: sku,
    });
  })
);

/**
 * @route   GET /api/sku
 * @desc    Search and filter SKUs
 * @access  Public
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      merchantId,
      storeId,
      category,
      subcategory,
      brand,
      status,
      minPrice,
      maxPrice,
      text,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const result = await skuService.searchSKU(
      {
        merchantId: merchantId as string,
        storeId: storeId as string,
        category: category as string,
        subcategory: subcategory as string,
        brand: brand as string,
        status: status as any,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        text: text as string,
      },
      {
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      }
    );

    res.json({
      success: true,
      ...result,
    });
  })
);

/**
 * @route   PUT /api/sku/:id
 * @desc    Update a SKU
 * @access  Public
 */
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const input: UpdateSKUInput = req.body;

    if (Object.keys(input).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No update fields provided',
      });
    }

    const sku = await skuService.updateSKU(req.params.id, input);

    if (!sku) {
      return res.status(404).json({
        success: false,
        message: 'SKU not found',
      });
    }

    res.json({
      success: true,
      message: 'SKU updated successfully',
      data: sku,
    });
  })
);

/**
 * @route   DELETE /api/sku/:id
 * @desc    Delete a SKU (soft delete)
 * @access  Public
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const deleted = await skuService.deleteSKU(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'SKU not found',
      });
    }

    res.json({
      success: true,
      message: 'SKU deleted successfully',
    });
  })
);

/**
 * @route   GET /api/sku/:id/with-stock
 * @desc    Get SKU with stock information
 * @access  Public
 */
router.get(
  '/:id/with-stock',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await skuService.getSKUWithStock(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'SKU not found',
      });
    }

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * @route   GET /api/sku/store/:storeId
 * @desc    Get all SKUs in a store
 * @access  Public
 */
router.get(
  '/store/:storeId',
  asyncHandler(async (req: Request, res: Response) => {
    const skus = await skuService.getSKUsByStore(req.params.storeId);

    res.json({
      success: true,
      data: skus,
      count: skus.length,
    });
  })
);

/**
 * @route   GET /api/sku/stats/:merchantId
 * @desc    Get SKU statistics for a merchant
 * @access  Public
 */
router.get(
  '/stats/:merchantId',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeId } = req.query;
    const stats = await skuService.getSKUStats(req.params.merchantId, storeId as string);

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * @route   POST /api/sku/bulk
 * @desc    Bulk create SKUs
 * @access  Public
 */
router.post(
  '/bulk',
  asyncHandler(async (req: Request, res: Response) => {
    const { skus } = req.body;

    if (!Array.isArray(skus) || skus.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of SKUs',
      });
    }

    const result = await skuService.bulkCreateSKUs(skus);

    res.status(201).json({
      success: true,
      message: `Bulk create completed. Success: ${result.success.length}, Failed: ${result.failed.length}`,
      data: result,
    });
  })
);

/**
 * @route   POST /api/sku/generate-barcode
 * @desc    Generate a unique barcode
 * @access  Public
 */
router.post(
  '/generate-barcode',
  asyncHandler(async (req: Request, res: Response) => {
    const { prefix = 'REZ' } = req.body;
    const barcode = await skuService.generateBarcode(prefix);

    res.json({
      success: true,
      data: { barcode },
    });
  })
);

export default router;

import { Router, Request, Response, NextFunction } from 'express';
import { barcodeService } from '../services/barcodeService';

const router = Router();

// Middleware to handle async errors
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * @route   GET /api/barcode/:barcode
 * @desc    Lookup a barcode and return SKU/stock information
 * @access  Public
 */
router.get(
  '/:barcode',
  asyncHandler(async (req: Request, res: Response) => {
    const { barcode } = req.params;
    const result = await barcodeService.lookupBarcode(barcode);

    if (!result.found) {
      return res.status(404).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * @route   POST /api/barcode/generate
 * @desc    Generate a unique barcode
 * @access  Public
 */
router.post(
  '/generate',
  asyncHandler(async (req: Request, res: Response) => {
    const { prefix = 'REZ' } = req.body;

    if (prefix.length > 4) {
      return res.status(400).json({
        success: false,
        message: 'Prefix must be 4 characters or less',
      });
    }

    const barcode = await barcodeService.generateUniqueBarcode(prefix);

    res.json({
      success: true,
      data: { barcode },
    });
  })
);

/**
 * @route   POST /api/barcode/validate
 * @desc    Validate a barcode format
 * @access  Public
 */
router.post(
  '/validate',
  asyncHandler(async (req: Request, res: Response) => {
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: 'Barcode is required',
      });
    }

    const result = await barcodeService.validateBarcode(barcode);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * @route   POST /api/barcode/exists
 * @desc    Check if a barcode already exists
 * @access  Public
 */
router.post(
  '/exists',
  asyncHandler(async (req: Request, res: Response) => {
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: 'Barcode is required',
      });
    }

    const exists = await barcodeService.barcodeExists(barcode);

    res.json({
      success: true,
      data: {
        exists,
        barcode,
      },
    });
  })
);

/**
 * @route   POST /api/barcode/bulk-lookup
 * @desc    Bulk lookup multiple barcodes
 * @access  Public
 */
router.post(
  '/bulk-lookup',
  asyncHandler(async (req: Request, res: Response) => {
    const { barcodes } = req.body;

    if (!Array.isArray(barcodes) || barcodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of barcodes',
      });
    }

    if (barcodes.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 100 barcodes per request',
      });
    }

    const results = await barcodeService.bulkLookupBarcodes(barcodes);

    const found = results.filter((r) => r.found);
    const notFound = results.filter((r) => !r.found);

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          found: found.length,
          notFound: notFound.length,
        },
      },
    });
  })
);

/**
 * @route   GET /api/barcode/stats
 * @desc    Get barcode statistics
 * @access  Public
 */
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await barcodeService.getBarcodeStats();

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * @route   GET /api/barcode/search
 * @desc    Find SKU by partial barcode
 * @access  Public
 */
router.get(
  '/search/:partialCode',
  asyncHandler(async (req: Request, res: Response) => {
    const { partialCode } = req.params;
    const { storeId } = req.query;

    if (partialCode.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Partial code must be at least 3 characters',
      });
    }

    const results = await barcodeService.findByPartialBarcode(partialCode, storeId as string);

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  })
);

export default router;

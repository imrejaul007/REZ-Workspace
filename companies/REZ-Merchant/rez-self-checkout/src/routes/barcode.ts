import { Router, Request, Response, NextFunction } from 'express';
import { barcodeService, ProcessedBarcode } from '../services/barcodeService';
import { sessionService } from '../services/sessionService';

const router = Router();

// Error handling wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * POST /api/barcode/scan
 * Process a scanned barcode
 */
router.post(
  '/scan',
  asyncHandler(async (req: Request, res: Response) => {
    const { barcode, sessionId } = req.body;

    if (!barcode) {
      res.status(400).json({
        success: false,
        error: 'Barcode is required',
      });
      return;
    }

    const processedBarcode = await barcodeService.processBarcode(barcode);

    const response: {
      success: boolean;
      data: ProcessedBarcode & { addedToSession?: boolean; sessionUpdated?: boolean };
      error?: string;
    } = {
      success: true,
      data: {
        ...processedBarcode,
      },
    };

    // If this is a product barcode and a sessionId was provided, add it to the session
    if (sessionId && processedBarcode.barcodeType === 'product' && processedBarcode.product) {
      try {
        const session = await sessionService.addItem({
          sessionId,
          productId: processedBarcode.product.productId,
          sku: processedBarcode.product.sku,
          name: processedBarcode.product.name,
          barcode: processedBarcode.product.barcode,
          quantity: 1,
          unitPrice: processedBarcode.product.price,
        });

        response.data.addedToSession = true;
        response.data.sessionUpdated = true;
        (response.data as typeof response.data & { sessionTotal: number; sessionItemCount: number }).sessionTotal = session.total;
        (response.data as typeof response.data & { sessionTotal: number; sessionItemCount: number }).sessionItemCount = session.items.length;
      } catch (error) {
        response.data.addedToSession = false;
        if (error instanceof Error) {
          response.error = error.message;
        }
      }
    }

    res.json(response);
  })
);

/**
 * POST /api/barcode/validate
 * Validate a product barcode
 */
router.post(
  '/validate',
  asyncHandler(async (req: Request, res: Response) => {
    const { barcode } = req.body;

    if (!barcode) {
      res.status(400).json({
        success: false,
        error: 'Barcode is required',
      });
      return;
    }

    const validation = await barcodeService.validateProduct(barcode);

    res.json({
      success: validation.valid,
      data: {
        barcode,
        valid: validation.valid,
        reason: validation.reason,
      },
    });
  })
);

/**
 * GET /api/barcode/:barcode
 * Get product details by barcode
 */
router.get(
  '/:barcode',
  asyncHandler(async (req: Request, res: Response) => {
    const { barcode } = req.params;

    if (!barcode) {
      res.status(400).json({
        success: false,
        error: 'Barcode is required',
      });
      return;
    }

    const product = await barcodeService.getProductByBarcode(barcode);

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found',
      });
      return;
    }

    res.json({
      success: true,
      data: product,
    });
  })
);

/**
 * POST /api/barcode/type
 * Detect barcode type
 */
router.post(
  '/type',
  asyncHandler(async (req: Request, res: Response) => {
    const { barcode } = req.body;

    if (!barcode) {
      res.status(400).json({
        success: false,
        error: 'Barcode is required',
      });
      return;
    }

    const barcodeType = barcodeService.detectBarcodeType(barcode);

    res.json({
      success: true,
      data: {
        barcode,
        barcodeType,
      },
    });
  })
);

/**
 * POST /api/barcode/parse-weight
 * Parse a weight-based barcode
 */
router.post(
  '/parse-weight',
  asyncHandler(async (req: Request, res: Response) => {
    const { barcode } = req.body;

    if (!barcode) {
      res.status(400).json({
        success: false,
        error: 'Barcode is required',
      });
      return;
    }

    const parsed = barcodeService.parseWeightBarcode(barcode);

    res.json({
      success: !!parsed,
      data: parsed || {
        barcode,
        parsed: false,
        message: 'Not a valid weight barcode',
      },
    });
  })
);

export default router;

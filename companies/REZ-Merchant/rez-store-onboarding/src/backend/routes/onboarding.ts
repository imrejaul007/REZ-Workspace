import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { onboardingService } from '../services/onboardingService';
import { storeService } from '../services/storeService';
import { CreateStoreRequest } from '../models/Onboarding';

const router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const createStoreSchema = z.object({
  merchantId: z.string().min(1),
  storeName: z.string().min(1).max(100),
  storeType: z.enum(['retail', 'restaurant', 'grocery', 'pharmacy']),
  address: z.object({
    street: z.string().min(1).max(200),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    pincode: z.string().regex(/^[0-9]{6}$/),
    country: z.string().min(1).max(100),
  }),
  phone: z.string().regex(/^[+]?[0-9]{10,13}$/),
  email: z.string().email(),
  operatingHours: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    isClosed: z.boolean(),
  })).optional(),
});

const completeStepSchema = z.object({
  stepId: z.string().min(1),
  data: z.record(z.unknown()),
});

const stepDataSchema = z.object({
  stepId: z.string().min(1),
  data: z.record(z.unknown()),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/onboarding/store
 * Create a new store with onboarding
 */
router.post('/store', async (req: Request, res: Response) => {
  try {
    const validatedData = createStoreSchema.parse(req.body);

    const { store, onboarding } = await onboardingService.createStore({
      ...validatedData,
      operatingHours: validatedData.operatingHours || [
        { dayOfWeek: 0, openTime: '09:00', closeTime: '21:00', isClosed: false },
        { dayOfWeek: 1, openTime: '09:00', closeTime: '21:00', isClosed: false },
        { dayOfWeek: 2, openTime: '09:00', closeTime: '21:00', isClosed: false },
        { dayOfWeek: 3, openTime: '09:00', closeTime: '21:00', isClosed: false },
        { dayOfWeek: 4, openTime: '09:00', closeTime: '21:00', isClosed: false },
        { dayOfWeek: 5, openTime: '09:00', closeTime: '21:00', isClosed: false },
        { dayOfWeek: 6, openTime: '10:00', closeTime: '20:00', isClosed: false },
      ],
    });

    res.status(201).json({
      success: true,
      data: {
        store,
        onboarding,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    console.error('Error creating store:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create store',
    });
  }
});

/**
 * GET /api/onboarding/store/:id/status
 * Get onboarding status for a store
 */
router.get('/store/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const onboarding = await onboardingService.getOnboardingStatusByStoreId(id);

    if (!onboarding) {
      res.status(404).json({
        success: false,
        error: 'Onboarding not found',
      });
      return;
    }

    res.json({
      success: true,
      data: onboarding,
    });
  } catch (error) {
    console.error('Error getting onboarding status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get onboarding status',
    });
  }
});

/**
 * GET /api/onboarding/onboarding/:id
 * Get onboarding by onboarding ID
 */
router.get('/onboarding/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const onboarding = await onboardingService.getOnboardingStatus(id);

    if (!onboarding) {
      res.status(404).json({
        success: false,
        error: 'Onboarding not found',
      });
      return;
    }

    res.json({
      success: true,
      data: onboarding,
    });
  } catch (error) {
    console.error('Error getting onboarding:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get onboarding',
    });
  }
});

/**
 * PUT /api/onboarding/store/:id/complete-step
 * Mark a step as complete
 */
router.put('/store/:id/complete-step', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stepId, data } = stepDataSchema.parse(req.body);

    // Get store to find onboarding ID
    const store = await storeService.getStoreById(id);
    if (!store) {
      res.status(404).json({
        success: false,
        error: 'Store not found',
      });
      return;
    }

    // Validate step data
    const validation = onboardingService.validateStepData(stepId, data);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        errors: validation.errors,
      });
      return;
    }

    const onboarding = await onboardingService.completeStep(store.onboardingId, stepId, data);

    res.json({
      success: true,
      data: onboarding,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    console.error('Error completing step:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete step',
    });
  }
});

/**
 * PUT /api/onboarding/onboarding/:id/complete-step
 * Mark a step as complete using onboarding ID
 */
router.put('/onboarding/:id/complete-step', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stepId, data } = stepDataSchema.parse(req.body);

    // Validate step data
    const validation = onboardingService.validateStepData(stepId, data);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        errors: validation.errors,
      });
      return;
    }

    const onboarding = await onboardingService.completeStep(id, stepId, data);

    res.json({
      success: true,
      data: onboarding,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    console.error('Error completing step:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete step',
    });
  }
});

/**
 * POST /api/onboarding/onboarding/:id/skip-step
 * Skip a step
 */
router.post('/onboarding/:id/skip-step', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stepId } = z.object({ stepId: z.string().min(1) }).parse(req.body);

    const onboarding = await onboardingService.skipStep(id, stepId);

    res.json({
      success: true,
      data: onboarding,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    console.error('Error skipping step:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to skip step',
    });
  }
});

/**
 * POST /api/onboarding/onboarding/:id/go-back
 * Go back to previous step
 */
router.post('/onboarding/:id/go-back', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const onboarding = await onboardingService.goBackStep(id);

    res.json({
      success: true,
      data: onboarding,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    console.error('Error going back:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to go back',
    });
  }
});

/**
 * GET /api/onboarding/merchant/:id/stores
 * List all stores for a merchant
 */
router.get('/merchant/:id/stores', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const stores = await storeService.getMerchantStores(id);

    res.json({
      success: true,
      data: stores,
    });
  } catch (error) {
    console.error('Error getting merchant stores:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stores',
    });
  }
});

/**
 * GET /api/onboarding/store/:id
 * Get store details
 */
router.get('/store/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const store = await storeService.getStoreById(id);

    if (!store) {
      res.status(404).json({
        success: false,
        error: 'Store not found',
      });
      return;
    }

    res.json({
      success: true,
      data: store,
    });
  } catch (error) {
    console.error('Error getting store:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get store',
    });
  }
});

/**
 * PUT /api/onboarding/store/:id
 * Update store details
 */
router.put('/store/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const store = await storeService.updateStore(id, req.body);

    res.json({
      success: true,
      data: store,
    });
  } catch (error) {
    console.error('Error updating store:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update store',
    });
  }
});

/**
 * POST /api/onboarding/store/:id/pos
 * Setup POS configuration
 */
router.post('/store/:id/pos', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const posConfig = await storeService.setupStorePOS(id, req.body);

    res.json({
      success: true,
      data: posConfig,
    });
  } catch (error) {
    console.error('Error setting up POS:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup POS',
    });
  }
});

/**
 * GET /api/onboarding/store/:id/pos
 * Get POS configuration
 */
router.get('/store/:id/pos', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const posConfig = await storeService.getPOSConfig(id);

    if (!posConfig) {
      res.status(404).json({
        success: false,
        error: 'POS config not found',
      });
      return;
    }

    res.json({
      success: true,
      data: posConfig,
    });
  } catch (error) {
    console.error('Error getting POS config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get POS config',
    });
  }
});

/**
 * POST /api/onboarding/store/:id/qr-codes/generate
 * Generate QR codes for products
 */
router.post('/store/:id/qr-codes/generate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const qrCodes = await storeService.generateShelfQRCodes(id);

    res.json({
      success: true,
      data: qrCodes,
    });
  } catch (error) {
    console.error('Error generating QR codes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR codes',
    });
  }
});

/**
 * GET /api/onboarding/store/:id/qr-codes
 * Get all QR codes for store
 */
router.get('/store/:id/qr-codes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const qrCodes = await storeService.getStoreQRCodes(id);

    res.json({
      success: true,
      data: qrCodes,
    });
  } catch (error) {
    console.error('Error getting QR codes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get QR codes',
    });
  }
});

/**
 * POST /api/onboarding/store/:id/qr-codes/print
 * Mark QR codes as printed
 */
router.post('/store/:id/qr-codes/print', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { qrIds } = z.object({ qrIds: z.array(z.string()) }).parse(req.body);

    await storeService.markQRCodesPrinted(qrIds, id);

    res.json({
      success: true,
      message: 'QR codes marked as printed',
    });
  } catch (error) {
    console.error('Error marking QR codes as printed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark QR codes as printed',
    });
  }
});

/**
 * GET /api/onboarding/store/:id/products
 * Get all products for store
 */
router.get('/store/:id/products', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const products = await storeService.getStoreProducts(id);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get products',
    });
  }
});

/**
 * POST /api/onboarding/store/:id/products
 * Add a product
 */
router.post('/store/:id/products', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await storeService.addProduct(id, req.body);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add product',
    });
  }
});

/**
 * POST /api/onboarding/store/:id/products/import
 * Bulk import products
 */
router.post('/store/:id/products/import', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { products } = z.object({
      products: z.array(z.object({
        name: z.string().min(1),
        sku: z.string().min(1),
        category: z.string(),
        price: z.number().min(0),
        taxRate: z.number().min(0).max(100).optional().default(18),
        unit: z.string().optional().default('piece'),
        stockQuantity: z.number().min(0).optional().default(0),
      })),
    }).parse(req.body);

    const result = await storeService.importProducts(id, products);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    console.error('Error importing products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import products',
    });
  }
});

/**
 * POST /api/onboarding/onboarding/:id/complete
 * Complete onboarding
 */
router.post('/onboarding/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const onboarding = await onboardingService.completeOnboarding(id);

    res.json({
      success: true,
      data: onboarding,
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete onboarding',
    });
  }
});

export default router;

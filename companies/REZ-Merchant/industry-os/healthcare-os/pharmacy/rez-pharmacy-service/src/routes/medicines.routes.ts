import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { inventoryService } from '../services/InventoryService';
import { DrugCategory, MedicineStatus } from '../models/Medicine';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const createMedicineSchema = z.object({
  name: z.string().min(1),
  genericName: z.string().min(1),
  brandName: z.string().optional(),
  category: z.nativeEnum(DrugCategory),
  description: z.string().min(1),
  composition: z.array(z.string()).min(1),
  dosageForm: z.enum(['TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'CREAM', 'DROPS', 'INHALER', 'PATCH', 'SUPPOSITORY']),
  strength: z.string().min(1),
  manufacturer: z.string().min(1),
  batchNumber: z.string().min(1),
  purchasePrice: z.number().positive(),
  sellingPrice: z.number().positive(),
  mrp: z.number().positive(),
  stock: z.number().int().min(0),
  minStockLevel: z.number().int().min(0).optional(),
  maxStockLevel: z.number().int().positive().optional(),
  reorderLevel: z.number().int().min(0).optional(),
  expiryDate: z.string().transform(s => new Date(s)),
  manufacturingDate: z.string().transform(s => new Date(s)),
  shelfLocation: z.string().optional(),
  storageCondition: z.enum(['ROOM_TEMPERATURE', 'REFRIGERATED', 'FROZEN', 'PROTECTED_FROM_LIGHT']).optional(),
  requiresPrescription: z.boolean().default(true),
  controlledSubstance: z.boolean().default(false),
  schedule: z.enum(['SCHEDULE_H1', 'SCHEDULE_H2', 'SCHEDULE_H3', 'SCHEDULE_H4', 'SCHEDULE_X']).optional(),
  drugInteractions: z.array(z.object({
    drugId: z.string(),
    drugName: z.string(),
    severity: z.enum(['MILD', 'MODERATE', 'SEVERE']),
    description: z.string()
  })).optional(),
  sideEffects: z.array(z.string()).optional(),
  contraindications: z.array(z.string()).optional(),
  barcode: z.string().optional(),
  ndc: z.string().optional()
});

const updateStockSchema = z.object({
  medicineId: z.string().min(1),
  quantity: z.number().int().min(1),
  reason: z.enum(['PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'DAMAGE', 'EXPIRY']),
  notes: z.string().optional()
});

const searchQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  requiresPrescription: z.string().optional(),
  inStock: z.string().optional(),
  expiringWithinDays: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional()
});

const checkInteractionsSchema = z.object({
  medicineIds: z.array(z.string()).min(2, 'At least 2 medicine IDs required')
});

/**
 * POST /api/medicines - Create a new medicine
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createMedicineSchema.parse(req.body);
    const medicine = await inventoryService.addMedicine(validatedData as unknown);
    res.status(201).json({
      success: true,
      data: medicine
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
 * GET /api/medicines - Search medicines
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = searchQuerySchema.parse(req.query);

    const filters: unknown = {};
    if (query.q) filters.query = query.q;
    if (query.category) filters.category = query.category as DrugCategory;
    if (query.status) filters.status = query.status as MedicineStatus;
    if (query.requiresPrescription) filters.requiresPrescription = query.requiresPrescription === 'true';
    if (query.inStock) filters.inStock = query.inStock === 'true';
    if (query.expiringWithinDays) filters.expiringWithinDays = parseInt(query.expiringWithinDays);
    if (query.page) filters.page = parseInt(query.page);
    if (query.limit) filters.limit = parseInt(query.limit);

    const result = await inventoryService.searchMedicines(filters);

    res.json({
      success: true,
      data: {
        medicines: result.medicines,
        total: result.total,
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 20
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
 * GET /api/medicines/alerts - Get inventory alerts
 */
router.get('/alerts', async (_req: Request, res: Response) => {
  try {
    const alerts = await inventoryService.getInventoryAlerts();
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/medicines/expiry-report - Get expiry report
 */
router.get('/expiry-report', async (req: Request, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 6;
    const report = await inventoryService.getExpiryReport(months);
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/medicines/:id - Get medicine by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const medicine = await inventoryService.getMedicineById(req.params.id);

    if (!medicine) {
      res.status(404).json({
        success: false,
        error: 'Medicine not found'
      });
      return;
    }

    res.json({
      success: true,
      data: medicine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/medicines/barcode/:barcode - Get medicine by barcode
 */
router.get('/barcode/:barcode', async (req: Request, res: Response) => {
  try {
    const medicine = await inventoryService.getMedicineByBarcode(req.params.barcode);

    if (!medicine) {
      res.status(404).json({
        success: false,
        error: 'Medicine not found'
      });
      return;
    }

    res.json({
      success: true,
      data: medicine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * PUT /api/medicines/:id - Update medicine
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const medicine = await inventoryService.updateMedicine(req.params.id, req.body);

    if (!medicine) {
      res.status(404).json({
        success: false,
        error: 'Medicine not found'
      });
      return;
    }

    res.json({
      success: true,
      data: medicine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/medicines/stock - Update stock
 */
router.post('/stock', async (req: Request, res: Response) => {
  try {
    const validatedData = updateStockSchema.parse(req.body);
    const medicine = await inventoryService.updateStock(validatedData);

    if (!medicine) {
      res.status(404).json({
        success: false,
        error: 'Medicine not found'
      });
      return;
    }

    res.json({
      success: true,
      data: medicine
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
 * POST /api/medicines/stock/batch - Batch update stock
 */
router.post('/stock/batch', async (req: Request, res: Response) => {
  try {
    const updates = z.array(updateStockSchema).parse(req.body);
    const results = await inventoryService.batchUpdateStock(updates);

    res.json({
      success: true,
      data: results
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
 * POST /api/medicines/interactions - Check drug interactions
 */
router.post('/interactions', async (req: Request, res: Response) => {
  try {
    const validatedData = checkInteractionsSchema.parse(req.body);
    const result = await inventoryService.checkDrugInteractions(validatedData.medicineIds);

    res.json({
      success: true,
      data: result
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
 * POST /api/medicines/:id/discontinue - Discontinue medicine
 */
router.post('/:id/discontinue', async (req: Request, res: Response) => {
  try {
    const medicine = await inventoryService.discontinueMedicine(req.params.id);

    if (!medicine) {
      res.status(404).json({
        success: false,
        error: 'Medicine not found'
      });
      return;
    }

    res.json({
      success: true,
      data: medicine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/medicines/:id/recall - Recall medicine
 */
router.post('/:id/recall', async (req: Request, res: Response) => {
  try {
    const reason = req.body.reason || 'No reason provided';
    const medicine = await inventoryService.recallMedicine(req.params.id, reason);

    if (!medicine) {
      res.status(404).json({
        success: false,
        error: 'Medicine not found'
      });
      return;
    }

    res.json({
      success: true,
      data: medicine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;

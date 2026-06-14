import { Router, Request, Response } from 'express';
import { businessService } from '../services/business.service.js';
import { authenticate, authorizeBusinessAccess, optionalAuth } from '../middleware/auth.js';
import { IndustryType, ModuleType, EnableModuleSchema } from '../types/index.js';

const router = Router();

/**
 * @route   POST /api/business
 * @desc    Create a new business
 * @access  Private
 */
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await businessService.createBusiness({
      ...req.body,
      ownerId: req.userId // Override with authenticated user
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating business:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create business'
    });
  }
});

/**
 * @route   GET /api/business
 * @desc    List all businesses with pagination and filters
 * @access  Private
 */
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page,
      limit,
      industry,
      isActive,
      search,
      sortBy,
      sortOrder
    } = req.query;

    const result = await businessService.listBusinesses({
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
      industry: industry as IndustryType,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search: search as string,
      ownerId: req.userId, // Filter by owner
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    });

    res.json(result);
  } catch (error) {
    console.error('Error listing businesses:', error);
    res.status(500).json({
      success: false,
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    });
  }
});

/**
 * @route   GET /api/business/my
 * @desc    Get all businesses for the current user
 * @access  Private
 */
router.get('/my', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await businessService.getBusinessesByOwner(req.userId!);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting user businesses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get businesses'
    });
  }
});

/**
 * @route   GET /api/business/:id
 * @desc    Get business by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await businessService.getBusinessById(req.params.id);

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting business:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get business'
    });
  }
});

/**
 * @route   PUT /api/business/:id
 * @desc    Update business
 * @access  Private
 */
router.put('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await businessService.updateBusiness(req.params.id, req.body);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating business:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update business'
    });
  }
});

/**
 * @route   DELETE /api/business/:id
 * @desc    Delete business (soft delete)
 * @access  Private
 */
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await businessService.deleteBusiness(req.params.id);

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error deleting business:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete business'
    });
  }
});

/**
 * @route   GET /api/business/:id/modules
 * @desc    Get enabled modules for a business
 * @access  Private
 */
router.get('/:id/modules', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await businessService.getBusinessModules(req.params.id);

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting business modules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get modules'
    });
  }
});

/**
 * @route   POST /api/business/:id/modules
 * @desc    Enable a module for a business
 * @access  Private
 */
router.post('/:id/modules', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const validationResult = EnableModuleSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: validationResult.error.errors[0].message
      });
      return;
    }

    const result = await businessService.enableModule(
      req.params.id,
      validationResult.data.moduleId
    );

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error enabling module:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enable module'
    });
  }
});

/**
 * @route   DELETE /api/business/:id/modules/:moduleId
 * @desc    Disable a module for a business
 * @access  Private
 */
router.delete('/:id/modules/:moduleId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await businessService.disableModule(
      req.params.id,
      req.params.moduleId as ModuleType
    );

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error disabling module:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disable module'
    });
  }
});

export default router;

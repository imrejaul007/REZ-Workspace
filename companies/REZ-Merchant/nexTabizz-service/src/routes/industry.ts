import { Router, Request, Response } from 'express';
import { industryService } from '../services/industry.service.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { IndustryType, ModuleType } from '../types/index.js';

const router = Router();

/**
 * @route   GET /api/industries
 * @desc    Get all industries with their modules
 * @access  Public
 */
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await industryService.getAllIndustries();

    if (!result.success) {
      res.status(500).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting industries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get industries'
    });
  }
});

/**
 * @route   GET /api/industries/:type
 * @desc    Get industry by type with modules
 * @access  Public
 */
router.get('/:type', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const industryType = req.params.type as IndustryType;
    const result = await industryService.getIndustryByType(industryType);

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting industry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get industry'
    });
  }
});

/**
 * @route   GET /api/industries/:type/modules
 * @desc    Get modules for a specific industry
 * @access  Public
 */
router.get('/:type/modules', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const industryType = req.params.type as IndustryType;
    const result = await industryService.getModulesForIndustry(industryType);

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting industry modules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get modules'
    });
  }
});

/**
 * @route   GET /api/industries/categories/:category
 * @desc    Get industries that have modules in a specific category
 * @access  Public
 */
router.get('/categories/:category', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const category = req.params.category as 'core' | 'operations' | 'customer' | 'management';
    const result = await industryService.getIndustriesByModuleCategory(category);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting industries by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get industries'
    });
  }
});

/**
 * @route   GET /api/modules
 * @desc    Get all modules with their industries
 * @access  Public
 */
router.get('/modules/all', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await industryService.getAllModules();

    if (!result.success) {
      res.status(500).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting all modules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get modules'
    });
  }
});

/**
 * @route   GET /api/modules/:type
 * @desc    Get module by type
 * @access  Public
 */
router.get('/modules/:type', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const moduleType = req.params.type as ModuleType;
    const result = await industryService.getModuleByType(moduleType);

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting module:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get module'
    });
  }
});

export default router;

import { Router, Request, Response, NextFunction } from 'express';
import { restaurantTwinController } from '../controllers/restaurant-twin.controller';

const router = Router();

/**
 * @route   POST /api/twins/restaurant
 * @desc    Create a new Restaurant Twin
 * @access  Internal
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await restaurantTwinController.createRestaurantTwin(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/twins/restaurant/:restaurantId
 * @desc    Get Restaurant Twin by ID
 * @access  Internal
 */
router.get('/:restaurantId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await restaurantTwinController.getRestaurantTwin(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/twins/restaurant/:restaurantId/status
 * @desc    Update Restaurant Status
 * @access  Internal
 */
router.put('/:restaurantId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await restaurantTwinController.updateRestaurantStatus(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/twins/restaurant/:restaurantId/metrics
 * @desc    Update Restaurant Metrics
 * @access  Internal
 */
router.put('/:restaurantId/metrics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await restaurantTwinController.updateMetrics(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/twins/restaurant/:restaurantId/hours
 * @desc    Update Operating Hours
 * @access  Internal
 */
router.put('/:restaurantId/hours', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await restaurantTwinController.updateOperatingHours(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/twins/restaurant/:restaurantId/features
 * @desc    Update Restaurant Features
 * @access  Internal
 */
router.put('/:restaurantId/features', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await restaurantTwinController.updateFeatures(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/twins/restaurant
 * @desc    List Restaurant Twins
 * @access  Internal
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await restaurantTwinController.listRestaurants(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/twins/restaurant/:restaurantId
 * @desc    Delete Restaurant Twin
 * @access  Internal
 */
router.delete('/:restaurantId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await restaurantTwinController.deleteRestaurantTwin(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
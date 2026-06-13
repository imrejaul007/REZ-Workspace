import { Router } from 'express';
import { propertyTwinController } from '../controllers';

const router = Router();

/**
 * @route POST /api/twins/property
 * @desc Create property twin
 * @access Public
 */
router.post('/', propertyTwinController.create.bind(propertyTwinController));

/**
 * @route GET /api/twins/property
 * @desc Query property twins with filters
 * @access Public
 */
router.get('/', propertyTwinController.query.bind(propertyTwinController));

/**
 * @route GET /api/twins/property/search
 * @desc Search property twins
 * @access Public
 */
router.get('/search', propertyTwinController.search.bind(propertyTwinController));

/**
 * @route GET /api/twins/property/stats/market
 * @desc Get market statistics
 * @access Public
 */
router.get('/stats/market', propertyTwinController.getMarketStats.bind(propertyTwinController));

/**
 * @route GET /api/twins/property/stats/price-per-sqft
 * @desc Get price per sqft statistics
 * @access Public
 */
router.get('/stats/price-per-sqft', propertyTwinController.getPricePerSqftStats.bind(propertyTwinController));

/**
 * @route GET /api/twins/property/twin/:twinId
 * @desc Get property twin by twinId
 * @access Public
 */
router.get('/twin/:twinId', propertyTwinController.getByTwinId.bind(propertyTwinController));

/**
 * @route GET /api/twins/property/:id
 * @desc Get property twin by propertyId
 * @access Public
 */
router.get('/:id', propertyTwinController.getById.bind(propertyTwinController));

/**
 * @route PUT /api/twins/property/:id
 * @desc Update property twin
 * @access Public
 */
router.put('/:id', propertyTwinController.update.bind(propertyTwinController));

/**
 * @route PATCH /api/twins/property/:id/status
 * @desc Update listing status
 * @access Public
 */
router.patch('/:id/status', propertyTwinController.updateStatus.bind(propertyTwinController));

/**
 * @route PATCH /api/twins/property/:id/price
 * @desc Update property price
 * @access Public
 */
router.patch('/:id/price', propertyTwinController.updatePrice.bind(propertyTwinController));

/**
 * @route POST /api/twins/property/:id/media
 * @desc Add media to property
 * @access Public
 */
router.post('/:id/media', propertyTwinController.addMedia.bind(propertyTwinController));

/**
 * @route POST /api/twins/property/:id/tour
 * @desc Add 3D tour URL
 * @access Public
 */
router.post('/:id/tour', propertyTwinController.addTour.bind(propertyTwinController));

/**
 * @route POST /api/twins/property/:id/floorplan
 * @desc Add floor plan URL
 * @access Public
 */
router.post('/:id/floorplan', propertyTwinController.addFloorPlan.bind(propertyTwinController));

/**
 * @route PATCH /api/twins/property/:id/agent
 * @desc Update agent assignment
 * @access Public
 */
router.patch('/:id/agent', propertyTwinController.updateAgent.bind(propertyTwinController));

/**
 * @route GET /api/twins/property/:id/active
 * @desc Get active listings only
 * @access Public
 */
router.get('/:id/active', propertyTwinController.getActiveListings.bind(propertyTwinController));

/**
 * @route GET /api/twins/property/:id/area/:areaId
 * @desc Get properties by area
 * @access Public
 */
router.get('/:id/area/:areaId', propertyTwinController.getByArea.bind(propertyTwinController));

/**
 * @route GET /api/twins/property/:id/agent/:agentId
 * @desc Get properties by agent
 * @access Public
 */
router.get('/:id/agent/:agentId', propertyTwinController.getByAgent.bind(propertyTwinController));

/**
 * @route GET /api/twins/property/:id/recent
 * @desc Get recent listings
 * @access Public
 */
router.get('/:id/recent', propertyTwinController.getRecentListings.bind(propertyTwinController));

/**
 * @route GET /api/twins/property/:id/propflow
 * @desc Get PropFlow insights for property
 * @access Public
 */
router.get('/:id/propflow', propertyTwinController.getPropflowInsights.bind(propertyTwinController));

/**
 * @route DELETE /api/twins/property/:id
 * @desc Archive property twin
 * @access Public
 */
router.delete('/:id', propertyTwinController.archive.bind(propertyTwinController));

/**
 * @route DELETE /api/twins/property/:id/permanent
 * @desc Permanently delete property twin
 * @access Public
 */
router.delete('/:id/permanent', propertyTwinController.delete.bind(propertyTwinController));

export default router;

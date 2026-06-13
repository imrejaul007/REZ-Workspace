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
 * @desc Query property twins
 * @access Public
 */
router.get('/', propertyTwinController.query.bind(propertyTwinController));

/**
 * @route GET /api/twins/property/stats/portfolio
 * @desc Get portfolio statistics
 * @access Public
 */
router.get('/stats/portfolio', propertyTwinController.getPortfolioStats.bind(propertyTwinController));

/**
 * @route GET /api/twins/property/:id
 * @desc Get property twin by ID
 * @access Public
 */
router.get('/:id', propertyTwinController.getById.bind(propertyTwinController));

/**
 * @route PUT /api/twins/property/:id/metrics
 * @desc Update property metrics
 * @access Public
 */
router.put('/:id/metrics', propertyTwinController.updateMetrics.bind(propertyTwinController));

/**
 * @route POST /api/twins/property/:id/venues
 * @desc Add venue
 * @access Public
 */
router.post('/:id/venues', propertyTwinController.addVenue.bind(propertyTwinController));

/**
 * @route PUT /api/twins/property/:id/venues/:venueId
 * @desc Update venue
 * @access Public
 */
router.put('/:id/venues/:venueId', propertyTwinController.updateVenue.bind(propertyTwinController));

/**
 * @route DELETE /api/twins/property/:id/venues/:venueId
 * @desc Remove venue
 * @access Public
 */
router.delete('/:id/venues/:venueId', propertyTwinController.removeVenue.bind(propertyTwinController));

/**
 * @route POST /api/twins/property/:id/amenities
 * @desc Add amenity
 * @access Public
 */
router.post('/:id/amenities', propertyTwinController.addAmenity.bind(propertyTwinController));

/**
 * @route PUT /api/twins/property/:id/amenities/:amenityId
 * @desc Update amenity
 * @access Public
 */
router.put('/:id/amenities/:amenityId', propertyTwinController.updateAmenity.bind(propertyTwinController));

/**
 * @route POST /api/twins/property/:id/policies
 * @desc Add policy
 * @access Public
 */
router.post('/:id/policies', propertyTwinController.addPolicy.bind(propertyTwinController));

/**
 * @route GET /api/twins/property/:id/policies
 * @desc Get policies
 * @access Public
 */
router.get('/:id/policies', propertyTwinController.getPolicies.bind(propertyTwinController));

/**
 * @route PUT /api/twins/property/:id/revenue-centers/:centerId
 * @desc Update revenue center
 * @access Public
 */
router.put('/:id/revenue-centers/:centerId', propertyTwinController.updateRevenueCenter.bind(propertyTwinController));

/**
 * @route PUT /api/twins/property/:id/integrations/:serviceName
 * @desc Update integration status
 * @access Public
 */
router.put('/:id/integrations/:serviceName', propertyTwinController.updateIntegration.bind(propertyTwinController));

/**
 * @route GET /api/twins/property/:id/venues
 * @desc Get active venues
 * @access Public
 */
router.get('/:id/venues', propertyTwinController.getActiveVenues.bind(propertyTwinController));

/**
 * @route GET /api/twins/property/:id/amenities
 * @desc Get available amenities
 * @access Public
 */
router.get('/:id/amenities', propertyTwinController.getAvailableAmenities.bind(propertyTwinController));

/**
 * @route GET /api/twins/property/:id/revpar
 * @desc Get RevPAR
 * @access Public
 */
router.get('/:id/revpar', propertyTwinController.getRevPAR.bind(propertyTwinController));

/**
 * @route GET /api/twins/property/:id/capacity
 * @desc Get total venue capacity
 * @access Public
 */
router.get('/:id/capacity', propertyTwinController.getTotalCapacity.bind(propertyTwinController));

/**
 * @route DELETE /api/twins/property/:id
 * @desc Archive property twin
 * @access Public
 */
router.delete('/:id', propertyTwinController.archive.bind(propertyTwinController));

export default router;

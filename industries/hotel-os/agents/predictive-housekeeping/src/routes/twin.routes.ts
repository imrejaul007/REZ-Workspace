import { Router } from 'express';
import { twinController } from '../controllers/twin.controller';

const router = Router();

// ============================================================================
// Guest Twin Routes
// ============================================================================

/**
 * POST /api/twins/guest
 * Create a new guest twin
 */
router.post('/guest', (req, res, next) => twinController.createGuestTwin(req, res, next));

/**
 * GET /api/twins/guest/:id
 * Get a guest twin by ID
 */
router.get('/guest/:id', (req, res, next) => twinController.getGuestTwin(req, res, next));

/**
 * PUT /api/twins/guest/:id/preferences
 * Update guest preferences
 */
router.put('/guest/:id/preferences', (req, res, next) => twinController.updateGuestPreferences(req, res, next));

/**
 * GET /api/twins/guest/property/:propertyId
 * Get all guests for a property
 */
router.get('/guest/property/:propertyId', (req, res, next) => twinController.getGuestsByProperty(req, res, next));

/**
 * GET /api/twins/guest/room/:roomId
 * Get guest currently in a room
 */
router.get('/guest/room/:roomId', (req, res, next) => twinController.getGuestsByRoom(req, res, next));

// ============================================================================
// Room Twin Routes
// ============================================================================

/**
 * POST /api/twins/room
 * Create a new room twin
 */
router.post('/room', (req, res, next) => twinController.createRoomTwin(req, res, next));

/**
 * GET /api/twins/room/:id
 * Get a room twin by ID
 */
router.get('/room/:id', (req, res, next) => twinController.getRoomTwin(req, res, next));

/**
 * GET /api/twins/room/:id/status
 * Get room status
 */
router.get('/room/:id/status', (req, res, next) => twinController.getRoomTwinStatus(req, res, next));

/**
 * PATCH /api/twins/room/:id/status
 * Update room status
 */
router.patch('/room/:id/status', (req, res, next) => twinController.updateRoomTwinStatus(req, res, next));

/**
 * PATCH /api/twins/room/:id/housekeeping
 * Update housekeeping state
 */
router.patch('/room/:id/housekeeping', (req, res, next) => twinController.updateHousekeepingState(req, res, next));

/**
 * GET /api/twins/room/property/:propertyId
 * Get all rooms for a property
 */
router.get('/room/property/:propertyId', (req, res, next) => twinController.getRoomsByProperty(req, res, next));

/**
 * GET /api/twins/room/property/:propertyId/status/:status
 * Get rooms by status
 */
router.get('/room/property/:propertyId/status/:status', (req, res, next) => twinController.getRoomsByStatus(req, res, next));

/**
 * GET /api/twins/room/property/:propertyId/cleaning
 * Get rooms needing cleaning
 */
router.get('/room/property/:propertyId/cleaning', (req, res, next) => twinController.getRoomsNeedingCleaning(req, res, next));

// ============================================================================
// Property Twin Routes
// ============================================================================

/**
 * POST /api/twins/property
 * Create a new property twin
 */
router.post('/property', (req, res, next) => twinController.createPropertyTwin(req, res, next));

/**
 * GET /api/twins/property/:id
 * Get a property twin by ID
 */
router.get('/property/:id', (req, res, next) => twinController.getPropertyTwin(req, res, next));

/**
 * PATCH /api/twins/property/:id/revenue
 * Update property revenue
 */
router.patch('/property/:id/revenue', (req, res, next) => twinController.updatePropertyRevenue(req, res, next));

export default router;
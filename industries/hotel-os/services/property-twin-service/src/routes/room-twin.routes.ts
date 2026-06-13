import { Router } from 'express';
import { roomTwinController } from '../controllers';

const router = Router();

/**
 * @route POST /api/twins/room
 * @desc Create room twin
 * @access Public
 */
router.post('/', roomTwinController.create.bind(roomTwinController));

/**
 * @route POST /api/twins/room/bulk
 * @desc Bulk create rooms
 * @access Public
 */
router.post('/bulk', roomTwinController.bulkCreate.bind(roomTwinController));

/**
 * @route GET /api/twins/room
 * @desc Query room twins
 * @access Public
 */
router.get('/', roomTwinController.query.bind(roomTwinController));

/**
 * @route GET /api/twins/room/available
 * @desc Find available rooms
 * @access Public
 */
router.get('/available', roomTwinController.findAvailable.bind(roomTwinController));

/**
 * @route GET /api/twins/room/maintenance
 * @desc Get rooms needing maintenance
 * @access Public
 */
router.get('/maintenance', roomTwinController.getMaintenanceRooms.bind(roomTwinController));

/**
 * @route GET /api/twins/room/stats
 * @desc Get room statistics
 * @access Public
 */
router.get('/stats', roomTwinController.getStatistics.bind(roomTwinController));

/**
 * @route GET /api/twins/room/:id
 * @desc Get room twin by ID
 * @access Public
 */
router.get('/:id', roomTwinController.getById.bind(roomTwinController));

/**
 * @route GET /api/twins/room/:id/status
 * @desc Get room status
 * @access Public
 */
router.get('/:id/status', roomTwinController.getStatus.bind(roomTwinController));

/**
 * @route PUT /api/twins/room/:id/status
 * @desc Update room status
 * @access Public
 */
router.put('/:id/status', roomTwinController.updateStatus.bind(roomTwinController));

/**
 * @route PUT /api/twins/room/:id/condition
 * @desc Update room condition
 * @access Public
 */
router.put('/:id/condition', roomTwinController.updateCondition.bind(roomTwinController));

/**
 * @route PUT /api/twins/room/:id/iot
 * @desc Update IoT state
 * @access Public
 */
router.put('/:id/iot', roomTwinController.updateIoTState.bind(roomTwinController));

/**
 * @route POST /api/twins/room/:id/checkin
 * @desc Check in guest
 * @access Public
 */
router.post('/:id/checkin', roomTwinController.checkIn.bind(roomTwinController));

/**
 * @route POST /api/twins/room/:id/checkout
 * @desc Check out guest
 * @access Public
 */
router.post('/:id/checkout', roomTwinController.checkOut.bind(roomTwinController));

export default router;

import { Router } from 'express';
import { roomTwinController } from '../controllers/room-twin.controller';

const router = Router();

// Room Twin routes
router.post('/', roomTwinController.createRoomTwin.bind(roomTwinController));
router.get('/:id', roomTwinController.getRoomTwin.bind(roomTwinController));
router.get('/:id/status', roomTwinController.getRoomStatus.bind(roomTwinController));
router.put('/:id/iot', roomTwinController.updateIoTState.bind(roomTwinController));
router.put('/:id/status', roomTwinController.updateRoomStatus.bind(roomTwinController));
router.put('/:id/assign', roomTwinController.assignGuest.bind(roomTwinController));
router.put('/:id/vacate', roomTwinController.vacateRoom.bind(roomTwinController));
router.get('/:id/availability', roomTwinController.getRoomAvailability.bind(roomTwinController));
router.delete('/:id', roomTwinController.deleteRoomTwin.bind(roomTwinController));

export default router;

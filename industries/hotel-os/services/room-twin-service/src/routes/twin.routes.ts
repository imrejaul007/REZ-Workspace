import { Router } from 'express';
import { roomTwinController } from '../controllers/room-twin.controller';

const router = Router();

// Room Twin routes
router.post('/room', (req, res) => roomTwinController.createRoomTwin(req, res));
router.get('/room/:id', (req, res) => roomTwinController.getRoomTwin(req, res));
router.get('/room/:id/status', (req, res) => roomTwinController.getRoomStatus(req, res));
router.put('/room/:id', (req, res) => roomTwinController.updateRoomTwin(req, res));
router.post('/room/:id/checkin', (req, res) => roomTwinController.checkInGuest(req, res));
router.post('/room/:id/checkout', (req, res) => roomTwinController.checkOutGuest(req, res));
router.get('/room/property/:propertyId', (req, res) => roomTwinController.getRoomsByProperty(req, res));
router.get('/room/property/:propertyId/available', (req, res) => roomTwinController.getAvailableRooms(req, res));
router.get('/room/property/:propertyId/stats', (req, res) => roomTwinController.getRoomStats(req, res));
router.post('/room/:id/maintenance', (req, res) => roomTwinController.addMaintenanceIssue(req, res));
router.post('/room/:id/iot/command', (req, res) => roomTwinController.sendIoTCommand(req, res));

export default router;

import { Router } from 'express';
import { guestTwinController } from '../controllers/guest-twin.controller';

const router = Router();

// Guest Twin routes
router.post('/guest', (req, res) => guestTwinController.createGuestTwin(req, res));
router.get('/guest/:id', (req, res) => guestTwinController.getGuestTwin(req, res));
router.get('/guest/:id/full', (req, res) => guestTwinController.getGuestTwinWithMemory(req, res));
router.put('/guest/:id/preferences', (req, res) => guestTwinController.updateGuestPreferences(req, res));
router.post('/guest/:id/stay', (req, res) => guestTwinController.addStayHistory(req, res));
router.post('/guest/:id/feedback', (req, res) => guestTwinController.addStayFeedback(req, res));
router.get('/guest/:id/loyalty', (req, res) => guestTwinController.getGuestLoyalty(req, res));
router.get('/guest/:id/room-preferences', (req, res) => guestTwinController.getRoomPreferences(req, res));
router.get('/guest/top/loyalty', (req, res) => guestTwinController.getTopLoyaltyGuests(req, res));
router.get('/guest/sentiment/:minScore/:maxScore', (req, res) => guestTwinController.getGuestsBySentiment(req, res));

export default router;

import { Router } from 'express';
import { guestTwinController } from '../controllers/guest-twin.controller';

const router = Router();

// Guest Twin routes
router.post('/', guestTwinController.createGuestTwin.bind(guestTwinController));
router.get('/:id', guestTwinController.getGuestTwin.bind(guestTwinController));
router.put('/:id/preferences', guestTwinController.updatePreferences.bind(guestTwinController));
router.put('/:id/stay', guestTwinController.updateCurrentStay.bind(guestTwinController));
router.put('/:id/sentiment', guestTwinController.updateSentiment.bind(guestTwinController));
router.put('/:id/loyalty', guestTwinController.updateLoyalty.bind(guestTwinController));
router.get('/:id/upsell-eligibility', guestTwinController.getUpsellEligibility.bind(guestTwinController));
router.delete('/:id', guestTwinController.deleteGuestTwin.bind(guestTwinController));

export default router;

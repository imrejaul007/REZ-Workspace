import { Router } from 'express';
import { optOutController } from '../controllers';

const router = Router();

// Opt out
router.post(
  '/',
  optOutController.optOut.bind(optOutController)
);

// Opt back in
router.delete(
  '/:userId/:channel',
  optOutController.optIn.bind(optOutController)
);

// Check opt-out status
router.get(
  '/check/:userId/:channel',
  optOutController.check.bind(optOutController)
);

// Get user's all opt-outs
router.get(
  '/user/:userId',
  optOutController.getUserOptOuts.bind(optOutController)
);

// Global opt-out
router.post(
  '/global',
  optOutController.globalOptOut.bind(optOutController)
);

// Check global opt-out
router.get(
  '/global/check',
  optOutController.checkGlobal.bind(optOutController)
);

export default router;

import { Router } from 'express';
import {
  startOnboardingHandler,
  getOnboardingHandler,
  getOnboardingByEmployeeHandler,
  getActiveOnboardingHandler,
  listOnboardingsHandler,
  completeTaskHandler,
  addNoteHandler,
  cancelOnboardingHandler,
  getOnboardingStatsHandler
} from '../controllers/onboardingController';

const router = Router();

// POST /api/onboarding/start - Start onboarding
router.post('/start', startOnboardingHandler);

// GET /api/onboarding - List all onboardings
router.get('/', listOnboardingsHandler);

// GET /api/onboarding/stats - Get onboarding statistics
router.get('/stats', getOnboardingStatsHandler);

// GET /api/onboarding/active - Get active onboarding for current user
router.get('/active', getActiveOnboardingHandler);

// GET /api/onboarding/employee/:employeeId - Get by employee
router.get('/employee/:employeeId', getOnboardingByEmployeeHandler);

// GET /api/onboarding/:id - Get by ID
router.get('/:id', getOnboardingHandler);

// PATCH /api/onboarding/:id/task/:taskId - Complete task
router.patch('/:id/task/:taskId', completeTaskHandler);

// POST /api/onboarding/:id/notes - Add note
router.post('/:id/notes', addNoteHandler);

// POST /api/onboarding/:id/cancel - Cancel onboarding
router.post('/:id/cancel', cancelOnboardingHandler);

export default router;

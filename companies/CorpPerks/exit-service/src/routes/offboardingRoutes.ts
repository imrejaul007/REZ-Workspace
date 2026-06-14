import { Router } from 'express';
import {
  startOffboardingHandler,
  getOffboardingHandler,
  getByEmployeeHandler,
  getActiveHandler,
  listOffboardingsHandler,
  completeTaskHandler,
  updateClearanceHandler,
  addNoteHandler,
  cancelOffboardingHandler,
  getStatsHandler
} from '../controllers/offboardingController';

const router = Router();

// POST /api/offboarding/start - Start offboarding
router.post('/start', startOffboardingHandler);

// GET /api/offboarding/stats - Get statistics
router.get('/stats', getStatsHandler);

// GET /api/offboarding - List all offboardings
router.get('/', listOffboardingsHandler);

// GET /api/offboarding/active - Get active for current user
router.get('/active', getActiveHandler);

// GET /api/offboarding/employee/:employeeId - Get by employee
router.get('/employee/:employeeId', getByEmployeeHandler);

// GET /api/offboarding/:id - Get by ID
router.get('/:id', getOffboardingHandler);

// PATCH /api/offboarding/:id/task/:taskId - Complete task
router.patch('/:id/task/:taskId', completeTaskHandler);

// PATCH /api/offboarding/:id/clearance - Update clearance
router.patch('/:id/clearance', updateClearanceHandler);

// POST /api/offboarding/:id/notes - Add note
router.post('/:id/notes', addNoteHandler);

// POST /api/offboarding/:id/cancel - Cancel offboarding
router.post('/:id/cancel', cancelOffboardingHandler);

export default router;

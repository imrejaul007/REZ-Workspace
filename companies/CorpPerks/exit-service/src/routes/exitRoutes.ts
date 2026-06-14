import { Router } from 'express';
import {
  getQuestionsHandler,
  scheduleInterviewHandler,
  getInterviewHandler,
  getByEmployeeHandler,
  listInterviewsHandler,
  submitResponsesHandler,
  completeInterviewHandler,
  cancelInterviewHandler,
  markNoShowHandler,
  submitFeedbackHandler,
  getFeedbackHandler,
  getAnalyticsHandler
} from '../controllers/exitController';

const router = Router();

// GET /api/exit/questions - Get standard questions
router.get('/questions', getQuestionsHandler);

// GET /api/exit/analytics - Get analytics
router.get('/analytics', getAnalyticsHandler);

// POST /api/exit/interview - Schedule interview
router.post('/interview', scheduleInterviewHandler);

// GET /api/exit - List all interviews
router.get('/', listInterviewsHandler);

// GET /api/exit/employee/:employeeId - Get by employee
router.get('/employee/:employeeId', getByEmployeeHandler);

// GET /api/exit/interview/:interviewId - Get by ID
router.get('/interview/:interviewId', getInterviewHandler);

// POST /api/exit/:id/responses - Submit responses
router.post('/:id/responses', submitResponsesHandler);

// POST /api/exit/:id/complete - Complete interview
router.post('/:id/complete', completeInterviewHandler);

// POST /api/exit/:id/cancel - Cancel interview
router.post('/:id/cancel', cancelInterviewHandler);

// POST /api/exit/:id/no-show - Mark no-show
router.post('/:id/no-show', markNoShowHandler);

// POST /api/exit/:id/feedback - Submit feedback
router.post('/:id/feedback', submitFeedbackHandler);

// GET /api/exit/:id/feedback - Get feedback
router.get('/:id/feedback', getFeedbackHandler);

export default router;

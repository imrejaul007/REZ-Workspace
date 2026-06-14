import { Router, Request, Response } from 'express';
import { consultationCopilotService } from '../services/consultationCopilotService.js';
import {
  ScheduleConsultationRequestSchema,
  RecordPostVisitRequestSchema,
  CreateFollowUpTasksRequestSchema,
  GenerateQuestionsRequestSchema,
  ApiResponse,
  Consultation,
  ConsultationBrief,
  FollowUpTask,
  PostVisitNotes,
  PreVisitSummary,
  Question,
  TaskStatus,
} from '../models/consultationCopilot.js';

const router = Router();

// Helper to extract userId from header (in production, this would come from auth middleware)
const getUserId = (req: Request): string => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    throw new Error('User ID is required in x-user-id header');
  }
  return userId;
};

// Helper for API responses
const successResponse = <T>(res: Response, data: T, status = 200) => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  return res.status(status).json(response);
};

const errorResponse = (res: Response, error: string, status = 400) => {
  const response: ApiResponse<null> = {
    success: false,
    error,
  };
  return res.status(status).json(response);
};

// ==================== CONSULTATION ROUTES ====================

/**
 * POST /api/consultations
 * Schedule a new consultation
 */
router.post('/api/consultations', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const validatedData = ScheduleConsultationRequestSchema.parse(req.body);
    const consultation = await consultationCopilotService.scheduleConsultation(userId, validatedData);
    return successResponse(res, consultation, 201);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
    return errorResponse(res, 'Failed to schedule consultation');
  }
});

/**
 * GET /api/consultations/upcoming
 * Get all upcoming consultations
 */
router.get('/api/consultations/upcoming', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const consultations = await consultationCopilotService.getUpcomingConsultations(userId);
    return successResponse(res, consultations);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
    return errorResponse(res, 'Failed to get upcoming consultations');
  }
});

/**
 * GET /api/consultations/history
 * Get consultation history (past visits)
 */
router.get('/api/consultations/history', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const limit = parseInt(req.query['limit'] as string) || 20;
    const offset = parseInt(req.query['offset'] as string) || 0;
    const result = await consultationCopilotService.getConsultationHistory(userId, limit, offset);
    return successResponse(res, result);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
    return errorResponse(res, 'Failed to get consultation history');
  }
});

/**
 * GET /api/consultations/:consultationId/brief
 * Get full consultation brief
 */
router.get('/api/consultations/:consultationId/brief', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { consultationId } = req.params;
    const brief = await consultationCopilotService.generateConsultationBrief(userId, consultationId);
    return successResponse(res, brief);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
    return errorResponse(res, 'Failed to get consultation brief');
  }
});

/**
 * POST /api/consultations/:consultationId/cancel
 * Cancel a consultation
 */
router.post('/api/consultations/:consultationId/cancel', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { consultationId } = req.params;
    const consultation = await consultationCopilotService.cancelConsultation(userId, consultationId);
    return successResponse(res, consultation);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
    return errorResponse(res, 'Failed to cancel consultation');
  }
});

// ==================== PRE-VISIT SUMMARY ROUTES ====================

/**
 * POST /api/consultations/:consultationId/pre-visit
 * Generate pre-visit summary
 */
router.post('/api/consultations/:consultationId/pre-visit', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { consultationId } = req.params;
    const summary = await consultationCopilotService.generatePreVisitSummary(userId, consultationId);
    return successResponse(res, summary, 201);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
    return errorResponse(res, 'Failed to generate pre-visit summary');
  }
});

/**
 * GET /api/consultations/:consultationId/pre-visit
 * Get pre-visit summary
 */
router.get('/api/consultations/:consultationId/pre-visit', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { consultationId } = req.params;
    const brief = await consultationCopilotService.generateConsultationBrief(userId, consultationId);
    if (!brief.preVisitSummary) {
      return errorResponse(res, 'Pre-visit summary not found', 404);
    }
    return successResponse(res, brief.preVisitSummary);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
    return errorResponse(res, 'Failed to get pre-visit summary');
  }
});

// ==================== QUESTIONS ROUTES ====================

/**
 * POST /api/consultations/:consultationId/questions
 * Generate questions to ask during consultation
 */
router.post('/api/consultations/:consultationId/questions', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { consultationId } = req.params;
    const validatedData = GenerateQuestionsRequestSchema.parse(req.body ?? {});
    const questions = await consultationCopilotService.generateQuestions(userId, consultationId, validatedData);
    return successResponse(res, questions, 201);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
    return errorResponse(res, 'Failed to generate questions');
  }
});

/**
 * GET /api/consultations/:consultationId/questions
 * Get all questions for a consultation
 */
router.get('/api/consultations/:consultationId/questions', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { consultationId } = req.params;
    const brief = await consultationCopilotService.generateConsultationBrief(userId, consultationId);
    return successResponse(res, brief.questions);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
    return errorResponse(res, 'Failed to get questions');
  }
});

/**
 * PATCH /api/questions/:questionId
 * Update a question (mark as asked, add answer)
 */
router.patch('/api/questions/:questionId', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { questionId } = req.params;
    const { isAsked, answer, notes } = req.body;
    const question = await consultationCopilotService.updateQuestion(userId, questionId, {
      isAsked,
      answer,
      notes,
    });
    return successResponse(res, question);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
    return errorResponse(res, 'Failed to update question');
  }
});

// ==================== POST-VISIT ROUTES ====================

/**
 * POST /api/consultations/:consultationId/post-visit
 * Record post-visit notes
 */
router.post('/api/consultations/:consultationId/post-visit', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { consultationId } = req.params;
    const validatedData = RecordPostVisitRequestSchema.parse(req.body);
    const postVisitNotes = await consultationCopilotService.recordPostVisit(userId, consultationId, validatedData);
    return successResponse(res, postVisitNotes, 201);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
    return errorResponse(res, 'Failed to record post-visit notes');
  }
});

/**
 * GET /api/consultations/:consultationId/post-visit
 * Get post-visit notes
 */
router.get('/api/consultations/:consultationId/post-visit', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { consultationId } = req.params;
    const brief = await consultationCopilotService.generateConsultationBrief(userId, consultationId);
    if (!brief.postVisitNotes) {
      return errorResponse(res, 'Post-visit notes not found', 404);
    }
    return successResponse(res, brief.postVisitNotes);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
    return errorResponse(res, 'Failed to get post-visit notes');
  }
});

// ==================== FOLLOW-UP TASKS ROUTES ====================

/**
 * POST /api/consultations/:consultationId/follow-ups
 * Create follow-up tasks
 */
router.post('/api/consultations/:consultationId/follow-ups', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { consultationId } = req.params;
    const validatedData = CreateFollowUpTasksRequestSchema.parse(req.body);
    const tasks = await consultationCopilotService.createFollowUpTasks(userId, consultationId, validatedData);
    return successResponse(res, tasks, 201);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
    return errorResponse(res, 'Failed to create follow-up tasks');
  }
});

/**
 * GET /api/follow-ups
 * Get all follow-up tasks for user
 */
router.get('/api/follow-ups', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const status = req.query['status'] as TaskStatus | undefined;
    const upcoming = req.query['upcoming'] === 'true';
    const tasks = await consultationCopilotService.getFollowUpTasks(userId, { status, upcoming });
    return successResponse(res, tasks);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
    return errorResponse(res, 'Failed to get follow-up tasks');
  }
});

/**
 * GET /api/consultations/:consultationId/follow-ups
 * Get follow-up tasks for a specific consultation
 */
router.get('/api/consultations/:consultationId/follow-ups', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { consultationId } = req.params;
    const brief = await consultationCopilotService.generateConsultationBrief(userId, consultationId);
    return successResponse(res, brief.followUpTasks);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
    return errorResponse(res, 'Failed to get follow-up tasks');
  }
});

/**
 * PATCH /api/follow-ups/:taskId
 * Update follow-up task status
 */
router.patch('/api/follow-ups/:taskId', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { taskId } = req.params;
    const { status } = req.body;
    const completedAt = status === 'completed' ? new Date().toISOString() : undefined;
    const task = await consultationCopilotService.updateFollowUpTask(userId, taskId, {
      status,
      completedAt,
    });
    return successResponse(res, task);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
    return errorResponse(res, 'Failed to update follow-up task');
  }
});

// ==================== HEALTH CHECK ====================

router.get('/health', (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: {
      service: 'myrisa-consultation-copilot',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;

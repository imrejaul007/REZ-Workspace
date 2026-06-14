import { Request, Response, NextFunction } from 'express';
import {
  scheduleInterview,
  getInterviewById,
  getInterviewsByEmployee,
  listInterviews,
  submitResponses,
  completeInterview,
  cancelInterview,
  markNoShow,
  submitFeedback,
  getFeedbackByInterview,
  getExitAnalytics,
  EXIT_INTERVIEW_QUESTIONS
} from '../services/exitService';
import {
  ScheduleInterviewSchema,
  SubmitFeedbackSchema,
  SubmitInterviewResponsesSchema,
  CompleteInterviewSchema,
  ListExitQuerySchema
} from '../utils/validators';

/**
 * Get exit interview questions
 * GET /api/exit/questions
 */
export async function getQuestionsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.json({
      success: true,
      data: EXIT_INTERVIEW_QUESTIONS
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Schedule an exit interview
 * POST /api/exit/interview
 */
export async function scheduleInterviewHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = ScheduleInterviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten()
      });
      return;
    }

    const createdBy = (req.headers['x-user-id'] as string) || 'system';
    const interview = await scheduleInterview(parsed.data, createdBy);

    res.status(201).json({
      success: true,
      data: interview
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get interview by ID
 * GET /api/exit/interview/:interviewId
 */
export async function getInterviewHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { interviewId } = req.params;
    const interview = await getInterviewById(interviewId);

    if (!interview) {
      res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
      return;
    }

    res.json({
      success: true,
      data: interview
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get interviews by employee ID
 * GET /api/exit/employee/:employeeId
 */
export async function getByEmployeeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { employeeId } = req.params;
    const interviews = await getInterviewsByEmployee(employeeId);

    res.json({
      success: true,
      data: interviews
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List all interviews with filters
 * GET /api/exit
 */
export async function listInterviewsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = ListExitQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten()
      });
      return;
    }

    const result = await listInterviews(parsed.data);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Submit interview responses
 * POST /api/exit/:id/responses
 */
export async function submitResponsesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const parsed = SubmitInterviewResponsesSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten()
      });
      return;
    }

    const interview = await submitResponses(id, parsed.data);

    if (!interview) {
      res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
      return;
    }

    res.json({
      success: true,
      data: interview
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already completed')) {
      res.status(409).json({
        success: false,
        error: error.message
      });
      return;
    }
    next(error);
  }
}

/**
 * Complete an interview
 * POST /api/exit/:id/complete
 */
export async function completeInterviewHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const parsed = CompleteInterviewSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten()
      });
      return;
    }

    const interview = await completeInterview(id, parsed.data);

    if (!interview) {
      res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
      return;
    }

    res.json({
      success: true,
      data: interview
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel an interview
 * POST /api/exit/:id/cancel
 */
export async function cancelInterviewHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const interview = await cancelInterview(id, reason);

    if (!interview) {
      res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
      return;
    }

    res.json({
      success: true,
      data: interview
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark interview as no-show
 * POST /api/exit/:id/no-show
 */
export async function markNoShowHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const interview = await markNoShow(id);

    if (!interview) {
      res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
      return;
    }

    res.json({
      success: true,
      data: interview
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Submit feedback
 * POST /api/exit/:id/feedback
 */
export async function submitFeedbackHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const parsed = SubmitFeedbackSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten()
      });
      return;
    }

    const employeeId = (req.headers['x-employee-id'] as string) || parsed.data.isAnonymous ? 'anonymous' : '';
    const feedback = await submitFeedback(id, employeeId, parsed.data);

    res.status(201).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get feedback for interview
 * GET /api/exit/:id/feedback
 */
export async function getFeedbackHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const feedback = await getFeedbackByInterview(id);

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get exit analytics
 * GET /api/exit/analytics
 */
export async function getAnalyticsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { department, fromDate, toDate } = req.query;

    const filters: {
      department?: string;
      fromDate?: Date;
      toDate?: Date;
    } = {};

    if (department) filters.department = department as string;
    if (fromDate) filters.fromDate = new Date(fromDate as string);
    if (toDate) filters.toDate = new Date(toDate as string);

    const analytics = await getExitAnalytics(filters);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
}

import { ExitInterview, ExitFeedback } from '../models';
import {
  ScheduleInterviewInput,
  SubmitFeedbackInput,
  SubmitInterviewResponsesInput,
  CompleteInterviewInput,
  ListExitQuery
} from '../utils/validators';
import { generateId, analyzeSentiment } from '../utils/helpers';

// Standard exit interview questions
export const EXIT_INTERVIEW_QUESTIONS = [
  {
    questionId: 'q1',
    question: 'What was your primary reason for leaving?',
    type: 'rating',
    required: true
  },
  {
    questionId: 'q2',
    question: 'How would you rate your relationship with your direct manager?',
    type: 'rating',
    required: true
  },
  {
    questionId: 'q3',
    question: 'How satisfied were you with the compensation and benefits?',
    type: 'rating',
    required: true
  },
  {
    questionId: 'q4',
    question: 'How would you rate the work-life balance?',
    type: 'rating',
    required: true
  },
  {
    questionId: 'q5',
    question: 'How satisfied were you with opportunities for career growth?',
    type: 'rating',
    required: true
  },
  {
    questionId: 'q6',
    question: 'What did you like most about working here?',
    type: 'text',
    required: false
  },
  {
    questionId: 'q7',
    question: 'What could we have done differently to keep you?',
    type: 'text',
    required: false
  },
  {
    questionId: 'q8',
    question: 'Would you recommend this company to others? Why or why not?',
    type: 'text',
    required: false
  },
  {
    questionId: 'q9',
    question: 'Any additional feedback or suggestions?',
    type: 'text',
    required: false
  }
];

/**
 * Schedule an exit interview
 */
export async function scheduleInterview(
  input: ScheduleInterviewInput,
  createdBy: string
): Promise<typeof ExitInterview> {
  const interview = new ExitInterview({
    interviewId: generateId('EXT'),
    ...input,
    status: 'scheduled',
    responses: [],
    createdBy
  });

  await interview.save();
  return interview;
}

/**
 * Get interview by ID
 */
export async function getInterviewById(interviewId: string): Promise<typeof ExitInterview | null> {
  return ExitInterview.findOne({ interviewId });
}

/**
 * Get interviews by employee ID
 */
export async function getInterviewsByEmployee(employeeId: string): Promise<typeof ExitInterview[]> {
  return ExitInterview.find({ employeeId }).sort({ createdAt: -1 });
}

/**
 * List interviews with filters
 */
export async function listInterviews(query: ListExitQuery) {
  const {
    employeeId,
    department,
    managerId,
    type,
    status,
    fromDate,
    toDate,
    page,
    limit
  } = query;

  const filter: Record<string, unknown> = {};
  if (employeeId) filter.employeeId = employeeId;
  if (department) filter.department = department;
  if (managerId) filter.managerId = managerId;
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (fromDate || toDate) {
    filter.lastWorkingDay = {};
    if (fromDate) (filter.lastWorkingDay as Record<string, Date>).$gte = new Date(fromDate);
    if (toDate) (filter.lastWorkingDay as Record<string, Date>).$lte = new Date(toDate);
  }

  const [interviews, total] = await Promise.all([
    ExitInterview.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ExitInterview.countDocuments(filter)
  ]);

  return {
    items: interviews,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Submit interview responses
 */
export async function submitResponses(
  interviewId: string,
  input: SubmitInterviewResponsesInput
): Promise<typeof ExitInterview | null> {
  const interview = await ExitInterview.findOne({ interviewId });
  if (!interview) return null;

  if (interview.status === 'completed') {
    throw new Error('Interview already completed');
  }

  interview.responses = input.responses;
  interview.status = 'in_progress';

  if (input.overallRating) {
    interview.overallRating = input.overallRating;
  }

  await interview.save();
  return interview;
}

/**
 * Complete an interview
 */
export async function completeInterview(
  interviewId: string,
  input: CompleteInterviewInput
): Promise<typeof ExitInterview | null> {
  const interview = await ExitInterview.findOne({ interviewId });
  if (!interview) return null;

  interview.status = 'completed';
  interview.completedDate = new Date();

  if (input.overallRating) {
    interview.overallRating = input.overallRating;
  }

  if (input.notes) {
    interview.responses.push({
      questionId: 'final_notes',
      question: 'Final Notes',
      answer: input.notes
    });
  }

  await interview.save();
  return interview;
}

/**
 * Cancel an interview
 */
export async function cancelInterview(interviewId: string, reason?: string): Promise<typeof ExitInterview | null> {
  const interview = await ExitInterview.findOne({ interviewId });
  if (!interview) return null;

  interview.status = 'cancelled';
  await interview.save();
  return interview;
}

/**
 * Mark interview as no-show
 */
export async function markNoShow(interviewId: string): Promise<typeof ExitInterview | null> {
  const interview = await ExitInterview.findOne({ interviewId });
  if (!interview) return null;

  interview.status = 'no_show';
  await interview.save();
  return interview;
}

/**
 * Submit feedback for an interview
 */
export async function submitFeedback(
  interviewId: string,
  employeeId: string,
  input: SubmitFeedbackInput
): Promise<typeof ExitFeedback> {
  const feedback = new ExitFeedback({
    feedbackId: generateId('FDB'),
    interviewId,
    employeeId,
    category: input.category,
    feedbackType: input.feedbackType,
    content: input.content,
    isAnonymous: input.isAnonymous,
    sentiment: analyzeSentiment(input.content)
  });

  await feedback.save();
  return feedback;
}

/**
 * Get feedback for an interview
 */
export async function getFeedbackByInterview(interviewId: string): Promise<typeof ExitFeedback[]> {
  return ExitFeedback.find({ interviewId }).sort({ createdAt: -1 });
}

/**
 * Get all feedback for analytics
 */
export async function getAllFeedback(filters?: {
  department?: string;
  category?: string;
  sentiment?: string;
}) {
  const filter: Record<string, unknown> = {};
  if (filters?.department) filter.department = filters.department;
  if (filters?.category) filter.category = filters.category;
  if (filters?.sentiment) filter.sentiment = filters.sentiment;

  return ExitFeedback.find(filter).sort({ createdAt: -1 });
}

/**
 * Get exit analytics
 */
export async function getExitAnalytics(filters?: {
  department?: string;
  fromDate?: Date;
  toDate?: Date;
}) {
  const filter: Record<string, unknown> = {};
  if (filters?.department) filter.department = filters.department;
  if (filters?.fromDate || filters?.toDate) {
    filter.lastWorkingDay = {};
    if (filters.fromDate) (filter.lastWorkingDay as Record<string, Date>).$gte = filters.fromDate;
    if (filters.toDate) (filter.lastWorkingDay as Record<string, Date>).$lte = filters.toDate;
  }

  const interviews = await ExitInterview.find(filter);

  const analytics = {
    total: interviews.length,
    byType: {
      resignation: interviews.filter(i => i.type === 'resignation').length,
      termination: interviews.filter(i => i.type === 'termination').length,
      retirement: interviews.filter(i => i.type === 'retirement').length,
      contract_end: interviews.filter(i => i.type === 'contract_end').length
    },
    byStatus: {
      scheduled: interviews.filter(i => i.status === 'scheduled').length,
      completed: interviews.filter(i => i.status === 'completed').length,
      cancelled: interviews.filter(i => i.status === 'cancelled').length,
      no_show: interviews.filter(i => i.status === 'no_show').length
    },
    avgRating: 0,
    responseRate: 0
  };

  const completedWithRating = interviews.filter(i => i.overallRating);
  if (completedWithRating.length > 0) {
    analytics.avgRating = Math.round(
      completedWithRating.reduce((sum, i) => sum + (i.overallRating || 0), 0) / completedWithRating.length
    );
  }

  const completed = interviews.filter(i => i.status === 'completed').length;
  if (interviews.length > 0) {
    analytics.responseRate = Math.round((completed / interviews.length) * 100);
  }

  return analytics;
}

/**
 * REZ Atlas v2 - Qualification Agent
 * BANT/MEDDIC Lead Qualification
 * Production-ready with MongoDB, Winston logging, and security middleware
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { connectDatabase, disconnectDatabase } from './database.js';
import { logger } from './utils/logger.js';
import { securityMiddleware } from './middleware/security.js';
import { errorHandler, notFoundHandler, asyncHandler, NotFoundError, sendSuccess } from './middleware/errorHandler.js';
import { Qualification, Question, IQuestion, IQualification } from './models/Qualification.js';

const app = express();
const PORT = process.env.PORT || 5175;

// Default questions for BANT qualification
const defaultQuestions: IQuestion[] = [
  { id: '1', category: 'budget', question: 'Do you have budget allocated for this solution?', type: 'yes_no', weight: 25 },
  { id: '2', category: 'budget', question: 'What is your monthly/annual budget for this?', type: 'text', weight: 15 },
  { id: '3', category: 'authority', question: 'Are you the decision maker?', type: 'yes_no', weight: 25 },
  { id: '4', category: 'authority', question: 'Who else is involved in this decision?', type: 'text', weight: 10 },
  { id: '5', category: 'need', question: 'What specific problem are you trying to solve?', type: 'text', weight: 30 },
  { id: '6', category: 'need', question: 'How is this affecting your business?', type: 'text', weight: 15 },
  { id: '7', category: 'timeline', question: 'When do you want to implement a solution?', type: 'text', weight: 25 },
  { id: '8', category: 'timeline', question: 'Is this urgent or can it wait?', type: 'scale', weight: 15 }
];

// Middleware
app.use(express.json());
app.use(securityMiddleware);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      requestId: (req as any).requestId
    });
  });
  next();
});

// ================================================
// Health Check Endpoints
// ================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'atlas-qualification-agent',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

app.get('/health/ready', async (req, res) => {
  try {
    // Check database connection
    const count = await Qualification.countDocuments().maxTimeMS(2000);
    res.json({ status: 'ready', database: 'connected', documents: count });
  } catch (error) {
    res.status(503).json({ status: 'not ready', database: 'disconnected' });
  }
});

// ================================================
// Qualification Questions API
// ================================================
app.get('/api/questions', asyncHandler(async (req, res) => {
  const { category } = req.query;

  let questions = defaultQuestions;
  if (category) {
    questions = defaultQuestions.filter(q => q.category === category);
  }

  sendSuccess(res, { questions, count: questions.length }, 'Questions retrieved');
}));

// ================================================
// Qualification API
// ================================================
app.post('/api/qualify', asyncHandler(async (req, res) => {
  const { leadId, leadName, companyName, method = 'BANT' } = req.body;

  if (!leadId) {
    throw new ValidationError('leadId is required');
  }

  const qualification = new Qualification({
    leadId,
    leadName: leadName || 'Unknown',
    companyName: companyName || 'Unknown',
    method,
    status: 'qualifying',
    budget: { score: 0, notes: '' },
    authority: { score: 0, notes: '' },
    need: { score: 0, notes: '' },
    timeline: { score: 0, notes: '' },
    score: 0,
    grade: 'D',
    recommendation: 'nurture',
    nextSteps: [],
    disqualifyReason: null,
    questions: defaultQuestions,
    answers: {},
    qualifiedAt: null
  });

  await qualification.save();

  logger.info('Qualification started', { qualificationId: qualification._id, leadId, method });

  res.status(201).json({
    success: true,
    qualificationId: qualification._id,
    questions: defaultQuestions
  });
}));

app.post('/api/qualify/:id/answer', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { questionId, answer } = req.body;

  if (!questionId || answer === undefined) {
    throw new ValidationError('questionId and answer are required');
  }

  const qualification = await Qualification.findById(id);
  if (!qualification) {
    throw new NotFoundError('Qualification');
  }

  // Store the answer
  qualification.answers[questionId] = answer;

  // Score based on answer
  const question = defaultQuestions.find(q => q.id === questionId);
  if (question) {
    const category = question.category as 'budget' | 'authority' | 'need' | 'timeline';
    let score = 0;
    let notes = '';

    if (question.type === 'yes_no') {
      score = answer === 'yes' ? 100 : 0;
      notes = answer === 'yes' ? 'Confirmed' : 'Not confirmed';
    } else if (question.type === 'scale') {
      score = Number(answer) * 10;
    } else {
      score = answer.length > 20 ? 80 : 40;
      notes = String(answer).slice(0, 100);
    }

    qualification[category].score = Math.min(100, qualification[category].score + score * (question.weight / 100));
    qualification[category].notes = notes;
  }

  // Check if all questions answered
  if (Object.keys(qualification.answers).length === defaultQuestions.length) {
    completeQualification(qualification);
  }

  await qualification.save();

  res.json({
    success: true,
    data: qualification
  });
}));

app.get('/api/qualify/:id', asyncHandler(async (req, res) => {
  const qualification = await Qualification.findById(req.params.id);
  if (!qualification) {
    throw new NotFoundError('Qualification');
  }
  sendSuccess(res, qualification, 'Qualification retrieved');
}));

// ================================================
// Leads API
// ================================================
app.get('/api/leads', asyncHandler(async (req, res) => {
  const { grade, recommendation, limit = 100 } = req.query;

  const query: any = {};
  if (grade) query.grade = grade;
  if (recommendation) query.recommendation = recommendation;

  const leads = await Qualification.find(query)
    .sort({ score: -1 })
    .limit(Number(limit));

  sendSuccess(res, { leads, count: leads.length }, 'Leads retrieved');
}));

// ================================================
// Analytics API
// ================================================
app.get('/api/analytics', asyncHandler(async (req, res) => {
  const stats = await Qualification.aggregate([
    {
      $group: {
        _id: null,
        totalLeads: { $sum: 1 },
        qualified: { $sum: { $cond: [{ $eq: ['$status', 'qualified'] }, 1, 0] } },
        disqualified: { $sum: { $cond: [{ $eq: ['$status', 'disqualified'] }, 1, 0] } },
        avgScore: { $avg: '$score' },
        gradeA: { $sum: { $cond: [{ $eq: ['$grade', 'A'] }, 1, 0] } },
        gradeB: { $sum: { $cond: [{ $eq: ['$grade', 'B'] }, 1, 0] } },
        gradeC: { $sum: { $cond: [{ $eq: ['$grade', 'C'] }, 1, 0] } },
        gradeD: { $sum: { $cond: [{ $eq: ['$grade', 'D'] }, 1, 0] } },
        hot: { $sum: { $cond: [{ $eq: ['$recommendation', 'hot'] }, 1, 0] } },
        warm: { $sum: { $cond: [{ $eq: ['$recommendation', 'warm'] }, 1, 0] } },
        cold: { $sum: { $cond: [{ $eq: ['$recommendation', 'cold'] }, 1, 0] } },
        nurture: { $sum: { $cond: [{ $eq: ['$recommendation', 'nurture'] }, 1, 0] } },
      }
    }
  ]);

  const result = stats[0] || {
    totalLeads: 0,
    qualified: 0,
    disqualified: 0,
    avgScore: 0,
    gradeA: 0, gradeB: 0, gradeC: 0, gradeD: 0,
    hot: 0, warm: 0, cold: 0, nurture: 0
  };

  res.json({
    success: true,
    data: {
      totalLeads: result.totalLeads,
      qualified: result.qualified,
      disqualified: result.disqualified,
      avgScore: Math.round(result.avgScore) || 0,
      byGrade: { A: result.gradeA, B: result.gradeB, C: result.gradeC, D: result.gradeD },
      byRecommendation: { hot: result.hot, warm: result.warm, cold: result.cold, nurture: result.nurture }
    }
  });
}));

// ================================================
// Helper Functions
// ================================================
function completeQualification(q: IQualification) {
  // Calculate overall score
  q.score = Math.round(
    (q.budget.score * 0.25) +
    (q.authority.score * 0.25) +
    (q.need.score * 0.30) +
    (q.timeline.score * 0.20)
  );

  // Assign grade
  if (q.score >= 80) q.grade = 'A';
  else if (q.score >= 60) q.grade = 'B';
  else if (q.score >= 40) q.grade = 'C';
  else q.grade = 'D';

  // Recommendation
  if (q.score >= 70) {
    q.recommendation = 'hot';
    q.status = 'qualified';
    q.nextSteps = ['Schedule demo immediately', 'Send case studies', 'Prepare proposal'];
  } else if (q.score >= 50) {
    q.recommendation = 'warm';
    q.status = 'qualified';
    q.nextSteps = ['Send intro email', 'Add to nurture sequence', 'Schedule check-in call'];
  } else if (q.score >= 30) {
    q.recommendation = 'cold';
    q.status = 'qualified';
    q.nextSteps = ['Add to email sequence', 'Re-engage in 3 months'];
  } else {
    q.recommendation = 'nurture';
    q.status = 'disqualified';
    q.disqualifyReason = q.budget.score < 30 ? 'No budget' : q.authority.score < 30 ? 'Not decision maker' : 'Low need';
    q.nextSteps = ['Keep in long-term nurture', 'Update in 6 months'];
  }

  q.qualifiedAt = new Date();
  logger.info('Qualification completed', { qualificationId: q._id, score: q.score, grade: q.grade, recommendation: q.recommendation });
}

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// ================================================
// Server Start
// ================================================
async function startServer() {
  try {
    await connectDatabase();
    logger.info('Database connected, starting server...');

    app.listen(PORT, () => {
      logger.info(`🎯 Atlas Qualification Agent running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        mongodb: process.env.MONGODB_URI ? 'connected' : 'not configured'
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await disconnectDatabase();
  process.exit(0);
});

startServer();

export default app;
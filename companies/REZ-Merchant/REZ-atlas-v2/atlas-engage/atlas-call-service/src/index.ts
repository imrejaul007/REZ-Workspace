/**
 * REZ Atlas v2 - Call Service
 * Call Task Management & Logging
 * Production-ready with MongoDB, Winston logging, and security middleware
 */

import express from 'express';
import { connectDatabase, disconnectDatabase, logger } from './database.js';
import { securityMiddleware } from './middleware/security.js';
import { errorHandler, notFoundHandler, asyncHandler, NotFoundError, sendSuccess, ValidationError } from './middleware/errorHandler.js';
import { CallTask, CallLog } from './models/Call.js';

const app = express();
const PORT = process.env.PORT || 5164;

// Middleware
app.use(express.json());
app.use(securityMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('Request completed', { method: req.method, path: req.path, statusCode: res.statusCode, duration: Date.now() - start, requestId: (req as any).requestId });
  });
  next();
});

// ================================================
// Health Check Endpoints
// ================================================
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'atlas-call-service', version: '2.0.0', timestamp: new Date().toISOString() }));
app.get('/health/live', (req, res) => res.json({ status: 'alive' }));
app.get('/health/ready', async (req, res) => {
  try {
    const count = await CallTask.countDocuments().maxTimeMS(2000);
    res.json({ status: 'ready', database: 'connected', documents: count });
  } catch (error) {
    res.status(503).json({ status: 'not ready', database: 'disconnected' });
  }
});

// ================================================
// Call Tasks API
// ================================================
app.post('/api/tasks', asyncHandler(async (req, res) => {
  const { contactId, contactName, phone, purpose, scheduledAt } = req.body;
  if (!contactId || !contactName || !phone) throw new ValidationError('contactId, contactName, and phone are required');

  const task = new CallTask({
    contactId, contactName, phone,
    purpose: purpose || 'General',
    scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
    status: 'scheduled',
    outcome: null,
    notes: null,
    duration: null,
    recording: null
  });
  await task.save();
  logger.info('Call task created', { taskId: task._id, contactId });
  res.status(201).json({ success: true, data: task });
}));

app.get('/api/tasks', asyncHandler(async (req, res) => {
  const { status, date } = req.query;
  const query: any = {};
  if (status) query.status = status;
  if (date) query.scheduledAt = { $regex: `^${date}` };

  const tasks = await CallTask.find(query).sort({ scheduledAt: 1 });
  sendSuccess(res, { tasks, count: tasks.length }, 'Tasks retrieved');
}));

app.patch('/api/tasks/:id', asyncHandler(async (req, res) => {
  const task = await CallTask.findById(req.params.id);
  if (!task) throw new NotFoundError('Call Task');

  Object.assign(task, req.body);
  await task.save();
  sendSuccess(res, task, 'Task updated');
}));

app.post('/api/tasks/:id/complete', asyncHandler(async (req, res) => {
  const task = await CallTask.findById(req.params.id);
  if (!task) throw new NotFoundError('Call Task');

  const { outcome, notes, duration, status } = req.body;
  task.status = status || 'completed';
  task.outcome = outcome || null;
  task.notes = notes || null;
  task.duration = duration || null;
  await task.save();

  logger.info('Call task completed', { taskId: task._id, outcome });
  sendSuccess(res, task, 'Task completed');
}));

// ================================================
// Call Logs API
// ================================================
app.post('/api/logs', asyncHandler(async (req, res) => {
  const { taskId, contactId, direction, startTime, duration, status } = req.body;
  if (!contactId || !direction || !status) throw new ValidationError('contactId, direction, and status are required');

  const log = new CallLog({
    taskId: taskId || '',
    contactId,
    direction,
    startTime: startTime ? new Date(startTime) : new Date(),
    endTime: new Date(),
    duration: duration || 0,
    status
  });
  await log.save();
  logger.info('Call log created', { logId: log._id, contactId });
  res.status(201).json({ success: true, data: log });
}));

app.get('/api/logs', asyncHandler(async (req, res) => {
  const { contactId, limit = 50 } = req.query;
  const query = contactId ? { contactId } : {};
  const logs = await CallLog.find(query).sort({ createdAt: -1 }).limit(Number(limit));
  sendSuccess(res, { logs, count: logs.length }, 'Logs retrieved');
}));

// ================================================
// Analytics API
// ================================================
app.get('/api/analytics', asyncHandler(async (req, res) => {
  const stats = await CallTask.aggregate([
    {
      $group: {
        _id: null,
        totalTasks: { $sum: 1 },
        scheduled: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        missed: { $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] } },
        noAnswer: { $sum: { $cond: [{ $eq: ['$status', 'no-answer'] }, 1, 0] } },
        avgDuration: { $avg: '$duration' },
      }
    }
  ]);

  const result = stats[0] || { totalTasks: 0, scheduled: 0, inProgress: 0, completed: 0, missed: 0, noAnswer: 0, avgDuration: 0 };

  res.json({
    success: true,
    data: {
      totalTasks: result.totalTasks,
      byStatus: { scheduled: result.scheduled, 'in-progress': result.inProgress, completed: result.completed, missed: result.missed, 'no-answer': result.noAnswer },
      avgDuration: Math.round(result.avgDuration) || 0,
    }
  });
}));

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
      logger.info(`📞 Atlas Call Service running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        mongodb: process.env.MONGODB_URI ? 'connected' : 'not configured'
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => { logger.info('SIGTERM received, shutting down'); await disconnectDatabase(); process.exit(0); });
process.on('SIGINT', async () => { logger.info('SIGINT received, shutting down'); await disconnectDatabase(); process.exit(0); });

startServer();

export default app;
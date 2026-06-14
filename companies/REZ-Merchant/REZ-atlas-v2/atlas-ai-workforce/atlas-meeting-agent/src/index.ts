/**
 * REZ Atlas v2 - Meeting Agent
 * Meeting Booking & Calendar Management
 * Production-ready with MongoDB, Winston logging, and security middleware
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { connectDatabase, disconnectDatabase, logger } from './database.js';
import { securityMiddleware } from './middleware/security.js';
import { errorHandler, notFoundHandler, asyncHandler, NotFoundError, sendSuccess } from './middleware/errorHandler.js';
import { Meeting, CalendarEvent, IMeeting } from './models/Meeting.js';

const app = express();
const PORT = process.env.PORT || 5176;

// Middleware
app.use(express.json());
app.use(securityMiddleware);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('Request completed', {
      method: req.method, path: req.path, statusCode: res.statusCode,
      duration: Date.now() - start, requestId: (req as any).requestId
    });
  });
  next();
});

// ================================================
// Health Check Endpoints
// ================================================
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'atlas-meeting-agent', version: '2.0.0', timestamp: new Date().toISOString() }));
app.get('/health/live', (req, res) => res.json({ status: 'alive' }));
app.get('/health/ready', async (req, res) => {
  try {
    const count = await Meeting.countDocuments().maxTimeMS(2000);
    res.json({ status: 'ready', database: 'connected', documents: count });
  } catch (error) {
    res.status(503).json({ status: 'not ready', database: 'disconnected' });
  }
});

// ================================================
// Time Slots API
// ================================================
app.get('/api/slots', asyncHandler(async (req, res) => {
  const { date, timezone = 'Asia/Kolkata' } = req.query;
  const baseDate = date ? new Date(date as string) : new Date();

  const slots = [];
  for (let hour = 9; hour <= 18; hour++) {
    for (const minute of [0, 30]) {
      const start = new Date(baseDate);
      start.setHours(hour, minute, 0, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30);

      slots.push({
        start: start.toISOString(),
        end: end.toISOString(),
        available: Math.random() > 0.3
      });
    }
  }

  sendSuccess(res, { date: baseDate.toISOString(), slots }, 'Time slots retrieved');
}));

// ================================================
// Meetings API
// ================================================
app.post('/api/meetings/propose', asyncHandler(async (req, res) => {
  const { leadId, leadName, leadEmail, companyName, product, duration = 30, type = 'video' } = req.body;

  if (!leadId || !leadName || !leadEmail) {
    throw new ValidationError('leadId, leadName, and leadEmail are required');
  }

  const meeting = new Meeting({
    leadId, leadName, leadEmail, companyName, product, duration, type,
    status: 'proposed',
    agenda: `Demo call for ${product || 'our solution'} - ${companyName || 'your company'}`,
    notes: '',
    calendarEventId: null,
    meetingLink: null,
    outcome: null,
    nextSteps: [],
    followUpRequired: false,
  });

  await meeting.save();
  logger.info('Meeting proposed', { meetingId: meeting._id, leadId });

  res.status(201).json({ success: true, meeting, nextAction: 'Share available slots with lead' });
}));

app.post('/api/meetings/:id/confirm', asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.id);
  if (!meeting) throw new NotFoundError('Meeting');

  const { scheduledAt } = req.body;
  if (!scheduledAt) throw new ValidationError('scheduledAt is required');

  meeting.scheduledAt = new Date(scheduledAt);
  meeting.status = 'confirmed';
  meeting.meetingLink = `https://meet.rez.money/${uuidv4().slice(0, 8)}`;
  meeting.updatedAt = new Date();

  // Create calendar event
  const event = new CalendarEvent({
    title: `${meeting.product || 'Product'} Demo - ${meeting.companyName || 'Company'}`,
    start: meeting.scheduledAt,
    end: new Date(meeting.scheduledAt.getTime() + meeting.duration * 60000),
    attendees: [meeting.leadEmail],
    meetingLink: meeting.meetingLink,
    meetingId: meeting._id.toString(),
  });
  await event.save();

  meeting.calendarEventId = event._id.toString();
  await meeting.save();

  logger.info('Meeting confirmed', { meetingId: meeting._id, scheduledAt });
  sendSuccess(res, { meeting, calendarEvent: event }, 'Meeting confirmed');
}));

app.post('/api/meetings/:id/complete', asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.id);
  if (!meeting) throw new NotFoundError('Meeting');

  const { outcome, notes, nextSteps, followUpRequired } = req.body;
  meeting.status = 'completed';
  meeting.outcome = outcome || null;
  meeting.notes = notes || '';
  meeting.nextSteps = nextSteps || [];
  meeting.followUpRequired = followUpRequired || false;
  meeting.updatedAt = new Date();

  await meeting.save();
  logger.info('Meeting completed', { meetingId: meeting._id, outcome });

  sendSuccess(res, meeting, 'Meeting completed');
}));

app.get('/api/meetings/:id', asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.id);
  if (!meeting) throw new NotFoundError('Meeting');
  sendSuccess(res, meeting, 'Meeting retrieved');
}));

app.get('/api/meetings', asyncHandler(async (req, res) => {
  const { status, date, limit = 50 } = req.query;
  const query: any = {};
  if (status) query.status = status;
  if (date) query.scheduledAt = { $regex: `^${date}` };

  const meetings = await Meeting.find(query)
    .sort({ scheduledAt: 1, createdAt: -1 })
    .limit(Number(limit));

  sendSuccess(res, { meetings, count: meetings.length }, 'Meetings retrieved');
}));

app.post('/api/meetings/:id/cancel', asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.id);
  if (!meeting) throw new NotFoundError('Meeting');

  meeting.status = 'cancelled';
  meeting.updatedAt = new Date();
  await meeting.save();

  logger.info('Meeting cancelled', { meetingId: meeting._id });
  sendSuccess(res, { meeting, message: 'Meeting cancelled' }, 'Meeting cancelled');
}));

// ================================================
// Analytics API
// ================================================
app.get('/api/analytics', asyncHandler(async (req, res) => {
  const stats = await Meeting.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        proposed: { $sum: { $cond: [{ $eq: ['$status', 'proposed'] }, 1, 0] } },
        confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        noShow: { $sum: { $cond: [{ $eq: ['$status', 'no-show'] }, 1, 0] } },
        followUpRequired: { $sum: { $cond: ['$followUpRequired', 1, 0] } },
        avgDuration: { $avg: '$duration' },
      }
    }
  ]);

  const result = stats[0] || { total: 0, proposed: 0, confirmed: 0, completed: 0, cancelled: 0, noShow: 0, followUpRequired: 0, avgDuration: 30 };

  res.json({
    success: true,
    data: {
      total: result.total,
      byStatus: { proposed: result.proposed, confirmed: result.confirmed, completed: result.completed, cancelled: result.cancelled, 'no-show': result.noShow },
      completedRate: result.total > 0 ? ((result.completed / result.total) * 100).toFixed(1) + '%' : '0%',
      avgDuration: Math.round(result.avgDuration) || 30,
      followUpRate: result.completed > 0 ? ((result.followUpRequired / result.completed) * 100).toFixed(1) + '%' : '0%',
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
      logger.info(`📅 Atlas Meeting Agent running on port ${PORT}`, {
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
/**
 * Journey Orchestrator
 *
 * Customer journey automation with triggers and multi-step flows.
 *
 * Port: 5035
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import crypto from 'crypto';
import winston from 'winston';
import client, { Registry, Counter, Histogram, Gauge } from 'prom-client';
import { z } from 'zod';

// ============================================================================
// LOGGING
// ============================================================================

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// ============================================================================
// METRICS
// ============================================================================

const register = new Registry();
register.setDefaultLabels({ service: 'journey-orchestrator' });

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register]
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

const enrollmentsTotal = new Counter({
  name: 'journey_enrollments_total',
  help: 'Total journey enrollments',
  labelNames: ['journey_id', 'status'],
  registers: [register]
});

const journeyMetrics = new Gauge({
  name: 'journey_metrics',
  help: 'Journey metrics',
  labelNames: ['journey_id', 'metric'],
  registers: [register]
});

// ============================================================================
// EXPRESS APP
// ============================================================================

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Metrics middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.inc({ method: req.method, path: req.path, status: res.statusCode });
    httpRequestDuration.observe({ method: req.method, path: req.path }, duration);
  });
  next();
});

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = parseInt(process.env.PORT || '5035', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/journey_orchestrator';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';

// ============================================================================
// MONGODB MODELS
// ============================================================================

// Journey Model
const JourneySchema = new mongoose.Schema({
  journeyId: { type: String, required: true, unique: true, index: true },
  advertiserId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['draft', 'active', 'paused', 'completed'], default: 'draft' },
  trigger: {
    type: { type: String, enum: ['form_submit', 'email_open', 'page_visit', 'time', 'score_threshold', 'manual'] },
    conditions: mongoose.Schema.Types.Mixed
  },
  entryCriteria: mongoose.Schema.Types.Mixed,
  exitCriteria: mongoose.Schema.Types.Mixed,
  steps: [{
    stepId: String,
    type: { type: String, enum: ['trigger', 'action', 'condition', 'wait', 'end'] },
    name: String,
    config: mongoose.Schema.Types.Mixed,
    order: Number
  }],
  stats: {
    enrolled: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    exited: { type: Number, default: 0 },
    dropped: { type: Number, default: 0 }
  },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Journey = mongoose.model('Journey', JourneySchema);

// Enrollment Model
const EnrollmentSchema = new mongoose.Schema({
  enrollmentId: { type: String, required: true, unique: true, index: true },
  journeyId: { type: String, required: true, index: true },
  contactId: { type: String, required: true, index: true },
  status: { type: String, enum: ['active', 'completed', 'exited', 'paused'], default: 'active' },
  currentStep: { type: Number, default: 0 },
  stepHistory: [{
    stepId: String,
    enteredAt: Date,
    exitedAt: Date,
    action: String
  }],
  startedAt: Date,
  completedAt: Date,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Enrollment = mongoose.model('Enrollment', EnrollmentSchema);

// Trigger Model
const TriggerSchema = new mongoose.Schema({
  triggerId: { type: String, required: true, unique: true, index: true },
  journeyId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['form_submit', 'email_open', 'page_visit', 'time', 'score_threshold', 'manual'],
    required: true
  },
  conditions: [{
    field: String,
    operator: String,
    value: mongoose.Schema.Types.Mixed
  }],
  action: { type: String, enum: ['enroll', 'skip', 'exit'] },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Trigger = mongoose.model('Trigger', TriggerSchema);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createJourneySchema = z.object({
  advertiserId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  trigger: z.object({
    type: z.enum(['form_submit', 'email_open', 'page_visit', 'time', 'score_threshold', 'manual']),
    conditions: z.record(z.any()).optional()
  }).optional(),
  entryCriteria: z.record(z.any()).optional(),
  exitCriteria: z.record(z.any()).optional(),
  steps: z.array(z.object({
    type: z.enum(['trigger', 'action', 'condition', 'wait', 'end']),
    name: z.string(),
    config: z.record(z.any()).optional(),
    order: z.number()
  })).optional(),
  metadata: z.record(z.any()).optional()
});

const addStepSchema = z.object({
  type: z.enum(['trigger', 'action', 'condition', 'wait', 'end']),
  name: z.string(),
  config: z.record(z.any()).optional(),
  order: z.number()
});

const enrollContactSchema = z.object({
  journeyId: z.string(),
  contactId: z.string(),
  metadata: z.record(z.any()).optional()
});

const createTriggerSchema = z.object({
  journeyId: z.string(),
  type: z.enum(['form_submit', 'email_open', 'page_visit', 'time', 'score_threshold', 'manual']),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.any()
  })).optional(),
  action: z.enum(['enroll', 'skip', 'exit'])
});

// ============================================================================
// UTILITIES
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function executeStep(enrollment: any, step: any): Promise<void> {
  const { type, config } = step;

  logger.info(`Executing step ${step.stepId} for enrollment ${enrollment.enrollmentId}`, { type });

  switch (type) {
    case 'action':
      // Execute action (email, SMS, push, etc.)
      if (config.action === 'send_email') {
        logger.info(`Sending email to contact ${enrollment.contactId}`);
      } else if (config.action === 'send_sms') {
        logger.info(`Sending SMS to contact ${enrollment.contactId}`);
      } else if (config.action === 'send_push') {
        logger.info(`Sending push to contact ${enrollment.contactId}`);
      }
      break;

    case 'wait':
      // Schedule next step after delay
      const delayMs = config.duration || 60000;
      setTimeout(async () => {
        await processNextStep(enrollment);
      }, delayMs);
      break;

    case 'condition':
      // Evaluate condition and branch
      const conditionMet = evaluateCondition(config.condition, enrollment);
      if (!conditionMet && config.elseStepId) {
        // Go to else branch
        enrollment.currentStep = config.elseStepId;
      }
      break;

    case 'end':
      // Complete enrollment
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
      await enrollment.save();

      // Update journey stats
      const journey = await Journey.findOne({ journeyId: enrollment.journeyId });
      if (journey) {
        journey.stats.completed++;
        await journey.save();
      }
      break;
  }
}

function evaluateCondition(condition: any, enrollment: any): boolean {
  if (!condition) return true;

  const fieldValue = enrollment.metadata?.[condition.field] || enrollment[condition.field];

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'gt':
      return Number(fieldValue) > Number(condition.value);
    case 'lt':
      return Number(fieldValue) < Number(condition.value);
    case 'contains':
      return String(fieldValue).includes(condition.value);
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null;
    default:
      return true;
  }
}

async function processNextStep(enrollment: any): Promise<void> {
  const journey = await Journey.findOne({ journeyId: enrollment.journeyId });
  if (!journey || !journey.steps.length) return;

  enrollment.currentStep++;
  const nextStep = journey.steps.find((s: any) => s.order === enrollment.currentStep);

  if (nextStep) {
    enrollment.stepHistory.push({
      stepId: nextStep.stepId,
      enteredAt: new Date()
    });
    await enrollment.save();
    await executeStep(enrollment, nextStep);
  }
}

// ============================================================================
// HEALTH
// ============================================================================

app.get('/health', (_: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'journey-orchestrator',
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', async (_: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ status: 'ready', mongodb: mongoStatus });
});

app.get('/metrics', async (_: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

// ============================================================================
// JOURNEYS
// ============================================================================

app.post('/api/journeys', async (req: Request, res: Response) => {
  try {
    const validated = createJourneySchema.parse(req.body);

    const steps = (validated.steps || []).map((step, index) => ({
      stepId: generateId('STEP'),
      ...step,
      order: step.order || index
    }));

    const journey = await Journey.create({
      journeyId: generateId('JRN'),
      ...validated,
      steps,
      status: validated.steps?.length ? 'draft' : 'draft'
    });

    logger.info('Journey created', { journeyId: journey.journeyId });
    res.status(201).json({ success: true, data: journey });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error('Create journey error', { error });
    res.status(500).json({ success: false, error: 'Failed to create journey' });
  }
});

app.get('/api/journeys', async (req: Request, res: Response) => {
  try {
    const { advertiserId, status } = req.query;
    const filter: Record<string, unknown> = {};
    if (advertiserId) filter.advertiserId = advertiserId;
    if (status) filter.status = status;

    const journeys = await Journey.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: journeys });
  } catch (error) {
    logger.error('List journeys error', { error });
    res.status(500).json({ success: false, error: 'Failed to list journeys' });
  }
});

app.get('/api/journeys/:id', async (req: Request, res: Response) => {
  try {
    const journey = await Journey.findOne({ journeyId: req.params.id });
    if (!journey) {
      return res.status(404).json({ success: false, error: 'Journey not found' });
    }

    // Get enrollment stats
    const enrollments = await Enrollment.find({ journeyId: journey.journeyId });
    const stats = {
      total: enrollments.length,
      active: enrollments.filter(e => e.status === 'active').length,
      completed: enrollments.filter(e => e.status === 'completed').length,
      exited: enrollments.filter(e => e.status === 'exited').length
    };

    res.json({ success: true, data: { ...journey.toObject(), enrollmentStats: stats } });
  } catch (error) {
    logger.error('Get journey error', { error });
    res.status(500).json({ success: false, error: 'Failed to get journey' });
  }
});

app.put('/api/journeys/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, status, trigger, entryCriteria, exitCriteria, steps } = req.body;

    const updateData: Record<string, any> = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (trigger) updateData.trigger = trigger;
    if (entryCriteria) updateData.entryCriteria = entryCriteria;
    if (exitCriteria) updateData.exitCriteria = exitCriteria;
    if (steps) updateData.steps = steps.map((s: any, i: number) => ({
      ...s,
      stepId: s.stepId || generateId('STEP'),
      order: s.order || i
    }));

    const journey = await Journey.findOneAndUpdate(
      { journeyId: req.params.id },
      updateData,
      { new: true }
    );

    if (!journey) {
      return res.status(404).json({ success: false, error: 'Journey not found' });
    }

    res.json({ success: true, data: journey });
  } catch (error) {
    logger.error('Update journey error', { error });
    res.status(500).json({ success: false, error: 'Failed to update journey' });
  }
});

app.delete('/api/journeys/:id', async (req: Request, res: Response) => {
  try {
    await Journey.findOneAndDelete({ journeyId: req.params.id });
    res.json({ success: true, message: 'Journey deleted' });
  } catch (error) {
    logger.error('Delete journey error', { error });
    res.status(500).json({ success: false, error: 'Failed to delete journey' });
  }
});

// ============================================================================
// STEPS
// ============================================================================

app.post('/api/journeys/:id/steps', async (req: Request, res: Response) => {
  try {
    const validated = addStepSchema.parse(req.body);

    const step = {
      stepId: generateId('STEP'),
      ...validated
    };

    const journey = await Journey.findOneAndUpdate(
      { journeyId: req.params.id },
      { $push: { steps: step } },
      { new: true }
    );

    if (!journey) {
      return res.status(404).json({ success: false, error: 'Journey not found' });
    }

    res.status(201).json({ success: true, data: step });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error('Add step error', { error });
    res.status(500).json({ success: false, error: 'Failed to add step' });
  }
});

app.put('/api/steps/:id', async (req: Request, res: Response) => {
  try {
    const { name, config, order } = req.body;

    const journey = await Journey.findOneAndUpdate(
      { 'steps.stepId': req.params.id },
      {
        $set: {
          'steps.$.name': name,
          'steps.$.config': config,
          'steps.$.order': order
        }
      },
      { new: true }
    );

    if (!journey) {
      return res.status(404).json({ success: false, error: 'Step not found' });
    }

    const step = journey.steps.find((s: any) => s.stepId === req.params.id);
    res.json({ success: true, data: step });
  } catch (error) {
    logger.error('Update step error', { error });
    res.status(500).json({ success: false, error: 'Failed to update step' });
  }
});

app.delete('/api/steps/:id', async (req: Request, res: Response) => {
  try {
    const journey = await Journey.findOneAndUpdate(
      { 'steps.stepId': req.params.id },
      { $pull: { steps: { stepId: req.params.id } } },
      { new: true }
    );

    if (!journey) {
      return res.status(404).json({ success: false, error: 'Step not found' });
    }

    res.json({ success: true, message: 'Step deleted' });
  } catch (error) {
    logger.error('Delete step error', { error });
    res.status(500).json({ success: false, error: 'Failed to delete step' });
  }
});

// ============================================================================
// TRIGGER
// ============================================================================

app.post('/api/journeys/:id/trigger', async (req: Request, res: Response) => {
  try {
    const journey = await Journey.findOne({ journeyId: req.params.id });
    if (!journey) {
      return res.status(404).json({ success: false, error: 'Journey not found' });
    }

    // Check if journey has trigger conditions
    if (!journey.trigger || journey.trigger.type === 'manual') {
      return res.status(400).json({ success: false, error: 'Journey has no automatic trigger' });
    }

    // Activate journey
    journey.status = 'active';
    await journey.save();

    logger.info('Journey triggered', { journeyId: journey.journeyId });
    res.json({ success: true, data: { journeyId: journey.journeyId, status: journey.status } });
  } catch (error) {
    logger.error('Trigger journey error', { error });
    res.status(500).json({ success: false, error: 'Failed to trigger journey' });
  }
});

// ============================================================================
// ENROLLMENTS
// ============================================================================

app.post('/api/enrollments', async (req: Request, res: Response) => {
  try {
    const validated = enrollContactSchema.parse(req.body);

    // Check if contact is already enrolled
    const existing = await Enrollment.findOne({
      journeyId: validated.journeyId,
      contactId: validated.contactId,
      status: 'active'
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'Contact already enrolled' });
    }

    const journey = await Journey.findOne({ journeyId: validated.journeyId });
    if (!journey) {
      return res.status(404).json({ success: false, error: 'Journey not found' });
    }

    // Check entry criteria
    if (journey.entryCriteria && !evaluateCondition(journey.entryCriteria, { contactId: validated.contactId, metadata: validated.metadata })) {
      return res.status(400).json({ success: false, error: 'Contact does not meet entry criteria' });
    }

    const enrollment = await Enrollment.create({
      enrollmentId: generateId('ENR'),
      journeyId: validated.journeyId,
      contactId: validated.contactId,
      status: 'active',
      startedAt: new Date(),
      metadata: validated.metadata,
      stepHistory: journey.steps.length > 0 ? [{
        stepId: journey.steps[0].stepId,
        enteredAt: new Date()
      }] : []
    });

    // Update journey stats
    journey.stats.enrolled++;
    await journey.save();

    enrollmentsTotal.inc({ journey_id: validated.journeyId, status: 'active' });
    journeyMetrics.set({ journey_id: validated.journeyId, metric: 'enrolled' }, journey.stats.enrolled);

    logger.info('Contact enrolled in journey', { enrollmentId: enrollment.enrollmentId });

    // Execute first step if exists
    if (journey.steps.length > 0) {
      await executeStep(enrollment, journey.steps[0]);
    }

    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error('Enroll contact error', { error });
    res.status(500).json({ success: false, error: 'Failed to enroll contact' });
  }
});

app.get('/api/enrollments', async (req: Request, res: Response) => {
  try {
    const { journeyId, contactId, status } = req.query;
    const filter: Record<string, unknown> = {};
    if (journeyId) filter.journeyId = journeyId;
    if (contactId) filter.contactId = contactId;
    if (status) filter.status = status;

    const enrollments = await Enrollment.find(filter).sort({ startedAt: -1 }).limit(100);
    res.json({ success: true, data: enrollments, count: enrollments.length });
  } catch (error) {
    logger.error('List enrollments error', { error });
    res.status(500).json({ success: false, error: 'Failed to list enrollments' });
  }
});

app.get('/api/enrollments/:id', async (req: Request, res: Response) => {
  try {
    const enrollment = await Enrollment.findOne({ enrollmentId: req.params.id });
    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' });
    }

    const journey = await Journey.findOne({ journeyId: enrollment.journeyId });

    res.json({ success: true, data: { ...enrollment.toObject(), journey } });
  } catch (error) {
    logger.error('Get enrollment error', { error });
    res.status(500).json({ success: false, error: 'Failed to get enrollment' });
  }
});

app.delete('/api/enrollments/:id', async (req: Request, res: Response) => {
  try {
    const enrollment = await Enrollment.findOneAndUpdate(
      { enrollmentId: req.params.id },
      { status: 'exited', completedAt: new Date() },
      { new: true }
    );

    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' });
    }

    // Update journey stats
    const journey = await Journey.findOne({ journeyId: enrollment.journeyId });
    if (journey) {
      journey.stats.exited++;
      await journey.save();
    }

    enrollmentsTotal.inc({ journey_id: enrollment.journeyId, status: 'exited' });
    res.json({ success: true, message: 'Enrollment cancelled' });
  } catch (error) {
    logger.error('Cancel enrollment error', { error });
    res.status(500).json({ success: false, error: 'Failed to cancel enrollment' });
  }
});

// ============================================================================
// ANALYTICS
// ============================================================================

app.get('/api/journeys/:id/analytics', async (req: Request, res: Response) => {
  try {
    const journey = await Journey.findOne({ journeyId: req.params.id });
    if (!journey) {
      return res.status(404).json({ success: false, error: 'Journey not found' });
    }

    const enrollments = await Enrollment.find({ journeyId: journey.journeyId });

    const stats = journey.stats;
    const completionRate = stats.enrolled > 0 ? (stats.completed / stats.enrolled * 100).toFixed(2) : 0;
    const exitRate = stats.enrolled > 0 ? (stats.exited / stats.enrolled * 100).toFixed(2) : 0;

    // Step performance
    const stepPerformance = journey.steps.map((step: any) => {
      const stepEnrollments = enrollments.filter(e =>
        e.stepHistory.some((h: any) => h.stepId === step.stepId)
      );
      return {
        stepId: step.stepId,
        name: step.name,
        type: step.type,
        reached: stepEnrollments.length,
        completed: stepEnrollments.filter((e: any) =>
          e.stepHistory.some((h: any) => h.stepId === step.stepId && h.exitedAt)
        ).length
      };
    });

    const response = {
      journeyId: journey.journeyId,
      name: journey.name,
      status: journey.status,
      stats: {
        enrolled: stats.enrolled,
        completed: stats.completed,
        exited: stats.exited,
        dropped: stats.dropped,
        completionRate,
        exitRate
      },
      stepPerformance,
      enrollments: enrollments.slice(0, 20).map((e: any) => ({
        enrollmentId: e.enrollmentId,
        contactId: e.contactId,
        status: e.status,
        currentStep: e.currentStep,
        startedAt: e.startedAt,
        completedAt: e.completedAt
      }))
    };

    res.json({ success: true, data: response });
  } catch (error) {
    logger.error('Get analytics error', { error });
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
});

// ============================================================================
// TRIGGERS
// ============================================================================

app.post('/api/triggers', async (req: Request, res: Response) => {
  try {
    const validated = createTriggerSchema.parse(req.body);

    const trigger = await Trigger.create({
      triggerId: generateId('TRIG'),
      ...validated
    });

    logger.info('Trigger created', { triggerId: trigger.triggerId });
    res.status(201).json({ success: true, data: trigger });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error('Create trigger error', { error });
    res.status(500).json({ success: false, error: 'Failed to create trigger' });
  }
});

app.get('/api/triggers', async (req: Request, res: Response) => {
  try {
    const { journeyId } = req.query;
    const filter: Record<string, unknown> = {};
    if (journeyId) filter.journeyId = journeyId;

    const triggers = await Trigger.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: triggers });
  } catch (error) {
    logger.error('List triggers error', { error });
    res.status(500).json({ success: false, error: 'Failed to list triggers' });
  }
});

app.put('/api/triggers/:id', async (req: Request, res: Response) => {
  try {
    const { type, conditions, action } = req.body;
    const trigger = await Trigger.findOneAndUpdate(
      { triggerId: req.params.id },
      { type, conditions, action },
      { new: true }
    );
    if (!trigger) {
      return res.status(404).json({ success: false, error: 'Trigger not found' });
    }
    res.json({ success: true, data: trigger });
  } catch (error) {
    logger.error('Update trigger error', { error });
    res.status(500).json({ success: false, error: 'Failed to update trigger' });
  }
});

// ============================================================================
// STARTUP
// ============================================================================

async function start() {
  logger.info('Starting Journey Orchestrator', { port: PORT });

  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected');

    app.listen(PORT, () => {
      logger.info(`Journey Orchestrator running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Startup failed', { error });
    process.exit(1);
  }
}

start();

export default app;
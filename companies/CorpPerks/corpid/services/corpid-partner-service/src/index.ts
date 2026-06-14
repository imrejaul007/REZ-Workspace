/**
 * CorpID Partner Service
 * Partner management and API integrations
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose, { Schema, model } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(rateLimit({ windowMs: 60000, max: 100, message: { success: false, error: { code: 'RATE_LIMITED' } } }));

const PORT = parseInt(process.env.PORT || '4711', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpid';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'corpid-internal-token';

const partnerSchema = new Schema({
  partnerId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  type: { type: String, enum: ['INTERNAL', 'EXTERNAL'], default: 'EXTERNAL' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
  apiKey: { type: String },
  permissions: [String],
  integrations: [{
    integrationId: String,
    service: String,
    endpoint: String,
    authType: { type: String, enum: ['API_KEY', 'OAUTH', 'JWT'], default: 'API_KEY' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    lastUsedAt: Date,
    usageCount: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
  }],
  usage: {
    requestsThisMonth: { type: Number, default: 0 },
    requestsLimit: { type: Number, default: 10000 },
    errorsThisMonth: { type: Number, default: 0 },
    resetsAt: Date,
  },
}, { timestamps: true });

const Partner = model('Partner', partnerSchema);

function generateId(prefix: string): string {
  return `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36)}`;
}

function generateApiKey(): string {
  return `cpid_${randomBytes(24).toString('hex')}`;
}

function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.headers['x-internal-token'] === INTERNAL_TOKEN) return next();
  next();
}

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'corpid-partner-service', timestamp: new Date().toISOString() });
});

// Create partner
app.post('/partners', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, code, type, permissions, usageLimit } = req.body;

    const existing = await Partner.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, error: { code: 'DUPLICATE_CODE', message: 'Partner code already exists' } });
    }

    const partner = new Partner({
      partnerId: generateId('PTR'),
      name,
      code: code.toUpperCase(),
      type: type || 'EXTERNAL',
      status: 'ACTIVE',
      apiKey: generateApiKey(),
      permissions: permissions || ['read:identities', 'read:scores'],
      usage: {
        requestsThisMonth: 0,
        requestsLimit: usageLimit || 10000,
        errorsThisMonth: 0,
        resetsAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
      },
    });

    await partner.save();

    res.status(201).json({
      success: true,
      data: {
        partnerId: partner.partnerId,
        name: partner.name,
        code: partner.code,
        type: partner.type,
        status: partner.status,
        apiKey: partner.apiKey,
        permissions: partner.permissions,
      },
    });
  } catch (error) {
    logger.error('Error creating partner:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// List partners
app.get('/partners', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { status, type } = req.query;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const [partners, total] = await Promise.all([
      Partner.find(filter).select('-apiKey').sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
      Partner.countDocuments(filter),
    ]);

    res.json({ success: true, data: { items: partners, total, page, pageSize, totalPages: Math.ceil(total / pageSize) } });
  } catch (error) {
    logger.error('Error listing partners:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Get partner
app.get('/partners/:partnerId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { partnerId } = req.params;
    const partner = await Partner.findOne({ partnerId }).select('-apiKey').lean();

    if (!partner) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    res.json({ success: true, data: partner });
  } catch (error) {
    logger.error('Error fetching partner:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Update partner
app.patch('/partners/:partnerId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { partnerId } = req.params;
    const updates = req.body;

    const partner = await Partner.findOneAndUpdate(
      { partnerId },
      { $set: updates },
      { new: true }
    );

    if (!partner) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    res.json({ success: true, data: partner });
  } catch (error) {
    logger.error('Error updating partner:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Create integration
app.post('/integrations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { partnerId, service, endpoint, authType } = req.body;

    const integration = {
      integrationId: generateId('INT'),
      service,
      endpoint,
      authType: authType || 'API_KEY',
      status: 'ACTIVE',
      usageCount: 0,
      errorCount: 0,
    };

    const partner = await Partner.findOneAndUpdate(
      { partnerId },
      { $push: { integrations: integration } },
      { new: true }
    );

    if (!partner) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    res.status(201).json({ success: true, data: integration });
  } catch (error) {
    logger.error('Error creating integration:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Get integration
app.get('/integrations/:integrationId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;
    const partner = await Partner.findOne({ 'integrations.integrationId': integrationId }).lean();

    if (!partner) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    const integration = partner.integrations.find(i => i.integrationId === integrationId);

    res.json({ success: true, data: integration });
  } catch (error) {
    logger.error('Error fetching integration:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Regenerate API key
app.post('/partners/:partnerId/regenerate-key', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { partnerId } = req.params;

    const partner = await Partner.findOneAndUpdate(
      { partnerId },
      { $set: { apiKey: generateApiKey() } },
      { new: true }
    );

    if (!partner) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    res.json({ success: true, data: { apiKey: partner.apiKey } });
  } catch (error) {
    logger.error('Error regenerating key:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Get partner stats
app.get('/partners/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = await Partner.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const total = await Partner.countDocuments();

    res.json({
      success: true,
      data: {
        byStatus: Object.fromEntries(stats.map(s => [s._id, s.count])),
        total,
      },
    });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Partner service error:', err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
});

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
    await Partner.createIndexes();
    logger.info('Indexes created');
    app.listen(PORT, () => logger.info(`CorpID Partner Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
export default app;

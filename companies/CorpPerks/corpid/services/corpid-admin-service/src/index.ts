/**
 * CorpID Admin Service
 * Admin dashboard backend and audit logs
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose, { Schema, model } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(rateLimit({ windowMs: 60000, max: 100, message: { success: false, error: { code: 'RATE_LIMITED' } } }));

const PORT = parseInt(process.env.PORT || '4712', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpid';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'corpid-internal-token';
const JWT_SECRET = process.env.JWT_SECRET || 'corpid-admin-jwt-secret';

const auditLogSchema = new Schema({
  logId: { type: String, required: true, unique: true, index: true },
  actorCorpId: { type: String, index: true },
  actorType: { type: String, enum: ['USER', 'SERVICE', 'SYSTEM'] },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: String,
  details: { type: Schema.Types.Mixed, default: {} },
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

const adminUserSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: String,
  role: { type: String, enum: ['ADMIN', 'VERIFIER', 'VIEWER'], default: 'VIEWER' },
  permissions: [String],
  active: { type: Boolean, default: true },
  lastLoginAt: Date,
}, { timestamps: true });

const AuditLog = model('AuditLog', auditLogSchema);
const AdminUser = model('AdminUser', adminUserSchema);

function generateId(prefix: string): string {
  return `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36)}`;
}

function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.headers['x-internal-token'] === INTERNAL_TOKEN) return next();
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
      (req as Request & { user: unknown }).user = decoded;
    } catch {
      // Continue without auth for development
    }
  }
  next();
}

async function logAction(req: Request, action: string, resource: string, resourceId?: string) {
  const actor = (req as Request & { user?: { corpId?: string; email?: string } }).user;
  const log = new AuditLog({
    logId: generateId('LOG'),
    actorCorpId: actor?.corpId || 'system',
    actorType: actor ? 'USER' : 'SYSTEM',
    action,
    resource,
    resourceId,
    details: { body: req.body, query: req.query },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
  await log.save();
}

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'corpid-admin-service', timestamp: new Date().toISOString() });
});

// Login
app.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await AdminUser.findOne({ email, active: true });

    if (!user) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS' } });
    }

    // Simple password check (use bcrypt in production)
    if (user.passwordHash !== password) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS' } });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user.userId, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ success: true, data: { token, user: { userId: user.userId, email: user.email, name: user.name, role: user.role } } });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Get dashboard stats
app.get('/admin/stats', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const [
      totalIdentities,
      verifiedIdentities,
      pendingVerifications,
      documentsProcessed,
      riskAlerts,
    ] = await Promise.all([
      mongoose.connection.db?.collection('identities').countDocuments() || 0,
      mongoose.connection.db?.collection('identities').countDocuments({ status: 'VERIFIED' }) || 0,
      mongoose.connection.db?.collection('verificationrequests').countDocuments({ status: { $in: ['PENDING', 'IN_PROGRESS'] } }) || 0,
      mongoose.connection.db?.collection('documents').countDocuments() || 0,
      mongoose.connection.db?.collection('alerts').countDocuments({ resolvedAt: null }) || 0,
    ]);

    const avgScoreResult = await mongoose.connection.db?.collection('ciscores').aggregate([
      { $group: { _id: null, avgScore: { $avg: '$score' } } },
    ]).toArray();

    const avgScore = avgScoreResult?.[0]?.avgScore || 0;
    const topScoreResult = await mongoose.connection.db?.collection('ciscores').findOne({}, { sort: { score: -1 } });
    const topScore = topScoreResult?.score || 0;

    res.json({
      success: true,
      data: {
        totalIdentities,
        totalVerified: verifiedIdentities,
        verificationRate: totalIdentities > 0 ? Math.round((verifiedIdentities / totalIdentities) * 100) : 0,
        pendingVerifications,
        averageCIScore: Math.round(avgScore),
        topScore,
        documentsProcessed,
        riskAlerts,
        period: 'month',
      },
    });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Get pending verifications
app.get('/admin/verifications', authMiddleware, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const type = req.query.type as string | undefined;

    const filter: Record<string, unknown> = { status: { $in: ['PENDING', 'IN_PROGRESS'] } };
    if (type) filter.type = type;

    const verifications = await mongoose.connection.db?.collection('verificationrequests')
      .find(filter)
      .sort({ initiatedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray() || [];

    const total = await mongoose.connection.db?.collection('verificationrequests').countDocuments(filter) || 0;

    res.json({
      success: true,
      data: {
        items: verifications,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logger.error('Error fetching verifications:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Process verification
app.patch('/admin/verifications/:requestId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { status, notes } = req.body;

    const result = await mongoose.connection.db?.collection('verificationrequests').findOneAndUpdate(
      { requestId },
      {
        $set: {
          status,
          completedAt: new Date(),
          notes,
          verifiedBy: (req as Request & { user?: { userId?: string } }).user?.userId || 'admin',
        },
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    await logAction(req, `verification.${status.toLowerCase()}`, 'verification', requestId);

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error processing verification:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Get audit logs
app.get('/admin/audit', authMiddleware, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 50));
    const { action, resource, actorCorpId, fromDate, toDate } = req.query;

    const filter: Record<string, unknown> = {};
    if (action) filter.action = action;
    if (resource) filter.resource = resource;
    if (actorCorpId) filter.actorCorpId = actorCorpId;
    if (fromDate || toDate) {
      filter.timestamp = {};
      if (fromDate) (filter.timestamp as Record<string, unknown>).$gte = new Date(fromDate as string);
      if (toDate) (filter.timestamp as Record<string, unknown>).$lte = new Date(toDate as string);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ timestamp: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        items: logs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Get admin users
app.get('/admin/users', authMiddleware, async (req: Request, res: Response) => {
  try {
    const users = await AdminUser.find({ active: true }).select('-passwordHash').lean();
    res.json({ success: true, data: users });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Create admin user
app.post('/admin/users', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { email, name, role, permissions, password } = req.body;

    const user = new AdminUser({
      userId: generateId('ADM'),
      email,
      name,
      role: role || 'VIEWER',
      permissions: permissions || [],
      passwordHash: password, // Use bcrypt in production
    });

    await user.save();

    res.status(201).json({ success: true, data: { userId: user.userId, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Admin service error:', err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
});

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Create default admin user if none exists
    const adminCount = await AdminUser.countDocuments({ role: 'ADMIN' });
    if (adminCount === 0) {
      await new AdminUser({
        userId: 'ADM-ADMIN-001',
        email: 'admin@corpid.io',
        passwordHash: 'admin123', // Change in production
        name: 'Admin',
        role: 'ADMIN',
        permissions: ['*'],
      }).save();
      logger.info('Default admin user created: admin@corpid.io / admin123');
    }

    await Promise.all([AuditLog.createIndexes(), AdminUser.createIndexes()]);
    logger.info('Indexes created');

    app.listen(PORT, () => logger.info(`CorpID Admin Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
export default app;

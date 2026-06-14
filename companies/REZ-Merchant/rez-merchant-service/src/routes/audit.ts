
import { Router, Request, Response } from 'express';
import { AuditLog } from '../models/AuditLog';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

// GET /audit/logs
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: req.merchantId };
    if (req.query.action) query.action = req.query.action;
    if (req.query.resourceType) query.resourceType = req.query.resourceType;
    if (req.query.severity) query.severity = req.query.severity;
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = { $gte: new Date(req.query.startDate as string), $lte: new Date(req.query.endDate as string) };
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      AuditLog.countDocuments(query),
    ]);

    res.json({ success: true, data: { logs, total, page, totalPages: Math.ceil(total / limit) } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /audit/activity (alias)
router.get('/activity', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: req.merchantId };
    if (req.query.action) query.action = req.query.action;
    if (req.query.resourceType) query.resourceType = req.query.resourceType;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 100));

    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ success: true, data: logs });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /audit/resource/:resourceType/:resourceId
router.get('/resource/:resourceType/:resourceId', async (req: Request, res: Response) => {
  try {
    // MS-18: Scope to this merchant only — any resource type must belong to the requesting merchant
    const history = await AuditLog.find({ merchantId: req.merchantId, resourceType: req.params.resourceType, resourceId: req.params.resourceId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: { resourceType: req.params.resourceType, resourceId: req.params.resourceId, history, count: history.length } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /audit/user/:userId
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    // MS-18: Scope to this merchant only — prevent cross-merchant staff activity leakage
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 100));
    const activity = await AuditLog.find({ merchantId: req.merchantId, merchantUserId: req.params.userId }).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ success: true, data: { userId: req.params.userId, activity, count: activity.length } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /audit/stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: req.merchantId };
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = { $gte: new Date(req.query.startDate as string), $lte: new Date(req.query.endDate as string) };
    }

    const [byAction, bySeverity, total] = await Promise.all([
      AuditLog.aggregate([{ $match: query }, { $group: { _id: '$action', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 20 }]),
      AuditLog.aggregate([{ $match: query }, { $group: { _id: '$severity', count: { $sum: 1 } } }]),
      AuditLog.countDocuments(query),
    ]);

    res.json({ success: true, data: { total, byAction, bySeverity } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /audit/export
router.get('/export', async (req: Request, res: Response) => {
  try {
    const start = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 86400000);
    const end = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const logs = await AuditLog.find({ merchantId: req.merchantId, createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }).limit(1000).lean();

    if (req.query.format === 'json' || req.query.download !== 'true') {
      res.json({ success: true, data: { logs, total: logs.length, startDate: start, endDate: end } });
      return;
    }

    const headers = ['Date', 'Action', 'ResourceType', 'ResourceId', 'Severity'];
    const rows = logs.map((l) => [new Date(l.createdAt).toISOString(), l.action, l.resourceType, l.resourceId, l.severity].join(','));
    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /audit/search
router.get('/search', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q) { res.status(400).json({ success: false, message: 'Search term required' }); return; }

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const results = await AuditLog.find({
      merchantId: req.merchantId,
      $or: [{ action: { $regex: escaped, $options: 'i' } }, { resourceType: { $regex: escaped, $options: 'i' } }],
    }).sort({ createdAt: -1 }).limit(100).lean();

    res.json({ success: true, data: { searchTerm: q, results, count: results.length } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /audit/timeline
router.get('/timeline', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 100));
    const logs = await AuditLog.find({ merchantId: req.merchantId }).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ success: true, data: logs });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /audit/timeline/today
router.get('/timeline/today', async (req: Request, res: Response) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const logs = await AuditLog.find({ merchantId: req.merchantId, createdAt: { $gte: start } }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: { date: start.toISOString().split('T')[0], activities: logs, count: logs.length } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /audit/timeline/recent
router.get('/timeline/recent', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const logs = await AuditLog.find({ merchantId: req.merchantId }).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ success: true, data: { activities: logs, count: logs.length } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /audit/timeline/summary
router.get('/timeline/summary', async (req: Request, res: Response) => {
  try {
    const start = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 86400000);
    const end = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const summary = await AuditLog.aggregate([
      { $match: { merchantId: req.merchantId, createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    res.json({ success: true, data: { period: { start, end }, summary } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /audit/timeline/critical
router.get('/timeline/critical', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const start = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 7 * 86400000);
    const end = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const logs = await AuditLog.find({
      merchantId: req.merchantId,
      severity: { $in: ['critical', 'high'] },
      createdAt: { $gte: start, $lte: end },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, data: { logs, count: logs.length, period: { start, end } } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /audit/timeline/heatmap
router.get('/timeline/heatmap', async (req: Request, res: Response) => {
  try {
    const start = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 86400000);
    const end = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const heatmap = await AuditLog.aggregate([
      { $match: { merchantId: req.merchantId, createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            hour: { $hour: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1, '_id.hour': 1 } },
    ]);

    res.json({ success: true, data: { heatmap, period: { start, end } } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /audit/retention/compliance
router.get('/retention/compliance', async (req: Request, res: Response) => {
  try {
    const framework = (req.query.framework as string) || 'all';
    const retentionDays = 365;
    const cutoff = new Date(Date.now() - retentionDays * 86400000);

    const [totalLogs, expiredLogs, criticalLogs] = await Promise.all([
      AuditLog.countDocuments({ merchantId: req.merchantId }),
      AuditLog.countDocuments({ merchantId: req.merchantId, createdAt: { $lt: cutoff } }),
      AuditLog.countDocuments({ merchantId: req.merchantId, severity: { $in: ['critical', 'high'] } }),
    ]);

    const compliant = expiredLogs === 0;
    const findings = expiredLogs > 0
      ? [{ severity: 'medium', description: `${expiredLogs} log entries exceed ${retentionDays}-day retention policy` }]
      : [];

    res.json({
      success: true,
      data: {
        framework: framework === 'all' ? ['gdpr', 'soc2'] : [framework],
        compliant,
        totalLogs,
        expiredLogs,
        criticalLogs,
        retentionDays,
        findings,
        recommendations: compliant ? [] : ['Run cleanup to remove logs beyond retention policy'],
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /audit/retention/stats
router.get('/retention/stats', async (req: Request, res: Response) => {
  try {
    const retentionDays = 365;
    const cutoff = new Date(Date.now() - retentionDays * 86400000);

    const [total, expired, oldest] = await Promise.all([
      AuditLog.countDocuments({ merchantId: req.merchantId }),
      AuditLog.countDocuments({ merchantId: req.merchantId, createdAt: { $lt: cutoff } }),
      AuditLog.findOne({ merchantId: req.merchantId }).sort({ createdAt: 1 }).select('createdAt').lean() as Promise<{ createdAt?: Date } | null>,
    ]);

    res.json({
      success: true,
      data: {
        totalLogs: total,
        expiredLogs: expired,
        retentionDays,
        oldestLogDate: oldest?.createdAt || null,
        nextCleanupDate: new Date(Date.now() + 7 * 86400000),
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /audit/retention/cleanup
router.post('/retention/cleanup', async (req: Request, res: Response) => {
  try {
    const retentionDays: number = req.body.retentionDays ?? 365;
    const cutoff = new Date(Date.now() - retentionDays * 86400000);

    const result = await AuditLog.deleteMany({
      merchantId: req.merchantId,
      createdAt: { $lt: cutoff },
    });

    res.json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
        archivedCount: 0,
        message: `Deleted ${result.deletedCount} audit log entries older than ${retentionDays} days`,
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /audit/retention/archives
router.get('/retention/archives', async (req: Request, res: Response) => {
  // Archives are not persisted to disk in the current implementation.
  // Return an empty list so the client does not receive a 404.
  res.json({ success: true, data: { archives: [], count: 0 } });
});

export default router;

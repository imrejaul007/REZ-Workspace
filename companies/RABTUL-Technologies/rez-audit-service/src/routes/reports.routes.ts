import { Router, Request, Response, NextFunction } from 'express';
import { auditLogger } from '../services/auditLogger';

const router = Router();

router.get('/templates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = [
      {
        id: 'security-summary',
        name: 'Security Summary Report',
        description: 'Weekly security events and access patterns',
        category: 'security',
        generatedAt: 'Weekly'
      },
      {
        id: 'compliance-overview',
        name: 'Compliance Overview',
        description: 'SOC2, GDPR, and HIPAA compliance status',
        category: 'compliance',
        generatedAt: 'Monthly'
      },
      {
        id: 'user-activity',
        name: 'User Activity Report',
        description: 'Detailed user activity and behavior analysis',
        category: 'activity',
        generatedAt: 'On-demand'
      },
      {
        id: 'data-access',
        name: 'Data Access Report',
        description: 'Who accessed what data and when',
        category: 'data',
        generatedAt: 'Daily'
      },
      {
        id: 'access-audit',
        name: 'Access Audit Trail',
        description: 'Complete access control audit log',
        category: 'access',
        generatedAt: 'On-demand'
      }
    ];

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    next(error);
  }
});

router.post('/templates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, category, query } = req.body;

    res.status(201).json({
      success: true,
      data: {
        id: `template-${Date.now()}`,
        name,
        description,
        category,
        query,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/executive-summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const summary = auditLogger.getSummary({ startDate, endDate });

    const report = {
      period: { start: startDate, end: endDate },
      generatedAt: new Date(),
      overview: {
        totalEvents: summary.totalEvents,
        successRate: summary.totalEvents > 0
          ? ((summary.successCount / summary.totalEvents) * 100).toFixed(2) + '%'
          : 'N/A',
        avgEventsPerDay: Math.round(summary.totalEvents / 30)
      },
      topEventTypes: Object.entries(summary.eventsByType)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([type, count]) => ({ type, count })),
      topActors: Object.entries(summary.eventsByActor)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([actor, count]) => ({ actor, count })),
      compliance: {
        policyViolations: summary.failureCount,
        accessDenials: summary.eventsByResource['authz'] || 0
      },
      recommendations: [
        'Continue monitoring access patterns for anomalies',
        'Review failed authentication attempts weekly',
        'Ensure all compliance requirements are met'
      ]
    };

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
});

router.get('/security', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const events = auditLogger.query({
      startDate,
      endDate,
      limit: 10000
    });

    const securityEvents = events.filter(e =>
      e.eventType.includes('auth') ||
      e.eventType.includes('access') ||
      e.eventType.includes('denied')
    );

    const failedAuths = securityEvents.filter(e =>
      e.eventType.includes('failed') || e.status === 'failure'
    );

    const report = {
      period: { start: startDate, end: endDate },
      generatedAt: new Date(),
      summary: {
        totalSecurityEvents: securityEvents.length,
        failedAuthentications: failedAuths.length,
        accessDenials: securityEvents.filter(e => e.eventType.includes('denied')).length,
        suspiciousActivities: failedAuths.length > 10 ? 'ELEVATED' : 'NORMAL'
      },
      topFailedActors: failedAuths.reduce((acc, e) => {
        acc[e.actor.id] = (acc[e.actor.id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentAlerts: securityEvents.slice(0, 10),
      recommendations: failedAuths.length > 10
        ? ['Review failed authentication patterns', 'Consider implementing additional authentication factors']
        : ['Security posture is healthy']
    };

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
});

router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { templateId, startDate, endDate, format, filters } = req.body;

    const reportId = `report-${Date.now()}`;

    res.status(202).json({
      success: true,
      data: {
        reportId,
        templateId,
        status: 'GENERATING',
        estimatedCompletion: new Date(Date.now() + 30000).toISOString(),
        downloadUrl: `/api/reports/download/${reportId}`
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

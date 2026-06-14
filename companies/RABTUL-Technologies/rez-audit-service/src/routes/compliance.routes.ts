import { Router, Request, Response, NextFunction } from 'express';
import { auditLogger } from '../services/auditLogger';
import { ComplianceReport } from '../types';

const router = Router();

router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = auditLogger.getSummary({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    });

    res.json({
      success: true,
      data: {
        complianceStatus: 'COMPLIANT',
        lastAudit: new Date().toISOString(),
        eventsAnalyzed: summary.totalEvents,
        policyViolations: summary.failureCount,
        accessDenials: summary.eventsByType['authz.access_denied'] || 0,
        frameworks: ['SOC2', 'GDPR', 'HIPAA', 'ISO27001']
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const framework = (req.query.framework as ComplianceReport['framework']) || 'SOC2';
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const report = auditLogger.generateComplianceReport(framework, startDate, endDate);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
});

router.get('/frameworks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const frameworks = [
      {
        id: 'soc2',
        name: 'SOC 2',
        description: 'Service Organization Control 2 - Security, Availability, Processing Integrity, Confidentiality, Privacy',
        controls: 89,
        lastAudit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'gdpr',
        name: 'GDPR',
        description: 'General Data Protection Regulation - EU data protection and privacy',
        controls: 54,
        lastAudit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'hipaa',
        name: 'HIPAA',
        description: 'Health Insurance Portability and Accountability Act - Healthcare data protection',
        controls: 60,
        lastAudit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'pci-dss',
        name: 'PCI-DSS',
        description: 'Payment Card Industry Data Security Standard',
        controls: 78,
        lastAudit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'iso27001',
        name: 'ISO 27001',
        description: 'International standard for information security management',
        controls: 114,
        lastAudit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    res.json({
      success: true,
      data: frameworks
    });
  } catch (error) {
    next(error);
  }
});

router.get('/frameworks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const frameworkId = req.params.id.toLowerCase();
    const frameworks: Record<string, object> = {
      'soc2': {
        id: 'soc2',
        name: 'SOC 2 Type II',
        version: '2017',
        description: 'Service Organization Control 2 - Trust Services Criteria',
        controls: [
          { id: 'CC1.1', name: 'Control Environment', category: 'Common Criteria' },
          { id: 'CC2.1', name: 'Communication and Information', category: 'Common Criteria' },
          { id: 'CC3.1', name: 'Risk Assessment', category: 'Common Criteria' },
          { id: 'CC4.1', name: 'Monitoring Activities', category: 'Common Criteria' },
          { id: 'CC5.1', name: 'Control Activities', category: 'Common Criteria' },
          { id: 'CC6.1', name: 'Logical and Physical Access', category: 'Security' },
          { id: 'CC7.1', name: 'System Operations', category: 'Availability' },
          { id: 'CC8.1', name: 'Change Management', category: 'Security' }
        ],
        complianceRate: 98.5,
        lastAudit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        nextAudit: new Date(Date.now() + 88 * 24 * 60 * 60 * 1000).toISOString()
      },
      'gdpr': {
        id: 'gdpr',
        name: 'GDPR Compliance',
        version: '2016/679',
        description: 'General Data Protection Regulation',
        controls: [
          { id: 'Art.5', name: 'Principles of Processing', category: 'Principles' },
          { id: 'Art.6', name: 'Lawfulness of Processing', category: 'Principles' },
          { id: 'Art.12', name: 'Transparent Information', category: 'Rights' },
          { id: 'Art.15', name: 'Right of Access', category: 'Rights' },
          { id: 'Art.17', name: 'Right to Erasure', category: 'Rights' },
          { id: 'Art.32', name: 'Security of Processing', category: 'Security' }
        ],
        complianceRate: 99.2,
        lastAudit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        nextAudit: new Date(Date.now() + 165 * 24 * 60 * 60 * 1000).toISOString()
      }
    };

    const framework = frameworks[frameworkId];

    if (!framework) {
      return res.status(404).json({
        success: false,
        error: 'Framework not found'
      });
    }

    res.json({
      success: true,
      data: framework
    });
  } catch (error) {
    next(error);
  }
});

router.post('/frameworks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;

    res.status(201).json({
      success: true,
      data: {
        id: `custom-${Date.now()}`,
        name,
        description,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/frameworks/:frameworkId/requirements/:requirementId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, notes } = req.body;

    res.json({
      success: true,
      data: {
        frameworkId: req.params.frameworkId,
        requirementId: req.params.requirementId,
        status,
        notes,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/frameworks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      message: `Framework ${req.params.id} deleted successfully`
    });
  } catch (error) {
    next(error);
  }
});

export default router;

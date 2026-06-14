import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { consentService } from '../services/consentService';
import { erasureService } from '../services/erasureService';
import { privacyPolicyService } from '../services/privacyPolicyService';
import { auditService } from '../services/auditService';
import { dataRequestModel } from '../models/DataRequest';
import {
  DataRequestType,
  DataRequestStatus,
  ConsentType,
  ConsentStatus
} from '../types';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'rez-gdpr-service-secret-change-in-production';

interface JwtPayload {
  userId: string;
  email?: string;
  iat: number;
  exp: number;
}

interface AuthenticatedRequest extends Request {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  user?: JwtPayload;
}

// JWT Authentication Middleware
const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Authorization header required' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ success: false, error: 'Invalid authorization format. Use: Bearer <token>' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, error: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

const extractMetadata = (req: Request) => ({
  ipAddress: req.ip || req.socket.remoteAddress,
  userAgent: req.get('user-agent')
});

// Apply JWT auth to all routes after this middleware
// Public routes are listed below with explicit comments

// Protected routes (require JWT)
router.post('/requests', authLimiter, authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, type, dataCategories, reason } = req.body;

    if (!userId || !type) {
      return res.status(400).json({
        success: false,
        error: 'userId and type are required'
      });
    }

    if (!Object.values(DataRequestType).includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid request type. Must be one of: ${Object.values(DataRequestType).join(', ')}`
      });
    }

    const request = await dataRequestModel.create({
      userId,
      type,
      dataCategories,
      reason,
      metadata: extractMetadata(req)
    });

    res.status(201).json({
      success: true,
      data: request
    });
  } catch (error) {
    next(error);
  }
});

router.get('/requests/:id', authLimiter, authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await dataRequestModel.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    next(error);
  }
});

router.get('/requests/user/:userId', authLimiter, authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await dataRequestModel.findByUserId(req.params.userId, { page, limit });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/requests/:id', authLimiter, authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, notes, rejectionReason, processor } = req.body;

    if (status && !Object.values(DataRequestStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${Object.values(DataRequestStatus).join(', ')}`
      });
    }

    const updated = await dataRequestModel.update(req.params.id, {
      status,
      notes,
      rejectionReason,
      processor
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    await auditService.log({
      action: 'REQUEST_UPDATED',
      requestId: req.params.id,
      userId: updated.userId,
      details: { status, notes, rejectionReason, processor },
      ipAddress: extractMetadata(req).ipAddress,
      result: 'success'
    });

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

router.post('/consents', authLimiter, authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, consentType, granted } = req.body;

    if (!userId || !consentType) {
      return res.status(400).json({
        success: false,
        error: 'userId and consentType are required'
      });
    }

    if (!Object.values(ConsentType).includes(consentType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid consent type. Must be one of: ${Object.values(ConsentType).join(', ')}`
      });
    }

    const metadata = extractMetadata(req);
    const consent = granted
      ? await consentService.grantConsent({
          userId,
          consentType,
          status: ConsentStatus.GRANTED,
          source: 'api',
          ...metadata
        })
      : await consentService.denyConsent({
          userId,
          consentType,
          status: ConsentStatus.DENIED,
          source: 'api',
          ...metadata
        });

    res.status(201).json({
      success: true,
      data: consent
    });
  } catch (error) {
    next(error);
  }
});

router.post('/consents/batch', authLimiter, authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, consents } = req.body;

    if (!userId || !consents || !Array.isArray(consents)) {
      return res.status(400).json({
        success: false,
        error: 'userId and consents array are required'
      });
    }

    const metadata = extractMetadata(req);
    const results = await consentService.batchConsentUpdate(userId, consents, metadata.ipAddress, metadata.userAgent);

    res.status(201).json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

router.get('/consents/user/:userId', authLimiter, authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeOnly = req.query.active === 'true';

    if (activeOnly) {
      const consents = await consentService.getUserActiveConsents(req.params.userId);
      return res.json({
        success: true,
        data: consents
      });
    }

    const consents = await consentService.getUserConsents(req.params.userId);
    res.json({
      success: true,
      data: consents
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/consents/:userId/:consentType', authLimiter, authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, consentType } = req.params;

    if (!Object.values(ConsentType).includes(consentType as ConsentType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid consent type. Must be one of: ${Object.values(ConsentType).join(', ')}`
      });
    }

    const metadata = extractMetadata(req);
    const consent = await consentService.withdrawConsent(
      userId,
      consentType as ConsentType,
      metadata.ipAddress,
      metadata.userAgent
    );

    if (!consent) {
      return res.status(404).json({
        success: false,
        error: 'Consent not found'
      });
    }

    res.json({
      success: true,
      data: consent
    });
  } catch (error) {
    next(error);
  }
});

router.get('/consents/banner/active', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const banner = await consentService.getActiveBanner();
    res.json({
      success: true,
      data: banner
    });
  } catch (error) {
    next(error);
  }
});

router.post('/consents/banner', authLimiter, authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const banner = await consentService.createBanner({
      ...req.body,
      isActive: req.body.isActive || false,
      theme: req.body.theme || 'light',
      position: req.body.position || 'bottom'
    });

    res.status(201).json({
      success: true,
      data: banner
    });
  } catch (error) {
    next(error);
  }
});

router.get('/consents/banner', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const banners = await consentService.getAllBanners();
    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    next(error);
  }
});

router.post('/erasure/request', authLimiter, authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, dataCategories, reason } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const metadata = extractMetadata(req);
    const request = await erasureService.requestErasure(
      userId,
      dataCategories || ['all'],
      reason,
      metadata.ipAddress,
      metadata.userAgent
    );

    res.status(201).json({
      success: true,
      data: request
    });
  } catch (error) {
    next(error);
  }
});

router.post('/erasure/process/:requestId', authLimiter, authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { erasureMethod } = req.body;

    if (erasureMethod && !['full', 'anonymized', 'pseudonymized'].includes(erasureMethod)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid erasure method. Must be one of: full, anonymized, pseudonymized'
      });
    }

    const metadata = extractMetadata(req);
    const result = await erasureService.processErasure(
      req.params.requestId,
      erasureMethod || 'full',
      req.body.processorId,
      metadata.ipAddress
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Request not found or processing failed'
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.post('/erasure/verify/:requestId', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const verification = await erasureService.verifyErasure(req.params.requestId);
    res.json({
      success: true,
      data: verification
    });
  } catch (error) {
    next(error);
  }
});

router.post('/export/:userId', authLimiter, authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const format = req.body.format || 'json';

    if (!['json', 'csv', 'xml'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid format. Must be one of: json, csv, xml'
      });
    }

    const metadata = extractMetadata(req);
    const exportResult = await erasureService.exportUserData(
      req.params.userId,
      format,
      metadata.ipAddress,
      metadata.userAgent
    );

    res.json({
      success: true,
      data: exportResult
    });
  } catch (error) {
    next(error);
  }
});

router.get('/export/:exportId', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const exportData = await erasureService.getExport(req.params.exportId);

    if (!exportData) {
      return res.status(404).json({
        success: false,
        error: 'Export not found or expired'
      });
    }

    if (new Date(exportData.expiresAt) < new Date()) {
      return res.status(410).json({
        success: false,
        error: 'Export has expired'
      });
    }

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    next(error);
  }
});

router.get('/privacy-policy/active', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = await privacyPolicyService.findActive();
    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    next(error);
  }
});

router.get('/privacy-policy/:id', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = await privacyPolicyService.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found'
      });
    }

    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    next(error);
  }
});

router.post('/privacy-policy', authLimiter, authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = await privacyPolicyService.create(req.body);
    res.status(201).json({
      success: true,
      data: policy
    });
  } catch (error) {
    next(error);
  }
});

router.post('/privacy-policy/:id/publish', authLimiter, authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = await privacyPolicyService.publish(req.params.id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found'
      });
    }

    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    next(error);
  }
});

router.post('/privacy-policy/:id/accept/:userId', authLimiter, authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const metadata = extractMetadata(req);
    const accepted = await privacyPolicyService.accept(
      req.params.userId,
      req.params.id,
      metadata.ipAddress,
      metadata.userAgent
    );

    if (!accepted) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found'
      });
    }

    res.json({
      success: true,
      message: 'Policy accepted successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/privacy-policy/user/:userId/status', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const hasAccepted = await privacyPolicyService.hasAcceptedCurrentPolicy(req.params.userId);
    const acceptedPolicies = await privacyPolicyService.getUserAcceptedPolicies(req.params.userId);
    const currentPolicy = await privacyPolicyService.findActive();

    res.json({
      success: true,
      data: {
        hasAcceptedCurrentPolicy: hasAccepted,
        currentPolicyId: currentPolicy?.id,
        acceptedPolicies: acceptedPolicies.map(p => ({
          id: p.id,
          version: p.version,
          title: p.title
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/audit/user/:userId', authLimiter, authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const history = await consentService.getConsentHistory(req.params.userId, { page, limit });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
});

router.get('/audit/export', authLimiter, authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const format = req.query.format as string || 'json';
    const userId = req.query.userId as string;
    const action = req.query.action as string;
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

    const logs = await auditService.exportLogs(
      format as 'json' | 'csv',
      { userId, action, dateFrom, dateTo }
    );

    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.${format}"`);
    res.send(logs);
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [requestStats, consentStats, erasureStats, auditStats, policyStats] = await Promise.all([
      dataRequestModel.getStats(),
      consentService.getConsentStats(),
      erasureService.getErasureStats(),
      auditService.getStats(),
      privacyPolicyService.getStats()
    ]);

    res.json({
      success: true,
      data: {
        requests: requestStats,
        consents: consentStats,
        erasures: erasureStats,
        audit: auditStats,
        policies: policyStats
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'gdpr-compliance',
    timestamp: new Date().toISOString()
  });
});

export default router;

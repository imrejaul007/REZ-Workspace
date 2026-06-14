import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { signatureService } from '../services';
import {
  RequestSignatureSchema,
  SignDocumentSchema,
  RejectSignatureSchema,
  SignatureQuerySchema,
} from '../validators';

const router = Router();

// Helper to extract user and company from headers
const getContext = (req: Request) => ({
  userId: req.headers['x-user-id'] as string || 'system',
  userName: req.headers['x-user-name'] as string || 'System',
  companyId: req.headers['x-company-id'] as string || process.env.DEFAULT_COMPANY_ID || 'corpservice',
  ipAddress: req.ip || req.socket.remoteAddress,
  userAgent: req.headers['user-agent'],
});

/**
 * POST /api/sign/request - Request signature on a document
 */
router.post('/request', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, userName, companyId } = getContext(req);
    const input = RequestSignatureSchema.parse(req.body);

    const signature = await signatureService.requestSignature(input, userId, userName, companyId);

    res.status(201).json({
      success: true,
      data: signature,
      message: 'Signature request created successfully',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
});

/**
 * POST /api/sign/:id - Sign a document
 */
router.post('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, ipAddress, userAgent } = getContext(req);
    const input = SignDocumentSchema.parse({
      ...req.body,
      signatureId: req.params.id,
    });

    const signature = await signatureService.sign(input, ipAddress, userAgent);

    res.json({
      success: true,
      data: signature,
      message: 'Document signed successfully',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
});

/**
 * POST /api/sign/:id/reject - Reject a signature request
 */
router.post('/:id/reject', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, ipAddress, userAgent } = getContext(req);
    const input = RejectSignatureSchema.parse({
      ...req.body,
      signatureId: req.params.id,
    });

    const signature = await signatureService.reject(input, ipAddress, userAgent);

    res.json({
      success: true,
      data: signature,
      message: 'Signature request rejected',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
});

/**
 * GET /api/sign/:id - Get signature by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = await signatureService.getById(req.params.id);

    if (!signature) {
      res.status(404).json({
        success: false,
        error: 'Signature request not found',
      });
      return;
    }

    res.json({
      success: true,
      data: signature,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sign/document/:documentId - Get signatures by document
 */
router.get('/document/:documentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signatures = await signatureService.getByDocument(req.params.documentId);

    res.json({
      success: true,
      data: signatures,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sign/pending/:userId - Get pending signatures for user
 */
router.get('/pending/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signatures = await signatureService.getPendingForUser(req.params.userId);

    res.json({
      success: true,
      data: signatures,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sign - List signatures with filters
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = SignatureQuerySchema.parse(req.query);
    const result = await signatureService.list(query);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    next(error);
  }
});

/**
 * POST /api/sign/:id/remind - Send reminder for signature
 */
router.post('/:id/remind', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = await signatureService.sendReminder(req.params.id);

    if (!signature) {
      res.status(404).json({
        success: false,
        error: 'Signature request not found',
      });
      return;
    }

    res.json({
      success: true,
      data: signature,
      message: 'Reminder sent successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/sign/:id - Cancel signature request
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = await signatureService.cancel(req.params.id);

    if (!signature) {
      res.status(404).json({
        success: false,
        error: 'Signature request not found or already processed',
      });
      return;
    }

    res.json({
      success: true,
      data: signature,
      message: 'Signature request cancelled',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sign/stats - Get signature statistics
 */
router.get('/meta/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyId } = getContext(req);
    const stats = await signatureService.getStats(companyId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sign/expire - Expire old signatures (admin/cleanup)
 */
router.post('/expire', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await signatureService.expireOldSignatures();

    res.json({
      success: true,
      data: { expired: count },
      message: `Expired ${count} signature requests`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

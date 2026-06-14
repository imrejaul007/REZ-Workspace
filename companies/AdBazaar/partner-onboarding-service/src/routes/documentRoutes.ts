import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { documentService } from '../services/documentService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Validation schemas
const uploadDocumentSchema = z.object({
  partnerId: z.string().min(1),
  type: z.enum(['gst_certificate', 'pan_card', 'address_proof', 'bank_statement', 'agreement', 'logo', 'other']),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  fileSize: z.number().min(1),
  mimeType: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

const verifyDocumentSchema = z.object({
  verifiedBy: z.string().min(1),
});

const rejectDocumentSchema = z.object({
  reason: z.string().min(1),
  rejectedBy: z.string().min(1),
});

/**
 * POST /api/documents
 * Upload a document
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const input = uploadDocumentSchema.parse(req.body);
    const document = await documentService.uploadDocument(input);

    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Failed to upload document',
    });
  }
});

/**
 * GET /api/documents/:id
 * Get document by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const document = await documentService.getDocument(req.params.id);

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Document not found',
      });
      return;
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document',
    });
  }
});

/**
 * POST /api/documents/:id/verify
 * Verify document
 */
router.post('/:id/verify', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { verifiedBy } = verifyDocumentSchema.parse(req.body);
    const document = await documentService.verifyDocument(req.params.id, verifiedBy);

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Document not found',
      });
      return;
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Failed to verify document',
    });
  }
});

/**
 * POST /api/documents/:id/reject
 * Reject document
 */
router.post('/:id/reject', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { reason, rejectedBy } = rejectDocumentSchema.parse(req.body);
    const document = await documentService.rejectDocument(req.params.id, reason, rejectedBy);

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Document not found',
      });
      return;
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Failed to reject document',
    });
  }
});

/**
 * GET /api/documents/partner/:partnerId
 * Get documents for a partner
 */
router.get('/partner/:partnerId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { type, status } = req.query;
    const documents = await documentService.getDocumentsByPartner(req.params.partnerId, {
      type: type as any,
      status: status as any,
    });

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents',
    });
  }
});

/**
 * GET /api/documents/partner/:partnerId/summary
 * Get document types summary for a partner
 */
router.get('/partner/:partnerId/summary', authMiddleware, async (req: Request, res: Response) => {
  try {
    const summary = await documentService.getDocumentTypesSummary(req.params.partnerId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document summary',
    });
  }
});

/**
 * DELETE /api/documents/:id
 * Delete document
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const deleted = await documentService.deleteDocument(req.params.id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Document not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Document deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete document',
    });
  }
});

export default router;
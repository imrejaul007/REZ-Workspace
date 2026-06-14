import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { documentService } from '../services';
import {
  GenerateDocumentSchema,
  DocumentQuerySchema,
} from '../validators';
import { DocumentStatus } from '../types';

const router = Router();

// Helper to extract user and company from headers
const getContext = (req: Request) => ({
  userId: req.headers['x-user-id'] as string || 'system',
  userName: req.headers['x-user-name'] as string || 'System',
  companyId: req.headers['x-company-id'] as string || process.env.DEFAULT_COMPANY_ID || 'corpservice',
});

/**
 * POST /api/documents/generate - Generate a document
 */
router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, userName, companyId } = getContext(req);
    const input = GenerateDocumentSchema.parse(req.body);

    const document = await documentService.generate(input, userId, userName, companyId);

    res.status(201).json({
      success: true,
      data: document,
      message: 'Document generated successfully',
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
 * GET /api/documents - List documents
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = DocumentQuerySchema.parse(req.query);
    const result = await documentService.list(query);

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
 * GET /api/documents/:id - Get document by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await documentService.getById(req.params.id);

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
    next(error);
  }
});

/**
 * GET /api/documents/:id/pdf - Generate PDF for document
 */
router.get('/:id/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pdfUrl = await documentService.generatePDF(req.params.id);

    res.json({
      success: true,
      data: { pdfUrl },
      message: 'PDF generated successfully',
    });
  } catch (error) {
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
 * GET /api/documents/employee/:employeeId - Get documents by employee
 */
router.get('/employee/:employeeId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page, limit } = req.query;
    const result = await documentService.getByEmployee(req.params.employeeId, {
      status: status as DocumentStatus | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/documents/:id - Delete document
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await documentService.delete(req.params.id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Document not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/documents/stats - Get document statistics
 */
router.get('/meta/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyId } = getContext(req);
    const stats = await documentService.getStats(companyId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

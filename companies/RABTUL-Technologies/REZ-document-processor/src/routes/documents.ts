import { Router, Request, Response } from 'express';
import {
  createDocument,
  getDocument,
  processDocument,
  getDocumentSections,
  getDocumentEntities,
  searchDocuments,
  getJob,
  getDocumentStats,
} from '../services/document.service';
import logger from '../utils/logger';

const router = Router();

// POST /api/documents - Upload document
router.post('/', (req: Request, res: Response) => {
  try {
    const { filename, mimeType, size, content } = req.body;

    if (!filename || !mimeType || !size) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const doc = createDocument(filename, mimeType, size, content);
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    logger.error('Error creating document:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/documents - Search documents
router.get('/', (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (q && typeof q === 'string') {
      const results = searchDocuments(q);
      res.json({ success: true, data: results, count: results.length });
    } else {
      res.json({ success: true, data: [], count: 0 });
    }
  } catch (error) {
    logger.error('Error searching documents:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/documents/stats - Get document statistics
router.get('/stats', (_req: Request, res: Response) => {
  res.json({ success: true, data: getDocumentStats() });
});

// GET /api/documents/:id - Get document by ID
router.get('/:id', (req: Request, res: Response) => {
  const doc = getDocument(req.params.id);
  if (!doc) {
    res.status(404).json({ success: false, error: 'Document not found' });
    return;
  }
  res.json({ success: true, data: doc });
});

// POST /api/documents/:id/process - Process document
router.post('/:id/process', (req: Request, res: Response) => {
  try {
    const { operations } = req.body;
    const ops = operations || ['extract_text'];

    processDocument(req.params.id, ops).then(result => {
      if (!result) {
        res.status(404).json({ success: false, error: 'Document not found' });
        return;
      }
      res.json({ success: true, data: result });
    });
  } catch (error) {
    logger.error('Error processing document:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/documents/:id/sections - Get document sections
router.get('/:id/sections', (req: Request, res: Response) => {
  const sections = getDocumentSections(req.params.id);
  if (!sections) {
    res.status(404).json({ success: false, error: 'Document not found' });
    return;
  }
  res.json({ success: true, data: sections });
});

// GET /api/documents/:id/entities - Get extracted entities
router.get('/:id/entities', (req: Request, res: Response) => {
  const entities = getDocumentEntities(req.params.id);
  if (!entities) {
    res.status(404).json({ success: false, error: 'Document not found' });
    return;
  }
  res.json({ success: true, data: entities });
});

// GET /api/jobs/:jobId - Get processing job status
router.get('/jobs/:jobId', (req: Request, res: Response) => {
  const job = getJob(req.params.jobId);
  if (!job) {
    res.status(404).json({ success: false, error: 'Job not found' });
    return;
  }
  res.json({ success: true, data: job });
});

export default router;

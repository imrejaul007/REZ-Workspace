import { Router, Request, Response } from 'express';
import {
  indexDocument,
  getDocument,
  deleteDocument,
  updateDocument,
  search,
  getStats,
  getDocumentsBySource,
  getDocumentsByUser,
  bulkIndex,
} from '../services/knowledge.service';
import logger from '../utils/logger';

const router = Router();

// POST /api/documents - Index a document
router.post('/documents', (req: Request, res: Response) => {
  try {
    const { content, metadata } = req.body;

    if (!content) {
      res.status(400).json({ success: false, error: 'Content is required' });
      return;
    }

    const doc = indexDocument(content, metadata || {});
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    logger.error('Error indexing document:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/documents/bulk - Bulk index documents
router.post('/documents/bulk', (req: Request, res: Response) => {
  try {
    const { documents } = req.body;

    if (!Array.isArray(documents)) {
      res.status(400).json({ success: false, error: 'Documents array is required' });
      return;
    }

    const indexed = bulkIndex(documents);
    res.status(201).json({ success: true, data: indexed, count: indexed.length });
  } catch (error) {
    logger.error('Error bulk indexing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/documents - List documents
router.get('/documents', (req: Request, res: Response) => {
  try {
    const { source, userId } = req.query;

    let results: any[] = [];
    if (source && typeof source === 'string') {
      results = getDocumentsBySource(source);
    } else if (userId && typeof userId === 'string') {
      results = getDocumentsByUser(userId);
    }

    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    logger.error('Error listing documents:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/documents/stats - Get index stats
router.get('/documents/stats', (_req: Request, res: Response) => {
  res.json({ success: true, data: getStats() });
});

// GET /api/documents/:id - Get document by ID
router.get('/documents/:id', (req: Request, res: Response) => {
  const doc = getDocument(req.params.id);
  if (!doc) {
    res.status(404).json({ success: false, error: 'Document not found' });
    return;
  }
  res.json({ success: true, data: doc });
});

// PUT /api/documents/:id - Update document
router.put('/documents/:id', (req: Request, res: Response) => {
  try {
    const { content, metadata } = req.body;
    const doc = updateDocument(req.params.id, { content, metadata });
    if (!doc) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }
    res.json({ success: true, data: doc });
  } catch (error) {
    logger.error('Error updating document:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/documents/:id - Delete document
router.delete('/documents/:id', (req: Request, res: Response) => {
  const deleted = deleteDocument(req.params.id);
  if (!deleted) {
    res.status(404).json({ success: false, error: 'Document not found' });
    return;
  }
  res.json({ success: true, message: 'Document deleted' });
});

// GET /api/search - Search documents
router.get('/search', (req: Request, res: Response) => {
  try {
    const { q, source, type, tags, category, userId, companyId, limit, hybrid } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({ success: false, error: 'Query parameter q is required' });
      return;
    }

    const filters: any = {};
    if (source) filters.source = source as string;
    if (type) filters.type = type as string;
    if (tags) filters.tags = (tags as string).split(',');
    if (category) filters.category = category as string;
    if (userId) filters.userId = userId as string;
    if (companyId) filters.companyId = companyId as string;

    const results = search({
      query: q,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      limit: limit ? parseInt(limit as string, 10) : 10,
      hybrid: hybrid !== 'false',
    });

    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    logger.error('Error searching:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/search - Search documents (POST body)
router.post('/search', (req: Request, res: Response) => {
  try {
    const { query, filters, limit, hybrid } = req.body;

    if (!query) {
      res.status(400).json({ success: false, error: 'Query is required' });
      return;
    }

    const results = search({ query, filters, limit: limit || 10, hybrid: hybrid !== false });
    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    logger.error('Error searching:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;

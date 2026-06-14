/**
 * Document Routes
 *
 * CRUD for document management:
 * - Upload documents
 * - List by entity
 * - Download/view
 * - Delete documents
 */

import { Router, Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import multer from 'multer';
import { Document } from '../models/Document';
import { merchantAuth } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();
router.use(merchantAuth);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
});

// ── Validation ───────────────────────────────────────────────────────────────

const VALID_ENTITY_TYPES = ['supplier', 'purchase_order', 'payment', 'inventory', 'compliance'];
const VALID_DOC_TYPES = [
  'invoice', 'challan', 'receipt', 'gst_certificate',
  'pan_card', 'address_proof', 'bank_statement',
  'agreement', 'kyc', 'other'
];

// ── Routes ──────────────────────────────────────────────────────────────────

/**
 * POST /documents
 * Upload a document
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, type, name, tags } = req.body;

    // Validate entity
    if (!VALID_ENTITY_TYPES.includes(entityType)) {
      res.status(400).json({ success: false, message: 'Invalid entity type' });
      return;
    }

    if (!VALID_DOC_TYPES.includes(type)) {
      res.status(400).json({ success: false, message: 'Invalid document type' });
      return;
    }

    if (!entityId || !mongoose.Types.ObjectId.isValid(entityId)) {
      res.status(400).json({ success: false, message: 'Valid entityId required' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'File required' });
      return;
    }

    // In production, upload to cloud storage (S3, GCS, Cloudinary)
    // For now, store reference (implement actual upload)
    const fileUrl = `uploads/${Date.now()}-${req.file.originalname}`;

    const doc = await Document.create({
      merchantId: new Types.ObjectId(req.merchantId!),
      entityType,
      entityId: new Types.ObjectId(entityId),
      type,
      name: name || req.file.originalname,
      fileName: req.file.originalname,
      fileUrl,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.userId ? new Types.ObjectId(req.userId) : undefined,
      tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
    });

    logger.info(`[Documents] Uploaded ${doc.name} for ${entityType}/${entityId}`);

    res.status(201).json({
      success: true,
      message: 'Document uploaded',
      data: doc,
    });
  } catch (err) {
    logger.error('[Documents] Upload failed', { error: err });
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

/**
 * GET /documents
 * List documents with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      entityType,
      entityId,
      type,
      tags,
      page = '1',
      limit = '20',
    } = req.query;

    const query: unknown = { merchantId: new Types.ObjectId(req.merchantId!) };

    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = new Types.ObjectId(entityId as string);
    if (type) query.type = type;
    if (tags) {
      const tagList = (tags as string).split(',').map((t) => t.trim());
      query.tags = { $in: tagList };
    }

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const skip = (pageNum - 1) * limitNum;

    const [docs, total] = await Promise.all([
      Document.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Document.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: docs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    logger.error('[Documents] List failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to list documents' });
  }
});

/**
 * GET /documents/entity/:entityType/:entityId
 * Get documents for a specific entity
 */
router.get('/entity/:entityType/:entityId', async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;

    if (!VALID_ENTITY_TYPES.includes(entityType)) {
      res.status(400).json({ success: false, message: 'Invalid entity type' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(entityId)) {
      res.status(400).json({ success: false, message: 'Invalid entity ID' });
      return;
    }

    const docs = await Document.find({
      merchantId: new Types.ObjectId(req.merchantId!),
      entityType,
      entityId: new Types.ObjectId(entityId),
    })
      .sort({ createdAt: -1 })
      .lean();

    // Group by type
    const grouped = docs.reduce((acc: Record<string, unknown[]>, doc) => {
      if (!acc[doc.type]) acc[doc.type] = [];
      acc[doc.type].push(doc);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        documents: docs,
        grouped,
        total: docs.length,
      },
    });
  } catch (err) {
    logger.error('[Documents] Entity fetch failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
});

/**
 * GET /documents/:id
 * Get single document
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid document ID' });
      return;
    }

    const doc = await Document.findOne({
      _id: new Types.ObjectId(req.params.id),
      merchantId: new Types.ObjectId(req.merchantId!),
    }).lean();

    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    res.json({ success: true, data: doc });
  } catch (err) {
    logger.error('[Documents] Get failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to get document' });
  }
});

/**
 * GET /documents/:id/download
 * Download document
 */
router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid document ID' });
      return;
    }

    const doc = await Document.findOne({
      _id: new Types.ObjectId(req.params.id),
      merchantId: new Types.ObjectId(req.merchantId!),
    }).lean();

    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    // In production, redirect to signed URL from cloud storage
    res.json({
      success: true,
      data: {
        downloadUrl: doc.fileUrl,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
      },
    });
  } catch (err) {
    logger.error('[Documents] Download failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to download' });
  }
});

/**
 * PUT /documents/:id
 * Update document metadata
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid document ID' });
      return;
    }

    const { name, tags } = req.body;
    const update: unknown = {};
    if (name) update.name = name;
    if (tags) update.tags = tags.split(',').map((t: string) => t.trim());

    const doc = await Document.findOneAndUpdate(
      {
        _id: new Types.ObjectId(req.params.id),
        merchantId: new Types.ObjectId(req.merchantId!),
      },
      { $set: update },
      { new: true }
    );

    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    res.json({ success: true, data: doc });
  } catch (err) {
    logger.error('[Documents] Update failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to update' });
  }
});

/**
 * DELETE /documents/:id
 * Delete a document
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid document ID' });
      return;
    }

    const result = await Document.deleteOne({
      _id: new Types.ObjectId(req.params.id),
      merchantId: new Types.ObjectId(req.merchantId!),
    });

    if (result.deletedCount === 0) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    logger.info(`[Documents] Deleted document ${req.params.id}`);

    res.json({ success: true, message: 'Document deleted' });
  } catch (err) {
    logger.error('[Documents] Delete failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});

/**
 * DELETE /documents/bulk
 * Delete multiple documents
 */
router.delete('/', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: 'ids array required' });
      return;
    }

    const validIds = ids.filter((id: string) => mongoose.Types.ObjectId.isValid(id));
    const result = await Document.deleteMany({
      _id: { $in: validIds },
      merchantId: new Types.ObjectId(req.merchantId!),
    });

    logger.info(`[Documents] Bulk deleted ${result.deletedCount} documents`);

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} documents`,
    });
  } catch (err) {
    logger.error('[Documents] Bulk delete failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});

export default router;

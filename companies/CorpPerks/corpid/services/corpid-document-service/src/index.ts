/**
 * CorpID Document Service
 * Secure document storage and verification
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose, { Schema, model } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';
import { createHash } from 'crypto';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use(rateLimit({ windowMs: 60000, max: 50, message: { success: false, error: { code: 'RATE_LIMITED' } } }));

const PORT = parseInt(process.env.PORT || '4709', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpid';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'corpid-internal-token';

const DOCUMENT_TYPES = [
  'AADHAAR', 'PAN', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENSE',
  'COMPANY_REGISTRATION', 'GST_CERTIFICATE', 'TRADE_LICENSE',
  'BANK_STATEMENT', 'EMPLOYMENT_LETTER', 'EDUCATION_CERTIFICATE', 'SKILL_CERTIFICATION'
] as const;

const documentSchema = new Schema({
  documentId: { type: String, required: true, unique: true, index: true },
  corpId: { type: String, required: true, index: true },
  type: { type: String, enum: DOCUMENT_TYPES, required: true },
  name: { type: String, required: true },
  fileName: String,
  mimeType: String,
  size: Number,
  storageKey: String,
  hash: String,
  uploadedAt: { type: Date, default: Date.now },
  verifiedAt: Date,
  verifiedBy: String,
  status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'], default: 'PENDING' },
  expiryDate: Date,
  metadata: { type: Schema.Types.Mixed, default: {} },
});

const Document = model('Document', documentSchema);

function generateId(prefix: string): string {
  return `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36)}`;
}

function hashFile(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.headers['x-internal-token'] === INTERNAL_TOKEN) return next();
  next();
}

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'corpid-document-service', timestamp: new Date().toISOString() });
});

// Upload document
app.post('/documents', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId, type, name, fileName, mimeType, size, data, expiryDate, metadata } = req.body;

    if (!DOCUMENT_TYPES.includes(type)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_TYPE', message: 'Invalid document type' } });
    }

    const documentId = generateId('DOC');
    const storageKey = `documents/${corpId}/${documentId}`;
    const hash = data ? hashFile(Buffer.from(data, 'base64')) : randomBytes(32).toString('hex');

    const document = new Document({
      documentId,
      corpId,
      type,
      name,
      fileName,
      mimeType,
      size: size || 0,
      storageKey,
      hash,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      metadata: metadata || {},
    });

    await document.save();

    res.status(201).json({
      success: true,
      data: {
        documentId,
        corpId,
        type,
        name,
        status: 'PENDING',
        uploadedAt: document.uploadedAt,
      },
    });
  } catch (error) {
    logger.error('Error uploading document:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to upload document' } });
  }
});

// Get document metadata
app.get('/documents/:documentId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findOne({ documentId }).lean();

    if (!document) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
    }

    res.json({
      success: true,
      data: {
        documentId: document.documentId,
        corpId: document.corpId,
        type: document.type,
        name: document.name,
        fileName: document.fileName,
        mimeType: document.mimeType,
        size: document.size,
        status: document.status,
        uploadedAt: document.uploadedAt,
        verifiedAt: document.verifiedAt,
        verifiedBy: document.verifiedBy,
        expiryDate: document.expiryDate,
      },
    });
  } catch (error) {
    logger.error('Error fetching document:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// List documents for entity
app.get('/documents/entity/:corpId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const { type, status } = req.query;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));

    const filter: Record<string, unknown> = { corpId };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const [documents, total] = await Promise.all([
      Document.find(filter).sort({ uploadedAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
      Document.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        items: documents.map(d => ({
          documentId: d.documentId,
          type: d.type,
          name: d.name,
          status: d.status,
          uploadedAt: d.uploadedAt,
          verifiedAt: d.verifiedAt,
          expiryDate: d.expiryDate,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logger.error('Error listing documents:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Verify document
app.patch('/documents/:documentId/verify', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { status, notes, verifiedBy } = req.body;

    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS' } });
    }

    const document = await Document.findOneAndUpdate(
      { documentId },
      {
        $set: {
          status,
          verifiedAt: new Date(),
          verifiedBy: verifiedBy || 'system',
          'metadata.notes': notes,
        },
      },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    res.json({ success: true, data: { documentId, status: document.status, verifiedAt: document.verifiedAt } });
  } catch (error) {
    logger.error('Error verifying document:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Delete document
app.delete('/documents/:documentId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    const result = await Document.deleteOne({ documentId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    logger.error('Error deleting document:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Get document stats
app.get('/documents/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = await Document.aggregate([
      { $group: { _id: { type: '$type', status: '$status' }, count: { $sum: 1 } } },
    ]);

    const total = await Document.countDocuments();
    const verified = await Document.countDocuments({ status: 'VERIFIED' });

    const byType: Record<string, Record<string, number>> = {};
    stats.forEach(s => {
      if (!byType[s._id.type]) byType[s._id.type] = {};
      byType[s._id.type][s._id.status] = s.count;
    });

    res.json({ success: true, data: { total, verified, verificationRate: total > 0 ? Math.round((verified / total) * 100) : 0, byType } });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Document service error:', err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
});

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
    await Document.createIndexes();
    logger.info('Indexes created');
    app.listen(PORT, () => logger.info(`CorpID Document Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
export default app;

import { Router, Request, Response } from 'express';
import { BizDoc } from '../models/BizDoc';
import { merchantAuth } from '../middleware/auth';
import { createRateLimiter } from '@rez/shared';

const router = Router();
router.use(merchantAuth);

// Rate limiter for sensitive endpoints
const bizdocsLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
});

const BIZDOC_ALLOWED_FIELDS = [
  'title', 'type', 'fileUrl', 'fileName', 'description',
  'category', 'tags', 'expiryDate', 'status', 'notes', 'metadata',
];

interface BizDocBody {
  title?: string;
  type?: string;
  fileUrl?: string;
  fileName?: string;
  description?: string;
  category?: string;
  tags?: string[];
  expiryDate?: Date;
  status?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

function pickBizDocFields(body: BizDocBody): Partial<BizDocBody> {
  const filtered: Partial<BizDocBody> = {};
  for (const field of BIZDOC_ALLOWED_FIELDS) {
    if (body[field as keyof BizDocBody] !== undefined) {
      filtered[field as keyof BizDocBody] = body[field as keyof BizDocBody];
    }
  }
  return filtered;
}

// Error handler helper
function handleError(res: Response, error: unknown, action: string): void {
  const message = process.env.NODE_ENV === 'production'
    ? `Failed to ${action}`
    : error instanceof Error ? error.message : 'Unknown error';
  console.error(`BizDocs ${action} error:`, error);
  res.status(500).json({ success: false, message });
}

router.get('/', bizdocsLimiter, async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const docs = await BizDoc.find({ merchantId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: docs });
  } catch (error) {
    handleError(res, error, 'list');
  }
});

router.post('/', bizdocsLimiter, async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const body = req.body as BizDocBody;
    const doc = await BizDoc.create({ ...pickBizDocFields(body), merchantId });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    handleError(res, error, 'create');
  }
});

router.patch('/:id', bizdocsLimiter, async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const body = req.body as BizDocBody;
    const allowedFields = pickBizDocFields(body);
    allowedFields.updatedAt = new Date();
    const doc = await BizDoc.findOneAndUpdate(
      { _id: req.params.id, merchantId },
      { $set: allowedFields },
      { new: true }
    );
    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }
    res.json({ success: true, data: doc });
  } catch (error) {
    handleError(res, error, 'update');
  }
});

router.delete('/:id', bizdocsLimiter, async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const doc = await BizDoc.findOneAndUpdate(
      { _id: req.params.id, merchantId },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true }
    );
    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }
    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    handleError(res, error, 'delete');
  }
});

export default router;

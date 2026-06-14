import { logger } from './logger';
/**
 * RisnaEstate - Document Verification Service
 *
 * KYC/AML document verification for property bookings.
 */

import express, { Request, Response } from 'express';
import mongoose, { Schema, Document } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 4124;

app.use(express.json());
app.use(cors());
app.use(helmet());

// =============================================
// SCHEMAS
// =============================================

const DocumentSchema = new Schema({
  documentId: { type: String, unique: true, index: true },
  userId: { type: String, index: true },
  bookingId: String,
  type: {
    type: String,
    enum: ['passport', 'visa', 'emirates_id', 'address_proof', 'income_proof', 'company_docs']
  },
  number: String,
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  verificationScore: Number,
  checks: {
    authenticity: Boolean,
    expiry: Boolean,
    mismatch: Boolean
  },
  rejectionReason: String,
  imageUrl: String,
  verifiedBy: String,
  verifiedAt: Date,
  createdAt: Date
});

const Document = mongoose.model('Document', DocumentSchema);

// =============================================
// VERIFICATION RULES
// =============================================

const VERIFICATION_RULES = {
  passport: {
    required: true,
    minLength: 8,
    maxLength: 15,
    regex: /^[A-Z0-9]{6,20}$/
  },
  visa: {
    required: true,
    minLength: 10,
    maxLength: 20,
    regex: /^([A-Z]{1,2}\d{3,15}|\d{10,20})$/
  },
  emirates_id: {
    required: true,
    length: 15,
    regex: /^\d{3}-\d{4}-\d{7}$/
  },
  address_proof: {
    required: true,
    minAge: 3 // months
  }
};

// =============================================
// API ROUTES
// =============================================

app.get('/health', (req, res) => res.json({ service: 'document-verification', status: 'ok' }));

/**
 * Upload document
 * POST /api/documents
 */
app.post('/api/documents', async (req: Request, res: Response) => {
  try {
    const { userId, bookingId, type, number, imageUrl } = req.body;

    const document = new Document({
      documentId: `doc_${Date.now()}`,
      userId,
      bookingId,
      type,
      number,
      imageUrl,
      status: 'pending',
      verificationScore: 0
    });

    await document.save();

    // Auto-verify basic checks
    const result = verifyDocument(document);
    document.verificationScore = result.score;
    document.checks = result.checks;
    document.status = result.checks.authenticity && result.checks.expiry ? 'verified' : 'pending';
    await document.save();

    res.json({ success: true, document });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user documents
 * GET /api/documents/user/:userId
 */
app.get('/api/documents/user/:userId', async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.params.userId });
    res.json({ documents });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verify document (manual review)
 * PATCH /api/documents/:id/verify
 */
app.patch('/api/documents/:id/verify', async (req, res) => {
  try {
    const { status, verifiedBy, rejectionReason } = req.body;

    const document = await Document.findByIdAndUpdate(
      req.params.id,
      {
        status,
        verifiedBy,
        verifiedAt: new Date(),
        rejectionReason
      },
      { new: true }
    );

    res.json({ success: true, document });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Check verification status
 * GET /api/documents/status/:userId
 */
app.get('/api/documents/status/:userId', async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.params.userId });

    const verified = documents.filter(d => d.status === 'verified');
    const pending = documents.filter(d => d.status === 'pending');

    res.json({
      verified: verified.length,
      pending: pending.length,
      allVerified: pending.length === 0 && verified.length > 0,
      documents
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

function verifyDocument(doc: any): { score: number; checks: any } {
  const checks = {
    authenticity: false,
    expiry: true,
    mismatch: false
  };

  // Basic regex check
  const rule = VERIFICATION_RULES[doc.type];
  if (rule?.regex) {
    checks.authenticity = rule.regex.test(doc.number);
  } else {
    checks.authenticity = doc.number?.length > 5;
  }

  let score = checks.authenticity ? 70 : 20;
  if (checks.expiry) score += 30;

  return { score, checks };
}

async function start() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/risna-docs');
  await Document.createIndexes();
  app.listen(PORT, () => logger.info(`🚀 Document Service running on port ${PORT}`));
}

start();

export default app;

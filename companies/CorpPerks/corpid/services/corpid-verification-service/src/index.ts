/**
 * CorpID Verification Service
 * Handles KYC, KYB, employment, and education verification
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose, { Schema, model } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';
import { z } from 'zod';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
}));

// Config
const PORT = parseInt(process.env.PORT || '4703', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpid';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'corpid-internal-token';

// Validation schemas
const startIdentityVerificationSchema = z.object({
  corpId: z.string().regex(/^CI-(IND|BIZ|SUP|MER|DRV|FRN)-[A-Z0-9]{5}$/),
  documents: z.array(z.object({
    type: z.enum(['AADHAAR', 'PAN', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENSE']),
    documentNumber: z.string().min(1).max(50),
    name: z.string().min(1).max(200),
    dob: z.string().optional(),
  })).min(1),
  selfieData: z.string().optional(),
  addressData: z.object({
    line1: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string().default('India'),
  }).optional(),
});

const startBusinessVerificationSchema = z.object({
  corpId: z.string().regex(/^CI-(IND|BIZ|SUP|MER|DRV|FRN)-[A-Z0-9]{5}$/),
  documents: z.array(z.object({
    type: z.enum(['COMPANY_REGISTRATION', 'GST_CERTIFICATE', 'TRADE_LICENSE', 'PAN', 'BANK_STATEMENT']),
    documentNumber: z.string().min(1).max(50),
    name: z.string().min(1).max(200),
  })).min(1),
  authorizedPerson: z.object({
    name: z.string(),
    designation: z.string(),
    phone: z.string(),
    email: z.string().email(),
  }).optional(),
});

const startEmploymentVerificationSchema = z.object({
  corpId: z.string().regex(/^CI-(IND|BIZ|SUP|MER|DRV|FRN)-[A-Z0-9]{5}$/),
  employerName: z.string().min(1).max(200),
  employeeId: z.string().min(1).max(50),
  designation: z.string().min(1).max(100),
  department: z.string().optional(),
  joiningDate: z.string(),
  verificationContact: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    designation: z.string(),
  }),
});

const startEducationVerificationSchema = z.object({
  corpId: z.string().regex(/^CI-(IND|BIZ|SUP|MER|DRV|FRN)-[A-Z0-9]{5}$/),
  institution: z.string().min(1).max(200),
  degree: z.string().min(1).max(200),
  field: z.string().min(1).max(200),
  enrollmentNumber: z.string().optional(),
  passingYear: z.number().int().min(1950).max(2030),
  verificationContact: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    designation: z.string(),
  }).optional(),
});

const processVerificationSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  notes: z.string().max(1000).optional(),
  rejectionReason: z.string().max(500).optional(),
});

// Types
type VerificationType = 'IDENTITY' | 'BUSINESS' | 'EMPLOYMENT' | 'EDUCATION';
type VerificationStatus = 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

interface IVerificationRequest {
  requestId: string;
  corpId: string;
  type: VerificationType;
  status: VerificationStatus;
  documents: Array<{
    type: string;
    documentNumber: string;
    status: VerificationStatus;
    uploadedAt: Date;
    verifiedAt?: Date;
    verifiedBy?: string;
  }>;
  references: Array<{
    name: string;
    email: string;
    phone?: string;
    relationship: string;
    verified: boolean;
    verifiedAt?: Date;
  }>;
  verificationSteps: Array<{
    step: string;
    status: VerificationStatus;
    completedAt?: Date;
    result?: string;
  }>;
  initiatedAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  verifiedBy?: string;
  notes?: string;
  metadata: Record<string, unknown>;
}

// Mongoose Schema
const verificationSchema = new Schema<IVerificationRequest & mongoose.Document>({
  requestId: { type: String, required: true, unique: true, index: true },
  corpId: { type: String, required: true, index: true },
  type: { type: String, enum: ['IDENTITY', 'BUSINESS', 'EMPLOYMENT', 'EDUCATION'], required: true },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED', 'EXPIRED'],
    default: 'PENDING',
  },
  documents: [{
    type: String,
    documentNumber: String,
    status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED'] },
    uploadedAt: Date,
    verifiedAt: Date,
    verifiedBy: String,
  }],
  references: [{
    name: String,
    email: String,
    phone: String,
    relationship: String,
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
  }],
  verificationSteps: [{
    step: String,
    status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED'] },
    completedAt: Date,
    result: String,
  }],
  initiatedAt: { type: Date, default: Date.now },
  completedAt: Date,
  expiresAt: Date,
  verifiedBy: String,
  notes: String,
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

const VerificationRequest = model<IVerificationRequest & mongoose.Document>('VerificationRequest', verificationSchema);

// Helper functions
function generateRequestId(): string {
  return `VR-${randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

// Auth middleware
function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers['x-internal-token'];
  if (token === INTERNAL_TOKEN) {
    return next();
  }
  next();
}

// Validation middleware
function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.errors },
        });
      }
      next(error);
    }
  };
}

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'corpid-verification-service', timestamp: new Date().toISOString() });
});

// Routes

// Start identity verification
app.post('/verify/identity',
  authMiddleware,
  validateBody(startIdentityVerificationSchema),
  async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const requestId = generateRequestId();

      const verification = new VerificationRequest({
        requestId,
        corpId: data.corpId,
        type: 'IDENTITY',
        status: 'PENDING',
        documents: data.documents.map((doc: { type: string; documentNumber: string; name: string; dob?: string }) => ({
          type: doc.type,
          documentNumber: doc.documentNumber,
          status: 'PENDING',
          uploadedAt: new Date(),
        })),
        verificationSteps: [
          { step: 'Document Upload', status: 'VERIFIED' },
          { step: 'Document Verification', status: 'PENDING' },
          { step: 'Address Verification', status: 'PENDING' },
          { step: 'Final Review', status: 'PENDING' },
        ],
        initiatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        metadata: { selfieData: !!data.selfieData, addressData: !!data.addressData },
      });

      await verification.save();

      res.status(201).json({
        success: true,
        data: {
          requestId,
          corpId: data.corpId,
          type: 'IDENTITY',
          status: 'PENDING',
          documentCount: data.documents.length,
          initiatedAt: verification.initiatedAt,
          expiresAt: verification.expiresAt,
        },
      });
    } catch (error) {
      logger.error('Error starting identity verification:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to start verification' },
      });
    }
  }
);

// Start business verification
app.post('/verify/business',
  authMiddleware,
  validateBody(startBusinessVerificationSchema),
  async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const requestId = generateRequestId();

      const verification = new VerificationRequest({
        requestId,
        corpId: data.corpId,
        type: 'BUSINESS',
        status: 'PENDING',
        documents: data.documents.map((doc: { type: string; documentNumber: string; name: string }) => ({
          type: doc.type,
          documentNumber: doc.documentNumber,
          status: 'PENDING',
          uploadedAt: new Date(),
        })),
        verificationSteps: [
          { step: 'Document Upload', status: 'VERIFIED' },
          { step: 'Registration Verification', status: 'PENDING' },
          { step: 'GST/Tax Verification', status: 'PENDING' },
          { step: 'Authorized Person Verification', status: 'PENDING' },
          { step: 'Final Review', status: 'PENDING' },
        ],
        initiatedAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        metadata: { authorizedPerson: data.authorizedPerson },
      });

      await verification.save();

      res.status(201).json({
        success: true,
        data: {
          requestId,
          corpId: data.corpId,
          type: 'BUSINESS',
          status: 'PENDING',
          documentCount: data.documents.length,
          initiatedAt: verification.initiatedAt,
          expiresAt: verification.expiresAt,
        },
      });
    } catch (error) {
      logger.error('Error starting business verification:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to start verification' },
      });
    }
  }
);

// Start employment verification
app.post('/verify/employment',
  authMiddleware,
  validateBody(startEmploymentVerificationSchema),
  async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const requestId = generateRequestId();

      const verification = new VerificationRequest({
        requestId,
        corpId: data.corpId,
        type: 'EMPLOYMENT',
        status: 'PENDING',
        documents: [],
        references: [{
          name: data.verificationContact.name,
          email: data.verificationContact.email,
          phone: data.verificationContact.phone,
          relationship: `HR/Manager at ${data.employerName}`,
          verified: false,
        }],
        verificationSteps: [
          { step: 'Employment Details Submitted', status: 'VERIFIED' },
          { step: 'Employer Contact Verified', status: 'PENDING' },
          { step: 'Employment Status Confirmed', status: 'PENDING' },
          { step: 'Tenure Verified', status: 'PENDING' },
        ],
        initiatedAt: new Date(),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        metadata: {
          employerName: data.employerName,
          employeeId: data.employeeId,
          designation: data.designation,
          joiningDate: data.joiningDate,
        },
      });

      await verification.save();

      res.status(201).json({
        success: true,
        data: {
          requestId,
          corpId: data.corpId,
          type: 'EMPLOYMENT',
          status: 'PENDING',
          employerName: data.employerName,
          initiatedAt: verification.initiatedAt,
          expiresAt: verification.expiresAt,
        },
      });
    } catch (error) {
      logger.error('Error starting employment verification:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to start verification' },
      });
    }
  }
);

// Start education verification
app.post('/verify/education',
  authMiddleware,
  validateBody(startEducationVerificationSchema),
  async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const requestId = generateRequestId();

      const verification = new VerificationRequest({
        requestId,
        corpId: data.corpId,
        type: 'EDUCATION',
        status: 'PENDING',
        documents: [],
        references: data.verificationContact ? [{
          name: data.verificationContact.name,
          email: data.verificationContact.email,
          phone: data.verificationContact.phone,
          relationship: 'University/Institution',
          verified: false,
        }] : [],
        verificationSteps: [
          { step: 'Education Details Submitted', status: 'VERIFIED' },
          { step: 'Institution Verification', status: 'PENDING' },
          { step: 'Degree Verification', status: 'PENDING' },
          { step: 'Credential Validation', status: 'PENDING' },
        ],
        initiatedAt: new Date(),
        expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
        metadata: {
          institution: data.institution,
          degree: data.degree,
          field: data.field,
          enrollmentNumber: data.enrollmentNumber,
          passingYear: data.passingYear,
        },
      });

      await verification.save();

      res.status(201).json({
        success: true,
        data: {
          requestId,
          corpId: data.corpId,
          type: 'EDUCATION',
          status: 'PENDING',
          institution: data.institution,
          initiatedAt: verification.initiatedAt,
          expiresAt: verification.expiresAt,
        },
      });
    } catch (error) {
      logger.error('Error starting education verification:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to start verification' },
      });
    }
  }
);

// Get verification status
app.get('/verify/:corpId/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const type = req.query.type as VerificationType | undefined;

    const filter: Record<string, unknown> = { corpId };
    if (type) filter.type = type;

    const verifications = await VerificationRequest.find(filter)
      .sort({ initiatedAt: -1 })
      .lean();

    if (verifications.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No verification requests found' },
      });
    }

    res.json({
      success: true,
      data: verifications.map(v => ({
        requestId: v.requestId,
        corpId: v.corpId,
        type: v.type,
        status: v.status,
        documentsCount: v.documents.length,
        referencesCount: v.references.length,
        steps: v.verificationSteps,
        initiatedAt: v.initiatedAt,
        completedAt: v.completedAt,
        expiresAt: v.expiresAt,
      })),
    });
  } catch (error) {
    logger.error('Error fetching verification status:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch status' },
    });
  }
});

// Get verification details
app.get('/verify/request/:requestId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;

    const verification = await VerificationRequest.findOne({ requestId }).lean();

    if (!verification) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Verification request not found' },
      });
    }

    res.json({
      success: true,
      data: {
        requestId: verification.requestId,
        corpId: verification.corpId,
        type: verification.type,
        status: verification.status,
        documents: verification.documents.map(d => ({
          type: d.type,
          documentNumber: d.documentNumber.slice(0, 4) + '****',
          status: d.status,
          uploadedAt: d.uploadedAt,
          verifiedAt: d.verifiedAt,
        })),
        references: verification.references,
        verificationSteps: verification.verificationSteps,
        initiatedAt: verification.initiatedAt,
        completedAt: verification.completedAt,
        verifiedBy: verification.verifiedBy,
        notes: verification.notes,
      },
    });
  } catch (error) {
    logger.error('Error fetching verification details:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch verification' },
    });
  }
});

// Process verification (admin)
app.patch('/verify/request/:requestId/process',
  authMiddleware,
  validateBody(processVerificationSchema),
  async (req: Request, res: Response) => {
    try {
      const { requestId } = req.params;
      const { status, notes, rejectionReason } = req.body;

      const verification = await VerificationRequest.findOneAndUpdate(
        { requestId },
        {
          $set: {
            status,
            completedAt: new Date(),
            verifiedBy: req.headers['x-admin-id'] as string || 'system',
            notes,
            'verificationSteps.*.status': status === 'VERIFIED' ? 'VERIFIED' : 'REJECTED',
          },
        },
        { new: true }
      );

      if (!verification) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Verification request not found' },
        });
      }

      res.json({
        success: true,
        data: {
          requestId: verification.requestId,
          corpId: verification.corpId,
          type: verification.type,
          status: verification.status,
          completedAt: verification.completedAt,
          verifiedBy: verification.verifiedBy,
          notes: verification.notes,
        },
      });
    } catch (error) {
      logger.error('Error processing verification:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to process verification' },
      });
    }
  }
);

// List pending verifications
app.get('/verify/pending', authMiddleware, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const skip = (page - 1) * pageSize;
    const type = req.query.type as VerificationType | undefined;

    const filter: Record<string, unknown> = { status: { $in: ['PENDING', 'IN_PROGRESS'] } };
    if (type) filter.type = type;

    const [verifications, total] = await Promise.all([
      VerificationRequest.find(filter)
        .skip(skip)
        .limit(pageSize)
        .sort({ initiatedAt: -1 })
        .lean(),
      VerificationRequest.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        items: verifications.map(v => ({
          requestId: v.requestId,
          corpId: v.corpId,
          type: v.type,
          status: v.status,
          documentCount: v.documents.length,
          initiatedAt: v.initiatedAt,
          expiresAt: v.expiresAt,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logger.error('Error listing pending verifications:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to list verifications' },
    });
  }
);

// Get verification statistics
app.get('/verify/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = await VerificationRequest.aggregate([
      {
        $group: {
          _id: { type: '$type', status: '$status' },
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      byType: {} as Record<string, Record<string, number>>,
      total: 0,
      pending: 0,
      verified: 0,
      rejected: 0,
    };

    stats.forEach(s => {
      const type = s._id.type;
      const status = s._id.status;
      if (!result.byType[type]) result.byType[type] = {};
      result.byType[type][status] = s.count;
      result.total += s.count;
      if (status === 'PENDING' || status === 'IN_PROGRESS') result.pending += s.count;
      if (status === 'VERIFIED') result.verified += s.count;
      if (status === 'REJECTED') result.rejected += s.count;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error fetching verification stats:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch stats' },
    });
  }
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Verification service error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: err.message },
  });
});

// Start server
async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    await VerificationRequest.createIndexes();
    logger.info('Indexes created');

    app.listen(PORT, () => {
      logger.info(`CorpID Verification Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;

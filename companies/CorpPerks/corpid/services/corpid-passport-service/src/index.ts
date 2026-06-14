/**
 * CorpID Passport Service
 * Career Passports, Business Passports, and Trust Wallets
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose, { Schema, model } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';
import { z } from 'zod';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, error: { code: 'RATE_LIMITED' } },
}));

const PORT = parseInt(process.env.PORT || '4705', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpid';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'corpid-internal-token';

// Badge types
const BADGE_TYPES = [
  'VERIFIED_IDENTITY', 'VERIFIED_EMPLOYMENT', 'VERIFIED_EDUCATION',
  'SKILL_CERTIFIED', 'BACKGROUND_CHECKED', 'REFERENCE_VERIFIED',
  'COMPLIANCE_MASTER', 'TOP_PERFORMER', 'TRUSTED_PARTNER', 'ELITE_MEMBER'
] as const;

type BadgeType = typeof BADGE_TYPES[number];

// Schemas
const employmentRecordSchema = new Schema({
  recordId: String,
  companyName: String,
  companyCorpId: String,
  title: String,
  department: String,
  startDate: Date,
  endDate: Date,
  current: Boolean,
  description: String,
  verified: { type: Boolean, default: false },
  verifiedBy: String,
});

const educationRecordSchema = new Schema({
  recordId: String,
  institution: String,
  degree: String,
  field: String,
  startYear: Number,
  endYear: Number,
  verified: { type: Boolean, default: false },
  verifiedBy: String,
});

const skillSchema = new Schema({
  skillId: String,
  name: String,
  level: { type: String, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] },
  endorsements: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
});

const certificationSchema = new Schema({
  certId: String,
  name: String,
  issuer: String,
  issuedAt: Date,
  expiresAt: Date,
  credentialId: String,
  credentialUrl: String,
  verified: { type: Boolean, default: false },
});

const achievementSchema = new Schema({
  achievementId: String,
  title: String,
  description: String,
  awardedAt: Date,
  awardedBy: String,
  verified: { type: Boolean, default: false },
});

const projectSchema = new Schema({
  projectId: String,
  name: String,
  description: String,
  startDate: Date,
  endDate: Date,
  url: String,
  verified: { type: Boolean, default: false },
});

const careerPassportSchema = new Schema({
  passportId: { type: String, required: true, unique: true, index: true },
  corpId: { type: String, required: true, unique: true, index: true },
  ownerName: String,
  summary: String,
  employment: [employmentRecordSchema],
  education: [educationRecordSchema],
  skills: [skillSchema],
  certifications: [certificationSchema],
  achievements: [achievementSchema],
  projects: [projectSchema],
  lastSharedAt: Date,
});

const businessRegistrationSchema = new Schema({
  registrationNumber: String,
  registrationType: String,
  dateOfIncorporation: Date,
  pan: String,
  gstin: String,
});

const businessOperationSchema = new Schema({
  operationId: String,
  businessType: String,
  description: String,
  locations: [String],
  employeeCount: Number,
  verified: { type: Boolean, default: false },
});

const financialRecordSchema = new Schema({
  recordId: String,
  year: Number,
  revenue: Number,
  profit: Number,
  verified: { type: Boolean, default: false },
});

const businessCertificationSchema = new Schema({
  certId: String,
  name: String,
  issuer: String,
  issuedAt: Date,
  expiresAt: Date,
  verified: { type: Boolean, default: false },
});

const clientReferenceSchema = new Schema({
  refId: String,
  clientName: String,
  clientCorpId: String,
  contactName: String,
  contactEmail: String,
  relationship: String,
  verified: { type: Boolean, default: false },
  rating: Number,
});

const awardSchema = new Schema({
  awardId: String,
  title: String,
  issuer: String,
  year: Number,
  verified: { type: Boolean, default: false },
});

const businessPassportSchema = new Schema({
  passportId: { type: String, required: true, unique: true, index: true },
  corpId: { type: String, required: true, unique: true, index: true },
  businessName: String,
  tagline: String,
  summary: String,
  registration: businessRegistrationSchema,
  operations: [businessOperationSchema],
  financials: [financialRecordSchema],
  certifications: [businessCertificationSchema],
  clients: [clientReferenceSchema],
  awards: [awardSchema],
});

const badgeSchema = new Schema({
  badgeId: String,
  type: { type: String, enum: BADGE_TYPES },
  name: String,
  description: String,
  issuedAt: Date,
  issuer: String,
  expiresAt: Date,
  revoked: { type: Boolean, default: false },
  revokedAt: Date,
  revokedReason: String,
});

const endorsementSchema = new Schema({
  endorsementId: String,
  fromCorpId: String,
  fromName: String,
  skill: String,
  comment: String,
  rating: Number,
  issuedAt: Date,
  revoked: { type: Boolean, default: false },
});

const trustStampSchema = new Schema({
  stampId: String,
  type: String,
  description: String,
  issuedAt: Date,
  validUntil: Date,
  issuedBy: String,
});

const trustCertificateSchema = new Schema({
  certId: String,
  title: String,
  description: String,
  issuedAt: Date,
  validUntil: Date,
  issuedBy: String,
  documentId: String,
});

const trustWalletSchema = new Schema({
  walletId: { type: String, required: true, unique: true, index: true },
  corpId: { type: String, required: true, unique: true, index: true },
  badges: [badgeSchema],
  endorsements: [endorsementSchema],
  stamps: [trustStampSchema],
  certificates: [trustCertificateSchema],
});

const CareerPassport = model('CareerPassport', careerPassportSchema);
const BusinessPassport = model('BusinessPassport', businessPassportSchema);
const TrustWallet = model('TrustWallet', trustWalletSchema);

// Helper functions
function generateId(prefix: string): string {
  return `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.headers['x-internal-token'] === INTERNAL_TOKEN) return next();
  next();
}

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

// Health
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'corpid-passport-service', timestamp: new Date().toISOString() });
});

// ==================== CAREER PASSPORT ====================

// Get career passport
app.get('/passports/:corpId/career', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    let passport = await CareerPassport.findOne({ corpId }).lean();

    if (!passport) {
      // Create new passport
      passport = await new CareerPassport({
        passportId: generateId('CP'),
        corpId,
        employment: [],
        education: [],
        skills: [],
        certifications: [],
        achievements: [],
        projects: [],
      }).save();
    }

    res.json({
      success: true,
      data: {
        passportId: passport.passportId,
        corpId: passport.corpId,
        ownerName: passport.ownerName,
        summary: passport.summary,
        employment: passport.employment,
        education: passport.education,
        skills: passport.skills,
        certifications: passport.certifications,
        achievements: passport.achievements,
        projects: passport.projects,
      },
    });
  } catch (error) {
    logger.error('Error fetching career passport:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch passport' },
    });
  }
});

// Add employment record
app.post('/passports/:corpId/career/employment', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const { companyName, companyCorpId, title, department, startDate, endDate, current, description } = req.body;

    const record = {
      recordId: generateId('EMP'),
      companyName,
      companyCorpId,
      title,
      department,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      current: current || false,
      description,
      verified: false,
    };

    const passport = await CareerPassport.findOneAndUpdate(
      { corpId },
      { $push: { employment: record } },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('Error adding employment:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to add employment' },
    });
  }
});

// Add education record
app.post('/passports/:corpId/career/education', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const { institution, degree, field, startYear, endYear } = req.body;

    const record = {
      recordId: generateId('EDU'),
      institution,
      degree,
      field,
      startYear,
      endYear,
      verified: false,
    };

    const passport = await CareerPassport.findOneAndUpdate(
      { corpId },
      { $push: { education: record } },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('Error adding education:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to add education' },
    });
  }
});

// Add skill
app.post('/passports/:corpId/career/skills', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const { name, level } = req.body;

    const skill = {
      skillId: generateId('SKL'),
      name,
      level: level || 'INTERMEDIATE',
      endorsements: 0,
      verified: false,
    };

    const passport = await CareerPassport.findOneAndUpdate(
      { corpId },
      { $push: { skills: skill } },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: skill });
  } catch (error) {
    logger.error('Error adding skill:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to add skill' },
    });
  }
});

// Add certification
app.post('/passports/:corpId/career/certifications', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const { name, issuer, issuedAt, expiresAt, credentialId, credentialUrl } = req.body;

    const cert = {
      certId: generateId('CERT'),
      name,
      issuer,
      issuedAt: new Date(issuedAt),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      credentialId,
      credentialUrl,
      verified: false,
    };

    const passport = await CareerPassport.findOneAndUpdate(
      { corpId },
      { $push: { certifications: cert } },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: cert });
  } catch (error) {
    logger.error('Error adding certification:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to add certification' },
    });
  }
});

// ==================== BUSINESS PASSPORT ====================

// Get business passport
app.get('/passports/:corpId/business', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    let passport = await BusinessPassport.findOne({ corpId }).lean();

    if (!passport) {
      passport = await new BusinessPassport({
        passportId: generateId('BP'),
        corpId,
        operations: [],
        financials: [],
        certifications: [],
        clients: [],
        awards: [],
      }).save();
    }

    res.json({
      success: true,
      data: {
        passportId: passport.passportId,
        corpId: passport.corpId,
        businessName: passport.businessName,
        tagline: passport.tagline,
        summary: passport.summary,
        registration: passport.registration,
        operations: passport.operations,
        financials: passport.financials,
        certifications: passport.certifications,
        clients: passport.clients,
        awards: passport.awards,
      },
    });
  } catch (error) {
    logger.error('Error fetching business passport:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch passport' },
    });
  }
});

// Add business operation
app.post('/passports/:corpId/business/operations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const { businessType, description, locations, employeeCount } = req.body;

    const operation = {
      operationId: generateId('OP'),
      businessType,
      description,
      locations: locations || [],
      employeeCount,
      verified: false,
    };

    const passport = await BusinessPassport.findOneAndUpdate(
      { corpId },
      { $push: { operations: operation } },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: operation });
  } catch (error) {
    logger.error('Error adding operation:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to add operation' },
    });
  }
});

// ==================== TRUST WALLET ====================

// Get trust wallet
app.get('/passports/:corpId/wallet', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    let wallet = await TrustWallet.findOne({ corpId }).lean();

    if (!wallet) {
      wallet = await new TrustWallet({
        walletId: generateId('TW'),
        corpId,
        badges: [],
        endorsements: [],
        stamps: [],
        certificates: [],
      }).save();
    }

    res.json({
      success: true,
      data: {
        walletId: wallet.walletId,
        corpId: wallet.corpId,
        badges: wallet.badges.filter(b => !b.revoked),
        endorsements: wallet.endorsements.filter(e => !e.revoked),
        stamps: wallet.stamps,
        certificates: wallet.certificates,
        badgeCount: wallet.badges.filter(b => !b.revoked).length,
        endorsementCount: wallet.endorsements.filter(e => !e.revoked).length,
      },
    });
  } catch (error) {
    logger.error('Error fetching trust wallet:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch wallet' },
    });
  }
});

// Add badge
app.post('/passports/:corpId/wallet/badge', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const { type, issuer, expiresAt } = req.body;

    if (!BADGE_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_BADGE_TYPE', message: 'Invalid badge type' },
      });
    }

    const badgeNames: Record<string, string> = {
      VERIFIED_IDENTITY: 'Verified Identity',
      VERIFIED_EMPLOYMENT: 'Verified Employment',
      VERIFIED_EDUCATION: 'Verified Education',
      SKILL_CERTIFIED: 'Skill Certified',
      BACKGROUND_CHECKED: 'Background Checked',
      REFERENCE_VERIFIED: 'Reference Verified',
      COMPLIANCE_MASTER: 'Compliance Master',
      TOP_PERFORMER: 'Top Performer',
      TRUSTED_PARTNER: 'Trusted Partner',
      ELITE_MEMBER: 'Elite Member',
    };

    const badge = {
      badgeId: generateId('BDG'),
      type,
      name: badgeNames[type],
      description: `Awarded for ${badgeNames[type].toLowerCase()}`,
      issuedAt: new Date(),
      issuer,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      revoked: false,
    };

    const wallet = await TrustWallet.findOneAndUpdate(
      { corpId },
      { $push: { badges: badge } },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: badge });
  } catch (error) {
    logger.error('Error adding badge:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to add badge' },
    });
  }
});

// Add endorsement
app.post('/passports/:corpId/wallet/endorsement', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const { fromCorpId, fromName, skill, comment, rating } = req.body;

    const endorsement = {
      endorsementId: generateId('END'),
      fromCorpId,
      fromName,
      skill,
      comment,
      rating: Math.min(5, Math.max(1, rating)),
      issuedAt: new Date(),
      revoked: false,
    };

    const wallet = await TrustWallet.findOneAndUpdate(
      { corpId },
      {
        $push: { endorsements: endorsement },
        $inc: { 'skills.$[elem].endorsements': 1 }
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: endorsement });
  } catch (error) {
    logger.error('Error adding endorsement:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to add endorsement' },
    });
  }
});

// Get all passports
app.get('/passports/:corpId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;

    const [career, business, wallet] = await Promise.all([
      CareerPassport.findOne({ corpId }).lean(),
      BusinessPassport.findOne({ corpId }).lean(),
      TrustWallet.findOne({ corpId }).lean(),
    ]);

    res.json({
      success: true,
      data: {
        corpId,
        careerPassport: career ? {
          passportId: career.passportId,
          employmentCount: career.employment.length,
          educationCount: career.education.length,
          skillsCount: career.skills.length,
          certificationsCount: career.certifications.length,
        } : null,
        businessPassport: business ? {
          passportId: business.passportId,
          operationsCount: business.operations.length,
          clientsCount: business.clients.length,
        } : null,
        trustWallet: wallet ? {
          walletId: wallet.walletId,
          badgeCount: wallet.badges.filter(b => !b.revoked).length,
          endorsementCount: wallet.endorsements.filter(e => !e.revoked).length,
        } : null,
      },
    });
  } catch (error) {
    logger.error('Error fetching passports:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch passports' },
    });
  }
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Passport service error:', err);
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

    await Promise.all([
      CareerPassport.createIndexes(),
      BusinessPassport.createIndexes(),
      TrustWallet.createIndexes(),
    ]);
    logger.info('Indexes created');

    app.listen(PORT, () => {
      logger.info(`CorpID Passport Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;

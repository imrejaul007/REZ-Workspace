/**
 * CorpID CI Score Service
 * Calculates and manages CI Scores (0-1000)
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose, { Schema, model } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';
import { z } from 'zod';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, error: { code: 'RATE_LIMITED' } },
}));

// Config
const PORT = parseInt(process.env.PORT || '4704', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpid';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'corpid-internal-token';

// Types
type CIScoreTier = 'ELITE' | 'PREMIUM' | 'VERIFIED' | 'BASIC' | 'UNVERIFIED';

interface CIScoreBreakdown {
  identity: number;      // 0-150 (15%)
  employment: number;     // 0-200 (20%)
  skills: number;         // 0-150 (15%)
  reputation: number;     // 0-250 (25%)
  compliance: number;    // 0-100 (10%)
  references: number;    // 0-150 (15%)
}

interface CIScoreFactor {
  name: string;
  category: keyof CIScoreBreakdown;
  weight: number;
  baseScore: number;
  modifiers: Array<{ type: string; value: number; reason: string }>;
  finalScore: number;
}

interface ICIScore {
  scoreId: string;
  corpId: string;
  score: number;
  tier: CIScoreTier;
  breakdown: CIScoreBreakdown;
  factors: CIScoreFactor[];
  calculatedAt: Date;
  validUntil: Date;
  version: number;
}

interface ICIScoreHistory {
  historyId: string;
  corpId: string;
  score: number;
  tier: CIScoreTier;
  breakdown: CIScoreBreakdown;
  changedAt: Date;
  reason: string;
  previousScore?: number;
}

// Weights for each category
const CATEGORY_WEIGHTS = {
  identity: { weight: 0.15, max: 150 },
  employment: { weight: 0.20, max: 200 },
  skills: { weight: 0.15, max: 150 },
  reputation: { weight: 0.25, max: 250 },
  compliance: { weight: 0.10, max: 100 },
  references: { weight: 0.15, max: 150 },
};

// Mongoose Schemas
const ciScoreSchema = new Schema<ICIScore & mongoose.Document>({
  scoreId: { type: String, required: true, unique: true, index: true },
  corpId: { type: String, required: true, unique: true, index: true },
  score: { type: Number, required: true, min: 0, max: 1000 },
  tier: { type: String, enum: ['ELITE', 'PREMIUM', 'VERIFIED', 'BASIC', 'UNVERIFIED'] },
  breakdown: {
    identity: { type: Number, default: 0 },
    employment: { type: Number, default: 0 },
    skills: { type: Number, default: 0 },
    reputation: { type: Number, default: 0 },
    compliance: { type: Number, default: 0 },
    references: { type: Number, default: 0 },
  },
  factors: [{
    name: String,
    category: String,
    weight: Number,
    baseScore: Number,
    modifiers: [{ type: String, value: Number, reason: String }],
    finalScore: Number,
  }],
  calculatedAt: { type: Date, default: Date.now },
  validUntil: { type: Date },
  version: { type: Number, default: 1 },
}, { timestamps: true });

const ciScoreHistorySchema = new Schema<ICIScoreHistory & mongoose.Document>({
  historyId: { type: String, required: true, unique: true, index: true },
  corpId: { type: String, required: true, index: true },
  score: { type: Number, required: true },
  tier: { type: String, enum: ['ELITE', 'PREMIUM', 'VERIFIED', 'BASIC', 'UNVERIFIED'] },
  breakdown: {
    identity: Number,
    employment: Number,
    skills: Number,
    reputation: Number,
    compliance: Number,
    references: Number,
  },
  changedAt: { type: Date, default: Date.now },
  reason: { type: String },
  previousScore: Number,
}, { timestamps: true });

const CIScore = model<ICIScore & mongoose.Document>('CIScore', ciScoreSchema);
const CIScoreHistory = model<ICIScoreHistory & mongoose.Document>('CIScoreHistory', ciScoreHistorySchema);

// Helper functions
function getTier(score: number): CIScoreTier {
  if (score >= 900) return 'ELITE';
  if (score >= 750) return 'PREMIUM';
  if (score >= 500) return 'VERIFIED';
  if (score >= 300) return 'BASIC';
  return 'UNVERIFIED';
}

function generateScoreId(): string {
  return `CS-${randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

function generateHistoryId(): string {
  return `CSH-${randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

// Score calculation functions
function calculateIdentityScore(data: {
  hasGovId: boolean;
  hasAddress: boolean;
  hasBiometric: boolean;
  hasSelfie: boolean;
  verificationLevel: number;
}): { score: number; factors: CIScoreFactor[] } {
  let score = 0;
  const factors: CIScoreFactor[] = [];

  // Base score for verification level
  const levelScore = data.verificationLevel * 20;
  score += levelScore;
  factors.push({
    name: 'Verification Level',
    category: 'identity',
    weight: 0.15,
    baseScore: levelScore,
    modifiers: [],
    finalScore: levelScore,
  });

  // Government ID
  if (data.hasGovId) {
    const govScore = 40;
    score += govScore;
    factors.push({
      name: 'Government ID',
      category: 'identity',
      weight: 0.15,
      baseScore: govScore,
      modifiers: [],
      finalScore: govScore,
    });
  }

  // Address verification
  if (data.hasAddress) {
    const addrScore = 25;
    score += addrScore;
    factors.push({
      name: 'Address Verified',
      category: 'identity',
      weight: 0.15,
      baseScore: addrScore,
      modifiers: [],
      finalScore: addrScore,
    });
  }

  // Biometric verification
  if (data.hasBiometric) {
    const bioScore = 25;
    score += bioScore;
    factors.push({
      name: 'Biometric Verified',
      category: 'identity',
      weight: 0.15,
      baseScore: bioScore,
      modifiers: [],
      finalScore: bioScore,
    });
  }

  // Selfie match
  if (data.hasSelfie) {
    const selfieScore = 20;
    score += selfieScore;
    factors.push({
      name: 'Selfie Match',
      category: 'identity',
      weight: 0.15,
      baseScore: selfieScore,
      modifiers: [],
      finalScore: selfieScore,
    });
  }

  return { score: Math.min(score, 150), factors };
}

function calculateEmploymentScore(data: {
  currentEmployerVerified: boolean;
  employmentMonths: number;
  tenureAtCurrentRole: number;
  roleLevel: 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';
}): { score: number; factors: CIScoreFactor[] } {
  let score = 0;
  const factors: CIScoreFactor[] = [];

  // Current employer verified
  if (data.currentEmployerVerified) {
    const employerScore = 60;
    score += employerScore;
    factors.push({
      name: 'Current Employer Verified',
      category: 'employment',
      weight: 0.20,
      baseScore: employerScore,
      modifiers: [],
      finalScore: employerScore,
    });
  }

  // Employment history (months)
  const monthsScore = Math.min(data.employmentMonths * 2, 80);
  score += monthsScore;
  factors.push({
    name: 'Employment History',
    category: 'employment',
    weight: 0.20,
    baseScore: monthsScore,
    modifiers: [],
    finalScore: monthsScore,
  });

  // Tenure at current role
  const tenureScore = Math.min(data.tenureAtCurrentRole * 5, 40);
  score += tenureScore;
  factors.push({
    name: 'Current Role Tenure',
    category: 'employment',
    weight: 0.20,
    baseScore: tenureScore,
    modifiers: [],
    finalScore: tenureScore,
  });

  // Role level
  const roleScores = { JUNIOR: 10, MID: 15, SENIOR: 20, LEAD: 25, EXECUTIVE: 20 };
  const roleScore = roleScores[data.roleLevel];
  score += roleScore;
  factors.push({
    name: 'Role Level',
    category: 'employment',
    weight: 0.20,
    baseScore: roleScore,
    modifiers: [],
    finalScore: roleScore,
  });

  return { score: Math.min(score, 200), factors };
}

function calculateSkillsScore(data: {
  educationVerified: boolean;
  certificationsCount: number;
  endorsementsCount: number;
  trainingHours: number;
}): { score: number; factors: CIScoreFactor[] } {
  let score = 0;
  const factors: CIScoreFactor[] = [];

  // Education verified
  if (data.educationVerified) {
    const eduScore = 50;
    score += eduScore;
    factors.push({
      name: 'Education Verified',
      category: 'skills',
      weight: 0.15,
      baseScore: eduScore,
      modifiers: [],
      finalScore: eduScore,
    });
  }

  // Certifications
  const certScore = Math.min(data.certificationsCount * 15, 60);
  score += certScore;
  factors.push({
    name: 'Certifications',
    category: 'skills',
    weight: 0.15,
    baseScore: certScore,
    modifiers: [],
    finalScore: certScore,
  });

  // Endorsements
  const endorseScore = Math.min(data.endorsementsCount * 5, 25);
  score += endorseScore;
  factors.push({
    name: 'Skill Endorsements',
    category: 'skills',
    weight: 0.15,
    baseScore: endorseScore,
    modifiers: [],
    finalScore: endorseScore,
  });

  // Training
  const trainingScore = Math.min(data.trainingHours / 4, 15);
  score += trainingScore;
  factors.push({
    name: 'Training Hours',
    category: 'skills',
    weight: 0.15,
    baseScore: trainingScore,
    modifiers: [],
    finalScore: trainingScore,
  });

  return { score: Math.min(score, 150), factors };
}

function calculateReputationScore(data: {
  referenceCount: number;
  averageRating: number;
  reviewCount: number;
  complianceChecksPassed: number;
}): { score: number; factors: CIScoreFactor[] } {
  let score = 0;
  const factors: CIScoreFactor[] = [];

  // Reference count
  const refScore = Math.min(data.referenceCount * 20, 80);
  score += refScore;
  factors.push({
    name: 'Professional References',
    category: 'reputation',
    weight: 0.25,
    baseScore: refScore,
    modifiers: [],
    finalScore: refScore,
  });

  // Average reference rating
  const ratingScore = data.averageRating * 20;
  score += ratingScore;
  factors.push({
    name: 'Reference Ratings',
    category: 'reputation',
    weight: 0.25,
    baseScore: ratingScore,
    modifiers: [],
    finalScore: ratingScore,
  });

  // Reviews
  const reviewScore = Math.min(data.reviewCount * 3, 50);
  score += reviewScore;
  factors.push({
    name: 'Reviews',
    category: 'reputation',
    weight: 0.25,
    baseScore: reviewScore,
    modifiers: [],
    finalScore: reviewScore,
  });

  // Compliance checks
  const complianceScore = data.complianceChecksPassed * 30;
  score += complianceScore;
  factors.push({
    name: 'Compliance Checks',
    category: 'reputation',
    weight: 0.25,
    baseScore: complianceScore,
    modifiers: [],
    finalScore: complianceScore,
  });

  return { score: Math.min(score, 250), factors };
}

function calculateComplianceScore(data: {
  backgroundCheck: 'CLEAR' | 'PENDING' | 'FLAG';
  legalClearance: boolean;
  regulatoryCompliance: boolean;
  taxCompliance: boolean;
}): { score: number; factors: CIScoreFactor[] } {
  let score = 0;
  const factors: CIScoreFactor[] = [];

  // Background check
  const bgScores = { CLEAR: 40, PENDING: 20, FLAG: 0 };
  const bgScore = bgScores[data.backgroundCheck];
  score += bgScore;
  factors.push({
    name: 'Background Check',
    category: 'compliance',
    weight: 0.10,
    baseScore: bgScore,
    modifiers: [],
    finalScore: bgScore,
  });

  // Legal clearance
  if (data.legalClearance) {
    const legalScore = 20;
    score += legalScore;
    factors.push({
      name: 'Legal Clearance',
      category: 'compliance',
      weight: 0.10,
      baseScore: legalScore,
      modifiers: [],
      finalScore: legalScore,
    });
  }

  // Regulatory compliance
  if (data.regulatoryCompliance) {
    const regScore = 20;
    score += regScore;
    factors.push({
      name: 'Regulatory Compliance',
      category: 'compliance',
      weight: 0.10,
      baseScore: regScore,
      modifiers: [],
      finalScore: regScore,
    });
  }

  // Tax compliance
  if (data.taxCompliance) {
    const taxScore = 20;
    score += taxScore;
    factors.push({
      name: 'Tax Compliance',
      category: 'compliance',
      weight: 0.10,
      baseScore: taxScore,
      modifiers: [],
      finalScore: taxScore,
    });
  }

  return { score: Math.min(score, 100), factors };
}

function calculateReferencesScore(data: {
  professionalRefs: number;
  referenceResponseRate: number;
  referenceQualityScore: number;
  mutualConnections: number;
}): { score: number; factors: CIScoreFactor[] } {
  let score = 0;
  const factors: CIScoreFactor[] = [];

  // Professional references
  const proRefScore = Math.min(data.professionalRefs * 30, 60);
  score += proRefScore;
  factors.push({
    name: 'Professional References',
    category: 'references',
    weight: 0.15,
    baseScore: proRefScore,
    modifiers: [],
    finalScore: proRefScore,
  });

  // Response rate
  const responseScore = data.referenceResponseRate * 0.3;
  score += responseScore;
  factors.push({
    name: 'Reference Response Rate',
    category: 'references',
    weight: 0.15,
    baseScore: responseScore,
    modifiers: [],
    finalScore: responseScore,
  });

  // Quality score
  const qualityScore = data.referenceQualityScore * 0.3;
  score += qualityScore;
  factors.push({
    name: 'Reference Quality',
    category: 'references',
    weight: 0.15,
    baseScore: qualityScore,
    modifiers: [],
    finalScore: qualityScore,
  });

  // Mutual connections
  const mutualScore = Math.min(data.mutualConnections * 3, 30);
  score += mutualScore;
  factors.push({
    name: 'Mutual Connections',
    category: 'references',
    weight: 0.15,
    baseScore: mutualScore,
    modifiers: [],
    finalScore: mutualScore,
  });

  return { score: Math.min(score, 150), factors };
}

// Auth middleware
function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers['x-internal-token'];
  if (token === INTERNAL_TOKEN) return next();
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
  res.json({ status: 'ok', service: 'corpid-ci-score-service', timestamp: new Date().toISOString() });
});

// Calculate score
app.post('/scores/calculate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId, identityData, employmentData, skillsData, reputationData, complianceData, referencesData } = req.body;

    // Calculate each category
    const identity = calculateIdentityScore(identityData || {
      hasGovId: false, hasAddress: false, hasBiometric: false, hasSelfie: false, verificationLevel: 0,
    });

    const employment = calculateEmploymentScore(employmentData || {
      currentEmployerVerified: false, employmentMonths: 0, tenureAtCurrentRole: 0, roleLevel: 'JUNIOR',
    });

    const skills = calculateSkillsScore(skillsData || {
      educationVerified: false, certificationsCount: 0, endorsementsCount: 0, trainingHours: 0,
    });

    const reputation = calculateReputationScore(reputationData || {
      referenceCount: 0, averageRating: 0, reviewCount: 0, complianceChecksPassed: 0,
    });

    const compliance = calculateComplianceScore(complianceData || {
      backgroundCheck: 'PENDING', legalClearance: false, regulatoryCompliance: false, taxCompliance: false,
    });

    const references = calculateReferencesScore(referencesData || {
      professionalRefs: 0, referenceResponseRate: 0, referenceQualityScore: 0, mutualConnections: 0,
    });

    const totalScore = identity.score + employment.score + skills.score +
                       reputation.score + compliance.score + references.score;

    const tier = getTier(totalScore);

    const allFactors = [...identity.factors, ...employment.factors, ...skills.factors,
                        ...reputation.factors, ...compliance.factors, ...references.factors];

    // Get previous score for history
    const previousScore = await CIScore.findOne({ corpId });

    // Create new score
    const scoreId = generateScoreId();
    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const newScore = new CIScore({
      scoreId,
      corpId,
      score: totalScore,
      tier,
      breakdown: {
        identity: identity.score,
        employment: employment.score,
        skills: skills.score,
        reputation: reputation.score,
        compliance: compliance.score,
        references: references.score,
      },
      factors: allFactors,
      calculatedAt: new Date(),
      validUntil,
      version: (previousScore?.version || 0) + 1,
    });

    await newScore.save();

    // Save to history
    const historyId = generateHistoryId();
    const history = new CIScoreHistory({
      historyId,
      corpId,
      score: totalScore,
      tier,
      breakdown: newScore.breakdown,
      changedAt: new Date(),
      reason: 'Score calculation',
      previousScore: previousScore?.score,
    });

    await history.save();

    res.json({
      success: true,
      data: {
        scoreId,
        corpId,
        score: totalScore,
        tier,
        breakdown: newScore.breakdown,
        validUntil,
      },
    });
  } catch (error) {
    logger.error('Error calculating score:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to calculate score' },
    });
  }
});

// Get current score
app.get('/scores/:corpId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;

    const score = await CIScore.findOne({ corpId }).lean();

    if (!score) {
      return res.json({
        success: true,
        data: {
          corpId,
          score: 0,
          tier: 'UNVERIFIED',
          breakdown: {
            identity: 0, employment: 0, skills: 0,
            reputation: 0, compliance: 0, references: 0,
          },
          message: 'No score calculated yet',
        },
      });
    }

    res.json({
      success: true,
      data: {
        scoreId: score.scoreId,
        corpId: score.corpId,
        score: score.score,
        tier: score.tier,
        breakdown: score.breakdown,
        calculatedAt: score.calculatedAt,
        validUntil: score.validUntil,
        isValid: score.validUntil > new Date(),
      },
    });
  } catch (error) {
    logger.error('Error fetching score:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch score' },
    });
  }
});

// Get score history
app.get('/scores/:corpId/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const skip = (page - 1) * pageSize;

    const [history, total] = await Promise.all([
      CIScoreHistory.find({ corpId })
        .sort({ changedAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      CIScoreHistory.countDocuments({ corpId }),
    ]);

    res.json({
      success: true,
      data: {
        items: history.map(h => ({
          historyId: h.historyId,
          score: h.score,
          tier: h.tier,
          breakdown: h.breakdown,
          changedAt: h.changedAt,
          reason: h.reason,
          previousScore: h.previousScore,
          change: h.previousScore ? h.score - h.previousScore : null,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logger.error('Error fetching score history:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch history' },
    });
  }
});

// Get score factors
app.get('/scores/:corpId/factors', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;

    const score = await CIScore.findOne({ corpId }).lean();

    if (!score) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Score not found' },
      });
    }

    // Group factors by category
    const factorsByCategory: Record<string, typeof score.factors> = {};
    score.factors.forEach(f => {
      if (!factorsByCategory[f.category]) {
        factorsByCategory[f.category] = [];
      }
      factorsByCategory[f.category].push(f);
    });

    res.json({
      success: true,
      data: {
        corpId,
        score: score.score,
        tier: score.tier,
        factors: score.factors,
        factorsByCategory,
        weights: CATEGORY_WEIGHTS,
      },
    });
  } catch (error) {
    logger.error('Error fetching score factors:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch factors' },
    });
  }
});

// Get score distribution
app.get('/scores/distribution', authMiddleware, async (req: Request, res: Response) => {
  try {
    const distribution = await CIScore.aggregate([
      {
        $bucket: {
          groupBy: '$score',
          boundaries: [0, 300, 500, 750, 900, 1001],
          default: 'OTHER',
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    const result = {
      unverified: 0,    // 0-299
      basic: 0,        // 300-499
      verified: 0,     // 500-749
      premium: 0,      // 750-899
      elite: 0,        // 900-1000
      total: 0,
    };

    distribution.forEach(d => {
      const key = d._id;
      if (key === 0) result.unverified = d.count;
      else if (key === 300) result.basic = d.count;
      else if (key === 500) result.verified = d.count;
      else if (key === 750) result.premium = d.count;
      else if (key === 900) result.elite = d.count;
      result.total += d.count;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error fetching distribution:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch distribution' },
    });
  }
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('CI Score service error:', err);
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

    await CIScore.createIndexes();
    await CIScoreHistory.createIndexes();
    logger.info('Indexes created');

    app.listen(PORT, () => {
      logger.info(`CorpID CI Score Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;

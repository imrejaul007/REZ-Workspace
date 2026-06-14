/**
 * CorpID Risk Service
 * Fraud detection and risk assessment
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose, { Schema, model } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(rateLimit({ windowMs: 60000, max: 100, message: { success: false, error: { code: 'RATE_LIMITED' } } }));

const PORT = parseInt(process.env.PORT || '4708', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpid';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'corpid-internal-token';

const riskAssessmentSchema = new Schema({
  assessmentId: { type: String, required: true, unique: true, index: true },
  corpId: { type: String, required: true, index: true },
  overallRisk: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
  riskScore: { type: Number, required: true, min: 0, max: 100 },
  factors: [{
    category: String,
    score: Number,
    weight: Number,
    indicators: [{
      name: String,
      value: String,
      risk: String,
      description: String,
    }],
  }],
  recommendations: [String],
  assessedAt: { type: Date, default: Date.now },
  validUntil: Date,
});

const fraudIndicatorSchema = new Schema({
  indicatorId: { type: String, required: true, unique: true, index: true },
  corpId: { type: String, required: true, index: true },
  type: String,
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
  description: String,
  detectedAt: { type: Date, default: Date.now },
  resolvedAt: Date,
  metadata: { type: Schema.Types.Mixed, default: {} },
});

const RiskAssessment = model('RiskAssessment', riskAssessmentSchema);
const FraudIndicator = model('FraudIndicator', fraudIndicatorSchema);

function generateId(prefix: string): string {
  return `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36)}`;
}

function getRiskLevel(score: number): string {
  if (score <= 20) return 'CRITICAL';
  if (score <= 40) return 'HIGH';
  if (score <= 70) return 'MEDIUM';
  return 'LOW';
}

function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.headers['x-internal-token'] === INTERNAL_TOKEN) return next();
  next();
}

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'corpid-risk-service', timestamp: new Date().toISOString() });
});

// Assess risk
app.post('/risk/assess', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId, identityVerified, verificationLevel, criminalCheck, pepCheck, adverseMedia, sanctionsCheck } = req.body;

    let riskScore = 50; // Base score

    // Adjust based on factors
    if (identityVerified) riskScore -= 15;
    riskScore -= verificationLevel * 5;

    if (criminalCheck === 'CLEAR') riskScore -= 20;
    else if (criminalCheck === 'PENDING') riskScore -= 5;
    else if (criminalCheck === 'FOUND') riskScore += 30;

    if (pepCheck === 'CLEAR') riskScore -= 10;
    else if (pepCheck === 'FOUND') riskScore += 25;

    if (adverseMedia === 'CLEAR') riskScore -= 5;
    else if (adverseMedia === 'FOUND') riskScore += 15;

    if (sanctionsCheck === 'CLEAR') riskScore -= 15;
    else if (sanctionsCheck === 'FOUND') riskScore += 35;

    riskScore = Math.max(0, Math.min(100, riskScore));
    const overallRisk = getRiskLevel(riskScore);

    const assessment = new RiskAssessment({
      assessmentId: generateId('RA'),
      corpId,
      overallRisk,
      riskScore,
      factors: [
        {
          category: 'Identity',
          score: identityVerified ? 85 : 30,
          weight: 0.3,
          indicators: [{ name: 'Identity Verification', value: String(identityVerified), risk: identityVerified ? 'LOW' : 'HIGH', description: 'Government ID verification status' }],
        },
        {
          category: 'Compliance',
          score: riskScore > 60 ? 20 : 80,
          weight: 0.4,
          indicators: [
            { name: 'Criminal Check', value: criminalCheck || 'UNKNOWN', risk: criminalCheck === 'FOUND' ? 'CRITICAL' : 'LOW', description: 'Criminal record check' },
            { name: 'PEP Check', value: pepCheck || 'UNKNOWN', risk: pepCheck === 'FOUND' ? 'HIGH' : 'LOW', description: 'Politically Exposed Person check' },
            { name: 'Sanctions Check', value: sanctionsCheck || 'UNKNOWN', risk: sanctionsCheck === 'FOUND' ? 'CRITICAL' : 'LOW', description: 'Sanctions list check' },
          ],
        },
        {
          category: 'Reputation',
          score: adverseMedia === 'CLEAR' ? 90 : 40,
          weight: 0.3,
          indicators: [{ name: 'Adverse Media', value: adverseMedia || 'UNKNOWN', risk: adverseMedia === 'FOUND' ? 'MEDIUM' : 'LOW', description: 'Adverse media mentions' }],
        },
      ],
      recommendations: overallRisk === 'LOW' ? ['Entity is low risk', 'Proceed with normal operations'] :
                       overallRisk === 'MEDIUM' ? ['Additional verification recommended', 'Review documentation'] :
                       overallRisk === 'HIGH' ? ['Enhanced due diligence required', 'Senior approval needed'] :
                       ['Do not engage', 'Immediate escalation required'],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await assessment.save();

    res.json({ success: true, data: assessment });
  } catch (error) {
    logger.error('Error assessing risk:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to assess risk' } });
  }
});

// Get risk assessment
app.get('/risk/:corpId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;

    const assessment = await RiskAssessment.findOne({ corpId }).sort({ assessedAt: -1 }).lean();

    if (!assessment) {
      return res.json({
        success: true,
        data: { corpId, riskScore: 50, overallRisk: 'MEDIUM', message: 'No assessment found - baseline risk assumed' },
      });
    }

    res.json({ success: true, data: assessment });
  } catch (error) {
    logger.error('Error fetching risk:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Get fraud indicators
app.get('/fraud/:corpId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;

    const indicators = await FraudIndicator.find({ corpId, resolvedAt: null }).sort({ detectedAt: -1 }).lean();

    const critical = indicators.filter(i => i.severity === 'CRITICAL').length;
    const high = indicators.filter(i => i.severity === 'HIGH').length;

    res.json({
      success: true,
      data: {
        indicators,
        totalActive: indicators.length,
        criticalCount: critical,
        highCount: high,
        fraudRisk: critical > 0 ? 'CRITICAL' : high > 0 ? 'HIGH' : indicators.length > 0 ? 'MEDIUM' : 'LOW',
      },
    });
  } catch (error) {
    logger.error('Error fetching fraud indicators:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Report fraud indicator
app.post('/fraud/report', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId, type, severity, description, metadata } = req.body;

    const indicator = new FraudIndicator({
      indicatorId: generateId('FI'),
      corpId,
      type,
      severity: severity || 'MEDIUM',
      description,
      metadata: metadata || {},
    });

    await indicator.save();

    res.status(201).json({ success: true, data: indicator });
  } catch (error) {
    logger.error('Error reporting fraud:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

// Get risk distribution
app.get('/risk/distribution', authMiddleware, async (req: Request, res: Response) => {
  try {
    const distribution = await RiskAssessment.aggregate([
      { $sort: { assessedAt: -1 } },
      { $group: { _id: '$corpId', latestRisk: { $first: '$overallRisk' } } },
      { $group: { _id: '$latestRisk', count: { $sum: 1 } } },
    ]);

    const result = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0, total: 0 };
    distribution.forEach(d => {
      if (d._id) {
        result[d._id as keyof typeof result] = d.count;
        result.total += d.count;
      }
    });

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error fetching distribution:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Risk service error:', err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
});

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
    await Promise.all([RiskAssessment.createIndexes(), FraudIndicator.createIndexes()]);
    logger.info('Indexes created');
    app.listen(PORT, () => logger.info(`CorpID Risk Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
export default app;

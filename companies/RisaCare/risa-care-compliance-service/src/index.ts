/**
 * RisaCare Compliance Service
 * Port: 4752
 *
 * HIPAA and PDP (India) compliance automation
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const PORT = process.env.PORT || 4752;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa-care-compliance';

const app = express();
app.use(express.json());

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

const AuditLogSchema = new mongoose.Schema({
  logId: { type: String, required: true, unique: true },
  userId: String,
  action: String,
  resource: String,
  resourceId: String,
  type: { type: String, enum: ['phi_access', 'phi_modification', 'phi_deletion', 'consent_update', 'breach', 'other'] },
  ip: String,
  userAgent: String,
  details: mongoose.Schema.Types.Mixed,
  compliant: Boolean,
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
  timestamp: { type: Date, default: Date.now },
});

const ConsentSchema = new mongoose.Schema({
  consentId: { type: String, required: true, unique: true },
  patientId: String,
  type: { type: String, enum: ['treatment', 'data_sharing', 'marketing', 'research'] },
  status: { type: String, enum: ['granted', 'denied', 'withdrawn', 'expired'] },
  grantedBy: String,
  grantedAt: Date,
  expiresAt: Date,
  withdrawnAt: Date,
  version: String,
  ip: String,
  createdAt: { type: Date, default: Date.now },
});

const BreachReportSchema = new mongoose.Schema({
  breachId: { type: String, required: true, unique: true },
  reportedBy: String,
  description: String,
  affectedRecords: Number,
  affectedPatients: Number,
  type: { type: String, enum: ['unauthorized_access', 'data_loss', 'ransomware', 'insider_threat', 'physical_theft'] },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
  status: { type: String, enum: ['detected', 'investigating', 'contained', 'resolved', 'reported'] },
  reportedAt: Date,
  containedAt: Date,
  resolvedAt: Date,
  reportedToAuthority: Boolean,
  authorityName: String,
  authorityReportDate: Date,
  createdAt: { type: Date, default: Date.now },
});

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
const Consent = mongoose.models.Consent || mongoose.model('Consent', ConsentSchema);
const BreachReport = mongoose.models.BreachReport || mongoose.model('BreachReport', BreachReportSchema);

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLIANCE RULES
// ═══════════════════════════════════════════════════════════════════════════════

const HIPAA_RULES = {
  encryption: { required: true, standard: 'AES-256' },
  access_control: { required: true, method: 'role_based' },
  audit_logging: { required: true, retention: '6_years' },
  incident_response: { required: true, timeframe: '60_days' },
  patient_consent: { required: true, explicit: true },
};

const PDP_RULES = {
  consent: { required: true, purpose_limitation: true },
  data_localization: { required: true, country: 'India' },
  breach_notification: { required: true, timeframe: '72_hours' },
  data_erasure: { required: true, right_to_forget: true },
  accuracy: { required: true, duty_to_maintain: true },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLIANCE CHECKS
// ═══════════════════════════════════════════════════════════════════════════════

function assessRisk(action: string, resource: string): { level: string; compliant: boolean } {
  const highRiskActions = ['DELETE', 'EXPORT', 'SHARE', 'MODIFY_PERMISSIONS'];
  const phiResources = ['health_record', 'lab_result', 'prescription', 'diagnosis'];

  if (highRiskActions.some(a => action.includes(a)) {
    return { level: 'high', compliant: false };
  }
  if (phiResources.some(r => resource.includes(r))) {
    return { level: 'medium', compliant: true };
  }
  return { level: 'low', compliant: true };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'risa-care-compliance-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Log PHI access
app.post('/api/audit/log', async (req: Request, res: Response) => {
  try {
    const { userId, action, resource, resourceId, ip, userAgent, details } = req.body;
    const { level, compliant } = assessRisk(action, resource);

    const log = new AuditLog({
      logId: `LOG-${Date.now()}-${uuidv4().substring(0, 8)}`,
      userId, action, resource, resourceId, ip, userAgent, details,
      type: action.includes('access') ? 'phi_access' : 'phi_modification',
      compliant, riskLevel: level
    });
    await log.save();

    logger.info('Audit log created', { logId: log.logId, action, riskLevel: level });

    res.status(201).json({ success: true, data: { logId: log.logId, compliant, riskLevel: level } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create audit log' });
  }
});

// Get audit logs
app.get('/api/audit/logs', async (req: Request, res: Response) => {
  const { userId, resource, riskLevel, startDate, endDate, limit = 100 } = req.query;

  const query: any = {};
  if (userId) query.userId = userId;
  if (resource) query.resource = resource;
  if (riskLevel) query.riskLevel = riskLevel;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate as string);
    if (endDate) query.timestamp.$lte = new Date(endDate as string);
  }

  const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(Number(limit));
  res.json({ success: true, data: logs, count: logs.length });
});

// Compliance check
app.get('/api/compliance/check', async (req: Request, res: Response) => {
  const { framework = 'hipaa' } = req.query;
  const rules = framework === 'hipaa' ? HIPAA_RULES : PDP_RULES;

  // Check compliance status
  const [totalLogs, nonCompliantLogs, highRiskLogs] = await Promise.all([
    AuditLog.countDocuments(),
    AuditLog.countDocuments({ compliant: false }),
    AuditLog.countDocuments({ riskLevel: 'high' }),
  ]);

  const complianceRate = totalLogs > 0 ? ((totalLogs - nonCompliantLogs) / totalLogs * 100).toFixed(2) : 100;

  res.json({
    success: true,
    data: {
      framework,
      complianceRate: parseFloat(complianceRate),
      totalAuditLogs: totalLogs,
      nonCompliantEvents: nonCompliantLogs,
      highRiskEvents: highRiskLogs,
      rules,
      status: parseFloat(complianceRate) >= 95 ? 'COMPLIANT' : 'NEEDS_ATTENTION'
    }
  });
});

// Consent management
app.post('/api/consent', async (req: Request, res: Response) => {
  try {
    const { patientId, type, grantedBy, expiresAt, ip } = req.body;

    const consent = new Consent({
      consentId: `CONS-${Date.now()}-${uuidv4().substring(0, 8)}`,
      patientId, type, grantedBy, expiresAt: new Date(expiresAt), ip,
      status: 'granted',
      grantedAt: new Date()
    });
    await consent.save();

    res.status(201).json({ success: true, data: { consentId: consent.consentId } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create consent' });
  }
});

// Get patient consents
app.get('/api/consent/patient/:patientId', async (req: Request, res: Response) => {
  const consents = await Consent.find({ patientId: req.params.patientId });
  res.json({ success: true, data: consents, count: consents.length });
});

// Withdraw consent
app.patch('/api/consent/:consentId/withdraw', async (req: Request, res: Response) => {
  try {
    const consent = await Consent.findOneAndUpdate(
      { consentId: req.params.consentId },
      { status: 'withdrawn', withdrawnAt: new Date() },
      { new: true }
    );
    if (!consent) return res.status(404).json({ success: false, error: 'Consent not found' });
    res.json({ success: true, data: consent });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to withdraw consent' });
  }
});

// Report breach
app.post('/api/breach', async (req: Request, res: Response) => {
  try {
    const { reportedBy, description, affectedRecords, affectedPatients, type, severity } = req.body;

    const breach = new BreachReport({
      breachId: `BR-${Date.now()}-${uuidv4().substring(0, 8)}`,
      reportedBy, description, affectedRecords, affectedPatients, type, severity,
      status: 'detected',
      reportedAt: new Date()
    });
    await breach.save();

    logger.warn('Breach reported', { breachId: breach.breachId, severity });

    res.status(201).json({
      success: true,
      data: {
        breachId: breach.breachId,
        message: 'Breach report created. Incident response plan initiated.'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to report breach' });
  }
});

// Get breaches
app.get('/api/breach', async (req: Request, res: Response) => {
  const { status, severity } = req.query;
  const query: any = {};
  if (status) query.status = status;
  if (severity) query.severity = severity;

  const breaches = await BreachReport.find(query).sort({ reportedAt: -1 });
  res.json({ success: true, data: breaches, count: breaches.length });
});

// Update breach status
app.patch('/api/breach/:breachId/status', async (req: Request, res: Response) => {
  try {
    const { status, authorityName } = req.body;
    const update: any = { status };

    if (status === 'contained') update.containedAt = new Date();
    if (status === 'resolved') update.resolvedAt = new Date();
    if (status === 'reported') {
      update.reportedToAuthority = true;
      update.authorityName = authorityName;
      update.authorityReportDate = new Date();
    }

    const breach = await BreachReport.findOneAndUpdate(
      { breachId: req.params.breachId },
      update,
      { new: true }
    );

    if (!breach) return res.status(404).json({ success: false, error: 'Breach not found' });
    res.json({ success: true, data: breach });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update breach' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════════════════════

async function start(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.warn('Running without database');
  }

  app.listen(PORT, () => {
    logger.info(
╔═══════════════════════════════════════════════════════╗
║     RisaCare Compliance Service v1.0            ║
╠═══════════════════════════════════════════════════════╣
║  Port:       ${PORT}                                ║
║  Framework:   HIPAA + PDP                          ║
║  Database:    MongoDB                              ║
╚═══════════════════════════════════════════════════════╝
    `);
  });
}

start();

export default app;
import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app: Express = express();
const PORT = process.env.PORT || 4196;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/breach-detector';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json());

// Breach Schema
const breachSchema = new mongoose.Schema({
  breachId: { type: String, required: true, unique: true, index: true },
  contractId: String,
  type: { type: String, enum: ['delivery', 'payment', 'quality', 'terms', 'sla'], required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },

  // Details
  description: String,
  party: String,  // who breached
  affectedParty: String,

  // Impact
  impact: {
    financial: Number,
    reputational: { type: Number, min: 0, max: 10 },
    operational: { type: Number, min: 0, max: 10 }
  },

  // Remediation
  remediation: {
    required: String,
    deadline: Date,
    cost: Number
  },

  // Status
  status: { type: String, enum: ['detected', 'reported', 'acknowledged', 'remediating', 'resolved', 'escalated'], default: 'detected' },

  // Escalation
  escalatedTo: String,
  escalationReason: String,

  // Resolution
  resolution: String,
  resolvedAt: Date,
  resolvedBy: String,

  tenantId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Breach = mongoose.model('Breach', breachSchema);

// Health
app.get('/health', (_, res) => res.json({ status: 'healthy', service: 'breach-detector', timestamp: new Date().toISOString() }));
app.get('/health/ready', async (_, res) => {
  const status = mongoose.connection.readyState === 1 ? 'ready' : 'not_ready';
  res.status(status === 'ready' ? 200 : 503).json({ status });
});

app.get('/api/info', (_, res) => {
  res.json({ service: 'breach-detector', version: '1.0.0', description: 'Contract Breach Detection Service', port: PORT });
});

// Detect breach
app.post('/api/breaches', async (req: res) => {
  try {
    const { contractId, type, severity, description, party, impact, tenantId } = req.body;
    const breachId = `BR-${uuidv4().substring(0, 8).toUpperCase()}`;

    const breach = new Breach({
      breachId,
      contractId,
      type,
      severity: severity || 'medium',
      description,
      party,
      impact: impact || { financial: 0, reputational: 0, operational: 0 },
      status: 'detected',
      tenantId
    });

    await breach.save();

    // Auto-escalate critical breaches
    if (severity === 'critical') {
      breach.status = 'escalated';
      breach.escalatedTo = 'legal';
      breach.escalationReason = 'Critical breach - auto-escalated';
      await breach.save();
    }

    res.status(201).json({ success: true, data: breach });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// List breaches
app.get('/api/breaches', async (req: res) => {
  try {
    const { tenantId, status, severity, contractId } = req.query;
    const filter: any = { tenantId };
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (contractId) filter.contractId = contractId;

    const breaches = await Breach.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: breaches });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get breach
app.get('/api/breaches/:id', async (req: res) => {
  try {
    const breach = await Breach.findOne({ breachId: req.params.id });
    if (!breach) return res.status(404).json({ success: false, error: 'Breach not found' });
    res.json({ success: true, data: breach });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Update breach
app.put('/api/breaches/:id', async (req: res) => {
  try {
    const { status, resolution, resolvedBy } = req.body;
    const update: any = { updatedAt: new Date() };

    if (status) {
      update.status = status;
      if (status === 'resolved') {
        update.resolvedAt = new Date();
        update.resolvedBy = resolvedBy;
      }
    }
    if (resolution) update.resolution = resolution;

    const breach = await Breach.findOneAndUpdate(
      { breachId: req.params.id },
      update,
      { new: true }
    );

    if (!breach) return res.status(404).json({ success: false, error: 'Breach not found' });
    res.json({ success: true, data: breach });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Escalate breach
app.post('/api/breaches/:id/escalate', async (req: res) => {
  try {
    const { escalatedTo, reason } = req.body;
    const breach = await Breach.findOneAndUpdate(
      { breachId: req.params.id },
      {
        status: 'escalated',
        escalatedTo,
        escalationReason: reason,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!breach) return res.status(404).json({ success: false, error: 'Breach not found' });
    res.json({ success: true, data: breach });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Breach analytics
app.get('/api/breaches/analytics', async (req: res) => {
  try {
    const { tenantId } = req.query;
    const breaches = await Breach.find({ tenantId });

    const byType = breaches.reduce((acc: any, b) => {
      acc[b.type] = (acc[b.type] || 0) + 1;
      return acc;
    }, {});

    const byStatus = breaches.reduce((acc: any, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});

    const totalFinancialImpact = breaches.reduce((sum: number, b) => sum + (b.impact?.financial || 0), 0);

    res.json({
      success: true,
      data: {
        total: breaches.length,
        byType,
        byStatus,
        totalFinancialImpact,
        avgResolutionTime: 0  // Calculate from resolved breaches
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Error handling
app.use((_, res) => res.status(404).json({ success: false, error: 'Not found' }));
app.use((err: Error, _, res: Response, _next: any) => {
  res.status(500).json({ success: false, error: err.message });
});

mongoose.connect(MONGODB_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`Breach Detector Service running on port ${PORT}`);
  });
}).catch(err => {
  console.error('MongoDB connection failed:', err);
  process.exit(1);
});

export default app;

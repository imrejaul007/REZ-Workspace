import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app: Express = express();
const PORT = process.env.PORT || 4195;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sla-monitor';

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json());

// SLA Schema
const slaSchema = new mongoose.Schema({
  slaId: { type: String, required: true, unique: true, index: true },
  contractId: String,
  type: { type: String, enum: ['delivery', 'response', 'resolution', 'quality'], required: true },

  // Metrics
  metric: {
    name: String,
    target: Number,
    unit: String  // %, hours, days
  },

  // Timeframes
  timeframe: {
    startDate: Date,
    endDate: Date,
    measurementPeriod: String  // daily, weekly, monthly
  },

  // Compliance
  compliance: {
    targetPercentage: Number,  // e.g., 99.9
    currentPercentage: Number,
    breaches: Number,
    met: Number
  },

  // Status
  status: { type: String, enum: ['active', 'paused', 'completed', 'breached'], default: 'active' },

  // Alerts
  alerts: [{
    level: { type: String, enum: ['warning', 'critical'] },
    message: String,
    createdAt: Date
  }],

  tenantId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const SLA = mongoose.model('SLA', slaSchema);

// Health
app.get('/health', (_req, res) => res.json({ status: 'healthy', service: 'sla-monitor', timestamp: new Date().toISOString() }));
app.get('/health/ready', async (_req, res) => {
  const status = mongoose.connection.readyState === 1 ? 'ready' : 'not_ready';
  res.status(status === 'ready' ? 200 : 503).json({ status });
});

app.get('/api/info', (_req, res) => {
  res.json({ service: 'sla-monitor', version: '1.0.0', description: 'SLA Monitoring Service', port: PORT });
});

// Create SLA
app.post('/api/slas', async (req, res) => {
  try {
    const { contractId, type, metric, timeframe, compliance, tenantId } = req.body;
    const slaId = `SLA-${uuidv4().substring(0, 8).toUpperCase()}`;

    const sla = new SLA({
      slaId,
      contractId,
      type,
      metric,
      timeframe,
      compliance: compliance || { targetPercentage: 99.9, currentPercentage: 100, breaches: 0, met: 0 },
      tenantId
    });

    await sla.save();
    res.status(201).json({ success: true, data: sla });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// List SLAs
app.get('/api/slas', async (req, res) => {
  try {
    const { tenantId, status, contractId } = req.query;
    const filter: any = { tenantId };
    if (status) filter.status = status;
    if (contractId) filter.contractId = contractId;

    const slas = await SLA.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: slas });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get SLA
app.get('/api/slas/:id', async (req, res) => {
  try {
    const sla = await SLA.findOne({ slaId: req.params.id });
    if (!sla) return res.status(404).json({ success: false, error: 'SLA not found' });
    res.json({ success: true, data: sla });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Update SLA metric (call this when metric is recorded)
app.post('/api/slas/:id/metric', async (req, res) => {
  try {
    const { value, timestamp } = req.body;
    const sla = await SLA.findOne({ slaId: req.params.id });
    if (!sla) return res.status(404).json({ success: false, error: 'SLA not found' });

    // Calculate compliance
    const target = sla.metric.target;
    const met = value >= target;

    sla.compliance.met += met ? 1 : 0;
    if (!met) {
      sla.compliance.breaches += 1;
      sla.alerts.push({
        level: 'warning',
        message: `SLA breach: ${sla.metric.name} = ${value} (target: ${target})`,
        createdAt: new Date()
      });
    }

    // Recalculate percentage
    const total = sla.compliance.met + sla.compliance.breaches;
    sla.compliance.currentPercentage = total > 0 ? (sla.compliance.met / total) * 100 : 100;

    // Check for critical breach
    if (sla.compliance.currentPercentage < sla.compliance.targetPercentage * 0.9) {
      sla.alerts.push({
        level: 'critical',
        message: `Critical: Compliance dropped below 90% of target`,
        createdAt: new Date()
      });
    }

    // Check if SLA is breached
    if (sla.compliance.currentPercentage < sla.compliance.targetPercentage) {
      sla.status = 'breached';
    }

    sla.updatedAt = new Date();
    await sla.save();

    res.json({ success: true, data: sla });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get compliance report
app.get('/api/slas/:id/report', async (req, res) => {
  try {
    const sla = await SLA.findOne({ slaId: req.params.id });
    if (!sla) return res.status(404).json({ success: false, error: 'SLA not found' });

    res.json({
      success: true,
      data: {
        slaId: sla.slaId,
        type: sla.type,
        metric: sla.metric,
        compliance: sla.compliance,
        alerts: sla.alerts.slice(-5),  // Last 5 alerts
        status: sla.status,
        daysRemaining: sla.timeframe.endDate
          ? Math.max(0, Math.ceil((new Date(sla.timeframe.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Error handling
app.use((_req, res) => res.status(404).json({ success: false, error: 'Not found' }));
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  res.status(500).json({ success: false, error: err.message });
});

mongoose.connect(MONGODB_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`SLA Monitor Service running on port ${PORT}`);
  });
}).catch(err => {
  console.error('MongoDB connection failed:', err);
  process.exit(1);
});

export default app;

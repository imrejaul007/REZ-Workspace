/**
 * Policy Engine - Access Control & Compliance
 * RBAC, ABAC, audit logging
 */

import express from 'express';
import logger from './utils/logger';
import { tracingMiddleware } from './middleware/tracing';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 4034;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/policy-engine';

app.use(express.json());

// Policies model
const PolicySchema = new mongoose.Schema({
  name: String,
  resource: String,
  action: String,
  effect: { type: String, enum: ['allow', 'deny'] },
  conditions: mongoose.Schema.Types.Mixed,
  roles: [String],
});

const Policy = mongoose.models.Policy || mongoose.model('Policy', PolicySchema);

// Check access
app.post('/api/check', async (req, res) => {
  const { role, resource, action, context } = req.body;

  const policy = await Policy.findOne({
    resource,
    action,
    roles: role,
  });

  res.json({
    allowed: policy?.effect === 'allow',
    reason: policy ? 'Policy match' : 'No matching policy',
  });
});

app.post('/api/policies', async (req, res) => {
  const policy = await Policy.create(req.body);
  res.json(policy);
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'policy-engine' });
});



// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-policy-engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
app.listen(PORT, async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1); // Fail fast
  }
  logger.info(`Policy Engine on ${PORT}`);
});

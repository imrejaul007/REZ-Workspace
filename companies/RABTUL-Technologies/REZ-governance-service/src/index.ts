/**
 * REZ Governance Service - Entry Point
 * Port: 4062
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { GovernanceService } from './governance.js';

const app = express();
const PORT = process.env.PORT || 4062;

app.use(helmet());
app.use(cors());
app.use(express.json());

const governance = new GovernanceService();

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'governance', timestamp: new Date().toISOString() });
});

// Check policy
app.post('/policy/check', async (req, res) => {
  try {
    const result = await governance.checkPolicy(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Policy check failed' });
  }
});

// Get compliance status
app.get('/compliance/:entityId', async (req, res) => {
  try {
    const result = await governance.getComplianceStatus(req.params.entityId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get compliance' });
  }
});

// Create policy
app.post('/policy', async (req, res) => {
  try {
    const result = await governance.createPolicy(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create policy' });
  }
});

// Get audit log
app.get('/audit/:entityId', async (req, res) => {
  try {
    const result = await governance.getAuditLog(req.params.entityId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get audit log' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Governance Service running on port ${PORT}`);
});

export default app;
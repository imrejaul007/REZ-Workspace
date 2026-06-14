/**
 * REZ Decision Engine - Entry Point
 * Port: 4063
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { DecisionEngine } from './decisionEngine.js';

const app = express();
const PORT = process.env.PORT || 4063;

app.use(helmet());
app.use(cors());
app.use(express.json());

const engine = new DecisionEngine();

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'decision-engine', timestamp: new Date().toISOString() });
});

// Make decision
app.post('/decide', async (req, res) => {
  try {
    const result = await engine.makeDecision(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Decision failed' });
  }
});

// Get recommendation
app.post('/recommend', async (req, res) => {
  try {
    const result = await engine.getRecommendation(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Recommendation failed' });
  }
});

// Get next best action
app.get('/next-action/:entityId', async (req, res) => {
  try {
    const result = await engine.getNextBestAction(req.params.entityId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get action' });
  }
});

// Evaluate scenario
app.post('/evaluate', async (req, res) => {
  try {
    const result = await engine.evaluateScenario(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Evaluation failed' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Decision Engine running on port ${PORT}`);
});

export default app;
import express from 'express';
import { agentRegistry, teamRegistry } from '../index.js';

const router = express.Router();

/**
 * GET /api/performance
 * Get performance overview
 */
router.get('/', async (req, res) => {
  try {
    const agents = Array.from(agentRegistry.values());
    const teams = Array.from(teamRegistry.values());

    res.json({
      success: true,
      overview: {
        totalAgents: agents.length,
        activeAgents: agents.filter(a => a.state === 'available').length,
        totalTeams: teams.length,
        avgSuccessRate: calculateAvgSuccessRate(agents)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

function calculateAvgSuccessRate(agents) {
  const rates = agents.map(a => a.metrics?.successRate || 0);
  return rates.length > 0
    ? (rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(2)
    : 0;
}

/**
 * GET /api/performance/top-agents
 * Get top performing agents
 */
router.get('/top-agents', async (req, res) => {
  try {
    const { limit = 10, industry } = req.query;

    let agents = Array.from(agentRegistry.values());
    if (industry) agents = agents.filter(a => a.industry === industry);

    const top = agents
      .sort((a, b) => (b.metrics?.successRate || 0) - (a.metrics?.successRate || 0))
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      count: top.length,
      agents: top
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

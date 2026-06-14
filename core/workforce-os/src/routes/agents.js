import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { agentRegistry, AGENT_STATES, AGENT_ROLES, INDUSTRIES } from '../index.js';

const router = express.Router();

/**
 * GET /api/agents
 * List all agents
 */
router.get('/', async (req, res) => {
  try {
    const { state, role, industry, limit = 50 } = req.query;

    let agents = Array.from(agentRegistry.values());

    if (state) agents = agents.filter(a => a.state === state);
    if (role) agents = agents.filter(a => a.role === role);
    if (industry) agents = agents.filter(a => a.industry === industry);

    agents = agents.slice(0, parseInt(limit));

    res.json({
      success: true,
      count: agents.length,
      agents
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/agents
 * Create a new agent
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      role = AGENT_ROLES.SPECIALIST,
      industry,
      skills = [],
      config = {}
    } = req.body;

    if (!name || !industry) {
      return res.status(400).json({
        success: false,
        error: 'Name and industry are required'
      });
    }

    const agentId = `agent_${uuidv4()}`;
    const agent = {
      id: agentId,
      name,
      role,
      industry,
      state: AGENT_STATES.AVAILABLE,
      skills,
      config,
      metrics: {
        tasksCompleted: 0,
        avgResponseTime: 0,
        successRate: 0
      },
      createdAt: new Date().toISOString()
    };

    agentRegistry.set(agentId, agent);

    res.status(201).json({
      success: true,
      agent
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/agents/:id
 * Get agent details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const agent = agentRegistry.get(id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    res.json({
      success: true,
      agent
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/agents/:id
 * Update agent
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const agent = agentRegistry.get(id);
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }

    const updated = { ...agent, ...updates, updatedAt: new Date().toISOString() };
    agentRegistry.set(id, updated);

    res.json({
      success: true,
      agent: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/agents/:id/state
 * Update agent state
 */
router.post('/:id/state', async (req, res) => {
  try {
    const { id } = req.params;
    const { state } = req.body;

    const agent = agentRegistry.get(id);
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }

    if (!Object.values(AGENT_STATES).includes(state)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid state'
      });
    }

    agent.state = state;
    agent.stateChangedAt = new Date().toISOString();
    agentRegistry.set(id, agent);

    res.json({
      success: true,
      agent
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/agents/industry/:industry
 * Get agents by industry
 */
router.get('/industry/:industry', async (req, res) => {
  try {
    const { industry } = req.params;

    const agents = Array.from(agentRegistry.values())
      .filter(a => a.industry === industry);

    res.json({
      success: true,
      industry,
      count: agents.length,
      agents
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

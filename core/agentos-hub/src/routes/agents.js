/**
 * Agent Routes
 */
import { Router } from 'express';
import { AgentRegistry } from '../services/agentRegistry.js';

const router = Router();
const agentRegistry = new AgentRegistry();

// Get all agents
router.get('/', async (req, res) => {
  try {
    const { industry, role, page = 1, limit = 50 } = req.query;
    
    let agents = [];
    
    if (industry) {
      agents = agentRegistry.getByIndustry(industry);
    } else if (role) {
      agents = agentRegistry.getByRole(role);
    } else {
      agents = Array.from(agentRegistry.agents.values());
    }
    
    const start = (page - 1) * limit;
    const paginatedAgents = agents.slice(start, start + parseInt(limit));
    
    res.json({
      agents: paginatedAgents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: agents.length,
        pages: Math.ceil(agents.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// Get specific agent
router.get('/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = agentRegistry.get(agentId);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// Get agents by role across industries
router.get('/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const agents = agentRegistry.getByRole(role);
    
    res.json({
      role,
      agents,
      count: agents.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agents by role' });
  }
});

// Search agents
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const q = query.toLowerCase();
    
    const agents = Array.from(agentRegistry.agents.values()).filter(agent => {
      return agent.name.toLowerCase().includes(q) ||
             agent.role.toLowerCase().includes(q) ||
             agent.description.toLowerCase().includes(q) ||
             agent.capabilities.some(c => c.toLowerCase().includes(q));
    });
    
    res.json({
      query,
      agents,
      count: agents.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search agents' });
  }
});

// Get agent capabilities
router.get('/:agentId/capabilities', async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = agentRegistry.get(agentId);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json({
      agentId,
      role: agent.role,
      capabilities: agent.capabilities,
      tools: agent.tools
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch capabilities' });
  }
});

export default router;

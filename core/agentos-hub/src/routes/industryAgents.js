/**
 * Industry-specific Agent Routes
 */
import { Router } from 'express';
import { AgentRegistry } from '../services/agentRegistry.js';

const router = Router();
const agentRegistry = new AgentRegistry();

// Get all industry agent catalogs
router.get('/', async (req, res) => {
  try {
    const catalog = agentRegistry.getCatalog();
    res.json({
      industries: catalog,
      totalIndustries: catalog.length,
      totalAgents: agentRegistry.getTotalCount()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch industry agents' });
  }
});

// Get specific industry agents
router.get('/:industry', async (req, res) => {
  try {
    const { industry } = req.params;
    const agents = agentRegistry.getByIndustry(industry);
    
    if (agents.length === 0) {
      return res.status(404).json({ error: 'Industry not found' });
    }
    
    res.json({
      industry,
      agents,
      count: agents.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch industry agents' });
  }
});

// Get agent roles in an industry
router.get('/:industry/roles', async (req, res) => {
  try {
    const { industry } = req.params;
    const agents = agentRegistry.getByIndustry(industry);
    
    if (agents.length === 0) {
      return res.status(404).json({ error: 'Industry not found' });
    }
    
    const roles = agents.map(a => ({
      role: a.role,
      name: a.name,
      description: a.description,
      capabilities: a.capabilities
    }));
    
    res.json({
      industry,
      roles,
      count: roles.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch industry roles' });
  }
});

// Get specific agent role in an industry
router.get('/:industry/:role', async (req, res) => {
  try {
    const { industry, role } = req.params;
    const agents = agentRegistry.getByIndustry(industry);
    
    const agent = agents.find(a => a.role === role);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent role not found' });
    }
    
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// Compare agents across industries
router.post('/compare', async (req, res) => {
  try {
    const { industries, role } = req.body;
    
    const comparison = industries.map(industry => {
      const agents = agentRegistry.getByIndustry(industry);
      const agent = role ? agents.find(a => a.role === role) : agents[0];
      return {
        industry,
        agent: agent || null
      };
    });
    
    res.json({
      role: role || 'all',
      comparison,
      comparedIndustries: industries.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compare agents' });
  }
});

export default router;

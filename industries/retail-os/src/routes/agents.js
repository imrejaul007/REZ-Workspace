/**
 * Retail OS - AI Agents Routes
 */

const express = require('express');
const router = express.Router();

// GET /api/agents
router.get('/', (req, res) => {
  res.json({
    agents: [
      { id: 'pricing-agent', name: 'Pricing Agent', type: 'pricing', status: 'active', tasks: 234 },
      { id: 'inventory-agent', name: 'Inventory Agent', type: 'inventory', status: 'active', tasks: 189 },
      { id: 'customer-agent', name: 'Customer Agent', type: 'customer', status: 'active', tasks: 156 },
      { id: 'recommendation-agent', name: 'Recommendation Agent', type: 'recommendation', status: 'active', tasks: 312 }
    ],
    total: 4
  });
});

// GET /api/agents/:id
router.get('/:id', (req, res) => {
  const agentMap = {
    'pricing-agent': { name: 'Pricing Agent', type: 'pricing', capabilities: ['dynamic pricing', 'competitor analysis'] },
    'inventory-agent': { name: 'Inventory Agent', type: 'inventory', capabilities: ['stock prediction', 'reorder alerts'] },
    'customer-agent': { name: 'Customer Agent', type: 'customer', capabilities: ['support', 'loyalty management'] },
    'recommendation-agent': { name: 'Recommendation Agent', type: 'recommendation', capabilities: ['personalized recommendations', 'upselling'] }
  };

  const agent = agentMap[req.params.id];
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json({ id: req.params.id, ...agent, status: 'active' });
});

// POST /api/agents/:id/task
router.post('/:id/task', (req, res) => {
  const { action, params } = req.body;
  if (!action) return res.status(400).json({ error: 'action required' });
  res.json({ agentId: req.params.id, taskId: `task-${Date.now()}`, action, params: params || {}, status: 'queued' });
});

module.exports = router;
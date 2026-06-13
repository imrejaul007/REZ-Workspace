/**
 * Automotive OS - AI Agents Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    agents: [
      { id: 'service-advisor', name: 'Service Advisor Agent', type: 'service', status: 'active', tasks: 156 },
      { id: 'inventory-agent', name: 'Inventory Agent', type: 'inventory', status: 'active', tasks: 234 },
      { id: 'sales-agent', name: 'Sales Agent', type: 'sales', status: 'active', tasks: 89 }
    ],
    total: 3
  });
});

router.get('/:id', (req, res) => {
  const agentMap = {
    'service-advisor': { name: 'Service Advisor Agent', type: 'service', capabilities: ['service scheduling', 'cost estimation', 'maintenance reminders'] },
    'inventory-agent': { name: 'Inventory Agent', type: 'inventory', capabilities: ['stock monitoring', 'reorder alerts', 'parts lookup'] },
    'sales-agent': { name: 'Sales Agent', type: 'sales', capabilities: ['lead management', 'pricing', 'financing options'] }
  };
  const agent = agentMap[req.params.id];
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json({ id: req.params.id, ...agent, status: 'active' });
});

router.post('/:id/task', (req, res) => {
  const { action, params } = req.body;
  if (!action) return res.status(400).json({ error: 'action required' });
  res.json({ agentId: req.params.id, taskId: `task-${Date.now()}`, action, params: params || {}, status: 'queued' });
});

module.exports = router;
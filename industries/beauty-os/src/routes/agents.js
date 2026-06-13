/**
 * Beauty OS - AI Agents Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    agents: [
      { id: 'booking-agent', name: 'Booking Agent', type: 'booking', status: 'active', tasks: 234 },
      { id: 'recommendation-agent', name: 'Recommendation Agent', type: 'recommendation', status: 'active', tasks: 156 },
      { id: 'inventory-agent', name: 'Inventory Agent', type: 'inventory', status: 'active', tasks: 89 }
    ],
    total: 3
  });
});

router.get('/:id', (req, res) => {
  const agentMap = {
    'booking-agent': { name: 'Booking Agent', type: 'booking', capabilities: ['scheduling', 'reminders', 'cancellations'] },
    'recommendation-agent': { name: 'Recommendation Agent', type: 'recommendation', capabilities: ['personalized suggestions', 'upselling'] },
    'inventory-agent': { name: 'Inventory Agent', type: 'inventory', capabilities: ['stock monitoring', 'reorder alerts'] }
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
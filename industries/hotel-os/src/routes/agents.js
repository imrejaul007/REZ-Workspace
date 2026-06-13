/**
 * Hotel OS - AI Agents Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    agents: [
      { id: 'ai-concierge', name: 'AI Concierge', type: 'concierge', status: 'active', tasks: 456 },
      { id: 'upsell-engine', name: 'Upsell Engine', type: 'upsell', status: 'active', tasks: 234 },
      { id: 'predictive-housekeeping', name: 'Predictive Housekeeping', type: 'housekeeping', status: 'active', tasks: 312 }
    ],
    total: 3
  });
});

router.get('/:id', (req, res) => {
  const agentMap = {
    'ai-concierge': { name: 'AI Concierge', type: 'concierge', capabilities: ['guest requests', 'recommendations', 'local info'] },
    'upsell-engine': { name: 'Upsell Engine', type: 'upsell', capabilities: ['room upgrades', 'amenities', 'packages'] },
    'predictive-housekeeping': { name: 'Predictive Housekeeping', type: 'housekeeping', capabilities: ['schedule optimization', 'maintenance prediction'] }
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

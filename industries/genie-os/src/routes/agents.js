/**
 * Genie OS - AI Agents Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    agents: [
      { id: 'wish-parser', name: 'Wish Parser Agent', type: 'parsing', status: 'active', tasks: 234 },
      { id: 'fulfillment-agent', name: 'Fulfillment Agent', type: 'fulfillment', status: 'active', tasks: 456 },
      { id: 'quality-agent', name: 'Quality Agent', type: 'quality', status: 'active', tasks: 189 }
    ],
    total: 3
  });
});

router.get('/:id', (req, res) => {
  const agentMap = {
    'wish-parser': { name: 'Wish Parser Agent', type: 'parsing', capabilities: ['intent detection', 'entity extraction'] },
    'fulfillment-agent': { name: 'Fulfillment Agent', type: 'fulfillment', capabilities: ['action execution', 'result generation'] },
    'quality-agent': { name: 'Quality Agent', type: 'quality', capabilities: ['validation', 'improvement'] }
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
/**
 * Transport OS - AI Agents Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    agents: [
      { id: 'dispatch-agent', name: 'Dispatch Agent', type: 'dispatch', status: 'active', tasks: 456 },
      { id: 'route-agent', name: 'Route Optimization Agent', type: 'routing', status: 'active', tasks: 234 },
      { id: 'safety-agent', name: 'Safety Agent', type: 'safety', status: 'active', tasks: 89 }
    ],
    total: 3
  });
});

router.get('/:id', (req, res) => {
  const agentMap = {
    'dispatch-agent': { name: 'Dispatch Agent', type: 'dispatch', capabilities: ['trip matching', 'driver allocation'] },
    'route-agent': { name: 'Route Optimization Agent', type: 'routing', capabilities: ['path optimization', 'traffic avoidance'] },
    'safety-agent': { name: 'Safety Agent', type: 'safety', capabilities: ['driver monitoring', 'incident detection'] }
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
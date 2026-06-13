/**
 * BOA OS - AI Agents Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    agents: [
      { id: 'decision-agent', name: 'Decision Agent', type: 'decision', status: 'active', tasks: 234 },
      { id: 'analysis-agent', name: 'Analysis Agent', type: 'analysis', status: 'active', tasks: 456 },
      { id: 'planning-agent', name: 'Planning Agent', type: 'planning', status: 'active', tasks: 189 },
      { id: 'coordination-agent', name: 'Coordination Agent', type: 'coordination', status: 'active', tasks: 312 }
    ],
    total: 4
  });
});

router.get('/:id', (req, res) => {
  const agentMap = {
    'decision-agent': { name: 'Decision Agent', type: 'decision', capabilities: ['decision support', 'risk analysis', 'recommendations'] },
    'analysis-agent': { name: 'Analysis Agent', type: 'analysis', capabilities: ['data analysis', 'reporting', 'insights'] },
    'planning-agent': { name: 'Planning Agent', type: 'planning', capabilities: ['strategic planning', 'roadmapping', 'goal setting'] },
    'coordination-agent': { name: 'Coordination Agent', type: 'coordination', capabilities: ['task coordination', 'workflow', 'scheduling'] }
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
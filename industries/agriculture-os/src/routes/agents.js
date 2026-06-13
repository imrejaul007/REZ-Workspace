/**
 * Agriculture OS - AI Agents Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    agents: [
      { id: 'crop-advisor', name: 'Crop Advisor Agent', type: 'advisory', status: 'active', tasks: 156 },
      { id: 'irrigation-agent', name: 'Irrigation Agent', type: 'irrigation', status: 'active', tasks: 234 },
      { id: 'harvest-predictor', name: 'Harvest Predictor', type: 'prediction', status: 'active', tasks: 89 }
    ],
    total: 3
  });
});

router.get('/:id', (req, res) => {
  const agentMap = {
    'crop-advisor': { name: 'Crop Advisor Agent', type: 'advisory', capabilities: ['disease detection', 'growth analysis', 'recommendations'] },
    'irrigation-agent': { name: 'Irrigation Agent', type: 'irrigation', capabilities: ['schedule optimization', 'water management'] },
    'harvest-predictor': { name: 'Harvest Predictor', type: 'prediction', capabilities: ['yield prediction', 'timing optimization'] }
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

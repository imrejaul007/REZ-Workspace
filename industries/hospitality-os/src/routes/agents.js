/**
 * Hospitality OS - AI Agents Routes
 */

const express = require('express');
const router = express.Router();

// GET /api/agents
router.get('/', (req, res) => {
  res.json({
    agents: [
      { id: 'booking-agent', name: 'Booking Agent', type: 'booking', status: 'active', tasks: 456 },
      { id: 'revenue-agent', name: 'Revenue Agent', type: 'revenue', status: 'active', tasks: 234 },
      { id: 'guest-agent', name: 'Guest Experience Agent', type: 'guest', status: 'active', tasks: 189 },
      { id: 'housekeeping-agent', name: 'Housekeeping Agent', type: 'housekeeping', status: 'active', tasks: 312 }
    ],
    total: 4
  });
});

// GET /api/agents/:id
router.get('/:id', (req, res) => {
  const agentMap = {
    'booking-agent': { name: 'Booking Agent', type: 'booking', capabilities: ['reservation management', 'availability sync'] },
    'revenue-agent': { name: 'Revenue Agent', type: 'revenue', capabilities: ['dynamic pricing', 'forecast'] },
    'guest-agent': { name: 'Guest Experience Agent', type: 'guest', capabilities: ['preferences', 'personalization'] },
    'housekeeping-agent': { name: 'Housekeeping Agent', type: 'housekeeping', capabilities: ['scheduling', 'maintenance alerts'] }
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
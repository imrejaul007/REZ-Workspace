/**
 * Agent OS - Digital Twins Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    twins: [
      { id: 'agent-agent-twin', name: 'Agent Twin', type: 'agent', health: 98 },
      { id: 'agent-task-twin', name: 'Task Twin', type: 'task', health: 99 },
      { id: 'agent-workflow-twin', name: 'Workflow Twin', type: 'workflow', health: 97 },
      { id: 'agent-capability-twin', name: 'Capability Twin', type: 'capability', health: 96 }
    ],
    total: 4
  });
});

router.get('/:id', (req, res) => {
  const twinMap = {
    'agent-agent-twin': { name: 'Agent Twin', type: 'agent', state: { total: 10, active: 8 } },
    'agent-task-twin': { name: 'Task Twin', type: 'task', state: { queued: 25, completed: 500 } },
    'agent-workflow-twin': { name: 'Workflow Twin', type: 'workflow', state: { total: 5, active: 3 } },
    'agent-capability-twin': { name: 'Capability Twin', type: 'capability', state: { total: 15, available: 12 } }
  };
  const twin = twinMap[req.params.id];
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  res.json({ id: req.params.id, ...twin, status: 'active', lastSync: new Date().toISOString() });
});

router.post('/:id/sync', (req, res) => {
  res.json({ id: req.params.id, status: 'synced', lastSync: new Date().toISOString() });
});

module.exports = router;
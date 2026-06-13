/**
 * Agent OS - Tasks Routes
 */

const express = require('express');
const router = express.Router();

let tasks = [
  { id: 'TSK-001', agentId: 'AGT-001', action: 'analyze', status: 'completed', result: 'Analysis complete', createdAt: '2024-01-15' }
];

router.get('/', (req, res) => {
  const { agentId, status } = req.query;
  let filtered = [...tasks];
  if (agentId) filtered = filtered.filter(t => t.agentId === agentId);
  if (status) filtered = filtered.filter(t => t.status === status);
  res.json({ tasks: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { agentId, action, params } = req.body;
  if (!agentId || !action) return res.status(400).json({ error: 'agentId and action required' });
  const newTask = { id: `TSK-${Date.now()}`, agentId, action, params: params || {}, status: 'queued', result: null, createdAt: new Date().toISOString() };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

router.get('/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

module.exports = router;
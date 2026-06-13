/**
 * Business Copilot OS - Execution Routes
 */

const express = require('express');
const router = express.Router();

let executions = [
  { id: 'EXEC-001', action: 'generate_report', status: 'completed', result: { report: 'Q1 Summary' }, createdAt: '2024-01-15' }
];

router.get('/', (req, res) => {
  const { status } = req.query;
  let filtered = [...executions];
  if (status) filtered = filtered.filter(e => e.status === status);
  res.json({ executions: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { action, params } = req.body;
  if (!action) return res.status(400).json({ error: 'action required' });
  const newExecution = { id: `EXEC-${Date.now()}`, action, params: params || {}, status: 'running', result: null, createdAt: new Date().toISOString() };
  executions.push(newExecution);
  res.status(201).json(newExecution);
});

router.get('/:id', (req, res) => {
  const execution = executions.find(e => e.id === req.params.id);
  if (!execution) return res.status(404).json({ error: 'Execution not found' });
  res.json(execution);
});

module.exports = router;
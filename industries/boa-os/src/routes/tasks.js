/**
 * BOA OS - Tasks Routes
 */

const express = require('express');
const router = express.Router();

let tasks = [
  { id: 'TSK-001', title: 'Review Q1 Report', executive: 'CEO', priority: 'high', status: 'pending', dueDate: '2024-01-20' },
  { id: 'TSK-002', title: 'Approve Budget', executive: 'CFO', priority: 'high', status: 'completed', dueDate: '2024-01-15' }
];

router.get('/', (req, res) => {
  const { executive, status } = req.query;
  let filtered = [...tasks];
  if (executive) filtered = filtered.filter(t => t.executive === executive);
  if (status) filtered = filtered.filter(t => t.status === status);
  res.json({ tasks: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { title, executive, priority, dueDate } = req.body;
  if (!title || !executive) return res.status(400).json({ error: 'title and executive required' });
  const newTask = { id: `TSK-${Date.now()}`, title, executive, priority: priority || 'medium', status: 'pending', dueDate: dueDate || null };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

router.patch('/:id/status', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  task.status = req.body.status;
  res.json(task);
});

module.exports = router;
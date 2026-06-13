/**
 * Hotel OS - Housekeeping Routes
 */

const express = require('express');
const router = express.Router();

let tasks = [
  { id: 'HK-001', roomId: 'ROOM-102', type: 'checkout', status: 'pending', priority: 'high', assignedTo: 'staff-001', dueTime: '2024-01-15T11:00:00Z' },
  { id: 'HK-002', roomId: 'ROOM-101', type: 'turndown', status: 'in-progress', priority: 'normal', assignedTo: 'staff-002', dueTime: '2024-01-15T21:00:00Z' },
  { id: 'HK-003', roomId: 'ROOM-202', type: 'maintenance', status: 'pending', priority: 'low', assignedTo: null, dueTime: '2024-01-16T10:00:00Z' }
];

router.get('/', (req, res) => {
  const { roomId, status, priority } = req.query;
  let filtered = [...tasks];
  if (roomId) filtered = filtered.filter(t => t.roomId === roomId);
  if (status) filtered = filtered.filter(t => t.status === status);
  if (priority) filtered = filtered.filter(t => t.priority === priority);
  res.json({ tasks: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

router.post('/', (req, res) => {
  const { roomId, type, priority, assignedTo, dueTime } = req.body;
  if (!roomId || !type) return res.status(400).json({ error: 'roomId and type required' });
  const newTask = { id: `HK-${Date.now()}`, roomId, type, status: 'pending', priority: priority || 'normal', assignedTo: assignedTo || null, dueTime: dueTime || null };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

router.patch('/:id/status', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  task.status = req.body.status;
  res.json(task);
});

router.patch('/:id/assign', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  task.assignedTo = req.body.assignedTo;
  res.json(task);
});

module.exports = router;

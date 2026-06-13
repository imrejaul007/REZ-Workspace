/**
 * Education OS - Assignments Routes
 */

const express = require('express');
const router = express.Router();

let assignments = [
  { id: 'ASN-001', courseId: 'CRS-001', title: 'AI Fundamentals Quiz', dueDate: '2024-01-20', maxScore: 100, submissions: 40, status: 'active' },
  { id: 'ASN-002', courseId: 'CRS-002', title: 'Data Analysis Project', dueDate: '2024-01-25', maxScore: 150, submissions: 25, status: 'active' }
];

router.get('/', (req, res) => {
  const { courseId, status } = req.query;
  let filtered = [...assignments];
  if (courseId) filtered = filtered.filter(a => a.courseId === courseId);
  if (status) filtered = filtered.filter(a => a.status === status);
  res.json({ assignments: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const assignment = assignments.find(a => a.id === req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
  res.json(assignment);
});

router.post('/', (req, res) => {
  const { courseId, title, dueDate, maxScore } = req.body;
  if (!courseId || !title || !dueDate) return res.status(400).json({ error: 'courseId, title, dueDate required' });
  const newAssignment = { id: `ASN-${Date.now()}`, courseId, title, dueDate, maxScore: maxScore || 100, submissions: 0, status: 'active' };
  assignments.push(newAssignment);
  res.status(201).json(newAssignment);
});

module.exports = router;

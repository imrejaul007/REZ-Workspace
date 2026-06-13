/**
 * Education OS - Grades Routes
 */

const express = require('express');
const router = express.Router();

let grades = [
  { id: 'GRD-001', studentId: 'STU-001', courseId: 'CRS-001', assignmentId: 'ASN-001', score: 92, gradedAt: '2024-01-18' }
];

router.get('/', (req, res) => {
  const { studentId, courseId } = req.query;
  let filtered = [...grades];
  if (studentId) filtered = filtered.filter(g => g.studentId === studentId);
  if (courseId) filtered = filtered.filter(g => g.courseId === courseId);
  res.json({ grades: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { studentId, courseId, assignmentId, score } = req.body;
  if (!studentId || !courseId || score === undefined) return res.status(400).json({ error: 'studentId, courseId, score required' });
  const newGrade = { id: `GRD-${Date.now()}`, studentId, courseId, assignmentId: assignmentId || null, score, gradedAt: new Date().toISOString() };
  grades.push(newGrade);
  res.status(201).json(newGrade);
});

module.exports = router;

/**
 * Education OS - Enrollments Routes
 */

const express = require('express');
const router = express.Router();

let enrollments = [
  { id: 'ENR-001', studentId: 'STU-001', courseId: 'CRS-001', status: 'enrolled', grade: null, enrolledAt: '2024-01-15' },
  { id: 'ENR-002', studentId: 'STU-001', courseId: 'CRS-002', status: 'enrolled', grade: null, enrolledAt: '2024-01-15' },
  { id: 'ENR-003', studentId: 'STU-002', courseId: 'CRS-001', status: 'enrolled', grade: null, enrolledAt: '2024-01-15' }
];

router.get('/', (req, res) => {
  const { studentId, courseId, status } = req.query;
  let filtered = [...enrollments];
  if (studentId) filtered = filtered.filter(e => e.studentId === studentId);
  if (courseId) filtered = filtered.filter(e => e.courseId === courseId);
  if (status) filtered = filtered.filter(e => e.status === status);
  res.json({ enrollments: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const enrollment = enrollments.find(e => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
  res.json(enrollment);
});

router.post('/', (req, res) => {
  const { studentId, courseId } = req.body;
  if (!studentId || !courseId) return res.status(400).json({ error: 'studentId and courseId required' });
  const newEnrollment = { id: `ENR-${Date.now()}`, studentId, courseId, status: 'enrolled', grade: null, enrolledAt: new Date().toISOString() };
  enrollments.push(newEnrollment);
  res.status(201).json(newEnrollment);
});

router.patch('/:id/grade', (req, res) => {
  const enrollment = enrollments.find(e => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
  enrollment.grade = req.body.grade;
  res.json(enrollment);
});

module.exports = router;

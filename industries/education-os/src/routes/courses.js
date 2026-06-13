/**
 * Education OS - Courses Routes
 */

const express = require('express');
const router = express.Router();

let courses = [
  { id: 'CRS-001', name: 'Introduction to AI', code: 'AI101', credits: 4, instructor: 'PROF-001', enrolled: 45, maxCapacity: 50, status: 'active' },
  { id: 'CRS-002', name: 'Data Science Fundamentals', code: 'DS201', credits: 3, instructor: 'PROF-002', enrolled: 38, maxCapacity: 40, status: 'active' },
  { id: 'CRS-003', name: 'Web Development', code: 'WD101', credits: 4, instructor: 'PROF-001', enrolled: 28, maxCapacity: 30, status: 'active' }
];

router.get('/', (req, res) => {
  const { status, instructor } = req.query;
  let filtered = [...courses];
  if (status) filtered = filtered.filter(c => c.status === status);
  if (instructor) filtered = filtered.filter(c => c.instructor === instructor);
  res.json({ courses: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const course = courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json(course);
});

router.post('/', (req, res) => {
  const { name, code, credits, instructor, maxCapacity } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'name and code required' });
  const newCourse = { id: `CRS-${Date.now()}`, name, code, credits: credits || 3, instructor: instructor || null, enrolled: 0, maxCapacity: maxCapacity || 30, status: 'active' };
  courses.push(newCourse);
  res.status(201).json(newCourse);
});

router.put('/:id', (req, res) => {
  const index = courses.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Course not found' });
  courses[index] = { ...courses[index], ...req.body };
  res.json(courses[index]);
});

module.exports = router;

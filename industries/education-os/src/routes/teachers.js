/**
 * Education OS - Teachers Routes
 */

const express = require('express');
const router = express.Router();

let teachers = [
  { id: 'PROF-001', name: 'Dr. Sarah Chen', email: 'sarah@edu.com', department: 'Computer Science', courses: ['CRS-001', 'CRS-003'], officeHours: 'MWF 2-4pm', status: 'active' },
  { id: 'PROF-002', name: 'Dr. Michael Lee', email: 'michael@edu.com', department: 'Data Science', courses: ['CRS-002'], officeHours: 'TTh 10-12pm', status: 'active' }
];

router.get('/', (req, res) => {
  const { department, status } = req.query;
  let filtered = [...teachers];
  if (department) filtered = filtered.filter(t => t.department === department);
  if (status) filtered = filtered.filter(t => t.status === status);
  res.json({ teachers: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const teacher = teachers.find(t => t.id === req.params.id);
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
  res.json(teacher);
});

router.post('/', (req, res) => {
  const { name, email, department } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'name and email required' });
  const newTeacher = { id: `PROF-${Date.now()}`, name, email, department: department || 'General', courses: [], officeHours: '', status: 'active' };
  teachers.push(newTeacher);
  res.status(201).json(newTeacher);
});

router.put('/:id', (req, res) => {
  const index = teachers.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Teacher not found' });
  teachers[index] = { ...teachers[index], ...req.body };
  res.json(teachers[index]);
});

module.exports = router;

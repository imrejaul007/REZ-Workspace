/**
 * Education OS - Students Routes
 */

const express = require('express');
const router = express.Router();

let students = [
  { id: 'STU-001', name: 'Alice Johnson', email: 'alice@edu.com', phone: '555-0101', enrollmentDate: '2024-01-01', gpa: 3.8, major: 'Computer Science', status: 'active' },
  { id: 'STU-002', name: 'Bob Williams', email: 'bob@edu.com', phone: '555-0102', enrollmentDate: '2024-01-01', gpa: 3.5, major: 'Data Science', status: 'active' }
];

router.get('/', (req, res) => {
  const { major, status } = req.query;
  let filtered = [...students];
  if (major) filtered = filtered.filter(s => s.major === major);
  if (status) filtered = filtered.filter(s => s.status === status);
  res.json({ students: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const student = students.find(s => s.id === req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(student);
});

router.post('/', (req, res) => {
  const { name, email, phone, major } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'name and email required' });
  const newStudent = { id: `STU-${Date.now()}`, name, email, phone: phone || null, enrollmentDate: new Date().toISOString().split('T')[0], gpa: 0, major: major || 'Undeclared', status: 'active' };
  students.push(newStudent);
  res.status(201).json(newStudent);
});

router.put('/:id', (req, res) => {
  const index = students.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Student not found' });
  students[index] = { ...students[index], ...req.body };
  res.json(students[index]);
});

module.exports = router;

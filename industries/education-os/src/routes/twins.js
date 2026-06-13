/**
 * Education OS - Digital Twins Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    twins: [
      { id: 'edu-course-twin', name: 'Course Twin', type: 'course', health: 98 },
      { id: 'edu-student-twin', name: 'Student Twin', type: 'student', health: 99 },
      { id: 'edu-teacher-twin', name: 'Teacher Twin', type: 'teacher', health: 97 },
      { id: 'edu-institution-twin', name: 'Institution Twin', type: 'institution', health: 96 }
    ],
    total: 4
  });
});

router.get('/:id', (req, res) => {
  const twinMap = {
    'edu-course-twin': { name: 'Course Twin', type: 'course', state: { total: 45, active: 42 } },
    'edu-student-twin': { name: 'Student Twin', type: 'student', state: { total: 500, active: 485 } },
    'edu-teacher-twin': { name: 'Teacher Twin', type: 'teacher', state: { total: 45, active: 42 } },
    'edu-institution-twin': { name: 'Institution Twin', type: 'institution', state: { total: 2, students: 5200 } }
  };
  const twin = twinMap[req.params.id];
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  res.json({ id: req.params.id, ...twin, status: 'active', lastSync: new Date().toISOString() });
});

router.post('/:id/sync', (req, res) => {
  res.json({ id: req.params.id, status: 'synced', lastSync: new Date().toISOString() });
});

module.exports = router;

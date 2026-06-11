const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { validate, schemas } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');

router.post(
  '/',
  authMiddleware,
  validate(schemas.attendanceCreate),
  attendanceController.markAttendance
);

router.get('/:courseId', attendanceController.getAttendanceByCourse);

router.get('/student/:studentId', attendanceController.getAttendanceByStudent);

router.post('/bulk', authMiddleware, attendanceController.bulkMarkAttendance);

module.exports = router;
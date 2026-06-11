const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { validate, schemas } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');

router.post(
  '/',
  authMiddleware,
  validate(schemas.gradeCreate),
  gradeController.createGrade
);

router.get('/:studentId', gradeController.getGradesByStudent);

router.get('/course/:courseId', gradeController.getGradesByCourse);

router.put('/:id', authMiddleware, gradeController.updateGrade);

router.delete('/:id', authMiddleware, gradeController.deleteGrade);

router.get('/gpa/:studentId', gradeController.getStudentGPA);

module.exports = router;
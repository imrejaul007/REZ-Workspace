const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { validate, schemas } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');

router.post(
  '/',
  authMiddleware,
  validate(schemas.courseCreate),
  courseController.createCourse
);

router.get('/', courseController.getAllCourses);

router.get('/:id', courseController.getCourseById);

router.put('/:id', authMiddleware, courseController.updateCourse);

router.delete('/:id', authMiddleware, courseController.deleteCourse);

router.post('/:courseId/students/:studentId', authMiddleware, courseController.addStudentToCourse);

router.delete('/:courseId/students/:studentId', authMiddleware, courseController.removeStudentFromCourse);

module.exports = router;
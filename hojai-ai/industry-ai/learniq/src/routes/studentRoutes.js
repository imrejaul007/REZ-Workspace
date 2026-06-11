const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { validate, schemas } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.post(
  '/',
  authMiddleware,
  validate(schemas.studentCreate),
  studentController.createStudent
);

router.get('/', studentController.getAllStudents);

router.get('/:id', studentController.getStudentById);

router.put(
  '/:id',
  authMiddleware,
  validate(schemas.studentUpdate),
  studentController.updateStudent
);

router.delete('/:id', authMiddleware, studentController.deleteStudent);

module.exports = router;
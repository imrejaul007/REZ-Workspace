const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authMiddleware } = require('../middleware/auth');

router.get('/dashboard', analyticsController.getDashboard);

router.get('/student/:studentId', analyticsController.getStudentAnalytics);

router.get('/course/:courseId', analyticsController.getCourseAnalytics);

module.exports = router;
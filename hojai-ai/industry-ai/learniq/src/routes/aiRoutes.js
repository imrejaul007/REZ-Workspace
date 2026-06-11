const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { validate, schemas } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.get('/status', aiController.getAIStatus);

router.post(
  '/tutor/recommend',
  authMiddleware,
  aiLimiter,
  validate(schemas.aiTutorRecommend),
  aiController.tutorRecommend
);

router.post(
  '/admission/process',
  aiLimiter,
  validate(schemas.aiAdmissionProcess),
  aiController.admissionProcess
);

router.post(
  '/placement/analyze',
  authMiddleware,
  aiLimiter,
  validate(schemas.aiPlacementAnalyze),
  aiController.placementAnalyze
);

router.post(
  '/grader/calculate',
  authMiddleware,
  aiLimiter,
  validate(schemas.aiGraderCalculate),
  aiController.graderCalculate
);

module.exports = router;
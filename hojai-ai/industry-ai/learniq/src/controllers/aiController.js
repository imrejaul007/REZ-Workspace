const { asyncHandler } = require('../middleware/errorHandler');
const { tutorAgent, admissionAgent, placementAgent, graderAgent, getAllAgentStatus } = require('../ai');
const logger = require('../config/logger');

const getAIStatus = asyncHandler(async (req, res) => {
  const status = await getAllAgentStatus();

  res.json({
    success: true,
    data: status
  });
});

const tutorRecommend = asyncHandler(async (req, res) => {
  const { studentId, courseIds } = req.body;

  logger.info(`Tutor recommendation requested for student: ${studentId}`);

  const result = await tutorAgent.recommend({ studentId, courseIds });

  res.json({
    success: true,
    data: result
  });
});

const admissionProcess = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    courseId,
    previousQualification,
    statementOfPurpose
  } = req.body;

  logger.info(`Admission processing requested for: ${email}`);

  const result = await admissionAgent.process({
    name,
    email,
    phone,
    courseId,
    previousQualification,
    statementOfPurpose
  });

  res.json({
    success: true,
    data: result
  });
});

const placementAnalyze = asyncHandler(async (req, res) => {
  const { studentId, skills, preferences } = req.body;

  logger.info(`Placement analysis requested for student: ${studentId}`);

  const result = await placementAgent.analyze({ studentId, skills, preferences });

  res.json({
    success: true,
    data: result
  });
});

const graderCalculate = asyncHandler(async (req, res) => {
  const { studentId, courseId, assignments, rawScore } = req.body;

  logger.info(`Grade calculation requested for student: ${studentId}, course: ${courseId}`);

  const result = await graderAgent.calculate({ studentId, courseId, assignments, rawScore });

  res.json({
    success: true,
    data: result
  });
});

module.exports = {
  getAIStatus,
  tutorRecommend,
  admissionProcess,
  placementAnalyze,
  graderCalculate
};
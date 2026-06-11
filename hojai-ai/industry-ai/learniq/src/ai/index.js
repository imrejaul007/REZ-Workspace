const tutorAgent = require('./tutorAgent');
const admissionAgent = require('./admissionAgent');
const placementAgent = require('./placementAgent');
const graderAgent = require('./graderAgent');

const getAllAgentStatus = async () => {
  try {
    const [tutor, admission, placement, grader] = await Promise.all([
      tutorAgent.getStatus(),
      admissionAgent.getStatus(),
      placementAgent.getStatus(),
      graderAgent.getStatus()
    ]);

    return {
      system: 'LEARNIQ Education AI',
      version: '1.0.0',
      status: 'operational',
      agents: [tutor, admission, placement, grader],
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  tutorAgent,
  admissionAgent,
  placementAgent,
  graderAgent,
  getAllAgentStatus
};
const express = require('express');
const router = express.Router();

// GET analytics overview
router.get('/', (req, res) => {
  res.json({
    totalProjects: 15,
    activeProjects: 8,
    totalBudget: 50000000,
    spentBudget: 15000000,
    totalWorkers: 500,
    safetyIncidents: 2,
    onTimeDelivery: 0.85
  });
});

// GET project analytics
router.get('/projects', (req, res) => {
  res.json({
    totalProjects: 15,
    byStatus: { planning: 3, in_progress: 8, completed: 4 },
    averageProjectDuration: '18 months',
    budgetVariance: 0.08,
    onTimeDelivery: 0.85
  });
});

// GET safety analytics
router.get('/safety', (req, res) => {
  res.json({
    totalIncidents: 2,
    incidentRate: 0.004,
    nearMisses: 15,
    safetyCompliance: 0.95,
    trainingHours: 2500,
    safetyScore: 0.92
  });
});

module.exports = router;
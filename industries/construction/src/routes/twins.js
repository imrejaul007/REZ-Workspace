const express = require('express');
const router = express.Router();

// Digital Twins for Construction OS

// GET all twins
router.get('/', (req, res) => {
  res.json({
    twins: ['ProjectTwin', 'ContractorTwin', 'WorkerTwin', 'MaterialTwin']
  });
});

// ProjectTwin - project simulation
router.get('/project', (req, res) => {
  res.json({
    twinType: 'ProjectTwin',
    description: 'Construction project simulation',
    state: {
      projectId: 'P001',
      name: 'Skyline Tower',
      progress: 0.45,
      budget: 5000000,
      spent: 2100000,
      scheduleVariance: 0.08,
      riskLevel: 'medium'
    },
    operations: ['predictCompletion', 'costForecasting', 'riskAssessment']
  });
});

// ContractorTwin - contractor simulation
router.get('/contractor', (req, res) => {
  res.json({
    twinType: 'ContractorTwin',
    description: 'Contractor performance simulation',
    state: {
      contractorId: 'C001',
      name: 'BuildRight Construction',
      rating: 4.8,
      activeProjects: 2,
      qualityScore: 0.92,
      safetyRecord: 0.98
    },
    operations: ['performancePrediction', 'riskAssessment', 'matchingOptimization']
  });
});

// WorkerTwin - worker simulation
router.get('/worker', (req, res) => {
  res.json({
    twinType: 'WorkerTwin',
    description: 'Worker productivity simulation',
    state: {
      workerId: 'W001',
      name: 'Raj Kumar',
      role: 'site engineer',
      productivity: 0.85,
      safetyCompliance: 0.95,
      attendance: 0.92
    },
    operations: ['productivityPrediction', 'safetyMonitoring', 'workloadOptimization']
  });
});

// MaterialTwin - material simulation
router.get('/material', (req, res) => {
  res.json({
    twinType: 'MaterialTwin',
    description: 'Material inventory simulation',
    state: {
      materialId: 'M001',
      name: 'Cement',
      quantity: 500,
      consumptionRate: 50,
      reorderPoint: 100,
      daysUntilStockout: 10
    },
    operations: ['predictStockout', 'optimizeOrdering', 'costMinimization']
  });
});

module.exports = router;
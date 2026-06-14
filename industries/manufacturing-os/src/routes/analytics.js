const express = require('express');
const router = express.Router();

// GET analytics overview
router.get('/', (req, res) => {
  res.json({
    totalProduction: 50000,
    oee: 0.82,
    qualityRate: 0.97,
    machineUtilization: 0.78,
    outputPerShift: 2500,
    revenue: {
      monthly: 2500000,
      yearly: 30000000
    },
    ordersOnTime: 0.92
  });
});

// GET production analytics
router.get('/production', (req, res) => {
  res.json({
    totalUnits: 50000,
    averageCycleTime: '45 minutes',
    throughputRate: 55,
    productionByProduct: {
      'Industrial Motor': 1000,
      'Steel Gear': 5000,
      'Control Panel': 500,
      'Hydraulic Pump': 250
    },
    efficiencyByShift: { morning: 0.85, afternoon: 0.82, night: 0.75 }
  });
});

// GET quality analytics
router.get('/quality', (req, res) => {
  res.json({
    overallQualityRate: 0.97,
    defectRate: 0.03,
    topDefects: ['surface scratch', 'dimension error', 'material flaw'],
    firstPassYield: 0.94,
    reworkRate: 0.02,
    rejectionCost: 15000
  });
});

module.exports = router;
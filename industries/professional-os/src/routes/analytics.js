const express = require('express');
const router = express.Router();

// GET analytics overview
router.get('/', (req, res) => {
  res.json({
    totalRevenue: 2500000,
    activeProjects: 15,
    billableConsultants: 12,
    utilizationRate: 0.78,
    averageProjectValue: 35000,
    pipeline: 500000
  });
});

// GET project analytics
router.get('/projects', (req, res) => {
  res.json({
    totalProjects: 45,
    activeProjects: 15,
    completedProjects: 28,
    averageProjectDuration: '4 months',
    projectSuccessRate: 0.92,
    budgetUtilization: 0.88
  });
});

// GET financial analytics
router.get('/financial', (req, res) => {
  res.json({
    totalRevenue: 2500000,
    outstandingInvoices: 150000,
    averageInvoiceValue: 20000,
    paymentCollectionRate: 0.92,
    revenueByIndustry: {
      technology: 800000,
      finance: 600000,
      healthcare: 500000,
      retail: 400000
    }
  });
});

module.exports = router;
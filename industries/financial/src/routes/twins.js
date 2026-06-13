const express = require('express');
const router = express.Router();

// Digital Twins for Financial OS

// GET all twins
router.get('/', (req, res) => {
  res.json({
    twins: ['AccountTwin', 'TransactionTwin', 'CustomerTwin', 'LoanTwin']
  });
});

// AccountTwin - account simulation
router.get('/account', (req, res) => {
  res.json({
    twinType: 'AccountTwin',
    description: 'Bank account simulation',
    state: {
      accountId: 'A001',
      customerId: 'C001',
      type: 'savings',
      balance: 50000,
      status: 'active',
      transactionVelocity: 15,
      riskScore: 0.05
    },
    operations: ['predictBalance', 'fraudDetection', 'creditScoring']
  });
});

// TransactionTwin - transaction simulation
router.get('/transaction', (req, res) => {
  res.json({
    twinType: 'TransactionTwin',
    description: 'Transaction simulation',
    state: {
      transactionId: 'T001',
      accountId: 'A001',
      type: 'credit',
      amount: 5000,
      status: 'completed',
      fraudScore: 0.02,
      velocityScore: 'normal'
    },
    operations: ['fraudDetection', 'patternAnalysis', 'riskScoring']
  });
});

// CustomerTwin - customer simulation
router.get('/customer', (req, res) => {
  res.json({
    twinType: 'CustomerTwin',
    description: 'Customer financial simulation',
    state: {
      customerId: 'C001',
      name: 'Rajesh Gupta',
      totalBalance: 65000,
      creditScore: 780,
      riskProfile: 'low',
      lifetimeValue: 250000
    },
    operations: ['creditScoring', 'churnPrediction', 'productRecommendation']
  });
});

// LoanTwin - loan simulation
router.get('/loan', (req, res) => {
  res.json({
    twinType: 'LoanTwin',
    description: 'Loan lifecycle simulation',
    state: {
      loanId: 'L001',
      customerId: 'C001',
      type: 'home',
      amount: 5000000,
      outstanding: 4500000,
      emi: 45000,
      repaymentHistory: 0.98,
      defaultProbability: 0.02
    },
    operations: ['defaultPrediction', 'riskAssessment', 'recoveryOptimization']
  });
});

module.exports = router;
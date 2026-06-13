const express = require('express');
const router = express.Router();

// GET analytics overview
router.get('/', (req, res) => {
  res.json({
    totalCustomers: 50000,
    totalAccounts: 75000,
    totalAUM: 25000000000,
    npaRatio: 0.025,
    customerGrowth: 0.15,
    averageAccountBalance: 250000
  });
});

// GET transaction analytics
router.get('/transactions', (req, res) => {
  res.json({
    totalTransactions: 5000000,
    dailyTransactions: 50000,
    totalVolume: 15000000000,
    averageTransactionSize: 3000,
    transactionTypes: {
      credit: 0.40,
      debit: 0.35,
      transfer: 0.25
    }
  });
});

// GET loan analytics
router.get('/loans', (req, res) => {
  res.json({
    totalLoans: 15000,
    totalDisbursed: 500000000,
    npaRatio: 0.025,
    loanTypes: {
      home: 0.45,
      car: 0.25,
      personal: 0.20,
      education: 0.10
    },
    averageInterestRate: 8.5,
    recoveryRate: 0.98
  });
});

module.exports = router;
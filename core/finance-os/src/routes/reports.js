import express from 'express';
import { accountRegistry, budgetRegistry } from '../index.js';

const router = express.Router();

/**
 * GET /api/reports
 * Generate financial report
 */
router.get('/', async (req, res) => {
  try {
    const { type = 'summary', industry, period } = req.query;

    let report;

    switch (type) {
      case 'income':
        report = generateIncomeStatement(industry);
        break;
      case 'balance':
        report = generateBalanceSheet(industry);
        break;
      case 'cashflow':
        report = generateCashFlow(industry);
        break;
      default:
        report = generateSummary(industry);
    }

    res.json({
      success: true,
      report: {
        ...report,
        period: period || 'current',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

function generateSummary(industry) {
  const accounts = Array.from(accountRegistry.values())
    .filter(a => !industry || a.industry === industry);

  let revenue = 0, expenses = 0, assets = 0, liabilities = 0;

  for (const account of accounts) {
    switch (account.type) {
      case 'revenue': revenue += account.balance || 0; break;
      case 'expense': expenses += account.balance || 0; break;
      case 'asset': assets += account.balance || 0; break;
      case 'liability': liabilities += account.balance || 0; break;
    }
  }

  return {
    type: 'summary',
    revenue,
    expenses,
    netIncome: revenue - expenses,
    assets,
    liabilities,
    netWorth: assets - liabilities
  };
}

function generateIncomeStatement(industry) {
  const summary = generateSummary(industry);
  return {
    type: 'income_statement',
    revenue: summary.revenue,
    expenses: summary.expenses,
    netIncome: summary.netIncome,
    margins: {
      gross: summary.revenue > 0
        ? ((summary.revenue - summary.expenses * 0.6) / summary.revenue * 100).toFixed(2)
        : 0,
      net: summary.revenue > 0
        ? (summary.netIncome / summary.revenue * 100).toFixed(2)
        : 0
    }
  };
}

function generateBalanceSheet(industry) {
  const summary = generateSummary(industry);
  return {
    type: 'balance_sheet',
    assets: summary.assets,
    liabilities: summary.liabilities,
    equity: summary.assets - summary.liabilities,
    debtRatio: summary.assets > 0
      ? (summary.liabilities / summary.assets * 100).toFixed(2)
      : 0
  };
}

function generateCashFlow(industry) {
  const summary = generateSummary(industry);
  return {
    type: 'cash_flow',
    operatingCash: summary.netIncome,
    investingCash: -summary.netIncome * 0.2,
    financingCash: 0,
    netCashFlow: summary.netIncome * 0.8
  };
}

export default router;

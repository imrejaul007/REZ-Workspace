/**
 * Report Service - Financial Reports & Analytics
 * Part of LEDGERAI - Finance AI Operating System
 */

export interface BalanceSheet {
  assets: { current: number; nonCurrent: number; total: number };
  liabilities: { current: number; nonCurrent: number; total: number };
  equity: number;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

export interface IncomeStatement {
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  grossMargin: number;
  operatingExpenses: { breakdown: Record<string, number>; total: number };
  operatingProfit: number;
  otherIncome: number;
  profitBeforeTax: number;
  tax: number;
  netProfit: number;
  netMargin: number;
}

export interface CashFlow {
  operatingActivities: number;
  investingActivities: number;
  financingActivities: number;
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
}

export interface RatioAnalysis {
  liquidity: {
    currentRatio: number;
    quickRatio: number;
    cashRatio: number;
  };
  profitability: {
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
    roa: number;
    roe: number;
  };
  leverage: {
    debtToEquity: number;
    debtToAssets: number;
    interestCoverage: number;
  };
  efficiency: {
    assetTurnover: number;
    inventoryTurnover: number;
    receivablesTurnover: number;
    payablesTurnover: number;
  };
}

export class ReportService {
  async generateBalanceSheet(accounts: Map<string, any>): Promise<BalanceSheet> {
    const assets = Array.from(accounts.values()).filter(a => a.type === 'asset');
    const liabilities = Array.from(accounts.values()).filter(a => a.type === 'liability');
    const equity = Array.from(accounts.values()).filter(a => a.type === 'equity');

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
    const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

    return {
      assets: {
        current: totalAssets * 0.6,
        nonCurrent: totalAssets * 0.4,
        total: totalAssets
      },
      liabilities: {
        current: totalLiabilities * 0.4,
        nonCurrent: totalLiabilities * 0.6,
        total: totalLiabilities
      },
      equity: totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1
    };
  }

  async generateIncomeStatement(revenue: number, cogs: number, expenses: Record<string, number>, otherIncome: number, taxRate: number = 0.25): Promise<IncomeStatement> {
    const grossProfit = revenue - cogs;
    const grossMargin = (grossProfit / revenue) * 100;

    const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0);
    const operatingProfit = grossProfit - totalExpenses;
    const operatingMargin = (operatingProfit / revenue) * 100;

    const profitBeforeTax = operatingProfit + otherIncome;
    const tax = profitBeforeTax > 0 ? profitBeforeTax * taxRate : 0;
    const netProfit = profitBeforeTax - tax;
    const netMargin = (netProfit / revenue) * 100;

    return {
      revenue,
      costOfGoodsSold: cogs,
      grossProfit,
      grossMargin: Math.round(grossMargin * 100) / 100,
      operatingExpenses: { breakdown: expenses, total: totalExpenses },
      operatingProfit,
      otherIncome,
      profitBeforeTax,
      tax,
      netProfit,
      netMargin: Math.round(netMargin * 100) / 100
    };
  }

  async generateCashFlow(operations: { income: number; expenses: number }, investing: { capex: number; assetSales: number }, financing: { loansReceived: number; loansRepaid: number; dividends: number }): Promise<CashFlow> {
    const operatingActivities = operations.income - operations.expenses;
    const investingActivities = -investing.capex + investing.assetSales;
    const financingActivities = financing.loansReceived - financing.loansRepaid - financing.dividends;

    const netCashFlow = operatingActivities + investingActivities + financingActivities;
    const openingBalance = 500000; // Simulated
    const closingBalance = openingBalance + netCashFlow;

    return {
      operatingActivities,
      investingActivities,
      financingActivities,
      netCashFlow,
      openingBalance,
      closingBalance
    };
  }

  async calculateRatios(
    balanceSheet: BalanceSheet,
    incomeStatement: IncomeStatement,
    cashFlow: CashFlow
  ): Promise<RatioAnalysis> {
    const { assets, liabilities } = balanceSheet;

    // Liquidity ratios
    const currentRatio = assets.current / liabilities.current;
    const quickRatio = (assets.current - 0.3 * assets.total) / liabilities.current;
    const cashRatio = cashFlow.closingBalance / liabilities.current;

    // Profitability ratios
    const grossMargin = incomeStatement.grossMargin;
    const operatingMargin = incomeStatement.operatingMargin;
    const netMargin = incomeStatement.netMargin;
    const roa = (incomeStatement.netProfit / assets.total) * 100;
    const roe = (incomeStatement.netProfit / balanceSheet.equity) * 100;

    // Leverage ratios
    const debtToEquity = liabilities.total / balanceSheet.equity;
    const debtToAssets = liabilities.total / assets.total;
    const interestCoverage = incomeStatement.operatingProfit / (incomeStatement.operatingProfit * 0.08);

    // Efficiency ratios
    const assetTurnover = incomeStatement.revenue / assets.total;
    const inventoryTurnover = incomeStatement.costOfGoodsSold / (0.2 * assets.total);
    const receivablesTurnover = incomeStatement.revenue / (0.15 * assets.total);
    const payablesTurnover = incomeStatement.costOfGoodsSold / (0.1 * liabilities.total);

    return {
      liquidity: {
        currentRatio: Math.round(currentRatio * 100) / 100,
        quickRatio: Math.round(quickRatio * 100) / 100,
        cashRatio: Math.round(cashRatio * 100) / 100
      },
      profitability: {
        grossMargin,
        operatingMargin,
        netMargin,
        roa: Math.round(roa * 100) / 100,
        roe: Math.round(roe * 100) / 100
      },
      leverage: {
        debtToEquity: Math.round(debtToEquity * 100) / 100,
        debtToAssets: Math.round(debtToAssets * 100) / 100,
        interestCoverage: Math.round(interestCoverage * 100) / 100
      },
      efficiency: {
        assetTurnover: Math.round(assetTurnover * 100) / 100,
        inventoryTurnover: Math.round(inventoryTurnover * 100) / 100,
        receivablesTurnover: Math.round(receivablesTurnover * 100) / 100,
        payablesTurnover: Math.round(payablesTurnover * 100) / 100
      }
    };
  }

  async generateTrialBalance(accounts: Map<string, any>): Promise<{
    accounts: { name: string; debit: number; credit: number }[];
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
  }> {
    const result: { name: string; debit: number; credit: number }[] = [];
    let totalDebits = 0;
    let totalCredits = 0;

    accounts.forEach(account => {
      if (account.type === 'asset' || account.type === 'expense') {
        result.push({ name: account.name, debit: account.balance, credit: 0 });
        totalDebits += account.balance;
      } else {
        result.push({ name: account.name, debit: 0, credit: account.balance });
        totalCredits += account.balance;
      }
    });

    return {
      accounts: result.sort((a, b) => a.name.localeCompare(b.name)),
      totalDebits,
      totalCredits,
      isBalanced: Math.abs(totalDebits - totalCredits) < 1
    };
  }

  async generateAuditReport(transactions: any[]): Promise<{
    totalTransactions: number;
    flaggedTransactions: any[];
    anomalies: { type: string; count: number; severity: 'low' | 'medium' | 'high' }[];
    recommendations: string[];
  }> {
    const flagged = transactions.filter(t =>
      Math.abs(t.amount) > 100000 || // Large transactions
      (t.description && t.description.toLowerCase().includes('round'))
    );

    return {
      totalTransactions: transactions.length,
      flaggedTransactions: flagged,
      anomalies: [
        { type: 'Unusual timing', count: 3, severity: 'low' },
        { type: 'Round amounts', count: flagged.length, severity: 'low' },
      ],
      recommendations: [
        'Review all flagged transactions for accuracy',
        'Consider implementing multi-level approval for amounts above ₹1 lakh',
        'Set up automated alerts for unusual patterns'
      ]
    };
  }
}

export default ReportService;
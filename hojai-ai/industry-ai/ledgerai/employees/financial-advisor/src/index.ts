/**
 * Financial Advisor AI
 * LEDGERAI - Accounting AI Operating System
 * Port: 4892
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  monthlyContribution: number;
  expectedReturn: number;
}

export interface InvestmentRecommendation {
  type: string;
  allocation: number;
  expectedReturn: number;
  riskLevel: 'low' | 'medium' | 'high';
  rationale: string;
}

class FinancialAdvisor {
  async analyzeCashFlow(income: number, expenses: { category: string; amount: number }[]): Promise<{
    totalIncome: number;
    totalExpenses: number;
    savings: number;
    savingsRate: number;
    recommendations: string[];
  }> {
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const savings = income - totalExpenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    const recommendations: string[] = [];

    const expenseCategories = expenses.filter(e => e.amount > income * 0.3);
    if (expenseCategories.length > 0) {
      recommendations.push(`Consider reducing ${expenseCategories[0].category} expenses`);
    }

    if (savingsRate < 20) {
      recommendations.push('Aim to save at least 20% of your income');
      recommendations.push('Consider automated savings transfers');
    }

    if (savingsRate > 50) {
      recommendations.push('Great savings rate! Consider investing the surplus');
    }

    return {
      totalIncome: income,
      totalExpenses,
      savings,
      savingsRate: Math.round(savingsRate * 100) / 100,
      recommendations,
    };
  }

  async suggestInvestments(
    amount: number,
    riskAppetite: 'conservative' | 'moderate' | 'aggressive',
    goal: string
  ): Promise<InvestmentRecommendation[]> {
    const allocations = {
      conservative: [
        { type: 'Fixed Deposits', allocation: 40, expectedReturn: 7, riskLevel: 'low' as const },
        { type: 'Debt Mutual Funds', allocation: 30, expectedReturn: 8, riskLevel: 'low' as const },
        { type: 'Public Provident Fund', allocation: 20, expectedReturn: 8.2, riskLevel: 'low' as const },
        { type: 'Savings Account', allocation: 10, expectedReturn: 4, riskLevel: 'low' as const },
      ],
      moderate: [
        { type: 'Index Funds', allocation: 35, expectedReturn: 12, riskLevel: 'medium' as const },
        { type: 'Balanced Mutual Funds', allocation: 25, expectedReturn: 10, riskLevel: 'medium' as const },
        { type: 'Corporate Bonds', allocation: 20, expectedReturn: 9, riskLevel: 'low' as const },
        { type: 'Fixed Deposits', allocation: 10, expectedReturn: 7, riskLevel: 'low' as const },
        { type: 'Gold ETF', allocation: 10, expectedReturn: 10, riskLevel: 'medium' as const },
      ],
      aggressive: [
        { type: 'Small Cap Equity', allocation: 30, expectedReturn: 18, riskLevel: 'high' as const },
        { type: 'Mid Cap Equity', allocation: 25, expectedReturn: 15, riskLevel: 'high' as const },
        { type: 'Sector Funds', allocation: 15, expectedReturn: 14, riskLevel: 'high' as const },
        { type: 'Index Funds', allocation: 20, expectedReturn: 12, riskLevel: 'medium' as const },
        { type: 'International Equity', allocation: 10, expectedReturn: 12, riskLevel: 'medium' as const },
      ],
    };

    return allocations[riskAppetite].map(a => ({
      ...a,
      amount: Math.round(amount * a.allocation / 100),
      rationale: this.getRationale(a.type, goal),
    }));
  }

  private getRationale(type: string, goal: string): string {
    const rationales: Record<string, Record<string, string>> = {
      'Fixed Deposits': {
        default: 'Safe investment with guaranteed returns',
        retirement: 'Capital protection for retirement corpus',
        wealth: 'Stable foundation for wealth building',
      },
      'Index Funds': {
        default: 'Diversified market exposure with low fees',
        retirement: 'Long-term growth for retirement',
        wealth: 'Core holding for wealth accumulation',
      },
      'Small Cap Equity': {
        default: 'High growth potential with higher risk',
        retirement: 'Not recommended for short-term retirement',
        wealth: 'Aggressive growth component',
      },
    };

    return rationales[type]?.[goal] || rationales[type]?.default || 'Diversified investment option';
  }

  async calculateEMI(principal: number, rate: number, tenure: number): Promise<{
    emi: number;
    totalInterest: number;
    totalPayment: number;
    amortization: { month: number; principal: number; interest: number; balance: number }[];
  }> {
    const monthlyRate = rate / 12 / 100;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenure) / (Math.pow(1 + monthlyRate, tenure) - 1);

    const totalPayment = emi * tenure;
    const totalInterest = totalPayment - principal;

    const amortization: { month: number; principal: number; interest: number; balance: number }[] = [];
    let balance = principal;

    for (let month = 1; month <= tenure; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = emi - interestPayment;
      balance -= principalPayment;

      amortization.push({
        month,
        principal: Math.round(principalPayment),
        interest: Math.round(interestPayment),
        balance: Math.round(Math.max(0, balance)),
      });
    }

    return {
      emi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayment: Math.round(totalPayment),
      amortization,
    };
  }

  async setGoal(
    name: string,
    targetAmount: number,
    currentAmount: number,
    deadline: string
  ): Promise<FinancialGoal> {
    const months = Math.ceil((new Date(deadline).getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000));
    const remaining = targetAmount - currentAmount;
    const monthlyContribution = remaining / months;
    const expectedReturn = 10; // Average expected return

    return {
      id: uuidv4(),
      name,
      targetAmount,
      currentAmount,
      deadline,
      monthlyContribution: Math.round(monthlyContribution),
      expectedReturn,
    };
  }

  async getNetWorth(assets: { name: string; value: number }[], liabilities: { name: string; value: number }[]): Promise<{
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    assetBreakdown: { category: string; value: number; percentage: number }[];
    healthScore: number;
  }> {
    const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.value, 0);
    const netWorth = totalAssets - totalLiabilities;

    // Categorize assets
    const assetBreakdown = [
      { category: 'Liquid', value: assets.filter(a => ['Cash', 'Savings', 'Bank'].some(t => a.name.includes(t))).reduce((sum, a) => sum + a.value, 0), percentage: 0 },
      { category: 'Investments', value: assets.filter(a => ['MF', 'FD', 'Share', 'Bond', 'PPF'].some(t => a.name.includes(t))).reduce((sum, a) => sum + a.value, 0), percentage: 0 },
      { category: 'Property', value: assets.filter(a => ['Property', 'House', 'Land', 'Vehicle'].some(t => a.name.includes(t))).reduce((sum, a) => sum + a.value, 0), percentage: 0 },
      { category: 'Other', value: assets.reduce((sum, a) => sum + a.value, 0) - (totalAssets - totalLiabilities + totalLiabilities), percentage: 0 },
    ].map(a => ({ ...a, percentage: totalAssets > 0 ? Math.round((a.value / totalAssets) * 100) : 0 }));

    // Calculate health score (debt to asset ratio)
    const debtRatio = totalLiabilities / totalAssets;
    let healthScore = 100;
    if (debtRatio > 0.5) healthScore = 40;
    else if (debtRatio > 0.3) healthScore = 60;
    else if (debtRatio > 0.2) healthScore = 80;

    return {
      totalAssets,
      totalLiabilities,
      netWorth,
      assetBreakdown,
      healthScore,
    };
  }
}

const financialAdvisor = new FinancialAdvisor();

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'ledgerai-financial-advisor', port: 4892 });
});

app.post('/api/finance/cashflow', async (req: Request, res: Response) => {
  try {
    const { income, expenses } = req.body;
    const analysis = await financialAdvisor.analyzeCashFlow(income, expenses);
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze cash flow' });
  }
});

app.post('/api/finance/invest', async (req: Request, res: Response) => {
  try {
    const { amount, riskAppetite, goal } = req.body;
    const recommendations = await financialAdvisor.suggestInvestments(amount, riskAppetite, goal);
    res.json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

app.get('/api/finance/emi', async (req: Request, res: Response) => {
  try {
    const principal = parseFloat(req.query.principal as string) || 1000000;
    const rate = parseFloat(req.query.rate as string) || 8.5;
    const tenure = parseInt(req.query.tenure as string) || 60;
    const emi = await financialAdvisor.calculateEMI(principal, rate, tenure);
    res.json({ success: true, emi });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate EMI' });
  }
});

app.post('/api/finance/goal', async (req: Request, res: Response) => {
  try {
    const { name, targetAmount, currentAmount, deadline } = req.body;
    const goal = await financialAdvisor.setGoal(name, targetAmount, currentAmount, deadline);
    res.json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ error: 'Failed to set goal' });
  }
});

app.post('/api/finance/networth', async (req: Request, res: Response) => {
  try {
    const { assets, liabilities } = req.body;
    const netWorth = await financialAdvisor.getNetWorth(assets, liabilities);
    res.json({ success: true, ...netWorth });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate net worth' });
  }
});

const PORT = 4892;
app.listen(PORT, () => {
  console.log(`💰 Financial Advisor running on port ${PORT}`);
  console.log(`📊 LEDGERAI - Accounting AI Operating System`);
});

export default app;
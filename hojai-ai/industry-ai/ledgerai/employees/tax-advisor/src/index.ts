/**
 * Tax Advisor AI Agent
 * LEDGERAI - Accounting AI Operating System
 * Port: 4890
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

export interface TaxScenario {
  id: string;
  name: string;
  taxRegime: 'new' | 'old';
  grossIncome: number;
  deductions: { section: string; amount: number }[];
  taxSlab: { min: number; max: number; rate: number; cess: number }[];
  taxLiability: number;
  effectiveRate: number;
}

export interface TaxSavingSuggestion {
  section: string;
  currentDeduction: number;
  maxDeduction: number;
  potentialSaving: number;
  recommendations: string[];
}

class TaxAdvisor {
  private taxSlabs = {
    new: [
      { min: 0, max: 300000, rate: 0, cess: 4 },
      { min: 300000, max: 600000, rate: 5, cess: 4 },
      { min: 600000, max: 900000, rate: 10, cess: 4 },
      { min: 900000, max: 1200000, rate: 15, cess: 4 },
      { min: 1200000, max: 1500000, rate: 20, cess: 4 },
      { min: 1500000, max: Infinity, rate: 30, cess: 4 },
    ],
    old: [
      { min: 0, max: 250000, rate: 0, cess: 4 },
      { min: 250000, max: 500000, rate: 5, cess: 4 },
      { min: 500000, max: 1000000, rate: 20, cess: 4 },
      { min: 1000000, max: Infinity, rate: 30, cess: 4 },
    ]
  };

  async analyzeTax(regime: 'new' | 'old', grossIncome: number, deductions: { section: string; amount: number }[]): Promise<TaxScenario> {
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const taxableIncome = Math.max(0, grossIncome - totalDeductions);

    let taxLiability = 0;
    let remainingIncome = taxableIncome;

    for (const slab of this.taxSlabs[regime]) {
      if (remainingIncome <= 0) break;
      const slabIncome = Math.min(remainingIncome, slab.max - slab.min);
      if (slabIncome > 0) {
        taxLiability += slabIncome * (slab.rate / 100);
        remainingIncome -= slabIncome;
      }
    }

    const cess = taxLiability * (slab.cess / 100);
    taxLiability += cess;

    return {
      id: uuidv4(),
      name: `Tax Analysis - ${regime.toUpperCase()} Regime`,
      taxRegime: regime,
      grossIncome,
      deductions,
      taxSlab: this.taxSlabs[regime],
      taxLiability: Math.round(taxLiability),
      effectiveRate: grossIncome > 0 ? Math.round((taxLiability / grossIncome) * 10000) / 100 : 0,
    };
  }

  async suggestTaxSavings(income: number, currentDeductions: Map<string, number>): Promise<TaxSavingSuggestion[]> {
    const suggestions: TaxSavingSuggestion[] = [];

    const sections: { section: string; maxLimit: number; description: string; examples: string[] }[] = [
      { section: '80C', maxLimit: 150000, description: 'Life insurance, PPF, ELSS, home loan principal', examples: ['PPF contributions', 'ELSS mutual funds', 'Life insurance premium', 'Home loan principal'] },
      { section: '80D', maxLimit: 100000, description: 'Health insurance premiums', examples: ['Self health insurance', 'Family health insurance', 'Parents health insurance'] },
      { section: '80CCD(1B)', maxLimit: 50000, description: 'NPS additional contribution', examples: ['NPS tier-1 account', 'Additional NPS contribution'] },
      { section: '80E', maxLimit: Infinity, description: 'Education loan interest', examples: ['Higher education loan interest'] },
      { section: '80G', maxLimit: Infinity, description: 'Donations to charitable organizations', examples: ['Registered NGO donations', 'PM Relief Fund'] },
      { section: '80TTA', maxLimit: 10000, description: 'Savings account interest', examples: ['Interest from savings account'] },
      { section: 'HRA', maxLimit: Infinity, description: 'House Rent Allowance exemption', examples: ['Rent payments', 'HRA component in salary'] },
    ];

    for (const s of sections) {
      const current = currentDeductions.get(s.section) || 0;
      const potential = Math.min(s.maxLimit, income * 0.1);
      const remaining = s.maxLimit - current;

      if (remaining > 0) {
        const potentialSaving = remaining * 0.3; // Assuming 30% tax bracket
        suggestions.push({
          section: s.section,
          currentDeduction: current,
          maxDeduction: s.maxLimit,
          potentialSaving: Math.round(potentialSaving),
          recommendations: s.examples,
        });
      }
    }

    return suggestions.sort((a, b) => b.potentialSaving - a.potentialSaving);
  }

  async calculateTDS(grossIncome: number, regime: 'new' | 'old'): Promise<{ monthly: number; annual: number; rate: number }> {
    const scenario = await this.analyzeTax(regime, grossIncome, []);
    return {
      monthly: Math.round(scenario.taxLiability / 12),
      annual: scenario.taxLiability,
      rate: scenario.effectiveRate,
    };
  }

  async generateTaxCalendar(year: number): Promise<{ dueDate: string; task: string; penalty: string }[]> {
    return [
      { dueDate: `${year}-04-30`, task: 'Q4 Advance Tax', penalty: 'Interest @1% per month' },
      { dueDate: `${year}-06-15`, task: 'Q1 Advance Tax', penalty: 'Interest @1% per month' },
      { dueDate: `${year}-09-15`, task: 'Q2 Advance Tax', penalty: 'Interest @1% per month' },
      { dueDate: `${year}-12-15`, task: 'Q3 Advance Tax', penalty: 'Interest @1% per month' },
      { dueDate: `${year + 1}-07-31`, task: 'Income Tax Return Filing', penalty: '₹5000 late fee' },
      { dueDate: `${year + 1}-10-31`, task: 'Tax Audit Report Filing', penalty: '₹150000 for non-filing' },
    ];
  }
}

const taxAdvisor = new TaxAdvisor();

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'ledgerai-tax-advisor', port: 4890 });
});

app.post('/api/tax/analyze', async (req: Request, res: Response) => {
  try {
    const { regime, grossIncome, deductions } = req.body;
    const result = await taxAdvisor.analyzeTax(regime, grossIncome, deductions || []);
    res.json({ success: true, analysis: result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze tax' });
  }
});

app.post('/api/tax/suggestions', async (req: Request, res: Response) => {
  try {
    const { income, currentDeductions } = req.body;
    const deductionsMap = new Map(Object.entries(currentDeductions || {}));
    const suggestions = await taxAdvisor.suggestTaxSavings(income, deductionsMap);
    res.json({ success: true, suggestions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

app.get('/api/tds/calculate', async (req: Request, res: Response) => {
  try {
    const grossIncome = parseFloat(req.query.income as string) || 0;
    const regime = (req.query.regime as 'new' | 'old') || 'new';
    const tds = await taxAdvisor.calculateTDS(grossIncome, regime);
    res.json({ success: true, tds });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate TDS' });
  }
});

app.get('/api/tax/calendar', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const calendar = await taxAdvisor.generateTaxCalendar(year);
    res.json({ success: true, calendar });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate calendar' });
  }
});

const PORT = 4890;
app.listen(PORT, () => {
  console.log(`🧾 Tax Advisor AI running on port ${PORT}`);
  console.log(`📊 LEDGERAI - Accounting AI Operating System`);
});

export default app;
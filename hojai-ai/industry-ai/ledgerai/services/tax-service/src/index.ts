/**
 * Tax Service - Tax Compliance & Planning
 * Part of LEDGERAI - Finance AI Operating System
 */

export interface TaxSlab {
  min: number;
  max: number;
  rate: number;
  description: string;
}

export interface TaxCalculation {
  year: number;
  regime: 'old' | 'new';
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  breakdown: {
    incomeTax: number;
    cess: number;
    totalTax: number;
    effectiveRate: number;
  };
  slabApplied: TaxSlab[];
  message: string;
}

export interface TDSEntry {
  id: string;
  pan: string;
  name: string;
  amount: number;
  rate: number;
  tan: string;
  quarter: string;
  status: 'due' | 'deposited' | 'challanGenerated';
  dueDate: string;
  depositedDate?: string;
  challanNumber?: string;
}

export interface GSTReturn {
  id: string;
  returnType: 'GSTR-1' | 'GSTR-3B' | 'GSTR-4' | 'GSTR-9';
  period: string;
  sales: {
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
  };
  purchases: {
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
  };
  itc: {
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  };
  netTax: number;
  status: 'draft' | 'filed' | 'pending';
  filedAt?: string;
}

export class TaxService {
  // Old regime tax slabs (FY 2024-25)
  private readonly oldRegimeSlabs: TaxSlab[] = [
    { min: 0, max: 300000, rate: 0, description: 'No tax (up to ₹3 lakh)' },
    { min: 300001, max: 600000, rate: 0.05, description: '5% (₹3-6 lakh)' },
    { min: 600001, max: 900000, rate: 0.10, description: '10% (₹6-9 lakh)' },
    { min: 900001, max: 1200000, rate: 0.15, description: '15% (₹9-12 lakh)' },
    { min: 1200001, max: 1500000, rate: 0.20, description: '20% (₹12-15 lakh)' },
    { min: 1500001, max: Infinity, rate: 0.30, description: '30% (above ₹15 lakh)' },
  ];

  // New regime tax slabs (FY 2024-25)
  private readonly newRegimeSlabs: TaxSlab[] = [
    { min: 0, max: 300000, rate: 0, description: 'No tax (up to ₹3 lakh)' },
    { min: 300001, max: 700000, rate: 0.05, description: '5% (₹3-7 lakh)' },
    { min: 700001, max: 1000000, rate: 0.10, description: '10% (₹7-10 lakh)' },
    { min: 1000001, max: 1200000, rate: 0.15, description: '15% (₹10-12 lakh)' },
    { min: 1200001, max: 1500000, rate: 0.20, description: '20% (₹12-15 lakh)' },
    { min: 1500001, max: Infinity, rate: 0.30, description: '30% (above ₹15 lakh)' },
  ];

  async calculateIncomeTax(
    grossIncome: number,
    deductions: { section80C?: number; section80D?: number; hra?: number; standardDeduction?: number; other?: number },
    regime: 'old' | 'new' = 'old'
  ): Promise<TaxCalculation> {
    const slabs = regime === 'old' ? this.oldRegimeSlabs : this.newRegimeSlabs;

    // Calculate total deductions
    const totalDeductions = (regime === 'old' ? (deductions.section80C || 0) + (deductions.section80D || 0) + (deductions.hra || 0) : 0)
      + (deductions.standardDeduction || 50000);

    const taxableIncome = Math.max(0, grossIncome - totalDeductions);

    // Calculate tax using progressive slabs
    let incomeTax = 0;
    let remainingIncome = taxableIncome;
    const slabsApplied: TaxSlab[] = [];

    for (const slab of slabs) {
      if (remainingIncome <= 0) break;

      const slabIncome = Math.min(remainingIncome, slab.max - slab.min);
      if (slabIncome > 0) {
        incomeTax += slabIncome * slab.rate;
        slabsApplied.push({ ...slab, max: Math.min(slab.max, remainingIncome) });
        remainingIncome -= slabIncome;
      }
    }

    // Rebate under 87A for income up to ₹7 lakh (new regime)
    if (regime === 'new' && taxableIncome <= 700000) {
      incomeTax = 0;
    }

    // Health & Education Cess (4%)
    const cess = incomeTax * 0.04;
    const totalTax = incomeTax + cess;
    const effectiveRate = taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0;

    return {
      year: 2025,
      regime,
      grossIncome,
      totalDeductions,
      taxableIncome,
      breakdown: {
        incomeTax: Math.round(incomeTax),
        cess: Math.round(cess),
        totalTax: Math.round(totalTax),
        effectiveRate: Math.round(effectiveRate * 100) / 100
      },
      slabApplied: slabsApplied.filter(s => s.rate > 0),
      message: `Estimated tax liability: ₹${Math.round(totalTax).toLocaleString('en-IN')} (Effective rate: ${effectiveRate.toFixed(2)}%)`
    };
  }

  async getTDSEntries(pan?: string): Promise<TDSEntry[]> {
    // Simulated TDS entries
    return [
      {
        id: '1',
        pan: 'ABCDE1234F',
        name: 'Rahul Sharma',
        amount: 102000,
        rate: 10,
        tan: 'DELH12345A',
        quarter: 'Q1 FY 24-25',
        status: 'deposited',
        dueDate: '2024-07-15',
        depositedDate: '2024-07-10',
        challanNumber: 'CHAL123456'
      },
      {
        id: '2',
        pan: 'FGHIJ5678K',
        name: 'Priya Patel',
        amount: 114000,
        rate: 10,
        tan: 'DELH12345A',
        quarter: 'Q1 FY 24-25',
        status: 'due',
        dueDate: '2024-07-15'
      }
    ].filter(e => !pan || e.pan === pan);
  }

  async calculateTDS(amount: number, nature: 'salary' | 'contract' | 'professional' | 'rent' | 'dividend'): Promise<{
    amount: number;
    tdsRate: number;
    tdsAmount: number;
    section: string;
  }> {
    const rates: Record<string, number> = {
      'salary': 0.10,
      'contract': 0.02,
      'professional': 0.10,
      'rent': 0.20,
      'dividend': 0.10
    };

    const sections: Record<string, string> = {
      'salary': '192',
      'contract': '194C',
      'professional': '194J',
      'rent': '194I',
      'dividend': '194'
    };

    return {
      amount,
      tdsRate: rates[nature],
      tdsAmount: Math.round(amount * rates[nature]),
      section: sections[nature]
    };
  }

  async generateGSTReturn(period: string, sales: { taxableAmount: number; cgst: number; sgst: number; igst: number }, purchases: { taxableAmount: number; cgst: number; sgst: number; igst: number }): Promise<GSTReturn> {
    const totalOutputTax = sales.cgst + sales.sgst + sales.igst;
    const totalInputTax = purchases.cgst + purchases.sgst + purchases.igst;
    const netTax = totalOutputTax - totalInputTax;

    return {
      id: `GST-${period}`,
      returnType: 'GSTR-3B',
      period,
      sales: {
        taxableAmount: sales.taxableAmount,
        cgst: sales.cgst,
        sgst: sales.sgst,
        igst: sales.igst,
        totalTax: totalOutputTax
      },
      purchases: {
        taxableAmount: purchases.taxableAmount,
        cgst: purchases.cgst,
        sgst: purchases.sgst,
        igst: purchases.igst,
        totalTax: totalInputTax
      },
      itc: {
        cgst: purchases.cgst,
        sgst: purchases.sgst,
        igst: purchases.igst,
        total: totalInputTax
      },
      netTax: Math.max(0, netTax),
      status: 'draft'
    };
  }

  async getDueDates(year: number = new Date().getFullYear()): Promise<{ type: string; dueDate: string; description: string }[]> {
    return [
      { type: 'GST', dueDate: `${year}-01-20`, description: 'GSTR-3B for December' },
      { type: 'TDS', dueDate: `${year}-01-31`, description: 'TDS deposit Q3' },
      { type: 'GST', dueDate: `${year}-02-20`, description: 'GSTR-3B for January' },
      { type: 'Income Tax', dueDate: `${year}-03-15`, description: 'Tax-saving investments deadline' },
      { type: 'TDS', dueDate: `${year}-05-31`, description: 'TDS certificate Q4' },
      { type: 'GST', dueDate: `${year}-04-20`, description: 'GSTR-1 for March' },
    ];
  }

  async compareRegimes(grossIncome: number, deductions: number): Promise<{
    oldRegime: TaxCalculation;
    newRegime: TaxCalculation;
    recommendation: string;
    savings: number;
  }> {
    const oldRegime = await this.calculateIncomeTax(grossIncome, { standardDeduction: 50000 }, 'old');
    const newRegime = await this.calculateIncomeTax(grossIncome, { standardDeduction: 75000 }, 'new');

    const savings = oldRegime.breakdown.totalTax - newRegime.breakdown.totalTax;

    return {
      oldRegime,
      newRegime,
      recommendation: savings > 0
        ? `New regime saves ₹${Math.abs(savings).toLocaleString('en-IN')}. Switch to new regime.`
        : `Old regime saves ₹${Math.abs(savings).toLocaleString('en-IN')}. Stay with old regime.`,
      savings
    };
  }
}

export default TaxService;
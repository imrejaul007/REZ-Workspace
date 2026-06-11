/**
 * Payroll AI Agent
 * LEDGERAI - Accounting AI Operating System
 * Port: 4893
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  basicSalary: number;
  hra: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  bankAccount: string;
  pan: string;
  uan: string;
  esic: string;
}

export interface SalarySlip {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  earnings: { description: string; amount: number }[];
  grossSalary: number;
  deductions: { description: string; amount: number }[];
  netSalary: number;
  pfContribution: number;
  esicContribution: number;
  tds: number;
}

class PayrollAI {
  private employees: Map<string, Employee> = new Map();
  private salarySlips: Map<string, SalarySlip[]> = new Map();

  async addEmployee(employeeData: Omit<Employee, 'id'>): Promise<Employee> {
    const employee: Employee = { ...employeeData, id: uuidv4() };
    this.employees.set(employee.id, employee);
    return employee;
  }

  async calculateSalary(
    employeeId: string,
    month: number,
    year: number,
    attendance: { worked: number; lop: number; leaves: number }
  ): Promise<SalarySlip> {
    const employee = this.employees.get(employeeId);
    if (!employee) throw new Error('Employee not found');

    const earnings = [
      { description: 'Basic Salary', amount: employee.basicSalary },
      { description: 'HRA', amount: employee.hra },
      ...employee.allowances.map(a => ({ description: a.name, amount: a.amount })),
    ];

    const grossSalary = earnings.reduce((sum, e) => sum + e.amount, 0);
    const perDaySalary = grossSalary / 26;
    const lopDeduction = perDaySalary * attendance.lop;
    const adjustedGross = grossSalary - lopDeduction;

    // PF calculation (12% of basic)
    const pfContribution = Math.min(employee.basicSalary * 0.12, 1800);

    // ESIC calculation (0.75% of gross)
    const esicContribution = adjustedGross > 21000 ? 0 : adjustedGross * 0.0075;

    // TDS calculation
    const annualIncome = adjustedGross * 12;
    let tds = 0;
    if (annualIncome > 500000) {
      const taxableIncome = annualIncome - 500000;
      if (taxableIncome <= 500000) tds = taxableIncome * 0.2 / 12;
      else tds = (500000 * 0.2 + (taxableIncome - 500000) * 0.3) / 12;
    }

    const totalDeductions = pfContribution + esicContribution + tds + lopDeduction;

    const deductions = [
      { description: 'Provident Fund', amount: pfContribution },
      { description: 'ESIC', amount: esicContribution },
      { description: 'TDS', amount: Math.round(tds) },
      { description: 'Loss of Pay', amount: Math.round(lopDeduction) },
      ...employee.deductions.map(d => ({ description: d.name, amount: d.amount })),
    ];

    const slip: SalarySlip = {
      id: uuidv4(),
      employeeId,
      employeeName: employee.name,
      month: `${month}`,
      year,
      earnings,
      grossSalary: adjustedGross,
      deductions,
      netSalary: adjustedGross - totalDeductions,
      pfContribution: Math.round(pfContribution),
      esicContribution: Math.round(esicContribution),
      tds: Math.round(tds),
    };

    // Store slip
    const key = `${employeeId}-${year}`;
    if (!this.salarySlips.has(key)) {
      this.salarySlips.set(key, []);
    }
    this.salarySlips.get(key)!.push(slip);

    return slip;
  }

  async generatePayrollRegister(month: number, year: number): Promise<{
    employees: { name: string; department: string; gross: number; net: number; pf: number; esic: number; tds: number }[];
    totals: { gross: number; net: number; pf: number; esic: number; tds: number; contributions: number };
  }> {
    const register: { name: string; department: string; gross: number; net: number; pf: number; esic: number; tds: number }[] = [];
    let totals = { gross: 0, net: 0, pf: 0, esic: 0, tds: 0, contributions: 0 };

    for (const [id, employee] of this.employees) {
      try {
        const slip = await this.calculateSalary(id, month, year, { worked: 26, lop: 0, leaves: 0 });
        register.push({
          name: employee.name,
          department: employee.department,
          gross: slip.grossSalary,
          net: slip.netSalary,
          pf: slip.pfContribution,
          esic: slip.esicContribution,
          tds: slip.tds,
        });

        totals.gross += slip.grossSalary;
        totals.net += slip.netSalary;
        totals.pf += slip.pfContribution;
        totals.esic += slip.esicContribution;
        totals.tds += slip.tds;
        totals.contributions += slip.pfContribution + slip.esicContribution;
      } catch (error) {
        console.error(`Failed to process ${employee.name}:`, error);
      }
    }

    return { employees: register, totals };
  }

  async calculateReimbursement(
    employeeId: string,
    claims: { type: string; amount: number; date: string; remarks: string }[]
  ): Promise<{ approved: number; pending: number; rejected: number; details: { type: string; amount: number; status: string }[] }> {
    const employee = this.employees.get(employeeId);
    if (!employee) throw new Error('Employee not found');

    const limits: Record<string, { monthly: number; yearly: number }> = {
      'Lunch': { monthly: 2000, yearly: 24000 },
      'Travel': { monthly: 5000, yearly: 60000 },
      'Medical': { monthly: 5000, yearly: 60000 },
      'Communication': { monthly: 1500, yearly: 18000 },
      'Books': { monthly: 2000, yearly: 24000 },
    };

    let approved = 0, pending = 0, rejected = 0;
    const details: { type: string; amount: number; status: string }[] = [];

    for (const claim of claims) {
      const limit = limits[claim.type] || { monthly: 5000, yearly: 50000 };

      if (claim.amount <= limit.monthly) {
        approved += claim.amount;
        details.push({ type: claim.type, amount: claim.amount, status: 'approved' });
      } else if (claim.amount <= limit.monthly * 1.5) {
        pending += claim.amount;
        details.push({ type: claim.type, amount: claim.amount, status: 'pending' });
      } else {
        rejected += claim.amount;
        details.push({ type: claim.type, amount: claim.amount, status: 'rejected' });
      }
    }

    return { approved, pending, rejected, details };
  }

  async getLeaveBalance(employeeId: string, year: number): Promise<{
    earned: number;
    sick: number;
    casual: number;
    used: { type: string; count: number }[];
    available: { type: string; balance: number }[];
  }> {
    return {
      earned: 20,
      sick: 10,
      casual: 8,
      used: [
        { type: 'earned', count: 5 },
        { type: 'sick', count: 2 },
        { type: 'casual', count: 1 },
      ],
      available: [
        { type: 'earned', balance: 15 },
        { type: 'sick', balance: 8 },
        { type: 'casual', balance: 7 },
      ],
    };
  }
}

const payrollAI = new PayrollAI();

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'ledgerai-payroll-ai', port: 4893 });
});

app.post('/api/payroll/employee', async (req: Request, res: Response) => {
  try {
    const employee = await payrollAI.addEmployee(req.body);
    res.status(201).json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add employee' });
  }
});

app.get('/api/payroll/employees', async (req: Request, res: Response) => {
  res.json({ success: true, employees: Array.from((payrollAI as any).employees.values()) });
});

app.post('/api/payroll/calculate', async (req: Request, res: Response) => {
  try {
    const { employeeId, month, year, attendance } = req.body;
    const slip = await payrollAI.calculateSalary(employeeId, month, year, attendance);
    res.json({ success: true, slip });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate salary' });
  }
});

app.get('/api/payroll/register', async (req: Request, res: Response) => {
  try {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const register = await payrollAI.generatePayrollRegister(month, year);
    res.json({ success: true, register });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate register' });
  }
});

app.post('/api/payroll/reimbursement', async (req: Request, res: Response) => {
  try {
    const { employeeId, claims } = req.body;
    const result = await payrollAI.calculateReimbursement(employeeId, claims);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process reimbursement' });
  }
});

const PORT = 4893;
app.listen(PORT, () => {
  console.log(`💼 Payroll AI running on port ${PORT}`);
  console.log(`📊 LEDGERAI - Accounting AI Operating System`);
});

export default app;
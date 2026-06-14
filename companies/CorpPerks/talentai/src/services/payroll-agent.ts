/**
 * Payroll AI Agent - Port 4014
 * Auto-calculate salary, deductions, disburse
 */

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

// Tax slabs (India FY 2025-26)
const TAX_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300001, max: 600000, rate: 5 },
  { min: 600001, max: 900000, rate: 10 },
  { min: 900001, max: 1200000, rate: 15 },
  { min: 1200001, max: 1500000, rate: 20 },
  { min: 1500001, max: Infinity, rate: 30 },
];

// Store employees and payroll
const employees: Map<string, any> = new Map();
const payrollRuns: Map<string, any> = new Map();
const payslips: Map<string, any> = new Map();

// Health
app.get('/health', (_, res) => res.json({ status: 'ok', agent: 'payroll', port: 4014 }));

// Set employee salary structure
app.post('/employee', (req, res) => {
  const { employeeId, name, ctc, basicRatio = 0.4, hraRatio = 0.4, allowances = 0 } = req.body;

  const basic = Math.round(ctc * basicRatio / 12);
  const hra = Math.round(basic * hraRatio);
  const transport = 1600;
  const medical = 1250;
  const totalAllowances = allowances || (transport + medical);
  const gross = basic + hra + totalAllowances;

  const employee = {
    id: employeeId,
    name,
    ctc,
    structure: {
      basic,
      hra,
      transport,
      medical,
      allowances: totalAllowances,
      gross,
    },
    pf: Math.min(Math.round(basic * 0.12), 1800), // EPF: 12% of basic, max 1800
    esi: gross < 21000 ? Math.round(gross * 0.0075) : 0,
    professionalTax: 200,
    createdAt: new Date(),
  };

  employees.set(employeeId, employee);
  res.json({ employee });
});

// Calculate salary for month
app.post('/calculate', (req, res) => {
  const { employeeId, month, year, daysWorked = 30, lopDays = 0 } = req.body;

  const employee = employees.get(employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const { structure, pf, esi, professionalTax } = employee;

  // Calculate per day amounts
  const perDayBasic = structure.basic / 30;
  const lopAmount = Math.round(perDayBasic * lopDays);

  // Adjusted earnings
  const basic = structure.basic - lopAmount;
  const hra = Math.round((basic / structure.basic) * structure.hra);
  const allowances = structure.allowances;

  // Gross salary
  const gross = basic + hra + allowances;

  // Standard deductions
  const standardDeduction = 50000;

  // Calculate TDS
  const annualIncome = gross * 12;
  const taxableIncome = Math.max(0, annualIncome - standardDeduction - (pf * 12));
  const annualTds = calculateTDS(taxableIncome);
  const tds = Math.round(annualTds / 12);

  // Total deductions
  const totalDeductions = pf + esi + professionalTax + tds;
  const netSalary = gross - totalDeductions;

  const salary = {
    employeeId,
    month: `${year}-${String(month).padStart(2, '0')}`,
    earnings: {
      basic,
      hra,
      transport: structure.transport,
      medical: structure.medical,
      gross,
    },
    deductions: {
      pf,
      esi,
      professionalTax,
      tds,
      lop: lopAmount,
      total: totalDeductions,
    },
    netSalary,
    workingDays: 30,
    daysWorked,
    lopDays,
  };

  res.json({ salary });
});

// Run payroll for month
app.post('/run', (req, res) => {
  const { month, year } = req.body;

  if (!month || !year) {
    return res.status(400).json({ error: 'Month and year required' });
  }

  const runId = `payroll_${year}_${month}`;
  const payrollRun = {
    id: runId,
    month,
    year,
    employees: [],
    totalGross: 0,
    totalDeductions: 0,
    totalNet: 0,
    status: 'calculated',
    createdAt: new Date(),
  };

  // Calculate for all employees
  employees.forEach((emp, empId) => {
    const { structure, pf, esi } = emp;
    const gross = structure.gross;
    const tds = Math.round(calculateTDS(gross * 12) / 12);
    const totalDeductions = pf + esi + 200 + tds;

    payrollRun.employees.push({
      employeeId: empId,
      name: emp.name,
      gross,
      deductions: totalDeductions,
      net: gross - totalDeductions,
    });

    payrollRun.totalGross += gross;
    payrollRun.totalDeductions += totalDeductions;
    payrollRun.totalNet += gross - totalDeductions;
  });

  payrollRuns.set(runId, payrollRun);

  res.json({
    payrollRun,
    summary: {
      totalEmployees: payrollRun.employees.length,
      totalGross: payrollRun.totalGross,
      totalDeductions: payrollRun.totalDeductions,
      totalNet: payrollRun.totalNet,
    },
  });
});

// Disburse salary
app.post('/disburse', (req, res) => {
  const { payrollRunId } = req.body;

  const payrollRun = payrollRuns.get(payrollRunId);
  if (!payrollRun) {
    return res.status(404).json({ error: 'Payroll run not found' });
  }

  payrollRun.status = 'disbursed';
  payrollRun.disbursedAt = new Date();

  // Generate transaction references
  const transactions = payrollRun.employees.map(emp => ({
    employeeId: emp.employeeId,
    amount: emp.net,
    reference: `SAL${payrollRun.month}${emp.employeeId.slice(-4)}${crypto.randomInt(1000, 9999)}`,
    status: 'success',
  }));

  res.json({
    payrollRunId,
    status: 'disbursed',
    transactions,
    disbursedAt: payrollRun.disbursedAt,
  });
});

// Get payslip
app.get('/payslip/:employeeId/:month/:year', (req, res) => {
  const { employeeId, month, year } = req.params;
  const key = `${employeeId}_${year}_${month}`;

  const payslip = payslips.get(key);
  if (!payslip) {
    return res.status(404).json({ error: 'Payslip not found' });
  }
  res.json({ payslip });
});

// List employees
app.get('/employees', (_, res) => {
  res.json({ employees: Array.from(employees.values()) });
});

// Helper function
function calculateTDS(annualIncome: number): number {
  let tax = 0;
  let remaining = annualIncome;

  for (const slab of TAX_SLABS) {
    if (remaining <= 0) break;
    const taxableInSlab = Math.min(remaining, slab.max - slab.min);
    tax += taxableInSlab * (slab.rate / 100);
    remaining -= taxableInSlab;
  }

  // Add cess
  tax += tax * 0.04;

  return tax;
}

const PORT = 4014;
app.listen(PORT, () => logger.info(`Payroll Agent running on port ${PORT}`));

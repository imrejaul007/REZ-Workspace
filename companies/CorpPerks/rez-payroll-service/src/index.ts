import { logger } from '../../shared/logger';
/**
 * CorpPerks Payroll Service
 * Port: 4750 - Payroll processing
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.PORT || 4750;
const app: Express = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

// Types
interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  joinDate: Date;
  salary: number;
  bankAccount: string;
  pan?: string;
  uan?: string;
}

interface Payslip {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  basic: number;
  hra: number;
  allowances: number;
  deductions: number;
  tax: number;
  netSalary: number;
  status: 'draft' | 'processed' | 'paid';
  createdAt: Date;
}

const employees: Map<string, Employee> = new Map();
const payslips: Map<string, Payslip> = new Map();

// Add demo employees
const demoEmployees: Employee[] = [
  { id: '1', name: 'John Doe', email: 'john@corp.com', department: 'Engineering', designation: 'Software Engineer', joinDate: new Date('2023-01-15'), salary: 80000, bankAccount: 'XXXX1234', pan: 'ABCDE1234F' },
  { id: '2', name: 'Jane Smith', email: 'jane@corp.com', department: 'Marketing', designation: 'Marketing Manager', joinDate: new Date('2022-06-01'), salary: 120000, bankAccount: 'XXXX5678', pan: 'FGHIJ5678K' },
];
demoEmployees.forEach(e => employees.set(e.id, e));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'payroll', version: '1.0.0' });
});

// Employees
app.get('/api/employees', (_req: Request, res: Response) => {
  res.json({ employees: Array.from(employees.values()) });
});

app.post('/api/employees', (req: Request, res: Response) => {
  const emp: Employee = { id: uuidv4(), ...req.body, joinDate: new Date(req.body.joinDate) };
  employees.set(emp.id, emp);
  res.status(201).json({ employee: emp });
});

// Payroll processing
app.post('/api/payroll/process', (req: Request, res: Response) => {
  const { month, year, employeeIds } = req.body;

  if (!month || !year) return res.status(400).json({ error: 'month and year required' });

  const empIds = employeeIds || Array.from(employees.keys());
  const processed: Payslip[] = [];

  for (const empId of empIds) {
    const emp = employees.get(empId);
    if (!emp) continue;

    const basic = emp.salary * 0.5;
    const hra = emp.salary * 0.2;
    const allowances = emp.salary * 0.15;
    const epf = emp.salary * 0.12;
    const tax = calculateTax(emp.salary);
    const deductions = epf + tax;
    const netSalary = emp.salary + allowances - deductions;

    const payslip: Payslip = {
      id: uuidv4(),
      employeeId: empId,
      month, year,
      basic: Math.round(basic),
      hra: Math.round(hra),
      allowances: Math.round(allowances),
      deductions: Math.round(deductions),
      tax: Math.round(tax),
      netSalary: Math.round(netSalary),
      status: 'processed',
      createdAt: new Date()
    };

    payslips.set(payslip.id, payslip);
    processed.push(payslip);
  }

  res.json({ payslips: processed, count: processed.length });
});

function calculateTax(annualSalary: number): number {
  const annual = annualSalary * 12;
  let tax = 0;

  if (annual > 1500000) tax = (annual - 1500000) * 0.3;
  else if (annual > 1200000) tax = (annual - 1200000) * 0.2;
  else if (annual > 600000) tax = (annual - 600000) * 0.1;

  return tax / 12; // Monthly
}

app.get('/api/payslips', (req: Request, res: Response) => {
  const { employeeId, month, year } = req.query;
  let list = Array.from(payslips.values());
  if (employeeId) list = list.filter(p => p.employeeId === employeeId);
  if (month) list = list.filter(p => p.month === month);
  if (year) list = list.filter(p => p.year === Number(year));
  res.json({ payslips: list });
});

app.post('/api/payslips/:id/mark-paid', (req: Request, res: Response) => {
  const slip = payslips.get(req.params.id);
  if (!slip) return res.status(404).json({ error: 'Payslip not found' });
  slip.status = 'paid';
  payslips.set(slip.id, slip);
  res.json({ payslip: slip });
});

app.listen(PORT, () => logger.info(`Payroll Service running on port ${PORT}`));
export default app;
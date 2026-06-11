/**
 * Payroll Service - Salary & Benefits Management
 * Part of LEDGERAI - Finance AI Operating System
 */

import { v4 as uuidv4 } from 'uuid';

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  joiningDate: string;
  salary: number;
  bankAccount?: string;
  pan?: string;
  uan?: string;
  esic?: string;
  status: 'active' | 'on-leave' | 'terminated';
}

export interface SalaryComponent {
  type: 'basic' | 'hra' | 'allowance' | 'bonus' | 'deduction';
  name: string;
  amount: number;
  isTaxable: boolean;
}

export interface SalarySlip {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  components: SalaryComponent[];
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  status: 'draft' | 'processed' | 'paid';
  processedAt?: string;
  paidAt?: string;
  utrNumber?: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  status: 'present' | 'absent' | 'leave' | 'holiday';
  hoursWorked?: number;
}

export class PayrollService {
  private employees: Map<string, Employee> = new Map();
  private salarySlips: Map<string, SalarySlip> = new Map();
  private attendance: Map<string, Attendance> = new Map();

  constructor() {
    this.initializeEmployees();
  }

  private initializeEmployees(): void {
    const defaultEmployees: Employee[] = [
      { id: '1', employeeId: 'EMP001', name: 'Rahul Sharma', department: 'Engineering', designation: 'Senior Developer', joiningDate: '2022-01-15', salary: 85000, status: 'active', pan: 'ABCDE1234F', uan: 'UAN123456' },
      { id: '2', employeeId: 'EMP002', name: 'Priya Patel', department: 'Marketing', designation: 'Marketing Manager', joiningDate: '2021-06-01', salary: 95000, status: 'active', pan: 'FGHIJ5678K', uan: 'UAN234567' },
      { id: '3', employeeId: 'EMP003', name: 'Amit Kumar', department: 'Operations', designation: 'Operations Lead', joiningDate: '2020-03-10', salary: 75000, status: 'active', pan: 'KLMNO9012L', uan: 'UAN345678' },
    ];

    defaultEmployees.forEach(emp => this.employees.set(emp.id, emp));
  }

  async getEmployee(employeeId: string): Promise<Employee | undefined> {
    return this.employees.get(employeeId);
  }

  async getAllEmployees(department?: string): Promise<Employee[]> {
    const all = Array.from(this.employees.values());
    if (department) {
      return all.filter(e => e.department === department);
    }
    return all;
  }

  async calculateSalary(employeeId: string, month: string, year: number, attendance?: Attendance[]): Promise<SalarySlip> {
    const employee = this.employees.get(employeeId);
    if (!employee) throw new Error('Employee not found');

    const workingDays = attendance?.length || 22;
    const presentDays = attendance?.filter(a => a.status === 'present').length || workingDays;
    const daysWorked = presentDays;

    const basic = Math.round((employee.salary * 0.4));
    const hra = Math.round(basic * 0.4);
    const transportAllowance = 1600;
    const medicalAllowance = 1250;
    const otherAllowance = Math.round(employee.salary - basic - hra - transportAllowance - medicalAllowance);

    const grossSalary = basic + hra + transportAllowance + medicalAllowance + otherAllowance;

    // Calculate prorated salary
    const proratedGross = Math.round((grossSalary / workingDays) * daysWorked);

    // Deductions
    const professionalTax = 200;
    const tds = Math.round((employee.salary * 0.1));
    const pf = Math.round(basic * 0.12);
    const esic = Math.round(proratedGross * 0.0075);

    const components: SalaryComponent[] = [
      { type: 'basic', name: 'Basic Salary', amount: Math.round(basic * (daysWorked / workingDays)), isTaxable: true },
      { type: 'hra', name: 'House Rent Allowance', amount: Math.round(hra * (daysWorked / workingDays)), isTaxable: true },
      { type: 'allowance', name: 'Transport Allowance', amount: transportAllowance, isTaxable: false },
      { type: 'allowance', name: 'Medical Allowance', amount: medicalAllowance, isTaxable: false },
      { type: 'allowance', name: 'Other Allowance', amount: Math.round(otherAllowance * (daysWorked / workingDays)), isTaxable: true },
      { type: 'deduction', name: 'Professional Tax', amount: professionalTax, isTaxable: false },
      { type: 'deduction', name: 'TDS', amount: tds, isTaxable: false },
      { type: 'deduction', name: 'PF', amount: pf, isTaxable: false },
      { type: 'deduction', name: 'ESIC', amount: esic, isTaxable: false },
    ];

    const totalDeductions = professionalTax + tds + pf + esic;
    const netSalary = proratedGross - totalDeductions;

    const salarySlip: SalarySlip = {
      id: uuidv4(),
      employeeId,
      employeeName: employee.name,
      month,
      year,
      components,
      grossSalary: proratedGross,
      totalDeductions,
      netSalary,
      status: 'draft'
    };

    this.salarySlips.set(salarySlip.id, salarySlip);
    return salarySlip;
  }

  async processSalary(salarySlipId: string): Promise<SalarySlip | undefined> {
    const slip = this.salarySlips.get(salarySlipId);
    if (!slip) return undefined;

    slip.status = 'processed';
    slip.processedAt = new Date().toISOString();
    this.salarySlips.set(slipId, slip);
    return slip;
  }

  async markAsPaid(salarySlipId: string, utrNumber: string): Promise<SalarySlip | undefined> {
    const slip = this.salarySlips.get(salarySlipId);
    if (!slip) return undefined;

    slip.status = 'paid';
    slip.paidAt = new Date().toISOString();
    slip.utrNumber = utrNumber;
    this.salarySlips.set(salarySlipId, slip);
    return slip;
  }

  async getSalarySlips(employeeId?: string, month?: string, year?: number): Promise<SalarySlip[]> {
    let slips = Array.from(this.salarySlips.values());

    if (employeeId) slips = slips.filter(s => s.employeeId === employeeId);
    if (month) slips = slips.filter(s => s.month === month);
    if (year) slips = slips.filter(s => s.year === year);

    return slips.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return a.month.localeCompare(b.month);
    });
  }

  async getPayrollSummary(month: string, year: number): Promise<{
    totalEmployees: number;
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
    departmentWise: Record<string, { count: number; net: number }>;
  }> {
    const slips = await this.getSalarySlips(undefined, month, year);
    const employees = this.getAllEmployees();

    const departmentWise: Record<string, { count: number; net: number }> = {};
    employees.forEach(emp => {
      departmentWise[emp.department] = { count: 0, net: 0 };
    });

    slips.forEach(slip => {
      const emp = employees.find(e => e.id === slip.employeeId);
      if (emp && departmentWise[emp.department]) {
        departmentWise[emp.department].count++;
        departmentWise[emp.department].net += slip.netSalary;
      }
    });

    return {
      totalEmployees: slips.length,
      totalGross: slips.reduce((sum, s) => sum + s.grossSalary, 0),
      totalDeductions: slips.reduce((sum, s) => sum + s.totalDeductions, 0),
      totalNet: slips.reduce((sum, s) => sum + s.netSalary, 0),
      departmentWise
    };
  }
}

export default PayrollService;
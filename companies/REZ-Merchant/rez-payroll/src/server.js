/**
 * REZ Payroll Service - Express Server
 * Comprehensive payroll management for Indian compliance
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import {
  SalaryCalculator,
  AttendanceTracker,
  StatutoryCompliance,
  DisbursementManager,
  PayrollEngine,
  createPayrollEngine,
} from './index.js';

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Initialize payroll engine
const payrollEngine = createPayrollEngine();

// In-memory data stores
const employees = new Map();
const payrollRuns = new Map();
const salarySlips = new Map();

// ============================================================================
// Health Endpoint
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-payroll',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    employees: employees.size,
    payrollRuns: payrollRuns.size
  });
});

// ============================================================================
// Employee Management
// ============================================================================

/**
 * Create employee
 * POST /api/employees
 */
app.post('/api/employees', (req, res) => {
  try {
    const { name, email, department, designation, panCard, aadharCard, bankAccount, salary, statutory } = req.body;

    if (!name || !email || !department || !designation) {
      return res.status(400).json({ error: 'Missing required fields: name, email, department, designation' });
    }

    const employeeId = `EMP-${uuidv4().slice(0, 8).toUpperCase()}`;

    const employee = {
      id: employeeId,
      employeeId,
      name,
      email,
      department,
      designation,
      joiningDate: new Date(),
      panCard: panCard || null,
      aadharCard: aadharCard || null,
      bankAccount: bankAccount || { bankName: '', accountNumber: '', ifscCode: '' },
      salary: salary || { basicSalary: 0, hra: 0, allowances: {}, deductions: {} },
      statutory: statutory || { pfEnabled: true, esiEnabled: false, tdsEnabled: true, professionalTax: 200 }
    };

    employees.set(employeeId, employee);

    res.status(201).json({ success: true, employeeId, employee });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

/**
 * Get all employees
 * GET /api/employees
 */
app.get('/api/employees', (req, res) => {
  try {
    const { department, designation } = req.query;
    let result = Array.from(employees.values());

    if (department) {
      result = result.filter(e => e.department.toLowerCase() === department.toLowerCase());
    }
    if (designation) {
      result = result.filter(e => e.designation.toLowerCase() === designation.toLowerCase());
    }

    res.json({ employees: result, total: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

/**
 * Get employee by ID
 * GET /api/employees/:employeeId
 */
app.get('/api/employees/:employeeId', (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = employees.get(employeeId);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

/**
 * Update employee
 * PUT /api/employees/:employeeId
 */
app.put('/api/employees/:employeeId', (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = employees.get(employeeId);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const { name, email, department, designation, salary, statutory } = req.body;

    if (name) employee.name = name;
    if (email) employee.email = email;
    if (department) employee.department = department;
    if (designation) employee.designation = designation;
    if (salary) employee.salary = { ...employee.salary, ...salary };
    if (statutory) employee.statutory = { ...employee.statutory, ...statutory };

    employees.set(employeeId, employee);

    res.json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

/**
 * Delete employee
 * DELETE /api/employees/:employeeId
 */
app.delete('/api/employees/:employeeId', (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employees.has(employeeId)) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    employees.delete(employeeId);

    res.json({ success: true, message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// ============================================================================
// Attendance Management
// ============================================================================

/**
 * Clock in employee
 * POST /api/attendance/clock-in
 */
app.post('/api/attendance/clock-in', (req, res) => {
  try {
    const { employeeId, date } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
    }

    const record = payrollEngine.getAttendanceTracker().clockIn(employeeId, date ? new Date(date) : new Date());

    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Clock out employee
 * POST /api/attendance/clock-out
 */
app.post('/api/attendance/clock-out', (req, res) => {
  try {
    const { employeeId, date } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
    }

    const record = payrollEngine.getAttendanceTracker().clockOut(employeeId, date ? new Date(date) : new Date());

    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Mark absent
 * POST /api/attendance/absent
 */
app.post('/api/attendance/absent', (req, res) => {
  try {
    const { employeeId, date } = req.body;

    if (!employeeId || !date) {
      return res.status(400).json({ error: 'employeeId and date are required' });
    }

    const record = payrollEngine.getAttendanceTracker().markAbsent(employeeId, new Date(date));

    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Apply leave
 * POST /api/attendance/leave
 */
app.post('/api/attendance/leave', (req, res) => {
  try {
    const { employeeId, date, leaveType } = req.body;

    if (!employeeId || !date || !leaveType) {
      return res.status(400).json({ error: 'employeeId, date, and leaveType are required' });
    }

    const record = payrollEngine.getAttendanceTracker().applyLeave(employeeId, new Date(date), leaveType);

    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get monthly attendance
 * GET /api/attendance/:employeeId
 */
app.get('/api/attendance/:employeeId', (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    const records = payrollEngine.getAttendanceTracker().getMonthlyAttendance(employeeId, m, y);
    const summary = payrollEngine.getAttendanceTracker().getMonthlySummary(employeeId, m, y);

    res.json({ records, summary });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// ============================================================================
// Payroll Processing
// ============================================================================

/**
 * Run payroll for a month
 * POST /api/payroll/run
 */
app.post('/api/payroll/run', async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ error: 'month and year are required' });
    }

    const employeeList = Array.from(employees.values());

    if (employeeList.length === 0) {
      return res.status(400).json({ error: 'No employees found' });
    }

    const run = await payrollEngine.runPayroll(employeeList, month, year);

    payrollRuns.set(run.id, run);

    res.status(201).json({ success: true, payrollRun: run });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Approve payroll run
 * POST /api/payroll/:runId/approve
 */
app.post('/api/payroll/:runId/approve', (req, res) => {
  try {
    const { runId } = req.params;
    const run = payrollEngine.getPayrollRun(runId);

    if (!run) {
      return res.status(404).json({ error: 'Payroll run not found' });
    }

    const approved = payrollEngine.approvePayroll(runId);

    res.json({ success: true, payrollRun: approved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Disburse payroll
 * POST /api/payroll/:runId/disburse
 */
app.post('/api/payroll/:runId/disburse', async (req, res) => {
  try {
    const { runId } = req.params;
    const result = await payrollEngine.disbursePayroll(runId);

    res.json({ success: true, disbursementResult: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get payroll runs
 * GET /api/payroll/runs
 */
app.get('/api/payroll/runs', (req, res) => {
  try {
    const { month, year, status } = req.query;
    let result = Array.from(payrollRuns.values());

    if (month) {
      result = result.filter(r => r.month === parseInt(month));
    }
    if (year) {
      result = result.filter(r => r.year === parseInt(year));
    }
    if (status) {
      result = result.filter(r => r.status === status);
    }

    res.json({ payrollRuns: result, total: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payroll runs' });
  }
});

/**
 * Get payroll run by ID
 * GET /api/payroll/runs/:runId
 */
app.get('/api/payroll/runs/:runId', (req, res) => {
  try {
    const { runId } = req.params;
    const run = payrollEngine.getPayrollRun(runId);

    if (!run) {
      return res.status(404).json({ error: 'Payroll run not found' });
    }

    res.json(run);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payroll run' });
  }
});

// ============================================================================
// Salary Slips
// ============================================================================

/**
 * Get salary slip
 * GET /api/salary-slips/:slipId
 */
app.get('/api/salary-slips/:slipId', (req, res) => {
  try {
    const { slipId } = req.params;
    const slip = payrollEngine.getSalarySlip(slipId);

    if (!slip) {
      return res.status(404).json({ error: 'Salary slip not found' });
    }

    res.json(slip);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch salary slip' });
  }
});

/**
 * Get employee salary slips
 * GET /api/salary-slips/employee/:employeeId
 */
app.get('/api/salary-slips/employee/:employeeId', (req, res) => {
  try {
    const { employeeId } = req.params;
    const slips = payrollEngine.getEmployeeSalarySlips(employeeId);

    res.json({ salarySlips: slips, total: slips.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch salary slips' });
  }
});

// ============================================================================
// Statutory Compliance
// ============================================================================

/**
 * Get compliance report
 * POST /api/compliance/report
 */
app.post('/api/compliance/report', (req, res) => {
  try {
    const employeeList = Array.from(employees.values());
    const slipList = Array.from(payrollEngine.getSalarySlip('').values());

    const report = StatutoryCompliance.generateComplianceReport(employeeList, slipList);

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate compliance report' });
  }
});

/**
 * Validate PF compliance
 * POST /api/compliance/pf
 */
app.post('/api/compliance/pf', (req, res) => {
  try {
    const { employeeId, monthlyGross } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
    }

    const employee = employees.get(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const result = StatutoryCompliance.validatePFCompliance(employee, monthlyGross || 50000);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Validate ESI compliance
 * POST /api/compliance/esi
 */
app.post('/api/compliance/esi', (req, res) => {
  try {
    const { employeeId, monthlyGross } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
    }

    const employee = employees.get(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const result = StatutoryCompliance.validateESICompliance(employee, monthlyGross || 50000);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Validate TDS compliance
 * POST /api/compliance/tds
 */
app.post('/api/compliance/tds', (req, res) => {
  try {
    const { employeeId, annualIncome } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
    }

    const employee = employees.get(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const result = StatutoryCompliance.validateTDSCompliance(employee, annualIncome || 600000);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get employer liability
 * POST /api/compliance/liability
 */
app.post('/api/compliance/liability', (req, res) => {
  try {
    const employeeList = Array.from(employees.values());
    const slipList = [];

    const liability = StatutoryCompliance.calculateEmployerLiability(employeeList, slipList);

    res.json(liability);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate liability' });
  }
});

// ============================================================================
// Disbursements
// ============================================================================

/**
 * Get disbursement summary
 * GET /api/disbursements/summary
 */
app.get('/api/disbursements/summary', (req, res) => {
  try {
    const { month, year } = req.query;

    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    const summary = payrollEngine.getDisbursementManager().getMonthlySummary(m, y);

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

/**
 * Get employee disbursements
 * GET /api/disbursements/employee/:employeeId
 */
app.get('/api/disbursements/employee/:employeeId', (req, res) => {
  try {
    const { employeeId } = req.params;
    const disbursements = payrollEngine.getDisbursementManager().getEmployeeDisbursements(employeeId);

    res.json({ disbursements, total: disbursements.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch disbursements' });
  }
});

// ============================================================================
// Calculator Utilities
// ============================================================================

/**
 * Calculate gross salary
 * POST /api/calculator/gross
 */
app.post('/api/calculator/gross', (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
    }

    const employee = employees.get(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const gross = SalaryCalculator.calculateGrossSalary(employee);

    res.json({ employeeId, grossSalary: gross });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Calculate overtime pay
 * POST /api/calculator/overtime
 */
app.post('/api/calculator/overtime', (req, res) => {
  try {
    const { employeeId, hours } = req.body;

    if (!employeeId || hours === undefined) {
      return res.status(400).json({ error: 'employeeId and hours are required' });
    }

    const employee = employees.get(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const overtime = SalaryCalculator.calculateOvertimePay(employee, hours);

    res.json({ employeeId, hours, overtimePay: overtime });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Start Server
// ============================================================================

const PORT = process.env.PORT || 4610;

const server = app.listen(PORT, () => {
  console.log(`REZ Payroll Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
export { server };
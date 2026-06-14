/**
 * Payroll Routes
 */

import { Router, Request, Response } from 'express';
import { Payroll, Employee, Attendance } from '../models/index';
import { requireRoles } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

// Generate payroll for period
router.post('/generate', requireRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const { restaurantId, employeeIds, periodStart, periodEnd } = req.body;
    const payrolls: unknown[] = [];

    for (const employeeId of employeeIds) {
      const employee = await Employee.findOne({ employeeId });
      if (!employee) continue;

      const attendanceRecords = await Attendance.find({
        employeeId,
        date: { $gte: new Date(periodStart), $lte: new Date(periodEnd) },
      });

      let totalHours = 0;
      let overtimeHours = 0;

      for (const record of attendanceRecords) {
        totalHours += record.actualHours;
        overtimeHours += record.overtimeHours;
      }

      const regularHours = Math.min(totalHours, 40);
      const regularPay = regularHours * employee.hourlyRate;
      const overtimePay = overtimeHours * employee.hourlyRate * employee.overtimeRate;
      const grossPay = regularPay + overtimePay;
      const tax = grossPay * 0.1; // 10% tax

      const payrollId = `PAY${Date.now()}${crypto.randomUUID().split('-')[0]}`;
      payrolls.push({
        payrollId,
        merchantId: employee.merchantId,
        restaurantId,
        employeeId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        regularHours,
        overtimeHours,
        regularPay,
        overtimePay,
        grossPay,
        deductions: { tax },
        netPay: grossPay - tax,
        status: 'pending',
      });
    }

    await Payroll.insertMany(payrolls);
    res.json({ success: true, data: { created: payrolls.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate payroll' });
  }
});

// Get payroll records
router.get('/', async (req: Request, res: Response) => {
  try {
    const { restaurantId, employeeId, status, periodStart, periodEnd } = req.query;
    const query: unknown = {};

    if (restaurantId) query.restaurantId = restaurantId;
    if (employeeId) query.employeeId = employeeId;
    if (status) query.status = status;
    if (periodStart && periodEnd) {
      query.periodStart = { $gte: new Date(periodStart as string) };
      query.periodEnd = { $lte: new Date(periodEnd as string) };
    }

    const records = await Payroll.find(query).sort({ periodEnd: -1 });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch payroll' });
  }
});

// Approve payroll
router.post('/:payrollId/approve', requireRoles('admin'), async (req: Request, res: Response) => {
  try {
    const payroll = await Payroll.findOneAndUpdate(
      { payrollId: req.params.payrollId },
      { status: 'approved' },
      { new: true }
    );
    if (!payroll) {
      res.status(404).json({ success: false, error: 'Payroll not found' });
      return;
    }
    res.json({ success: true, data: payroll });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to approve payroll' });
  }
});

// Mark as paid
router.post('/:payrollId/pay', requireRoles('admin'), async (req: Request, res: Response) => {
  try {
    const payroll = await Payroll.findOneAndUpdate(
      { payrollId: req.params.payrollId },
      { status: 'paid', paidAt: new Date() },
      { new: true }
    );
    if (!payroll) {
      res.status(404).json({ success: false, error: 'Payroll not found' });
      return;
    }
    res.json({ success: true, data: payroll });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to mark as paid' });
  }
});

// Export payroll report
router.get('/export', requireRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const { restaurantId, periodStart, periodEnd } = req.query;

    const records = await Payroll.find({
      restaurantId,
      periodStart: { $gte: new Date(periodStart as string) },
      periodEnd: { $lte: new Date(periodEnd as string) },
    }).populate('employeeId');

    const totalGross = records.reduce((sum, r) => sum + r.grossPay, 0);
    const totalNet = records.reduce((sum, r) => sum + r.netPay, 0);
    const totalDeductions = records.reduce((sum, r) => sum + r.deductions.tax, 0);

    res.json({
      success: true,
      data: {
        records,
        summary: {
          totalEmployees: records.length,
          totalGross,
          totalDeductions,
          totalNet,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to export payroll' });
  }
});

export { router as payrollRoutes };

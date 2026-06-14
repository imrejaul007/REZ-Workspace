
import { Router, Request, Response } from 'express';
import { Attendance } from '../models/Attendance';
import { PayrollRecord } from '../models/PayrollRecord';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

const PERMISSIONS = {
  PAYROLL_READ: 'payroll:read',
  PAYROLL_PROCESS: 'payroll:process',
  PAYROLL_PAY: 'payroll:pay',
};

function requirePermissions(_permission: string) {
  return async (req: Request, res: Response, next: () => void) => {
    const merchantId = (req as unknown).merchantId;
    if (!merchantId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    next();
  };
}

const ATTENDANCE_ALLOWED_FIELDS = [
  'employeeId', 'storeId', 'shift', 'notes', 'location',
];

function pickAttendanceFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const field of ATTENDANCE_ALLOWED_FIELDS) {
    if (body[field] !== undefined) filtered[field] = body[field];
  }
  return filtered;
}

const PAYROLL_ALLOWED_FIELDS = [
  'employeeId', 'storeId', 'period', 'month', 'year',
  'baseSalary', 'deductions', 'bonuses', 'overtime',
  'totalAmount', 'notes', 'metadata',
];

function pickPayrollFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const field of PAYROLL_ALLOWED_FIELDS) {
    if (body[field] !== undefined) filtered[field] = body[field];
  }
  return filtered;
}

router.get('/attendance', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const query: unknown = { merchantId };
    if (req.query.storeId) query.storeId = req.query.storeId;
    if (req.query.date) query.date = req.query.date;
    const records = await Attendance.find(query).sort({ date: -1 }).lean();
    res.json({ success: true, data: records });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/attendance/clock-in', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const record = await Attendance.create({ ...pickAttendanceFields(req.body), merchantId, clockIn: new Date(), date: new Date().toISOString().split('T')[0] });
    res.status(201).json({ success: true, data: record });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/attendance/clock-out', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const record = await Attendance.findOneAndUpdate({ _id: req.body.attendanceId, merchantId }, { $set: { clockOut: new Date() } }, { new: true });
    if (!record) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: record });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/payroll', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const records = await PayrollRecord.find({ merchantId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: records });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/payroll/process', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const record = await PayrollRecord.create({ ...pickPayrollFields(req.body), merchantId, status: 'processed', processedAt: new Date() });
    res.status(201).json({ success: true, data: record });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.patch('/payroll/:payrollId/pay', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const record = await PayrollRecord.findOneAndUpdate({ _id: req.params.payrollId, merchantId }, { $set: { status: 'paid', paidAt: new Date() } }, { new: true });
    if (!record) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: record });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;

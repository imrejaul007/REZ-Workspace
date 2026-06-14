/**
 * REZ Staff Scheduling Service
 * Port: 4036
 * Shift Management, Time Tracking, Payroll
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const config = {
  port: parseInt(process.env.PORT || '4036'),
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/rez_scheduling',
};

const Staff = mongoose.model('Staff', new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  hotelId: { type: String, index: true },
  name: String,
  email: String,
  phone: String,
  department: { type: String, enum: ['front_desk', 'housekeeping', 'kitchen', 'maintenance', 'management', 'spa', 'restaurant'] },
  role: String,
  wagePerHour: Number,
  wageType: { type: String, enum: ['hourly', 'salary'] },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
}));

const ShiftTemplate = mongoose.model('ShiftTemplate', new mongoose.Schema({
  hotelId: { type: String, index: true },
  name: String,
  department: String,
  startTime: String,
  endTime: String,
  breakMinutes: { type: Number, default: 60 },
  color: String,
  isActive: { type: Boolean, default: true },
}));

const Schedule = mongoose.model('Schedule', new mongoose.Schema({
  hotelId: { type: String, index: true },
  staffId: { type: String, index: true },
  shiftTemplateId: String,
  date: { type: String, index: true },
  startTime: String,
  endTime: String,
  breakMinutes: { type: Number, default: 60 },
  status: { type: String, enum: ['scheduled', 'clocked_in', 'clocked_out', 'absent', 'leave'], default: 'scheduled' },
  notes: String,
  createdAt: { type: Date, default: Date.now },
}));

const TimeEntry = mongoose.model('TimeEntry', new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  hotelId: { type: String, index: true },
  staffId: { type: String, index: true },
  scheduleId: String,
  date: { type: String, index: true },
  clockIn: Date,
  clockOut: Date,
  breakStart: Date,
  breakEnd: Date,
  totalHours: Number,
  regularHours: Number,
  overtimeHours: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'completed', 'edited'] },
  editedBy: String,
  editReason: String,
  createdAt: { type: Date, default: Date.now },
}));

const LeaveRequest = mongoose.model('LeaveRequest', new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  hotelId: String,
  staffId: { type: String, index: true },
  type: { type: String, enum: ['sick', 'personal', 'vacation', 'emergency'] },
  startDate: String,
  endDate: String,
  reason: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: String,
  createdAt: { type: Date, default: Date.now },
}));

// Staff endpoints
app.get('/health', (_req, res) => res.json({ status: 'healthy', service: 'staff-scheduling', port: config.port }));

app.post('/api/staff', async (req: res, next: NextFunction) => {
  try {
    const { hotelId, name, email, phone, department, role, wagePerHour, wageType } = req.body;
    const staff = await Staff.create({ id: uuidv4(), hotelId, name, email, phone, department, role, wagePerHour, wageType });
    res.json({ success: true, data: { staff } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/staff/:hotelId', async (req, res, next: NextFunction) => {
  try {
    const { department, activeOnly } = req.query;
    const query: any = { hotelId: req.params.hotelId };
    if (department) query.department = department;
    if (activeOnly === 'true') query.isActive = true;
    const staff = await Staff.find(query);
    res.json({ success: true, data: { staff } });
  } catch (error) {
    next(error);
  }
});

// Shift templates
app.post('/api/shift-templates', async (req: res, next: NextFunction) => {
  try {
    const template = await ShiftTemplate.create(req.body);
    res.json({ success: true, data: { template } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/shift-templates/:hotelId', async (req, res, next: NextFunction) => {
  try {
    const templates = await ShiftTemplate.find({ hotelId: req.params.hotelId, isActive: true });
    res.json({ success: true, data: { templates } });
  } catch (error) {
    next(error);
  }
});

// Schedule
app.post('/api/schedule', async (req, res, next: NextFunction) => {
  try {
    const { hotelId, staffId, shiftTemplateId, date, startTime, endTime, breakMinutes, notes } = req.body;
    const schedule = await Schedule.create({ hotelId, staffId, shiftTemplateId, date, startTime, endTime, breakMinutes, notes });
    res.json({ success: true, data: { schedule } });
  } catch (error) {
    next(error);
  }
});

app.post('/api/schedule/bulk', async (req, res, next: NextFunction) => {
  try {
    const { schedules } = req.body;
    const created = await Schedule.insertMany(schedules.map((s: any) => ({ ...s, status: 'scheduled' })));
    res.json({ success: true, data: { count: created.length } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/schedule/:hotelId', async (req, res, next: NextFunction) => {
  try {
    const { date, staffId, department } = req.query;
    const query: any = { hotelId: req.params.hotelId };
    if (date) query.date = date;
    if (staffId) query.staffId = staffId;
    const schedules = await Schedule.find(query).populate('staffId', 'name department');
    res.json({ success: true, data: { schedules } });
  } catch (error) {
    next(error);
  }
});

// Time tracking
app.post('/api/time/clock-in', async (req, res, next: NextFunction) => {
  try {
    const { hotelId, staffId, scheduleId } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const entry = await TimeEntry.create({ id: uuidv4(), hotelId, staffId, scheduleId, date: today, clockIn: new Date(), status: 'active' });

    if (scheduleId) {
      await Schedule.findByIdAndUpdate(scheduleId, { status: 'clocked_in' });
    }

    res.json({ success: true, data: { entry } });
  } catch (error) {
    next(error);
  }
});

app.post('/api/time/clock-out', async (req, res, next: NextFunction) => {
  try {
    const { entryId, breakMinutes = 0 } = req.body;

    const entry = await TimeEntry.findOne({ id: entryId, status: 'active' });
    if (!entry) {
      return res.status(404).json({ success: false, error: { code: 'ENTRY_NOT_FOUND' } });
    }

    const clockOut = new Date();
    const totalMs = clockOut.getTime() - entry.clockIn!.getTime();
    const totalHours = totalMs / (1000 * 60 * 60);
    const regularHours = Math.min(totalHours, 8);
    const overtimeHours = Math.max(0, totalHours - 8);

    entry.clockOut = clockOut;
    entry.totalHours = totalHours;
    entry.regularHours = regularHours;
    entry.overtimeHours = overtimeHours;
    entry.status = 'completed';
    await entry.save();

    if (entry.scheduleId) {
      await Schedule.findByIdAndUpdate(entry.scheduleId, { status: 'clocked_out' });
    }

    res.json({ success: true, data: { entry } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/time/:hotelId', async (req, res, next: NextFunction) => {
  try {
    const { startDate, endDate, staffId } = req.query;
    const query: any = { hotelId: req.params.hotelId };
    if (startDate) query.date = { ...query.date, $gte: startDate };
    if (endDate) query.date = { ...query.date, $lte: endDate };
    if (staffId) query.staffId = staffId;

    const entries = await TimeEntry.find(query).populate('staffId', 'name department wagePerHour');
    res.json({ success: true, data: { entries } });
  } catch (error) {
    next(error);
  }
});

// Leave requests
app.post('/api/leave', async (req, res, next: NextFunction) => {
  try {
    const { hotelId, staffId, type, startDate, endDate, reason } = req.body;
    const leave = await LeaveRequest.create({ id: uuidv4(), hotelId, staffId, type, startDate, endDate, reason });
    res.json({ success: true, data: { leave } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/leave/:hotelId', async (req, res, next: NextFunction) => {
  try {
    const { status, pendingOnly } = req.query;
    const query: any = { hotelId: req.params.hotelId };
    if (status) query.status = status;

    const leaves = await LeaveRequest.find(query).populate('staffId', 'name department');
    res.json({ success: true, data: { leaves } });
  } catch (error) {
    next(error);
  }
});

app.post('/api/leave/:leaveId/approve', async (req, res, next: NextFunction) => {
  try {
    const { approvedBy } = req.body;
    const leave = await LeaveRequest.findByIdAndUpdate(req.params.leaveId, { status: 'approved', approvedBy }, { new: true });
    res.json({ success: true, data: { leave } });
  } catch (error) {
    next(error);
  }
});

// Payroll
app.get('/api/payroll/:hotelId', async (req, res, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    const entries = await TimeEntry.aggregate([
      { $match: { hotelId: req.params.hotelId, date: { $gte: startDate as string, $lte: endDate as string } } },
      { $group: { _id: '$staffId', totalHours: { $sum: '$totalHours' }, regularHours: { $sum: '$regularHours' }, overtimeHours: { $sum: '$overtimeHours' }, daysWorked: { $sum: 1 } } },
    ]);

    const staff = await Staff.find({ hotelId: req.params.hotelId });
    const payroll = entries.map(e => {
      const s = staff.find(st => st.id === e._id);
      const hourlyRate = s?.wagePerHour || 100;
      const regularPay = e.regularHours * hourlyRate;
      const overtimePay = e.overtimeHours * hourlyRate * 1.5;
      return { staffId: e._id, name: s?.name, department: s?.department, ...e, regularPay, overtimePay, totalPay: regularPay + overtimePay };
    });

    res.json({ success: true, data: { payroll } });
  } catch (error) {
    next(error);
  }
});

async function start() {
  try {
    await mongoose.connect(config.mongoUrl);
    console.log(`\n👥 REZ Staff Scheduling Service - Port ${config.port}\n`);
    app.listen(config.port, () => console.log(`✅ Staff Scheduling running on port ${config.port}`));
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

start().catch(console.error);

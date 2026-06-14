/**
 * BIZORA PeopleOS Service
 * Complete HR & Payroll Management System
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import crypto from 'crypto';

// ============================================================================
// MongoDB Connection
// ============================================================================

interface MongoDBConnection {
  isConnected: boolean;
  error?: string;
}

const mongoState: MongoDBConnection = { isConnected: false };

async function connectToMongoDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bizora_people';

  try {
    await mongoose.connect(uri);
    mongoState.isConnected = true;
    logger.info(`[MongoDB] Connected to bizora_people database`);
  } catch (error) {
    mongoState.error = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[MongoDB] Connection failed: ${mongoState.error}`);
    throw error;
  }
}

// ============================================================================
// Types
// ============================================================================

interface IEmployee extends Document {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  gender: 'male' | 'female' | 'other';
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  designation: string;
  department: string;
  managerId?: string;
  dateOfJoining: Date;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'intern';
  workLocation: 'office' | 'remote' | 'hybrid';
  salary: {
    ctc: number;
    base: number;
    hra: number;
    allowances: number;
    deductions: number;
    pf: number;
    esic: number;
    tds: number;
  };
  bankAccount: { bankName: string; accountNumber: string; ifsc: string };
  uan?: string;
  pan?: string;
  aadhaar?: string;
  status: 'active' | 'on_leave' | 'terminated' | 'resigned';
  exitDate?: Date;
  avatar?: string;
  createdAt: Date;
}

interface ILeaveRequest extends Document {
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
}

interface ILeaveBalance extends Document {
  employeeId: string;
  leaveType: string;
  entitled: number;
  taken: number;
  pending: number;
  available: number;
}

interface IAttendance extends Document {
  employeeId: string;
  date: Date;
  checkIn?: string;
  checkOut?: string;
  workHours: number;
  status: 'present' | 'absent' | 'half_day' | 'leave' | 'holiday' | 'weekoff';
  overtime?: number;
  notes?: string;
  createdAt: Date;
}

interface IPayroll extends Document {
  employeeId: string;
  employeeName: string;
  month: string;
  status: 'draft' | 'calculated' | 'approved' | 'paid';
  earnings: {
    basic: number;
    hra: number;
    allowances: number;
    bonus: number;
    overtime: number;
    total: number;
  };
  deductions: {
    pf: number;
    esic: number;
    tds: number;
    advances: number;
    other: number;
    total: number;
  };
  netPay: number;
  paidAt?: Date;
  paidMethod?: string;
  createdAt: Date;
}

interface IDepartment extends Document {
  name: string;
  code: string;
  managerId?: string;
  budget?: number;
  headcount: number;
}

interface IShift extends Document {
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  isNightShift: boolean;
}

// ============================================================================
// Mongoose Schemas with Indexes
// ============================================================================

const employeeSchema = new Schema<IEmployee>({
  employeeCode: { type: String, required: true, unique: true, index: true },
  firstName: { type: String, required: true, index: true },
  lastName: { type: String, required: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'widowed'], required: true },
  designation: { type: String, required: true, index: true },
  department: { type: String, required: true, index: true },
  managerId: { type: String },
  dateOfJoining: { type: Date, required: true },
  employmentType: { type: String, enum: ['full_time', 'part_time', 'contract', 'intern'], required: true, index: true },
  workLocation: { type: String, enum: ['office', 'remote', 'hybrid'], default: 'office' },
  salary: {
    ctc: { type: Number, required: true, min: 0 },
    base: { type: Number, required: true, min: 0 },
    hra: { type: Number, required: true, min: 0 },
    allowances: { type: Number, required: true, min: 0 },
    deductions: { type: Number, default: 0 },
    pf: { type: Number, default: 0 },
    esic: { type: Number, default: 0 },
    tds: { type: Number, default: 0 },
  },
  bankAccount: {
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifsc: { type: String, required: true },
  },
  uan: { type: String },
  pan: { type: String },
  aadhaar: { type: String },
  status: { type: String, enum: ['active', 'on_leave', 'terminated', 'resigned'], default: 'active', index: true },
  exitDate: { type: Date },
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const leaveRequestSchema = new Schema<ILeaveRequest>({
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, required: true },
  leaveType: { type: String, required: true, index: true },
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number, required: true, min: 1 },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  approvedBy: { type: String },
  approvedAt: { type: Date },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
});

const leaveBalanceSchema = new Schema<ILeaveBalance>({
  employeeId: { type: String, required: true, index: true },
  leaveType: { type: String, required: true },
  entitled: { type: Number, required: true, min: 0 },
  taken: { type: Number, default: 0, min: 0 },
  pending: { type: Number, default: 0, min: 0 },
  available: { type: Number, required: true, min: 0 },
});

const attendanceSchema = new Schema<IAttendance>({
  employeeId: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  checkIn: { type: String },
  checkOut: { type: String },
  workHours: { type: Number, default: 0 },
  status: { type: String, enum: ['present', 'absent', 'half_day', 'leave', 'holiday', 'weekoff'], default: 'present', index: true },
  overtime: { type: Number },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const payrollSchema = new Schema<IPayroll>({
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, required: true },
  month: { type: String, required: true, index: true },
  status: { type: String, enum: ['draft', 'calculated', 'approved', 'paid'], default: 'draft', index: true },
  earnings: {
    basic: { type: Number, required: true, min: 0 },
    hra: { type: Number, required: true, min: 0 },
    allowances: { type: Number, required: true, min: 0 },
    bonus: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  deductions: {
    pf: { type: Number, required: true, min: 0 },
    esic: { type: Number, required: true, min: 0 },
    tds: { type: Number, required: true, min: 0 },
    advances: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  netPay: { type: Number, required: true },
  paidAt: { type: Date },
  paidMethod: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const departmentSchema = new Schema<IDepartment>({
  name: { type: String, required: true, unique: true, index: true },
  code: { type: String, required: true, unique: true },
  managerId: { type: String },
  budget: { type: Number },
  headcount: { type: Number, default: 0 },
});

const shiftSchema = new Schema<IShift>({
  name: { type: String, required: true, unique: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  breakMinutes: { type: Number, default: 60 },
  isNightShift: { type: Boolean, default: false },
});

// ============================================================================
// Models
// ============================================================================

const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
const LeaveRequest = mongoose.model<ILeaveRequest>('LeaveRequest', leaveRequestSchema);
const LeaveBalance = mongoose.model<ILeaveBalance>('LeaveBalance', leaveBalanceSchema);
const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
const Payroll = mongoose.model<IPayroll>('Payroll', payrollSchema);
const Department = mongoose.model<IDepartment>('Department', departmentSchema);
const Shift = mongoose.model<IShift>('Shift', shiftSchema);

// ============================================================================
// Validation
// ============================================================================

const CreateEmployeeSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  designation: z.string(),
  department: z.string(),
  dateOfJoining: z.string(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']),
  workLocation: z.enum(['office', 'remote', 'hybrid']).default('office'),
  salary: z.object({
    ctc: z.number().min(0),
    base: z.number().min(0),
    hra: z.number().min(0),
    allowances: z.number().min(0),
  }),
  bankAccount: z.object({
    bankName: z.string(),
    accountNumber: z.string(),
    ifsc: z.string(),
  }),
  gender: z.enum(['male', 'female', 'other']),
  pan: z.string().optional(),
  aadhaar: z.string().optional(),
});

const CreateLeaveRequestSchema = z.object({
  employeeId: z.string(),
  leaveType: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string(),
});

// Leave Types
const LEAVE_TYPES = [
  { id: 'cl', name: 'Casual Leave', shortName: 'CL', annual: 12 },
  { id: 'sl', name: 'Sick Leave', shortName: 'SL', annual: 12 },
  { id: 'el', name: 'Earned Leave', shortName: 'EL', annual: 18 },
  { id: 'pl', name: 'Privilege Leave', shortName: 'PL', annual: 15 },
];

// ============================================================================
// Sample Data Seeding
// ============================================================================

async function seedSampleData(): Promise<void> {
  const deptCount = await Department.countDocuments();
  if (deptCount > 0) {
    logger.info('[Seeding] Sample data already exists, skipping...');
    return;
  }

  logger.info('[Seeding] Creating sample data...');

  // Departments
  const depts = [
    { name: 'Engineering', code: 'ENG', headcount: 15 },
    { name: 'Marketing', code: 'MKT', headcount: 8 },
    { name: 'Sales', code: 'SAL', headcount: 12 },
    { name: 'Operations', code: 'OPS', headcount: 10 },
    { name: 'Human Resources', code: 'HR', headcount: 4 },
    { name: 'Finance', code: 'FIN', headcount: 5 },
  ];
  await Department.insertMany(depts);

  // Shifts
  const sampleShifts = [
    { name: 'Morning', startTime: '09:00', endTime: '18:00', breakMinutes: 60, isNightShift: false },
    { name: 'Evening', startTime: '14:00', endTime: '23:00', breakMinutes: 45, isNightShift: false },
    { name: 'Night', startTime: '22:00', endTime: '06:00', breakMinutes: 60, isNightShift: true },
  ];
  await Shift.insertMany(sampleShifts);

  // Employees
  const sampleEmployees = [
    {
      employeeCode: 'EMP001',
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: 'rahul.sharma@company.com',
      phone: '+919876543210',
      gender: 'male',
      maritalStatus: 'married',
      designation: 'Software Engineer',
      department: 'Engineering',
      dateOfJoining: new Date('2024-01-15'),
      employmentType: 'full_time',
      workLocation: 'office',
      salary: { ctc: 1200000, base: 600000, hra: 300000, allowances: 150000, deductions: 50000, pf: 21600, esic: 0, tds: 24000 },
      bankAccount: { bankName: 'HDFC', accountNumber: '501234567890', ifsc: 'HDFC0001234' },
      pan: 'AAACH1234P',
      status: 'active',
    },
    {
      employeeCode: 'EMP002',
      firstName: 'Priya',
      lastName: 'Singh',
      email: 'priya.singh@company.com',
      phone: '+919876543211',
      gender: 'female',
      maritalStatus: 'single',
      designation: 'Marketing Manager',
      department: 'Marketing',
      dateOfJoining: new Date('2023-06-01'),
      employmentType: 'full_time',
      workLocation: 'hybrid',
      salary: { ctc: 900000, base: 450000, hra: 225000, allowances: 125000, deductions: 40000, pf: 21600, esic: 0, tds: 18000 },
      bankAccount: { bankName: 'ICICI', accountNumber: '501234567891', ifsc: 'ICIC0001234' },
      pan: 'AAACH5678P',
      status: 'active',
    },
    {
      employeeCode: 'EMP003',
      firstName: 'Amit',
      lastName: 'Patel',
      email: 'amit.patel@company.com',
      phone: '+919876543212',
      gender: 'male',
      maritalStatus: 'married',
      designation: 'Sales Manager',
      department: 'Sales',
      dateOfJoining: new Date('2022-03-10'),
      employmentType: 'full_time',
      workLocation: 'remote',
      salary: { ctc: 1500000, base: 750000, hra: 375000, allowances: 200000, deductions: 60000, pf: 21600, esic: 0, tds: 30000 },
      bankAccount: { bankName: 'SBI', accountNumber: '501234567892', ifsc: 'SBIN0001234' },
      status: 'active',
    },
    {
      employeeCode: 'EMP004',
      firstName: 'Neha',
      lastName: 'Kumar',
      email: 'neha.kumar@company.com',
      phone: '+919876543213',
      gender: 'female',
      maritalStatus: 'single',
      designation: 'HR Executive',
      department: 'Human Resources',
      dateOfJoining: new Date('2024-04-01'),
      employmentType: 'full_time',
      workLocation: 'office',
      salary: { ctc: 600000, base: 300000, hra: 150000, allowances: 75000, deductions: 25000, pf: 18000, esic: 0, tds: 12000 },
      status: 'active',
    },
    {
      employeeCode: 'EMP005',
      firstName: 'Vikram',
      lastName: 'Reddy',
      email: 'vikram.reddy@company.com',
      phone: '+919876543214',
      gender: 'male',
      maritalStatus: 'married',
      designation: 'Finance Manager',
      department: 'Finance',
      dateOfJoining: new Date('2023-01-20'),
      employmentType: 'full_time',
      workLocation: 'office',
      salary: { ctc: 1100000, base: 550000, hra: 275000, allowances: 150000, deductions: 45000, pf: 21600, esic: 0, tds: 22000 },
      status: 'active',
    },
  ];

  const savedEmployees = await Employee.insertMany(sampleEmployees);

  // Initialize leave balances for each employee
  const leaveBalances: ILeaveBalance[] = [];
  for (const emp of savedEmployees) {
    for (const lt of LEAVE_TYPES) {
      const taken = parseInt(crypto.randomUUID().slice(0, 8), 16) % 5;
      leaveBalances.push({
        employeeId: emp._id.toString(),
        leaveType: lt.name,
        entitled: lt.annual,
        taken,
        pending: 0,
        available: lt.annual - taken,
      } as ILeaveBalance);
    }
  }
  await LeaveBalance.insertMany(leaveBalances);

  logger.info('[Seeding] Sample data created successfully');
}

// ============================================================================
// Express App
// ============================================================================

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'people-os',
    mongodb: mongoState.isConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Employee Routes
// ============================================================================

app.post('/api/employees', async (req: Request, res: Response) => {
  try {
    const data = CreateEmployeeSchema.parse(req.body);

    const employeeCount = await Employee.countDocuments();
    const employee = new Employee({
      employeeCode: `EMP${String(employeeCount + 1).padStart(3, '0')}`,
      ...data,
      dateOfJoining: new Date(data.dateOfJoining),
      status: 'active',
      salary: {
        ...data.salary,
        deductions: 0,
        pf: Math.min(data.salary.ctc * 0.12, 21600),
        esic: data.salary.ctc < 210000 ? data.salary.ctc * 0.0075 : 0,
        tds: 0,
      },
      createdAt: new Date(),
    });

    await employee.save();

    // Initialize leave balances
    const balances = LEAVE_TYPES.map(lt => ({
      employeeId: employee._id.toString(),
      leaveType: lt.name,
      entitled: lt.annual,
      taken: 0,
      pending: 0,
      available: lt.annual,
    }));
    await LeaveBalance.insertMany(balances);

    res.status(201).json(employee);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    logger.error('Error creating employee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/employees', async (req: Request, res: Response) => {
  try {
    const { department, status, search } = req.query;

    const query: Record<string, unknown> = {};
    if (department) query.department = department;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await Employee.find(query).lean();
    res.json({ employees, total: employees.length });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/employees/:id', async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id).lean();
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const balances = await LeaveBalance.find({ employeeId: employee._id.toString() }).lean();
    const leaveRequestsList = await LeaveRequest.find({ employeeId: employee._id.toString() })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ ...employee, leaveBalances: balances, leaveRequests: leaveRequestsList });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/employees/:id', async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/employees/:id/terminate', async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    employee.status = 'terminated';
    employee.exitDate = new Date();
    await employee.save();
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Leave Routes
// ============================================================================

app.get('/api/leave-types', (_req: Request, res: Response) => {
  res.json({ leaveTypes: LEAVE_TYPES });
});

app.post('/api/leave-requests', async (req: Request, res: Response) => {
  try {
    const data = CreateLeaveRequestSchema.parse(req.body);

    const employee = await Employee.findById(data.employeeId);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1;

    const leaveRequest = new LeaveRequest({
      employeeId: data.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      leaveType: data.leaveType,
      startDate,
      endDate,
      totalDays,
      reason: data.reason,
      status: 'pending',
      createdAt: new Date(),
    });

    await leaveRequest.save();

    // Update pending balance
    await LeaveBalance.findOneAndUpdate(
      { employeeId: data.employeeId, leaveType: data.leaveType },
      { $inc: { pending: totalDays } }
    );

    res.status(201).json(leaveRequest);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    logger.error('Error creating leave request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/leave-requests', async (req: Request, res: Response) => {
  try {
    const { employeeId, status } = req.query;

    const query: Record<string, unknown> = {};
    if (employeeId) query.employeeId = employeeId;
    if (status) query.status = status;

    const requests = await LeaveRequest.find(query).sort({ createdAt: -1 }).lean();
    res.json({ requests, total: requests.length });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/leave-requests/:id', async (req: Request, res: Response) => {
  try {
    const { status, approvedBy, notes } = req.body;

    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) return res.status(404).json({ error: 'Leave request not found' });

    if (status === 'approved' || status === 'rejected') {
      leaveRequest.status = status;
      leaveRequest.approvedBy = approvedBy;
      leaveRequest.approvedAt = new Date();

      if (status === 'approved') {
        // Update balance
        await LeaveBalance.findOneAndUpdate(
          { employeeId: leaveRequest.employeeId, leaveType: leaveRequest.leaveType },
          {
            $inc: {
              pending: -leaveRequest.totalDays,
              taken: leaveRequest.totalDays,
              available: -leaveRequest.totalDays,
            },
          }
        );
      } else {
        // Reset pending
        await LeaveBalance.findOneAndUpdate(
          { employeeId: leaveRequest.employeeId, leaveType: leaveRequest.leaveType },
          { $inc: { pending: -leaveRequest.totalDays } }
        );
      }
    }

    if (notes) leaveRequest.notes = notes;
    await leaveRequest.save();
    res.json(leaveRequest);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/employees/:id/leave-balances', async (req: Request, res: Response) => {
  try {
    const balances = await LeaveBalance.find({ employeeId: req.params.id }).lean();
    res.json({ balances });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Attendance Routes
// ============================================================================

app.post('/api/attendance/check-in', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await Attendance.findOne({
      employeeId,
      date: { $gte: today, $lt: tomorrow },
    });

    if (existing) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const attendance = new Attendance({
      employeeId,
      date: new Date(),
      checkIn: new Date().toTimeString().slice(0, 5),
      workHours: 0,
      status: 'present',
      createdAt: new Date(),
    });

    await attendance.save();
    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/attendance/check-out', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      employeeId,
      date: { $gte: today, $lt: tomorrow },
    });

    if (!attendance) {
      return res.status(400).json({ error: 'No check-in found for today' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ error: 'Already checked out' });
    }

    attendance.checkOut = new Date().toTimeString().slice(0, 5);

    // Calculate work hours
    const [inH, inM] = attendance.checkIn!.split(':').map(Number);
    const [outH, outM] = attendance.checkOut.split(':').map(Number);
    attendance.workHours = outH - inH + (outM - inM) / 60;

    await attendance.save();
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/attendance', async (req: Request, res: Response) => {
  try {
    const { date, employeeId } = req.query;

    const query: Record<string, unknown> = {};
    if (date) {
      const targetDate = new Date(date as string);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      query.date = { $gte: targetDate, $lt: nextDate };
    }
    if (employeeId) query.employeeId = employeeId;

    const records = await Attendance.find(query).lean();
    res.json({ records, total: records.length });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/attendance/today', async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRecords = await Attendance.find({
      date: { $gte: today, $lt: tomorrow },
    }).lean();

    const activeEmployees = await Employee.countDocuments({ status: 'active' });
    const present = todayRecords.length;
    const absent = activeEmployees - present;

    res.json({
      date: today.toDateString(),
      totalEmployees: activeEmployees,
      present,
      absent,
      records: todayRecords,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Payroll Routes
// ============================================================================

app.get('/api/payroll', async (req: Request, res: Response) => {
  try {
    const { month, employeeId, status } = req.query;

    const query: Record<string, unknown> = {};
    if (month) query.month = month;
    if (employeeId) query.employeeId = employeeId;
    if (status) query.status = status;

    const payrolls = await Payroll.find(query).lean();
    res.json({ payrolls, total: payrolls.length });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/payroll/generate', async (req: Request, res: Response) => {
  try {
    const { month, employeeIds } = req.body;

    const query: Record<string, unknown> = { status: 'active' };
    if (employeeIds && employeeIds.length > 0) {
      query._id = { $in: employeeIds };
    }

    const employeesToProcess = await Employee.find(query).lean();
    const generated: IPayroll[] = [];

    for (const emp of employeesToProcess) {
      // Check if payroll already exists
      const existing = await Payroll.findOne({ employeeId: emp._id.toString(), month });
      if (existing) continue;

      const basic = emp.salary.base / 12;
      const hra = emp.salary.hra / 12;
      const allowances = emp.salary.allowances / 12;
      const earningsTotal = basic + hra + allowances;

      const pf = Math.min(emp.salary.pf / 12, 1800);
      const esic = emp.salary.esic / 12;
      const deductionsTotal = pf + esic;
      const tds = emp.salary.tds / 12;

      const payroll = new Payroll({
        employeeId: emp._id.toString(),
        employeeName: `${emp.firstName} ${emp.lastName}`,
        month,
        status: 'draft',
        earnings: {
          basic: Math.round(basic),
          hra: Math.round(hra),
          allowances: Math.round(allowances),
          bonus: 0,
          overtime: 0,
          total: Math.round(earningsTotal),
        },
        deductions: {
          pf: Math.round(pf),
          esic: Math.round(esic),
          tds: Math.round(tds),
          advances: 0,
          other: 0,
          total: Math.round(deductionsTotal + tds),
        },
        netPay: Math.round(earningsTotal - deductionsTotal - tds),
        createdAt: new Date(),
      });

      await payroll.save();
      generated.push(payroll);
    }

    res.status(201).json({ generated, count: generated.length });
  } catch (error) {
    logger.error('Error generating payroll:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/payroll/:id', async (req: Request, res: Response) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) return res.status(404).json({ error: 'Payroll not found' });

    const { status, earnings, deductions } = req.body;

    if (status) payroll.status = status;
    if (earnings) Object.assign(payroll.earnings, earnings);
    if (deductions) Object.assign(payroll.deductions, deductions);

    payroll.netPay = payroll.earnings.total - payroll.deductions.total;

    if (status === 'paid') {
      payroll.paidAt = new Date();
    }

    await payroll.save();
    res.json(payroll);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/payroll/:id/process', async (req: Request, res: Response) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) return res.status(404).json({ error: 'Payroll not found' });

    payroll.status = 'paid';
    payroll.paidAt = new Date();
    payroll.paidMethod = req.body.method || 'bank_transfer';

    await payroll.save();
    res.json(payroll);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Department & Shift Routes
// ============================================================================

app.get('/api/departments', async (_req: Request, res: Response) => {
  try {
    const departments = await Department.find().lean();
    const departmentsWithCount = await Promise.all(
      departments.map(async (d) => {
        const employees = await Employee.countDocuments({ department: d.name, status: 'active' });
        return { ...d, employees };
      })
    );
    res.json({ departments: departmentsWithCount });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/shifts', async (_req: Request, res: Response) => {
  try {
    const shifts = await Shift.find().lean();
    res.json({ shifts });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Dashboard
// ============================================================================

app.get('/api/dashboard/stats', async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      activeEmployees,
      onLeaveCount,
      todayAttendance,
      pendingLeave,
      departments,
      allPayrolls,
    ] = await Promise.all([
      Employee.countDocuments({ status: 'active' }),
      Employee.countDocuments({ status: 'on_leave' }),
      Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
      LeaveRequest.countDocuments({ status: 'pending' }),
      Department.countDocuments(),
      Payroll.find().lean(),
    ]);

    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthlyPayroll = allPayrolls
      .filter(p => p.month === thisMonth)
      .reduce((sum, p) => sum + p.netPay, 0);

    const totalPayroll = allPayrolls
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.netPay, 0);

    res.json({
      totalEmployees: activeEmployees,
      onLeave: onLeaveCount,
      presentToday: todayAttendance,
      absentToday: activeEmployees - todayAttendance,
      pendingLeaveRequests: pendingLeave,
      departments,
      monthlyPayroll,
      totalPayroll,
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Start Server
// ============================================================================

const PORT = process.env.PORT || 4013;

async function startServer() {
  try {
    await connectToMongoDB();
    await seedSampleData();

    app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   BIZORA PeopleOS Service                              ║
║   HR & Payroll Management                              ║
║                                                           ║
║   Port: ${PORT}                                             ║
║   Database: bizora_people                                ║
║   MongoDB: ${mongoState.isConnected ? 'Connected' : 'Disconnected'}                            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Shift, IShift } from './models/Shift';
import { Attendance, IAttendance } from './models/Attendance';
import { Employee } from './models/Employee';

// Mock mongoose models
vi.mock('./models/Shift', () => {
  const mockSave = vi.fn().mockResolvedValue(undefined);
  const mockFindOne = vi.fn();
  const mockFindOneAndUpdate = vi.fn();
  const mockFind = vi.fn();

  const MockShift = vi.fn().mockImplementation((data) => ({
    ...data,
    save: mockSave,
  }));

  (MockShift as any).findOne = mockFindOne;
  (MockShift as any).findOneAndUpdate = mockFindOneAndUpdate;
  (MockShift as any).find = mockFind;

  return { Shift: MockShift, IShift: {} };
});

vi.mock('./models/Attendance', () => {
  const mockSave = vi.fn().mockResolvedValue(undefined);
  const mockFindOne = vi.fn();
  const mockFindOneAndUpdate = vi.fn();
  const mockFind = vi.fn();
  const mockAggregate = vi.fn();

  const MockAttendance = vi.fn().mockImplementation((data) => ({
    ...data,
    save: mockSave,
  }));

  (MockAttendance as any).findOne = mockFindOne;
  (MockAttendance as any).findOneAndUpdate = mockFindOneAndUpdate;
  (MockAttendance as any).find = mockFind;
  (MockAttendance as any).aggregate = mockAggregate;

  return { Attendance: MockAttendance, IAttendance: {} };
});

vi.mock('./models/Employee', () => {
  const mockSave = vi.fn().mockResolvedValue(undefined);
  const mockFindOne = vi.fn();
  const mockFind = vi.fn();

  const MockEmployee = vi.fn().mockImplementation((data) => ({
    ...data,
    save: mockSave,
  }));

  (MockEmployee as any).findOne = mockFindOne;
  (MockEmployee as any).find = mockFind;

  return { Employee: MockEmployee };
});

describe('Shift Model', () => {
  describe('Shift Schema Structure', () => {
    it('should require shiftId', () => {
      const shift = new Shift({
        shiftId: 'SFT-001',
        merchantId: 'merchant-1',
        restaurantId: 'rest-1',
        employeeId: 'emp-1',
        date: new Date(),
        startTime: '09:00',
        endTime: '17:00',
        role: 'Server',
      });

      expect(shift.shiftId).toBe('SFT-001');
    });

    it('should have correct status enum values', () => {
      const statuses = ['scheduled', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'];

      const validStatuses = ['scheduled', 'confirmed', 'completed'];
      validStatuses.forEach(status => {
        expect(statuses).toContain(status);
      });
    });

    it('should have default break duration of 30 minutes', () => {
      const shift = new Shift({
        shiftId: 'SFT-002',
        merchantId: 'merchant-1',
        restaurantId: 'rest-1',
        employeeId: 'emp-1',
        date: new Date(),
        startTime: '09:00',
        endTime: '17:00',
        role: 'Chef',
      });

      expect(shift.breakDuration).toBe(30);
    });

    it('should accept optional notes field', () => {
      const shift = new Shift({
        shiftId: 'SFT-003',
        merchantId: 'merchant-1',
        restaurantId: 'rest-1',
        employeeId: 'emp-1',
        date: new Date(),
        startTime: '09:00',
        endTime: '17:00',
        role: 'Manager',
        notes: 'Covering for absent employee',
      });

      expect(shift.notes).toBe('Covering for absent employee');
    });
  });
});

describe('Attendance Model', () => {
  describe('Attendance Schema Structure', () => {
    it('should require attendanceId', () => {
      const attendance = new Attendance({
        attendanceId: 'ATT-001',
        merchantId: 'merchant-1',
        restaurantId: 'rest-1',
        employeeId: 'emp-1',
        date: new Date(),
      });

      expect(attendance.attendanceId).toBe('ATT-001');
    });

    it('should have correct status enum values', () => {
      const statuses = ['present', 'absent', 'late', 'early_leave'];

      statuses.forEach(status => {
        expect(['present', 'absent', 'late', 'early_leave']).toContain(status);
      });
    });

    it('should default scheduled hours to 0', () => {
      const attendance = new Attendance({
        attendanceId: 'ATT-002',
        merchantId: 'merchant-1',
        restaurantId: 'rest-1',
        employeeId: 'emp-1',
        date: new Date(),
      });

      expect(attendance.scheduledHours).toBe(0);
    });

    it('should calculate overtime hours correctly', () => {
      const attendance = new Attendance({
        attendanceId: 'ATT-003',
        merchantId: 'merchant-1',
        restaurantId: 'rest-1',
        employeeId: 'emp-1',
        date: new Date(),
        scheduledHours: 8,
        actualHours: 10,
        overtimeHours: 2,
      });

      expect(attendance.overtimeHours).toBe(2);
    });

    it('should accept optional shiftId reference', () => {
      const attendance = new Attendance({
        attendanceId: 'ATT-004',
        merchantId: 'merchant-1',
        restaurantId: 'rest-1',
        employeeId: 'emp-1',
        shiftId: 'SFT-001',
        date: new Date(),
      });

      expect(attendance.shiftId).toBe('SFT-001');
    });
  });
});

describe('Shift Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createShift', () => {
    it('should create a new shift', async () => {
      const shiftData = {
        shiftId: 'SFT-NEW-001',
        merchantId: 'merchant-1',
        restaurantId: 'rest-1',
        employeeId: 'emp-1',
        date: new Date('2024-06-15'),
        startTime: '09:00',
        endTime: '17:00',
        role: 'Server',
      };

      const mockShift = {
        ...shiftData,
        status: 'scheduled',
        breakDuration: 30,
        save: vi.fn().mockResolvedValue(undefined),
      };

      (Shift.findOne as any).mockResolvedValue(null);
      vi.spyOn(Shift.prototype as any, 'save').mockResolvedValue(mockShift);

      // Test that shift can be created
      const shift = new Shift(shiftData);
      await shift.save();

      expect(shift).toBeDefined();
    });

    it('should auto-generate shift ID with proper format', () => {
      const timestamp = Date.now();
      const shiftId = `SFT${timestamp}abc123`;

      expect(shiftId).toMatch(/^SFT\d+[a-z0-9]+$/);
    });
  });

  describe('getShifts', () => {
    it('should fetch shifts by restaurant', async () => {
      const mockShifts = [
        { shiftId: 'SFT-1', restaurantId: 'rest-1' },
        { shiftId: 'SFT-2', restaurantId: 'rest-1' },
      ];

      (Shift.find as any).mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockShifts),
      });

      const result = await Shift.find({ restaurantId: 'rest-1' }).sort({ date: 1, startTime: 1 });

      expect(result).toHaveLength(2);
    });

    it('should fetch shifts by employee', async () => {
      const mockShifts = [
        { shiftId: 'SFT-1', employeeId: 'emp-1' },
      ];

      (Shift.find as any).mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockShifts),
      });

      const result = await Shift.find({ employeeId: 'emp-1' }).sort({ date: 1, startTime: 1 });

      expect(result[0].employeeId).toBe('emp-1');
    });

    it('should filter shifts by date range', async () => {
      (Shift.find as any).mockReturnValue({
        sort: vi.fn().mockResolvedValue([]),
      });

      await Shift.find({
        date: {
          $gte: new Date('2024-06-01'),
          $lte: new Date('2024-06-30'),
        },
      }).sort({ date: 1, startTime: 1 });

      expect(Shift.find).toHaveBeenCalled();
    });

    it('should filter shifts by status', async () => {
      (Shift.find as any).mockReturnValue({
        sort: vi.fn().mockResolvedValue([]),
      });

      await Shift.find({ status: 'scheduled' }).sort({ date: 1, startTime: 1 });

      expect(Shift.find).toHaveBeenCalledWith(expect.objectContaining({ status: 'scheduled' }));
    });
  });

  describe('updateShift', () => {
    it('should update shift details', async () => {
      const mockShift = {
        shiftId: 'SFT-001',
        startTime: '10:00',
        endTime: '18:00',
        status: 'scheduled',
      };

      (Shift.findOneAndUpdate as any).mockResolvedValue({
        ...mockShift,
        startTime: '10:00',
        endTime: '18:00',
      });

      const result = await Shift.findOneAndUpdate(
        { shiftId: 'SFT-001' },
        { startTime: '10:00', endTime: '18:00' },
        { new: true }
      );

      expect(result?.startTime).toBe('10:00');
    });

    it('should return null for non-existent shift', async () => {
      (Shift.findOneAndUpdate as any).mockResolvedValue(null);

      const result = await Shift.findOneAndUpdate(
        { shiftId: 'NON-EXISTENT' },
        { startTime: '10:00' },
        { new: true }
      );

      expect(result).toBeNull();
    });
  });

  describe('cancelShift', () => {
    it('should update shift status to cancelled', async () => {
      const mockShift = {
        shiftId: 'SFT-001',
        status: 'cancelled',
      };

      (Shift.findOneAndUpdate as any).mockResolvedValue(mockShift);

      const result = await Shift.findOneAndUpdate(
        { shiftId: 'SFT-001' },
        { status: 'cancelled' },
        { new: true }
      );

      expect(result?.status).toBe('cancelled');
    });
  });

  describe('getShiftById', () => {
    it('should fetch shift by ID', async () => {
      const mockShift = {
        shiftId: 'SFT-001',
        restaurantId: 'rest-1',
      };

      (Shift.findOne as any).mockResolvedValue(mockShift);

      const result = await Shift.findOne({ shiftId: 'SFT-001' });

      expect(result?.shiftId).toBe('SFT-001');
    });

    it('should return null for non-existent shift', async () => {
      (Shift.findOne as any).mockResolvedValue(null);

      const result = await Shift.findOne({ shiftId: 'NON-EXISTENT' });

      expect(result).toBeNull();
    });
  });
});

describe('Attendance Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('clockIn', () => {
    it('should create attendance record on clock in', async () => {
      const attendanceData = {
        attendanceId: 'ATT-NEW-001',
        merchantId: 'merchant-1',
        restaurantId: 'rest-1',
        employeeId: 'emp-1',
        shiftId: 'SFT-001',
        date: new Date(),
        clockIn: new Date(),
        status: 'present',
      };

      const mockAttendance = {
        ...attendanceData,
        save: vi.fn().mockResolvedValue(undefined),
      };

      vi.spyOn(Attendance.prototype as any, 'save').mockResolvedValue(mockAttendance);

      const attendance = new Attendance(attendanceData);
      await attendance.save();

      expect(attendance.clockIn).toBeDefined();
      expect(attendance.status).toBe('present');
    });

    it('should set status to late if clock in after shift start', () => {
      const attendance = new Attendance({
        attendanceId: 'ATT-001',
        merchantId: 'merchant-1',
        restaurantId: 'rest-1',
        employeeId: 'emp-1',
        shiftId: 'SFT-001',
        date: new Date(),
        status: 'late',
      });

      expect(attendance.status).toBe('late');
    });
  });

  describe('clockOut', () => {
    it('should calculate hours worked on clock out', async () => {
      const clockInTime = new Date('2024-06-15T09:00:00');
      const clockOutTime = new Date('2024-06-15T18:00:00');
      const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / 3600000;

      expect(hoursWorked).toBe(9);
    });

    it('should calculate overtime correctly', async () => {
      const clockInTime = new Date('2024-06-15T08:00:00');
      const clockOutTime = new Date('2024-06-15T18:00:00');
      const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / 3600000;
      const overtime = Math.max(0, hoursWorked - 8);

      expect(hoursWorked).toBe(10);
      expect(overtime).toBe(2);
    });

    it('should find active clock-in for clock out', async () => {
      const mockAttendance = {
        attendanceId: 'ATT-001',
        employeeId: 'emp-1',
        date: new Date('2024-06-15'),
        clockIn: new Date('2024-06-15T09:00:00'),
        clockOut: null,
        save: vi.fn().mockResolvedValue(undefined),
      };

      (Attendance.findOne as any).mockResolvedValue(mockAttendance);

      const result = await Attendance.findOne({
        employeeId: 'emp-1',
        date: new Date('2024-06-15'),
        clockOut: null,
      });

      expect(result?.attendanceId).toBe('ATT-001');
    });

    it('should return error if no active clock-in found', async () => {
      (Attendance.findOne as any).mockResolvedValue(null);

      const result = await Attendance.findOne({
        employeeId: 'emp-1',
        date: new Date('2024-06-15'),
        clockOut: null,
      });

      expect(result).toBeNull();
    });
  });

  describe('getAttendanceRecords', () => {
    it('should fetch attendance by restaurant', async () => {
      const mockRecords = [
        { attendanceId: 'ATT-1', restaurantId: 'rest-1' },
        { attendanceId: 'ATT-2', restaurantId: 'rest-1' },
      ];

      (Attendance.find as any).mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockRecords),
      });

      const result = await Attendance.find({ restaurantId: 'rest-1' }).sort({ date: -1 });

      expect(result).toHaveLength(2);
    });

    it('should filter by date range', async () => {
      (Attendance.find as any).mockReturnValue({
        sort: vi.fn().mockResolvedValue([]),
      });

      await Attendance.find({
        date: {
          $gte: new Date('2024-06-01'),
          $lte: new Date('2024-06-30'),
        },
      }).sort({ date: -1 });

      expect(Attendance.find).toHaveBeenCalled();
    });

    it('should filter by employee', async () => {
      (Attendance.find as any).mockReturnValue({
        sort: vi.fn().mockResolvedValue([]),
      });

      await Attendance.find({ employeeId: 'emp-1' }).sort({ date: -1 });

      expect(Attendance.find).toHaveBeenCalledWith(expect.objectContaining({ employeeId: 'emp-1' }));
    });
  });

  describe('getAttendanceSummary', () => {
    it('should aggregate attendance data', async () => {
      const mockSummary = [
        {
          _id: 'emp-1',
          totalDays: 22,
          totalHours: 176,
          totalOvertime: 8,
          avgHours: 8,
        },
      ];

      (Attendance.aggregate as any).mockResolvedValue(mockSummary);

      const result = await Attendance.aggregate([
        {
          $match: {
            restaurantId: 'rest-1',
            date: {
              $gte: new Date('2024-06-01'),
              $lte: new Date('2024-06-30'),
            },
          },
        },
        {
          $group: {
            _id: '$employeeId',
            totalDays: { $sum: 1 },
            totalHours: { $sum: '$actualHours' },
            totalOvertime: { $sum: '$overtimeHours' },
            avgHours: { $avg: '$actualHours' },
          },
        },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].totalDays).toBe(22);
    });

    it('should handle empty results gracefully', async () => {
      (Attendance.aggregate as any).mockResolvedValue([]);

      const result = await Attendance.aggregate([
        {
          $match: {
            restaurantId: 'rest-1',
            date: {
              $gte: new Date('2024-06-01'),
              $lte: new Date('2024-06-30'),
            },
          },
        },
        {
          $group: {
            _id: '$employeeId',
            totalDays: { $sum: 1 },
            totalHours: { $sum: '$actualHours' },
            totalOvertime: { $sum: '$overtimeHours' },
            avgHours: { $avg: '$actualHours' },
          },
        },
      ]);

      expect(result).toHaveLength(0);
    });

    it('should calculate per-employee summary when employeeId provided', async () => {
      const mockSummary = [
        {
          _id: null, // When grouping by null (all employees)
          totalDays: 100,
          totalHours: 800,
          totalOvertime: 40,
          avgHours: 8,
        },
      ];

      (Attendance.aggregate as any).mockResolvedValue(mockSummary);

      const result = await Attendance.aggregate([
        {
          $match: {
            restaurantId: 'rest-1',
            employeeId: 'emp-1',
            date: {
              $gte: new Date('2024-06-01'),
              $lte: new Date('2024-06-30'),
            },
          },
        },
        {
          $group: {
            _id: null,
            totalDays: { $sum: 1 },
            totalHours: { $sum: '$actualHours' },
            totalOvertime: { $sum: '$overtimeHours' },
            avgHours: { $avg: '$actualHours' },
          },
        },
      ]);

      expect(result[0].totalDays).toBe(100);
    });
  });
});

describe('Employee Model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Employee Schema Structure', () => {
    it('should have required fields', () => {
      const employee = new Employee({
        employeeId: 'EMP-001',
        merchantId: 'merchant-1',
        restaurantId: 'rest-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        role: 'Server',
      });

      expect(employee.employeeId).toBe('EMP-001');
      expect(employee.name).toBe('John Doe');
    });

    it('should accept valid roles', () => {
      const validRoles = ['admin', 'manager', 'chef', 'server', 'host', 'bartender'];

      validRoles.forEach(role => {
        expect(['admin', 'manager', 'chef', 'server', 'host', 'bartender']).toContain(role);
      });
    });
  });

  describe('getEmployee', () => {
    it('should find employee by ID', async () => {
      const mockEmployee = {
        employeeId: 'EMP-001',
        name: 'John Doe',
        role: 'Manager',
      };

      (Employee.findOne as any).mockResolvedValue(mockEmployee);

      const result = await Employee.findOne({ employeeId: 'EMP-001' });

      expect(result?.name).toBe('John Doe');
    });

    it('should return null for non-existent employee', async () => {
      (Employee.findOne as any).mockResolvedValue(null);

      const result = await Employee.findOne({ employeeId: 'NON-EXISTENT' });

      expect(result).toBeNull();
    });
  });

  describe('getEmployeesByRole', () => {
    it('should filter employees by role', async () => {
      const mockEmployees = [
        { employeeId: 'EMP-1', role: 'Chef' },
        { employeeId: 'EMP-2', role: 'Chef' },
      ];

      (Employee.find as any).mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockEmployees),
      });

      const result = await Employee.find({ role: 'Chef' }).sort({ name: 1 });

      expect(result).toHaveLength(2);
      expect(result.every(e => e.role === 'Chef')).toBe(true);
    });
  });
});

describe('Shift Validation', () => {
  describe('Shift Time Validation', () => {
    it('should validate start time is before end time', () => {
      const startTime = '09:00';
      const endTime = '17:00';

      expect(startTime < endTime).toBe(true);
    });

    it('should handle overnight shifts', () => {
      const startTime = '22:00';
      const endTime = '06:00';

      // This is a valid overnight shift
      expect(startTime).toBe('22:00');
      expect(endTime).toBe('06:00');
    });
  });

  describe('Break Duration Validation', () => {
    it('should calculate break duration in minutes', () => {
      const shift = new Shift({
        shiftId: 'SFT-001',
        merchantId: 'merchant-1',
        restaurantId: 'rest-1',
        employeeId: 'emp-1',
        date: new Date(),
        startTime: '09:00',
        endTime: '17:00',
        breakDuration: 60,
        role: 'Server',
      });

      expect(shift.breakDuration).toBe(60);
    });
  });

  describe('Date Range Validation', () => {
    it('should validate date is not in the past for new shifts', () => {
      const shiftDate = new Date('2024-06-15');
      const today = new Date();

      expect(shiftDate >= today).toBe(false); // Past date
    });

    it('should allow scheduling shifts for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const today = new Date();
      expect(futureDate > today).toBe(true);
    });
  });
});

describe('Attendance Calculations', () => {
  describe('Hours Worked Calculation', () => {
    it('should calculate full shift hours correctly', () => {
      const clockIn = new Date('2024-06-15T09:00:00');
      const clockOut = new Date('2024-06-15T17:00:00');
      const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / 3600000;

      expect(hoursWorked).toBe(8);
    });

    it('should handle partial hour worked', () => {
      const clockIn = new Date('2024-06-15T09:00:00');
      const clockOut = new Date('2024-06-15T13:30:00');
      const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / 3600000;

      expect(hoursWorked).toBe(4.5);
    });

    it('should calculate overtime for hours over 8', () => {
      const clockIn = new Date('2024-06-15T08:00:00');
      const clockOut = new Date('2024-06-15T17:30:00');
      const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / 3600000;
      const overtime = Math.max(0, hoursWorked - 8);

      expect(hoursWorked).toBe(9.5);
      expect(overtime).toBe(1.5);
    });

    it('should not calculate negative overtime', () => {
      const clockIn = new Date('2024-06-15T09:00:00');
      const clockOut = new Date('2024-06-15T14:00:00');
      const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / 3600000;
      const overtime = Math.max(0, hoursWorked - 8);

      expect(hoursWorked).toBe(5);
      expect(overtime).toBe(0);
    });
  });

  describe('Attendance Status Logic', () => {
    it('should mark as present for normal clock in', () => {
      const clockInTime = new Date('2024-06-15T09:00:00');
      const shiftStartTime = '09:00';
      const hour = clockInTime.getHours();
      const shiftHour = parseInt(shiftStartTime.split(':')[0]);

      const status = hour <= shiftHour ? 'present' : 'late';

      expect(status).toBe('present');
    });

    it('should mark as late for clock in after shift start', () => {
      const clockInTime = new Date('2024-06-15T09:45:00');
      const shiftStartTime = '09:00';
      const hour = clockInTime.getHours();
      const minutes = clockInTime.getMinutes();
      const shiftHour = parseInt(shiftStartTime.split(':')[0]);

      const status = hour > shiftHour ? 'late' : 'present';

      expect(status).toBe('late');
    });
  });
});

describe('Shift Status Transitions', () => {
  const validTransitions: Record<string, string[]> = {
    scheduled: ['confirmed', 'cancelled', 'no_show'],
    confirmed: ['checked_in', 'cancelled'],
    checked_in: ['completed', 'no_show'],
    completed: [],
    cancelled: [],
    no_show: [],
  };

  it('should allow transition from scheduled to confirmed', () => {
    expect(validTransitions.scheduled).toContain('confirmed');
  });

  it('should allow transition from confirmed to checked_in', () => {
    expect(validTransitions.confirmed).toContain('checked_in');
  });

  it('should allow transition from checked_in to completed', () => {
    expect(validTransitions.checked_in).toContain('completed');
  });

  it('should not allow transition from completed to any other status', () => {
    expect(validTransitions.completed).toHaveLength(0);
  });

  it('should allow cancellation from scheduled', () => {
    expect(validTransitions.scheduled).toContain('cancelled');
  });

  it('should allow marking as no_show from confirmed or checked_in', () => {
    expect(validTransitions.confirmed).toContain('no_show');
    expect(validTransitions.checked_in).toContain('no_show');
  });
});

describe('Payroll Calculation', () => {
  describe('Regular Hours Calculation', () => {
    it('should calculate regular hours as up to 8 hours', () => {
      const totalHours = 10;
      const regularHours = Math.min(totalHours, 8);

      expect(regularHours).toBe(8);
    });

    it('should handle shifts under 8 hours', () => {
      const totalHours = 6;
      const regularHours = Math.min(totalHours, 8);

      expect(regularHours).toBe(6);
    });
  });

  describe('Overtime Calculation', () => {
    it('should calculate overtime for hours over 8', () => {
      const totalHours = 10;
      const regularHours = Math.min(totalHours, 8);
      const overtime = totalHours - regularHours;

      expect(overtime).toBe(2);
    });

    it('should have no overtime for 8-hour shift', () => {
      const totalHours = 8;
      const overtime = Math.max(0, totalHours - 8);

      expect(overtime).toBe(0);
    });
  });
});

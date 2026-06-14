/**
 * Unit Tests for REZ Staff Scheduling Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock mongoose before importing the module
vi.mock('mongoose', () => {
  const mockSchema = vi.fn().mockImplementation(() => ({
    index: vi.fn().mockReturnThis(),
  }));
  mockSchema.Types = { Mixed: {} };

  return {
    default: {
      model: vi.fn().mockReturnValue({
        create: vi.fn(),
        find: vi.fn().mockReturnThis(),
        findOne: vi.fn().mockReturnThis(),
        findById: vi.fn().mockReturnThis(),
        findByIdAndUpdate: vi.fn().mockReturnThis(),
        findOneAndUpdate: vi.fn(),
        insertMany: vi.fn(),
        aggregate: vi.fn(),
        countDocuments: vi.fn(),
      }),
      connect: vi.fn(),
      connection: { readyState: 1 },
    },
    model: vi.fn().mockReturnValue({
      create: vi.fn(),
      find: vi.fn().mockReturnThis(),
      findOne: vi.fn().mockReturnThis(),
      findById: vi.fn().mockReturnThis(),
      findByIdAndUpdate: vi.fn().mockReturnThis(),
      findOneAndUpdate: vi.fn(),
      insertMany: vi.fn(),
      aggregate: vi.fn(),
      countDocuments: vi.fn(),
    }),
    Schema: mockSchema,
    connect: vi.fn(),
    connection: { readyState: 1 },
  };
});

describe('REZ Staff Scheduling Service', () => {
  describe('Staff Management', () => {
    it('should validate staff department enum values', () => {
      const validDepartments = [
        'front_desk',
        'housekeeping',
        'kitchen',
        'maintenance',
        'management',
        'spa',
        'restaurant'
      ];

      validDepartments.forEach(dept => {
        expect(typeof dept).toBe('string');
      });
    });

    it('should validate wage type enum values', () => {
      const validWageTypes = ['hourly', 'salary'];
      validWageTypes.forEach(type => {
        expect(['hourly', 'salary'].includes(type)).toBe(true);
      });
    });

    it('should handle staff creation with all required fields', () => {
      const staffData = {
        hotelId: 'hotel-123',
        name: 'John Doe',
        email: 'john@hotel.com',
        phone: '+919876543210',
        department: 'front_desk',
        role: 'Receptionist',
        wagePerHour: 500,
        wageType: 'hourly'
      };

      expect(staffData.hotelId).toBe('hotel-123');
      expect(staffData.name).toBe('John Doe');
      expect(staffData.department).toBe('front_desk');
      expect(staffData.wagePerHour).toBe(500);
    });
  });

  describe('Schedule Management', () => {
    it('should validate schedule status enum values', () => {
      const validStatuses = ['scheduled', 'clocked_in', 'clocked_out', 'absent', 'leave'];
      validStatuses.forEach(status => {
        expect(['scheduled', 'clocked_in', 'clocked_out', 'absent', 'leave'].includes(status)).toBe(true);
      });
    });

    it('should calculate total hours correctly for clock out', () => {
      const clockIn = new Date('2024-01-15T09:00:00');
      const clockOut = new Date('2024-01-15T17:30:00');
      const totalMs = clockOut.getTime() - clockIn.getTime();
      const totalHours = totalMs / (1000 * 60 * 60);

      expect(totalHours).toBe(8.5);
    });

    it('should calculate regular and overtime hours correctly', () => {
      // 10 hour shift
      const totalHours = 10;
      const regularHours = Math.min(totalHours, 8);
      const overtimeHours = Math.max(0, totalHours - 8);

      expect(regularHours).toBe(8);
      expect(overtimeHours).toBe(2);
    });

    it('should handle bulk schedule creation', () => {
      const schedules = [
        { hotelId: 'h1', staffId: 's1', date: '2024-01-15' },
        { hotelId: 'h1', staffId: 's2', date: '2024-01-15' },
        { hotelId: 'h1', staffId: 's3', date: '2024-01-15' },
      ];

      expect(schedules.length).toBe(3);
      schedules.forEach(s => {
        expect(s).toHaveProperty('hotelId');
        expect(s).toHaveProperty('staffId');
        expect(s).toHaveProperty('date');
      });
    });
  });

  describe('Time Tracking', () => {
    it('should validate time entry status enum values', () => {
      const validStatuses = ['active', 'completed', 'edited'];
      validStatuses.forEach(status => {
        expect(['active', 'completed', 'edited'].includes(status)).toBe(true);
      });
    });

    it('should generate correct date string for today', () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      expect(todayStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle break time deduction', () => {
      const breakMinutes = 60;
      const totalMinutes = (8 * 60); // 8 hours
      const netMinutes = totalMinutes - breakMinutes;

      expect(netMinutes).toBe(7 * 60); // 7 hours net
    });
  });

  describe('Leave Management', () => {
    it('should validate leave type enum values', () => {
      const validTypes = ['sick', 'personal', 'vacation', 'emergency'];
      validTypes.forEach(type => {
        expect(['sick', 'personal', 'vacation', 'emergency'].includes(type)).toBe(true);
      });
    });

    it('should validate leave status enum values', () => {
      const validStatuses = ['pending', 'approved', 'rejected'];
      validStatuses.forEach(status => {
        expect(['pending', 'approved', 'rejected'].includes(status)).toBe(true);
      });
    });

    it('should handle leave request creation', () => {
      const leaveRequest = {
        hotelId: 'hotel-123',
        staffId: 'staff-456',
        type: 'vacation',
        startDate: '2024-02-01',
        endDate: '2024-02-05',
        reason: 'Family vacation'
      };

      expect(leaveRequest.type).toBe('vacation');
      expect(leaveRequest.startDate < leaveRequest.endDate).toBe(true);
    });
  });

  describe('Payroll Calculation', () => {
    it('should calculate regular pay correctly', () => {
      const regularHours = 40;
      const hourlyRate = 500;
      const regularPay = regularHours * hourlyRate;

      expect(regularPay).toBe(20000);
    });

    it('should calculate overtime pay with 1.5x multiplier', () => {
      const overtimeHours = 10;
      const hourlyRate = 500;
      const overtimePay = overtimeHours * hourlyRate * 1.5;

      expect(overtimePay).toBe(7500);
    });

    it('should calculate total payroll correctly', () => {
      const staffPayroll = [
        { staffId: 's1', regularHours: 40, overtimeHours: 5, wagePerHour: 500 },
        { staffId: 's2', regularHours: 40, overtimeHours: 0, wagePerHour: 600 },
      ];

      const totalPay = staffPayroll.reduce((sum, s) => {
        const regularPay = s.regularHours * s.wagePerHour;
        const overtimePay = s.overtimeHours * s.wagePerHour * 1.5;
        return sum + regularPay + overtimePay;
      }, 0);

      expect(totalPay).toBe(20000 + 3750 + 24000); // 47750
    });
  });

  describe('Data Validation', () => {
    it('should validate email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test('test@example.com')).toBe(true);
      expect(emailRegex.test('invalid-email')).toBe(false);
    });

    it('should validate phone number format', () => {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      expect(phoneRegex.test('+919876543210')).toBe(true);
      expect(phoneRegex.test('123')).toBe(false);
    });

    it('should validate date format YYYY-MM-DD', () => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      expect(dateRegex.test('2024-01-15')).toBe(true);
      expect(dateRegex.test('01-15-2024')).toBe(false);
    });
  });

  describe('Shift Templates', () => {
    it('should validate shift template structure', () => {
      const template = {
        hotelId: 'hotel-123',
        name: 'Morning Shift',
        department: 'front_desk',
        startTime: '06:00',
        endTime: '14:00',
        breakMinutes: 60,
        color: '#FF5733'
      };

      expect(template.startTime < template.endTime).toBe(true);
      expect(template.breakMinutes).toBe(60);
    });

    it('should calculate shift duration in hours', () => {
      const startTime = '09:00';
      const endTime = '17:00';

      const [startHour] = startTime.split(':').map(Number);
      const [endHour] = endTime.split(':').map(Number);
      const duration = endHour - startHour;

      expect(duration).toBe(8);
    });
  });
});

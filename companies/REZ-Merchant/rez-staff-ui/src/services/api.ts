import {
  Staff,
  Shift,
  Attendance,
  Performance,
  ShiftSwap,
  DashboardStats,
  StaffRole,
  StaffStatus,
  AttendanceStatus,
  SwapStatus,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Simulated delay for mock data
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data store
const mockStaff: Staff[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah@rez.com', phone: '555-0101', role: 'manager', status: 'active', hireDate: '2022-03-15', hourlyRate: 25, department: 'Management' },
  { id: '2', name: 'Mike Chen', email: 'mike@rez.com', phone: '555-0102', role: 'bartender', status: 'active', hireDate: '2023-01-10', hourlyRate: 18, department: 'Bar' },
  { id: '3', name: 'Emily Davis', email: 'emily@rez.com', phone: '555-0103', role: 'server', status: 'active', hireDate: '2023-06-20', hourlyRate: 16, department: 'Service' },
  { id: '4', name: 'James Wilson', email: 'james@rez.com', phone: '555-0104', role: 'bartender', status: 'active', hireDate: '2022-11-05', hourlyRate: 18, department: 'Bar' },
  { id: '5', name: 'Lisa Anderson', email: 'lisa@rez.com', phone: '555-0105', role: 'host', status: 'active', hireDate: '2024-01-15', hourlyRate: 14, department: 'Front Desk' },
  { id: '6', name: 'David Martinez', email: 'david@rez.com', phone: '555-0106', role: 'server', status: 'active', hireDate: '2023-09-01', hourlyRate: 16, department: 'Service' },
  { id: '7', name: 'Rachel Brown', email: 'rachel@rez.com', phone: '555-0107', role: 'cook', status: 'active', hireDate: '2022-05-12', hourlyRate: 20, department: 'Kitchen' },
  { id: '8', name: 'Tom Taylor', email: 'tom@rez.com', phone: '555-0108', role: 'busser', status: 'active', hireDate: '2024-02-01', hourlyRate: 13, department: 'Service' },
  { id: '9', name: 'Amy Garcia', email: 'amy@rez.com', phone: '555-0109', role: 'security', status: 'active', hireDate: '2023-04-18', hourlyRate: 17, department: 'Security' },
  { id: '10', name: 'Chris Lee', email: 'chris@rez.com', phone: '555-0110', role: 'bartender', status: 'on_leave', hireDate: '2023-07-22', hourlyRate: 18, department: 'Bar' },
];

const generateShifts = (): Shift[] => {
  const shifts: Shift[] = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    mockStaff.forEach(staff => {
      if (staff.status === 'active' && Math.random() > 0.3) {
        const isManager = staff.role === 'manager';
        const shiftTimes = isManager
          ? { start: '09:00', end: '17:00' }
          : Math.random() > 0.5
          ? { start: '11:00', end: '19:00' }
          : { start: '17:00', end: '23:00' };

        shifts.push({
          id: `shift-${i}-${staff.id}`,
          staffId: staff.id,
          staffName: staff.name,
          date: dateStr,
          startTime: shiftTimes.start,
          endTime: shiftTimes.end,
          role: staff.role,
          status: i === 0 ? 'in_progress' : i === 1 ? 'scheduled' : 'scheduled',
        });
      }
    });
  }

  return shifts;
};

const generateAttendance = (): Attendance[] => {
  const today = new Date().toISOString().split('T')[0];
  const attendance: Attendance[] = [];

  mockStaff.forEach(staff => {
    if (staff.status === 'active') {
      const random = Math.random();
      let status: AttendanceStatus = 'present';
      let checkIn = '09:00';
      let checkOut: string | null = '17:00';

      if (random < 0.1) {
        status = 'absent';
        checkIn = null;
        checkOut = null;
      } else if (random < 0.15) {
        status = 'late';
        checkIn = '09:30';
      } else if (random < 0.2) {
        status = 'half_day';
        checkOut = '13:00';
      }

      attendance.push({
        id: `att-${staff.id}-${today}`,
        staffId: staff.id,
        staffName: staff.name,
        date: today,
        checkIn,
        checkOut,
        status,
        overtimeMinutes: Math.floor(Math.random() * 60),
      });
    }
  });

  return attendance;
};

const generatePerformance = (): Performance[] => {
  return mockStaff
    .filter(s => s.status === 'active')
    .map(staff => ({
      staffId: staff.id,
      staffName: staff.name,
      period: 'May 2026',
      totalShifts: 20 + Math.floor(Math.random() * 10),
      completedShifts: 18 + Math.floor(Math.random() * 10),
      attendanceRate: 85 + Math.random() * 15,
      tipsCollected: Math.floor(Math.random() * 500) + 100,
      bonusesEarned: Math.floor(Math.random() * 200),
      rating: 3.5 + Math.random() * 1.5,
    }))
    .sort((a, b) => b.rating - a.rating)
    .map((p, index) => ({ ...p, rank: index + 1 }));
};

const generateSwapRequests = (): ShiftSwap[] => {
  return [
    {
      id: 'swap-1',
      requesterId: '2',
      requesterName: 'Mike Chen',
      targetId: '4',
      targetName: 'James Wilson',
      requesterShiftId: 'shift-2-2',
      targetShiftId: 'shift-2-4',
      requesterShiftDate: '2026-05-13',
      targetShiftDate: '2026-05-14',
      status: 'pending',
      reason: 'Personal appointment',
      createdAt: '2026-05-10T10:00:00Z',
    },
    {
      id: 'swap-2',
      requesterId: '3',
      requesterName: 'Emily Davis',
      targetId: '6',
      targetName: 'David Martinez',
      requesterShiftId: 'shift-3-3',
      targetShiftId: 'shift-3-6',
      requesterShiftDate: '2026-05-15',
      targetShiftDate: '2026-05-16',
      status: 'pending',
      reason: 'Family event',
      createdAt: '2026-05-09T14:30:00Z',
    },
    {
      id: 'swap-3',
      requesterId: '5',
      requesterName: 'Lisa Anderson',
      targetId: '8',
      targetName: 'Tom Taylor',
      requesterShiftId: 'shift-1-5',
      targetShiftId: 'shift-1-8',
      requesterShiftDate: '2026-05-12',
      targetShiftDate: '2026-05-12',
      status: 'approved',
      createdAt: '2026-05-08T09:00:00Z',
      respondedAt: '2026-05-08T11:00:00Z',
    },
  ];
};

let shifts = generateShifts();
let attendance = generateAttendance();
let performance = generatePerformance();
let swapRequests = generateSwapRequests();

// API functions
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP error ${response.status}`);
  }
  return response.json();
}

// Staff API
export const staffApi = {
  getAll: async (): Promise<Staff[]> => {
    await delay(300);
    return mockStaff;
  },

  getById: async (id: string): Promise<Staff | undefined> => {
    await delay(200);
    return mockStaff.find(s => s.id === id);
  },

  create: async (data: Omit<Staff, 'id'>): Promise<Staff> => {
    await delay(400);
    const newStaff: Staff = { ...data, id: String(mockStaff.length + 1) };
    mockStaff.push(newStaff);
    return newStaff;
  },

  update: async (id: string, data: Partial<Staff>): Promise<Staff> => {
    await delay(400);
    const index = mockStaff.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Staff not found');
    mockStaff[index] = { ...mockStaff[index], ...data };
    return mockStaff[index];
  },

  delete: async (id: string): Promise<void> => {
    await delay(300);
    const index = mockStaff.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Staff not found');
    mockStaff.splice(index, 1);
  },

  filter: async (filters: { role?: StaffRole; status?: StaffStatus; search?: string }): Promise<Staff[]> => {
    await delay(200);
    return mockStaff.filter(staff => {
      if (filters.role && staff.role !== filters.role) return false;
      if (filters.status && staff.status !== filters.status) return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        if (!staff.name.toLowerCase().includes(search) && !staff.email.toLowerCase().includes(search)) {
          return false;
        }
      }
      return true;
    });
  },
};

// Shift API
export const shiftApi = {
  getAll: async (): Promise<Shift[]> => {
    await delay(300);
    return shifts;
  },

  getByDate: async (date: string): Promise<Shift[]> => {
    await delay(200);
    return shifts.filter(s => s.date === date);
  },

  getByStaff: async (staffId: string): Promise<Shift[]> => {
    await delay(200);
    return shifts.filter(s => s.staffId === staffId);
  },

  create: async (data: Omit<Shift, 'id'>): Promise<Shift> => {
    await delay(400);
    const newShift: Shift = { ...data, id: `shift-${Date.now()}` };
    shifts.push(newShift);
    return newShift;
  },

  update: async (id: string, data: Partial<Shift>): Promise<Shift> => {
    await delay(400);
    const index = shifts.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Shift not found');
    shifts[index] = { ...shifts[index], ...data };
    return shifts[index];
  },

  delete: async (id: string): Promise<void> => {
    await delay(300);
    const index = shifts.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Shift not found');
    shifts.splice(index, 1);
  },

  assign: async (staffId: string, shiftId: string): Promise<Shift> => {
    await delay(300);
    const shift = shifts.find(s => s.id === shiftId);
    const staff = mockStaff.find(s => s.id === staffId);
    if (!shift || !staff) throw new Error('Shift or staff not found');
    shift.staffId = staffId;
    shift.staffName = staff.name;
    return shift;
  },
};

// Attendance API
export const attendanceApi = {
  getAll: async (): Promise<Attendance[]> => {
    await delay(300);
    return attendance;
  },

  getByDate: async (date: string): Promise<Attendance[]> => {
    await delay(200);
    return attendance.filter(a => a.date === date);
  },

  getByStaff: async (staffId: string): Promise<Attendance[]> => {
    await delay(200);
    return attendance.filter(a => a.staffId === staffId);
  },

  checkIn: async (staffId: string): Promise<Attendance> => {
    await delay(300);
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    let record = attendance.find(a => a.staffId === staffId && a.date === today);
    if (record) {
      record.checkIn = now;
      record.status = parseInt(now.split(':')[0]) >= 9 && parseInt(now.split(':')[0]) < 10 ? 'late' : 'present';
      return record;
    }

    const staff = mockStaff.find(s => s.id === staffId);
    if (!staff) throw new Error('Staff not found');

    const newRecord: Attendance = {
      id: `att-${staffId}-${today}`,
      staffId,
      staffName: staff.name,
      date: today,
      checkIn: now,
      checkOut: null,
      status: parseInt(now.split(':')[0]) >= 9 && parseInt(now.split(':')[0]) < 10 ? 'late' : 'present',
      overtimeMinutes: 0,
    };
    attendance.push(newRecord);
    return newRecord;
  },

  checkOut: async (staffId: string): Promise<Attendance> => {
    await delay(300);
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    const record = attendance.find(a => a.staffId === staffId && a.date === today);
    if (!record) throw new Error('No attendance record found. Please check in first.');

    record.checkOut = now;
    return record;
  },

  update: async (id: string, data: Partial<Attendance>): Promise<Attendance> => {
    await delay(400);
    const index = attendance.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Attendance record not found');
    attendance[index] = { ...attendance[index], ...data };
    return attendance[index];
  },
};

// Performance API
export const performanceApi = {
  getAll: async (): Promise<Performance[]> => {
    await delay(300);
    return performance;
  },

  getByStaff: async (staffId: string): Promise<Performance | undefined> => {
    await delay(200);
    return performance.find(p => p.staffId === staffId);
  },

  getLeaderboard: async (limit: number = 10): Promise<Performance[]> => {
    await delay(200);
    return performance.slice(0, limit);
  },
};

// Shift Swap API
export const swapApi = {
  getAll: async (): Promise<ShiftSwap[]> => {
    await delay(300);
    return swapRequests;
  },

  getPending: async (): Promise<ShiftSwap[]> => {
    await delay(200);
    return swapRequests.filter(s => s.status === 'pending');
  },

  create: async (data: Omit<ShiftSwap, 'id' | 'status' | 'createdAt'>): Promise<ShiftSwap> => {
    await delay(400);
    const newSwap: ShiftSwap = {
      ...data,
      id: `swap-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    swapRequests.push(newSwap);
    return newSwap;
  },

  respond: async (id: string, approved: boolean): Promise<ShiftSwap> => {
    await delay(300);
    const swap = swapRequests.find(s => s.id === id);
    if (!swap) throw new Error('Swap request not found');
    swap.status = approved ? 'approved' : 'rejected';
    swap.respondedAt = new Date().toISOString();
    return swap;
  },

  cancel: async (id: string): Promise<void> => {
    await delay(300);
    const index = swapRequests.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Swap request not found');
    swapRequests[index].status = 'cancelled';
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    await delay(200);
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a => a.date === today);
    const pendingSwaps = swapRequests.filter(s => s.status === 'pending');

    return {
      staffOnDuty: todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length,
      totalStaff: mockStaff.filter(s => s.status === 'active').length,
      presentToday: todayAttendance.filter(a => a.status === 'present').length,
      absentToday: todayAttendance.filter(a => a.status === 'absent').length,
      lateToday: todayAttendance.filter(a => a.status === 'late').length,
      upcomingShifts: shifts.filter(s => s.status === 'scheduled').length,
      pendingSwaps: pendingSwaps.length,
    };
  },
};

export { mockStaff };

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  status: StaffStatus;
  avatar?: string;
  hireDate: string;
  hourlyRate: number;
  department: string;
}

export type StaffRole = 'manager' | 'bartender' | 'server' | 'host' | 'cook' | 'busser' | 'security';

export type StaffStatus = 'active' | 'inactive' | 'on_leave' | 'suspended';

export interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  role: StaffRole;
  status: ShiftStatus;
  notes?: string;
}

export type ShiftStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Attendance {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  overtimeMinutes: number;
  notes?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'sick' | 'vacation';

export interface Performance {
  staffId: string;
  staffName: string;
  period: string;
  totalShifts: number;
  completedShifts: number;
  attendanceRate: number;
  tipsCollected: number;
  bonusesEarned: number;
  rating: number;
  rank?: number;
}

export interface ShiftSwap {
  id: string;
  requesterId: string;
  requesterName: string;
  targetId: string;
  targetName: string;
  requesterShiftId: string;
  targetShiftId: string;
  requesterShiftDate: string;
  targetShiftDate: string;
  status: SwapStatus;
  reason?: string;
  createdAt: string;
  respondedAt?: string;
}

export type SwapStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface DashboardStats {
  staffOnDuty: number;
  totalStaff: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  upcomingShifts: number;
  pendingSwaps: number;
}

// ==========================================
// CorpPerks Manager App - API Service
// ==========================================

import {
  Manager,
  TeamMember,
  AttendanceRecord,
  AttendanceSummary,
  LeaveRequest,
  LeavePolicy,
  OKR,
  PerformanceReview,
  Meeting,
  ActionItem,
  DashboardStats,
  TeamReport,
  ApiResponse,
  PaginatedResponse,
} from '../types';

// API Base URL - update for production
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4006';
const INTERNAL_TOKEN = process.env.EXPO_PUBLIC_INTERNAL_TOKEN || 'manager-app-internal-token';

// ==========================================
// Mock Data for Development
// ==========================================

const mockManager: Manager = {
  id: 'mgr-001',
  name: 'Priya Sharma',
  email: 'priya.sharma@corpperks.com',
  phone: '+91 98765 43210',
  department: 'Engineering',
  designation: 'Engineering Manager',
  companyId: 'comp-001',
  companyName: 'CorpPerks',
  avatar: 'https://i.pravatar.cc/150?u=priya',
};

const mockTeamMembers: TeamMember[] = [
  {
    id: 'emp-001',
    name: 'Rahul Verma',
    email: 'rahul.verma@corpperks.com',
    phone: '+91 98765 43201',
    department: 'Engineering',
    designation: 'Senior Software Engineer',
    managerId: 'mgr-001',
    avatar: 'https://i.pravatar.cc/150?u=rahul',
    joinDate: '2023-01-15',
    status: 'active',
    leaveBalance: { sick: 10, casual: 12, earned: 15, wfh: 8, total: 45 },
    attendanceStatus: 'present',
    performanceScore: 4.5,
  },
  {
    id: 'emp-002',
    name: 'Sneha Patel',
    email: 'sneha.patel@corpperks.com',
    phone: '+91 98765 43202',
    department: 'Engineering',
    designation: 'Software Engineer',
    managerId: 'mgr-001',
    avatar: 'https://i.pravatar.cc/150?u=sneha',
    joinDate: '2023-06-01',
    status: 'active',
    leaveBalance: { sick: 8, casual: 10, earned: 12, wfh: 6, total: 36 },
    attendanceStatus: 'wfh',
    performanceScore: 4.2,
  },
  {
    id: 'emp-003',
    name: 'Amit Kumar',
    email: 'amit.kumar@corpperks.com',
    phone: '+91 98765 43203',
    department: 'Engineering',
    designation: 'Software Engineer',
    managerId: 'mgr-001',
    avatar: 'https://i.pravatar.cc/150?u=amit',
    joinDate: '2024-02-20',
    status: 'active',
    leaveBalance: { sick: 12, casual: 14, earned: 10, wfh: 8, total: 44 },
    attendanceStatus: 'late',
    performanceScore: 3.8,
  },
  {
    id: 'emp-004',
    name: 'Neha Singh',
    email: 'neha.singh@corpperks.com',
    phone: '+91 98765 43204',
    department: 'Engineering',
    designation: 'Junior Software Engineer',
    managerId: 'mgr-001',
    avatar: 'https://i.pravatar.cc/150?u=neha',
    joinDate: '2024-08-15',
    status: 'probation',
    leaveBalance: { sick: 6, casual: 6, earned: 6, wfh: 4, total: 22 },
    attendanceStatus: 'present',
    performanceScore: 4.0,
  },
  {
    id: 'emp-005',
    name: 'Vikram Rao',
    email: 'vikram.rao@corpperks.com',
    phone: '+91 98765 43205',
    department: 'Engineering',
    designation: 'Tech Lead',
    managerId: 'mgr-001',
    avatar: 'https://i.pravatar.cc/150?u=vikram',
    joinDate: '2022-03-10',
    status: 'active',
    leaveBalance: { sick: 14, casual: 15, earned: 18, wfh: 10, total: 57 },
    attendanceStatus: 'present',
    performanceScore: 4.8,
  },
];

const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 'leave-001',
    employeeId: 'emp-001',
    employeeName: 'Rahul Verma',
    employeeAvatar: 'https://i.pravatar.cc/150?u=rahul',
    type: 'sick',
    startDate: '2026-06-05',
    endDate: '2026-06-07',
    days: 3,
    reason: 'Medical appointment and recovery',
    status: 'pending',
    appliedOn: '2026-05-28',
    leaveBalanceAtTime: { sick: 10, casual: 12, earned: 15, wfh: 8, total: 45 },
  },
  {
    id: 'leave-002',
    employeeId: 'emp-002',
    employeeName: 'Sneha Patel',
    employeeAvatar: 'https://i.pravatar.cc/150?u=sneha',
    type: 'casual',
    startDate: '2026-06-10',
    endDate: '2026-06-12',
    days: 3,
    reason: 'Family wedding',
    status: 'pending',
    appliedOn: '2026-05-29',
    leaveBalanceAtTime: { sick: 8, casual: 10, earned: 12, wfh: 6, total: 36 },
  },
  {
    id: 'leave-003',
    employeeId: 'emp-003',
    employeeName: 'Amit Kumar',
    employeeAvatar: 'https://i.pravatar.cc/150?u=amit',
    type: 'earned',
    startDate: '2026-06-15',
    endDate: '2026-06-19',
    days: 5,
    reason: 'Vacation plans',
    status: 'approved',
    appliedOn: '2026-05-20',
    reviewedBy: 'mgr-001',
    reviewedByName: 'Priya Sharma',
    reviewedOn: '2026-05-21',
    reviewComment: 'Approved. Enjoy your vacation!',
    leaveBalanceAtTime: { sick: 12, casual: 14, earned: 10, wfh: 8, total: 44 },
  },
];

const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: 'att-001',
    employeeId: 'emp-001',
    employeeName: 'Rahul Verma',
    date: '2026-05-30',
    checkIn: '09:15',
    checkOut: '18:30',
    hoursWorked: 9.25,
    type: 'GPS',
    status: 'present',
  },
  {
    id: 'att-002',
    employeeId: 'emp-002',
    employeeName: 'Sneha Patel',
    date: '2026-05-30',
    checkIn: '09:00',
    checkOut: null,
    hoursWorked: 0,
    type: 'WFH',
    status: 'wfh',
  },
  {
    id: 'att-003',
    employeeId: 'emp-003',
    employeeName: 'Amit Kumar',
    date: '2026-05-30',
    checkIn: '10:30',
    checkOut: null,
    hoursWorked: 0,
    type: 'GPS',
    status: 'late',
  },
  {
    id: 'att-004',
    employeeId: 'emp-004',
    employeeName: 'Neha Singh',
    date: '2026-05-30',
    checkIn: '09:05',
    checkOut: null,
    hoursWorked: 0,
    type: 'GPS',
    status: 'present',
  },
  {
    id: 'att-005',
    employeeId: 'emp-005',
    employeeName: 'Vikram Rao',
    date: '2026-05-30',
    checkIn: '08:50',
    checkOut: null,
    hoursWorked: 0,
    type: 'GPS',
    status: 'present',
  },
];

const mockMeetings: Meeting[] = [
  {
    id: 'meet-001',
    title: '1:1 with Rahul Verma',
    description: 'Weekly sync to discuss progress and blockers',
    scheduledStart: '2026-05-30T14:00:00',
    scheduledEnd: '2026-05-30T14:30:00',
    duration: 30,
    hostId: 'mgr-001',
    hostName: 'Priya Sharma',
    attendeeId: 'emp-001',
    attendeeName: 'Rahul Verma',
    attendeeAvatar: 'https://i.pravatar.cc/150?u=rahul',
    type: '1on1',
    meetingType: 'video',
    meetingLink: 'https://meet.corpperks.com/abc123',
    status: 'scheduled',
    agenda: 'Review Q2 OKRs progress\nDiscuss career growth\nAction items follow-up',
    actionItems: [],
  },
  {
    id: 'meet-002',
    title: '1:1 with Sneha Patel',
    description: 'Project feedback and guidance',
    scheduledStart: '2026-05-30T16:00:00',
    scheduledEnd: '2026-05-30T16:30:00',
    duration: 30,
    hostId: 'mgr-001',
    hostName: 'Priya Sharma',
    attendeeId: 'emp-002',
    attendeeName: 'Sneha Patel',
    attendeeAvatar: 'https://i.pravatar.cc/150?u=sneha',
    type: '1on1',
    meetingType: 'video',
    meetingLink: 'https://meet.corpperks.com/def456',
    status: 'scheduled',
    actionItems: [],
  },
];

const mockOKRs: OKR[] = [
  {
    id: 'okr-001',
    employeeId: 'emp-001',
    employeeName: 'Rahul Verma',
    quarter: 'Q2',
    year: 2026,
    overallProgress: 65,
    status: 'active',
    objectives: [
      {
        id: 'obj-001',
        title: 'Ship new payment feature',
        description: 'Complete payment integration for the new checkout flow',
        progress: 70,
        keyResults: [
          { id: 'kr-001', title: 'API integration', target: 100, current: 80, unit: '%', progress: 80 },
          { id: 'kr-002', title: 'Unit tests', target: 100, current: 60, unit: '%', progress: 60 },
          { id: 'kr-003', title: 'Documentation', target: 100, current: 70, unit: '%', progress: 70 },
        ],
      },
      {
        id: 'obj-002',
        title: 'Improve code quality',
        description: 'Reduce tech debt and improve test coverage',
        progress: 60,
        keyResults: [
          { id: 'kr-004', title: 'Test coverage', target: 80, current: 55, unit: '%', progress: 69 },
          { id: 'kr-005', title: 'Code reviews', target: 20, current: 15, unit: 'reviews', progress: 75 },
        ],
      },
    ],
  },
];

// ==========================================
// API Client Class
// ==========================================

class ApiService {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': this.token,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data || data };
      }

      return { success: false, error: data.message || 'Request failed' };
    } catch (error) {
      logger.error('API Error:', error);
      // Return mock data in development
      return { success: true, data: null as unknown as T };
    }
  }

  // Manager APIs
  async getManager(): Promise<ApiResponse<Manager>> {
    return { success: true, data: mockManager };
  }

  // Team APIs
  async getTeamMembers(): Promise<ApiResponse<TeamMember[]>> {
    return { success: true, data: mockTeamMembers };
  }

  async getTeamMember(memberId: string): Promise<ApiResponse<TeamMember | undefined>> {
    const member = mockTeamMembers.find((m) => m.id === memberId);
    return { success: true, data: member };
  }

  // Attendance APIs
  async getAttendanceRecords(
    date?: string
  ): Promise<ApiResponse<AttendanceRecord[]>> {
    return { success: true, data: mockAttendanceRecords };
  }

  async getAttendanceSummary(
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<AttendanceSummary[]>> {
    const summaries: AttendanceSummary[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      summaries.push({
        date: d.toISOString().split('T')[0],
        total: 5,
        present: 4,
        absent: 0,
        late: 1,
        halfDay: 0,
        wfh: 1,
        weekOff: 0,
        holiday: 0,
      });
    }

    return { success: true, data: summaries };
  }

  async getPendingAttendanceCorrections(): Promise<
    ApiResponse<AttendanceRecord[]>
  > {
    const pending = mockAttendanceRecords.filter(
      (r) => r.correction?.status === 'pending'
    );
    return { success: true, data: pending };
  }

  async approveAttendanceCorrection(
    recordId: string,
    comment?: string
  ): Promise<ApiResponse<boolean>> {
    return { success: true, data: true };
  }

  async rejectAttendanceCorrection(
    recordId: string,
    comment: string
  ): Promise<ApiResponse<boolean>> {
    return { success: true, data: true };
  }

  // Leave APIs
  async getLeaveRequests(status?: string): Promise<ApiResponse<LeaveRequest[]>> {
    if (status === 'pending') {
      return {
        success: true,
        data: mockLeaveRequests.filter((r) => r.status === 'pending'),
      };
    }
    return { success: true, data: mockLeaveRequests };
  }

  async getLeavePolicies(): Promise<ApiResponse<LeavePolicy[]>> {
    const policies: LeavePolicy[] = [
      {
        id: 'policy-001',
        name: 'Sick Leave',
        type: 'sick',
        maxDays: 14,
        accrualRate: 1.5,
        carryForward: true,
        maxCarryForward: 7,
      },
      {
        id: 'policy-002',
        name: 'Casual Leave',
        type: 'casual',
        maxDays: 12,
        accrualRate: 1,
        carryForward: false,
        maxCarryForward: 0,
      },
      {
        id: 'policy-003',
        name: 'Earned Leave',
        type: 'earned',
        maxDays: 20,
        accrualRate: 1.67,
        carryForward: true,
        maxCarryForward: 10,
      },
    ];
    return { success: true, data: policies };
  }

  async approveLeave(
    requestId: string,
    comment?: string
  ): Promise<ApiResponse<boolean>> {
    return { success: true, data: true };
  }

  async rejectLeave(
    requestId: string,
    comment: string
  ): Promise<ApiResponse<boolean>> {
    return { success: true, data: true };
  }

  // Performance APIs
  async getTeamOKRs(): Promise<ApiResponse<OKR[]>> {
    return { success: true, data: mockOKRs };
  }

  async getPerformanceReviews(
    employeeId?: string
  ): Promise<ApiResponse<PerformanceReview[]>> {
    return { success: true, data: [] };
  }

  async getPromotionCandidates(): Promise<
    ApiResponse<{ employee: TeamMember; score: number }[]>
  > {
    const candidates = mockTeamMembers
      .filter((m) => m.performanceScore && m.performanceScore >= 4.5)
      .map((m) => ({ employee: m, score: m.performanceScore || 0 }));
    return { success: true, data: candidates };
  }

  // Meeting APIs
  async getMeetings(status?: string): Promise<ApiResponse<Meeting[]>> {
    if (status === 'upcoming') {
      return { success: true, data: mockMeetings };
    }
    return { success: true, data: mockMeetings };
  }

  async getUpcomingMeetings(): Promise<ApiResponse<Meeting[]>> {
    return { success: true, data: mockMeetings };
  }

  async scheduleMeeting(
    meeting: Partial<Meeting>
  ): Promise<ApiResponse<Meeting>> {
    const newMeeting: Meeting = {
      id: `meet-${Date.now()}`,
      title: meeting.title || '1:1 Meeting',
      scheduledStart: meeting.scheduledStart || new Date().toISOString(),
      scheduledEnd: meeting.scheduledEnd || new Date().toISOString(),
      duration: meeting.duration || 30,
      hostId: 'mgr-001',
      hostName: 'Priya Sharma',
      attendeeId: meeting.attendeeId || '',
      attendeeName: meeting.attendeeName || '',
      type: '1on1',
      meetingType: 'video',
      status: 'scheduled',
      actionItems: [],
    };
    return { success: true, data: newMeeting };
  }

  async cancelMeeting(meetingId: string): Promise<ApiResponse<boolean>> {
    return { success: true, data: true };
  }

  async getActionItems(status?: string): Promise<ApiResponse<ActionItem[]>> {
    return { success: true, data: [] };
  }

  async updateActionItemStatus(
    itemId: string,
    status: string
  ): Promise<ApiResponse<boolean>> {
    return { success: true, data: true };
  }

  // Dashboard APIs
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    const stats: DashboardStats = {
      teamSize: mockTeamMembers.length,
      todayAttendance: {
        present: 3,
        absent: 0,
        late: 1,
        wfh: 1,
      },
      pendingApprovals: {
        leave: 2,
        attendance: 0,
        overtime: 1,
      },
      upcomingMeetings: mockMeetings,
      recentActivity: [
        {
          id: 'act-001',
          type: 'leave_request',
          title: 'New Leave Request',
          description: 'Rahul Verma requested 3 days sick leave',
          timestamp: '2026-05-28T10:30:00',
          employeeId: 'emp-001',
          employeeName: 'Rahul Verma',
          status: 'pending',
        },
        {
          id: 'act-002',
          type: 'meeting_completed',
          title: '1:1 Meeting Completed',
          description: 'Meeting with Vikram Rao completed',
          timestamp: '2026-05-29T15:00:00',
          employeeId: 'emp-005',
          employeeName: 'Vikram Rao',
          status: 'completed',
        },
        {
          id: 'act-003',
          type: 'feedback_received',
          title: '360 Feedback Received',
          description: 'New feedback from peer for Rahul Verma',
          timestamp: '2026-05-29T09:00:00',
          employeeId: 'emp-001',
          employeeName: 'Rahul Verma',
          status: 'new',
        },
      ],
    };
    return { success: true, data: stats };
  }

  // Reports APIs
  async getTeamReport(
    type: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<TeamReport>> {
    const report: TeamReport = {
      type: type as 'attendance' | 'leave' | 'performance' | 'overview',
      generatedAt: new Date().toISOString(),
      period: { start: startDate, end: endDate },
      summary: {
        totalMembers: 5,
        avgAttendance: 92,
        avgPerformance: 4.26,
        pendingApprovals: 2,
      },
      data: [],
    };
    return { success: true, data: report };
  }
}

// Export singleton instance
export const api = new ApiService(API_BASE_URL, INTERNAL_TOKEN);
export default api;

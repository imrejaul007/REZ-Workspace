// ==========================================
// CorpPerks Manager App - Type Definitions
// ==========================================

// Manager Types
export interface Manager {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  companyId: string;
  companyName: string;
  avatar?: string;
}

// Team Member Types
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  managerId: string;
  avatar?: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'on-leave' | 'probation';
  leaveBalance: LeaveBalance;
  attendanceStatus?: AttendanceStatus;
  performanceScore?: number;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half-day' | 'week-off' | 'holiday' | 'wfh';

// Attendance Types
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  hoursWorked: number;
  type: 'GPS' | 'QR' | 'FACE' | 'WFH';
  status: AttendanceStatus;
  location?: {
    latitude: number;
    longitude: number;
  };
  correction?: AttendanceCorrection;
}

export interface AttendanceCorrection {
  id: string;
  requestedAt: string;
  requestedBy: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
}

export interface AttendanceSummary {
  date: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  wfh: number;
  weekOff: number;
  holiday: number;
}

// Leave Types
export interface LeaveBalance {
  sick: number;
  casual: number;
  earned: number;
  wfh: number;
  total: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  type: 'sick' | 'casual' | 'earned' | 'wfh' | 'parental' | 'bereavement';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedOn?: string;
  reviewComment?: string;
  leaveBalanceAtTime: LeaveBalance;
}

export interface LeavePolicy {
  id: string;
  name: string;
  type: string;
  maxDays: number;
  accrualRate: number;
  carryForward: boolean;
  maxCarryForward: number;
}

// Performance Types
export interface OKR {
  id: string;
  employeeId: string;
  employeeName: string;
  quarter: string;
  year: number;
  objectives: Objective[];
  overallProgress: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
}

export interface Objective {
  id: string;
  title: string;
  description?: string;
  keyResults: KeyResult[];
  progress: number;
}

export interface KeyResult {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  progress: number;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  reviewerId: string;
  reviewerName: string;
  period: string;
  status: 'draft' | 'self_review' | 'manager_review' | 'calibration' | 'completed';
  ratings: {
    category: string;
    rating: number;
    comment?: string;
  }[];
  overallRating: number;
  strengths: string[];
  improvements: string[];
  goals: string[];
  finalComment?: string;
  createdAt: string;
  submittedAt?: string;
}

export interface Feedback360 {
  id: string;
  requestId: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  revieweeName: string;
  relationship: 'manager' | 'peer' | 'direct_report' | 'self';
  ratings: {
    category: string;
    rating: number;
  }[];
  overallRating: number;
  comments: string;
  submittedAt: string;
}

export interface PromotionCandidate {
  employeeId: string;
  employeeName: string;
  currentRole: string;
  targetRole: string;
  readinessScore: number;
  avgPerformanceRating: number;
  tenure: string;
  keyStrengths: string[];
  developmentAreas: string[];
  recommendation: 'promote_now' | 'promote_6m' | 'develop_first';
}

// 1:1 Meeting Types
export interface OneOnOne {
  id: string;
  managerId: string;
  managerName: string;
  managerAvatar?: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  status: 'active' | 'paused' | 'ended';
  frequency: 'weekly' | 'biweekly' | 'monthly';
  nextMeeting?: string;
  lastMeeting?: string;
  duration: number;
  stats: {
    totalMeetings: number;
    completedMeetings: number;
    pendingActionItems: number;
    completionRate: number;
  };
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  scheduledStart: string;
  scheduledEnd: string;
  duration: number;
  hostId: string;
  hostName: string;
  attendeeId: string;
  attendeeName: string;
  attendeeAvatar?: string;
  type: '1on1' | 'skip_level' | 'team';
  meetingType: 'video' | 'audio' | 'in_person' | 'phone';
  meetingLink?: string;
  location?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  agenda?: string;
  actionItems: ActionItem[];
}

export interface ActionItem {
  id: string;
  meetingId: string;
  task: string;
  assigneeId: string;
  assigneeName: string;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completedAt?: string;
  createdAt: string;
}

// Reports Types
export interface TeamReport {
  type: 'attendance' | 'leave' | 'performance' | 'overview';
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalMembers: number;
    avgAttendance: number;
    avgPerformance: number;
    pendingApprovals: number;
  };
  data: ReportDataPoint[];
}

export interface ReportDataPoint {
  label: string;
  value: number;
  trend?: number;
  breakdown?: {
    label: string;
    value: number;
  }[];
}

// Dashboard Types
export interface DashboardStats {
  teamSize: number;
  todayAttendance: {
    present: number;
    absent: number;
    late: number;
    wfh: number;
  };
  pendingApprovals: {
    leave: number;
    attendance: number;
    overtime: number;
  };
  upcomingMeetings: Meeting[];
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: 'leave_request' | 'attendance_correction' | 'performance_review' | 'meeting_completed' | 'feedback_received';
  title: string;
  description: string;
  timestamp: string;
  employeeId?: string;
  employeeName?: string;
  status?: string;
}

// Navigation Types
export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Team: undefined;
  Attendance: undefined;
  Leave: undefined;
  Performance: undefined;
  OneOnOne: undefined;
  Reports: undefined;
};

export type TeamStackParamList = {
  TeamList: undefined;
  TeamMemberDetail: { memberId: string };
};

export type AttendanceStackParamList = {
  AttendanceOverview: undefined;
  AttendanceReview: undefined;
  AttendanceCalendar: undefined;
};

export type LeaveStackParamList = {
  LeaveOverview: undefined;
  LeaveApprovals: undefined;
  LeavePolicy: undefined;
};

export type PerformanceStackParamList = {
  PerformanceOverview: undefined;
  OKRReview: undefined;
  Feedback360: undefined;
  PromotionReadiness: undefined;
};

export type OneOnOneStackParamList = {
  OneOnOneOverview: undefined;
  ScheduleMeeting: { employeeId?: string };
  MeetingDetail: { meetingId: string };
  ActionItems: undefined;
};

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

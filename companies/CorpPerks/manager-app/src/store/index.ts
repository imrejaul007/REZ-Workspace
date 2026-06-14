// ==========================================
// CorpPerks Manager App - State Management
// ==========================================

import { create } from 'zustand';
import {
  Manager,
  TeamMember,
  LeaveRequest,
  Meeting,
  DashboardStats,
  AttendanceRecord,
  OKR,
} from '../types';

interface AppState {
  // Auth state
  manager: Manager | null;
  isAuthenticated: boolean;
  setManager: (manager: Manager | null) => void;
  setAuthenticated: (isAuth: boolean) => void;

  // Team state
  teamMembers: TeamMember[];
  selectedMember: TeamMember | null;
  setTeamMembers: (members: TeamMember[]) => void;
  setSelectedMember: (member: TeamMember | null) => void;

  // Leave state
  leaveRequests: LeaveRequest[];
  pendingLeaveCount: number;
  setLeaveRequests: (requests: LeaveRequest[]) => void;
  setPendingLeaveCount: (count: number) => void;
  updateLeaveRequest: (id: string, status: 'approved' | 'rejected') => void;

  // Attendance state
  attendanceRecords: AttendanceRecord[];
  pendingCorrectionsCount: number;
  setAttendanceRecords: (records: AttendanceRecord[]) => void;
  setPendingCorrectionsCount: (count: number) => void;

  // Meeting state
  upcomingMeetings: Meeting[];
  setUpcomingMeetings: (meetings: Meeting[]) => void;
  addMeeting: (meeting: Meeting) => void;

  // OKRs
  teamOKRs: OKR[];
  setTeamOKRs: (okrs: OKR[]) => void;

  // Dashboard
  dashboardStats: DashboardStats | null;
  setDashboardStats: (stats: DashboardStats | null) => void;

  // Loading states
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  manager: null,
  isAuthenticated: false,
  teamMembers: [],
  selectedMember: null,
  leaveRequests: [],
  pendingLeaveCount: 0,
  attendanceRecords: [],
  pendingCorrectionsCount: 0,
  upcomingMeetings: [],
  teamOKRs: [],
  dashboardStats: null,
  isLoading: false,
  error: null,
};

export const useStore = create<AppState>((set) => ({
  // Auth
  ...initialState,
  setManager: (manager) => set({ manager }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  // Team
  setTeamMembers: (teamMembers) => set({ teamMembers }),
  setSelectedMember: (selectedMember) => set({ selectedMember }),

  // Leave
  setLeaveRequests: (leaveRequests) =>
    set({
      leaveRequests,
      pendingLeaveCount: leaveRequests.filter((r) => r.status === 'pending').length,
    }),
  setPendingLeaveCount: (pendingLeaveCount) => set({ pendingLeaveCount }),
  updateLeaveRequest: (id, status) =>
    set((state) => ({
      leaveRequests: state.leaveRequests.map((r) =>
        r.id === id
          ? { ...r, status, reviewedOn: new Date().toISOString() }
          : r
      ),
      pendingLeaveCount: state.pendingLeaveCount - 1,
    })),

  // Attendance
  setAttendanceRecords: (attendanceRecords) => set({ attendanceRecords }),
  setPendingCorrectionsCount: (pendingCorrectionsCount) =>
    set({ pendingCorrectionsCount }),

  // Meetings
  setUpcomingMeetings: (upcomingMeetings) => set({ upcomingMeetings }),
  addMeeting: (meeting) =>
    set((state) => ({
      upcomingMeetings: [...state.upcomingMeetings, meeting],
    })),

  // OKRs
  setTeamOKRs: (teamOKRs) => set({ teamOKRs }),

  // Dashboard
  setDashboardStats: (dashboardStats) => set({ dashboardStats }),

  // Loading
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Reset
  reset: () => set(initialState),
}));

export default useStore;

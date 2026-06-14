// ==========================================
// MyTalent Employee Life OS - Zustand Store
// ==========================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Employee,
  AttendanceRecord,
  LeaveBalance,
  LeaveRequest,
  Payslip,
  CorpIDProfile,
  Benefit,
  PartnerOffer,
  FinancialHealth,
  Task,
  ProductivityStats,
  CareerProgress,
  SkillGap,
  InternalJob,
  AIChatMessage,
} from '../types';

// ==========================================
// Store State Types
// ==========================================

interface UserState {
  employee: Employee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastSync: string | null;
}

interface AttendanceState {
  isCheckedIn: boolean;
  checkInTime: string | null;
  currentLocation: { latitude: number; longitude: number } | null;
  todayAttendance: AttendanceRecord | null;
  attendanceHistory: AttendanceRecord[];
  isLoading: boolean;
}

interface LeaveState {
  balance: LeaveBalance | null;
  requests: LeaveRequest[];
  isLoading: boolean;
}

interface PayrollState {
  payslips: Payslip[];
  currentPayslip: Payslip | null;
  isLoading: boolean;
}

interface BenefitsState {
  benefits: Benefit[];
  offers: PartnerOffer[];
  totalValue: number;
  activeCount: number;
  isLoading: boolean;
}

interface CorpIDState {
  profile: CorpIDProfile | null;
  isLoading: boolean;
}

interface MoneyState {
  financialHealth: FinancialHealth | null;
  salaryAdvances: any[];
  isLoading: boolean;
}

interface CareerState {
  progress: CareerProgress | null;
  skillGaps: SkillGap[];
  internalJobs: InternalJob[];
  chatHistory: AIChatMessage[];
  isLoading: boolean;
}

interface TaskState {
  tasks: Task[];
  productivityStats: ProductivityStats | null;
  isLoading: boolean;
}

interface AppState {
  // User
  user: UserState;
  // Attendance
  attendance: AttendanceState;
  // Leave
  leave: LeaveState;
  // Payroll
  payroll: PayrollState;
  // Benefits
  benefits: BenefitsState;
  // CorpID
  corpId: CorpIDState;
  // Money
  money: MoneyState;
  // Career
  career: CareerState;
  // Tasks
  tasks: TaskState;
  // UI State
  activeTab: string;
  notifications: { id: string; title: string; body: string; read: boolean }[];
}

// ==========================================
// Store Actions Types
// ==========================================

interface AppActions {
  // User Actions
  setEmployee: (employee: Employee | null) => void;
  setAuthenticated: (isAuth: boolean) => void;
  setLoading: (isLoading: boolean) => void;

  // Attendance Actions
  checkIn: (location?: { latitude: number; longitude: number }) => void;
  checkOut: () => void;
  setAttendanceHistory: (records: AttendanceRecord[]) => void;
  setTodayAttendance: (record: AttendanceRecord | null) => void;

  // Leave Actions
  setLeaveBalance: (balance: LeaveBalance | null) => void;
  setLeaveRequests: (requests: LeaveRequest[]) => void;
  addLeaveRequest: (request: LeaveRequest) => void;
  updateLeaveRequest: (id: string, updates: Partial<LeaveRequest>) => void;

  // Payroll Actions
  setPayslips: (payslips: Payslip[]) => void;
  setCurrentPayslip: (payslip: Payslip | null) => void;

  // Benefits Actions
  setBenefits: (benefits: Benefit[]) => void;
  setOffers: (offers: PartnerOffer[]) => void;
  setBenefitsSummary: (totalValue: number, activeCount: number) => void;

  // CorpID Actions
  setCorpIDProfile: (profile: CorpIDProfile | null) => void;

  // Money Actions
  setFinancialHealth: (health: FinancialHealth | null) => void;
  setSalaryAdvances: (advances: any[]) => void;

  // Career Actions
  setCareerProgress: (progress: CareerProgress | null) => void;
  setSkillGaps: (gaps: SkillGap[]) => void;
  setInternalJobs: (jobs: InternalJob[]) => void;
  addChatMessage: (message: AIChatMessage) => void;
  clearChatHistory: () => void;

  // Task Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  completeTask: (id: string) => void;
  setProductivityStats: (stats: ProductivityStats | null) => void;

  // UI Actions
  setActiveTab: (tab: string) => void;
  addNotification: (notification: { title: string; body: string }) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // General Actions
  reset: () => void;
  syncData: () => void;
}

// ==========================================
// Initial State
// ==========================================

const initialUserState: UserState = {
  employee: null,
  isAuthenticated: false,
  isLoading: false,
  lastSync: null,
};

const initialAttendanceState: AttendanceState = {
  isCheckedIn: false,
  checkInTime: null,
  currentLocation: null,
  todayAttendance: null,
  attendanceHistory: [],
  isLoading: false,
};

const initialLeaveState: LeaveState = {
  balance: null,
  requests: [],
  isLoading: false,
};

const initialPayrollState: PayrollState = {
  payslips: [],
  currentPayslip: null,
  isLoading: false,
};

const initialBenefitsState: BenefitsState = {
  benefits: [],
  offers: [],
  totalValue: 0,
  activeCount: 0,
  isLoading: false,
};

const initialCorpIDState: CorpIDState = {
  profile: null,
  isLoading: false,
};

const initialMoneyState: MoneyState = {
  financialHealth: null,
  salaryAdvances: [],
  isLoading: false,
};

const initialCareerState: CareerState = {
  progress: null,
  skillGaps: [],
  internalJobs: [],
  chatHistory: [],
  isLoading: false,
};

const initialTaskState: TaskState = {
  tasks: [],
  productivityStats: null,
  isLoading: false,
};

// ==========================================
// Create Store
// ==========================================

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      // Initial State
      user: initialUserState,
      attendance: initialAttendanceState,
      leave: initialLeaveState,
      payroll: initialPayrollState,
      benefits: initialBenefitsState,
      corpId: initialCorpIDState,
      money: initialMoneyState,
      career: initialCareerState,
      tasks: initialTaskState,
      activeTab: 'Home',
      notifications: [],

      // ==========================================
      // User Actions
      // ==========================================

      setEmployee: (employee) =>
        set((state) => ({
          user: { ...state.user, employee },
        })),

      setAuthenticated: (isAuthenticated) =>
        set((state) => ({
          user: { ...state.user, isAuthenticated },
        })),

      setLoading: (isLoading) =>
        set((state) => ({
          user: { ...state.user, isLoading },
        })),

      // ==========================================
      // Attendance Actions
      // ==========================================

      checkIn: (location) => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });

        set((state) => ({
          attendance: {
            ...state.attendance,
            isCheckedIn: true,
            checkInTime: timeStr,
            currentLocation: location || state.attendance.currentLocation,
            todayAttendance: {
              id: `att-${Date.now()}`,
              date: now.toISOString().split('T')[0],
              checkIn: timeStr,
              checkOut: null,
              hoursWorked: 0,
              type: location ? 'GPS' : 'WFH',
              status: new Date().getHours() < 10 ? 'present' : 'late',
            },
          },
        }));
      },

      checkOut: () => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });

        set((state) => {
          const checkInTime = state.attendance.checkInTime;
          let hoursWorked = 0;

          if (checkInTime) {
            const [inHour, inMin] = checkInTime.split(':').map(Number);
            const [outHour, outMin] = timeStr.split(':').map(Number);
            hoursWorked = (outHour + outMin / 60) - (inHour + inMin / 60);
          }

          return {
            attendance: {
              ...state.attendance,
              isCheckedIn: false,
              checkInTime: null,
              todayAttendance: state.attendance.todayAttendance
                ? {
                    ...state.attendance.todayAttendance,
                    checkOut: timeStr,
                    hoursWorked,
                  }
                : null,
            },
          };
        });
      },

      setAttendanceHistory: (records) =>
        set((state) => ({
          attendance: { ...state.attendance, attendanceHistory: records },
        })),

      setTodayAttendance: (record) =>
        set((state) => ({
          attendance: { ...state.attendance, todayAttendance: record },
        })),

      // ==========================================
      // Leave Actions
      // ==========================================

      setLeaveBalance: (balance) =>
        set((state) => ({
          leave: { ...state.leave, balance },
        })),

      setLeaveRequests: (requests) =>
        set((state) => ({
          leave: { ...state.leave, requests },
        })),

      addLeaveRequest: (request) =>
        set((state) => ({
          leave: {
            ...state.leave,
            requests: [request, ...state.leave.requests],
          },
        })),

      updateLeaveRequest: (id, updates) =>
        set((state) => ({
          leave: {
            ...state.leave,
            requests: state.leave.requests.map((r) =>
              r.id === id ? { ...r, ...updates } : r
            ),
          },
        })),

      // ==========================================
      // Payroll Actions
      // ==========================================

      setPayslips: (payslips) =>
        set((state) => ({
          payroll: { ...state.payroll, payslips },
        })),

      setCurrentPayslip: (currentPayslip) =>
        set((state) => ({
          payroll: { ...state.payroll, currentPayslip },
        })),

      // ==========================================
      // Benefits Actions
      // ==========================================

      setBenefits: (benefits) =>
        set((state) => ({
          benefits: { ...state.benefits, benefits },
        })),

      setOffers: (offers) =>
        set((state) => ({
          benefits: { ...state.benefits, offers },
        })),

      setBenefitsSummary: (totalValue, activeCount) =>
        set((state) => ({
          benefits: { ...state.benefits, totalValue, activeCount },
        })),

      // ==========================================
      // CorpID Actions
      // ==========================================

      setCorpIDProfile: (profile) =>
        set((state) => ({
          corpId: { ...state.corpId, profile },
        })),

      // ==========================================
      // Money Actions
      // ==========================================

      setFinancialHealth: (health) =>
        set((state) => ({
          money: { ...state.money, financialHealth: health },
        })),

      setSalaryAdvances: (advances) =>
        set((state) => ({
          money: { ...state.money, salaryAdvances: advances },
        })),

      // ==========================================
      // Career Actions
      // ==========================================

      setCareerProgress: (progress) =>
        set((state) => ({
          career: { ...state.career, progress },
        })),

      setSkillGaps: (gaps) =>
        set((state) => ({
          career: { ...state.career, skillGaps: gaps },
        })),

      setInternalJobs: (jobs) =>
        set((state) => ({
          career: { ...state.career, internalJobs: jobs },
        })),

      addChatMessage: (message) =>
        set((state) => ({
          career: {
            ...state.career,
            chatHistory: [...state.career.chatHistory, message],
          },
        })),

      clearChatHistory: () =>
        set((state) => ({
          career: { ...state.career, chatHistory: [] },
        })),

      // ==========================================
      // Task Actions
      // ==========================================

      setTasks: (tasks) =>
        set((state) => ({
          tasks: { ...state.tasks, tasks },
        })),

      addTask: (task) =>
        set((state) => ({
          tasks: { ...state.tasks, tasks: [task, ...state.tasks.tasks] },
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: {
            ...state.tasks,
            tasks: state.tasks.tasks.map((t) =>
              t.id === id ? { ...t, ...updates } : t
            ),
          },
        })),

      completeTask: (id) =>
        set((state) => ({
          tasks: {
            ...state.tasks,
            tasks: state.tasks.tasks.map((t) =>
              t.id === id
                ? { ...t, status: 'completed' as const, progress: 100 }
                : t
            ),
          },
        })),

      setProductivityStats: (stats) =>
        set((state) => ({
          tasks: { ...state.tasks, productivityStats: stats },
        })),

      // ==========================================
      // UI Actions
      // ==========================================

      setActiveTab: (tab) => set({ activeTab: tab }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              id: `notif-${Date.now()}`,
              ...notification,
              read: false,
            },
            ...state.notifications,
          ],
        })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      clearNotifications: () => set({ notifications: [] }),

      // ==========================================
      // General Actions
      // ==========================================

      reset: () =>
        set({
          user: initialUserState,
          attendance: initialAttendanceState,
          leave: initialLeaveState,
          payroll: initialPayrollState,
          benefits: initialBenefitsState,
          corpId: initialCorpIDState,
          money: initialMoneyState,
          career: initialCareerState,
          tasks: initialTaskState,
          activeTab: 'Home',
          notifications: [],
        }),

      syncData: () =>
        set((state) => ({
          user: { ...state.user, lastSync: new Date().toISOString() },
        })),
    }),
    {
      name: 'mytalent-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        attendance: {
          isCheckedIn: state.attendance.isCheckedIn,
          checkInTime: state.attendance.checkInTime,
        },
        notifications: state.notifications,
      }),
    }
  )
);

// ==========================================
// Selector Hooks
// ==========================================

export const useEmployee = () => useAppStore((state) => state.user.employee);
export const useIsAuthenticated = () =>
  useAppStore((state) => state.user.isAuthenticated);
export const useIsCheckedIn = () =>
  useAppStore((state) => state.attendance.isCheckedIn);
export const useCheckInTime = () =>
  useAppStore((state) => state.attendance.checkInTime);
export const useLeaveBalance = () => useAppStore((state) => state.leave.balance);
export const useLeaveRequests = () =>
  useAppStore((state) => state.leave.requests);
export const usePayslips = () => useAppStore((state) => state.payroll.payslips);
export const useBenefits = () => useAppStore((state) => state.benefits.benefits);
export const useOffers = () => useAppStore((state) => state.benefits.offers);
export const useCorpIDProfile = () =>
  useAppStore((state) => state.corpId.profile);
export const useFinancialHealth = () =>
  useAppStore((state) => state.money.financialHealth);
export const useCareerProgress = () =>
  useAppStore((state) => state.career.progress);
export const useTasks = () => useAppStore((state) => state.tasks.tasks);
export const useProductivityStats = () =>
  useAppStore((state) => state.tasks.productivityStats);
export const useNotifications = () =>
  useAppStore((state) => state.notifications);

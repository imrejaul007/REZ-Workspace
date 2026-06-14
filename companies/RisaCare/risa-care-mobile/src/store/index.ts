// RisaCare Mobile - Zustand Store

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface HealthProfile {
  profileId: string;
  name: string;
  relationship: string;
  isPrimary: boolean;
}

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Profile
  activeProfile: HealthProfile | null;
  profiles: HealthProfile[];

  // UI State
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setActiveProfile: (profile: HealthProfile | null) => void;
  setProfiles: (profiles: HealthProfile[]) => void;
  addProfile: (profile: HealthProfile) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      activeProfile: null,
      profiles: [],
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user }),

      setToken: (token) => set({
        token,
        isAuthenticated: !!token
      }),

      setActiveProfile: (profile) => set({ activeProfile: profile }),

      setProfiles: (profiles) => set({ profiles }),

      addProfile: (profile) => set((state) => ({
        profiles: [...state.profiles, profile]
      })),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
        activeProfile: null,
        profiles: [],
        error: null
      })
    }),
    {
      name: 'risa-care-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        activeProfile: state.activeProfile,
        profiles: state.profiles,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Health Records Store
interface RecordState {
  records: any[];
  selectedRecord: any | null;
  biomarkerHistory: Record<string, any[]>;

  setRecords: (records: any[]) => void;
  addRecord: (record: any) => void;
  setSelectedRecord: (record: any | null) => void;
  setBiomarkerHistory: (biomarker: string, history: any[]) => void;
  clearRecords: () => void;
}

export const useRecordStore = create<RecordState>((set) => ({
  records: [],
  selectedRecord: null,
  biomarkerHistory: {},

  setRecords: (records) => set({ records }),
  addRecord: (record) => set((state) => ({
    records: [record, ...state.records]
  })),
  setSelectedRecord: (record) => set({ selectedRecord: record }),
  setBiomarkerHistory: (biomarker, history) => set((state) => ({
    biomarkerHistory: { ...state.biomarkerHistory, [biomarker]: history }
  })),
  clearRecords: () => set({ records: [], selectedRecord: null })
}));

// Wellness Store
interface WellnessState {
  healthScore: number | null;
  habits: Record<string, any>;
  cycleData: any | null;
  activeChallenges: any[];

  setHealthScore: (score: number) => void;
  setHabits: (habits: Record<string, any>) => void;
  setCycleData: (data: any) => void;
  setActiveChallenges: (challenges: any[]) => void;
}

export const useWellnessStore = create<WellnessState>((set) => ({
  healthScore: null,
  habits: {},
  cycleData: null,
  activeChallenges: [],

  setHealthScore: (score) => set({ healthScore: score }),
  setHabits: (habits) => set({ habits }),
  setCycleData: (data) => set({ cycleData: data }),
  setActiveChallenges: (challenges) => set({ activeChallenges: challenges })
}));

// Medication Store
interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  isActive: boolean;
  takenToday: boolean[];
  remainingPills?: number;
}

interface MedicationState {
  medications: MedicationItem[];
  todayProgress: { taken: number; total: number };
  setMedications: (medications: MedicationItem[]) => void;
  markDoseTaken: (id: string, doseIndex: number) => void;
}

export const useMedicationStore = create<MedicationState>((set) => ({
  medications: [],
  todayProgress: { taken: 0, total: 0 },

  setMedications: (medications) => {
    let taken = 0;
    let total = 0;
    medications.forEach(m => {
      if (m.isActive) {
        total += m.times.length;
        taken += m.takenToday.filter(Boolean).length;
      }
    });
    set({ medications, todayProgress: { taken, total } });
  },

  markDoseTaken: (id, doseIndex) =>
    set(state => {
      const meds = state.medications.map(m => {
        if (m.id === id) {
          const takenToday = [...m.takenToday];
          takenToday[doseIndex] = true;
          return { ...m, takenToday };
        }
        return m;
      });
      let taken = 0;
      let total = 0;
      meds.forEach(m => {
        if (m.isActive) {
          total += m.times.length;
          taken += m.takenToday.filter(Boolean).length;
        }
      });
      return { medications: meds, todayProgress: { taken, total } };
    })
}));

// Pregnancy Store
interface PregnancyData {
  id?: string;
  dueDate?: string;
  currentWeek?: number;
  trimester?: string;
  checkups: any[];
  ultrasounds: any[];
}

interface PregnancyState {
  pregnancy: PregnancyData | null;
  setPregnancy: (pregnancy: PregnancyData | null) => void;
  addCheckup: (checkup: any) => void;
  addUltrasound: (ultrasound: any) => void;
}

export const usePregnancyStore = create<PregnancyState>((set) => ({
  pregnancy: null,

  setPregnancy: (pregnancy) => set({ pregnancy }),

  addCheckup: (checkup) =>
    set(state => ({
      pregnancy: state.pregnancy
        ? { ...state.pregnancy, checkups: [...state.pregnancy.checkups, checkup] }
        : null
    })),

  addUltrasound: (ultrasound) =>
    set(state => ({
      pregnancy: state.pregnancy
        ? { ...state.pregnancy, ultrasounds: [...state.pregnancy.ultrasounds, ultrasound] }
        : null
    }))
}));

// Vaccination Store
interface VaccineItem {
  id: string;
  vaccineName: string;
  doseNumber: number;
  totalDoses: number;
  dueDate: string;
  completedDate?: string;
  status: 'pending' | 'due' | 'completed' | 'overdue';
}

interface ChildVaccineRecord {
  id: string;
  childName: string;
  vaccines: VaccineItem[];
}

interface VaccinationState {
  records: ChildVaccineRecord[];
  setRecords: (records: ChildVaccineRecord[]) => void;
  markVaccineComplete: (recordId: string, vaccineId: string) => void;
}

export const useVaccinationStore = create<VaccinationState>((set) => ({
  records: [],

  setRecords: (records) => set({ records }),

  markVaccineComplete: (recordId, vaccineId) =>
    set(state => ({
      records: state.records.map(r => {
        if (r.id === recordId) {
          return {
            ...r,
            vaccines: r.vaccines.map(v =>
              v.id === vaccineId
                ? { ...v, status: 'completed' as const, completedDate: new Date().toISOString() }
                : v
            )
          };
        }
        return r;
      })
    }))
}));

// Alert Store
interface HealthAlert {
  id: string;
  type: 'warning' | 'urgent' | 'info';
  title: string;
  message: string;
  createdAt: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

interface AlertState {
  alerts: HealthAlert[];
  unreadCount: number;
  setAlerts: (alerts: HealthAlert[]) => void;
  markAsRead: (id: string) => void;
  dismissAlert: (id: string) => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  unreadCount: 0,

  setAlerts: (alerts) => set({ alerts, unreadCount: alerts.filter(a => a.status === 'active').length }),

  markAsRead: (id) =>
    set(state => ({
      alerts: state.alerts.map(a =>
        a.id === id ? { ...a, status: 'acknowledged' as const } : a
      ),
      unreadCount: state.alerts.filter(a => a.status === 'active' && a.id !== id).length
    })),

  dismissAlert: (id) =>
    set(state => ({
      alerts: state.alerts.filter(a => a.id !== id),
      unreadCount: state.alerts.filter(a => a.status === 'active' && a.id !== id).length
    }))
}));

// CorpID Zustand Store

import { create } from 'zustand';
import { CorpIdUser, CIScore, VerificationRequest, PassportEntry, Badge, TrustConnection } from '../types';
import {
  mockUser,
  mockCIScore,
  mockVerifications,
  mockPassportEntries,
  mockBadges,
  mockTrustConnections,
} from '../utils/mockData';

interface AppState {
  // User state
  user: CorpIdUser | null;
  setUser: (user: CorpIdUser | null) => void;

  // CI Score state
  ciScore: CIScore | null;
  setCIScore: (score: CIScore | null) => void;

  // Verifications
  verifications: VerificationRequest[];
  setVerifications: (verifications: VerificationRequest[]) => void;
  addVerification: (verification: VerificationRequest) => void;

  // Passport entries
  passportEntries: PassportEntry[];
  setPassportEntries: (entries: PassportEntry[]) => void;
  addPassportEntry: (entry: PassportEntry) => void;

  // Badges
  badges: Badge[];
  setBadges: (badges: Badge[]) => void;

  // Trust connections
  trustConnections: TrustConnection[];
  setTrustConnections: (connections: TrustConnection[]) => void;

  // Loading state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Initialize with mock data
  initializeMockData: () => void;

  // Auth state
  isAuthenticated: boolean;
  token: string | null;
  setAuth: (token: string | null, user: CorpIdUser | null) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // User state
  user: null,
  setUser: (user) => set({ user }),

  // CI Score state
  ciScore: null,
  setCIScore: (ciScore) => set({ ciScore }),

  // Verifications
  verifications: [],
  setVerifications: (verifications) => set({ verifications }),
  addVerification: (verification) =>
    set((state) => ({ verifications: [...state.verifications, verification] })),

  // Passport entries
  passportEntries: [],
  setPassportEntries: (passportEntries) => set({ passportEntries }),
  addPassportEntry: (entry) =>
    set((state) => ({ passportEntries: [...state.passportEntries, entry] })),

  // Badges
  badges: [],
  setBadges: (badges) => set({ badges }),

  // Trust connections
  trustConnections: [],
  setTrustConnections: (trustConnections) => set({ trustConnections }),

  // Loading state
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),

  // Initialize with mock data
  initializeMockData: () =>
    set({
      user: mockUser,
      ciScore: mockCIScore,
      verifications: mockVerifications,
      passportEntries: mockPassportEntries,
      badges: mockBadges,
      trustConnections: mockTrustConnections,
    }),

  // Auth state
  isAuthenticated: false,
  token: null,
  setAuth: (token, user) => set({ isAuthenticated: !!token, token, user }),
  logout: () =>
    set({
      isAuthenticated: false,
      token: null,
      user: null,
      ciScore: null,
      verifications: [],
      passportEntries: [],
      badges: [],
      trustConnections: [],
    }),
}));

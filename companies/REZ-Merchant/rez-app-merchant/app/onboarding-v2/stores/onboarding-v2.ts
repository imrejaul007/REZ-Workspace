/**
 * Onboarding V2 Store
 * Zustand store for managing streamlined onboarding state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { logger } from '@/utils/logger';

// Types
export interface BusinessInfo {
  businessName: string;
  ownerName: string;
  phone: string;
  email?: string;
  businessType: string;
  businessCategory: string;
  storeName?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface ServiceSelection {
  onlineOrdering: boolean;
  scanAndPay: boolean;
  loyaltyStamps: boolean;
  menuQr: boolean;
  tableReservations: boolean;
  delivery: boolean;
}

export interface QuickSetup {
  menuItems?: Array<{
    name: string;
    price: number;
    category: string;
  }>;
  timeSlots?: string[];
  qrGenerated?: boolean;
}

export interface OnboardingState {
  // Progress tracking
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];

  // Form data
  businessInfo: Partial<BusinessInfo>;
  serviceSelection: Partial<ServiceSelection>;
  quickSetup: Partial<QuickSetup>;
  bankDetailsSkipped: boolean;
  documentsSkipped: boolean;

  // QR codes generated
  qrCodes: {
    menu?: string;
    payment?: string;
    table?: string;
  };

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  canGoBack: () => boolean;

  // Business info actions
  setBusinessInfo: (info: Partial<BusinessInfo>) => void;
  autoFillFromGSTIN: (gstin: string, data: Partial<BusinessInfo>) => void;
  autoFillFromLocation: (location: { address: string; city: string; state: string }) => void;

  // Service selection actions
  setServiceSelection: (services: Partial<ServiceSelection>) => void;
  applySmartDefaults: (category: string) => void;

  // Quick setup actions
  setQuickSetup: (setup: Partial<QuickSetup>) => void;
  generateQRCodes: () => Promise<void>;

  // Optional steps
  skipBankDetails: () => void;
  skipDocuments: () => void;

  // Completion
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => void;

  // Persistence
  loadProgress: () => Promise<void>;
  saveProgress: () => Promise<void>;
  exitOnboarding: () => void;
}

// Service defaults by category
const serviceDefaults: Record<string, ServiceSelection> = {
  'Food & Beverage': {
    onlineOrdering: true,
    scanAndPay: true,
    loyaltyStamps: true,
    menuQr: true,
    tableReservations: false,
    delivery: false,
  },
  Retail: {
    onlineOrdering: false,
    scanAndPay: true,
    loyaltyStamps: true,
    menuQr: false,
    tableReservations: false,
    delivery: false,
  },
  Hotel: {
    onlineOrdering: false,
    scanAndPay: false,
    loyaltyStamps: false,
    menuQr: true,
    tableReservations: true,
    delivery: true,
  },
  Services: {
    onlineOrdering: false,
    scanAndPay: true,
    loyaltyStamps: true,
    menuQr: false,
    tableReservations: false,
    delivery: false,
  },
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 0,
      totalSteps: 4,
      completedSteps: [],

      businessInfo: {},
      serviceSelection: {},
      quickSetup: {},
      bankDetailsSkipped: false,
      documentsSkipped: false,

      qrCodes: {},

      // Navigation actions
      setStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const { currentStep, totalSteps, completedSteps } = get();
        if (currentStep < totalSteps) {
          const newCompletedSteps = completedSteps.includes(currentStep)
            ? completedSteps
            : [...completedSteps, currentStep];
          set({
            currentStep: currentStep + 1,
            completedSteps: newCompletedSteps,
          });
        }
      },

      previousStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 });
        }
      },

      canGoBack: () => {
        const { currentStep } = get();
        return currentStep > 1;
      },

      // Business info actions
      setBusinessInfo: (info) => {
        set((state) => ({
          businessInfo: { ...state.businessInfo, ...info },
        }));
        get().saveProgress();
      },

      autoFillFromGSTIN: (gstin, data) => {
        // Extract business type from GSTIN format
        // Format: 2 digits (state) + 5 chars (PAN) + 4 digits + 1 char + 1 alphanumeric + Z + 1 alphanumeric
        const pan = gstin.substring(2, 12);

        set((state) => ({
          businessInfo: {
            ...state.businessInfo,
            ...data,
            // Auto-detect business type from registration type (13th character)
            businessType: data.businessType || 'sole_proprietor',
          },
        }));
        get().saveProgress();
      },

      autoFillFromLocation: (location) => {
        set((state) => ({
          businessInfo: {
            ...state.businessInfo,
            address: {
              street: location.address,
              city: location.city,
              state: location.state,
              zipCode: '',
              country: 'India',
            },
          },
        }));
        get().saveProgress();
      },

      // Service selection actions
      setServiceSelection: (services) => {
        set((state) => ({
          serviceSelection: { ...state.serviceSelection, ...services },
        }));
        get().saveProgress();
      },

      applySmartDefaults: (category) => {
        const defaults = serviceDefaults[category] || serviceDefaults['Services'];
        set({ serviceSelection: defaults });
        get().saveProgress();
      },

      // Quick setup actions
      setQuickSetup: (setup) => {
        set((state) => ({
          quickSetup: { ...state.quickSetup, ...setup },
        }));
        get().saveProgress();
      },

      generateQRCodes: async () => {
        const { serviceSelection } = get();
        const codes: OnboardingState['qrCodes'] = {};

        // Generate QR codes based on selected services
        if (serviceSelection.scanAndPay) {
          codes.payment = `rez://pay/${Date.now()}`;
        }
        if (serviceSelection.menuQr) {
          codes.menu = `rez://menu/${Date.now()}`;
        }
        if (serviceSelection.tableReservations) {
          codes.table = `rez://table/${Date.now()}`;
        }

        set({ qrCodes: codes, quickSetup: { ...get().quickSetup, qrGenerated: true } });
        get().saveProgress();
      },

      // Optional steps
      skipBankDetails: () => {
        set({ bankDetailsSkipped: true });
        get().saveProgress();
      },

      skipDocuments: () => {
        set({ documentsSkipped: true });
        get().saveProgress();
      },

      // Completion
      completeOnboarding: async () => {
        const state = get();

        try {
          // Call API to finalize onboarding
          // await onboardingV2Service.complete(state);

          set({ currentStep: get().totalSteps });
          get().saveProgress();
        } catch (error) {
          logger.error('Failed to complete onboarding:', error);
          throw error;
        }
      },

      resetOnboarding: () => {
        set({
          currentStep: 0,
          completedSteps: [],
          businessInfo: {},
          serviceSelection: {},
          quickSetup: {},
          bankDetailsSkipped: false,
          documentsSkipped: false,
          qrCodes: {},
        });
      },

      // Persistence
      loadProgress: async () => {
        // This is called on mount - the persisted state is already loaded
        const { currentStep } = get();
        // If currentStep is 0, we need to check server for progress
        if (currentStep === 0) {
          try {
            // const progress = await onboardingV2Service.getStatus();
            // if (progress.data.currentStep) {
            //   set({ currentStep: progress.data.currentStep });
            // }
          } catch (error) {
            // Start fresh
          }
        }
      },

      saveProgress: async () => {
        const state = get();
        try {
          // Auto-save progress to server
          // await onboardingV2Service.saveProgress({
          //   currentStep: state.currentStep,
          //   businessInfo: state.businessInfo,
          //   serviceSelection: state.serviceSelection,
          //   quickSetup: state.quickSetup,
          // });
        } catch (error) {
          logger.error('Failed to save progress:', error);
        }
      },

      exitOnboarding: () => {
        // Navigate to home/dashboard
        // router.push('/dashboard');
      },
    }),
    {
      name: 'onboarding-v2-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        businessInfo: state.businessInfo,
        serviceSelection: state.serviceSelection,
        quickSetup: state.quickSetup,
        bankDetailsSkipped: state.bankDetailsSkipped,
        documentsSkipped: state.documentsSkipped,
        qrCodes: state.qrCodes,
      }),
    }
  )
);

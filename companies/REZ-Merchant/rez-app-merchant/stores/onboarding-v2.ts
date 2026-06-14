/**
 * Onboarding V2 Store
 * Simple state management for onboarding flow
 */

import { create } from 'zustand';

interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  data: Record<string, unknown>;
}

interface OnboardingActions {
  setStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  canGoBack: () => boolean;
  goBack: () => void;
  exitOnboarding: () => void;
  completeOnboarding: () => void;
  setData: (data: Record<string, unknown>) => void;
  reset: () => void;
}

const initialState: OnboardingState = {
  currentStep: 1,
  totalSteps: 4,
  isCompleted: false,
  data: {},
};

export const useOnboardingStore = create<OnboardingState & OnboardingActions>((set, get) => ({
  ...initialState,

  setStep: (step: number) => {
    set({ currentStep: Math.max(1, Math.min(step, get().totalSteps)) });
  },

  nextStep: () => {
    const { currentStep, totalSteps } = get();
    if (currentStep < totalSteps) {
      set({ currentStep: currentStep + 1 });
    } else {
      set({ isCompleted: true });
    }
  },

  previousStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: currentStep - 1 });
    }
  },

  canGoBack: () => {
    return get().currentStep > 1;
  },

  goBack: () => {
    get().previousStep();
  },

  exitOnboarding: () => {
    set(initialState);
  },

  completeOnboarding: () => {
    set({ isCompleted: true });
  },

  setData: (data: Record<string, unknown>) => {
    set({ data: { ...get().data, ...data } });
  },

  reset: () => {
    set(initialState);
  },
}));

export default useOnboardingStore;

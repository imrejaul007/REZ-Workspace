/**
 * OnboardingContext
 * Context for managing the 5-step merchant onboarding wizard
 *
 * Features:
 * - Centralized state management for all 5 steps
 * - Auto-save functionality (30-second interval)
 * - Progress tracking
 * - AsyncStorage persistence for recovery
 * - Step validation before proceeding
 * - Integration with onboardingService
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { onboardingService } from '../services/api/onboarding';
import { storageService } from '../services/storage';
import { useAuth } from './AuthContext';
import { logger } from '@/utils/logger';
import {
  OnboardingStatus,
  BusinessInfoStep,
  StoreDetailsStep,
  BankDetailsStep,
  DocumentsStep,
  ReviewSubmitStep,
  ValidationResult,
} from '../types/onboarding';

// ============================================================================
// Constants
// ============================================================================

// CRITICAL-SEC FIX (MA-SEC-010): Sensitive KYC field names to redact before
// AsyncStorage persistence. AsyncStorage is plaintext — physical/device access
// exposes the data. Sensitive fields MUST NOT be stored in plaintext.
// Bank details, PAN, Aadhaar, and GST numbers are stored in these fields.
const SENSITIVE_BANK_FIELDS = new Set([
  'accountNumber',
  'confirmAccountNumber',
  'ifscCode',
  'bankCode',
  'panNumber',
  'aadharNumber',
  'gstNumber',
]) as Set<string>;
const SENSITIVE_BUSINESS_FIELDS = new Set(['ownerEmail', 'ownerPhone', 'panNumber']) as Set<string>;

function redactSensitiveData(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_BANK_FIELDS.has(key) || SENSITIVE_BUSINESS_FIELDS.has(key)) {
      result[key] = typeof value === 'string' && value.length > 0 ? '[REDACTED]' : value;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = redactSensitiveData(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// ============================================================================
// Types
// ============================================================================

interface OnboardingState {
  isLoading: boolean;
  isSaving: boolean;
  isAutoSaving: boolean;
  error: string | null;
  currentStep: number;
  totalSteps: number;
  overallProgress: number;
  validationErrors: Record<string, string>;

  // Step data
  businessInfo: Partial<BusinessInfoStep>;
  storeDetails: Partial<StoreDetailsStep>;
  bankDetails: Partial<BankDetailsStep>;
  documents: Partial<DocumentsStep>;
  reviewSubmit: Partial<ReviewSubmitStep>;

  // Status
  isSubmitted: boolean;
  submissionDate?: string;
  lastSavedAt?: string;
}

type OnboardingAction =
  | { type: 'INIT_START' }
  | { type: 'INIT_SUCCESS'; payload: OnboardingStatus }
  | { type: 'INIT_ERROR'; payload: string }
  | { type: 'UPDATE_STEP_DATA'; payload: { step: number; data: Partial<unknown> } }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_VALIDATION_ERRORS'; payload: Record<string, string> }
  | { type: 'CLEAR_VALIDATION_ERRORS' }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_SUCCESS'; payload: { lastSavedAt: string } }
  | { type: 'SAVE_ERROR'; payload: string }
  | { type: 'AUTO_SAVE_START' }
  | { type: 'AUTO_SAVE_SUCCESS'; payload: { lastSavedAt: string } }
  | { type: 'AUTO_SAVE_ERROR' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; payload: { submissionDate: string } }
  | { type: 'SUBMIT_ERROR'; payload: string }
  | { type: 'UPDATE_PROGRESS'; payload: number }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };

interface OnboardingContextType {
  state: OnboardingState;

  // Data methods
  updateStepData: (step: number, data: Partial<unknown>) => void;
  getStepData: (step: number) => Partial<unknown>;

  // Navigation methods
  nextStep: () => Promise<void>;
  previousStep: () => void;
  goToStep: (step: number) => void;

  // Validation methods
  validateCurrentStep: () => Promise<boolean>;

  // Save methods
  saveProgress: () => Promise<void>;

  // Submit methods
  submitOnboarding: () => Promise<void>;

  // Utility methods
  clearError: () => void;
  resetOnboarding: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: OnboardingState = {
  isLoading: true,
  isSaving: false,
  isAutoSaving: false,
  error: null,
  currentStep: 1,
  totalSteps: 5,
  overallProgress: 0,
  validationErrors: {},

  businessInfo: {},
  storeDetails: {},
  bankDetails: {},
  documents: { documents: [] },
  reviewSubmit: {
    agreedToTerms: false,
    agreedToPrivacy: false,
    agreedToDataProcessing: false,
    communicationConsent: false,
  },

  isSubmitted: false,
};

// ============================================================================
// Reducer
// ============================================================================

function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'INIT_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'INIT_SUCCESS': {
      const stepData = action.payload.data ?? {};
      return {
        ...state,
        isLoading: false,
        currentStep: action.payload.currentStep ?? 1,
        overallProgress: action.payload.overallProgress ?? 0,
        businessInfo: stepData.businessInfo || {},
        storeDetails: stepData.storeDetails || {},
        bankDetails: stepData.bankDetails || {},
        documents: stepData.documents || { documents: [] },
        reviewSubmit: stepData.reviewSubmit || initialState.reviewSubmit,
        isSubmitted: action.payload.isSubmitted ?? false,
        submissionDate: action.payload.submissionDate,
      };
    }

    case 'INIT_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case 'UPDATE_STEP_DATA':
      const stepKey = getStepKey(action.payload.step);
      const existingStepData = state[stepKey as keyof OnboardingState];
      return {
        ...state,
        [stepKey]: {
          ...(typeof existingStepData === 'object' && existingStepData !== null
            ? existingStepData
            : {}),
          ...action.payload.data,
        },
      };

    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: action.payload,
        validationErrors: {},
      };

    case 'SET_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: action.payload,
      };

    case 'CLEAR_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: {},
      };

    case 'SAVE_START':
      return {
        ...state,
        isSaving: true,
        error: null,
      };

    case 'SAVE_SUCCESS':
      return {
        ...state,
        isSaving: false,
        lastSavedAt: action.payload.lastSavedAt,
      };

    case 'SAVE_ERROR':
      return {
        ...state,
        isSaving: false,
        error: action.payload,
      };

    case 'AUTO_SAVE_START':
      return {
        ...state,
        isAutoSaving: true,
      };

    case 'AUTO_SAVE_SUCCESS':
      return {
        ...state,
        isAutoSaving: false,
        lastSavedAt: action.payload.lastSavedAt,
      };

    case 'AUTO_SAVE_ERROR':
      return {
        ...state,
        isAutoSaving: false,
      };

    case 'SUBMIT_START':
      return {
        ...state,
        isSaving: true,
        error: null,
      };

    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        isSaving: false,
        isSubmitted: true,
        submissionDate: action.payload.submissionDate,
        currentStep: 5,
        overallProgress: 100,
      };

    case 'SUBMIT_ERROR':
      return {
        ...state,
        isSaving: false,
        error: action.payload,
      };

    case 'UPDATE_PROGRESS':
      return {
        ...state,
        overallProgress: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getStepKey(step: number): keyof OnboardingState {
  switch (step) {
    case 1:
      return 'businessInfo';
    case 2:
      return 'storeDetails';
    case 3:
      return 'bankDetails';
    case 4:
      return 'documents';
    case 5:
      return 'reviewSubmit';
    default:
      return 'businessInfo';
  }
}

function getStepData(state: OnboardingState, step: number): Partial<unknown> {
  const key = getStepKey(step);
  const data = state[key as keyof OnboardingState];
  return (typeof data === 'object' && data !== null ? data : {}) as Partial<unknown>;
}

// ============================================================================
// Context
// ============================================================================

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

const STORAGE_KEY = 'onboarding_state';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Reset onboarding state on logout so a different merchant starts fresh
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch({ type: 'RESET' });
    }
  }, [isAuthenticated]);

  // ============================================================================
  // Initialize onboarding state
  // ============================================================================

  useEffect(() => {
    initializeOnboarding();
  }, []);

  const initializeOnboarding = async () => {
    dispatch({ type: 'INIT_START' });

    try {
      logger.debug('🎯 Initializing onboarding...');

      // Try to get onboarding status from backend
      try {
        const status = await onboardingService.getOnboardingStatus();
        logger.debug('✅ Onboarding status fetched from backend');
        dispatch({ type: 'INIT_SUCCESS', payload: status });

        // Save to AsyncStorage for offline recovery
        await storageService.set(STORAGE_KEY, status);
      } catch (error) {
        logger.warn('⚠️ Failed to fetch from backend, checking local storage...');

        // Fallback to AsyncStorage
        const cachedState = await storageService.get<OnboardingStatus>(STORAGE_KEY);
        if (cachedState) {
          logger.debug('✅ Loaded onboarding state from local storage');
          dispatch({ type: 'INIT_SUCCESS', payload: cachedState });
        } else {
          logger.debug('ℹ️ No cached state found, starting fresh');
          dispatch({
            type: 'INIT_SUCCESS',
            payload: {
              merchantId: '',
              currentStep: 1,
              totalSteps: 5,
              overallProgress: 0,
              completedSteps: [],
              isSubmitted: false,
              status: 'in_progress',
              startedAt: new Date().toISOString(),
              lastUpdatedAt: new Date().toISOString(),
              data: {},
            },
          });
        }
      }
    } catch (error) {
      logger.error('❌ Failed to initialize onboarding:', error);
      dispatch({ type: 'INIT_ERROR', payload: error.message || 'Failed to initialize onboarding' });
    }
  };

  // ============================================================================
  // Auto-save functionality
  // ============================================================================

  useEffect(() => {
    if (state.isSubmitted) {
      logger.debug('✅ Onboarding submitted, stopping auto-save');
      return;
    }

    // FE-H12 fix: also stop auto-save when the merchant's status is 'completed' or 'verified'
    // to prevent indefinite API polling after onboarding is done.
    const onboardingDone =
      (state as unknown).status === 'completed' || (state as unknown).verificationStatus === 'verified';
    if (onboardingDone) {
      logger.debug('✅ Merchant verified/completed, stopping auto-save');
      return;
    }

    logger.debug('⏱️ Starting auto-save timer...');
    const autoSaveTimer = setInterval(() => {
      autoSave();
    }, AUTO_SAVE_INTERVAL);

    return () => {
      logger.debug('⏹️ Stopping auto-save timer');
      clearInterval(autoSaveTimer);
    };
    // Only reset the timer when the current step changes or onboarding is submitted.
    // Keeping form field objects out of deps prevents the timer from restarting on every
    // keystroke (which would mean the 30s interval never fires while the user is typing).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentStep, state.isSubmitted]);

  const autoSave = async () => {
    try {
      dispatch({ type: 'AUTO_SAVE_START' });
      logger.debug(`💾 Auto-saving step ${state.currentStep}...`);

      const stepData = getStepData(state, state.currentStep);
      await onboardingService.completeStep(state.currentStep, stepData as unknown);

      // Also save to AsyncStorage
      await persistToStorage();

      dispatch({
        type: 'AUTO_SAVE_SUCCESS',
        payload: { lastSavedAt: new Date().toISOString() },
      });

      logger.debug('✅ Auto-save successful');
    } catch (error) {
      logger.warn('⚠️ Auto-save failed (will retry):', error);
      dispatch({ type: 'AUTO_SAVE_ERROR' });
    }
  };

  const persistToStorage = async () => {
    try {
      // CRITICAL-SEC FIX (MA-SEC-010): Redact sensitive fields before AsyncStorage persistence.
      // AsyncStorage is plaintext — account numbers, PAN, Aadhaar, and GST numbers must
      // not be stored in plaintext. The recovery flow will repopulate from the backend
      // after login. Non-sensitive fields (businessName, storeName, step progress) are kept.
      const rawData = {
        businessInfo: state.businessInfo as BusinessInfoStep,
        storeDetails: state.storeDetails as StoreDetailsStep,
        bankDetails: state.bankDetails as BankDetailsStep,
        documents: state.documents as DocumentsStep,
        reviewSubmit: state.reviewSubmit as ReviewSubmitStep,
      };
      // CRITICAL-SEC FIX (MA-SEC-010): Redact sensitive fields before AsyncStorage persistence.
      const sanitizedData: OnboardingStatus['data'] = {
        businessInfo: redactSensitiveData(
          rawData.businessInfo as unknown as Record<string, unknown>
        ) as unknown as BusinessInfoStep,
        storeDetails: rawData.storeDetails as unknown as StoreDetailsStep,
        bankDetails: redactSensitiveData(
          rawData.bankDetails as unknown as Record<string, unknown>
        ) as unknown as BankDetailsStep,
        documents: rawData.documents as unknown as DocumentsStep,
        reviewSubmit: rawData.reviewSubmit as unknown as ReviewSubmitStep,
      };

      const stateToSave: OnboardingStatus = {
        merchantId: '',
        currentStep: state.currentStep,
        totalSteps: state.totalSteps,
        overallProgress: state.overallProgress,
        completedSteps: [],
        isSubmitted: state.isSubmitted,
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        submissionDate: state.submissionDate,
        data: sanitizedData,
      };

      await storageService.set(STORAGE_KEY, stateToSave);
    } catch (error) {
      logger.error('❌ Failed to persist to storage:', error);
    }
  };

  // ============================================================================
  // Data methods
  // ============================================================================

  const updateStepData = useCallback((step: number, data: Partial<unknown>) => {
    logger.debug(`📝 Updating step ${step} data`);
    dispatch({
      type: 'UPDATE_STEP_DATA',
      payload: { step, data },
    });
    dispatch({ type: 'CLEAR_VALIDATION_ERRORS' });
  }, []);

  const getStepDataCallback = useCallback(
    (step: number): Partial<unknown> => {
      return getStepData(state, step);
    },
    [state]
  );

  // ============================================================================
  // Validation methods
  // ============================================================================

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    logger.debug(`🔍 Validating step ${state.currentStep}...`);

    const stepData = getStepData(state, state.currentStep);
    let validationResult: ValidationResult;

    switch (state.currentStep) {
      case 1:
        validationResult = onboardingService.validateBusinessInfo(stepData as BusinessInfoStep);
        break;
      case 2:
        validationResult = onboardingService.validateStoreDetails(stepData as StoreDetailsStep);
        break;
      case 3:
        validationResult = onboardingService.validateBankDetailsStep(stepData as BankDetailsStep);
        break;
      case 4:
        validationResult = onboardingService.validateDocuments(stepData as DocumentsStep);
        break;
      case 5:
        validationResult = onboardingService.validateReviewSubmit(stepData as ReviewSubmitStep);
        break;
      default:
        validationResult = { isValid: true, errors: {} };
    }

    if (!validationResult.isValid) {
      logger.debug('❌ Validation failed:', validationResult.errors);
      dispatch({ type: 'SET_VALIDATION_ERRORS', payload: validationResult.errors });
      return false;
    }

    logger.debug('✅ Validation passed');
    dispatch({ type: 'CLEAR_VALIDATION_ERRORS' });
    return true;
    // state is read by getStepData; adding full state would recreate on every field change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.currentStep,
    state.businessInfo,
    state.storeDetails,
    state.bankDetails,
    state.documents,
    state.reviewSubmit,
  ]);

  // ============================================================================
  // Navigation methods
  // ============================================================================

  const nextStep = useCallback(async () => {
    try {
      logger.debug(`➡️ Moving to next step from ${state.currentStep}...`);

      // Validate current step
      const isValid = await validateCurrentStep();
      if (!isValid) {
        logger.debug('⚠️ Validation failed, cannot proceed');
        return;
      }

      dispatch({ type: 'SAVE_START' });

      // Submit current step to backend
      const stepData = getStepData(state, state.currentStep);
      const response = await onboardingService.submitStep(state.currentStep, stepData as unknown);

      // Update progress
      dispatch({ type: 'UPDATE_PROGRESS', payload: response.overallProgress });
      dispatch({ type: 'SAVE_SUCCESS', payload: { lastSavedAt: new Date().toISOString() } });

      // Move to next step
      if (response.nextStep && response.nextStep <= state.totalSteps) {
        dispatch({ type: 'SET_CURRENT_STEP', payload: response.nextStep });
        logger.debug(`✅ Moved to step ${response.nextStep}`);
      }

      // Persist to storage
      await persistToStorage();
    } catch (error) {
      logger.error('❌ Failed to move to next step:', error);
      dispatch({ type: 'SAVE_ERROR', payload: error.message || 'Failed to save and proceed' });
    }
    // state is read via getStepData; including full state would recreate on every field change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentStep, state.totalSteps, validateCurrentStep]);

  const previousStep = useCallback(() => {
    if (state.currentStep > 1) {
      logger.debug(`⬅️ Moving to previous step from ${state.currentStep}...`);
      dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStep - 1 });
    }
  }, [state.currentStep]);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 1 && step <= state.totalSteps) {
        logger.debug(`🎯 Jumping to step ${step}...`);
        dispatch({ type: 'SET_CURRENT_STEP', payload: step });
      }
    },
    [state.totalSteps]
  );

  // ============================================================================
  // Save methods
  // ============================================================================

  const saveProgress = useCallback(async () => {
    try {
      dispatch({ type: 'SAVE_START' });
      logger.debug(`💾 Manually saving step ${state.currentStep}...`);

      const stepData = getStepData(state, state.currentStep);
      await onboardingService.completeStep(state.currentStep, stepData as unknown);

      // Also save to AsyncStorage
      await persistToStorage();

      dispatch({
        type: 'SAVE_SUCCESS',
        payload: { lastSavedAt: new Date().toISOString() },
      });

      logger.debug('✅ Progress saved successfully');
    } catch (error) {
      logger.error('❌ Failed to save progress:', error);
      dispatch({ type: 'SAVE_ERROR', payload: error.message || 'Failed to save progress' });
    }
    // persistToStorage is a stable inline async fn; state is read for step data — both intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentStep]);

  // ============================================================================
  // Submit methods
  // ============================================================================

  const submitOnboarding = useCallback(async () => {
    try {
      dispatch({ type: 'SUBMIT_START' });
      logger.debug('🚀 Submitting complete onboarding...');

      // Validate all steps
      for (let step = 1; step <= state.totalSteps; step++) {
        const stepData = getStepData(state, step);
        let validationResult: ValidationResult;

        switch (step) {
          case 1:
            validationResult = onboardingService.validateBusinessInfo(stepData as BusinessInfoStep);
            break;
          case 2:
            validationResult = onboardingService.validateStoreDetails(stepData as StoreDetailsStep);
            break;
          case 3:
            validationResult = onboardingService.validateBankDetailsStep(
              stepData as BankDetailsStep
            );
            break;
          case 4:
            validationResult = onboardingService.validateDocuments(stepData as DocumentsStep);
            break;
          case 5:
            validationResult = onboardingService.validateReviewSubmit(stepData as ReviewSubmitStep);
            break;
          default:
            validationResult = { isValid: true, errors: {} };
        }

        if (!validationResult.isValid) {
          logger.debug(`❌ Step ${step} validation failed:`, validationResult.errors);
          dispatch({ type: 'SET_CURRENT_STEP', payload: step });
          dispatch({ type: 'SET_VALIDATION_ERRORS', payload: validationResult.errors });
          throw new Error(`Please complete step ${step} before submitting`);
        }
      }

      // Submit to backend
      const response = await onboardingService.submitCompleteOnboarding(
        state.businessInfo as BusinessInfoStep,
        state.storeDetails as StoreDetailsStep,
        state.bankDetails as BankDetailsStep,
        state.documents as DocumentsStep,
        state.reviewSubmit as ReviewSubmitStep
      );

      dispatch({
        type: 'SUBMIT_SUCCESS',
        payload: { submissionDate: response.submissionDate },
      });

      // Clear from AsyncStorage after successful submission
      await storageService.remove(STORAGE_KEY);

      logger.debug('✅ Onboarding submitted successfully');
    } catch (error) {
      logger.error('❌ Failed to submit onboarding:', error);
      dispatch({ type: 'SUBMIT_ERROR', payload: error.message || 'Failed to submit onboarding' });
    }
    // persistToStorage is a stable inline fn intentionally omitted to avoid loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.businessInfo,
    state.storeDetails,
    state.bankDetails,
    state.documents,
    state.reviewSubmit,
    state.totalSteps,
  ]);

  // ============================================================================
  // Utility methods
  // ============================================================================

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const resetOnboarding = useCallback(async () => {
    logger.debug('🔄 Resetting onboarding...');
    dispatch({ type: 'RESET' });
    await storageService.remove(STORAGE_KEY);
  }, []);

  const refreshStatus = useCallback(async () => {
    await initializeOnboarding();
  }, []);

  // ============================================================================
  // Context value
  // ============================================================================

  const value: OnboardingContextType = {
    state,
    updateStepData,
    getStepData: getStepDataCallback,
    nextStep,
    previousStep,
    goToStep,
    validateCurrentStep,
    saveProgress,
    submitOnboarding,
    clearError,
    resetOnboarding,
    refreshStatus,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider');
  }
  return context;
}

export default OnboardingContext;

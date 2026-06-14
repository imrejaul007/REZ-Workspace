import { v4 as uuidv4 } from 'uuid';
import {
  OnboardingSteps,
  OnboardingStep,
  CreateStoreRequest,
  Store,
  createOnboardingSteps,
  createStore,
  RETAIL_STORE_STEPS,
} from '../models/Onboarding';

// ============================================================================
// In-Memory Storage (Replace with Database in Production)
// ============================================================================

const onboardingStore: Map<string, OnboardingSteps> = new Map();
const storesMap: Map<string, Store> = new Map();
const merchantStoresMap: Map<string, string[]> = new Map();

// ============================================================================
// Onboarding Service
// ============================================================================

export class OnboardingService {
  /**
   * Create a new store with initial onboarding progress
   */
  async createStore(data: CreateStoreRequest): Promise<{ store: Store; onboarding: OnboardingSteps }> {
    const onboardingId = uuidv4();
    const storeId = uuidv4();

    // Create onboarding steps
    const onboarding = createOnboardingSteps(data.merchantId, storeId);
    onboardingStore.set(onboardingId, onboarding);

    // Create store
    const storeData = { ...data, storeId };
    const store = createStore(storeData as CreateStoreRequest, onboardingId);
    storesMap.set(store.id, store);

    // Map merchant to stores
    const merchantStores = merchantStoresMap.get(data.merchantId) || [];
    merchantStores.push(store.id);
    merchantStoresMap.set(data.merchantId, merchantStores);

    return { store, onboarding };
  }

  /**
   * Get onboarding status by ID
   */
  async getOnboardingStatus(onboardingId: string): Promise<OnboardingSteps | null> {
    return onboardingStore.get(onboardingId) || null;
  }

  /**
   * Get onboarding status by store ID
   */
  async getOnboardingStatusByStoreId(storeId: string): Promise<OnboardingSteps | null> {
    const store = storesMap.get(storeId);
    if (!store) return null;
    return onboardingStore.get(store.onboardingId) || null;
  }

  /**
   * Complete current step and move to next
   */
  async completeStep(onboardingId: string, stepId: string, stepData: Record<string, unknown>): Promise<OnboardingSteps> {
    const onboarding = onboardingStore.get(onboardingId);
    if (!onboarding) {
      throw new Error(`Onboarding not found: ${onboardingId}`);
    }

    const stepIndex = onboarding.steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) {
      throw new Error(`Step not found: ${stepId}`);
    }

    // Update current step
    const now = new Date().toISOString();
    onboarding.steps[stepIndex] = {
      ...onboarding.steps[stepIndex],
      status: 'completed',
      completedAt: now,
      data: stepData,
    };

    // Find and mark next step as in_progress
    const nextStepIndex = stepIndex + 1;
    if (nextStepIndex < onboarding.steps.length) {
      // Check if next step is already completed (user went back)
      if (onboarding.steps[nextStepIndex].status !== 'completed') {
        onboarding.steps[nextStepIndex].status = 'in_progress';
      }
      onboarding.currentStep = nextStepIndex;
    } else {
      // All steps completed
      onboarding.completedAt = now;
    }

    onboardingStore.set(onboardingId, onboarding);

    // Update store if basic info step is completed
    if (stepId === 'basic' && stepData.storeName) {
      const store = this.getStoreByOnboardingId(onboardingId);
      if (store) {
        store.name = stepData.storeName as string;
        store.updatedAt = now;
        storesMap.set(store.id, store);
      }
    }

    return onboarding;
  }

  /**
   * Skip a step
   */
  async skipStep(onboardingId: string, stepId: string): Promise<OnboardingSteps> {
    const onboarding = onboardingStore.get(onboardingId);
    if (!onboarding) {
      throw new Error(`Onboarding not found: ${onboardingId}`);
    }

    const stepIndex = onboarding.steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) {
      throw new Error(`Step not found: ${stepId}`);
    }

    // Only allow skipping if step allows it
    const stepConfig = RETAIL_STORE_STEPS.find(s => s.id === stepId);
    if (!stepConfig) {
      throw new Error(`Invalid step: ${stepId}`);
    }

    const now = new Date().toISOString();
    onboarding.steps[stepIndex] = {
      ...onboarding.steps[stepIndex],
      status: 'skipped',
      completedAt: now,
    };

    // Move to next step
    const nextStepIndex = stepIndex + 1;
    if (nextStepIndex < onboarding.steps.length) {
      onboarding.steps[nextStepIndex].status = 'in_progress';
      onboarding.currentStep = nextStepIndex;
    }

    onboardingStore.set(onboardingId, onboarding);
    return onboarding;
  }

  /**
   * Go back to previous step
   */
  async goBackStep(onboardingId: string): Promise<OnboardingSteps> {
    const onboarding = onboardingStore.get(onboardingId);
    if (!onboarding) {
      throw new Error(`Onboarding not found: ${onboardingId}`);
    }

    if (onboarding.currentStep === 0) {
      throw new Error('Already at first step');
    }

    const currentStepIndex = onboarding.currentStep;
    onboarding.steps[currentStepIndex].status = 'pending';

    const prevStepIndex = currentStepIndex - 1;
    onboarding.steps[prevStepIndex].status = 'in_progress';
    onboarding.currentStep = prevStepIndex;

    onboardingStore.set(onboardingId, onboarding);
    return onboarding;
  }

  /**
   * Get store by onboarding ID
   */
  getStoreByOnboardingId(onboardingId: string): Store | null {
    for (const store of storesMap.values()) {
      if (store.onboardingId === onboardingId) {
        return store;
      }
    }
    return null;
  }

  /**
   * Get store by ID
   */
  async getStoreById(storeId: string): Promise<Store | null> {
    return storesMap.get(storeId) || null;
  }

  /**
   * Get all stores for a merchant
   */
  async getMerchantStores(merchantId: string): Promise<Store[]> {
    const storeIds = merchantStoresMap.get(merchantId) || [];
    return storeIds
      .map(id => storesMap.get(id))
      .filter((store): store is Store => store !== undefined);
  }

  /**
   * Complete onboarding
   */
  async completeOnboarding(onboardingId: string): Promise<OnboardingSteps> {
    const onboarding = onboardingStore.get(onboardingId);
    if (!onboarding) {
      throw new Error(`Onboarding not found: ${onboardingId}`);
    }

    const now = new Date().toISOString();
    onboarding.completedAt = now;

    // Mark store as active
    const store = this.getStoreByOnboardingId(onboardingId);
    if (store) {
      store.status = 'active';
      store.updatedAt = now;
      storesMap.set(store.id, store);
    }

    onboardingStore.set(onboardingId, onboarding);
    return onboarding;
  }

  /**
   * Validate step data
   */
  validateStepData(stepId: string, data: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const stepConfig = RETAIL_STORE_STEPS.find(s => s.id === stepId);
    if (!stepConfig) {
      return { valid: false, errors: [`Invalid step: ${stepId}`] };
    }

    const errors: string[] = [];
    const fields = stepConfig.fields || [];

    for (const field of fields) {
      if (field.required && !data[field.name]) {
        errors.push(`${field.label} is required`);
        continue;
      }

      if (data[field.name] && field.validation) {
        const value = data[field.name];

        if (field.validation.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(String(value))) {
            errors.push(`${field.label} format is invalid`);
          }
        }

        if (field.validation.minLength && String(value).length < field.validation.minLength) {
          errors.push(`${field.label} must be at least ${field.validation.minLength} characters`);
        }

        if (field.validation.maxLength && String(value).length > field.validation.maxLength) {
          errors.push(`${field.label} must be at most ${field.validation.maxLength} characters`);
        }

        if (field.validation.min !== undefined && Number(value) < field.validation.min) {
          errors.push(`${field.label} must be at least ${field.validation.min}`);
        }

        if (field.validation.max !== undefined && Number(value) > field.validation.max) {
          errors.push(`${field.label} must be at most ${field.validation.max}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

export const onboardingService = new OnboardingService();

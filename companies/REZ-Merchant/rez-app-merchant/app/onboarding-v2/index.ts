/**
 * Onboarding V2
 * Streamlined merchant onboarding - < 5 minutes
 */

export { default as OnboardingPage } from './page';
export { default as OnboardingLayout } from './_layout';

// Re-export steps
export { BusinessStep, ServicesStep, QuickSetupStep, CompleteStep } from './steps';
export { BankStep, DocumentsStep } from './steps/optional';

// Re-export components
export { ProgressBar, StepCard, SkipButton, FormField, CategorySelector } from './components';

// Re-export store
export { useOnboardingStore } from './stores/onboarding-v2';
export type {
  BusinessInfo,
  ServiceSelection,
  QuickSetup,
  OnboardingState,
} from './stores/onboarding-v2';

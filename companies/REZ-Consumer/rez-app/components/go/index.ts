// @ts-nocheck
// REZ Go Components Export

export { GoProvider, useGo } from './GoContext';
export { SavingsMeter } from './SavingsMeter';
export { BudgetGuard } from './BudgetGuard';
export { StreakBadge } from './StreakBadge';
export { ComboSuggestions } from './ComboSuggestions';
export { ProductPanel } from './ProductPanel';
export { CheckoutRecovery } from './CheckoutRecovery';
export { VoiceShopping } from './VoiceShopping';
export {
  ScanFeedback,
  ScanningPulse,
  Shimmer,
  ItemAddedAnimation,
  SuccessCelebration,
} from './UXEnhancements';

// Config and utilities
export { default as REZ_GO_CONFIG } from './config';
export { productApi } from './productApi';
export { goWebSocket } from './websocket';

// Types
export type {
  GoCartItem,
  GoSession,
  GoStore,
  BudgetGuard,
  StreakInfo,
  ComboSuggestion,
} from './GoContext';

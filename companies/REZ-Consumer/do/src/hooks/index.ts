/**
 * DO App - Hooks Index
 *
 * Re-exports all custom hooks for easy importing
 */

// ============================================
// AI HOOKS (HOJAI Integration)
// ============================================

// Wake Word - "Hey Genie" detection
export { useWakeWord, WAKE_WORDS } from './useWakeWord';
export type { WakeWordState, WakeWordOptions, WakeWordResult } from './useWakeWord';

// Flow Voice - Real STT/TTS via HOJAI Flow
export { useFlowVoice } from './useFlowVoice';
export type { FlowVoiceState, FlowVoiceOptions } from './useFlowVoice';

// Genie Memory - Personal AI memory via HOJAI Genie
export { useGenieMemory } from './useGenieMemory';
export type {
  Memory,
  MemoryInput,
  MemoryRecall,
  MemoryType,
  UsualOrder,
  BookingPattern,
  SpendingSummary,
} from './useGenieMemory';

// Hybrid AI - Combined Flow + Genie + REZ Mind
export { useHybridAI } from './useHybridAI';
export type {
  HybridIntent,
  HybridResponse,
  ConversationContext,
  IntentType,
} from './useHybridAI';

// ============================================
// EXISTING HOOKS (Re-exported)
// ============================================

// Auth
export { useAuth } from './useAuth';

// REZ Mind - Intent & Prediction
export { useReZMind } from './useReZMind';
export type { DormancyStatus, BehavioralProfile, Recommendation } from './useReZMind';

// Voice Input (Legacy - now uses useFlowVoice internally)
export { useVoiceInput } from './useVoiceInput';

// Biometric Auth
export { useBiometricAuth } from './useBiometricAuth';

// Deep Linking
export { useDeepLinking } from './useDeepLinking';

// Draft Saving
export { useDraft } from './useDraft';

// ============================================
// CONVENIENCE EXPORTS
// ============================================

/**
 * Quick access to all AI capabilities
 *
 * Usage:
 * ```typescript
 * import { useAI } from '@/hooks';
 *
 * function MyComponent() {
 *   const { flow, genie, hybrid } = useAI();
 *
 *   // flow.speak('Hello!')
 *   // genie.getUsual()
 *   // hybrid.handleVoiceCommand(audio)
 * }
 * ```
 */
export { useAI } from './useAI';

/**
 * useAI - Convenience hook combining all AI capabilities
 *
 * Provides easy access to:
 * - Flow (Voice: STT/TTS)
 * - Genie (Memory: Remember/Recall)
 * - Hybrid (Combined Flow + Genie + REZ Mind)
 *
 * Usage:
 * ```typescript
 * import { useAI } from '@/hooks';
 *
 * function ChatScreen() {
 *   const { flow, genie, hybrid, userId } = useAI();
 *
 *   // Voice
 *   await flow.startListening();
 *   const transcript = await flow.stopListening();
 *
 *   // Memory
 *   const usual = await genie.getUsual();
 *
 *   // Combined
 *   const response = await hybrid.handleTextCommand("Order my usual");
 *
 *   // Or use single hook
 *   const { handleVoiceCommand } = hybrid;
 * }
 * ```
 */

import { useMemo } from 'react';
import { useUserStore } from '@/stores';
import { useFlowVoice } from './useFlowVoice';
import { useGenieMemory } from './useGenieMemory';
import { useHybridAI } from './useHybridAI';
import { useReZMind } from './useReZMind';

// ============================================
// CONVENIENCE HOOK
// ============================================

export function useAI() {
  // Get user ID from store
  const userId = useUserStore((state) => state.profile?.id);

  // Initialize individual hooks
  const flow = useFlowVoice();
  const genie = useGenieMemory(userId || 'anonymous');
  const rezMind = useReZMind();

  // Initialize hybrid AI (combines all)
  const hybrid = useHybridAI({
    userId: userId || 'anonymous',
    enableVoice: true,
    enableMemory: true,
    enablePrediction: true,
  });

  // Return combined interface
  return {
    // Individual hooks
    flow,
    genie,
    rezMind,
    hybrid,

    // User ID
    userId,

    // Convenience: check if user is logged in
    isAuthenticated: !!userId,

    // Convenience: check if AI is ready
    isReady: hybrid.context !== null || hybrid.isLoadingContext === false,
  };
}

// ============================================
// NAMED EXPORTS FOR SPECIFIC USE CASES
// ============================================

/**
 * useFlow - For voice-only features
 */
export function useFlow() {
  return useFlowVoice();
}

/**
 * useGenie - For memory-only features
 */
export function useGenie(userId: string) {
  return useGenieMemory(userId);
}

/**
 * useHybrid - For full AI features
 */
export function useHybrid(userId: string) {
  return useHybridAI({ userId });
}

// ============================================
// EXAMPLE USAGE DOCUMENTATION
// ============================================

/**
 * Example 1: Simple voice command
 * ```typescript
 * const { flow } = useAI();
 * await flow.startListening();
 * const text = await flow.stopListening();
 * await flow.speak("Got it!");
 * ```
 *
 * Example 2: Remember user preference
 * ```typescript
 * const { genie } = useAI();
 * await genie.rememberCuisine("Italian");
 * await genie.rememberFood("Pizza");
 * ```
 *
 * Example 3: Get user's usual
 * ```typescript
 * const { genie } = useAI();
 * const usual = await genie.getUsual();
 * if (usual) {
 *   console.log(`Usual: ${usual.merchant}, ${usual.amount}`);
 * }
 * ```
 *
 * Example 4: Full hybrid command
 * ```typescript
 * const { hybrid } = useAI();
 * const response = await hybrid.handleTextCommand("Book my usual");
 * // Automatically: detects intent, recalls memory, generates response, speaks
 * ```
 *
 * Example 5: Learn from booking
 * ```typescript
 * const { hybrid } = useAI();
 * await hybrid.handleBookingComplete({
 *   merchantName: "La Pinoz",
 *   cuisine: "Italian",
 *   amount: 1200,
 *   partySize: 2
 * });
 * ```
 *
 * Example 6: Learn from transaction
 * ```typescript
 * const { hybrid } = useAI();
 * await hybrid.handleTransactionComplete({
 *   merchantName: "La Pinoz",
 *   amount: 1200,
 *   category: "restaurant"
 * });
 * ```
 */

export default useAI;
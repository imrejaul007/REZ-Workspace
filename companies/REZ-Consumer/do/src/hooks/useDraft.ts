/**
 * useDraft - Hook for saving and retrieving chat drafts
 * Automatically persists text input to AsyncStorage
 */

import { useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_KEY = 'chat_draft_';

interface UseDraftReturn {
  saveDraft: (text: string) => Promise<void>;
  getDraft: () => Promise<string | null>;
  clearDraft: () => Promise<void>;
  restoreDraft: (setText: (text: string) => void) => Promise<void>;
}

/**
 * Hook for managing chat draft persistence
 * Saves text to AsyncStorage to preserve unsent messages
 */
export const useDraft = (): UseDraftReturn => {
  /**
   * Save draft text to AsyncStorage
   * Only saves if text has content (non-empty after trim)
   */
  const saveDraft = useCallback(async (text: string): Promise<void> => {
    try {
      if (text.trim()) {
        await AsyncStorage.setItem(DRAFT_KEY, text);
      } else {
        // Clear if empty to avoid storing unnecessary data
        await AsyncStorage.removeItem(DRAFT_KEY);
      }
    } catch (error) {
      // Silent fail - drafts are non-critical
      console.warn('Failed to save draft:', error);
    }
  }, []);

  /**
   * Retrieve saved draft from AsyncStorage
   * Returns null if no draft exists
   */
  const getDraft = useCallback(async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(DRAFT_KEY);
    } catch (error) {
      console.warn('Failed to get draft:', error);
      return null;
    }
  }, []);

  /**
   * Clear saved draft from AsyncStorage
   */
  const clearDraft = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      console.warn('Failed to clear draft:', error);
    }
  }, []);

  /**
   * Restore draft and set it to the text state
   * Convenience method that combines getDraft + setText
   */
  const restoreDraft = useCallback(
    async (setText: (text: string) => void): Promise<void> => {
      try {
        const draft = await AsyncStorage.getItem(DRAFT_KEY);
        if (draft && draft.trim()) {
          setText(draft);
        }
      } catch (error) {
        console.warn('Failed to restore draft:', error);
      }
    },
    []
  );

  return {
    saveDraft,
    getDraft,
    clearDraft,
    restoreDraft,
  };
};

export default useDraft;

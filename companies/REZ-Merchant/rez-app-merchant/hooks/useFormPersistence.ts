import { useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { logger } from '@/utils/logger';

export interface FormPersistenceOptions<T> {
  /** Unique storage key for this form */
  key: string;
  /** Form data to persist */
  formData: T;
  /** Callback when draft is loaded */
  onDraftLoaded?: (draft: T) => void;
  /** Auto-save interval in milliseconds (default: 30000 = 30s) */
  autoSaveInterval?: number;
  /** Debounce delay for saving on form changes in milliseconds (default: 2000 = 2s) */
  debounceDelay?: number;
  /** Number of days before draft expires (default: 7) */
  expiryDays?: number;
  /** Fields to exclude from persistence (e.g., sensitive data, computed values) */
  excludeFields?: (keyof T)[];
  /** Enable/disable persistence */
  enabled?: boolean;
}

export interface DraftMetadata {
  savedAt: string;
  expiresAt: string;
  version: string;
}

export interface PersistedDraft<T> {
  data: T;
  metadata: DraftMetadata;
}

const DRAFT_VERSION = '1.0.0';

// List of sensitive fields that should be stored in SecureStore
const SENSITIVE_KEYS = [
  'pan',
  'aadhaar',
  'gstin',
  'bankAccount',
  'ifsc',
  'accountNumber',
  'panNumber',
  'aadhaarNumber',
];

/**
 * Hook for persisting form data to AsyncStorage with auto-save and draft management
 *
 * @example
 * ```typescript
 * const {
 *   hasDraft,
 *   draftSavedAt,
 *   loadDraft,
 *   clearDraft,
 *   isSaving,
 *   lastSavedAt
 * } = useFormPersistence({
 *   key: 'product-add-form',
 *   formData,
 *   onDraftLoaded: (draft) => setFormData(draft),
 *   excludeFields: ['images', 'videos'] // Don't persist image blobs
 * });
 * ```
 */
export function useFormPersistence<T extends Record<string, unknown>>({
  key,
  formData,
  onDraftLoaded,
  autoSaveInterval = 30000, // 30 seconds
  debounceDelay = 2000, // 2 seconds
  expiryDays = 7,
  excludeFields = [],
  enabled = true,
}: FormPersistenceOptions<T>) {
  const [hasDraft, setHasDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousFormDataRef = useRef<T | null>(null);
  const isInitializedRef = useRef(false);
  const isSavingRef = useRef(false);
  const isMountedRef = useRef(true);
  // MERCH-022: Add guard to prevent race condition between debounce and auto-save
  const lastSaveTimeRef = useRef<number>(0);

  const STORAGE_KEY = `@form_draft:${key}`;

  /**
   * Filter out excluded fields and prepare data for storage
   */
  const prepareDataForStorage = useCallback(
    (data: T): Partial<T> => {
      const filtered = JSON.parse(JSON.stringify(data));

      // Remove excluded fields
      excludeFields.forEach((field) => {
        delete (filtered as unknown)[field];
      });

      // Remove image/video blob data but keep URIs
      Object.keys(filtered).forEach((key) => {
        const value = (filtered as unknown)[key];

        // Handle array of objects (like images/videos)
        if (Array.isArray(value)) {
          (filtered as unknown)[key] = value.map((item) => {
            if (typeof item === 'object' && item !== null) {
              // Keep only URLs and metadata, remove blobs
              const { uri, url, id, altText, title, thumbnailUrl, sortOrder, isMain, duration } =
                item;
              return { uri, url, id, altText, title, thumbnailUrl, sortOrder, isMain, duration };
            }
            return item;
          }) as unknown;
        }
      });

      return filtered;
    },
    [excludeFields]
  );

  /**
   * Save draft to AsyncStorage (non-sensitive fields) and SecureStore (sensitive fields)
   * MERCH-022: Added debounce guard to prevent race condition
   * H-9: Route sensitive fields (PAN, Aadhaar, GSTIN, bank details) to SecureStore
   */
  const saveDraft = useCallback(
    async (data: T) => {
      if (!enabled || !isMountedRef.current) return;

      // Prevent concurrent saves
      if (isSavingRef.current) return;

      // MERCH-022: Guard against rapid successive saves
      const now = Date.now();
      if (now - lastSaveTimeRef.current < 500) {
        // Skip save if less than 500ms since last save
        return;
      }

      isSavingRef.current = true;
      lastSaveTimeRef.current = now;

      try {
        setIsSaving(true);

        const preparedData = prepareDataForStorage(data);
        const saveDate = new Date();
        const expiresAt = new Date(saveDate.getTime() + expiryDays * 24 * 60 * 60 * 1000);

        const draft: PersistedDraft<Partial<T>> = {
          data: preparedData,
          metadata: {
            savedAt: saveDate.toISOString(),
            expiresAt: expiresAt.toISOString(),
            version: DRAFT_VERSION,
          },
        };

        // Save non-sensitive fields to AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draft));

        // Save sensitive fields to SecureStore
        for (const [fieldKey, fieldValue] of Object.entries(preparedData)) {
          if (
            SENSITIVE_KEYS.some((k) => fieldKey.includes(k)) &&
            fieldValue !== undefined &&
            fieldValue !== null
          ) {
            try {
              await SecureStore.setItemAsync(
                `${STORAGE_KEY}_${fieldKey}`,
                JSON.stringify(fieldValue)
              );
            } catch (error) {
              logger.error(`[FormPersistence] Error saving sensitive field ${fieldKey}:`, error);
            }
          }
        }

        setLastSavedAt(saveDate);

        logger.info(`[FormPersistence] Draft saved for key: ${key}`);
      } catch (error) {
        logger.error(`[FormPersistence] Error saving draft for key ${key}:`, error);
      } finally {
        setIsSaving(false);
        isSavingRef.current = false;
      }
    },
    [enabled, key, STORAGE_KEY, prepareDataForStorage, expiryDays]
  );

  /**
   * Load draft from AsyncStorage
   */
  /**
   * Clear draft from AsyncStorage and SecureStore
   * Defined before loadDraft so it can be included in loadDraft's dependency array.
   * H-9: Also clear sensitive fields from SecureStore
   */
  const clearDraft = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);

      // Also clear any sensitive fields from SecureStore
      for (const sensitiveKey of SENSITIVE_KEYS) {
        try {
          await SecureStore.deleteItemAsync(`${STORAGE_KEY}_${sensitiveKey}`);
        } catch (error) {
          // Ignore errors if key doesn't exist
        }
      }

      setHasDraft(false);
      setDraftSavedAt(null);
      setLastSavedAt(null);
      logger.info(`[FormPersistence] Draft cleared for key: ${key}`);
    } catch (error) {
      logger.error(`[FormPersistence] Error clearing draft for key ${key}:`, error);
    }
  }, [key, STORAGE_KEY]);

  const loadDraft = useCallback(async (): Promise<boolean> => {
    if (!enabled) return false;

    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);

      if (!stored) {
        logger.info(`[FormPersistence] No draft found for key: ${key}`);
        return false;
      }

      let draft: PersistedDraft<Partial<T>>;
      try {
        draft = JSON.parse(stored);
      } catch (e) {
        logger.error('[FormPersistence] Failed to parse draft:', e);
        await clearDraft();
        return false;
      }
      const now = new Date();
      const expiresAt = new Date(draft.metadata.expiresAt);

      // Check if draft has expired
      if (now > expiresAt) {
        logger.info(`[FormPersistence] Draft expired for key: ${key}`);
        await clearDraft();
        return false;
      }

      // H-9: Load sensitive fields from SecureStore
      for (const sensitiveKey of SENSITIVE_KEYS) {
        try {
          const secureValue = await SecureStore.getItemAsync(`${STORAGE_KEY}_${sensitiveKey}`);
          if (secureValue) {
            (draft.data as unknown)[sensitiveKey] = JSON.parse(secureValue);
          }
        } catch (error) {
          // Ignore errors if key doesn't exist in SecureStore
        }
      }

      const savedAt = new Date(draft.metadata.savedAt);
      setDraftSavedAt(savedAt);
      setHasDraft(true);

      logger.info(
        `[FormPersistence] Draft loaded for key: ${key}, saved at: ${savedAt.toLocaleString()}`
      );

      // Notify parent component
      if (onDraftLoaded) {
        onDraftLoaded(draft.data as T);
      }

      return true;
    } catch (error) {
      logger.error(`[FormPersistence] Error loading draft for key ${key}:`, error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [enabled, key, STORAGE_KEY, onDraftLoaded, clearDraft]);

  /**
   * Manually trigger a save
   */
  const saveNow = useCallback(() => {
    saveDraft(formData);
  }, [formData, saveDraft]);

  /**
   * Check if form data has changed
   */
  const hasFormDataChanged = useCallback((current: T, previous: T | null): boolean => {
    if (!previous) return false;
    return JSON.stringify(current) !== JSON.stringify(previous);
  }, []);

  /**
   * Initialize - check for existing draft on mount
   */
  useEffect(() => {
    isMountedRef.current = true;

    if (!isInitializedRef.current && enabled) {
      isInitializedRef.current = true;
      loadDraft();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [enabled, loadDraft]);

  /**
   * Debounced save on form data change
   */
  useEffect(() => {
    if (!enabled || !isInitializedRef.current) return;

    const hasChanged = hasFormDataChanged(formData, previousFormDataRef.current);

    if (hasChanged) {
      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        saveDraft(formData);
      }, debounceDelay);
    }

    previousFormDataRef.current = formData;

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData, enabled, hasFormDataChanged, saveDraft, debounceDelay]);

  /**
   * Auto-save interval
   */
  useEffect(() => {
    if (!enabled || !isInitializedRef.current) return;

    // Set up auto-save interval
    autoSaveTimerRef.current = setInterval(() => {
      const hasChanged = hasFormDataChanged(formData, previousFormDataRef.current);
      if (hasChanged) {
        saveDraft(formData);
      }
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [enabled, formData, autoSaveInterval, hasFormDataChanged, saveDraft]);

  /**
   * Cleanup expired drafts across all forms (utility)
   */
  const cleanupExpiredDrafts = useCallback(async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const draftKeys = allKeys.filter((k) => k.startsWith('@form_draft:'));

      const now = new Date();
      let cleanedCount = 0;

      for (const key of draftKeys) {
        const stored = await AsyncStorage.getItem(key);
        if (!stored) continue;

        try {
          const draft: PersistedDraft<unknown> = JSON.parse(stored);
          const expiresAt = new Date(draft.metadata.expiresAt);

          if (now > expiresAt) {
            await AsyncStorage.removeItem(key);
            cleanedCount++;
          }
        } catch (error) {
          // Invalid draft, remove it
          await AsyncStorage.removeItem(key);
          cleanedCount++;
        }
      }

      logger.info(`[FormPersistence] Cleaned up ${cleanedCount} expired drafts`);
      return cleanedCount;
    } catch (error) {
      logger.error('[FormPersistence] Error cleaning up expired drafts:', error);
      return 0;
    }
  }, []);

  return {
    /** Whether a draft exists for this form */
    hasDraft,
    /** When the draft was saved */
    draftSavedAt,
    /** When data was last saved (during current session) */
    lastSavedAt,
    /** Whether a save operation is in progress */
    isSaving,
    /** Whether initial draft check is in progress */
    isLoading,
    /** Load existing draft */
    loadDraft,
    /** Clear the draft */
    clearDraft,
    /** Manually save now (bypasses debounce) */
    saveNow,
    /** Cleanup expired drafts (utility) */
    cleanupExpiredDrafts,
  };
}

/**
 * PreferencesContext
 *
 * Owns merchant-scoped UI preferences that should persist across sessions on the
 * same device but are not part of the authenticated backend profile:
 *   - merchantMode (Simple / Growth / Advanced feature filter — see utils/verticalFeatures.ts)
 *   - dismissedActions (growth-prompt dismissals with reason, LRU-trimmed to 100)
 *   - lastSeenGrowthActionsAt (for "unread" dot on Growth tab)
 *   - goalTabLastViewed (which Goal sub-tab the merchant last opened)
 *   - identityCaptureMode (POS "require customer identity before Pay" toggle)
 *
 * Persistence:
 *   - AsyncStorage key: `@rez_merchant_preferences`
 *   - Hydrates from storage on mount (with corruption-safe JSON parse).
 *   - Writes are debounced (500ms) so bursty updates collapse into one write.
 *   - Write failures are logged but never thrown — the in-memory state stays authoritative.
 *
 * Intentional non-goals:
 *   - We do NOT clear preferences on logout. Preferences are device-scoped UX state,
 *     not identity-scoped. A merchant reinstalling the app will get defaults; a
 *     teammate logging in on the same device will inherit the device's preferences.
 *     If stricter per-merchant isolation is ever needed, scope the AsyncStorage key
 *     by merchant id.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { MerchantMode } from '../utils/verticalFeatures';
import { MERCHANT_MODES } from '../utils/verticalFeatures';
import { logger } from '@/utils/logger';

// ============================================================================
// Types
// ============================================================================

export type DismissedReason =
  | 'not_relevant'
  | 'already_did'
  | 'too_expensive'
  | 'wrong_timing'
  | 'other';

export type GoalTab = 'customers' | 'repeat' | 'revenue';

export type IdentityCaptureMode = 'required' | 'optional';

export interface DismissedAction {
  /** Rule id shared across occurrences, e.g. 'low_afternoon_traffic'. */
  actionId: string;
  /** Unique per surfaced occurrence (UUID). Dedupes the same rule firing twice. */
  instanceId: string;
  /** ISO-8601 timestamp. Also used as the LRU key for eviction. */
  dismissedAt: string;
  dismissedReason: DismissedReason;
  /** Free-text only when dismissedReason === 'other'. */
  dismissedNote?: string;
}

export interface Preferences {
  merchantMode: MerchantMode;
  /** LRU-trimmed to MAX_DISMISSED_ACTIONS entries, newest first. */
  dismissedActions: DismissedAction[];
  lastSeenGrowthActionsAt: string | null;
  goalTabLastViewed: GoalTab | null;
  identityCaptureMode: IdentityCaptureMode;
}

interface PreferencesContextValue {
  preferences: Preferences;
  /** True while we're still hydrating from AsyncStorage. */
  isHydrated: boolean;
  /** Merge a partial update into preferences (debounce-persisted). */
  updatePreferences: (patch: Partial<Preferences>) => void;
  /** Append a dismissal; caller is responsible for supplying a unique instanceId. */
  dismissAction: (
    actionId: string,
    instanceId: string,
    reason: DismissedReason,
    note?: string
  ) => void;
  /** Set the mode toggle. */
  setMerchantMode: (mode: MerchantMode) => void;
  /** Set the POS identity-capture requirement. */
  setIdentityCaptureMode: (mode: IdentityCaptureMode) => void;
  /** Stamp `lastSeenGrowthActionsAt` to now — call when user views the Growth tab. */
  markGrowthActionsSeen: () => void;
  /** Remember which Goal sub-tab the user last opened. */
  setGoalTabLastViewed: (tab: GoalTab) => void;
}

// ============================================================================
// Constants
// ============================================================================

export const PREFERENCES_STORAGE_KEY = '@rez_merchant_preferences';
export const MAX_DISMISSED_ACTIONS = 100;
const PERSIST_DEBOUNCE_MS = 500;

export const DEFAULT_PREFERENCES: Preferences = {
  merchantMode: 'simple',
  dismissedActions: [],
  lastSeenGrowthActionsAt: null,
  goalTabLastViewed: null,
  identityCaptureMode: 'required',
};

// ============================================================================
// Pure helpers (exported for unit testing)
// ============================================================================

/**
 * Parse a raw AsyncStorage string into a Preferences object.
 * Returns DEFAULT_PREFERENCES on unknown of:
 *   - null / undefined / empty string
 *   - malformed JSON
 *   - non-object root
 *   - missing / wrong-typed fields (we fill individually, so a partial-corrupt
 *     payload can still surface the healthy fields).
 *
 * Never throws.
 */
export function parsePreferences(raw: string | null | undefined): Preferences {
  if (!raw) return { ...DEFAULT_PREFERENCES };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ...DEFAULT_PREFERENCES };
  }

  const p = parsed as Record<string, unknown>;

  const merchantMode: MerchantMode =
    p.merchantMode === 'simple' || p.merchantMode === 'growth' || p.merchantMode === 'advanced'
      ? p.merchantMode
      : DEFAULT_PREFERENCES.merchantMode;

  const dismissedActions: DismissedAction[] = Array.isArray(p.dismissedActions)
    ? (p.dismissedActions.filter(isValidDismissedAction) as DismissedAction[])
    : [];

  const lastSeenGrowthActionsAt: string | null =
    typeof p.lastSeenGrowthActionsAt === 'string' ? p.lastSeenGrowthActionsAt : null;

  const goalTabLastViewed: GoalTab | null =
    p.goalTabLastViewed === 'customers' ||
    p.goalTabLastViewed === 'repeat' ||
    p.goalTabLastViewed === 'revenue'
      ? p.goalTabLastViewed
      : null;

  const identityCaptureMode: IdentityCaptureMode =
    p.identityCaptureMode === 'required' || p.identityCaptureMode === 'optional'
      ? p.identityCaptureMode
      : DEFAULT_PREFERENCES.identityCaptureMode;

  return {
    merchantMode,
    dismissedActions: trimDismissed(dismissedActions),
    lastSeenGrowthActionsAt,
    goalTabLastViewed,
    identityCaptureMode,
  };
}

function isValidDismissedAction(v: unknown): v is DismissedAction {
  if (typeof v !== 'object' || v === null) return false;
  const d = v as Record<string, unknown>;
  const reasonOk =
    d.dismissedReason === 'not_relevant' ||
    d.dismissedReason === 'already_did' ||
    d.dismissedReason === 'too_expensive' ||
    d.dismissedReason === 'wrong_timing' ||
    d.dismissedReason === 'other';
  return (
    typeof d.actionId === 'string' &&
    typeof d.instanceId === 'string' &&
    typeof d.dismissedAt === 'string' &&
    reasonOk &&
    (d.dismissedNote === undefined || typeof d.dismissedNote === 'string')
  );
}

/**
 * LRU-trim the dismissed actions list to MAX_DISMISSED_ACTIONS entries, evicting
 * the oldest (smallest dismissedAt) first. Operates on a defensive copy.
 *
 * Callers can pre-pend or append; we sort by dismissedAt DESC and slice so
 * the newest entries win regardless of insertion order.
 */
export function trimDismissed(list: DismissedAction[]): DismissedAction[] {
  if (list.length <= MAX_DISMISSED_ACTIONS) return [...list];
  const sorted = [...list].sort((a, b) => (a.dismissedAt < b.dismissedAt ? 1 : -1));
  return sorted.slice(0, MAX_DISMISSED_ACTIONS);
}

/**
 * Insert a dismissal into the list, then LRU-trim.
 * If an entry with the same instanceId already exists, it is replaced (idempotent
 * re-dismissal from the UI won't grow the list).
 */
export function appendDismissal(
  list: DismissedAction[],
  entry: DismissedAction
): DismissedAction[] {
  const deduped = list.filter((d) => d.instanceId !== entry.instanceId);
  return trimDismissed([entry, ...deduped]);
}

// ============================================================================
// Context
// ============================================================================

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [isHydrated, setIsHydrated] = useState(false);

  // Used to skip the first persistence cycle: we don't want to immediately re-write
  // defaults over storage before hydration finishes.
  const hasHydratedRef = useRef(false);
  const pendingWriteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Hydrate on mount ---------------------------------------------------

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
        if (cancelled) return;
        const hydrated = parsePreferences(raw);
        setPreferences(hydrated);
      } catch (err) {
        // Read failure: keep defaults. Never throw.
        logger.warn('[Preferences] Hydration failed, using defaults:', err);
      } finally {
        if (!cancelled) {
          hasHydratedRef.current = true;
          setIsHydrated(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Debounced persistence ---------------------------------------------

  useEffect(() => {
    if (!hasHydratedRef.current) return;

    if (pendingWriteTimer.current) {
      clearTimeout(pendingWriteTimer.current);
    }

    pendingWriteTimer.current = setTimeout(() => {
      (async () => {
        try {
          await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
        } catch (err) {
          // Storage write failure is non-fatal — the in-memory state is still correct
          // and we'll retry on the next update. Log in dev; swallow in prod.
          logger.warn('[Preferences] Persist failed:', err);
        }
      })();
      pendingWriteTimer.current = null;
    }, PERSIST_DEBOUNCE_MS);

    return () => {
      if (pendingWriteTimer.current) {
        clearTimeout(pendingWriteTimer.current);
        pendingWriteTimer.current = null;
      }
    };
  }, [preferences]);

  // Flush any pending write on unmount so an app-kill right after a toggle
  // still persists. We fire-and-forget; AsyncStorage.setItem is async but there
  // is nothing we can await here.
  useEffect(() => {
    return () => {
      if (pendingWriteTimer.current) {
        clearTimeout(pendingWriteTimer.current);
        pendingWriteTimer.current = null;
        AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences)).catch((err) => {
          logger.warn('[Preferences] Flush-on-unmount failed:', err);
        });
      }
    };
    // Intentionally only on unmount — latest `preferences` is captured via closure
    // but we re-register the effect whenever it changes so the closure stays fresh.
  }, [preferences]);

  // ---- Updaters -----------------------------------------------------------

  const updatePreferences = useCallback((patch: Partial<Preferences>) => {
    setPreferences((prev) => ({ ...prev, ...patch }));
  }, []);

  const dismissAction = useCallback(
    (actionId: string, instanceId: string, reason: DismissedReason, note?: string) => {
      setPreferences((prev) => {
        const entry: DismissedAction = {
          actionId,
          instanceId,
          dismissedAt: new Date().toISOString(),
          dismissedReason: reason,
          // Only store a note when the reason is 'other' — avoids leaking stray notes
          // on the canonical reasons and matches the spec's shape.
          ...(reason === 'other' && note ? { dismissedNote: note } : {}),
        };
        return {
          ...prev,
          dismissedActions: appendDismissal(prev.dismissedActions, entry),
        };
      });
    },
    []
  );

  const setMerchantMode = useCallback((mode: MerchantMode) => {
    setPreferences((prev) => (prev.merchantMode === mode ? prev : { ...prev, merchantMode: mode }));
  }, []);

  const setIdentityCaptureMode = useCallback((mode: IdentityCaptureMode) => {
    setPreferences((prev) =>
      prev.identityCaptureMode === mode ? prev : { ...prev, identityCaptureMode: mode }
    );
  }, []);

  const markGrowthActionsSeen = useCallback(() => {
    setPreferences((prev) => ({
      ...prev,
      lastSeenGrowthActionsAt: new Date().toISOString(),
    }));
  }, []);

  const setGoalTabLastViewed = useCallback((tab: GoalTab) => {
    setPreferences((prev) =>
      prev.goalTabLastViewed === tab ? prev : { ...prev, goalTabLastViewed: tab }
    );
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      isHydrated,
      updatePreferences,
      dismissAction,
      setMerchantMode,
      setIdentityCaptureMode,
      markGrowthActionsSeen,
      setGoalTabLastViewed,
    }),
    [
      preferences,
      isHydrated,
      updatePreferences,
      dismissAction,
      setMerchantMode,
      setIdentityCaptureMode,
      markGrowthActionsSeen,
      setGoalTabLastViewed,
    ]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

// ============================================================================
// Hooks
// ============================================================================

/** Full preferences + all setters. Use this from the Settings screen. */
export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (ctx === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return ctx;
}

/**
 * Just the mode — cheap subscriber for feature-gated screens.
 *
 * Returns `modes` (the MERCHANT_MODES constant from verticalFeatures) so
 * consumers can iterate for a mode-picker UI without a second import.
 * This is the canonical implementation — the older standalone
 * `hooks/useMerchantMode.ts` is now a re-export of this hook.
 */
export function useMerchantMode(): {
  mode: MerchantMode;
  setMode: (mode: MerchantMode) => void;
  modes: typeof MERCHANT_MODES;
} {
  const { preferences, setMerchantMode } = usePreferences();
  return { mode: preferences.merchantMode, setMode: setMerchantMode, modes: MERCHANT_MODES };
}

/** Just the dismissed-actions list — for growth action filtering. */
export function useDismissedActions(): DismissedAction[] {
  const { preferences } = usePreferences();
  return preferences.dismissedActions;
}

/**
 * Stable dismiss callback. Caller must generate a unique instanceId (UUID)
 * per surfaced occurrence — this hook deliberately does not own ID generation
 * so the UI can correlate the dismissal with the action instance it rendered.
 */
export function useDismissAction(): (
  actionId: string,
  instanceId: string,
  reason: DismissedReason,
  note?: string
) => void {
  const { dismissAction } = usePreferences();
  return dismissAction;
}

/** Identity-capture toggle + setter — read by the POS Pay button. */
export function useIdentityCaptureMode(): {
  mode: IdentityCaptureMode;
  setMode: (mode: IdentityCaptureMode) => void;
} {
  const { preferences, setIdentityCaptureMode } = usePreferences();
  return { mode: preferences.identityCaptureMode, setMode: setIdentityCaptureMode };
}

export default PreferencesContext;

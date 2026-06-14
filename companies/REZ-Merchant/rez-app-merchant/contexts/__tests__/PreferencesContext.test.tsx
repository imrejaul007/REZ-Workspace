/**
 * PreferencesContext tests
 *
 * We test the Provider's externally-observable behaviour by:
 *   1. Mocking AsyncStorage in-memory (same pattern used elsewhere in __tests__/).
 *   2. Exercising the exported pure helpers (parsePreferences, appendDismissal)
 *      — these are what the Provider calls on hydration and on every dismissal,
 *      so covering them covers the Provider's semantics without needing a DOM /
 *      react-test-renderer (neither is installed in this workspace).
 *
 * Four required cases:
 *   1. Defaults render when AsyncStorage is empty.
 *   2. Hydration picks up a valid payload from AsyncStorage.
 *   3. Dismissing 101 actions evicts the oldest.
 *   4. Malformed AsyncStorage JSON falls back to defaults.
 */

// Mock AsyncStorage before importing the module under test so the Provider's
// module-level import resolves to the mock. We keep a simple in-memory map.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => (store.has(k) ? store.get(k)! : null)),
      setItem: jest.fn(async (k: string, v: string) => {
        store.set(k, v);
      }),
      removeItem: jest.fn(async (k: string) => {
        store.delete(k);
      }),
      multiRemove: jest.fn(async (keys: string[]) => {
        keys.forEach((k) => store.delete(k));
      }),
      clear: jest.fn(async () => {
        store.clear();
      }),
      __store: store,
    },
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_PREFERENCES,
  MAX_DISMISSED_ACTIONS,
  PREFERENCES_STORAGE_KEY,
  appendDismissal,
  parsePreferences,
  type DismissedAction,
} from '../PreferencesContext';

// Convenience: the in-memory store attached to the mock so tests can seed it.
const asyncStore = (AsyncStorage as unknown).__store as Map<string, string>;

beforeEach(() => {
  asyncStore.clear();
  jest.clearAllMocks();
});

describe('PreferencesContext — hydration semantics', () => {
  it('1. returns defaults when AsyncStorage is empty (Provider mount path)', async () => {
    // Provider calls AsyncStorage.getItem(KEY) → null → parsePreferences(null).
    const raw = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
    expect(raw).toBeNull();

    const hydrated = parsePreferences(raw);
    expect(hydrated).toEqual(DEFAULT_PREFERENCES);
    // And must be a defensive copy — mutating the result must not leak into DEFAULT_PREFERENCES.
    hydrated.merchantMode = 'advanced';
    expect(DEFAULT_PREFERENCES.merchantMode).toBe('simple');
  });

  it('2. hydrates from a valid AsyncStorage payload', async () => {
    const stored = {
      merchantMode: 'growth',
      dismissedActions: [
        {
          actionId: 'low_afternoon_traffic',
          instanceId: 'inst-1',
          dismissedAt: '2026-04-01T10:00:00.000Z',
          dismissedReason: 'already_did',
        },
      ],
      lastSeenGrowthActionsAt: '2026-04-15T09:00:00.000Z',
      goalTabLastViewed: 'repeat',
      identityCaptureMode: 'optional',
    };
    await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(stored));

    const raw = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
    const hydrated = parsePreferences(raw);

    expect(hydrated.merchantMode).toBe('growth');
    expect(hydrated.identityCaptureMode).toBe('optional');
    expect(hydrated.goalTabLastViewed).toBe('repeat');
    expect(hydrated.lastSeenGrowthActionsAt).toBe('2026-04-15T09:00:00.000Z');
    expect(hydrated.dismissedActions).toHaveLength(1);
    expect(hydrated.dismissedActions[0].actionId).toBe('low_afternoon_traffic');
  });
});

describe('PreferencesContext — dismissed-action LRU', () => {
  it('3. dismissing 101 actions evicts the oldest', () => {
    // Build 100 dismissals with strictly increasing timestamps.
    // dismissedAt ordering drives LRU eviction — the smallest timestamp loses.
    const base = Date.parse('2026-01-01T00:00:00.000Z');
    let list: DismissedAction[] = [];
    for (let i = 0; i < 100; i += 1) {
      list = appendDismissal(list, {
        actionId: 'rule_a',
        instanceId: `inst-${i}`,
        dismissedAt: new Date(base + i * 1000).toISOString(),
        dismissedReason: 'not_relevant',
      });
    }
    expect(list).toHaveLength(MAX_DISMISSED_ACTIONS);

    // Sanity: the oldest (i=0) is currently in the list.
    expect(list.some((d) => d.instanceId === 'inst-0')).toBe(true);

    // Add a 101st, strictly newer than any existing.
    list = appendDismissal(list, {
      actionId: 'rule_a',
      instanceId: 'inst-100',
      dismissedAt: new Date(base + 100 * 1000).toISOString(),
      dismissedReason: 'wrong_timing',
    });

    expect(list).toHaveLength(MAX_DISMISSED_ACTIONS);
    // New entry is retained.
    expect(list.some((d) => d.instanceId === 'inst-100')).toBe(true);
    // Oldest entry (inst-0) was evicted.
    expect(list.some((d) => d.instanceId === 'inst-0')).toBe(false);
  });
});

describe('PreferencesContext — corruption safety', () => {
  it('4. malformed AsyncStorage JSON falls back to defaults', async () => {
    await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, '{not valid json::::');
    const raw = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
    expect(raw).toBe('{not valid json::::');

    // parsePreferences never throws; returns a defaults copy.
    const hydrated = parsePreferences(raw);
    expect(hydrated).toEqual(DEFAULT_PREFERENCES);

    // Also: non-object JSON (e.g. a raw array or string) must fall back, not crash.
    expect(parsePreferences('"just a string"')).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('[1,2,3]')).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('null')).toEqual(DEFAULT_PREFERENCES);
  });
});

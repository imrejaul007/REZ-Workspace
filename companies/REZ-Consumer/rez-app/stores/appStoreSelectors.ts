/**
 * Focused selector hooks over the canonical Zustand appStore.
 *
 * F6 — AppContext split
 * ----------------------
 * The original useApp() hook returned the ENTIRE AppContextType object.
 * Every consumer re-rendered on unknown state change — a settings toggle
 * rippled through 300+ screens that only cared about language or
 * colorScheme.
 *
 * Zustand selectors short-circuit that: a component that only reads
 * `colorScheme` only re-renders when that exact value changes. Use
 * the hooks here in place of useApp().
 *
 * Migration guide (for code review / incremental rollout):
 *
 *   // Before
 *   const { state, actions } = useApp();
 *   const scheme = state.settings.colorScheme === 'auto' ? ... : ...;
 *   actions.setLanguage('hi');
 *
 *   // After
 *   const scheme = useColorScheme();      // effective light|dark only
 *   const { setLanguage } = useAppActions();
 *   setLanguage('hi');
 */

import { useColorScheme as useNativeColorScheme } from 'react-native';
import { useAppStore } from './appStore';

// ── Settings slices ────────────────────────────────────────────────

/**
 * Effective color scheme (auto → resolved to native).
 * Re-renders only when user preference OR native scheme flips.
 */
export function useColorScheme(): 'light' | 'dark' {
  const pref = useAppStore((s: ReturnType<typeof useAppStore.getState>) => s.state.settings.colorScheme);
  const native = useNativeColorScheme();
  if (pref === 'auto') return native === 'dark' ? 'dark' : 'light';
  return pref;
}

/** Selected UI language. */
export function useLanguage() {
  return useAppStore((s: ReturnType<typeof useAppStore.getState>) => s.state.settings.language);
}

/** Notification preference flags (push/email/sms/offers/orders). */
export function useNotificationPrefs() {
  return useAppStore((s: ReturnType<typeof useAppStore.getState>) => s.state.settings.notifications);
}

/** Privacy preference flags (analytics/locationTracking/personalizedAds). */
export function usePrivacyPrefs() {
  return useAppStore((s: ReturnType<typeof useAppStore.getState>) => s.state.settings.privacy);
}

/** Currency / default location / autoLogin. */
export function useAppPreferences() {
  return useAppStore((s: ReturnType<typeof useAppStore.getState>) => s.state.settings.preferences);
}

/** Only the selected currency code — for components that just format money. */
export function useCurrency() {
  return useAppStore((s: ReturnType<typeof useAppStore.getState>) => s.state.settings.preferences.currency);
}

// ── First-launch + lifecycle ───────────────────────────────────────

export function useIsFirstLaunch() {
  return useAppStore((s: ReturnType<typeof useAppStore.getState>) => s.state.isFirstLaunch);
}

export function useAppLoading() {
  return useAppStore((s: ReturnType<typeof useAppStore.getState>) => s.state.isLoading);
}

export function useAppError() {
  return useAppStore((s: ReturnType<typeof useAppStore.getState>) => s.state.error);
}

// ── Actions (stable reference — subscribing does NOT cause re-renders) ──
// The entire actions bag is frozen at store creation, so consumers can
// destructure without any risk of unnecessary re-renders. This is the
// correct Zustand pattern; no need to split into per-action hooks.

export function useAppActions() {
  return useAppStore((s: ReturnType<typeof useAppStore.getState>) => s.actions);
}

// ── Derived helpers ────────────────────────────────────────────────

/**
 * Returns a stable formatter function that re-renders the caller only
 * when the selected currency actually changes (not on every unrelated
 * settings update the way old useApp().computed.formattedCurrency did).
 *
 * The store's computed.formattedCurrency is a closure over get() so it
 * always reads the latest currency; we just need the caller to re-render
 * when the currency *label* flips so labels redraw (₹ → $ etc.).
 */
export function useFormattedCurrency(): (amount: number) => string {
  // Subscribe to currency so the caller re-renders on currency swaps.
  useCurrency();
  // Return the store-bound formatter (stable identity; reads the live
  // currency inside its closure).
  return useAppStore.getState().computed.formattedCurrency;
}

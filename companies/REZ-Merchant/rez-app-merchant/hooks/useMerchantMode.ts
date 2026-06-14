/**
 * useMerchantMode — re-exports the canonical hook from PreferencesContext.
 *
 * This file previously owned its own AsyncStorage-backed implementation
 * using the key `merchant_ui_mode`. That created a silent fork with
 * PreferencesContext (storage key `@rez_merchant_preferences`): both
 * wrote merchant-mode state but to different keys, so if both ever got
 * consumed side-by-side, values would drift.
 *
 * Resolution: PreferencesContext is now the canonical store. This file
 * stays as a re-export so unknown existing import site continues to work
 * unchanged. New code may import from either path.
 *
 * NB: PreferencesProvider MUST be wired into the app provider stack
 * (app/_layout.tsx) for this hook to resolve. A call outside the
 * provider throws with a clear error from `usePreferences`.
 *
 * Migration note: existing merchants whose mode was persisted under the
 * old `merchant_ui_mode` key will lose that preference on first load
 * and fall back to PreferencesContext's default ('simple'). They can
 * re-select their mode; the new value persists under the canonical key.
 * If we need seamless migration, add a one-time read of the old key
 * inside PreferencesContext's hydrate step. Deferred for now — the
 * old hook was only consumed at one site (the dashboard mode picker).
 */

export { useMerchantMode } from '@/contexts/PreferencesContext';
export type { MerchantMode } from '@/utils/verticalFeatures';

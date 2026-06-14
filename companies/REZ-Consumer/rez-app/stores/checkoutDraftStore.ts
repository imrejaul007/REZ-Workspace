/**
 * checkoutDraftStore — OG-D004 FIX
 *
 * Persists lightweight checkout progress to AsyncStorage so that when the OS
 * kills the app mid-checkout and the user relaunches, the selected delivery
 * address and payment method are restored instead of being silently lost.
 *
 * What IS persisted  : selectedAddressId, paymentMethod, fulfillmentType
 * What is NOT persisted: coin amounts, promo codes — these must be re-fetched
 *   from the server on every checkout session because they can expire.
 *
 * The draft is cleared in two places:
 *   1. On successful order placement (clearDraft)
 *   2. When the user explicitly navigates away from checkout (clearDraft)
 *
 * Usage:
 * ```ts
 * // In useCheckout, after address is selected:
 * useCheckoutDraftStore.getState().saveDraft({ selectedAddressId: addr.id });
 *
 * // In initializeCheckout, after addresses are loaded:
 * const draft = useCheckoutDraftStore.getState().draft;
 * if (draft?.selectedAddressId) {
 *   defaultAddress = userAddresses.find(a => a.id === draft.selectedAddressId) ?? defaultAddress;
 * }
 *
 * // After successful order:
 * useCheckoutDraftStore.getState().clearDraft();
 * ```
 */

import { create, SetState, GetState } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CheckoutDraft {
  /** ID of the address the user last selected in the checkout session. */
  selectedAddressId: string | null;
  /** Payment method slug last selected (e.g. 'razorpay', 'cod', 'wallet'). */
  paymentMethod: string | null;
  /** Fulfillment type: 'delivery' | 'pickup' | 'dine_in' | 'drive_thru'. */
  fulfillmentType: string | null;
  /** Unix ms timestamp when the draft was last saved — used for staleness check. */
  savedAt: number | null;

  // ── Payment recovery fields (OG-D008 FIX) ──────────────────────────
  // Persisted so that if the app is killed between payment capture and
  // order creation, we can re-verify / recover on next launch.

  /** Razorpay payment ID returned by the checkout SDK after capture. */
  razorpayPaymentId: string | null;
  /** Razorpay order ID used to initiate the checkout session. */
  razorpayOrderId: string | null;
  /** Razorpay signature returned alongside payment ID for verification. */
  razorpaySignature: string | null;

  /** True when a wallet debit succeeded but the order has not yet been created. */
  walletPaymentPending: boolean;
  /** Wallet transaction ID from the debit — needed for refund if order creation fails. */
  walletTransactionId: string | null;
  /** Amount charged in the pending wallet/razorpay transaction. */
  pendingPaymentAmount: number | null;

  /** Set to true once the order has been confirmed for this draft session. */
  orderCreated: boolean;
}

export interface CheckoutDraftState {
  draft: CheckoutDraft | null;
  saveDraft: (partial: Partial<CheckoutDraft>) => void;
  clearDraft: () => void;
}

/** A draft is considered stale (and ignored) after 2 hours. */
const DRAFT_TTL_MS = 2 * 60 * 60 * 1000;

const emptyDraft: CheckoutDraft = {
  selectedAddressId: null,
  paymentMethod: null,
  fulfillmentType: null,
  savedAt: null,
  razorpayPaymentId: null,
  razorpayOrderId: null,
  razorpaySignature: null,
  walletPaymentPending: false,
  walletTransactionId: null,
  pendingPaymentAmount: null,
  orderCreated: false,
};

type StoreSet = SetState<CheckoutDraftState>;
type StoreGet = GetState<CheckoutDraftState>;

export const useCheckoutDraftStore = create<CheckoutDraftState>()(
  persist(
    (set: StoreSet, get: StoreGet) => ({
      draft: null,

      saveDraft: (partial: Partial<CheckoutDraft>) => {
        const existing = get().draft ?? emptyDraft;
        set({
          draft: {
            ...existing,
            ...partial,
            savedAt: Date.now(),
          },
        });
      },

      clearDraft: () => {
        set({ draft: null });
      },
    }),
    {
      name: '@checkout_draft',
      storage: createJSONStorage(() => AsyncStorage),

      // Only persist non-null, non-stale drafts
      partialize: (state: CheckoutDraftState) => {
        const draft = state.draft;
        if (!draft || !draft.savedAt) return { draft: null };
        const isStale = Date.now() - draft.savedAt > DRAFT_TTL_MS;
        return { draft: isStale ? null : draft };
      },
    }
  )
);

/**
 * Read the persisted draft and return it only if it is still within the TTL.
 * Returns null for stale or missing drafts.
 */
export function getActiveDraft(): CheckoutDraft | null {
  const draft = useCheckoutDraftStore.getState().draft;
  if (!draft || !draft.savedAt) return null;
  if (Date.now() - draft.savedAt > DRAFT_TTL_MS) {
    // Auto-clear stale draft
    useCheckoutDraftStore.getState().clearDraft();
    return null;
  }
  return draft;
}

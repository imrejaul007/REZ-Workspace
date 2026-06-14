/**
 * `useCheckout` — primary hook that drives the checkout flow.
 *
 * COMPOSITION: This file is kept intentionally thin by delegating to:
 *  - `useCheckoutState` — all state, refs, and side effects
 *  - `useCheckoutActions` — all action handlers
 *
 * This file was reduced from 2,917 lines (was 2,849 after dedup) to this
 * thin composition layer by extracting state and actions into separate hooks.
 *
 * @param retryOrderId - Optional Razorpay order ID to retry a failed payment.
 * @returns `UseCheckoutReturn` — the full checkout state and action handlers.
 *
 * @example
 * ```tsx
 * function CheckoutScreen() {
 *   const { state, actions, handlers } = useCheckout();
 *   // ...
 * }
 * ```
 */
import { useCheckoutState } from './useCheckoutState';
import { useCheckoutActions, type CheckoutActionsParams } from './useCheckoutActions';
import { useCheckoutDraftStore, type CheckoutDraftState } from '@/stores/checkoutDraftStore';
import { useRefreshWallet } from '@/stores/selectors';
import type { UseCheckoutReturn } from '@/types/checkout.types';

export const useCheckout = (retryOrderId?: string): UseCheckoutReturn => {
  const clearDraft = useCheckoutDraftStore((s: CheckoutDraftState) => s.clearDraft);
  const refreshSharedWallet = useRefreshWallet();

  // All state, refs, and side effects
  const stateResult = useCheckoutState(retryOrderId);

  // All actions and handlers — receives state+refs as params to avoid circular deps
  const actionsParams: CheckoutActionsParams = {
    state: stateResult.state,
    setState: stateResult.setState,
    isSubmittingRef: stateResult.isSubmittingRef,
    currencySymbol: stateResult.currencySymbol,
    orderIdempotencyKeyRef: stateResult.orderIdempotencyKeyRef,
    walletIdempotencyKeyRef: stateResult.walletIdempotencyKeyRef,
    assertOnline: stateResult.assertOnline,
    clearDraft,
    refreshSharedWallet,
  };

  const actions = useCheckoutActions(actionsParams);

  return {
    state: stateResult.state,
    actions: {
      applyPromoCode: actions.applyPromoCode,
      removePromoCode: actions.removePromoCode,
      toggleRezCoin: actions.toggleRezCoin,
      togglePromoCoin: actions.togglePromoCoin,
      selectPaymentMethod: actions.selectPaymentMethod,
      selectAddress: actions.selectAddress,
      updateBillSummary: actions.updateBillSummary,
      proceedToPayment: actions.proceedToPayment,
      processPayment: actions.processPayment,
      setFulfillmentType: actions.setFulfillmentType,
      setFulfillmentDetails: actions.setFulfillmentDetails,
    },
    handlers: {
      handlePromoCodeApply: actions.handlePromoCodeApply,
      handleCoinToggle: actions.handleCoinToggle,
      handleCustomCoinAmount: actions.handleCustomCoinAmount,
      handlePaymentMethodSelect: actions.handlePaymentMethodSelect,
      handleAddressSelect: actions.handleAddressSelect,
      handleProceedToPayment: actions.handleProceedToPayment,
      handleBackNavigation: actions.handleBackNavigation,
      handleWalletPayment: actions.handleWalletPayment,
      handleCODPayment: actions.handleCODPayment,
      handleRazorpayPayment: actions.handleRazorpayPayment,
      removePromoCode: actions.removePromoCode,
      navigateToOtherPaymentMethods: actions.navigateToOtherPaymentMethods,
      applyCardOffer: actions.applyCardOffer,
      removeCardOffer: actions.removeCardOffer,
    },
  };
};

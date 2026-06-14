/**
 * usePOSCartPayment - Extracted payment flow logic for POS cart
 * Part of usePOSCart.ts refactoring (Phase 7)
 */

import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { platformAlertSimple } from '@/utils/platformAlert';
import { CartItem, calcBillGST } from './usePOSCartState';
import { posService } from '@/services/api/pos';
import { apiClient } from '@/services/api/client';
import { printerService } from '@/services/printer';
import { logger } from '@/utils/logger';
import { useNetworkStatus } from './useNetworkStatus';
import { useStore } from '@/contexts/StoreContext';

interface UsePOSCartPaymentProps {
  cart: CartItem[];
  activeStore: { _id: string; name: string } | null;
  isOffline: boolean;
  tableNumber: string;
  confirmedSplitCount: number;
  customerMode: 'none' | 'walk-in' | 'selected';
  customerPhone: string | null;
  coinDiscountApplied: number;
  consumerIdForCoins: string | null;
  cartTotal: number;
  setCharging: (b: boolean) => void;
  setShowCart: (b: boolean) => void;
  setTableNumber: (s: string) => void;
  setConfirmedSplitCount: (n: number) => void;
  setCoinRedemptionAmount: (s: string) => void;
  setCoinDiscountApplied: (n: number) => void;
  setCoinRedemptionConfirmed: (b: boolean) => void;
  setConsumerIdForCoins: (s: string | null) => void;
  idempotencyKeyRef: React.MutableRefObject<string | null>;
  clearCart: () => void;
}

export function usePOSCartPayment({
  cart,
  activeStore,
  isOffline,
  tableNumber,
  confirmedSplitCount,
  customerMode,
  customerPhone,
  coinDiscountApplied,
  consumerIdForCoins,
  cartTotal,
  setCharging,
  setShowCart,
  setTableNumber,
  setConfirmedSplitCount,
  setCoinRedemptionAmount,
  setCoinDiscountApplied,
  setCoinRedemptionConfirmed,
  setConsumerIdForCoins,
  idempotencyKeyRef,
  clearCart,
}: UsePOSCartPaymentProps) {
  // ── Proceed to Payment ─────────────────────────────────────────────────

  const proceedToPayment = useCallback(async () => {
    if (!activeStore?._id) {
      platformAlertSimple(
        'No store selected',
        'Please select a store from the dashboard before charging.'
      );
      return;
    }
    if (cart.length === 0) {
      platformAlertSimple('Empty cart', 'Add at least one item before charging.');
      return;
    }

    setCharging(true);
    try {
      const items = cart.map(({ productId, name, price, quantity, imageUrl }) => ({
        productId,
        name,
        price,
        quantity,
        imageUrl,
      }));
      const lineItems = cart.map((item) => ({
        name: item.name,
        qty: item.quantity,
        price: item.price,
        gstRate: item.gstRate || 0,
        gstAmount: calcBillGST([item]).totalGST,
      }));

      if (isOffline) {
        const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
        try {
          const coinRedemption =
            coinDiscountApplied > 0 && consumerIdForCoins
              ? { amount: coinDiscountApplied, consumerId: consumerIdForCoins }
              : undefined;
          await posService.enqueueFullBill(
            items,
            activeStore?._id,
            tableNumber || undefined,
            confirmedSplitCount > 1 ? confirmedSplitCount : undefined,
            coinRedemption
          );
        } catch (offlineError: unknown) {
          logger.error('[POS] Offline bill save failed:', offlineError);
          platformAlertSimple(
            'Failed to save bill',
            'We could not save this bill offline. Please try again.'
          );
          return;
        }
        clearCart();
        setShowCart(false);
        setTableNumber('');
        setConfirmedSplitCount(1);
        idempotencyKeyRef.current = null;
        platformAlertSimple(
          'Saved Offline',
          `Bill of ₹${total.toFixed(0)} saved. It will sync automatically when you're back online.`
        );
        return;
      }

      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = globalThis.crypto?.randomUUID?.() ?? crypto.randomUUID();
      }
      const bill = await posService.createBill(
        items,
        customerMode === 'walk-in' ? 'WALKIN' : (customerPhone ?? undefined),
        activeStore?._id,
        undefined,
        undefined,
        confirmedSplitCount > 1 ? confirmedSplitCount : undefined,
        tableNumber || undefined,
        lineItems,
        coinDiscountApplied > 0
          ? { amount: coinDiscountApplied, discountApplied: coinDiscountApplied }
          : undefined,
        idempotencyKeyRef.current
      );

      if (coinDiscountApplied > 0 && consumerIdForCoins) {
        try {
          await apiClient.post('merchant/wallet/redeem-coins', {
            consumerId: consumerIdForCoins,
            amount: coinDiscountApplied,
            billId: bill.billId,
            storeId: activeStore?._id,
          });
        } catch (coinError: unknown) {
          logger.warn('[POS] Coin redemption API call failed:', coinError);
          platformAlertSimple(
            'Coin redemption failed',
            'We could not record the coin redemption. Please try again without coins.'
          );
          return;
        }
      }

      setCoinRedemptionAmount('');
      setCoinDiscountApplied(0);
      setCoinRedemptionConfirmed(false);
      setConsumerIdForCoins(null);

      idempotencyKeyRef.current = null;
    } catch (paymentError: unknown) {
      const error = paymentError as { message?: string };
      platformAlertSimple('Error', error.message || 'Failed to create bill. Please try again.');
    } finally {
      setCharging(false);
    }
  }, [
    activeStore,
    cart,
    isOffline,
    coinDiscountApplied,
    consumerIdForCoins,
    tableNumber,
    confirmedSplitCount,
    customerMode,
    customerPhone,
    setCharging,
    clearCart,
    idempotencyKeyRef,
    setShowCart,
    setTableNumber,
    setConfirmedSplitCount,
    setCoinRedemptionAmount,
    setCoinDiscountApplied,
    setCoinRedemptionConfirmed,
    setConsumerIdForCoins,
  ]);

  // ── Handle Charge ─────────────────────────────────────────────────────

  const handleCharge = useCallback(async () => {
    if (cart.length === 0) return;
    if (customerMode === 'none') {
      platformAlertSimple(
        'Customer required',
        'Please select a customer or choose "Walk-in" before charging.'
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!activeStore?._id) {
      platformAlertSimple(
        'No store selected',
        'Please select a store from the dashboard before charging.'
      );
      return;
    }
    await proceedToPayment();
  }, [cart, customerMode, activeStore, proceedToPayment]);

  // ── Coin Redemption ────────────────────────────────────────────────────

  const handleApplyCoinRedemption = useCallback(() => {
    const amt = parseFloat(String(coinDiscountApplied));
    if (isNaN(amt) || amt <= 0) {
      platformAlertSimple('Invalid Amount', 'Please enter a valid coin redemption amount.');
      return;
    }
    const gstInfo = calcBillGST(cart);
    if (amt >= gstInfo.grandTotal) {
      platformAlertSimple('Amount Too High', 'Coin redemption cannot exceed the bill total.');
      return;
    }
    setCoinDiscountApplied(amt);
    setCoinRedemptionConfirmed(true);
  }, [cart, setCoinDiscountApplied, setCoinRedemptionConfirmed]);

  const handleRemoveCoinRedemption = useCallback(() => {
    setCoinRedemptionAmount('');
    setCoinDiscountApplied(0);
    setCoinRedemptionConfirmed(false);
  }, [setCoinRedemptionAmount, setCoinDiscountApplied, setCoinRedemptionConfirmed]);

  // ── KOT Print ──────────────────────────────────────────────────────────

  const handlePrintKOT = useCallback(async () => {
    if (cart.length === 0) return;
    try {
      await printerService.printReceipt({
        storeName: activeStore?.name || 'Kitchen',
        total: cartTotal,
        items: cart.map((i) => ({ name: i.name, qty: i.quantity, price: i.price })),
        ...(tableNumber ? { billNo: `Table ${tableNumber}` } : {}),
        date: new Date().toLocaleString('en-IN'),
      });
    } catch (printError: unknown) {
      logger.error('[POS] KOT print failed:', printError);
      platformAlertSimple('Print Error', 'Could not print KOT. Check printer connection.');
    }
  }, [cart, activeStore, cartTotal, tableNumber]);

  return {
    proceedToPayment,
    handleCharge,
    handleApplyCoinRedemption,
    handleRemoveCoinRedemption,
    handlePrintKOT,
  };
}

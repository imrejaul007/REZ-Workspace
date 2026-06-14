/**
 * usePOSCartActions - Extracted cart actions for POS cart
 * Part of usePOSCart.ts refactoring (Phase 7)
 */

import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { CartItem, SimpleProduct, calcBillGST, UpsellSuggestion } from './usePOSCartState';
import { platformAlertSimple } from '@/utils/platformAlert';
import { logger } from '@/utils/logger';

interface UsePOSCartActionsProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  modifierProduct: SimpleProduct | null;
  setModifierProduct: (p: SimpleProduct | null) => void;
  selectedModifiers: Record<string, string[]>;
  setSelectedModifiers: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  qtyModalProduct: SimpleProduct | null;
  setQtyModalProduct: (p: SimpleProduct | null) => void;
  setQtyModalVisible: (s: boolean) => void;
  qtyInputValue: string;
  setQtyInputValue: (s: string) => void;
  customItemModalVisible: boolean;
  setCustomItemModalVisible: (s: boolean) => void;
  customItemName: string;
  setCustomItemName: (s: string) => void;
  customItemPrice: string;
  setCustomItemPrice: (s: string) => void;
  products: SimpleProduct[];
  setShowBarcodeScanner: (s: boolean) => void;
  barcodeScannerTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  setUpsellSuggestions: React.Dispatch<React.SetStateAction<UpsellSuggestion[]>>;
  setUpsellModalVisible: (s: boolean) => void;
  setCustomerMode: (m: 'none' | 'walk-in' | 'selected') => void;
  setCustomerId: (s: string | null) => void;
  setCustomerPhone: (s: string | null) => void;
  setCoinRedemptionAmount: (s: string) => void;
  setCoinDiscountApplied: (n: number) => void;
  setCoinRedemptionConfirmed: (b: boolean) => void;
  setConsumerIdForCoins: (s: string | null) => void;
  idempotencyKeyRef: React.MutableRefObject<string | null>;
}

export function usePOSCartActions({
  cart,
  setCart,
  modifierProduct,
  setModifierProduct,
  selectedModifiers,
  setSelectedModifiers,
  qtyModalProduct,
  setQtyModalProduct,
  setQtyModalVisible,
  qtyInputValue,
  setQtyInputValue,
  customItemModalVisible,
  setCustomItemModalVisible,
  customItemName,
  setCustomItemName,
  customItemPrice,
  setCustomItemPrice,
  products,
  setShowBarcodeScanner,
  barcodeScannerTimerRef,
  setUpsellSuggestions,
  setUpsellModalVisible,
  setCustomerMode,
  setCustomerId,
  setCustomerPhone,
  setCoinRedemptionAmount,
  setCoinDiscountApplied,
  setCoinRedemptionConfirmed,
  setConsumerIdForCoins,
  idempotencyKeyRef,
}: UsePOSCartActionsProps) {
  // ── Cart Handlers ──────────────────────────────────────────────────────

  const addToCartDirect = useCallback(
    (product: SimpleProduct, modifiers?: Array<{ name: string; price: number }>) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const modifierExtra = modifiers?.reduce((sum, m) => sum + m.price, 0) ?? 0;
      const finalPrice = product.price + modifierExtra;
      setCart((prev) => {
        if (modifiers && modifiers.length > 0) {
          return [
            ...prev,
            {
              cartId: `${product.id}-${uuidv4()}`,
              productId: product.id,
              name:
                modifiers.length > 0
                  ? `${product.name} (${modifiers.map((m) => m.name).join(', ')})`
                  : product.name,
              price: finalPrice,
              quantity: 1,
              imageUrl: product.imageUrl,
              modifiers,
              gstRate: product.gstRate,
            },
          ];
        }
        const existing = prev.find((i) => i.productId === product.id && !i.modifiers?.length);
        if (existing) {
          return prev.map((i) =>
            i.cartId === existing.cartId ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
        return [
          ...prev,
          {
            cartId: `${product.id}-${uuidv4()}`,
            productId: product.id,
            name: product.name,
            price: finalPrice,
            quantity: 1,
            imageUrl: product.imageUrl,
            gstRate: product.gstRate,
          },
        ];
      });
    },
    [setCart]
  );

  const addToCart = useCallback(
    (product: SimpleProduct) => {
      if (product.modifiers && product.modifiers.length > 0) {
        setSelectedModifiers({});
        setModifierProduct(product);
      } else {
        addToCartDirect(product);
      }
    },
    [addToCartDirect, setModifierProduct, setSelectedModifiers]
  );

  const setItemQty = useCallback(
    (cartId: string, qty: number) => {
      if (qty <= 0) {
        setCart((prev) => prev.filter((i) => i.cartId !== cartId));
      } else {
        setCart((prev) => prev.map((i) => (i.cartId === cartId ? { ...i, quantity: qty } : i)));
      }
    },
    [setCart]
  );

  const promptQty = useCallback(
    (product: SimpleProduct) => {
      const existing = cart.find((i) => i.productId === product.id);
      setQtyModalProduct(product);
      setQtyInputValue(String(existing?.quantity ?? 1));
      setQtyModalVisible(true);
    },
    [cart, setQtyModalProduct, setQtyInputValue, setQtyModalVisible]
  );

  const handleQtyModalConfirm = useCallback(() => {
    if (!qtyModalProduct) return;
    const n = parseInt(qtyInputValue, 10);
    if (!isNaN(n) && n >= 0) setItemQty(qtyModalProduct.id, n);
    setQtyModalVisible(false);
    setQtyModalProduct(null);
    setQtyInputValue('');
  }, [
    qtyModalProduct,
    qtyInputValue,
    setItemQty,
    setQtyModalVisible,
    setQtyModalProduct,
    setQtyInputValue,
  ]);

  const handleAddCustomItem = useCallback(() => {
    const name = customItemName.trim();
    const price = parseFloat(customItemPrice);
    if (!name || isNaN(price) || price < 0) {
      platformAlertSimple('Invalid Input', 'Please enter a valid item name and price');
      return;
    }
    const customProduct: SimpleProduct = {
      id: `custom-${uuidv4()}`,
      name,
      price,
      inStock: true,
    };
    addToCart(customProduct);
    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItemModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [
    customItemName,
    customItemPrice,
    addToCart,
    setCustomItemName,
    setCustomItemPrice,
    setCustomItemModalVisible,
  ]);

  // ── Barcode Scanning ───────────────────────────────────────────────────

  const handleOpenBarcodeScanner = useCallback(async () => {
    setShowBarcodeScanner(true);
  }, [setShowBarcodeScanner]);

  const handleBarcodeScanned = useCallback(
    (data: unknown) => {
      const barcode =
        (data as Record<string, unknown>)?.data || (data as Record<string, unknown>)?.barcode || '';
      if (!barcode) return;

      const product = products.find(
        (p) =>
          p.id === barcode ||
          (p as unknown as Record<string, unknown>)?.barcode === barcode ||
          (p as unknown as Record<string, unknown>)?.sku === barcode
      );

      if (product && product.inStock) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        addToCart(product);
        setShowBarcodeScanner(false);
      } else if (product) {
        platformAlertSimple('Out of Stock', `${product.name} is out of stock.`);
        barcodeScannerTimerRef.current = setTimeout(() => setShowBarcodeScanner(true), 1000);
      } else {
        platformAlertSimple('Product Not Found', `No product found for barcode: ${barcode}`);
        barcodeScannerTimerRef.current = setTimeout(() => setShowBarcodeScanner(true), 1000);
      }
    },
    [products, addToCart, setShowBarcodeScanner, barcodeScannerTimerRef]
  );

  // ── Upsell ─────────────────────────────────────────────────────────────

  const handleUpsellAdd = useCallback(
    (suggestion: { ruleId: string; productId: string; name: string; finalPrice: number }) => {
      const id = `upsell-${suggestion.productId}-${uuidv4()}`;
      setCart((prev) => [
        ...prev,
        {
          cartId: id,
          productId: suggestion.productId,
          name: suggestion.name,
          price: suggestion.finalPrice,
          quantity: 1,
        } as CartItem,
      ]);
      setUpsellSuggestions((prev) => prev.filter((s) => s.ruleId !== suggestion.ruleId));
    },
    [setCart, setUpsellSuggestions]
  );

  const handleUpsellDismiss = useCallback(async () => {
    setUpsellModalVisible(false);
    setUpsellSuggestions([]);
  }, [setUpsellModalVisible, setUpsellSuggestions]);

  // ── Clear Cart ─────────────────────────────────────────────────────────

  const clearCart = useCallback(() => {
    setCart([]);
    setCustomerMode('none');
    setCustomerId(null);
    setCustomerPhone(null);
    setCoinRedemptionAmount('');
    setCoinDiscountApplied(0);
    setCoinRedemptionConfirmed(false);
    setConsumerIdForCoins(null);
    idempotencyKeyRef.current = null;
  }, [
    setCart,
    setCustomerMode,
    setCustomerId,
    setCustomerPhone,
    setCoinRedemptionAmount,
    setCoinDiscountApplied,
    setCoinRedemptionConfirmed,
    setConsumerIdForCoins,
    idempotencyKeyRef,
  ]);

  return {
    addToCart,
    addToCartDirect,
    setItemQty,
    promptQty,
    handleQtyModalConfirm,
    handleAddCustomItem,
    handleOpenBarcodeScanner,
    handleBarcodeScanned,
    handleUpsellAdd,
    handleUpsellDismiss,
    clearCart,
  };
}

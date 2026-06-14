// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, memo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Text,
  Pressable,
  Dimensions,
  Keyboard,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCheckout } from '@/hooks/useCheckout';
import { useCheckoutUI } from '@/hooks/useCheckoutUI';
import { useCartValidation } from '@/hooks/useCartValidation';
import { useCheckoutAbandonmentTracking } from '@/hooks/useCartAbandonmentTracking';
import StockWarningBanner from '@/components/cart/StockWarningBanner';
import CartValidation from '@/components/cart/CartValidation';
import CardOffersSection from '@/components/cart/CardOffersSection';
import { useGetCurrencySymbol, useAuthUser, useSavingsInsights } from '@/stores';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing } from '@/constants/DesignSystem';
import { normalizeUserTier } from '@/constants/loyalty';
import { showToast } from '@/components/common/ToastManager';

import CheckoutHeader from '@/components/checkout/CheckoutHeader';
import OrderItemsPreview from '@/components/checkout/OrderItemsPreview';
import DeliveryAddressSection from '@/components/checkout/DeliveryAddressSection';
import FulfillmentTypeSelector from '@/components/checkout/FulfillmentTypeSelector';
import PromoCodeSection from '@/components/checkout/PromoCodeSection';
import CoinTogglesSection from '@/components/checkout/CoinTogglesSection';
import ServicesSummary from '@/components/checkout/ServicesSummary';
import BillSummarySection from '@/components/checkout/BillSummarySection';
import PaymentBottomSheet from '@/components/checkout/PaymentBottomSheet';
import PromoCodeModal from '@/components/checkout/PromoCodeModal';
import DealRedemptionModal from '@/components/checkout/DealRedemptionModal';
import OrderConfirmationModal from '@/components/checkout/OrderConfirmationModal';
import ProcessingOverlay from '@/components/checkout/ProcessingOverlay';
import AddressSelectionModal from '@/components/checkout/AddressSelectionModal';
import PaymentFailureModal from '@/components/checkout/PaymentFailureModal';
import CheckoutSavingsNudge from '@/components/checkout/CheckoutSavingsNudge';
import { colors } from '@/constants/theme';
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import { isSmallDevice } from '@/utils/responsive';

// G-03: Delivery time slot picker
const DELIVERY_SLOTS = [
  { label: 'Morning (9-12)', value: 'morning' },
  { label: 'Afternoon (12-3)', value: 'afternoon' },
  { label: 'Evening (3-6)', value: 'evening' },
  { label: 'Night (6-9)', value: 'night' },
];

// ROHAN: Extract style object literals to memoized objects and wrap inline handlers with useCallback to prevent unnecessary re-renders
const DeliverySlotPickerImpl = memo(
  ({ selectedSlot, onSelectSlot }: { selectedSlot?: string; onSelectSlot: (s: string) => void }) => {
    const slotButtonStyle = useCallback(
      (isSelected: boolean) => ({
        paddingHorizontal: isSmallDevice ? 10 : Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: 20,
        backgroundColor: isSelected ? colors.primary[500] : colors.background.secondary,
        borderWidth: 1,
        borderColor: isSelected ? colors.primary[500] : colors.border.light,
      }),
      [],
    );

    const slotTextStyle = useCallback(
      (isSelected: boolean) => ({
        fontSize: 13, // readable on all devices without conditional logic
        fontWeight: '600' as const,
        color: isSelected ? '#fff' : colors.text.secondary,
      }),
      [],
    );

    const containerStyle = useMemo(
      () => ({
        backgroundColor: colors.background.primary,
        borderRadius: 14,
        padding: Spacing.sm,
        marginBottom: Spacing.md,
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }),
      [],
    );

    const rowStyle = useMemo(
      () => ({
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        gap: isSmallDevice ? 6 : Spacing.xs,
      }),
      [],
    );

    const handleSlotPress = useCallback(
      (value: string) => {
        onSelectSlot(value);
      },
      [onSelectSlot],
    );

    // ROHAN: Render slot button with pre-bound callback to avoid closure per map iteration
    const renderSlotButton = useCallback(
      (slot: (typeof DELIVERY_SLOTS)[0]) => (
        <Pressable
          key={slot.value}
          onPress={() => handleSlotPress(slot.value)}
          style={slotButtonStyle(selectedSlot === slot.value)}
          accessibilityLabel={slot.label}
          accessibilityRole="radio"
          accessibilityState={{ selected: selectedSlot === slot.value }}
          accessibilityHint={`Double tap to select ${slot.label} delivery slot`}
        >
          <Text style={slotTextStyle(selectedSlot === slot.value)}>{slot.label}</Text>
        </Pressable>
      ),
      [handleSlotPress, selectedSlot, slotButtonStyle, slotTextStyle],
    );

    return (
      <View style={containerStyle}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text.primary, marginBottom: Spacing.sm }}>
          Delivery Time Slot
        </Text>
        <View style={rowStyle}>{DELIVERY_SLOTS.map(renderSlotButton)}</View>
      </View>
    );
  },
);

DeliverySlotPickerImpl.displayName = 'DeliverySlotPicker';
const DeliverySlotPicker = DeliverySlotPickerImpl;

// ── AOV Reward Nudge ──────────────────────────────────────────────────────────
// Shows "Spend ₹X more → unlock ₹Y reward" above the bill summary.
interface AovNudgeData {
  amountToNextTierPaise: number;
  nextTier: { rewardType: string; rewardValue: number; label: string } | null;
}

function AOVRewardNudge({
  storeId,
  totalPayable,
  currencySymbol = '₹',
}: {
  storeId?: string;
  totalPayable: number;
  currencySymbol?: string;
}) {
  const [nudge, setNudge] = React.useState<AovNudgeData | null>(null);

  React.useEffect(() => {
    if (!storeId || totalPayable <= 0) return;
    let cancelled = false;
    (async () => {
      try {
        const { default: api } = await import('@/services/apiClient');
        // CA-CMC-010 FIX: Use exact totalPayable value (in paise) without double-rounding.
        // Converting to paise once avoids off-by-one errors at tier boundaries.
        const amountPaise = Math.round(totalPayable * 100);
        const res = await api.get(`/merchant/aov-rewards/active?storeId=${storeId}&amountPaise=${amountPaise}`);
        const data = (res.data as unknown as Record<string, unknown>)?.data as
          | { nextTier?: { rewardType: string; rewardValue: number; label: string; amountToNextTierPaise: number } }
          | undefined;
        const tierAmount = (data as { amountToNextTierPaise?: number; nextTier?: object })?.amountToNextTierPaise;
        if (!cancelled && data?.nextTier && tierAmount && tierAmount > 0) {
          setNudge({ amountToNextTierPaise: tierAmount, nextTier: data.nextTier });
        }
      } catch {
        /* silent fail */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storeId, totalPayable]);

  if (!nudge?.nextTier) return null;
  const moreRupees = Math.ceil(nudge.amountToNextTierPaise / 100);
  const rewardLabel =
    nudge.nextTier.label ||
    (nudge.nextTier.rewardType === 'coins'
      ? `${nudge.nextTier.rewardValue} coins`
      : nudge.nextTier.rewardType === 'cashback'
        ? `${nudge.nextTier.rewardValue}% cashback`
        : `${nudge.nextTier.rewardValue}% off`);

  return (
    <View
      style={{
        backgroundColor: '#FFF7ED',
        borderRadius: 10,
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 4,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#FED7AA',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <Ionicons name="gift-outline" size={18} color="#EA580C" />
      <Text style={{ flex: 1, fontSize: 13, color: '#9A3412', fontWeight: '500' }}>
        Spend{' '}
        <Text style={{ fontWeight: '700' }}>
          {currencySymbol}
          {moreRupees} more
        </Text>{' '}
        to unlock <Text style={{ fontWeight: '700', color: '#EA580C' }}>{rewardLabel}</Text>!
      </Text>
    </View>
  );
}

function CheckoutPage() {
  const router = useRouter();
  const params = useLocalSearchParams<unknown>();
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();
  const authUser = useAuthUser();
  // normalizeUserTier handles both backend UPPERCASE (referralTier) and frontend lowercase (loyaltyTier)
  const userLoyaltyTier = normalizeUserTier(
    ((authUser as unknown as Record<string, unknown>)?.loyaltyTier as string | undefined) ||
      ((authUser as unknown as Record<string, unknown>)?.referralTier as string | undefined),
  );
  const savingsInsights = useSavingsInsights();
  const scrollViewRef = useRef<ScrollView>(null);

  // Core checkout state & logic
  const { state, actions, handlers: checkoutHandlers } = useCheckout(params.orderId);

  // Derived values
  const serviceItems = useMemo(
    () => state.items?.filter((item) => item.itemType === 'service') || [],
    [state.items],
  );
  const hasServiceItems = serviceItems.length > 0;
  const productItems = state.items?.filter((item) => item.itemType !== 'service') || [];
  const totalWalletBalance =
    state.coinSystem.rezCoin.available +
    state.coinSystem.promoCoin.available +
    (state.coinSystem.storePromoCoin?.available || 0);

  // UI state & handlers (reducer + all event handlers)
  const {
    uiState,
    dispatch,
    handlers: uiHandlers,
  } = useCheckoutUI({
    checkoutState: state,
    checkoutHandlers,
    currencySymbol,
    hasServiceItems,
    totalWalletBalance,
    offerRedemptionCode: params.offerRedemptionCode,
    router,
  });

  // Cart validation
  const { validationState, canCheckout, errorCount, validateCart, removeInvalidItems } = useCartValidation({
    autoValidate: true,
    validationInterval: 30000,
    showToastNotifications: true,
  });

  // Cart abandonment tracking
  const abandonmentTracking = useCheckoutAbandonmentTracking(
    {
      showAddressModal: uiState.showAddressModal,
      showPromoModal: uiState.showPromoModal,
      paymentExpanded: uiState.paymentExpanded,
      showConfirmModal: uiState.showConfirmModal,
      processingPayment: uiState.processingPayment,
      selectedPaymentMethod: uiState.selectedPaymentMethod,
      selectedAddress: state.selectedAddress,
    },
    {
      items: state.items || [],
      billSummary: state.billSummary,
      store: state.store,
      fulfillment: state.fulfillment,
      appliedPromoCode: state.appliedPromoCode,
      appliedRedemption: uiState.appliedRedemption,
    }
  );

  // Track checkout completion to prevent abandonment tracking
  useEffect(() => {
    if (uiState.processingPayment && !uiState.showPaymentFailureModal) {
      abandonmentTracking.markCheckoutComplete();
    }
  }, [uiState.processingPayment, uiState.showPaymentFailureModal]);

  // Track abandonment when user navigates away or component unmounts
  useEffect(() => {
    // Track abandonment on unmount if checkout not completed
    return () => {
      // Don't track if order was completed or in progress
      if (uiState.processingPayment && !uiState.showPaymentFailureModal) {
        return;
      }
      abandonmentTracking.trackAbandonment(abandonmentTracking.currentStage);
    };
  }, [abandonmentTracking, uiState.processingPayment, uiState.showPaymentFailureModal]);

  useEffect(() => {
    validateCart();
  }, [validateCart]);

  useEffect(() => {
    if (validationState.validationResult && errorCount > 0) {
      // Focus management: dismiss keyboard and scroll to top on validation error
      Keyboard.dismiss();

      // CA-CMC-038 FIX: Defer scroll until after render cycle to ensure ref is available.
      // ScrollView may not be fully mounted during initialization, so schedule scroll after layout.
      const scrollTimer = setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
      }, 0);

      dispatch({ type: 'SET_FIELD', field: 'showValidationModal', value: true });

      return () => clearTimeout(scrollTimer);
    }
  }, [errorCount, validationState.validationResult, dispatch]);

  // Add slider thumb styling for web
  const styleCreatedRef = useRef(false);
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined' && !styleCreatedRef.current) {
      const styleId = 'slider-thumb-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          input[type="range"] { cursor: pointer; touch-action: none; user-select: none; }
          input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%); cursor: grab; box-shadow: 0 3px 12px rgba(139, 92, 246, 0.4), 0 0 0 3px rgba(255, 255, 255, 0.5); transition: all 0.2s ease; border: 3px solid rgba(255, 255, 255, 0.95); position: relative; z-index: 10; }
          input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.15); box-shadow: 0 4px 16px rgba(139, 92, 246, 0.5), 0 0 0 4px rgba(255, 255, 255, 0.6); }
          input[type="range"]::-webkit-slider-thumb:active { transform: scale(1.05); box-shadow: 0 2px 8px rgba(139, 92, 246, 0.5), 0 0 0 3px rgba(255, 255, 255, 0.7); cursor: grabbing; }
          input[type="range"]::-moz-range-thumb { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%); cursor: grab; border: 3px solid rgba(255, 255, 255, 0.95); box-shadow: 0 3px 12px rgba(139, 92, 246, 0.4), 0 0 0 3px rgba(255, 255, 255, 0.5); transition: all 0.2s ease; z-index: 10; }
          input[type="range"]::-moz-range-thumb:hover { transform: scale(1.15); box-shadow: 0 4px 16px rgba(139, 92, 246, 0.5), 0 0 0 4px rgba(255, 255, 255, 0.6); }
          input[type="range"]::-moz-range-thumb:active { transform: scale(1.05); box-shadow: 0 2px 8px rgba(139, 92, 246, 0.5), 0 0 0 3px rgba(255, 255, 255, 0.7); cursor: grabbing; }
        `;
        document.head.appendChild(style);
        styleCreatedRef.current = true;
      }
    }
  }, []);

  const handleContinueToCheckout = useCallback(() => {
    // CA-CMC-037 FIX: Only close modal if checkout can proceed (no unresolved issues)
    const hasUnresolvedIssues =
      validationState.validationResult?.issues && validationState.validationResult.issues.length > 0;

    if (hasUnresolvedIssues) {
      // Warn user that they need to resolve issues before proceeding
      showToast({
        message: 'Please resolve cart issues before proceeding to checkout',
        type: 'warning',
      });
      return;
    }

    // Only close modal if all issues are resolved
    dispatch({ type: 'SET_FIELD', field: 'showValidationModal', value: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validationState.validationResult?.issues]);

  const handleRemoveInvalidItems = useCallback(async () => {
    await removeInvalidItems();
    dispatch({ type: 'SET_FIELD', field: 'showValidationModal', value: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removeInvalidItems]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={styles.container}>
        <CheckoutHeader
          totalPayable={state.billSummary?.totalPayable || 0}
          redemptionBenefit={uiState.appliedRedemption?.benefit || 0}
          cashbackEarned={state.billSummary?.cashbackEarned || 0}
          totalWalletBalance={totalWalletBalance}
          currencySymbol={currencySymbol}
          onBack={checkoutHandlers.handleBackNavigation}
        />

        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          {uiState.showWarningBanner &&
            validationState.validationResult &&
            validationState.validationResult.issues.length > 0 && (
              <StockWarningBanner
                issues={validationState.validationResult.issues}
                onDismiss={() => dispatch({ type: 'SET_FIELD', field: 'showWarningBanner', value: false })}
                onViewDetails={() => dispatch({ type: 'SET_FIELD', field: 'showValidationModal', value: true })}
                autoHide={false}
              />
            )}

          {state.store?.distance && (
            <View style={styles.storeConfirmation}>
              <ThemedText style={styles.storeWarning}>
                The selected store is {state.store.distance} away from your delivery address. Please confirm.
              </ThemedText>
            </View>
          )}

          {state.billSummary?.totalPayable && state.billSummary.totalPayable > 0 && (
            // CA-CMC-050 FIX: CardOffersSection should filter offers based on minOrderValue.
            // The component internally filters offers where orderValue >= minOrderValue.
            // Only show section if there's a non-zero payable amount (offers need minimum MOV).
            <CardOffersSection
              storeId={state.store?.id}
              orderValue={state.billSummary.totalPayable}
              compact={true}
              onOfferApplied={(offer) => checkoutHandlers.applyCardOffer(offer)}
            />
          )}

          <OrderItemsPreview items={productItems} currencySymbol={currencySymbol} />

          <FulfillmentTypeSelector
            availableTypes={state.fulfillment.availableTypes}
            selectedType={state.fulfillment.selectedType}
            onSelect={actions.setFulfillmentType}
          />

          <DeliveryAddressSection
            fulfillmentType={state.fulfillment.selectedType}
            selectedAddress={state.selectedAddress}
            store={state.store}
            fulfillmentAvailableTypes={state.fulfillment.availableTypes}
            pickupInstructions={state.fulfillment.pickupInstructions}
            vehicleInfo={state.fulfillment.vehicleInfo}
            tableNumber={state.fulfillment.tableNumber}
            onOpenAddressModal={() => dispatch({ type: 'SET_FIELD', field: 'showAddressModal', value: true })}
            onSetFulfillmentDetails={actions.setFulfillmentDetails}
          />

          {/* G-03: Delivery time slot selector */}
          {state.fulfillment.selectedType === 'delivery' && (
            <DeliverySlotPicker
              selectedSlot={state.fulfillment.deliverySlot}
              onSelectSlot={(slot: string) =>
                actions.setFulfillmentDetails({ deliverySlot: slot } as unknown)
              }
            />
          )}

          <PromoCodeSection
            appliedPromoCode={state.appliedPromoCode}
            promoDiscount={state.billSummary?.promoDiscount || 0}
            availablePromoCodes={state.availablePromoCodes}
            appliedRedemption={uiState.appliedRedemption}
            appliedOfferRedemption={uiState.appliedOfferRedemption}
            voucherCodeInput={uiState.voucherCodeInput}
            validatingRedemption={uiState.validatingRedemption}
            currencySymbol={currencySymbol}
            onOpenPromoModal={() => dispatch({ type: 'OPEN_PROMO_MODAL' })}
            onRemovePromoCode={() => checkoutHandlers.removePromoCode?.()}
            onOpenRedemptionModal={() => dispatch({ type: 'SET_FIELD', field: 'showRedemptionModal', value: true })}
            onRemoveRedemption={uiHandlers.handleRemoveRedemption}
            onClearOfferRedemption={() => dispatch({ type: 'CLEAR_OFFER_REDEMPTION' })}
            onVoucherCodeChange={(text) => dispatch({ type: 'SET_FIELD', field: 'voucherCodeInput', value: text })}
            onApplyVoucherCode={uiHandlers.validateAndApplyOfferRedemption}
          />

          <View style={styles.section}>
            <CoinTogglesSection
              coinSystem={state.coinSystem}
              totalWalletBalance={totalWalletBalance}
              coinSectionExpanded={uiState.coinSectionExpanded}
              totalPayable={state.billSummary?.totalPayable || 0}
              totalBeforeCoinDiscount={state.billSummary?.totalBeforeCoinDiscount}
              currencySymbol={currencySymbol}
              onToggleExpanded={() =>
                dispatch({ type: 'SET_FIELD', field: 'coinSectionExpanded', value: !uiState.coinSectionExpanded })
              }
              onCoinToggle={checkoutHandlers.handleCoinToggle}
              onCustomCoinAmount={checkoutHandlers.handleCustomCoinAmount}
            />
          </View>

          <ServicesSummary serviceItems={serviceItems} currencySymbol={currencySymbol} />

          {/* Pre-payment savings nudge — "You're saving ₹87 on this order!" */}
          <CheckoutSavingsNudge
            totalSavings={(state.billSummary?.savings || 0) + (uiState.appliedRedemption?.benefit || 0)}
            avgPerVisit={savingsInsights?.avgPerVisit}
            currencySymbol={currencySymbol}
          />

          {/* AOV tier nudge — "Spend ₹50 more to unlock ₹100 cashback!" */}
          <AOVRewardNudge
            storeId={state.store?.id}
            totalPayable={state.billSummary?.totalPayable || 0}
            currencySymbol={currencySymbol}
          />

          <BillSummarySection
            billSummary={state.billSummary}
            items={state.items}
            appliedRedemption={uiState.appliedRedemption}
            appliedOfferRedemption={uiState.appliedOfferRedemption}
            showPlatformFeeInfo={uiState.showPlatformFeeInfo}
            currencySymbol={currencySymbol}
            onTogglePlatformFeeInfo={() =>
              dispatch({ type: 'SET_FIELD', field: 'showPlatformFeeInfo', value: !uiState.showPlatformFeeInfo })
            }
          />

          <View style={styles.bottomSpace} />
        </ScrollView>

        <PaymentBottomSheet
          totalPayable={state.billSummary?.totalPayable || 0}
          redemptionBenefit={uiState.appliedRedemption?.benefit || 0}
          totalWalletBalance={totalWalletBalance}
          hasServiceItems={hasServiceItems}
          canCheckout={canCheckout}
          loading={state.loading}
          paymentExpanded={uiState.paymentExpanded}
          currencySymbol={currencySymbol}
          onToggleExpanded={() =>
            dispatch({ type: 'SET_FIELD', field: 'paymentExpanded', value: !uiState.paymentExpanded })
          }
          onPaymentSelect={uiHandlers.handlePaymentSelect}
        />

        {/* Modals */}
        <CartValidation
          visible={uiState.showValidationModal}
          validationResult={validationState.validationResult}
          loading={validationState.isValidating}
          onClose={() => dispatch({ type: 'SET_FIELD', field: 'showValidationModal', value: false })}
          onContinueToCheckout={handleContinueToCheckout}
          onRemoveInvalidItems={handleRemoveInvalidItems}
          onRefresh={async () => {
            await validateCart();
          }}
        />

        <PromoCodeModal
          visible={uiState.showPromoModal}
          promoCode={uiState.promoCode}
          availablePromoCodes={state.availablePromoCodes}
          appliedPromoCode={state.appliedPromoCode}
          items={state.items}
          userLoyaltyTier={userLoyaltyTier}
          applyingPromo={uiState.applyingPromo}
          currencySymbol={currencySymbol}
          onClose={() => dispatch({ type: 'CLOSE_PROMO_MODAL' })}
          onPromoCodeChange={(text) => dispatch({ type: 'SET_FIELD', field: 'promoCode', value: text })}
          onApplyPromoCode={uiHandlers.handleApplyPromoCode}
          onQuickPromoSelect={uiHandlers.handleQuickPromoSelect}
        />

        <DealRedemptionModal
          visible={uiState.showRedemptionModal}
          redemptionCode={uiState.redemptionCode}
          validatingRedemption={uiState.validatingRedemption}
          onClose={() => dispatch({ type: 'SET_FIELD', field: 'showRedemptionModal', value: false })}
          onRedemptionCodeChange={(text) => dispatch({ type: 'SET_FIELD', field: 'redemptionCode', value: text })}
          onApplyRedemptionCode={uiHandlers.handleApplyRedemptionCode}
        />

        <OrderConfirmationModal
          visible={uiState.showConfirmModal}
          selectedPaymentMethod={uiState.selectedPaymentMethod}
          billSummary={state.billSummary}
          itemCount={state.items?.length || 0}
          appliedRedemption={uiState.appliedRedemption}
          processingPayment={uiState.processingPayment}
          currencySymbol={currencySymbol}
          onClose={() => dispatch({ type: 'SET_FIELD', field: 'showConfirmModal', value: false })}
          onConfirm={uiHandlers.handleConfirmOrder}
        />

        <AddressSelectionModal
          visible={uiState.showAddressModal}
          addresses={state.availableAddresses || []}
          selectedAddressId={state.selectedAddress?.id}
          onSelect={(address) => {
            checkoutHandlers.handleAddressSelect(address);
            dispatch({ type: 'SET_FIELD', field: 'showAddressModal', value: false });
          }}
          onClose={() => dispatch({ type: 'SET_FIELD', field: 'showAddressModal', value: false })}
          onAddNew={() => {
            dispatch({ type: 'SET_FIELD', field: 'showAddressModal', value: false });
            router.push('/account/addresses');
          }}
          loading={state.loading}
        />

        <ProcessingOverlay visible={uiState.processingPayment} message={uiState.processingMessage} />

        <PaymentFailureModal
          visible={uiState.showPaymentFailureModal}
          onClose={() => dispatch({ type: 'CLOSE_PAYMENT_FAILURE' })}
          onRetry={uiHandlers.handlePaymentFailureRetry}
          onSwitchMethod={uiHandlers.handlePaymentFailureSwitchMethod}
          failedMethod={uiState.paymentFailedMethod}
          errorMessage={uiState.paymentErrorMessage}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  section: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  storeConfirmation: {
    backgroundColor: '#FEF3E2',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    marginBottom: Spacing.base,
  },
  storeWarning: {
    fontSize: 13,
    color: colors.brand.amberDark,
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomSpace: {
    height: 220,
  },
});

export default withErrorBoundary(CheckoutPage, 'Checkout');

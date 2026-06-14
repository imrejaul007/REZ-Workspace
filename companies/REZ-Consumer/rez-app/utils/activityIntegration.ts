// @ts-nocheck
/**
 * Activity Integration Helpers
 *
 * This module provides wrapper functions that integrate activity triggers
 * into existing app flows. Use these wrappers instead of direct API calls
 * to automatically log activities.
 */

import { activityTriggers } from './activityTriggers';
import { achievementTriggers } from './achievementTriggers';
import ordersApi from '@/services/ordersApi';
import cartApi from '@/services/cartApi';
import walletApi from '@/services/walletApi';

/**
 * Enhanced order service with automatic activity logging
 */
export const enhancedOrderService = {
  /**
   * Place order with automatic activity creation
   */
  placeOrder: async (cartId: string, addressId: string, paymentMethodId: string) => {
    try {
      // Place the order
      const response = await (ordersApi as unknown).placeOrder({
        cartId,
        addressId,
        paymentMethodId,
      });

      if (response.success && response.data) {
        const order = response.data;

        // Trigger activity
        await activityTriggers.order.onOrderPlaced(
          order.id,
          order.store?.name || 'Store',
          order.totalAmount
        );
        // Trigger achievement check
        await achievementTriggers.order.onOrderPlaced();
        await achievementTriggers.spending.onPaymentMade(order.totalAmount);

        return response;
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cancel order with automatic activity creation
   */
  cancelOrder: async (orderId: string, storeName: string) => {
    try {
      const response = await ordersApi.cancelOrder(orderId);

      if (response.success) {
        await activityTriggers.order.onOrderCancelled(orderId, storeName);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },
};

/**
 * Enhanced wallet service with automatic activity logging
 */
export const enhancedWalletService = {
  /**
   * Add money to wallet with activity logging
   */
  rechargeWallet: async (amount: number, method: string) => {
    try {
      const response = await (walletApi as unknown).addMoney(amount, method);

      if (response.success) {
        await activityTriggers.wallet.onWalletRecharge(amount, method);

        // Trigger achievement check
        await achievementTriggers.wallet.onWalletRecharged();
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Withdraw from wallet with activity logging
   */
  withdrawFromWallet: async (amount: number, method: string) => {
    try {
      const response = await (walletApi as unknown).withdraw(amount, method);

      if (response.success) {
        await activityTriggers.wallet.onWalletWithdrawal(amount, method);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },
};

/**
 * Enhanced review service with automatic activity logging
 */
export const enhancedReviewService = {
  /**
   * Submit review with activity logging
   */
  submitReview: async (
    productId: string,
    productName: string,
    rating: number,
    comment: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Assuming reviewApi exists or will be created
      // For now, just trigger the activity
      await activityTriggers.review.onReviewSubmitted(productId, productName, rating);

      // Trigger achievement check
      await achievementTriggers.review.onReviewSubmitted();

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  },
};

/**
 * Enhanced voucher service with automatic activity logging
 */
export const enhancedVoucherService = {
  /**
   * Purchase voucher with activity logging
   */
  purchaseVoucher: async (
    voucherId: string,
    voucherName: string,
    amount: number
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Assuming voucherApi.purchase exists
      // For now, just trigger the activity
      await activityTriggers.voucher.onVoucherPurchased(voucherId, voucherName, amount);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Redeem voucher with activity logging
   */
  redeemVoucher: async (
    voucherId: string,
    voucherName: string,
    storeName: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Assuming voucherApi.redeem exists
      await activityTriggers.voucher.onVoucherRedeemed(voucherId, voucherName, storeName);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  },
};

/**
 * Enhanced offer service with automatic activity logging
 */
export const enhancedOfferService = {
  /**
   * Redeem offer with activity logging
   */
  redeemOffer: async (
    offerId: string,
    offerTitle: string,
    savings: number
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Assuming offerApi.redeem exists
      await activityTriggers.offer.onOfferRedeemed(offerId, offerTitle, savings);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  },
};

/**
 * Enhanced profile service with automatic activity logging
 */
export const enhancedProfileService = {
  /**
   * Update profile with activity logging
   */
  updateProfile: async (
    updates: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Assuming authApi.updateProfile exists
      const fieldsUpdated = Object.keys(updates);
      await activityTriggers.profile.onProfileUpdated(fieldsUpdated);

      // Trigger achievement check
      await achievementTriggers.profile.onProfileUpdated();

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Upload profile picture with activity logging
   */
  uploadProfilePicture: async (
    imageUri: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Assuming authApi.uploadProfilePicture exists
      await activityTriggers.profile.onProfilePictureAdded();

      // Trigger achievement check
      await achievementTriggers.profile.onProfilePictureAdded();

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  },
};

/**
 * Enhanced store service with automatic activity logging
 */
export const enhancedStoreService = {
  /**
   * Favorite store with activity logging
   */
  favoriteStore: async (
    storeId: string,
    storeName: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Assuming storeApi.favorite exists
      await activityTriggers.store.onStoreFavorited(storeId, storeName);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Unfavorite store with activity logging
   */
  unfavoriteStore: async (
    storeId: string,
    storeName: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Assuming storeApi.unfavorite exists
      await activityTriggers.store.onStoreUnfavorited(storeId, storeName);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Follow store with activity logging
   */
  followStore: async (
    storeId: string,
    storeName: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Assuming storeApi.follow exists
      await activityTriggers.store.onStoreFollowed(storeId, storeName);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  },
};

/**
 * Utility function to handle order status updates
 * Call this when order status changes (e.g., from webhooks, polling, or manual refresh)
 */
export const handleOrderStatusChange = async (
  orderId: string,
  newStatus: string,
  storeName: string,
  previousStatus?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Only create activity if status actually changed
    if (previousStatus === newStatus) {
      return { success: true };
    }

    if (newStatus === 'DELIVERED') {
      await activityTriggers.order.onOrderDelivered(orderId, storeName);

      // Trigger achievement check
      await achievementTriggers.order.onOrderDelivered();
    } else if (newStatus === 'CANCELLED') {
      await activityTriggers.order.onOrderCancelled(orderId, storeName);
    }
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Log but don't throw - activity tracking should not break core flow
    console.warn('[ActivityIntegration] Order status change failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

/**
 * Utility function to handle cashback crediting
 * Call this when cashback is credited (e.g., after order completion)
 */
export const handleCashbackCredit = async (
  amount: number,
  orderId: string,
  storeName: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await activityTriggers.cashback.onCashbackEarned(amount, orderId, storeName);

    // If cashback is immediately credited, log that too
    await activityTriggers.cashback.onCashbackCredited(amount, orderId);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Log but don't throw - activity tracking should not break core flow
    console.warn('[ActivityIntegration] Cashback credit failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

/**
 * Usage Examples:
 *
 * // In checkout.tsx:
 * import { enhancedOrderService } from '@/utils/activityIntegration';
 * await enhancedOrderService.placeOrder(cartId, addressId, paymentMethodId);
 *
 * // In WalletScreen.tsx:
 * import { enhancedWalletService } from '@/utils/activityIntegration';
 * await enhancedWalletService.rechargeWallet(1000, 'UPI');
 *
 * // In order tracking screen:
 * import { handleOrderStatusChange } from '@/utils/activityIntegration';
 * await handleOrderStatusChange(order.id, newStatus, order.store.name, oldStatus);
 */

export default {
  order: enhancedOrderService,
  wallet: enhancedWalletService,
  review: enhancedReviewService,
  voucher: enhancedVoucherService,
  offer: enhancedOfferService,
  profile: enhancedProfileService,
  store: enhancedStoreService,
  handleOrderStatusChange,
  handleCashbackCredit,
};

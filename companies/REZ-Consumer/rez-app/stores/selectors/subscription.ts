/**
 * Subscription store selectors — 10 imports.
 */

import { useSubscriptionStore } from '../subscriptionStore';

/** Only re-renders when subscription tier changes */
export const useSubscriptionTier = () =>
  useSubscriptionStore((s: ReturnType<typeof useSubscriptionStore.getState>) => s.state?.currentSubscription?.tier);

/** Only re-renders when subscribed status changes */
export const useIsSubscribed = () =>
  useSubscriptionStore((s: ReturnType<typeof useSubscriptionStore.getState>) => s.computed?.isSubscribed ?? false);

import { Redirect } from 'expo-router';

/**
 * Delivery Index Redirect
 *
 * This file redirects /delivery to /deliveries for consistency
 * with the tab-based navigation structure.
 *
 * The main deliveries screen is at app/deliveries.tsx
 */
export default function DeliveryIndex() {
  // Redirect to the main deliveries tab
  return <Redirect href="/deliveries" />;
}

/**
 * Deliveries Tab Screen
 *
 * This file re-exports the main deliveries screen to support
 * both flat file (/deliveries.tsx) and directory-based (/deliveries/) routing.
 *
 * In expo-router, both approaches work:
 * - app/deliveries.tsx (flat file)
 * - app/deliveries/index.tsx (directory-based)
 *
 * This file ensures both routes work correctly.
 */

import DeliveriesScreen from '../deliveries';

export default DeliveriesScreen;

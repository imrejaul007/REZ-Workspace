/**
 * lib/utils/pushNotifications.ts — DEPRECATED
 *
 * NW-MED-036 + NW-MED-044: All push notification logic has been consolidated
 * into lib/push/webPush.ts. That file has both subscribeToPush() and unsubscribeFromPush().
 *
 * DO NOT import from this file. Update your imports to:
 *   import { subscribeToPush, unsubscribeFromPush } from '@/lib/push/webPush';
 *
 * This file will be removed in a future release.
 */
export { subscribeToPush, unsubscribeFromPush } from '@/lib/push/webPush';

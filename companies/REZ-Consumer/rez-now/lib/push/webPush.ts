import { authClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

/**
 * Converts a URL-safe base64 VAPID public key string to a Uint8Array
 * as required by PushManager.subscribe().
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer instanceof ArrayBuffer
    ? outputArray as Uint8Array<ArrayBuffer>
    : new Uint8Array(outputArray) as Uint8Array<ArrayBuffer>;
}

/**
 * Requests push notification permission, subscribes via the PushManager,
 * and registers the subscription with the backend.
 * Returns the PushSubscription on success, or null on failure / denial.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  try {
    if (typeof window === 'undefined') return null;
    if (!('Notification' in window)) return null;
    if (!('serviceWorker' in navigator)) return null;
    if (!VAPID_PUBLIC_KEY) {
      logger.warn('[webPush] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    await authClient.post('/api/web-ordering/push/subscribe', { subscription });

    return subscription;
  } catch (err) {
    logger.error('[webPush] subscribeToPush failed', { error: err });
    return null;
  }
}

/**
 * NW-MED-036 + NW-MED-044: Unsubscribe from push notifications and notify the backend.
 * This function was previously only in the dead lib/utils/pushNotifications.ts file.
 * Import from '@/lib/push/webPush' for all push notification operations.
 */
export async function unsubscribeFromPush(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return;

    await subscription.unsubscribe();

    await authClient.post('/api/web-ordering/push/unsubscribe', {
      endpoint: subscription.endpoint,
    });
  } catch (err) {
    logger.error('[webPush] unsubscribeFromPush failed', { error: err });
  }
}

/**
 * Menu Availability API Service
 *
 * Allows merchants to toggle individual menu items as available or unavailable
 * (e.g. when an item sells out mid-service). The backend invalidates the Redis
 * cache and emits a Socket.IO event so customers see the change immediately.
 */

import { apiClient } from './client';

/**
 * Toggle the availability of a single menu item for a given store.
 *
 * @param storeSlug  - The store's URL slug (e.g. "the-blue-cafe")
 * @param itemId     - The MongoDB _id of the menu item to update
 * @param available  - true = in stock, false = sold out / unavailable
 * @throws           - Throws an Error with a human-readable message on failure
 */
export async function setItemAvailability(
  storeSlug: string,
  itemId: string,
  available: boolean
): Promise<void> {
  const response = await apiClient.patch<{ itemId: string; available: boolean }>(
    `web-ordering/store/${storeSlug}/menu/item/${itemId}/availability`,
    { available }
  );

  if (!response.success) {
    throw new Error(
      (response as unknown).message || (response as unknown).error || 'Failed to update item availability'
    );
  }
}

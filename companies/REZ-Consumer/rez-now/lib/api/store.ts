import { publicClient } from './client';
import { StoreInfo, MenuCategory } from '@/lib/types';

export interface StoreMenuResponse {
  store: StoreInfo;
  categories: MenuCategory[];
  promotions: Array<{ id: string; title: string; image: string | null; description: string }>;
}

export async function getStoreMenu(storeSlug: string): Promise<StoreMenuResponse> {
  const { data } = await publicClient.get(`/api/web-ordering/store/${storeSlug}`);
  if (!data.success) throw new Error(data.message || 'Store not found');
  return data.data as StoreMenuResponse;
}

export async function getScanPayStore(storeSlug: string): Promise<StoreInfo> {
  const { data } = await publicClient.get(`/api/store-payment/store/${storeSlug}`);
  if (!data.success) throw new Error(data.message || 'Store not found');
  return data.data as StoreInfo;
}

export async function callWaiter(storeSlug: string, tableNumber: string) {
  const { data } = await publicClient.post('/api/web-ordering/waiter/call', {
    storeSlug,
    tableNumber,
  });
  return data;
}

export async function requestBill(storeSlug: string, tableNumber: string) {
  const { data } = await publicClient.post('/api/web-ordering/bill/request', {
    storeSlug,
    tableNumber,
  });
  return data;
}

export interface RecommendationItem {
  menuItemId: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
}

export async function getRecommendations(storeSlug: string): Promise<RecommendationItem[]> {
  try {
    const { data } = await publicClient.get('/api/web-ordering/recommendations', {
      params: { storeSlug },
    });
    // NW-MED-041: Return typed data, not 'unknown'. Validate data.data exists before returning.
    return Array.isArray(data.data) ? (data.data as RecommendationItem[]) : [];
  } catch {
    return [];
  }
}

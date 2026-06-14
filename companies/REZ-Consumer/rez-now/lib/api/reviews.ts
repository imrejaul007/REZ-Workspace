import { publicClient } from './client';

export interface GoogleReview {
  author: string;
  rating: number;
  text: string;
  time: number;
  profilePhoto?: string;
}

export interface StoreReviews {
  rating: number | null;
  totalRatings: number;
  reviews: GoogleReview[];
  status?: 'ok' | 'error';
}

export async function getStoreReviews(storeSlug: string): Promise<StoreReviews> {
  try {
    const { data } = await publicClient.get<{ success: boolean; data: StoreReviews }>(
      `/api/web-ordering/store/${storeSlug}/reviews`,
    );
    if (!data.success) {
      return { rating: null, totalRatings: 0, reviews: [] };
    }
    return data.data;
  } catch {
    return { rating: null, totalRatings: 0, reviews: [] };
  }
}

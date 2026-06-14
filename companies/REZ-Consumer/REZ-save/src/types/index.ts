/**
 * REZ-save Types
 */

export interface WishlistItem {
  item_id: string;
  user_id: string;
  type: 'restaurant' | 'product' | 'hotel' | 'event' | 'service';
  item_ref: string;
  item_name: string;
  item_image?: string;
  price: number;
  original_price: number;
  saved_at: string;
  notified: boolean;
  purchase_intent_score: number;
  tags: string[];
}

export interface Collection {
  collection_id: string;
  user_id: string;
  name: string;
  description?: string;
  items: string[];
  created_at: string;
}

export interface PriceAlert {
  item_id: string;
  target_price: number;
  current_price: number;
  price_drop: number;
  percent_drop: number;
}

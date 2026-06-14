/**
 * REZ Scan - Scan Event Model
 * Represents a single QR code scan event with full context
 */

export type QRType =
  | 'payment'
  | 'restaurant'
  | 'product'
  | 'event'
  | 'loyalty'
  | 'creator'
  | 'smartlink'
  | 'url'
  | 'unknown';

export type ActionType =
  | 'viewed'
  | 'paid'
  | 'ordered'
  | 'checked_in'
  | 'redeemed'
  | 'followed'
  | 'shared'
  | 'saved'
  | 'dismissed';

export interface Location {
  lat: number;
  lng: number;
  city: string;
  country?: string;
  accuracy?: number;
}

export interface MerchantContext {
  merchant_id?: string;
  merchant_name?: string;
  category?: string;
  tier?: 'basic' | 'premium' | 'enterprise';
}

export interface PaymentDetails {
  amount?: number;
  currency?: string;
  method?: 'upi' | 'wallet' | 'card' | 'netbanking' | 'qr';
  provider?: string;
  transaction_id?: string;
}

export interface RestaurantContext {
  table_id?: string;
  order_id?: string;
  menu_version?: string;
}

export interface EventContext {
  ticket_id?: string;
  event_id?: string;
  seat?: string;
  entry_time?: Date;
}

export interface ProductContext {
  sku?: string;
  batch_id?: string;
  verified?: boolean;
}

export interface LoyaltyContext {
  points_earned?: number;
  points_balance?: number;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  offer_id?: string;
}

export interface CreatorContext {
  creator_id?: string;
  creator_name?: string;
  affiliate_id?: string;
  content_type?: 'video' | 'post' | 'story' | 'reel';
}

export interface SmartLinkContext {
  redirects_to?: string;
  campaign_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface QRMetadata {
  raw_content: string;
  parsed_at: Date;
  format: 'qr' | 'barcode' | 'datamatrix' | 'unknown';
  error_correction_level?: 'L' | 'M' | 'Q' | 'H';
}

export interface ScanEvent {
  scan_id: string;
  user_id: string;
  qr_type: QRType;
  qr_content: string;
  merchant_id?: string;
  location: Location;
  timestamp: Date;
  action_taken: ActionType;
  intent: string[];
  device_info?: {
    platform: string;
    os_version?: string;
    app_version?: string;
  };
  network_status?: 'online' | 'offline';
  context?: {
    payment?: PaymentDetails;
    restaurant?: RestaurantContext;
    event?: EventContext;
    product?: ProductContext;
    loyalty?: LoyaltyContext;
    creator?: CreatorContext;
    smartlink?: SmartLinkContext;
  };
  metadata?: QRMetadata;
  duration_ms?: number;
  synced?: boolean;
  sync_batch_id?: string;
}

/**
 * Factory function to create a new ScanEvent with defaults
 */
export function createScanEvent(
  scanId: string,
  userId: string,
  qrContent: string,
  qrType: QRType,
  location: Location,
  actionTaken: ActionType,
  intent: string[]
): ScanEvent {
  return {
    scan_id: scanId,
    user_id: userId,
    qr_type: qrType,
    qr_content: qrContent,
    location,
    timestamp: new Date(),
    action_taken: actionTaken,
    intent,
    synced: false,
  };
}

/**
 * Check if scan event has valid required fields
 */
export function isValidScanEvent(event: Partial<ScanEvent>): event is ScanEvent {
  return !!(
    event.scan_id &&
    event.user_id &&
    event.qr_content &&
    event.qr_type &&
    event.location &&
    event.action_taken
  );
}

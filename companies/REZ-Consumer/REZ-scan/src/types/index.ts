/**
 * REZ-scan Types
 */

export type QRType =
  | 'payment'
  | 'restaurant'
  | 'product'
  | 'event'
  | 'loyalty'
  | 'creator'
  | 'verify'
  | 'smart_link'
  | 'general';

export interface ScanEvent {
  scan_id: string;
  user_id: string;
  qr_type: QRType;
  qr_content: string;
  parsed_data?: any;
  location?: {
    lat: number;
    lng: number;
    city?: string;
  };
  device_id?: string;
  timestamp: string;
  action_taken?: string;
}

export interface ScanStats {
  total_scans: number;
  by_type: Record<QRType, number>;
  today: number;
  this_week: number;
  this_month: number;
}

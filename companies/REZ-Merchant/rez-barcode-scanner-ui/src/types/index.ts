export type BarcodeFormat =
  | 'ean_13'
  | 'ean_8'
  | 'upc_a'
  | 'upc_e'
  | 'code_128'
  | 'code_39'
  | 'qr_code'
  | 'code_93'
  | 'codabar'
  | 'itf'
  | 'data_matrix'
  | 'aztec'
  | 'pdf417';

export interface BarcodeResult {
  value: string;
  format: BarcodeFormat;
  timestamp: Date;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  quantity: number;
  sku?: string;
  category?: string;
  imageUrl?: string;
  lowStockThreshold?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Scan {
  id: string;
  barcode: string;
  product?: Product;
  timestamp: Date;
  success: boolean;
  action?: 'add' | 'lookup' | 'adjust';
}

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export interface ScannerConfig {
  formats: BarcodeFormat[];
  scanInterval: number;
  continuousScan: boolean;
  beepOnScan: boolean;
  vibrateOnScan: boolean;
}

export interface InventoryAdjustment {
  productId: string;
  barcode: string;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  timestamp: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ProductLookupResponse extends ApiResponse<Product> {
  relatedProducts?: Product[];
  alternatives?: Product[];
}

export interface InventoryScanMode {
  mode: 'add' | 'remove' | 'set' | 'count';
  defaultQuantity: number;
  requireConfirmation: boolean;
}

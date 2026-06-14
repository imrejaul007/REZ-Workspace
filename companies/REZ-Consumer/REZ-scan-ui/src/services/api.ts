'use client';

/**
 * REZ Scan UI - API Service
 * Connected to REZ-scan service (port 3017)
 */

const API_URL = process.env.NEXT_PUBLIC_SCAN_API_URL || 'http://localhost:3017';

interface ScanResult {
  scanId: string;
  userId: string;
  type: 'qr' | 'barcode' | 'text';
  value: string;
  result: {
    type: string;
    data: any;
  };
  coinsCredited?: number;
  createdAt: string;
}

interface Product {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  price: number;
}

interface Analytics {
  totalScans: number;
  byType: Record<string, number>;
  database: string;
}

class ScanApi {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  // REST API methods
  async scan(userId: string, value: string, type = 'qr'): Promise<{ success: boolean; scan?: ScanResult; coinsCredited?: number }> {
    try {
      const response = await fetch(`${API_URL}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, value, type }),
      });
      return await response.json();
    } catch (error) {
      console.error('Scan API Error:', error);
      return { success: false };
    }
  }

  async getHistory(userId: string, limit = 50): Promise<{ success: boolean; scans?: ScanResult[]; count?: number }> {
    try {
      const response = await fetch(`${API_URL}/api/scans?userId=${userId}&limit=${limit}`);
      return await response.json();
    } catch (error) {
      console.error('History API Error:', error);
      return { success: false };
    }
  }

  async getProduct(barcode: string): Promise<{ success: boolean; product?: Product }> {
    try {
      const response = await fetch(`${API_URL}/api/products/${barcode}`);
      return await response.json();
    } catch (error) {
      console.error('Product API Error:', error);
      return { success: false };
    }
  }

  async addProduct(product: Omit<Product, 'createdAt'>): Promise<{ success: boolean; product?: Product }> {
    try {
      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      return await response.json();
    } catch (error) {
      console.error('Add Product API Error:', error);
      return { success: false };
    }
  }

  async getQRTypes(): Promise<{ success: boolean; types?: Array<{ id: string; name: string; icon: string }> }> {
    try {
      const response = await fetch(`${API_URL}/api/qr-types`);
      return await response.json();
    } catch (error) {
      console.error('QR Types API Error:', error);
      return { success: false };
    }
  }

  async getAnalytics(userId?: string): Promise<{ success: boolean; analytics?: Analytics }> {
    try {
      const url = userId ? `${API_URL}/api/analytics?userId=${userId}` : `${API_URL}/api/analytics`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('Analytics API Error:', error);
      return { success: false };
    }
  }

  async healthCheck(): Promise<{ status: string; service: string; version: string } | null> {
    try {
      const response = await fetch(`${API_URL}/health`);
      return await response.json();
    } catch {
      return null;
    }
  }

  // WebSocket methods
  connectWebSocket(userId: string, onMessage: (data: any) => void) {
    // For Next.js, we use polling instead of WebSocket in client
    // WebSocket would need to be configured differently for SSR
    this.on('scan', onMessage);
    this.on('product_update', onMessage);
    this.on('coin_credited', onMessage);
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.listeners.clear();
  }
}

export const scanApi = new ScanApi();
export type { ScanResult, Product, Analytics };
'use client';

/**
 * REZ Menu QR - API Service
 */

const API_URL = process.env.NEXT_PUBLIC_MENU_QR_API_URL || 'http://localhost:3020';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
}

export interface Table {
  table_id: string;
  number: number;
  capacity: number;
  status: string;
}

class MenuQrApi {
  async generateQR(restaurantId: string, tableId?: string): Promise<{ success: boolean; data?: { qr_content: string } }> {
    try {
      const response = await fetch(`${API_URL}/api/menu/generate-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, tableId }),
      });
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }

  async getMenu(restaurantId: string): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await fetch(`${API_URL}/api/menu/${restaurantId}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }

  async getTables(restaurantId: string): Promise<{ success: boolean; data?: { tables: Table[] } }> {
    try {
      const response = await fetch(`${API_URL}/api/menu/${restaurantId}/tables`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }

  async placeOrder(restaurantId: string, tableId: string, items: any[], customerName: string): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await fetch(`${API_URL}/api/menu/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, tableId, items, customerName }),
      });
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }
}

export const menuQrApi = new MenuQrApi();

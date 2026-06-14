import { apiClient } from './client';

export interface StoreLocation {
  address: string;
  city: string;
  state?: string;
  pincode?: string;
  coordinates?: [number, number]; // [longitude, latitude]
  deliveryRadius?: number;
  landmark?: string;
  distance?: number; // Computed distance from user (km)
}

export interface StoreContact {
  phone?: string;
  email?: string;
  website?: string;
  whatsapp?: string;
}

export interface StoreHours {
  monday?: { open: string; close: string; closed?: boolean };
  tuesday?: { open: string; close: string; closed?: boolean };
  wednesday?: { open: string; close: string; closed?: boolean };
  thursday?: { open: string; close: string; closed?: boolean };
  friday?: { open: string; close: string; closed?: boolean };
  saturday?: { open: string; close: string; closed?: boolean };
  sunday?: { open: string; close: string; closed?: boolean };
}

export interface StoreOperationalInfo {
  hours?: StoreHours;
  deliveryTime?: string;
  minimumOrder?: number;
  deliveryFee?: number;
  freeDeliveryAbove?: number;
  acceptsWalletPayment?: boolean;
  paymentMethods?: string[];
}

export interface StoreOffers {
  cashback?: number;
  minOrderAmount?: number;
  maxCashback?: number;
  isPartner?: boolean;
  partnerLevel?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

/**
 * Payment settings on a store document. Mirrors the backend
 * `IStorePaymentSettings` in rez-backend/src/models/Store.ts so the POS
 * payment screen can read the merchant's configured UPI VPA for QR
 * generation instead of falling back to a hardcoded central account.
 */
export interface StorePaymentSettings {
  upiId?: string;
  upiName?: string;
  acceptedMethods?: string[];
}

export interface ServiceCapabilities {
  homeDelivery: {
    enabled: boolean;
    deliveryRadius?: number;
    minOrder?: number;
    deliveryFee?: number;
    freeDeliveryAbove?: number;
    estimatedTime?: string;
  };
  driveThru: {
    enabled: boolean;
    estimatedTime?: string;
    menuType?: 'full' | 'limited';
  };
  tableBooking: {
    enabled: boolean;
  };
  dineIn: {
    enabled: boolean;
  };
  storePickup: {
    enabled: boolean;
    estimatedTime?: string;
  };
}

export interface Store {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string | string[];
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  location: StoreLocation;
  contact: StoreContact;
  operationalInfo: StoreOperationalInfo;
  offers: StoreOffers;
  paymentSettings?: StorePaymentSettings;
  serviceCapabilities?: ServiceCapabilities;
  tags?: string[];
  isActive: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  isSuspended?: boolean;
  adminNotes?: string;
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'suspended';
  merchantId: string;
  ratings: {
    average: number;
    count: number;
    distribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
  };
  analytics: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    repeatCustomers: number;
  };
  promotions?: StorePromotion[];
  createdAt: string;
  updatedAt: string;
}

// ─── Promotion / Banner ───────────────────────────────────────────────────────
export interface StorePromotion {
  _id?: string;
  title: string;
  subtitle?: string;
  image?: string | null;
  backgroundColor?: string;
  actionText?: string;
  actionUrl?: string;
}

export interface CreateStoreData {
  name: string;
  description?: string;
  logo?: string;
  banner?: string | string[];
  category: string;
  location: StoreLocation;
  contact?: StoreContact;
  operationalInfo?: StoreOperationalInfo;
  offers?: StoreOffers;
  serviceCapabilities?: ServiceCapabilities;
  tags?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface UpdateStoreData extends Partial<CreateStoreData> {}

class StoreService {
  /**
   * Get all stores for the merchant
   */
  async getStores(params?: {
    isActive?: boolean;
    search?: string;
  }): Promise<{ data: Store[]; count: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.isActive !== undefined) {
        queryParams.append('isActive', params.isActive.toString());
      }
      if (params?.search) {
        queryParams.append('search', params.search);
      }

      const queryString = queryParams.toString();
      const url = queryString ? `merchant/stores?${queryString}` : 'merchant/stores';

      const response = await apiClient.get<unknown>(url);

      // Backend returns: { success: true, message: '...', data: Store[], count: number }
      // apiClient.get returns response.data which is the backend response object
      // So: response = { success, message, data: Store[], count }
      // Therefore: response.data = Store[] (the array)
      let stores: Store[] = [];
      let count = 0;

      if (Array.isArray(response.data)) {
        stores = response.data;
        count = (response as unknown).count || stores.length;
      } else if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        stores = Array.isArray((response.data as unknown).data) ? (response.data as unknown).data : [];
        count = (response.data as unknown).count || (response as unknown).count || stores.length;
      }

      return {
        data: stores,
        count: count,
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to get stores');
    }
  }

  /**
   * Get active store
   */
  async getActiveStore(): Promise<Store> {
    try {
      const response = await apiClient.get<unknown>('merchant/stores/active');
      // CRITICAL BUG FIX: the backend `/merchant/stores/active` route uses
      // `Store.find(...)` which returns an ARRAY of stores (all stores where
      // isActive=true), not a single store. Previously this method returned
      // `response.data` directly and typed it as `Store`, so the caller
      // `StoreContext.loadActiveStore` did `setActiveStoreState([store])` —
      // making `activeStore` an array and every downstream `activeStore?._id`
      // access resolve to `undefined`. Every POS/payments/orders flow that
      // depends on the active store was broken because of this one line.
      //
      // Normalise: accept either shape and always return a single Store.
      if (response.success === false) {
        throw new Error(response.message || 'Failed to get active store');
      }
      const data = response.data;
      if (Array.isArray(data)) {
        if (data.length === 0) {
          throw new Error('No active store found');
        }
        return data[0] as Store;
      }
      if (!data) {
        throw new Error('No active store found');
      }
      return data as Store;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to get active store'
      );
    }
  }

  /**
   * Get store by ID
   */
  async getStoreById(storeId: string): Promise<Store> {
    try {
      const response = await apiClient.get<unknown>(`merchant/stores/${storeId}`);
      if (response.success === false) {
        throw new Error(response.message || 'Failed to get store');
      }
      if (!response.data) {
        throw new Error('Store not found');
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to get store');
    }
  }

  /**
   * Create a new store
   */
  async createStore(storeData: CreateStoreData): Promise<Store> {
    try {
      const response = await apiClient.post<unknown>('merchant/stores', storeData);
      if (response.success === false) {
        throw new Error(response.message || 'Failed to create store');
      }
      if (!response.data) {
        throw new Error('Failed to create store');
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to create store');
    }
  }

  /**
   * Update store
   */
  async updateStore(storeId: string, storeData: UpdateStoreData): Promise<Store> {
    try {
      const response = await apiClient.put<unknown>(`merchant/stores/${storeId}`, storeData);

      if (response.success === false) {
        throw new Error(response.message || 'Failed to update store');
      }
      if (!response.data) {
        throw new Error('Failed to update store');
      }

      return response.data;
    } catch (error) {
      const data = error.response?.data;
      let msg = data?.message || error.message || 'Failed to update store';
      if (data?.errors && Array.isArray(data.errors)) {
        const details = data.errors.map((e) => `${e.field}: ${e.message}`).join(', ');
        msg = `${msg} (${details})`;
      }
      throw new Error(msg);
    }
  }

  /**
   * Delete/deactivate store
   */
  async deleteStore(storeId: string): Promise<void> {
    try {
      await apiClient.delete(`merchant/stores/${storeId}`);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete store');
    }
  }

  /**
   * Partially update store (PATCH — for fields like promotions)
   */
  async patchStore(storeId: string, partialData: Partial<Record<string, unknown>>): Promise<Store> {
    try {
      const response = await apiClient.patch<unknown>(`merchant/stores/${storeId}`, partialData);
      if (response.success === false) {
        throw new Error(response.message || 'Failed to update store');
      }
      if (!response.data) {
        throw new Error('Failed to update store');
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to update store');
    }
  }

  /**
   * Activate store (set as active)
   */
  async activateStore(storeId: string): Promise<Store> {
    try {
      const response = await apiClient.post<unknown>(`merchant/stores/${storeId}/activate`);
      if (response.success === false) {
        throw new Error(response.message || 'Failed to activate store');
      }
      if (!response.data) {
        throw new Error('Failed to activate store');
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to activate store');
    }
  }

  /**
   * Deactivate store (set as inactive)
   */
  async deactivateStore(storeId: string): Promise<Store> {
    try {
      const response = await apiClient.post<unknown>(`merchant/stores/${storeId}/deactivate`);
      if (response.success === false) {
        throw new Error(response.message || 'Failed to deactivate store');
      }
      if (!response.data) {
        throw new Error('Failed to deactivate store');
      }
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to deactivate store'
      );
    }
  }
}

export const storeService = new StoreService();
export default storeService;

// @ts-nocheck
// Address Management API Service
// Handles delivery addresses CRUD operations

import apiClient, { ApiResponse } from './apiClient';

export enum AddressType {
  HOME = 'home',
  OFFICE = 'work',
  OTHER = 'other'
}

export interface Address {
  id: string;
  _id?: string; // MongoDB raw id — normalised to id by the backend transform
  type: AddressType;
  title: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isDefault: boolean;
  instructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddressCreate {
  type: AddressType;
  title: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isDefault?: boolean;
  instructions?: string;
}

export interface AddressUpdate {
  type?: AddressType;
  title?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isDefault?: boolean;
  instructions?: string;
}

// Normalise a raw address from the API (handles _id → id mapping)
function normaliseAddress(raw): Address {
  return {
    ...raw,
    id: raw.id || raw._id?.toString() || '',
  };
}

class AddressApiService {
  private baseUrl = '/addresses';

  // Get all user addresses
  async getUserAddresses(): Promise<ApiResponse<Address[]>> {
    const response = await apiClient.get<{ addresses?: unknown[] }>(this.baseUrl);
    if (response.success && response.data) {
      // Backend wraps list as { addresses: [...], pagination: {...} }
      const raw = (response.data as { addresses?: unknown[] }).addresses ?? response.data;
      const list: Address[] = Array.isArray(raw) ? raw.map(normaliseAddress) : [];
      return { ...response, data: list };
    }
    return response as unknown as ApiResponse<Address[]>;
  }

  // Get single address by ID
  async getAddressById(id: string): Promise<ApiResponse<Address>> {
    const response = await apiClient.get<Record<string, unknown>>(`${this.baseUrl}/${id}`);
    if (response.success && response.data) {
      return { ...response, data: normaliseAddress(response.data) };
    }
    return response as unknown as ApiResponse<Address>;
  }

  // Create new address
  async createAddress(data: AddressCreate): Promise<ApiResponse<Address>> {
    const response = await apiClient.post<Record<string, unknown>>(this.baseUrl, data as unknown as Record<string, unknown>);
    if (response.success && response.data) {
      return { ...response, data: normaliseAddress(response.data) };
    }
    return response as unknown as ApiResponse<Address>;
  }

  // Update address
  async updateAddress(id: string, data: AddressUpdate): Promise<ApiResponse<Address>> {
    const response = await apiClient.put<Record<string, unknown>>(`${this.baseUrl}/${id}`, data as unknown as Record<string, unknown>);
    if (response.success && response.data) {
      return { ...response, data: normaliseAddress(response.data) };
    }
    return response as unknown as ApiResponse<Address>;
  }

  // Delete address
  async deleteAddress(id: string): Promise<ApiResponse<{ deletedId: string }>> {
    return apiClient.delete<{ deletedId: string }>(`${this.baseUrl}/${id}`);
  }

  // Set default address
  async setDefaultAddress(id: string): Promise<ApiResponse<Address>> {
    const response = await apiClient.patch<Record<string, unknown>>(`${this.baseUrl}/${id}/default`, {});
    if (response.success && response.data) {
      return { ...response, data: normaliseAddress(response.data) };
    }
    return response as unknown as ApiResponse<Address>;
  }
}

export const addressApi = new AddressApiService();
export default addressApi;
/**
 * REZ Verify QR - API Service
 * Connects to verify-qr-service backend
 */

import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import {
  VerificationResult,
  Warranty,
  Claim,
  Product,
  OwnershipPassport,
  ServiceCenter,
  ClaimRequest,
  WarrantyPlan,
  ApiResponse,
} from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_VERIFY_QR_URL || 'http://localhost:4003';

class VerifyQrApi {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use(async (config) => {
      if (!this.token) {
        this.token = await SecureStore.getItemAsync('authToken');
      }
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Handle response errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired, clear it
          this.clearToken();
        }
        return Promise.reject(error);
      }
    );
  }

  async setToken(token: string): Promise<void> {
    this.token = token;
    await SecureStore.setItemAsync('authToken', token);
  }

  async clearToken(): Promise<void> {
    this.token = null;
    await SecureStore.deleteItemAsync('authToken');
  }

  // ==================== VERIFICATION ====================

  /**
   * Verify a product by serial number
   */
  async verifyBySerial(serialNumber: string): Promise<ApiResponse<VerificationResult>> {
    try {
      const response = await this.client.post<ApiResponse<VerificationResult>>('/api/verify', {
        serial_number: serialNumber,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Verification failed',
      };
    }
  }

  /**
   * Verify a product by QR code data
   */
  async verifyByQR(qrData: string): Promise<ApiResponse<VerificationResult>> {
    try {
      const response = await this.client.post<ApiResponse<VerificationResult>>('/api/verify', {
        qr_data: qrData,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'QR verification failed',
      };
    }
  }

  /**
   * Get product details
   */
  async getProduct(serialNumber: string): Promise<ApiResponse<Product>> {
    try {
      const response = await this.client.get<ApiResponse<Product>>(`/api/product/${serialNumber}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get product',
      };
    }
  }

  // ==================== WARRANTY ====================

  /**
   * Activate warranty for a product
   */
  async activateWarranty(
    serialNumber: string,
    purchaseDate: string,
    invoiceNumber?: string
  ): Promise<ApiResponse<Warranty>> {
    try {
      const response = await this.client.post<ApiResponse<Warranty>>('/api/activate-warranty', {
        serial_number: serialNumber,
        purchase_date: purchaseDate,
        invoice_number: invoiceNumber,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Warranty activation failed',
      };
    }
  }

  /**
   * Get warranty details
   */
  async getWarranty(serialNumber: string): Promise<ApiResponse<Warranty>> {
    try {
      const response = await this.client.get<ApiResponse<Warranty>>(
        `/api/warranty/${serialNumber}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get warranty',
      };
    }
  }

  /**
   * Get available warranty plans
   */
  async getWarrantyPlans(): Promise<ApiResponse<WarrantyPlan[]>> {
    try {
      const response = await this.client.get<ApiResponse<WarrantyPlan[]>>('/api/warranty-plans');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get warranty plans',
      };
    }
  }

  /**
   * Subscribe to extended warranty
   */
  async subscribeWarranty(serialNumber: string, planId: string): Promise<ApiResponse<Warranty>> {
    try {
      const response = await this.client.post<ApiResponse<Warranty>>('/api/subscribe', {
        serial_number: serialNumber,
        plan_id: planId,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Subscription failed',
      };
    }
  }

  // ==================== CLAIMS ====================

  /**
   * File a warranty claim
   */
  async fileClaim(request: ClaimRequest): Promise<ApiResponse<Claim>> {
    try {
      const response = await this.client.post<ApiResponse<Claim>>('/api/claim', request);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to file claim',
      };
    }
  }

  /**
   * Get user's claims
   */
  async getClaims(): Promise<ApiResponse<Claim[]>> {
    try {
      const response = await this.client.get<ApiResponse<Claim[]>>('/api/claims');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get claims',
      };
    }
  }

  /**
   * Get claim details
   */
  async getClaim(claimId: string): Promise<ApiResponse<Claim>> {
    try {
      const response = await this.client.get<ApiResponse<Claim>>(`/api/claim/${claimId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get claim',
      };
    }
  }

  // ==================== OWNERSHIP ====================

  /**
   * Create ownership passport
   */
  async createPassport(serialNumber: string, purchaseDate: string): Promise<ApiResponse<OwnershipPassport>> {
    try {
      const response = await this.client.post<ApiResponse<OwnershipPassport>>('/api/passport/create', {
        serial_number: serialNumber,
        purchase_date: purchaseDate,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create passport',
      };
    }
  }

  /**
   * Get ownership passport
   */
  async getPassport(serialNumber: string): Promise<ApiResponse<OwnershipPassport>> {
    try {
      const response = await this.client.get<ApiResponse<OwnershipPassport>>(
        `/api/passport/${serialNumber}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get passport',
      };
    }
  }

  /**
   * Transfer ownership
   */
  async transferOwnership(serialNumber: string, newOwnerPhone: string): Promise<ApiResponse<OwnershipPassport>> {
    try {
      const response = await this.client.post<ApiResponse<OwnershipPassport>>(
        `/api/passport/${serialNumber}/transfer`,
        {
          new_owner_phone: newOwnerPhone,
        }
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Transfer failed',
      };
    }
  }

  // ==================== SERVICE CENTERS ====================

  /**
   * Find nearby service centers
   */
  async findServiceCenters(
    lat: number,
    lng: number,
    category?: string
  ): Promise<ApiResponse<ServiceCenter[]>> {
    try {
      const response = await this.client.get<ApiResponse<ServiceCenter[]>>(
        '/api/service-centers',
        {
          params: { lat, lng, category },
        }
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to find service centers',
      };
    }
  }

  /**
   * Book service appointment
   */
  async bookService(
    centerId: string,
    serialNumber: string,
    issueDescription: string,
    preferredDate: string
  ): Promise<ApiResponse<{ appointmentId: string }>> {
    try {
      const response = await this.client.post<ApiResponse<{ appointmentId: string }>>(
        '/api/service/book',
        {
          center_id: centerId,
          serial_number: serialNumber,
          issue_description: issueDescription,
          preferred_date: preferredDate,
        }
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Booking failed',
      };
    }
  }

  // ==================== USER ====================

  /**
   * Get user's verified products
   */
  async getMyProducts(): Promise<ApiResponse<Product[]>> {
    try {
      const response = await this.client.get<ApiResponse<Product[]>>('/api/my-products');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get products',
      };
    }
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<ApiResponse<{ id: string; phone: string; name?: string; email?: string }>> {
    try {
      const response = await this.client.get('/api/profile');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get profile',
      };
    }
  }
}

// Export singleton instance
export const verifyQrApi = new VerifyQrApi();
export default verifyQrApi;

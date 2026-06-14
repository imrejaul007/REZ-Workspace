import axios, { AxiosInstance, AxiosError } from 'axios';

// ============================================================================
// Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: { field: string; message: string }[];
}

export interface OnboardingStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  fields?: FormField[];
  completedAt?: string;
  data?: Record<string, unknown>;
  order: number;
}

export interface OnboardingSteps {
  steps: OnboardingStep[];
  currentStep: number;
  completedAt?: string;
}

export interface Store {
  id: string;
  merchantId: string;
  name: string;
  type: string;
  address: StoreAddress;
  phone: string;
  email: string;
  status: 'active' | 'inactive' | 'onboarding';
  onboardingId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface FormField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'file' | 'select' | 'textarea';
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  options?: { value: string; label: string }[];
}

export interface QRCode {
  id: string;
  storeId: string;
  productId?: string;
  shelfCode: string;
  qrData: string;
  imageUrl?: string;
  printedAt?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stockQuantity: number;
  shelfCode: string;
}

// ============================================================================
// API Client
// ============================================================================

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/onboarding',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      (error: AxiosError<ApiResponse<unknown>>) => {
        if (error.response?.data) {
          const message = error.response.data.errors
            ?.map(e => e.message)
            .join(', ') || error.response.data.error || 'An error occurred';
          return Promise.reject(new Error(message));
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // Onboarding API
  // ============================================================================

  async createStore(data: CreateStoreRequest): Promise<{ store: Store; onboarding: OnboardingSteps }> {
    const response = await this.client.post<ApiResponse<{ store: Store; onboarding: OnboardingSteps }>>(
      '/store',
      data
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to create store');
    }
    return response.data.data;
  }

  async getOnboardingStatus(storeId: string): Promise<OnboardingSteps> {
    const response = await this.client.get<ApiResponse<OnboardingSteps>>(`/store/${storeId}/status`);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to get onboarding status');
    }
    return response.data.data;
  }

  async getOnboarding(onboardingId: string): Promise<OnboardingSteps> {
    const response = await this.client.get<ApiResponse<OnboardingSteps>>(`/onboarding/${onboardingId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to get onboarding');
    }
    return response.data.data;
  }

  async completeStep(onboardingId: string, stepId: string, data: Record<string, unknown>): Promise<OnboardingSteps> {
    const response = await this.client.put<ApiResponse<OnboardingSteps>>(
      `/onboarding/${onboardingId}/complete-step`,
      { stepId, data }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to complete step');
    }
    return response.data.data;
  }

  async skipStep(onboardingId: string, stepId: string): Promise<OnboardingSteps> {
    const response = await this.client.post<ApiResponse<OnboardingSteps>>(
      `/onboarding/${onboardingId}/skip-step`,
      { stepId }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to skip step');
    }
    return response.data.data;
  }

  async goBack(onboardingId: string): Promise<OnboardingSteps> {
    const response = await this.client.post<ApiResponse<OnboardingSteps>>(
      `/onboarding/${onboardingId}/go-back`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to go back');
    }
    return response.data.data;
  }

  async completeOnboarding(onboardingId: string): Promise<OnboardingSteps> {
    const response = await this.client.post<ApiResponse<OnboardingSteps>>(
      `/onboarding/${onboardingId}/complete`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to complete onboarding');
    }
    return response.data.data;
  }

  // ============================================================================
  // Store API
  // ============================================================================

  async getStore(storeId: string): Promise<Store> {
    const response = await this.client.get<ApiResponse<Store>>(`/store/${storeId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to get store');
    }
    return response.data.data;
  }

  async getMerchantStores(merchantId: string): Promise<Store[]> {
    const response = await this.client.get<ApiResponse<Store[]>>(`/merchant/${merchantId}/stores`);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to get stores');
    }
    return response.data.data;
  }

  // ============================================================================
  // QR Codes API
  // ============================================================================

  async generateQRCodes(storeId: string): Promise<QRCode[]> {
    const response = await this.client.post<ApiResponse<QRCode[]>>(`/store/${storeId}/qr-codes/generate`);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to generate QR codes');
    }
    return response.data.data;
  }

  async getQRCodes(storeId: string): Promise<QRCode[]> {
    const response = await this.client.get<ApiResponse<QRCode[]>>(`/store/${storeId}/qr-codes`);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to get QR codes');
    }
    return response.data.data;
  }

  async markQRCodesPrinted(storeId: string, qrIds: string[]): Promise<void> {
    await this.client.post(`/store/${storeId}/qr-codes/print`, { qrIds });
  }

  // ============================================================================
  // Products API
  // ============================================================================

  async getProducts(storeId: string): Promise<Product[]> {
    const response = await this.client.get<ApiResponse<Product[]>>(`/store/${storeId}/products`);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to get products');
    }
    return response.data.data;
  }

  async addProduct(storeId: string, product: Partial<Product>): Promise<Product> {
    const response = await this.client.post<ApiResponse<Product>>(`/store/${storeId}/products`, product);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to add product');
    }
    return response.data.data;
  }

  async importProducts(storeId: string, products: Partial<Product>[]): Promise<{ imported: number; errors: string[] }> {
    const response = await this.client.post<ApiResponse<{ imported: number; errors: string[] }>>(
      `/store/${storeId}/products/import`,
      { products }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to import products');
    }
    return response.data.data;
  }

  // ============================================================================
  // POS API
  // ============================================================================

  async setupPOS(storeId: string, config: POSConfig): Promise<POSConfig> {
    const response = await this.client.post<ApiResponse<POSConfig>>(`/store/${storeId}/pos`, config);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to setup POS');
    }
    return response.data.data;
  }
}

export interface CreateStoreRequest {
  merchantId: string;
  storeName: string;
  storeType: 'retail' | 'restaurant' | 'grocery' | 'pharmacy';
  address: StoreAddress;
  phone: string;
  email: string;
  operatingHours?: OperatingHours[];
}

export interface OperatingHours {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface POSConfig {
  defaultTaxRate: number;
  currency: string;
  receiptFooter: string;
  allowDiscounts: boolean;
  maxDiscountPercent: number;
  staffPINRequired: boolean;
}

export const api = new ApiClient();
export default api;

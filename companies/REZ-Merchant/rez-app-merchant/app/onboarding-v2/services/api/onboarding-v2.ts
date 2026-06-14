/**
 * Onboarding V2 API Service
 * API routes for streamlined onboarding
 */

import { apiClient } from '../../../../services/api/client';

export interface OnboardingV2Status {
  id: string;
  merchantId: string;
  currentStep: number;
  completedSteps: number[];
  businessInfo?: BusinessInfoData;
  serviceSelection?: ServiceSelectionData;
  quickSetup?: QuickSetupData;
  bankDetailsSkipped: boolean;
  documentsSkipped: boolean;
  status: 'in_progress' | 'completed' | 'pending_verification' | 'verified';
  createdAt: string;
  updatedAt: string;
}

export interface BusinessInfoData {
  businessName: string;
  ownerName: string;
  phone: string;
  email?: string;
  businessType: string;
  businessCategory: string;
  storeName?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  gstin?: string;
}

export interface ServiceSelectionData {
  onlineOrdering: boolean;
  scanAndPay: boolean;
  loyaltyStamps: boolean;
  menuQr: boolean;
  tableReservations: boolean;
  delivery: boolean;
}

export interface QuickSetupData {
  menuItems?: Array<{
    name: string;
    price: number;
    category: string;
  }>;
  timeSlots?: string[];
}

export interface BankDetailsData {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountType: 'savings' | 'current';
}

export interface DocumentsData {
  gstin?: string;
  pan?: string;
  addressProof?: string;
  idProof?: string;
  canceledCheque?: string;
}

class OnboardingV2Service {
  private baseUrl = '/api/onboarding-v2';

  /**
   * Start a new streamlined onboarding flow
   */
  async start(): Promise<{ data: OnboardingV2Status }> {
    return apiClient.post<OnboardingV2Status>(`${this.baseUrl}/start`);
  }

  /**
   * Get current onboarding status
   */
  async getStatus(): Promise<{ data: OnboardingV2Status }> {
    return apiClient.get<OnboardingV2Status>(`${this.baseUrl}/status`);
  }

  /**
   * Save Step 1: Business + Store info
   */
  async saveBusinessInfo(data: BusinessInfoData): Promise<{ data: { step: number } }> {
    return apiClient.put<{ step: number }>(`${this.baseUrl}/step-1`, data);
  }

  /**
   * Save Step 2: Service selection
   */
  async saveServiceSelection(data: ServiceSelectionData): Promise<{ data: { step: number } }> {
    return apiClient.put<{ step: number }>(`${this.baseUrl}/step-2`, data);
  }

  /**
   * Save Step 3: Quick setup
   */
  async saveQuickSetup(data: QuickSetupData): Promise<{ data: { step: number } }> {
    return apiClient.put<{ step: number }>(`${this.baseUrl}/step-3`, data);
  }

  /**
   * Complete onboarding
   */
  async complete(): Promise<{ data: OnboardingV2Status }> {
    return apiClient.post<OnboardingV2Status>(`${this.baseUrl}/complete`);
  }

  /**
   * Auto-approve small business (for quick activation)
   */
  async autoApprove(): Promise<{ data: { approved: boolean; reason?: string } }> {
    return apiClient.post<{ approved: boolean; reason?: string }>(`${this.baseUrl}/auto-approve`);
  }

  /**
   * Save optional bank details
   */
  async saveBankDetails(data: BankDetailsData): Promise<{ data: { saved: boolean } }> {
    return apiClient.put<{ saved: boolean }>(`${this.baseUrl}/bank`, data);
  }

  /**
   * Upload documents
   */
  async uploadDocuments(data: DocumentsData): Promise<{ data: { uploaded: string[] } }> {
    return apiClient.post<{ uploaded: string[] }>(`${this.baseUrl}/documents`, data);
  }

  /**
   * GSTIN lookup - auto-fill from GST registration
   */
  async lookupGSTIN(gstin: string): Promise<{ data: BusinessInfoData }> {
    return apiClient.get<BusinessInfoData>(`${this.baseUrl}/gstin/${gstin}`);
  }

  /**
   * Validate bank details (IFSC, account)
   */
  async validateBankDetails(
    accountNumber: string,
    ifscCode: string
  ): Promise<{
    data: {
      ifscValid: boolean;
      accountValid: boolean;
      bankName?: string;
      branchName?: string;
    };
  }> {
    return apiClient.post(`${this.baseUrl}/validate-bank`, { accountNumber, ifscCode });
  }

  /**
   * Generate QR codes for selected services
   */
  async generateQRCodes(services: string[]): Promise<{ data: { codes: Record<string, string> } }> {
    return apiClient.post<{ codes: Record<string, string> }>(`${this.baseUrl}/generate-qr`, {
      services,
    });
  }

  /**
   * Save progress (auto-save)
   */
  async saveProgress(data: Partial<OnboardingV2Status>): Promise<{ data: { saved: boolean } }> {
    return apiClient.put<{ saved: boolean }>(`${this.baseUrl}/progress`, data);
  }

  /**
   * Reset onboarding
   */
  async reset(): Promise<{ data: { reset: boolean } }> {
    return apiClient.post<{ reset: boolean }>(`${this.baseUrl}/reset`);
  }
}

export const onboardingV2Service = new OnboardingV2Service();

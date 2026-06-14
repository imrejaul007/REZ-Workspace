// Payment Method API Service
// Handles payment methods (cards, bank accounts, UPI) management

import apiClient, { ApiResponse } from './apiClient';

// CV-07 FIX: Aligned to canonical lowercase values. Backend stores UPPERCASE; normalize on read.
export enum PaymentMethodType {
  CARD = 'card',
  BANK_ACCOUNT = 'bank_account',
  UPI = 'upi',
  WALLET = 'wallet'
}

export enum CardType {
  CREDIT = 'credit',
  DEBIT = 'debit'
}

export enum CardBrand {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  AMEX = 'amex',
  RUPAY = 'rupay',
  DISCOVER = 'discover',
  OTHER = 'other'
}

export enum BankAccountType {
  SAVINGS = 'savings',
  CURRENT = 'current'
}

export interface CardDetails {
  type: CardType;
  brand: CardBrand;
  lastFourDigits: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName: string;
  nickname?: string;
}

export interface BankAccountDetails {
  bankName: string;
  accountType: BankAccountType;
  accountNumber: string; // Will be masked
  ifscCode: string;
  nickname?: string;
  isVerified: boolean;
}

export interface UPIDetails {
  vpa: string;
  nickname?: string;
  isVerified: boolean;
}

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  card?: CardDetails;
  bankAccount?: BankAccountDetails;
  upi?: UPIDetails;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethodCreate {
  type: PaymentMethodType;
  card?: Omit<CardDetails, 'lastFourDigits'> & { cardNumber: string };
  bankAccount?: BankAccountDetails;
  upi?: UPIDetails;
  isDefault?: boolean;
}

export interface PaymentMethodUpdate {
  card?: Partial<CardDetails>;
  bankAccount?: Partial<BankAccountDetails>;
  upi?: Partial<UPIDetails>;
  isDefault?: boolean;
}

class PaymentMethodApiService {
  private baseUrl = '/payment-methods';

  // Get all user payment methods
  async getUserPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
    return apiClient.get<PaymentMethod[]>(this.baseUrl);
  }

  // Get single payment method by ID
  async getPaymentMethodById(id: string): Promise<ApiResponse<PaymentMethod>> {
    return apiClient.get<PaymentMethod>(`${this.baseUrl}/${id}`);
  }

  // Create new payment method
  async createPaymentMethod(data: PaymentMethodCreate): Promise<ApiResponse<PaymentMethod>> {
    return apiClient.post<PaymentMethod>(this.baseUrl, data);
  }

  // Update payment method
  async updatePaymentMethod(id: string, data: PaymentMethodUpdate): Promise<ApiResponse<PaymentMethod>> {
    return apiClient.put<PaymentMethod>(`${this.baseUrl}/${id}`, data);
  }

  // Delete payment method (soft delete)
  async deletePaymentMethod(id: string): Promise<ApiResponse<{ deletedId: string }>> {
    return apiClient.delete<{ deletedId: string }>(`${this.baseUrl}/${id}`);
  }

  // Set default payment method
  async setDefaultPaymentMethod(id: string): Promise<ApiResponse<PaymentMethod>> {
    return apiClient.patch<PaymentMethod>(`${this.baseUrl}/${id}/default`, {});
  }
}

export const paymentMethodApi = new PaymentMethodApiService();
export default paymentMethodApi;
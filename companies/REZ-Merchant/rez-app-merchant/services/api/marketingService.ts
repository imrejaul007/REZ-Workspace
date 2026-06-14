/**
 * Marketing Service - Offers, Campaigns, and Discounts API
 *
 * Connects to rez-merchant-service for marketing and promotional features:
 * - Offers: Create, read, update, delete promotional offers
 * - Campaigns: Marketing campaign management
 * - Discount Codes: Generate and manage discount codes
 *
 * Base URL: https://rez-merchant-service.onrender.com/api/v1
 */

import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

// ============================================
// Type Definitions
// ============================================

export interface Offer {
  id: string;
  merchantId: string;
  title: string;
  description: string;
  type: 'percentage' | 'fixed' | 'bogo' | 'bundle' | 'loyalty' | 'cashback';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  redemptions: number;
  targetAudience?: 'all' | 'new' | 'returning' | 'vip';
  applicableProducts?: string[];
  applicableCategories?: string[];
  terms?: string;
  imageUrl?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfferPayload {
  title: string;
  description: string;
  type: Offer['type'];
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  targetAudience?: Offer['targetAudience'];
  applicableProducts?: string[];
  applicableCategories?: string[];
  terms?: string;
  imageUrl?: string;
}

export interface UpdateOfferPayload extends Partial<CreateOfferPayload> {
  isActive?: boolean;
}

export interface Campaign {
  id: string;
  merchantId: string;
  name: string;
  type: 'push' | 'sms' | 'email' | 'whatsapp' | 'in_app' | 'multi_channel';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'failed';
  budget?: number;
  budgetSpent?: number;
  budgetCap?: number;
  targetSegment?: string;
  targetAudience?: string;
  redemptionCount?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  revenueAttributed?: number;
  roi?: number;
  startDate?: string;
  endDate?: string;
  launchedAt?: string;
  completedAt?: string;
  durationDays?: number;
  rewardValue?: number;
  estimatedROI?: number;
  message?: string;
  channels?: string[];
  content?: {
    title?: string;
    body?: string;
    imageUrl?: string;
    ctaText?: string;
    ctaUrl?: string;
  };
  stats?: {
    sent?: number;
    delivered?: number;
    failed?: number;
    opened?: number;
    clicked?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignPayload {
  name: string;
  type: Campaign['type'];
  targetSegment?: string;
  targetAudience?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  message?: string;
  channels?: string[];
  content?: Campaign['content'];
}

export interface DiscountCode {
  id: string;
  merchantId: string;
  code: string;
  type: 'percentage' | 'fixed' | 'bogo' | 'bundle';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  validFrom: string;
  validTo: string;
  applicableProducts?: string[];
  applicableCategories?: string[];
  terms?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscountCodePayload {
  code: string;
  type: DiscountCode['type'];
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  maxUses?: number;
  validFrom: string;
  validTo: string;
  applicableProducts?: string[];
  applicableCategories?: string[];
  terms?: string;
}

export interface OfferStats {
  totalOffers: number;
  activeOffers: number;
  totalRedemptions: number;
  totalSavings: number;
  averageOfferValue: number;
  topPerformingOffers: Offer[];
}

export interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenueAttributed: number;
  averageROI: number;
  campaigns: Campaign[];
}

// ============================================
// API Functions - Offers
// ============================================

/**
 * Get all offers for a merchant
 */
export async function getOffers(merchantId: string): Promise<ApiResponse<Offer[]>> {
  try {
    const response = await apiClient.get<Offer[]>(`/offers/${merchantId}`);
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch offers',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Get a single offer by ID
 */
export async function getOffer(merchantId: string, offerId: string): Promise<ApiResponse<Offer>> {
  try {
    const response = await apiClient.get<Offer>(`/offers/${merchantId}/${offerId}`);
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch offer',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Create a new offer
 */
export async function createOffer(
  merchantId: string,
  payload: CreateOfferPayload
): Promise<ApiResponse<Offer>> {
  try {
    const response = await apiClient.post<Offer>(`/offers`, {
      ...payload,
      merchantId,
    });
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to create offer',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Update an existing offer
 */
export async function updateOffer(
  merchantId: string,
  offerId: string,
  payload: UpdateOfferPayload
): Promise<ApiResponse<Offer>> {
  try {
    const response = await apiClient.patch<Offer>(`/offers/${merchantId}/${offerId}`, payload);
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to update offer',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Delete an offer
 */
export async function deleteOffer(merchantId: string, offerId: string): Promise<ApiResponse<void>> {
  try {
    await apiClient.delete(`/offers/${merchantId}/${offerId}`);
    return {
      success: true,
      statusCode: 200,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to delete offer',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Toggle offer active status
 */
export async function toggleOfferStatus(
  merchantId: string,
  offerId: string,
  isActive: boolean
): Promise<ApiResponse<Offer>> {
  return updateOffer(merchantId, offerId, { isActive });
}

/**
 * Get offer statistics
 */
export async function getOfferStats(merchantId: string): Promise<ApiResponse<OfferStats>> {
  try {
    const response = await apiClient.get<OfferStats>(`/offers/${merchantId}/stats`);
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch offer stats',
      statusCode: error.response?.status,
    };
  }
}

// ============================================
// API Functions - Campaigns
// ============================================

/**
 * Get all campaigns for a merchant
 */
export async function getCampaigns(merchantId: string): Promise<ApiResponse<Campaign[]>> {
  try {
    const response = await apiClient.get<Campaign[]>(`/campaigns/${merchantId}`);
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch campaigns',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Get a single campaign by ID
 */
export async function getCampaign(
  merchantId: string,
  campaignId: string
): Promise<ApiResponse<Campaign>> {
  try {
    const response = await apiClient.get<Campaign>(`/campaigns/${merchantId}/${campaignId}`);
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch campaign',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Create a new campaign
 */
export async function createCampaign(
  merchantId: string,
  payload: CreateCampaignPayload
): Promise<ApiResponse<Campaign>> {
  try {
    const response = await apiClient.post<Campaign>(`/campaigns`, {
      ...payload,
      merchantId,
    });
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to create campaign',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Update an existing campaign
 */
export async function updateCampaign(
  merchantId: string,
  campaignId: string,
  payload: Partial<CreateCampaignPayload & { status: Campaign['status'] }>
): Promise<ApiResponse<Campaign>> {
  try {
    const response = await apiClient.patch<Campaign>(
      `/campaigns/${merchantId}/${campaignId}`,
      payload
    );
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to update campaign',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(
  merchantId: string,
  campaignId: string
): Promise<ApiResponse<void>> {
  try {
    await apiClient.delete(`/campaigns/${merchantId}/${campaignId}`);
    return {
      success: true,
      statusCode: 200,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to delete campaign',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Pause a campaign
 */
export async function pauseCampaign(
  merchantId: string,
  campaignId: string
): Promise<ApiResponse<Campaign>> {
  return updateCampaign(merchantId, campaignId, { status: 'paused' });
}

/**
 * Resume a campaign
 */
export async function resumeCampaign(
  merchantId: string,
  campaignId: string
): Promise<ApiResponse<Campaign>> {
  return updateCampaign(merchantId, campaignId, { status: 'active' });
}

/**
 * Get campaign statistics
 */
export async function getCampaignStats(merchantId: string): Promise<ApiResponse<CampaignStats>> {
  try {
    const response = await apiClient.get<CampaignStats>(`/campaigns/${merchantId}/stats`);
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch campaign stats',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Get campaign recommendations
 */
export async function getCampaignRecommendations(
  merchantId: string
): Promise<ApiResponse<Campaign[]>> {
  try {
    const response = await apiClient.get<Campaign[]>(`/campaigns/${merchantId}/recommendations`);
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.message || error.message || 'Failed to fetch campaign recommendations',
      statusCode: error.response?.status,
    };
  }
}

// ============================================
// API Functions - Discount Codes
// ============================================

/**
 * Get all discount codes for a merchant
 */
export async function getDiscountCodes(merchantId: string): Promise<ApiResponse<DiscountCode[]>> {
  try {
    const response = await apiClient.get<DiscountCode[]>(`/discounts/${merchantId}`);
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch discount codes',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Get a single discount code by ID
 */
export async function getDiscountCode(
  merchantId: string,
  discountId: string
): Promise<ApiResponse<DiscountCode>> {
  try {
    const response = await apiClient.get<DiscountCode>(`/discounts/${merchantId}/${discountId}`);
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch discount code',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Create a new discount code
 */
export async function createDiscountCode(
  merchantId: string,
  payload: CreateDiscountCodePayload
): Promise<ApiResponse<DiscountCode>> {
  try {
    const response = await apiClient.post<DiscountCode>(`/discounts`, {
      ...payload,
      merchantId,
    });
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to create discount code',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Update an existing discount code
 */
export async function updateDiscountCode(
  merchantId: string,
  discountId: string,
  payload: Partial<CreateDiscountCodePayload & { isActive: boolean }>
): Promise<ApiResponse<DiscountCode>> {
  try {
    const response = await apiClient.patch<DiscountCode>(
      `/discounts/${merchantId}/${discountId}`,
      payload
    );
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to update discount code',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Delete a discount code
 */
export async function deleteDiscountCode(
  merchantId: string,
  discountId: string
): Promise<ApiResponse<void>> {
  try {
    await apiClient.delete(`/discounts/${merchantId}/${discountId}`);
    return {
      success: true,
      statusCode: 200,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to delete discount code',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Deactivate a discount code (soft delete)
 */
export async function deactivateDiscountCode(
  merchantId: string,
  discountId: string
): Promise<ApiResponse<DiscountCode>> {
  return updateDiscountCode(merchantId, discountId, { isActive: false });
}

/**
 * Generate a random discount code
 */
export function generateDiscountCode(prefix = 'REZ'): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = prefix;
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Format offer type for display
 */
export function formatOfferType(type: Offer['type']): string {
  const labels: Record<Offer['type'], string> = {
    percentage: 'Percentage Off',
    fixed: 'Fixed Discount',
    bogo: 'Buy One Get One',
    bundle: 'Bundle Deal',
    loyalty: 'Loyalty Reward',
    cashback: 'Cashback',
  };
  return labels[type] || type;
}

/**
 * Format campaign type for display
 */
export function formatCampaignType(type: Campaign['type']): string {
  const labels: Record<Campaign['type'], string> = {
    push: 'Push Notification',
    sms: 'SMS',
    email: 'Email',
    whatsapp: 'WhatsApp',
    in_app: 'In-App',
    multi_channel: 'Multi-Channel',
  };
  return labels[type] || type;
}

/**
 * Get status color for campaigns
 */
export function getCampaignStatusColor(
  status: Campaign['status']
): { bg: string; text: string } {
  const colors: Record<Campaign['status'], { bg: string; text: string }> = {
    draft: { bg: '#f3f4f6', text: '#6b7280' },
    scheduled: { bg: '#fef3c7', text: '#d97706' },
    active: { bg: '#d1fae5', text: '#059669' },
    paused: { bg: '#fee2e2', text: '#dc2626' },
    completed: { bg: '#dbeafe', text: '#1d4ed8' },
    failed: { bg: '#fee2e2', text: '#dc2626' },
  };
  return colors[status] || { bg: '#f3f4f6', text: '#6b7280' };
}

/**
 * Calculate ROI percentage
 */
export function calculateROI(revenue: number, spend: number): number {
  if (spend === 0) return 0;
  return ((revenue - spend) / spend) * 100;
}

/**
 * Format currency for INR
 */
export function formatCurrencyINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Check if an offer is currently valid
 */
export function isOfferValid(offer: Offer): boolean {
  if (!offer.isActive) return false;
  const now = new Date();
  const start = new Date(offer.startDate);
  const end = new Date(offer.endDate);
  return now >= start && now <= end;
}

/**
 * Check if a discount code is currently valid
 */
export function isDiscountCodeValid(discount: DiscountCode): boolean {
  if (!discount.isActive) return false;
  if (discount.maxUses && discount.usedCount >= discount.maxUses) return false;
  const now = new Date();
  const start = new Date(discount.validFrom);
  const end = new Date(discount.validTo);
  return now >= start && now <= end;
}

// ============================================
// Re-export types for convenience
// ============================================
export type {
  ApiResponse,
  PaginatedResponse,
};

// ============================================
// Auth/Context Helpers
// ============================================

/**
 * Get merchant ID from auth context or storage
 * In production, this should integrate with your auth system
 */
export async function getMerchantId(): Promise<string> {
  try {
    // Try to get from storage or auth context
    // This is a placeholder - integrate with your actual auth system
    const { storageService } = await import('../storage');
    const merchantId = await storageService.getMerchantId?.();
    if (merchantId) return merchantId;

    // Fallback for development
    return 'default';
  } catch {
    return 'default';
  }
}

/**
 * Get merchant ID synchronously if available
 * Returns null if not yet loaded
 */
export function getMerchantIdSync(): string | null {
  try {
    // Placeholder for sync access to merchant ID
    // In production, this would access a React context or store
    return null;
  } catch {
    return null;
  }
}

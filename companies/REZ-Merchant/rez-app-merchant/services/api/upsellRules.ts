import { apiClient } from './client';

export interface UpsellRule {
  _id: string;
  storeId: string;
  name: string;
  triggerType: 'product' | 'category' | 'cart_value' | 'unknown';
  triggerProductId?: string;
  triggerCategory?: string;
  suggestedProductId: string;
  suggestedProductName: string;
  suggestedProductPrice: number;
  suggestedProductImage?: string;
  badgeText?: string;
  discountPercent?: number;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUpsellRuleData {
  storeId: string;
  name: string;
  triggerType: 'product' | 'category' | 'cart_value' | 'unknown';
  triggerProductId?: string;
  triggerCategory?: string;
  suggestedProductId: string;
  suggestedProductName: string;
  suggestedProductPrice: number;
  suggestedProductImage?: string;
  badgeText?: string;
  discountPercent?: number;
  priority?: number;
}

class UpsellRulesService {
  async getRules(storeId?: string, activeOnly?: boolean): Promise<UpsellRule[]> {
    try {
      let url = 'merchant/upsell/rules';
      const params = new URLSearchParams();
      if (storeId) params.append('storeId', storeId);
      if (activeOnly) params.append('active', 'true');
      const qs = params.toString();
      if (qs) url += `?${qs}`;

      const response = await apiClient.get<UpsellRule[]>(url);
      if (response.success && response.data) return response.data;
      return [];
    } catch (error) {
      if (__DEV__) console.error('Get upsell rules error:', error);
      throw new Error(error.message || 'Failed to fetch upsell rules');
    }
  }

  async createRule(data: CreateUpsellRuleData): Promise<UpsellRule> {
    try {
      const response = await apiClient.post<UpsellRule>('merchant/upsell/rules', data);
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to create upsell rule');
    } catch (error) {
      if (__DEV__) console.error('Create upsell rule error:', error);
      throw new Error(error.message || 'Failed to create upsell rule');
    }
  }

  async updateRule(
    ruleId: string,
    data: Partial<CreateUpsellRuleData & { isActive: boolean }>
  ): Promise<UpsellRule> {
    try {
      const response = await apiClient.put<UpsellRule>(`merchant/upsell/rules/${ruleId}`, data);
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to update upsell rule');
    } catch (error) {
      if (__DEV__) console.error('Update upsell rule error:', error);
      throw new Error(error.message || 'Failed to update upsell rule');
    }
  }

  async deleteRule(ruleId: string): Promise<void> {
    try {
      const response = await apiClient.delete<void>(`merchant/upsell/rules/${ruleId}`);
      if (!response.success) throw new Error(response.error || 'Failed to delete upsell rule');
    } catch (error) {
      if (__DEV__) console.error('Delete upsell rule error:', error);
      throw new Error(error.message || 'Failed to delete upsell rule');
    }
  }

  async toggleRule(ruleId: string, isActive: boolean): Promise<UpsellRule> {
    return this.updateRule(ruleId, { isActive });
  }
}

export const upsellRulesService = new UpsellRulesService();
export default upsellRulesService;

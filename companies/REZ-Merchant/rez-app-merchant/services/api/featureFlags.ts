import apiClient from './client';

export interface MerchantFeatureFlag {
  key: string;
  description: string;
  enabled: boolean;
  isOverridden: boolean;
  overrideReason: string | null;
  expiresAt: string | null;
}

class FeatureFlagService {
  async getAll() {
    return apiClient.get<unknown>('merchant/feature-flags');
  }

  async getByKey(key: string) {
    return apiClient.get<unknown>(`merchant/feature-flags/${key}`);
  }
}

export const featureFlagService = new FeatureFlagService();
export default featureFlagService;

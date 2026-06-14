import apiClient from './client';

export interface AnomalyAlert {
  _id: string;
  type: string;
  status: 'monitoring' | 'reviewed' | 'dismissed' | 'escalated';
  value?: number;
  threshold?: number;
  coinsEarned?: number;
  windowMinutes?: number;
  flaggedAt: string;
  notes?: string;
  createdAt: string;
}

export interface FraudStatus {
  anomalies: {
    monitoring: number;
    reviewed: number;
    dismissed: number;
    escalated: number;
    total: number;
  };
  cashback: {
    totalRequests: number;
    flaggedRequests: number;
    highRiskRequests: number;
    fraudRate: number;
  };
  period: string;
}

class FraudService {
  async getAlerts(params?: { page?: number; limit?: number; status?: string; type?: string }) {
    return apiClient.get<unknown>('merchant/fraud/alerts', { params });
  }

  async getAlertById(id: string) {
    return apiClient.get<unknown>(`merchant/fraud/alerts/${id}`);
  }

  async getStatus() {
    return apiClient.get<unknown>('merchant/fraud/status');
  }
}

export const fraudService = new FraudService();
export default fraudService;

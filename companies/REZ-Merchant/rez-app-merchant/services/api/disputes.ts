import apiClient from './client';

export interface DisputeTimeline {
  action: string;
  note?: string;
  at: string;
}

export interface MerchantResponse {
  text: string;
  attachments?: string[];
  respondedAt?: string;
}

export interface Dispute {
  _id: string;
  store: string | { _id: string; name: string; logo?: string };
  status: string;
  merchantResponse?: MerchantResponse;
  timeline?: DisputeTimeline[];
  createdAt: string;
  updatedAt: string;
  [key: string];
}

export interface DisputesListData {
  disputes: Dispute[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const disputesApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<DisputesListData>('merchant/disputes', { params }),

  getById: (id: string) => apiClient.get<Dispute>(`merchant/disputes/${id}`),

  respond: (id: string, data: { response: string; attachments?: string[] }) =>
    apiClient.post<Dispute>(`merchant/disputes/${id}/respond`, data),

  updateStatus: (
    id: string,
    data: {
      status: 'resolved' | 'rejected' | 'resolved_refund' | 'resolved_reject';
      notes?: string;
    }
  ) => apiClient.patch<Dispute>(`merchant/disputes/${id}`, data),
};

export default disputesApi;

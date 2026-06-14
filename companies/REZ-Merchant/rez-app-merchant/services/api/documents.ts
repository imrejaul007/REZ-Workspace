// Document generation service for merchant app

import { apiClient } from './client';
import {
  Document,
  DocumentType,
  DocumentStatus,
  DocumentFilters,
  DocumentListResponse,
  GenerateDocumentRequest,
  DocumentGenerationResponse,
  EmailDocumentRequest,
  BulkGenerateDocumentsRequest,
  BulkGenerateDocumentsResponse,
  DocumentAnalytics,
  DocumentSettings,
  InvoiceData,
  ShippingLabelData,
  PackingSlipData,
  ShippingCarrier,
  DocumentGenerationOptions,
} from '../../types/documents';
import {
  validateDocumentData,
  formatInvoiceNumber,
  calculateExpiryDate,
} from '../../utils/documentHelpers';

class DocumentsService {
  private readonly base = 'merchant/documents';

  async generateInvoice(
    orderId: string,
    options?: DocumentGenerationOptions
  ): Promise<DocumentGenerationResponse> {
    try {
      if (!orderId) throw new Error('Order ID is required');

      const requestData: GenerateDocumentRequest = {
        type: DocumentType.INVOICE,
        orderId,
        templateId: options?.template,
        options,
      };

      const response = await apiClient.post<DocumentGenerationResponse>(
        `${this.base}/generate`,
        requestData
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to generate invoice');
    } catch (error) {
      if (__DEV__) console.error('Generate invoice error:', error);
      throw new Error(error.message || 'Failed to generate invoice');
    }
  }

  async generateShippingLabel(
    orderId: string,
    carrier: ShippingCarrier,
    options?: DocumentGenerationOptions
  ): Promise<DocumentGenerationResponse> {
    try {
      if (!orderId) throw new Error('Order ID is required');
      if (!carrier) throw new Error('Shipping carrier is required');

      const requestData: GenerateDocumentRequest = {
        type: DocumentType.SHIPPING_LABEL,
        orderId,
        options,
        data: { carrier },
      };

      const response = await apiClient.post<DocumentGenerationResponse>(
        `${this.base}/generate`,
        requestData
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to generate shipping label');
    } catch (error) {
      if (__DEV__) console.error('Generate shipping label error:', error);
      throw new Error(error.message || 'Failed to generate shipping label');
    }
  }

  async generatePackingSlip(
    orderId: string,
    options?: DocumentGenerationOptions
  ): Promise<DocumentGenerationResponse> {
    try {
      if (!orderId) throw new Error('Order ID is required');

      const requestData: GenerateDocumentRequest = {
        type: DocumentType.PACKING_SLIP,
        orderId,
        options,
      };

      const response = await apiClient.post<DocumentGenerationResponse>(
        `${this.base}/generate`,
        requestData
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to generate packing slip');
    } catch (error) {
      if (__DEV__) console.error('Generate packing slip error:', error);
      throw new Error(error.message || 'Failed to generate packing slip');
    }
  }

  async getDocument(documentId: string): Promise<Document> {
    try {
      const response = await apiClient.get<Document>(`${this.base}/${documentId}`);
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to get document');
    } catch (error) {
      if (__DEV__) console.error('Get document error:', error);
      throw new Error(error.message || 'Failed to get document');
    }
  }

  async listDocuments(filters?: DocumentFilters): Promise<DocumentListResponse> {
    try {
      const searchParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<DocumentListResponse>(
        `${this.base}?${searchParams.toString()}`
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to list documents');
    } catch (error) {
      if (__DEV__) console.error('List documents error:', error);
      throw new Error(error.message || 'Failed to list documents');
    }
  }

  async deleteDocument(documentId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete<void>(`${this.base}/${documentId}`);
      if (response.success) {
        return { success: true, message: response.message || 'Document deleted' };
      }
      throw new Error(response.error || 'Failed to delete document');
    } catch (error) {
      if (__DEV__) console.error('Delete document error:', error);
      throw new Error(error.message || 'Failed to delete document');
    }
  }

  async emailDocument(
    documentId: string,
    recipients: string[],
    options?: { subject?: string; message?: string; attachmentName?: string }
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!recipients || recipients.length === 0) {
        throw new Error('At least one recipient is required');
      }

      const requestData: EmailDocumentRequest = {
        documentId,
        recipients,
        subject: options?.subject,
        message: options?.message,
        attachmentName: options?.attachmentName,
      };

      const response = await apiClient.post<void>(`${this.base}/${documentId}/email`, requestData);
      if (response.success) {
        return { success: true, message: response.message || 'Document emailed' };
      }
      throw new Error(response.error || 'Failed to email document');
    } catch (error) {
      if (__DEV__) console.error('Email document error:', error);
      throw new Error(error.message || 'Failed to email document');
    }
  }

  async downloadDocument(documentId: string): Promise<{ url: string; filename: string }> {
    try {
      const response = await apiClient.get<{ url: string; filename: string }>(
        `${this.base}/${documentId}/download`
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to get download URL');
    } catch (error) {
      if (__DEV__) console.error('Download document error:', error);
      throw new Error(error.message || 'Failed to download document');
    }
  }

  async bulkGenerateDocuments(
    request: BulkGenerateDocumentsRequest
  ): Promise<BulkGenerateDocumentsResponse> {
    try {
      if (!request.orderIds || request.orderIds.length === 0) {
        throw new Error('At least one order ID is required');
      }

      const response = await apiClient.post<BulkGenerateDocumentsResponse>(
        `${this.base}/bulk-generate`,
        request
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to bulk generate documents');
    } catch (error) {
      if (__DEV__) console.error('Bulk generate documents error:', error);
      throw new Error(error.message || 'Failed to bulk generate documents');
    }
  }

  async getAnalytics(dateStart?: string, dateEnd?: string): Promise<DocumentAnalytics> {
    try {
      const searchParams = new URLSearchParams();
      if (dateStart) searchParams.append('dateStart', dateStart);
      if (dateEnd) searchParams.append('dateEnd', dateEnd);

      const response = await apiClient.get<DocumentAnalytics>(
        `${this.base}/analytics?${searchParams.toString()}`
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to get analytics');
    } catch (error) {
      if (__DEV__) console.error('Get analytics error:', error);
      return {
        totalDocuments: 0,
        documentsByType: {} as Record<string, number>,
        documentsByStatus: {} as Record<string, number>,
        totalDownloads: 0,
        totalEmailsSent: 0,
        averageGenerationTime: 0,
        storageUsed: 0,
        topDocumentTypes: [],
        recentActivity: [],
      };
    }
  }

  async getSettings(): Promise<DocumentSettings> {
    try {
      const response = await apiClient.get<DocumentSettings>(`${this.base}/settings`);
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to get settings');
    } catch (error) {
      if (__DEV__) console.error('Get settings error:', error);
      throw new Error(error.message || 'Failed to get settings');
    }
  }

  async updateSettings(settings: Partial<DocumentSettings>): Promise<DocumentSettings> {
    try {
      const response = await apiClient.put<DocumentSettings>(`${this.base}/settings`, settings);
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to update settings');
    } catch (error) {
      if (__DEV__) console.error('Update settings error:', error);
      throw new Error(error.message || 'Failed to update settings');
    }
  }

  async getDocumentsByOrder(orderId: string): Promise<Document[]> {
    try {
      const result = await this.listDocuments({
        orderId,
        sortBy: 'created',
        sortOrder: 'desc',
      });
      return result.documents;
    } catch (error) {
      if (__DEV__) console.error('Get documents by order error:', error);
      return [];
    }
  }

  async getDocumentsByType(
    type: DocumentType,
    page: number = 1,
    limit: number = 20
  ): Promise<DocumentListResponse> {
    return this.listDocuments({ type, page, limit, sortBy: 'created', sortOrder: 'desc' });
  }

  async checkGenerationStatus(documentId: string): Promise<{
    status: DocumentStatus;
    progress?: number;
    message?: string;
  }> {
    try {
      const response = await apiClient.get<{
        status: DocumentStatus;
        progress?: number;
        message?: string;
      }>(`${this.base}/${documentId}/status`);
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to check status');
    } catch (error) {
      if (__DEV__) console.error('Check generation status error:', error);
      throw new Error(error.message || 'Failed to check generation status');
    }
  }
}

export const documentsService = new DocumentsService();
export default documentsService;

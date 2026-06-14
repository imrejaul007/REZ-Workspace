import { api } from './index';

export interface DocumentUploadData {
  type: string;
  name: string;
  url: string;
  employeeId?: string;
  restaurantId?: string;
  vendorId?: string;
}

export interface AadhaarVerificationData {
  aadhaarNumber: string;
  name: string;
  dateOfBirth?: string;
  address?: string;
  phone?: string;
}

export interface Document {
  id: string;
  type: string;
  name: string;
  url: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AadhaarVerificationStatus {
  status: 'NOT_INITIATED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  verificationId?: string;
  matchScore?: number;
  verifiedAt?: string;
  attempts?: number;
}

export interface EmployeeVerificationStatus {
  employeeId: string;
  aadharVerified: boolean;
  verifiedAt?: string;
  verificationScore: number;
  requiredDocuments: string[];
  verifiedDocuments: Array<{
    id: string;
    type: string;
    name: string;
    verifiedAt: string;
  }>;
  aadhaarStatus: string;
  isFullyVerified: boolean;
}

export interface VerificationDashboard {
  restaurantId: string;
  pendingVerifications: number;
  verifiedEmployees: number;
  totalDocuments: number;
  verificationRate: number;
}

export interface PendingEmployee {
  id: string;
  employeeCode: string;
  designation: string;
  user: {
    id: string;
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
    };
  };
  aadharVerified: boolean;
  pendingDocuments: number;
  aadhaarStatus: string;
}

export interface PendingEmployeesResponse {
  employees: PendingEmployee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class VerificationService {
  // Document Management
  async uploadDocument(data: DocumentUploadData): Promise<Document> {
    const response = await api.post('/verification/documents', data);
    return response.data;
  }

  async getEmployeeDocuments(employeeId: string): Promise<Document[]> {
    const response = await api.get(`/verification/documents/employee/${employeeId}`);
    return response.data;
  }

  async verifyDocument(
    documentId: string,
    status: 'VERIFIED' | 'REJECTED',
    rejectionReason?: string
  ): Promise<Document> {
    const response = await api.put(`/verification/documents/${documentId}/verify`, {
      status,
      rejectionReason
    });
    return response.data;
  }

  async deleteDocument(documentId: string): Promise<void> {
    await api.delete(`/verification/documents/${documentId}`);
  }

  // Aadhaar Verification
  async initiateAadhaarVerification(data: AadhaarVerificationData): Promise<{
    verificationId: string;
    status: string;
    message: string;
  }> {
    const response = await api.post('/verification/aadhaar/initiate', data);
    return response.data;
  }

  async getAadhaarVerificationStatus(): Promise<AadhaarVerificationStatus> {
    const response = await api.get('/verification/aadhaar/status');
    return response.data;
  }

  // Employee Verification Status
  async getEmployeeVerificationStatus(employeeId: string): Promise<EmployeeVerificationStatus> {
    const response = await api.get(`/verification/employee/${employeeId}/status`);
    return response.data;
  }

  async getEmployeesRequiringVerification(
    restaurantId: string,
    page = 1,
    limit = 20
  ): Promise<PendingEmployeesResponse> {
    const response = await api.get('/verification/employees/pending', {
      params: { restaurantId, page, limit }
    });
    return response.data;
  }

  // Dashboard
  async getVerificationDashboard(restaurantId: string): Promise<VerificationDashboard> {
    const response = await api.get(`/verification/dashboard/${restaurantId}`);
    return response.data;
  }

  // File Upload Utility
  async uploadFile(file: File, documentType: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', documentType);

    const response = await api.post('/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.url;
  }

  // Verification Status Checking
  async checkVerificationStatus(employeeId: string): Promise<{
    canApplyForJobs: boolean;
    missingRequirements: string[];
    verificationScore: number;
  }> {
    const status = await this.getEmployeeVerificationStatus(employeeId);

    const missingRequirements: string[] = [];

    if (!status.aadharVerified || status.aadhaarStatus !== 'VERIFIED') {
      missingRequirements.push('Aadhaar verification');
    }

    const requiredDocs = ['aadhar', 'pan', 'photo'];
    const verifiedTypes = status.verifiedDocuments.map(doc => doc.type);

    requiredDocs.forEach(docType => {
      if (!verifiedTypes.includes(docType)) {
        missingRequirements.push(`${docType.charAt(0).toUpperCase() + docType.slice(1)} document`);
      }
    });

    return {
      canApplyForJobs: status.isFullyVerified,
      missingRequirements,
      verificationScore: status.verificationScore
    };
  }

  // Bulk Operations
  async bulkVerifyDocuments(documentIds: string[], status: 'VERIFIED' | 'REJECTED'): Promise<void> {
    await api.post('/verification/documents/bulk-verify', {
      documentIds,
      status
    });
  }

  async getVerificationStats(restaurantId: string): Promise<{
    totalEmployees: number;
    verifiedEmployees: number;
    pendingVerifications: number;
    rejectedDocuments: number;
    avgVerificationTime: number; // in hours
  }> {
    const response = await api.get(`/verification/stats/${restaurantId}`);
    return response.data;
  }
}

export const verificationService = new VerificationService();
import { v4 as uuidv4 } from 'uuid';
import {
  Claim,
  ClaimStatus,
  ClaimType,
  ClaimDocument,
  InitiateClaimRequest,
  UploadDocumentRequest,
  ApiResponse,
  PaginatedResponse,
} from '../models/insurance';
import { policyService } from './policyService';

// In-memory data store
const claims: Map<string, Claim> = new Map();

// Seed data for demonstration
const seedClaims: Claim[] = [
  {
    claimId: 'CLM001',
    policyId: 'POL002',
    userId: 'USER001',
    patientId: 'PAT001',
    patientName: 'Shyam Kumar',
    type: ClaimType.REIMBURSEMENT,
    status: ClaimStatus.SETTLED,
    amount: 45000,
    diagnosis: 'Knee Replacement Surgery',
    documents: [
      {
        documentId: 'DOC001',
        type: 'discharge_summary',
        fileName: 'discharge_summary.pdf',
        fileUrl: '/documents/CLM001/discharge_summary.pdf',
        uploadedAt: '2024-06-01T10:00:00Z',
        verified: true,
      },
      {
        documentId: 'DOC002',
        type: 'hospital_bills',
        fileName: 'hospital_bills.pdf',
        fileUrl: '/documents/CLM001/hospital_bills.pdf',
        uploadedAt: '2024-06-01T10:05:00Z',
        verified: true,
      },
      {
        documentId: 'DOC003',
        type: 'medical_reports',
        fileName: 'xray_reports.pdf',
        fileUrl: '/documents/CLM001/xray_reports.pdf',
        uploadedAt: '2024-06-01T10:10:00Z',
        verified: true,
      },
    ],
    hospitalId: 'HOSP001',
    hospitalName: 'Apollo Hospitals',
    treatmentDate: '2024-05-15',
    approvalDate: '2024-06-05',
    settledAmount: 40000,
    rejectionReason: undefined,
    remarks: 'Approved with 5000 deduction for non-network hospital charges',
    claimNumber: 'CLM/2024/00001',
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-10T10:00:00Z',
  },
  {
    claimId: 'CLM002',
    policyId: 'POL001',
    userId: 'USER001',
    patientId: 'PAT002',
    patientName: 'Priya Kumar',
    type: ClaimType.CASHLESS,
    status: ClaimStatus.UNDER_REVIEW,
    amount: 75000,
    diagnosis: 'Appendectomy',
    documents: [
      {
        documentId: 'DOC004',
        type: 'claim_form',
        fileName: 'claim_form.pdf',
        fileUrl: '/documents/CLM002/claim_form.pdf',
        uploadedAt: '2025-11-15T10:00:00Z',
        verified: true,
      },
      {
        documentId: 'DOC005',
        type: 'medical_reports',
        fileName: 'diagnosis_report.pdf',
        fileUrl: '/documents/CLM002/diagnosis_report.pdf',
        uploadedAt: '2025-11-15T10:05:00Z',
        verified: false,
      },
    ],
    hospitalId: 'HOSP002',
    hospitalName: 'Fortis Hospital',
    treatmentDate: '2025-11-10',
    claimNumber: 'CLM/2025/00002',
    createdAt: '2025-11-15T10:00:00Z',
    updatedAt: '2025-11-15T10:05:00Z',
  },
];

// Initialize seed data
seedClaims.forEach((claim) => {
  claims.set(claim.claimId, claim);
});

export class ClaimService {
  /**
   * Initiate a new claim
   */
  async initiateClaim(request: InitiateClaimRequest): Promise<ApiResponse<Claim>> {
    // Validate policy exists and is active
    const policyResult = await policyService.getPolicyDetails(request.policyId);
    if (!policyResult.success || !policyResult.data) {
      return {
        success: false,
        error: 'Policy not found',
      };
    }

    const policy = policyResult.data;

    // Check policy status
    if (policy.status !== 'active') {
      return {
        success: false,
        error: 'Policy is not active. Cannot initiate claim.',
      };
    }

    // Check claim amount against sum insured
    if (request.amount > policy.sumInsured) {
      return {
        success: false,
        error: `Claim amount exceeds sum insured (₹${policy.sumInsured.toLocaleString()})`,
      };
    }

    const claimId = `CLM${uuidv4().slice(0, 6).toUpperCase()}`;
    const claimNumber = `CLM/${new Date().getFullYear()}/${claimId.slice(-5)}`;

    const newClaim: Claim = {
      claimId,
      policyId: request.policyId,
      userId: request.userId,
      patientId: request.patientId,
      patientName: request.patientName,
      type: request.type,
      status: ClaimStatus.INITIATED,
      amount: request.amount,
      diagnosis: request.diagnosis,
      documents: [],
      hospitalId: request.hospitalId,
      hospitalName: request.hospitalName,
      treatmentDate: request.treatmentDate,
      claimNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    claims.set(claimId, newClaim);

    return {
      success: true,
      data: newClaim,
      message: 'Claim initiated successfully. Please upload required documents.',
    };
  }

  /**
   * Upload documents for a claim
   */
  async uploadDocuments(
    claimId: string,
    documents: UploadDocumentRequest[]
  ): Promise<ApiResponse<Claim>> {
    const claim = claims.get(claimId);
    if (!claim) {
      return {
        success: false,
        error: 'Claim not found',
      };
    }

    // Check if claim is in a state where documents can be uploaded
    if (
      claim.status === ClaimStatus.SETTLED ||
      claim.status === ClaimStatus.DISBURSED ||
      claim.status === ClaimStatus.REJECTED
    ) {
      return {
        success: false,
        error: 'Cannot upload documents for a settled, disbursed, or rejected claim',
      };
    }

    const newDocuments: ClaimDocument[] = documents.map((doc) => ({
      documentId: `DOC${uuidv4().slice(0, 6).toUpperCase()}`,
      type: doc.type,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      uploadedAt: new Date().toISOString(),
      verified: false,
    }));

    claim.documents.push(...newDocuments);

    // Update claim status if documents pending
    if (claim.status === ClaimStatus.DOCUMENTS_PENDING) {
      claim.status = ClaimStatus.UNDER_REVIEW;
    }

    claim.updatedAt = new Date().toISOString();
    claims.set(claimId, claim);

    return {
      success: true,
      data: claim,
      message: `${documents.length} document(s) uploaded successfully`,
    };
  }

  /**
   * Track claim status
   */
  async trackClaim(claimId: string): Promise<ApiResponse<Claim>> {
    const claim = claims.get(claimId);
    if (!claim) {
      return {
        success: false,
        error: 'Claim not found',
      };
    }

    return {
      success: true,
      data: claim,
    };
  }

  /**
   * Get claim history for a user
   */
  async getClaimHistory(userId: string): Promise<PaginatedResponse<Claim>> {
    const userClaims = Array.from(claims.values())
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

    return {
      success: true,
      data: userClaims,
      pagination: {
        page: 1,
        limit: userClaims.length,
        total: userClaims.length,
        totalPages: 1,
      },
    };
  }

  /**
   * Get detailed information about a specific claim
   */
  async getClaimDetails(claimId: string): Promise<ApiResponse<Claim>> {
    const claim = claims.get(claimId);
    if (!claim) {
      return {
        success: false,
        error: 'Claim not found',
      };
    }

    return {
      success: true,
      data: claim,
    };
  }

  /**
   * Update claim status (internal/admin use)
   */
  async updateClaimStatus(
    claimId: string,
    status: ClaimStatus,
    settledAmount?: number,
    rejectionReason?: string,
    remarks?: string
  ): Promise<ApiResponse<Claim>> {
    const claim = claims.get(claimId);
    if (!claim) {
      return {
        success: false,
        error: 'Claim not found',
      };
    }

    claim.status = status;
    claim.updatedAt = new Date().toISOString();

    if (settledAmount !== undefined) {
      claim.settledAmount = settledAmount;
    }

    if (rejectionReason) {
      claim.rejectionReason = rejectionReason;
    }

    if (remarks) {
      claim.remarks = remarks;
    }

    if (status === ClaimStatus.APPROVED) {
      claim.approvalDate = new Date().toISOString();
    }

    claims.set(claimId, claim);

    return {
      success: true,
      data: claim,
      message: `Claim status updated to ${status}`,
    };
  }

  /**
   * Calculate expected settlement amount
   */
  async calculateExpectedSettlement(claimId: string): Promise<ApiResponse<{ expectedAmount: number; breakdown: Record<string, number> }>> {
    const claim = claims.get(claimId);
    if (!claim) {
      return {
        success: false,
        error: 'Claim not found',
      };
    }

    const policyResult = await policyService.getPolicyDetails(claim.policyId);
    if (!policyResult.success || !policyResult.data) {
      return {
        success: false,
        error: 'Policy details not found',
      };
    }

    const policy = policyResult.data;
    const planResult = await policyService.getAllPolicies(); // Get plan from policy
    const plan = planResult.find((p) => p.planId === policy.planId);

    // Simple calculation (in real scenario, would use plan details)
    let expectedAmount = claim.amount;
    const breakdown: Record<string, number> = {
      claimedAmount: claim.amount,
      copayDeduction: 0,
      subLimitDeduction: 0,
      finalSettlement: claim.amount,
    };

    // Apply copay if applicable
    if (plan && plan.copay > 0) {
      const copayAmount = Math.round((claim.amount * plan.copay) / 100);
      breakdown.copayDeduction = copayAmount;
      expectedAmount -= copayAmount;
    }

    breakdown.finalSettlement = expectedAmount;

    return {
      success: true,
      data: {
        expectedAmount,
        breakdown,
      },
    };
  }

  /**
   * Get all claims (for admin purposes)
   */
  async getAllClaims(): Promise<Claim[]> {
    return Array.from(claims.values());
  }

  /**
   * Get claims statistics
   */
  async getClaimsStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    settled: number;
    totalAmount: number;
    totalSettledAmount: number;
    averageProcessingTime: string;
  }> {
    const allClaims = Array.from(claims.values());

    const stats = {
      total: allClaims.length,
      pending: allClaims.filter(
        (c) =>
          c.status === ClaimStatus.INITIATED ||
          c.status === ClaimStatus.DOCUMENTS_PENDING ||
          c.status === ClaimStatus.UNDER_REVIEW
      ).length,
      approved: allClaims.filter((c) => c.status === ClaimStatus.APPROVED).length,
      rejected: allClaims.filter((c) => c.status === ClaimStatus.REJECTED).length,
      settled: allClaims.filter(
        (c) =>
          c.status === ClaimStatus.SETTLED || c.status === ClaimStatus.DISBURSED
      ).length,
      totalAmount: allClaims.reduce((sum, c) => sum + c.amount, 0),
      totalSettledAmount: allClaims.reduce(
        (sum, c) => sum + (c.settledAmount || 0),
        0
      ),
      averageProcessingTime: '12 days', // Simplified
    };

    return stats;
  }

  /**
   * Delete a document from a claim
   */
  async deleteDocument(
    claimId: string,
    documentId: string
  ): Promise<ApiResponse<Claim>> {
    const claim = claims.get(claimId);
    if (!claim) {
      return {
        success: false,
        error: 'Claim not found',
      };
    }

    const documentIndex = claim.documents.findIndex(
      (d) => d.documentId === documentId
    );
    if (documentIndex === -1) {
      return {
        success: false,
        error: 'Document not found',
      };
    }

    claim.documents.splice(documentIndex, 1);
    claim.updatedAt = new Date().toISOString();
    claims.set(claimId, claim);

    return {
      success: true,
      data: claim,
      message: 'Document deleted successfully',
    };
  }
}

export const claimService = new ClaimService();

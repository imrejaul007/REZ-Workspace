/**
 * HOJAI AI Support Agent - Warranty Checker Service
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Warranty verification, coverage checking, and claim management
 */
import type { WarrantyRecord, WarrantyCheckInput, WarrantyCheckResult, WarrantyClaim, WarrantyClaimInputType } from '../types.js';
/**
 * Create a new warranty record
 */
export declare function createWarrantyRecord(input: {
    productId: string;
    productName: string;
    productSku: string;
    serialNumber?: string;
    purchaseDate: string;
    customerId: string;
    customerEmail: string;
    warrantyMonths?: number;
    warrantyType?: 'standard' | 'extended' | 'limited';
}): Promise<WarrantyRecord>;
/**
 * Check warranty status
 */
export declare function checkWarranty(input: WarrantyCheckInput): Promise<WarrantyCheckResult>;
/**
 * Get warranty by ID
 */
export declare function getWarrantyById(warrantyId: string): Promise<WarrantyRecord | null>;
/**
 * Get warranties by customer ID
 */
export declare function getWarrantiesByCustomer(customerId: string): Promise<WarrantyRecord[]>;
/**
 * Get warranties by product ID
 */
export declare function getWarrantiesByProduct(productId: string): Promise<WarrantyRecord[]>;
/**
 * Submit warranty claim
 */
export declare function submitClaim(input: WarrantyClaimInputType & {
    customerId?: string;
}): Promise<WarrantyClaim>;
/**
 * Get claim by ID
 */
export declare function getClaimById(claimId: string): Promise<WarrantyClaim | null>;
/**
 * Get claims by warranty ID
 */
export declare function getClaimsByWarranty(warrantyId: string): Promise<WarrantyClaim[]>;
/**
 * Get claims by status
 */
export declare function getClaimsByStatus(status: WarrantyClaim['status']): Promise<WarrantyClaim[]>;
/**
 * Update claim status
 */
export declare function updateClaimStatus(claimId: string, status: WarrantyClaim['status'], resolution?: string): Promise<WarrantyClaim | null>;
/**
 * Approve claim
 */
export declare function approveClaim(claimId: string, resolution: string): Promise<WarrantyClaim | null>;
/**
 * Reject claim
 */
export declare function rejectClaim(claimId: string, reason: string): Promise<WarrantyClaim | null>;
/**
 * Get warranty statistics
 */
export declare function getWarrantyStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    voided: number;
    totalClaims: number;
    pendingClaims: number;
    approvedClaims: number;
    rejectedClaims: number;
    claimApprovalRate: number;
}>;
/**
 * Get coverage details
 */
export declare function getCoverageDetails(): {
    type: 'standard' | 'extended' | 'limited';
    name: string;
    description: string;
    covered: string[];
    excluded: string[];
}[];
/**
 * Extend warranty
 */
export declare function extendWarranty(warrantyId: string, additionalMonths: number): Promise<WarrantyRecord | null>;
/**
 * Void warranty
 */
export declare function voidWarranty(warrantyId: string, reason: string): Promise<WarrantyRecord | null>;
//# sourceMappingURL=warrantyService.d.ts.map
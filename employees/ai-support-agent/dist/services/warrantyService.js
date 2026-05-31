/**
 * HOJAI AI Support Agent - Warranty Checker Service
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Warranty verification, coverage checking, and claim management
 */
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger.js';
const logger = createLogger('warranty-service');
// In-memory warranty storage
const warranties = new Map();
const claims = new Map();
/**
 * Default warranty periods by product category (in months)
 */
const DEFAULT_WARRANTY_PERIODS = {
    electronics: 12,
    appliances: 24,
    furniture: 12,
    clothing: 30, // days
    footwear: 30, // days
    accessories: 6,
    default: 12,
};
/**
 * Coverage types
 */
const COVERAGE_TYPES = {
    standard: {
        name: 'Standard Warranty',
        description: 'Covers manufacturing defects and workmanship issues',
        covered: ['Mechanical failures', 'Electrical defects', 'Material flaws', 'Craftsmanship issues'],
        excluded: ['Physical damage', 'Accidental damage', 'Normal wear', 'Unauthorized modifications', 'Acts of nature'],
    },
    extended: {
        name: 'Extended Warranty',
        description: 'Extended coverage beyond standard warranty',
        covered: ['All standard coverage', 'Accidental damage', 'Power surges'],
        excluded: ['Intentional damage', 'Theft', 'Loss'],
    },
    limited: {
        name: 'Limited Warranty',
        description: 'Limited coverage for specific components',
        covered: ['Specific components only'],
        excluded: ['Most damage types'],
    },
};
/**
 * Create a new warranty record
 */
export async function createWarrantyRecord(input) {
    logger.info('create_warranty', { productId: input.productId, customerId: input.customerId });
    const id = uuidv4();
    const warrantyMonths = input.warrantyMonths || DEFAULT_WARRANTY_PERIODS.default;
    const warrantyType = input.warrantyType || 'standard';
    const purchaseDate = new Date(input.purchaseDate);
    const endDate = new Date(purchaseDate);
    endDate.setMonth(endDate.getMonth() + warrantyMonths);
    const coverage = {
        type: warrantyType,
        startDate: input.purchaseDate,
        endDate: endDate.toISOString(),
        coveredParts: COVERAGE_TYPES[warrantyType].covered,
        excludedParts: COVERAGE_TYPES[warrantyType].excluded,
    };
    const warranty = {
        id,
        productId: input.productId,
        productName: input.productName,
        productSku: input.productSku,
        serialNumber: input.serialNumber,
        purchaseDate: input.purchaseDate,
        customerId: input.customerId,
        customerEmail: input.customerEmail,
        status: 'active',
        coverage,
        claims: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    warranties.set(id, warranty);
    logger.info('warranty_created', { warrantyId: id, productId: input.productId });
    return warranty;
}
/**
 * Check warranty status
 */
export async function checkWarranty(input) {
    logger.info('check_warranty', { input });
    // Find warranty by various identifiers
    let warranty;
    if (input.productId) {
        warranty = Array.from(warranties.values()).find(w => w.productId === input.productId);
    }
    if (!warranty && input.serialNumber) {
        warranty = Array.from(warranties.values()).find(w => w.serialNumber === input.serialNumber);
    }
    if (!warranty && input.customerId) {
        warranty = Array.from(warranties.values()).find(w => w.customerId === input.customerId);
    }
    if (!warranty && input.orderId) {
        // In production, look up by order ID
        warranty = Array.from(warranties.values()).find(w => w.metadata?.orderId === input.orderId);
    }
    if (!warranty) {
        // Create a demo warranty for testing
        const demoWarranty = await createDemoWarranty(input);
        if (demoWarranty) {
            warranty = demoWarranty;
        }
        else {
            return {
                found: false,
                eligible: false,
                reason: 'Warranty not found for the provided product/order information',
            };
        }
    }
    // Calculate current status
    const now = new Date();
    const endDate = new Date(warranty.coverage.endDate);
    const startDate = new Date(warranty.coverage.startDate);
    let status = warranty.status;
    let eligible = true;
    let reason;
    if (now < startDate) {
        status = 'limited';
        eligible = false;
        reason = 'Warranty coverage has not started yet';
    }
    else if (now > endDate) {
        status = 'expired';
        eligible = false;
        reason = 'Warranty has expired';
    }
    // Check for void conditions
    if (warranty.metadata?.voided) {
        status = 'void';
        eligible = false;
        reason = 'Warranty has been voided';
    }
    const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    logger.info('warranty_check_result', {
        warrantyId: warranty.id,
        status,
        eligible,
        remainingDays,
    });
    return {
        found: true,
        warranty: {
            ...warranty,
            status,
        },
        eligible,
        reason,
    };
}
/**
 * Create demo warranty for testing
 */
async function createDemoWarranty(input) {
    // Only create demo if we have enough info
    if (!input.productId && !input.customerId) {
        return null;
    }
    const id = uuidv4();
    const productId = input.productId || 'demo-product-001';
    const purchaseDate = new Date();
    purchaseDate.setMonth(purchaseDate.getMonth() - 6); // 6 months ago
    const endDate = new Date(purchaseDate);
    endDate.setMonth(endDate.getMonth() + 12);
    const warranty = {
        id,
        productId,
        productName: 'Demo Product',
        productSku: 'DEMO-001',
        serialNumber: input.serialNumber,
        purchaseDate: purchaseDate.toISOString(),
        customerId: input.customerId || 'demo-customer-001',
        customerEmail: 'demo@example.com',
        status: 'active',
        coverage: {
            type: 'standard',
            startDate: purchaseDate.toISOString(),
            endDate: endDate.toISOString(),
            coveredParts: COVERAGE_TYPES.standard.covered,
            excludedParts: COVERAGE_TYPES.standard.excluded,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    warranties.set(id, warranty);
    return warranty;
}
/**
 * Get warranty by ID
 */
export async function getWarrantyById(warrantyId) {
    return warranties.get(warrantyId) || null;
}
/**
 * Get warranties by customer ID
 */
export async function getWarrantiesByCustomer(customerId) {
    const customerWarranties = [];
    for (const warranty of warranties.values()) {
        if (warranty.customerId === customerId) {
            customerWarranties.push(warranty);
        }
    }
    return customerWarranties.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
/**
 * Get warranties by product ID
 */
export async function getWarrantiesByProduct(productId) {
    const productWarranties = [];
    for (const warranty of warranties.values()) {
        if (warranty.productId === productId) {
            productWarranties.push(warranty);
        }
    }
    return productWarranties;
}
/**
 * Submit warranty claim
 */
export async function submitClaim(input) {
    logger.info('submit_warranty_claim', { warrantyId: input.warrantyId, claimType: input.claimType });
    const warranty = warranties.get(input.warrantyId);
    if (!warranty) {
        throw new Error('Warranty not found');
    }
    // Check eligibility
    const checkResult = await checkWarranty({
        productId: warranty.productId,
        serialNumber: warranty.serialNumber,
    });
    if (!checkResult.eligible) {
        throw new Error(`Warranty not eligible for claim: ${checkResult.reason}`);
    }
    const id = uuidv4();
    const claim = {
        id,
        warrantyId: input.warrantyId,
        ticketId: input.ticketId,
        claimType: input.claimType,
        description: input.description,
        status: 'submitted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    claims.set(id, claim);
    // Add claim to warranty
    warranty.claims = warranty.claims || [];
    warranty.claims.push(claim);
    warranty.updatedAt = new Date().toISOString();
    logger.info('warranty_claim_submitted', { claimId: id, warrantyId: input.warrantyId });
    return claim;
}
/**
 * Get claim by ID
 */
export async function getClaimById(claimId) {
    return claims.get(claimId) || null;
}
/**
 * Get claims by warranty ID
 */
export async function getClaimsByWarranty(warrantyId) {
    const warranty = warranties.get(warrantyId);
    return warranty?.claims || [];
}
/**
 * Get claims by status
 */
export async function getClaimsByStatus(status) {
    const statusClaims = [];
    for (const claim of claims.values()) {
        if (claim.status === status) {
            statusClaims.push(claim);
        }
    }
    return statusClaims;
}
/**
 * Update claim status
 */
export async function updateClaimStatus(claimId, status, resolution) {
    const claim = claims.get(claimId);
    if (!claim) {
        logger.warn('claim_not_found', { claimId });
        return null;
    }
    claim.status = status;
    claim.updatedAt = new Date().toISOString();
    if (resolution) {
        claim.resolution = resolution;
    }
    if (status === 'completed') {
        claim.resolvedAt = new Date().toISOString();
    }
    // Update warranty claim reference
    const warranty = warranties.get(claim.warrantyId);
    if (warranty?.claims) {
        const warrantyClaim = warranty.claims.find(c => c.id === claimId);
        if (warrantyClaim) {
            warrantyClaim.status = status;
            warrantyClaim.resolution = resolution;
            warrantyClaim.resolvedAt = claim.resolvedAt;
            warrantyClaim.updatedAt = claim.updatedAt;
        }
    }
    logger.info('claim_status_updated', { claimId, status });
    return claim;
}
/**
 * Approve claim
 */
export async function approveClaim(claimId, resolution) {
    logger.info('approve_claim', { claimId });
    return updateClaimStatus(claimId, 'approved', resolution);
}
/**
 * Reject claim
 */
export async function rejectClaim(claimId, reason) {
    logger.info('reject_claim', { claimId, reason });
    return updateClaimStatus(claimId, 'rejected', reason);
}
/**
 * Get warranty statistics
 */
export async function getWarrantyStats() {
    let total = 0;
    let active = 0;
    let expired = 0;
    let voided = 0;
    let totalClaims = 0;
    let pendingClaims = 0;
    let approvedClaims = 0;
    let rejectedClaims = 0;
    for (const warranty of warranties.values()) {
        total++;
        switch (warranty.status) {
            case 'active':
                active++;
                break;
            case 'expired':
                expired++;
                break;
            case 'void':
                voided++;
                break;
        }
        if (warranty.claims) {
            totalClaims += warranty.claims.length;
            for (const claim of warranty.claims) {
                switch (claim.status) {
                    case 'under_review':
                        pendingClaims++;
                        break;
                    case 'approved':
                        approvedClaims++;
                        break;
                    case 'rejected':
                        rejectedClaims++;
                        break;
                }
            }
        }
    }
    return {
        total,
        active,
        expired,
        voided,
        totalClaims,
        pendingClaims,
        approvedClaims,
        rejectedClaims,
        claimApprovalRate: totalClaims > 0 ? approvedClaims / totalClaims : 0,
    };
}
/**
 * Get coverage details
 */
export function getCoverageDetails() {
    return Object.entries(COVERAGE_TYPES).map(([type, details]) => ({
        type: type,
        ...details,
    }));
}
/**
 * Extend warranty
 */
export async function extendWarranty(warrantyId, additionalMonths) {
    const warranty = warranties.get(warrantyId);
    if (!warranty) {
        logger.warn('warranty_not_found', { warrantyId });
        return null;
    }
    const currentEndDate = new Date(warranty.coverage.endDate);
    currentEndDate.setMonth(currentEndDate.getMonth() + additionalMonths);
    warranty.coverage.endDate = currentEndDate.toISOString();
    warranty.status = 'active';
    warranty.updatedAt = new Date().toISOString();
    logger.info('warranty_extended', { warrantyId, newEndDate: warranty.coverage.endDate });
    return warranty;
}
/**
 * Void warranty
 */
export async function voidWarranty(warrantyId, reason) {
    const warranty = warranties.get(warrantyId);
    if (!warranty) {
        logger.warn('warranty_not_found', { warrantyId });
        return null;
    }
    warranty.status = 'void';
    warranty.metadata = { ...warranty.metadata, voidReason: reason, voided: true };
    warranty.updatedAt = new Date().toISOString();
    logger.info('warranty_voided', { warrantyId, reason });
    return warranty;
}
//# sourceMappingURL=warrantyService.js.map
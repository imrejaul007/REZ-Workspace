import { Deal, DealValidationError, DealCalculationResult, AppliedDeal } from '@/types/deals';

/**
 * Validates if a deal can be applied based on various criteria
 */
export const validateDeal = (
  deal: Deal,
  billAmount: number,
  appliedDeals: AppliedDeal[] = [],
  userType?: 'first-time' | 'loyalty' | 'regular'
): DealValidationError[] => {
  const errors: DealValidationError[] = [];

  // Check if deal is active
  if (!deal.isActive) {
    errors.push({
      dealId: deal.id,
      errorType: 'EXPIRED',
      message: 'This deal is no longer active'
    });
  }

  // Check expiry date
  if (new Date() > deal.validUntil) {
    errors.push({
      dealId: deal.id,
      errorType: 'EXPIRED',
      message: 'This deal has expired'
    });
  }

  // Check minimum bill amount
  if (billAmount < deal.minimumBill) {
    errors.push({
      dealId: deal.id,
      errorType: 'MINIMUM_BILL',
      message: `Minimum bill amount of ₹${deal.minimumBill.toLocaleString()} required`
    });
  }

  // Check usage limit
  if (deal.usageLimit && deal.usageCount && deal.usageCount >= deal.usageLimit) {
    errors.push({
      dealId: deal.id,
      errorType: 'USAGE_LIMIT',
      message: 'Usage limit for this deal has been reached'
    });
  }

  // Check if deal is already applied
  const isAlreadyApplied = appliedDeals.some(applied => applied.dealId === deal.id);
  if (isAlreadyApplied) {
    errors.push({
      dealId: deal.id,
      errorType: 'USAGE_LIMIT',
      message: 'This deal is already applied'
    });
  }

  // Check user type restrictions
  if (deal.category === 'first-time' && userType !== 'first-time') {
    errors.push({
      dealId: deal.id,
      errorType: 'PRODUCT_RESTRICTION',
      message: 'This deal is valid for first-time customers only'
    });
  }

  if (deal.category === 'loyalty' && userType !== 'loyalty') {
    errors.push({
      dealId: deal.id,
      errorType: 'PRODUCT_RESTRICTION',
      message: 'This deal is valid for loyalty members only'
    });
  }

  return errors;
};

/**
 * DEPRECATED: cashback calculation must happen server-side. This returns 0 until removed.
 *
 * Previously calculated the discount amount for a given deal on the frontend.
 * All financial calculations must now be computed by the backend and returned via the API.
 * Callers should use the discountAmount/finalAmount already present in the API response
 * rather than computing them client-side.
 */
export const calculateDealDiscount = (
  deal: Deal,
  billAmount: number,
  appliedDeals: AppliedDeal[] = []
): DealCalculationResult => {
  return {
    isValid: false,
    discountAmount: 0,
    finalAmount: billAmount,
    errors: [],
    warnings: ['Discount calculation must be performed server-side.'],
  };
};

/**
 * DEPRECATED: cashback calculation must happen server-side. This returns 0 until removed.
 *
 * Previously calculated the total discount when multiple deals were applied on the frontend.
 * All financial calculations must now be computed by the backend and returned via the API.
 */
export const calculateTotalDiscount = (
  deals: Deal[],
  billAmount: number,
  allowStacking: boolean = false
): DealCalculationResult => {
  return {
    isValid: false,
    discountAmount: 0,
    finalAmount: billAmount,
    errors: [],
    warnings: ['Discount calculation must be performed server-side.'],
  };
};

/**
 * Formats discount amount for display
 */
export const formatDiscountAmount = (amount: number): string => {
  return `₹${amount.toLocaleString()}`;
};

/**
 * Gets user-friendly error message
 */
export const getErrorMessage = (error: DealValidationError): string => {
  return error.message;
};

/**
 * Checks if a deal is eligible for a user
 */
export const isDealEligible = (
  deal: Deal,
  billAmount: number,
  userType?: 'first-time' | 'loyalty' | 'regular'
): boolean => {
  const errors = validateDeal(deal, billAmount, [], userType);
  return errors.length === 0;
};

/**
 * DEPRECATED: cashback calculation must happen server-side. This returns null until removed.
 *
 * Previously selected the best deal by computing discount amounts on the frontend.
 * Best-deal logic must now be resolved by the backend and returned via the API.
 */
export const getBestDeal = (
  deals: Deal[],
  billAmount: number,
  userType?: 'first-time' | 'loyalty' | 'regular'
): Deal | null => {
  return null;
};
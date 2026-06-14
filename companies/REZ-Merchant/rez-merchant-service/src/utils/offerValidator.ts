import { logger } from '../config/logger';

/** OfferType — mirrored from rez-shared/src/types/offer.types (inlined to avoid cross-repo relative path) */
export type OfferType = 'cashback' | 'discount' | 'voucher' | 'combo' | 'special' | 'walk_in';

/**
 * Offer Schema Validation Utility
 *
 * Provides runtime validation for offer documents to enforce schema contracts
 * even though the MongoDB models use `strict: false` (loose schemas).
 *
 * This prevents unchecked field proliferation and ensures data consistency
 * across the platform.
 */

/**
 * Offer validation schema
 * Field names match the rez-backend Offer model canonical shape:
 *   type, cashbackPercentage, restrictions.minOrderValue,
 *   restrictions.usageLimit, restrictions.usageLimitPerUser
 */
export interface ValidOfferFields {
  // Required fields
  title: string;
  description?: string;
  type: OfferType; // B03 fix: was offerType
  store?: string; // Store ObjectId
  merchant: string; // Merchant ObjectId

  // Discount fields
  maxDiscountAmount?: number;
  // B05 fix: minOrderValue lives under restrictions

  // Cashback fields
  cashbackType?: 'coins' | 'wallet';
  cashbackPercentage?: number; // B04 fix: was cashbackValue

  // Validity
  startDate: Date;
  endDate: Date;

  // Rules — B06 fix: usageLimit / usageLimitPerUser live under restrictions
  restrictions?: {
    minOrderValue?: number; // B05 fix: was flat minOrderAmount
    usageLimit?: number; // B06 fix: was maxRedemptions
    usageLimitPerUser?: number; // B06 fix: was maxRedemptionsPerUser
    ageRestriction?: {
      minAge?: number;
      maxAge?: number;
    };
  };
  applicableCategories?: string[]; // Category ObjectIds
  applicableProducts?: string[]; // Product ObjectIds
  excludeProducts?: string[];
  userSegments?: string[]; // e.g., ['new_users', 'vip', 'students']
  paymentMethods?: string[]; // e.g., ['wallet', 'card', 'upi']

  // Status
  isActive: boolean;
  isPaused?: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

/**
 * Validation rules for each offer type
 * Field names match the rez-backend Offer model canonical shape:
 *   type, cashbackPercentage, restrictions.minOrderValue,
 *   restrictions.usageLimit, restrictions.usageLimitPerUser
 */
const OFFER_TYPE_RULES: Record<string, {
  requiredFields: (keyof ValidOfferFields)[];
  allowedFields: (keyof ValidOfferFields)[];
}> = {
  'discount': {
    requiredFields: ['title', 'startDate', 'endDate'],
    allowedFields: ['title', 'description', 'maxDiscountAmount', 'restrictions', 'startDate', 'endDate', 'applicableCategories', 'applicableProducts', 'excludeProducts', 'isActive', 'createdAt', 'updatedAt'],
  },
  'cashback': {
    requiredFields: ['title', 'cashbackType', 'cashbackPercentage', 'startDate', 'endDate'],
    allowedFields: ['title', 'description', 'cashbackType', 'cashbackPercentage', 'restrictions', 'startDate', 'endDate', 'applicableCategories', 'isActive', 'createdAt', 'updatedAt'],
  },
  'voucher': {
    requiredFields: ['title', 'startDate', 'endDate'],
    allowedFields: ['title', 'description', 'restrictions', 'startDate', 'endDate', 'isActive', 'createdAt', 'updatedAt'],
  },
  'combo': {
    requiredFields: ['title', 'startDate', 'endDate'],
    allowedFields: ['title', 'description', 'applicableProducts', 'applicableCategories', 'restrictions', 'startDate', 'endDate', 'isActive', 'createdAt', 'updatedAt'],
  },
  'special': {
    requiredFields: ['title', 'startDate', 'endDate'],
    allowedFields: ['title', 'description', 'startDate', 'endDate', 'userSegments', 'applicableCategories', 'applicableProducts', 'restrictions', 'isActive', 'createdAt', 'updatedAt'],
  },
  'walk_in': {
    requiredFields: ['title', 'startDate', 'endDate'],
    allowedFields: ['title', 'description', 'startDate', 'endDate', 'restrictions', 'userSegments', 'paymentMethods', 'isActive', 'createdAt', 'updatedAt'],
  },
};

/**
 * Validate an offer object
 *
 * @param offer The offer to validate
 * @returns { isValid: boolean, errors: string[] }
 * SECURITY FIX (MA-BACK-AUDIT-007): Replaced `unknown` with proper interfaces.
 */

/** Input type for offer validation (flexible to handle JSON.parse output, etc.) */
export type OfferInput = Partial<ValidOfferFields> & Record<string, unknown>;

export function validateOffer(offer: OfferInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!offer) {
    return { isValid: false, errors: ['Offer object is required'] };
  }

  // B03 fix: field is now 'type' (backend canonical), previously 'offerType'
  // MongoDB is schemaless — accept any type string and warn instead of reject.
  const knownOfferTypes = ['cashback', 'discount', 'voucher', 'combo', 'special', 'walk_in'] as const;
  if (!offer.type) {
    errors.push('type is required');
  } else if (!knownOfferTypes.includes(offer.type as typeof knownOfferTypes[number])) {
    logger.warn(`[OFFER_VALIDATOR] Unknown type "${offer.type}" — expected one of: ${knownOfferTypes.join(', ')}. Treating as valid since MongoDB is schemaless.`);
  }

  // Validate against type-specific rules
  const rules = OFFER_TYPE_RULES[offer.type as OfferType];
  if (rules) {
    // Check required fields
    for (const field of rules.requiredFields) {
      if (offer[field] === undefined || offer[field] === null || offer[field] === '') {
        errors.push(`Required field missing: ${String(field)}`);
      }
    }

    // Check for unexpected fields
    const allowedFieldSet = new Set([...rules.allowedFields, 'merchant', 'store', 'type', 'offerType', 'isPaused', 'createdBy']);
    for (const key of Object.keys(offer)) {
      if (!allowedFieldSet.has(key)) {
        // Note: We allow unknown fields but log them for monitoring
        logger.warn(`[OFFER_VALIDATOR] Unknown field in ${offer.type} offer: ${key}`);
      }
    }
  }

  // Date validation
  if (offer.startDate && offer.endDate) {
    const start = new Date(offer.startDate as string);
    const end = new Date(offer.endDate as string);
    if (start >= end) {
      errors.push('startDate must be before endDate');
    }
  }

  // Numeric field validation
  if (offer.maxDiscountAmount !== undefined && (typeof offer.maxDiscountAmount !== 'number' || offer.maxDiscountAmount < 0)) {
    errors.push('maxDiscountAmount must be a non-negative number');
  }
  // B04 fix: field is now 'cashbackPercentage' (backend canonical), previously 'cashbackValue'
  if (offer.cashbackPercentage !== undefined && (typeof offer.cashbackPercentage !== 'number' || offer.cashbackPercentage < 0)) {
    errors.push('cashbackPercentage must be a non-negative number');
  }
  // B05 fix: minOrderValue is nested under restrictions, previously flat 'minOrderAmount'
  const restrictions = offer.restrictions as Record<string, unknown> | undefined;
  const minOrderVal = restrictions?.minOrderValue;
  if (minOrderVal !== undefined && (typeof minOrderVal !== 'number' || (minOrderVal as number) < 0)) {
    errors.push('restrictions.minOrderValue must be a non-negative number');
  }
  // B06 fix: usageLimit and usageLimitPerUser are nested under restrictions
  const usageLimit = restrictions?.usageLimit;
  if (usageLimit !== undefined && (typeof usageLimit !== 'number' || (usageLimit as number) < 1)) {
    errors.push('restrictions.usageLimit must be a positive number');
  }
  const usageLimitPerUser = restrictions?.usageLimitPerUser;
  if (usageLimitPerUser !== undefined && (typeof usageLimitPerUser !== 'number' || (usageLimitPerUser as number) < 1)) {
    errors.push('restrictions.usageLimitPerUser must be a positive number');
  }
  // R24 fix: restrictions.ageRestriction validation
  const ageRestriction = restrictions?.ageRestriction;
  if (ageRestriction !== undefined && typeof ageRestriction === 'object' && ageRestriction !== null) {
    const ageObj = ageRestriction as Record<string, unknown>;
    if (ageObj.minAge !== undefined && (typeof ageObj.minAge !== 'number' || (ageObj.minAge as number) < 0)) {
      errors.push('restrictions.ageRestriction.minAge must be a non-negative number');
    }
    if (ageObj.maxAge !== undefined && (typeof ageObj.maxAge !== 'number' || (ageObj.maxAge as number) < 0)) {
      errors.push('restrictions.ageRestriction.maxAge must be a non-negative number');
    }
  }

  // Boolean validation
  if (offer.isActive !== undefined && typeof offer.isActive !== 'boolean') {
    errors.push('isActive must be a boolean');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize an offer object to remove unexpected fields
 *
 * @param offer The offer to sanitize
 * @returns Sanitized offer with only allowed fields
 */
export function sanitizeOffer(offer: OfferInput): Partial<ValidOfferFields> {
  if (!offer || !offer.type) {
    return {};
  }

  const rules = OFFER_TYPE_RULES[offer.type as OfferType];
  if (!rules) {
    return offer as Partial<ValidOfferFields>; // Unknown type, return as-is
  }

  const sanitized: Partial<ValidOfferFields> & Record<string, unknown> = {};
  const allowedFields = new Set([...rules.allowedFields, 'merchant', 'store', 'type', 'offerType', 'isPaused', 'createdBy']);

  for (const field of allowedFields) {
    if (field in offer) {
      sanitized[field] = offer[field as keyof OfferInput];
    }
  }

  return sanitized;
}

/**
 * Get allowed fields for a given offer type
 */
export function getAllowedFieldsForType(type: OfferType): (keyof ValidOfferFields)[] {
  const rules = OFFER_TYPE_RULES[type];
  return rules ? rules.allowedFields : [];
}

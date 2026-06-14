import { Request, Response, NextFunction } from 'express';
import { Supplier } from '../models/Supplier';
import {
  validateGstNumber,
  validatePan,
  validatePhone,
  validateEmail,
  validateCreditLimit,
  checkCreditAvailability,
} from '../services/supplierService';
import { errorResponse } from '../utils/response';

/**
 * Middleware to validate GST number format
 * Runs before route handler to validate req.body.gstNumber
 */
export function validateGstMiddleware(req: Request, res: Response, next: NextFunction): void {
  const gstNumber = req.body?.gstNumber;

  // GST is optional, but if provided must be valid
  if (gstNumber !== undefined && gstNumber !== null && gstNumber !== '') {
    const result = validateGstNumber(gstNumber);
    if (!result.valid) {
      errorResponse(res, { message: result.error || 'Invalid GST number', code: 'VAL_GST_001' });
      return;
    }
    // Normalize to uppercase
    req.body.gstNumber = gstNumber.trim().toUpperCase();
  }

  next();
}

/**
 * Middleware to validate PAN number format
 * Runs before route handler to validate req.body.pan
 */
export function validatePanMiddleware(req: Request, res: Response, next: NextFunction): void {
  const pan = req.body?.pan;

  // PAN is optional, but if provided must be valid
  if (pan !== undefined && pan !== null && pan !== '') {
    const result = validatePan(pan);
    if (!result.valid) {
      errorResponse(res, { message: result.error || 'Invalid PAN number', code: 'VAL_PAN_001' });
      return;
    }
    // Normalize to uppercase
    req.body.pan = pan.trim().toUpperCase();
  }

  next();
}

/**
 * Middleware to validate phone number format
 * Runs before route handler to validate req.body.phone
 */
export function validatePhoneMiddleware(req: Request, res: Response, next: NextFunction): void {
  const phone = req.body?.phone;

  // Phone is optional, but if provided must be valid
  if (phone !== undefined && phone !== null && phone !== '') {
    const result = validatePhone(phone);
    if (!result.valid) {
      errorResponse(res, { message: result.error || 'Invalid phone number', code: 'VAL_PHONE_001' });
      return;
    }
    // Normalize
    req.body.phone = phone.trim();
  }

  next();
}

/**
 * Middleware to validate email format
 * Runs before route handler to validate req.body.email
 */
export function validateEmailMiddleware(req: Request, res: Response, next: NextFunction): void {
  const email = req.body?.email;

  // Email is optional, but if provided must be valid
  if (email !== undefined && email !== null && email !== '') {
    const result = validateEmail(email);
    if (!result.valid) {
      errorResponse(res, { message: result.error || 'Invalid email', code: 'VAL_EMAIL_001' });
      return;
    }
    // Normalize to lowercase
    req.body.email = email.trim().toLowerCase();
  }

  next();
}

/**
 * Middleware to validate credit limit
 * Runs before route handler to validate req.body.creditLimit
 */
export function validateCreditLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const creditLimit = req.body?.creditLimit;

  // Credit limit is optional, but if provided must be valid
  if (creditLimit !== undefined && creditLimit !== null) {
    const result = validateCreditLimit(creditLimit);
    if (!result.valid) {
      errorResponse(res, { message: result.error || 'Invalid credit limit', code: 'VAL_CREDIT_001' });
      return;
    }
  }

  next();
}

/**
 * Middleware to check credit availability before PO creation
 * Validates that the supplier has sufficient credit for the requested amount
 * Expects req.params.id as supplierId and req.body.amount or req.body.total as the PO amount
 */
export async function validateCreditAvailabilityMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const supplierId = req.params.id;

    // Amount can come from various sources in PO creation
    const amount = req.body?.amount ?? req.body?.total ?? req.body?.poAmount ?? req.body?.grandTotal;

    // If no amount specified, skip validation (might be a draft PO)
    if (amount === undefined || amount === null) {
      next();
      return;
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      errorResponse(res, { message: 'Invalid amount for credit check', code: 'VAL_AMOUNT_001' });
      return;
    }

    // Verify supplier exists
    const supplier = await Supplier.findById(supplierId).lean();
    if (!supplier) {
      errorResponse(res, { message: 'Supplier not found', code: 'RES_SUPPLIER_001' }, undefined, 'RES_001');
      return;
    }

    // Check if supplier is approved and active
    if (supplier.status !== 'approved') {
      errorResponse(res, {
        message: `Cannot create PO: supplier status is '${supplier.status}'. Must be 'approved'.`,
        code: 'VAL_SUPPLIER_STATUS_001',
      });
      return;
    }

    if (!supplier.isActive) {
      errorResponse(res, {
        message: 'Cannot create PO: supplier is inactive',
        code: 'VAL_SUPPLIER_ACTIVE_001',
      });
      return;
    }

    // Check credit availability
    const creditCheck = await checkCreditAvailability(supplierId, numericAmount);

    if (!creditCheck.sufficientForAmount) {
      errorResponse(res, {
        message: `Insufficient credit. Requested: ${numericAmount}, Available: ${creditCheck.creditAvailable}, Shortfall: ${creditCheck.shortfall}`,
        code: 'VAL_CREDIT_AVAIL_001',
      });
      return;
    }

    // Attach credit info to request for use in route handler
    (req as unknown as Record<string, unknown>).creditCheck = creditCheck;

    next();
  } catch (err: unknown) {
    const requestId = (req as unknown as { res?: { locals?: { requestId?: string } }).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err instanceof Error ? err.message : 'Unknown error';
    errorResponse(res, { message: msg, code: 'SRV_001' });
  }
}

/**
 * Middleware to validate supplier status transitions
 * Ensures suppliers can only transition between valid statuses
 */
export function validateSupplierStatusMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const currentStatus = req.body?.currentStatus;
  const newStatus = req.body?.status || req.body?.newStatus;

  // If no status change, skip
  if (!newStatus || newStatus === currentStatus) {
    next();
    return;
  }

  // Valid status transitions
  const validTransitions: Record<string, string[]> = {
    pending: ['approved', 'rejected'],
    approved: ['blocked'],
    rejected: ['pending', 'blocked'],
    blocked: ['approved', 'pending'],
  };

  const allowedTransitions = validTransitions[currentStatus] || [];

  if (!allowedTransitions.includes(newStatus)) {
    errorResponse(res, {
      message: `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed: ${allowedTransitions.join(', ') || 'none'}`,
      code: 'VAL_STATUS_TRANS_001',
    });
    return;
  }

  next();
}

/**
 * Combined validation middleware for supplier creation
 * Validates all fields in one pass
 */
export function validateSupplierCreate(req: Request, res: Response, next: NextFunction): void {
  const body = req.body;

  // Validate required fields
  if (!body.name || body.name.trim() === '') {
    errorResponse(res, { message: 'Supplier name is required', code: 'VAL_NAME_001' });
    return;
  }

  // Validate GST if provided
  if (body.gstNumber) {
    const gstResult = validateGstNumber(body.gstNumber);
    if (!gstResult.valid) {
      errorResponse(res, { message: gstResult.error || 'Invalid GST', code: 'VAL_GST_001' });
      return;
    }
    body.gstNumber = body.gstNumber.trim().toUpperCase();
  }

  // Validate PAN if provided
  if (body.pan) {
    const panResult = validatePan(body.pan);
    if (!panResult.valid) {
      errorResponse(res, { message: panResult.error || 'Invalid PAN', code: 'VAL_PAN_001' });
      return;
    }
    body.pan = body.pan.trim().toUpperCase();
  }

  // Validate phone if provided
  if (body.phone) {
    const phoneResult = validatePhone(body.phone);
    if (!phoneResult.valid) {
      errorResponse(res, { message: phoneResult.error || 'Invalid phone', code: 'VAL_PHONE_001' });
      return;
    }
  }

  // Validate email if provided
  if (body.email) {
    const emailResult = validateEmail(body.email);
    if (!emailResult.valid) {
      errorResponse(res, { message: emailResult.error || 'Invalid email', code: 'VAL_EMAIL_001' });
      return;
    }
    body.email = body.email.trim().toLowerCase();
  }

  // Validate credit limit if provided
  if (body.creditLimit !== undefined && body.creditLimit !== null) {
    const creditResult = validateCreditLimit(body.creditLimit);
    if (!creditResult.valid) {
      errorResponse(res, { message: creditResult.error || 'Invalid credit limit', code: 'VAL_CREDIT_001' });
      return;
    }
  }

  // Validate specificDayOfMonth if dueDatePreference is specific_day
  if (body.dueDatePreference === 'specific_day') {
    const day = body.specificDayOfMonth;
    if (day === undefined || day === null || day < 1 || day > 28) {
      errorResponse(res, {
        message: 'specificDayOfMonth must be between 1 and 28 when dueDatePreference is specific_day',
        code: 'VAL_DUEDAY_001',
      });
      return;
    }
  }

  // Validate IFSC code if provided
  if (body.ifscCode) {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(body.ifscCode.trim().toUpperCase())) {
      errorResponse(res, {
        message: 'Invalid IFSC code format. Expected format: SBIN0123456',
        code: 'VAL_IFSC_001',
      });
      return;
    }
    body.ifscCode = body.ifscCode.trim().toUpperCase();
  }

  next();
}

/**
 * Middleware to validate supplier belongs to merchant
 * Ensures the supplier being accessed belongs to the authenticated merchant
 */
export async function validateSupplierOwnership(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const supplierId = req.params.id;

    if (!supplierId) {
      next();
      return;
    }

    const supplier = await Supplier.findOne({
      _id: supplierId,
      merchantId: req.merchantId,
      isDeleted: { $ne: true },
    }).lean();

    if (!supplier) {
      errorResponse(res, { message: 'Supplier not found', code: 'RES_SUPPLIER_001' }, undefined, 'RES_001');
      return;
    }

    // Attach supplier to request for use in route handler
    (req as unknown as Record<string, unknown>).supplier = supplier;

    next();
  } catch (err: unknown) {
    const requestId = (req as unknown as { res?: { locals?: { requestId?: string } }).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err instanceof Error ? err.message : 'Unknown error';
    errorResponse(res, { message: msg, code: 'SRV_001' });
  }
}

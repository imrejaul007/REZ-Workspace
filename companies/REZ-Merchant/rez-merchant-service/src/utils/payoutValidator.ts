/**
 * Payout validation utilities.
 *
 * BE-MER-007 FIX: Validates payout amounts and constraints.
 * SECURITY FIX (MA-BACK-AUDIT-007): Replaced `unknown` types with proper interfaces.
 */

export interface PayoutValidation {
  isValid: boolean;
  error?: string;
}

/** Type for amount input (can be string, number, or unknown from JSON) */
export type AmountInput = string | number | unknown;

/**
 * Validates payout amount.
 *
 * BE-MER-007 FIX: Validates amount is positive, within bounds, and has valid precision.
 *
 * @param amount Payout amount in rupees
 * @param maxAmount Maximum allowed payout (default: 10 crores)
 * @returns Validation result
 */
export function validatePayoutAmount(amount: AmountInput, maxAmount: number = 100000000): PayoutValidation {
  // Convert to number
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Must be a valid number
  if (typeof amountNum !== 'number' || !Number.isFinite(amountNum)) {
    return { isValid: false, error: 'amount must be a valid number' };
  }

  // Must be positive
  if (amountNum <= 0) {
    return { isValid: false, error: 'amount must be greater than 0' };
  }

  // Must not exceed max
  if (amountNum > maxAmount) {
    return { isValid: false, error: `amount cannot exceed ${maxAmount}` };
  }

  // Check decimal precision (max 2 decimal places for rupees)
  const decimalPlaces = (amountNum.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return { isValid: false, error: 'amount must have at most 2 decimal places' };
  }

  return { isValid: true };
}

/**
 * Validates bank details format.
 *
 * BE-MER-010 FIX: Validates IFSC code, account number, and account holder name.
 */
export interface BankDetails {
  accountNumber: string;
  accountHolderName: string;
  ifscCode: string;
  bankName?: string;
}

/** Type for bank details input */
export type BankDetailsInput = Partial<BankDetails> | unknown;

export interface BankDetailsValidation {
  isValid: boolean;
  errors?: string[];
}

export function validateBankDetails(bankDetails: BankDetailsInput): BankDetailsValidation {
  const errors: string[] = [];

  if (!bankDetails || typeof bankDetails !== 'object') {
    return { isValid: false, errors: ['bankDetails must be an object'] };
  }

  const details = bankDetails as Record<string, unknown>;

  // IFSC code: 11 alphanumeric characters
  const ifsc = String(details.ifscCode || '').trim().toUpperCase();
  if (!ifsc || !/^[A-Z0-9]{11}$/.test(ifsc)) {
    errors.push('IFSC code must be 11 alphanumeric characters (e.g., SBIN0001234)');
  }

  // Account number: 8-18 digits
  const accountNum = String(details.accountNumber || '').trim();
  if (!accountNum || !/^\d{8,18}$/.test(accountNum)) {
    errors.push('Account number must be 8-18 digits');
  }

  // Account holder name: alphabetic characters and spaces only
  const accountName = String(details.accountHolderName || '').trim();
  if (!accountName || !/^[a-zA-Z\s]+$/.test(accountName)) {
    errors.push('Account holder name must contain only alphabetic characters and spaces');
  }

  return errors.length === 0
    ? { isValid: true }
    : { isValid: false, errors };
}

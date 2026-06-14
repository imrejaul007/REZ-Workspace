import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Input validation middleware for profile service.
 * Sanitizes and validates all incoming data.
 */

// Sanitize string to prevent XSS using DOMPurify
function sanitizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  // Strip all HTML tags and attributes - no markup allowed in text fields
  const clean = DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  return clean.trim().slice(0, 500);
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone format (E.164 or digits)
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?\d{5,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Validate pincode (Indian 6-digit)
function isValidPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode);
}

// Validate ObjectId format
function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// ─── Profile Update Validation ─────────────────────────────────────────────────

export interface ProfileUpdateBody {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  email?: string;
  phone?: string;
}

export function validateProfileUpdate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const body = req.body as Partial<ProfileUpdateBody>;
  const errors: string[] = [];

  if (body.firstName !== undefined) {
    const sanitized = sanitizeString(body.firstName);
    if (sanitized !== undefined) {
      if (sanitized.length < 1 || sanitized.length > 50) {
        errors.push('firstName must be 1-50 characters');
      }
      req.body.firstName = sanitized;
    }
  }

  if (body.lastName !== undefined) {
    const sanitized = sanitizeString(body.lastName);
    if (sanitized !== undefined) {
      if (sanitized.length < 1 || sanitized.length > 50) {
        errors.push('lastName must be 1-50 characters');
      }
      req.body.lastName = sanitized;
    }
  }

  if (body.avatar !== undefined) {
    if (typeof body.avatar !== 'string' || !body.avatar.startsWith('http')) {
      errors.push('avatar must be a valid URL');
    }
  }

  if (body.bio !== undefined) {
    const sanitized = sanitizeString(body.bio);
    if (sanitized !== undefined) {
      if (sanitized.length > 250) {
        errors.push('bio must be at most 250 characters');
      }
      req.body.bio = sanitized;
    }
  }

  if (body.gender !== undefined) {
    if (!['male', 'female', 'other'].includes(body.gender)) {
      errors.push('gender must be male, female, or other');
    }
  }

  if (body.email !== undefined) {
    const sanitized = sanitizeString(body.email);
    if (sanitized && !isValidEmail(sanitized)) {
      errors.push('invalid email format');
    } else {
      req.body.email = sanitized;
    }
  }

  if (body.phone !== undefined) {
    const sanitized = sanitizeString(body.phone);
    if (sanitized && !isValidPhone(sanitized)) {
      errors.push('invalid phone format');
    } else {
      req.body.phone = sanitized;
    }
  }

  if (errors.length > 0) {
    logger.warn('[Validation] Profile update validation failed', { errors, userId: (req as { userId?: string }).userId });
    res.status(400).json({ success: false, errors });
    return;
  }

  next();
}

// ─── Address Validation ────────────────────────────────────────────────────────

export interface AddressBody {
  label?: 'home' | 'office' | 'other';
  name?: string;
  phone?: string;
  address: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  coordinates?: { lat: number; lng: number };
  isDefault?: boolean;
  instructions?: string;
}

export function validateAddress(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const body = req.body as Partial<AddressBody>;
  const errors: string[] = [];

  if (!body.address || typeof body.address !== 'string') {
    errors.push('address is required');
  } else {
    req.body.address = sanitizeString(body.address);
  }

  if (!body.city || typeof body.city !== 'string') {
    errors.push('city is required');
  } else {
    req.body.city = sanitizeString(body.city);
  }

  if (!body.state || typeof body.state !== 'string') {
    errors.push('state is required');
  } else {
    req.body.state = sanitizeString(body.state);
  }

  if (!body.pincode || !isValidPincode(body.pincode)) {
    errors.push('pincode must be 6 digits');
  }

  if (body.label !== undefined && !['home', 'office', 'other'].includes(body.label)) {
    errors.push('label must be home, office, or other');
  }

  if (body.phone !== undefined) {
    const sanitized = sanitizeString(body.phone);
    if (sanitized && !isValidPhone(sanitized)) {
      errors.push('invalid phone format');
    } else {
      req.body.phone = sanitized;
    }
  }

  if (body.name !== undefined) {
    req.body.name = sanitizeString(body.name);
  }

  if (body.landmark !== undefined) {
    req.body.landmark = sanitizeString(body.landmark);
  }

  if (body.instructions !== undefined) {
    const sanitized = sanitizeString(body.instructions);
    if (sanitized && sanitized.length > 250) {
      errors.push('instructions must be at most 250 characters');
    } else {
      req.body.instructions = sanitized;
    }
  }

  if (body.coordinates !== undefined) {
    if (
      typeof body.coordinates.lat !== 'number' ||
      typeof body.coordinates.lng !== 'number'
    ) {
      errors.push('coordinates must have valid lat and lng');
    } else if (
      body.coordinates.lat < -90 ||
      body.coordinates.lat > 90 ||
      body.coordinates.lng < -180 ||
      body.coordinates.lng > 180
    ) {
      errors.push('coordinates are out of valid range');
    }
  }

  if (errors.length > 0) {
    logger.warn('[Validation] Address validation failed', { errors, userId: (req as { userId?: string }).userId });
    res.status(400).json({ success: false, errors });
    return;
  }

  next();
}

// ─── Payment Method Validation ────────────────────────────────────────────────

export interface PaymentMethodBody {
  type: 'upi' | 'card' | 'netbanking' | 'wallet';
  isDefault?: boolean;
  upi?: { id: string };
  card?: { last4: string; brand: string; expiry: string };
}

export function validatePaymentMethod(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const body = req.body as Partial<PaymentMethodBody>;
  const errors: string[] = [];

  if (!body.type || !['upi', 'card', 'netbanking', 'wallet'].includes(body.type)) {
    errors.push('type must be upi, card, netbanking, or wallet');
  }

  if (body.type === 'upi') {
    if (!body.upi?.id || !/^[\w.-]+@[\w.-]+$/.test(body.upi.id)) {
      errors.push('valid upi.id is required for UPI payments');
    }
  }

  if (body.type === 'card') {
    if (!body.card?.last4 || !/^\d{4}$/.test(body.card.last4)) {
      errors.push('valid card.last4 (4 digits) is required');
    }
    if (!body.card?.brand || typeof body.card.brand !== 'string') {
      errors.push('card.brand is required');
    }
    if (!body.card?.expiry || !/^\d{2}\/\d{2}$/.test(body.card.expiry)) {
      errors.push('card.expiry must be MM/YY format');
    }
  }

  if (errors.length > 0) {
    logger.warn('[Validation] Payment method validation failed', { errors, userId: (req as { userId?: string }).userId });
    res.status(400).json({ success: false, errors });
    return;
  }

  next();
}

// ─── UserId Parameter Validation ─────────────────────────────────────────────

export function validateUserIdParam(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userId = String(req.params.userId);

  if (!userId || !isValidObjectId(userId)) {
    logger.warn('[Validation] Invalid userId parameter', { userId });
    res.status(400).json({ success: false, message: 'Invalid user ID format' });
    return;
  }

  next();
}

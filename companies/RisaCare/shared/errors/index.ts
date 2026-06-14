// RisaCare Shared Errors - Canonical Error Classes

export class RisaCareError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'RisaCareError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details
    };
  }
}

// ============================================
// RECORD ERRORS (4700)
// ============================================

export class RecordNotFoundError extends RisaCareError {
  constructor(recordId: string) {
    super('RECORD_NOT_FOUND', `Health record not found: ${recordId}`, 404, { recordId });
  }
}

export class RecordUploadError extends RisaCareError {
  constructor(reason: string, details?: Record<string, unknown>) {
    super('RECORD_UPLOAD_FAILED', `Failed to upload record: ${reason}`, 400, details);
  }
}

export class InvalidDocumentTypeError extends RisaCareError {
  constructor(type: string) {
    super('INVALID_DOCUMENT_TYPE', `Unsupported document type: ${type}`, 400, { type });
  }
}

export class FileTooLargeError extends RisaCareError {
  constructor(size: number, maxSize: number) {
    super('FILE_TOO_LARGE', `File size ${size} exceeds maximum allowed ${maxSize}`, 400, { size, maxSize });
  }
}

export class UnsupportedFormatError extends RisaCareError {
  constructor(format: string, allowedFormats: string[]) {
    super('UNSUPPORTED_FORMAT', `File format ${format} is not supported`, 400, { format, allowedFormats });
  }
}

export class OCRProcessingError extends RisaCareError {
  constructor(recordId: string, reason: string) {
    super('OCR_FAILED', `OCR processing failed for record ${recordId}: ${reason}`, 500, { recordId, reason });
  }
}

export class ExtractionFailedError extends RisaCareError {
  constructor(recordId: string, reason: string) {
    super('EXTRACTION_FAILED', `AI extraction failed for record ${recordId}: ${reason}`, 500, { recordId, reason });
  }
}

// ============================================
// PROFILE ERRORS (4704)
// ============================================

export class ProfileNotFoundError extends RisaCareError {
  constructor(profileId: string) {
    super('PROFILE_NOT_FOUND', `Health profile not found: ${profileId}`, 404, { profileId });
  }
}

export class UserProfileNotFoundError extends RisaCareError {
  constructor(userId: string) {
    super('USER_PROFILE_NOT_FOUND', `User profile not found: ${userId}`, 404, { userId });
  }
}

export class ProfileUpdateError extends RisaCareError {
  constructor(reason: string) {
    super('PROFILE_UPDATE_FAILED', `Failed to update profile: ${reason}`, 400, { reason });
  }
}

export class FamilyMemberNotFoundError extends RisaCareError {
  constructor(memberId: string) {
    super('FAMILY_MEMBER_NOT_FOUND', `Family member not found: ${memberId}`, 404, { memberId });
  }
}

export class MaxProfilesReachedError extends RisaCareError {
  constructor(limit: number) {
    super('MAX_PROFILES_REACHED', `Maximum number of profiles (${limit}) reached`, 400, { limit });
  }
}

// ============================================
// APPOINTMENT ERRORS (4705)
// ============================================

export class AppointmentNotFoundError extends RisaCareError {
  constructor(appointmentId: string) {
    super('APPOINTMENT_NOT_FOUND', `Appointment not found: ${appointmentId}`, 404, { appointmentId });
  }
}

export class BookingUnavailableError extends RisaCareError {
  constructor(reason: string) {
    super('BOOKING_UNAVAILABLE', `Booking unavailable: ${reason}`, 409, { reason });
  }
}

export class SlotNotAvailableError extends RisaCareError {
  constructor(doctorId: string, date: string, time: string) {
    super('SLOT_NOT_AVAILABLE', `Time slot not available for ${doctorId} on ${date} at ${time}`, 409, { doctorId, date, time });
  }
}

export class AppointmentCancellationError extends RisaCareError {
  constructor(appointmentId: string, reason: string) {
    super('APPOINTMENT_CANCELLATION_FAILED', `Cannot cancel appointment: ${reason}`, 400, { appointmentId, reason });
  }
}

// ============================================
// DOCTOR ERRORS (4705)
// ============================================

export class DoctorNotFoundError extends RisaCareError {
  constructor(doctorId: string) {
    super('DOCTOR_NOT_FOUND', `Doctor not found: ${doctorId}`, 404, { doctorId });
  }
}

export class DoctorUnavailableError extends RisaCareError {
  constructor(doctorId: string) {
    super('DOCTOR_UNAVAILABLE', `Doctor is not available: ${doctorId}`, 400, { doctorId });
  }
}

// ============================================
// MARKETPLACE ERRORS (4706)
// ============================================

export class LabNotFoundError extends RisaCareError {
  constructor(labId: string) {
    super('LAB_NOT_FOUND', `Lab not found: ${labId}`, 404, { labId });
  }
}

export class TestNotFoundError extends RisaCareError {
  constructor(testId: string) {
    super('TEST_NOT_FOUND', `Test not found: ${testId}`, 404, { testId });
  }
}

export class OrderCreationError extends RisaCareError {
  constructor(reason: string) {
    super('ORDER_CREATION_FAILED', `Failed to create order: ${reason}`, 400, { reason });
  }
}

export class MedicineNotFoundError extends RisaCareError {
  constructor(medicineId: string) {
    super('MEDICINE_NOT_FOUND', `Medicine not found: ${medicineId}`, 404, { medicineId });
  }
}

export class PrescriptionExpiredError extends RisaCareError {
  constructor(prescriptionId: string) {
    super('PRESCRIPTION_EXPIRED', `Prescription has expired: ${prescriptionId}`, 400, { prescriptionId });
  }
}

export class InsufficientStockError extends RisaCareError {
  constructor(medicineId: string, requested: number, available: number) {
    super('INSUFFICIENT_STOCK', `Insufficient stock for medicine ${medicineId}`, 400, { medicineId, requested, available });
  }
}

// ============================================
// PAYMENT ERRORS (4701)
// ============================================

export class PaymentFailedError extends RisaCareError {
  constructor(reason: string) {
    super('PAYMENT_FAILED', `Payment processing failed: ${reason}`, 402, { reason });
  }
}

export class InsufficientBalanceError extends RisaCareError {
  constructor(required: number, available: number) {
    super('INSUFFICIENT_BALANCE', `Insufficient wallet balance. Required: ${required}, Available: ${available}`, 402, { required, available });
  }
}

export class RefundFailedError extends RisaCareError {
  constructor(transactionId: string, reason: string) {
    super('REFUND_FAILED', `Refund failed for transaction ${transactionId}: ${reason}`, 500, { transactionId, reason });
  }
}

// ============================================
// AUTH & SECURITY ERRORS
// ============================================

export class UnauthorizedError extends RisaCareError {
  constructor(message: string = 'Unauthorized access') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends RisaCareError {
  constructor(message: string = 'Access forbidden') {
    super('FORBIDDEN', message, 403);
  }
}

export class ConsentRequiredError extends RisaCareError {
  constructor(consentType: string) {
    super('CONSENT_REQUIRED', `Required consent not given: ${consentType}`, 403, { consentType });
  }
}

export class BiometricVerificationRequiredError extends RisaCareError {
  constructor(action: string) {
    super('BIOMETRIC_REQUIRED', `Biometric verification required for: ${action}`, 403, { action });
  }
}

// ============================================
// RATE LIMIT ERRORS
// ============================================

export class RateLimitExceededError extends RisaCareError {
  constructor(retryAfter: number, limit: number) {
    super('RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.', 429, { retryAfter, limit });
  }
}

// ============================================
// SERVICE ERRORS
// ============================================

export class ServiceUnavailableError extends RisaCareError {
  constructor(service: string) {
    super('SERVICE_UNAVAILABLE', `Service temporarily unavailable: ${service}`, 503, { service }, true);
  }
}

export class ExternalServiceError extends RisaCareError {
  constructor(service: string, reason: string) {
    super('EXTERNAL_SERVICE_ERROR', `External service error (${service}): ${reason}`, 502, { service, reason });
  }
}

export class ValidationError extends RisaCareError {
  constructor(errors: Record<string, string[]>) {
    super('VALIDATION_ERROR', 'Request validation failed', 400, { errors });
  }
}

export class InvalidTokenError extends RisaCareError {
  constructor(reason: string = 'Invalid or expired token') {
    super('INVALID_TOKEN', reason, 401, { reason });
  }
}

// ============================================
// AI ERRORS
// ============================================

export class AIProcessingError extends RisaCareError {
  constructor(reason: string) {
    super('AI_PROCESSING_FAILED', `AI processing failed: ${reason}`, 500, { reason });
  }
}

export class AIInterpretationError extends RisaCareError {
  constructor(recordId: string, reason: string) {
    super('AI_INTERPRETATION_FAILED', `AI interpretation failed for record ${recordId}: ${reason}`, 500, { recordId, reason });
  }
}

export class SymptomAssessmentError extends RisaCareError {
  constructor(reason: string) {
    super('SYMPTOM_ASSESSMENT_FAILED', `Symptom assessment failed: ${reason}`, 500, { reason });
  }
}

export class EmergencyDetectedError extends RisaCareError {
  constructor(symptoms: string[]) {
    super('EMERGENCY_DETECTED', 'Emergency symptoms detected', 400, { symptoms, action: 'seek_immediate_help' }, false);
  }
}

// ============================================
// WELLNESS ERRORS
// ============================================

export class WellnessEntryNotFoundError extends RisaCareError {
  constructor(entryId: string) {
    super('WELLNESS_ENTRY_NOT_FOUND', `Wellness entry not found: ${entryId}`, 404, { entryId });
  }
}

export class ChallengeNotFoundError extends RisaCareError {
  constructor(challengeId: string) {
    super('CHALLENGE_NOT_FOUND', `Challenge not found: ${challengeId}`, 404, { challengeId });
  }
}

export class ChallengeAlreadyJoinedError extends RisaCareError {
  constructor(challengeId: string) {
    super('CHALLENGE_ALREADY_JOINED', `Challenge already joined: ${challengeId}`, 400, { challengeId });
  }
}

export class CycleDataNotFoundError extends RisaCareError {
  constructor(profileId: string) {
    super('CYCLE_DATA_NOT_FOUND', `Cycle data not found for profile: ${profileId}`, 404, { profileId });
  }
}

// ============================================
// CORPORATE ERRORS (4708)
// ============================================

export class CorporateNotFoundError extends RisaCareError {
  constructor(corporateId: string) {
    super('CORPORATE_NOT_FOUND', `Corporate not found: ${corporateId}`, 404, { corporateId });
  }
}

export class EmployeeNotFoundError extends RisaCareError {
  constructor(employeeId: string) {
    super('EMPLOYEE_NOT_FOUND', `Employee not found: ${employeeId}`, 404, { employeeId });
  }
}

export class SubscriptionExpiredError extends RisaCareError {
  constructor(corporateId: string) {
    super('SUBSCRIPTION_EXPIRED', `Subscription expired for corporate: ${corporateId}`, 403, { corporateId });
  }
}

export class EmployeeLimitExceededError extends RisaCareError {
  constructor(limit: number) {
    super('EMPLOYEE_LIMIT_EXCEEDED', `Employee limit exceeded: ${limit}`, 403, { limit });
  }
}

// ============================================
// ERROR HANDLER UTILITIES
// ============================================

export function isRisaCareError(error: unknown): error is RisaCareError {
  return error instanceof RisaCareError;
}

export function getErrorStatusCode(error: unknown): number {
  if (error instanceof RisaCareError) {
    return error.statusCode;
  }
  return 500;
}

export function formatErrorResponse(
  error: RisaCareError | Error,
  requestId: string
): {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId: string;
    timestamp: string;
  };
} {
  if (error instanceof RisaCareError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId,
        timestamp: new Date().toISOString()
      }
    };
  }

  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId,
      timestamp: new Date().toISOString()
    }
  };
}

// ============================================
// ERROR CODES REGISTRY
// ============================================

export const ERROR_CODES = {
  // General
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Records
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  RECORD_UPLOAD_FAILED: 'RECORD_UPLOAD_FAILED',
  INVALID_DOCUMENT_TYPE: 'INVALID_DOCUMENT_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  OCR_FAILED: 'OCR_FAILED',
  EXTRACTION_FAILED: 'EXTRACTION_FAILED',

  // Profile
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  USER_PROFILE_NOT_FOUND: 'USER_PROFILE_NOT_FOUND',
  PROFILE_UPDATE_FAILED: 'PROFILE_UPDATE_FAILED',
  FAMILY_MEMBER_NOT_FOUND: 'FAMILY_MEMBER_NOT_FOUND',
  MAX_PROFILES_REACHED: 'MAX_PROFILES_REACHED',

  // Appointments
  APPOINTMENT_NOT_FOUND: 'APPOINTMENT_NOT_FOUND',
  BOOKING_UNAVAILABLE: 'BOOKING_UNAVAILABLE',
  SLOT_NOT_AVAILABLE: 'SLOT_NOT_AVAILABLE',
  APPOINTMENT_CANCELLATION_FAILED: 'APPOINTMENT_CANCELLATION_FAILED',
  DOCTOR_NOT_FOUND: 'DOCTOR_NOT_FOUND',
  DOCTOR_UNAVAILABLE: 'DOCTOR_UNAVAILABLE',

  // Marketplace
  LAB_NOT_FOUND: 'LAB_NOT_FOUND',
  TEST_NOT_FOUND: 'TEST_NOT_FOUND',
  ORDER_CREATION_FAILED: 'ORDER_CREATION_FAILED',
  MEDICINE_NOT_FOUND: 'MEDICINE_NOT_FOUND',
  PRESCRIPTION_EXPIRED: 'PRESCRIPTION_EXPIRED',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',

  // Payment
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  REFUND_FAILED: 'REFUND_FAILED',

  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONSENT_REQUIRED: 'CONSENT_REQUIRED',
  BIOMETRIC_REQUIRED: 'BIOMETRIC_REQUIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // AI
  AI_PROCESSING_FAILED: 'AI_PROCESSING_FAILED',
  AI_INTERPRETATION_FAILED: 'AI_INTERPRETATION_FAILED',
  SYMPTOM_ASSESSMENT_FAILED: 'SYMPTOM_ASSESSMENT_FAILED',
  EMERGENCY_DETECTED: 'EMERGENCY_DETECTED',

  // Wellness
  WELLNESS_ENTRY_NOT_FOUND: 'WELLNESS_ENTRY_NOT_FOUND',
  CHALLENGE_NOT_FOUND: 'CHALLENGE_NOT_FOUND',
  CHALLENGE_ALREADY_JOINED: 'CHALLENGE_ALREADY_JOINED',
  CYCLE_DATA_NOT_FOUND: 'CYCLE_DATA_NOT_FOUND',

  // Corporate
  CORPORATE_NOT_FOUND: 'CORPORATE_NOT_FOUND',
  EMPLOYEE_NOT_FOUND: 'EMPLOYEE_NOT_FOUND',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
  EMPLOYEE_LIMIT_EXCEEDED: 'EMPLOYEE_LIMIT_EXCEEDED'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

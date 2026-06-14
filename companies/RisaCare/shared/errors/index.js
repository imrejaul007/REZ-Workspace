"use strict";
// RisaCare Shared Errors - Canonical Error Classes
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_CODES = exports.EmployeeLimitExceededError = exports.SubscriptionExpiredError = exports.EmployeeNotFoundError = exports.CorporateNotFoundError = exports.CycleDataNotFoundError = exports.ChallengeAlreadyJoinedError = exports.ChallengeNotFoundError = exports.WellnessEntryNotFoundError = exports.EmergencyDetectedError = exports.SymptomAssessmentError = exports.AIInterpretationError = exports.AIProcessingError = exports.InvalidTokenError = exports.ValidationError = exports.ExternalServiceError = exports.ServiceUnavailableError = exports.RateLimitExceededError = exports.BiometricVerificationRequiredError = exports.ConsentRequiredError = exports.ForbiddenError = exports.UnauthorizedError = exports.RefundFailedError = exports.InsufficientBalanceError = exports.PaymentFailedError = exports.InsufficientStockError = exports.PrescriptionExpiredError = exports.MedicineNotFoundError = exports.OrderCreationError = exports.TestNotFoundError = exports.LabNotFoundError = exports.DoctorUnavailableError = exports.DoctorNotFoundError = exports.AppointmentCancellationError = exports.SlotNotAvailableError = exports.BookingUnavailableError = exports.AppointmentNotFoundError = exports.MaxProfilesReachedError = exports.FamilyMemberNotFoundError = exports.ProfileUpdateError = exports.UserProfileNotFoundError = exports.ProfileNotFoundError = exports.ExtractionFailedError = exports.OCRProcessingError = exports.UnsupportedFormatError = exports.FileTooLargeError = exports.InvalidDocumentTypeError = exports.RecordUploadError = exports.RecordNotFoundError = exports.RisaCareError = void 0;
exports.isRisaCareError = isRisaCareError;
exports.getErrorStatusCode = getErrorStatusCode;
exports.formatErrorResponse = formatErrorResponse;
class RisaCareError extends Error {
    code;
    statusCode;
    details;
    isOperational;
    constructor(code, message, statusCode = 500, details, isOperational = true) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = isOperational;
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
exports.RisaCareError = RisaCareError;
// ============================================
// RECORD ERRORS (4700)
// ============================================
class RecordNotFoundError extends RisaCareError {
    constructor(recordId) {
        super('RECORD_NOT_FOUND', `Health record not found: ${recordId}`, 404, { recordId });
    }
}
exports.RecordNotFoundError = RecordNotFoundError;
class RecordUploadError extends RisaCareError {
    constructor(reason, details) {
        super('RECORD_UPLOAD_FAILED', `Failed to upload record: ${reason}`, 400, details);
    }
}
exports.RecordUploadError = RecordUploadError;
class InvalidDocumentTypeError extends RisaCareError {
    constructor(type) {
        super('INVALID_DOCUMENT_TYPE', `Unsupported document type: ${type}`, 400, { type });
    }
}
exports.InvalidDocumentTypeError = InvalidDocumentTypeError;
class FileTooLargeError extends RisaCareError {
    constructor(size, maxSize) {
        super('FILE_TOO_LARGE', `File size ${size} exceeds maximum allowed ${maxSize}`, 400, { size, maxSize });
    }
}
exports.FileTooLargeError = FileTooLargeError;
class UnsupportedFormatError extends RisaCareError {
    constructor(format, allowedFormats) {
        super('UNSUPPORTED_FORMAT', `File format ${format} is not supported`, 400, { format, allowedFormats });
    }
}
exports.UnsupportedFormatError = UnsupportedFormatError;
class OCRProcessingError extends RisaCareError {
    constructor(recordId, reason) {
        super('OCR_FAILED', `OCR processing failed for record ${recordId}: ${reason}`, 500, { recordId, reason });
    }
}
exports.OCRProcessingError = OCRProcessingError;
class ExtractionFailedError extends RisaCareError {
    constructor(recordId, reason) {
        super('EXTRACTION_FAILED', `AI extraction failed for record ${recordId}: ${reason}`, 500, { recordId, reason });
    }
}
exports.ExtractionFailedError = ExtractionFailedError;
// ============================================
// PROFILE ERRORS (4704)
// ============================================
class ProfileNotFoundError extends RisaCareError {
    constructor(profileId) {
        super('PROFILE_NOT_FOUND', `Health profile not found: ${profileId}`, 404, { profileId });
    }
}
exports.ProfileNotFoundError = ProfileNotFoundError;
class UserProfileNotFoundError extends RisaCareError {
    constructor(userId) {
        super('USER_PROFILE_NOT_FOUND', `User profile not found: ${userId}`, 404, { userId });
    }
}
exports.UserProfileNotFoundError = UserProfileNotFoundError;
class ProfileUpdateError extends RisaCareError {
    constructor(reason) {
        super('PROFILE_UPDATE_FAILED', `Failed to update profile: ${reason}`, 400, { reason });
    }
}
exports.ProfileUpdateError = ProfileUpdateError;
class FamilyMemberNotFoundError extends RisaCareError {
    constructor(memberId) {
        super('FAMILY_MEMBER_NOT_FOUND', `Family member not found: ${memberId}`, 404, { memberId });
    }
}
exports.FamilyMemberNotFoundError = FamilyMemberNotFoundError;
class MaxProfilesReachedError extends RisaCareError {
    constructor(limit) {
        super('MAX_PROFILES_REACHED', `Maximum number of profiles (${limit}) reached`, 400, { limit });
    }
}
exports.MaxProfilesReachedError = MaxProfilesReachedError;
// ============================================
// APPOINTMENT ERRORS (4705)
// ============================================
class AppointmentNotFoundError extends RisaCareError {
    constructor(appointmentId) {
        super('APPOINTMENT_NOT_FOUND', `Appointment not found: ${appointmentId}`, 404, { appointmentId });
    }
}
exports.AppointmentNotFoundError = AppointmentNotFoundError;
class BookingUnavailableError extends RisaCareError {
    constructor(reason) {
        super('BOOKING_UNAVAILABLE', `Booking unavailable: ${reason}`, 409, { reason });
    }
}
exports.BookingUnavailableError = BookingUnavailableError;
class SlotNotAvailableError extends RisaCareError {
    constructor(doctorId, date, time) {
        super('SLOT_NOT_AVAILABLE', `Time slot not available for ${doctorId} on ${date} at ${time}`, 409, { doctorId, date, time });
    }
}
exports.SlotNotAvailableError = SlotNotAvailableError;
class AppointmentCancellationError extends RisaCareError {
    constructor(appointmentId, reason) {
        super('APPOINTMENT_CANCELLATION_FAILED', `Cannot cancel appointment: ${reason}`, 400, { appointmentId, reason });
    }
}
exports.AppointmentCancellationError = AppointmentCancellationError;
// ============================================
// DOCTOR ERRORS (4705)
// ============================================
class DoctorNotFoundError extends RisaCareError {
    constructor(doctorId) {
        super('DOCTOR_NOT_FOUND', `Doctor not found: ${doctorId}`, 404, { doctorId });
    }
}
exports.DoctorNotFoundError = DoctorNotFoundError;
class DoctorUnavailableError extends RisaCareError {
    constructor(doctorId) {
        super('DOCTOR_UNAVAILABLE', `Doctor is not available: ${doctorId}`, 400, { doctorId });
    }
}
exports.DoctorUnavailableError = DoctorUnavailableError;
// ============================================
// MARKETPLACE ERRORS (4706)
// ============================================
class LabNotFoundError extends RisaCareError {
    constructor(labId) {
        super('LAB_NOT_FOUND', `Lab not found: ${labId}`, 404, { labId });
    }
}
exports.LabNotFoundError = LabNotFoundError;
class TestNotFoundError extends RisaCareError {
    constructor(testId) {
        super('TEST_NOT_FOUND', `Test not found: ${testId}`, 404, { testId });
    }
}
exports.TestNotFoundError = TestNotFoundError;
class OrderCreationError extends RisaCareError {
    constructor(reason) {
        super('ORDER_CREATION_FAILED', `Failed to create order: ${reason}`, 400, { reason });
    }
}
exports.OrderCreationError = OrderCreationError;
class MedicineNotFoundError extends RisaCareError {
    constructor(medicineId) {
        super('MEDICINE_NOT_FOUND', `Medicine not found: ${medicineId}`, 404, { medicineId });
    }
}
exports.MedicineNotFoundError = MedicineNotFoundError;
class PrescriptionExpiredError extends RisaCareError {
    constructor(prescriptionId) {
        super('PRESCRIPTION_EXPIRED', `Prescription has expired: ${prescriptionId}`, 400, { prescriptionId });
    }
}
exports.PrescriptionExpiredError = PrescriptionExpiredError;
class InsufficientStockError extends RisaCareError {
    constructor(medicineId, requested, available) {
        super('INSUFFICIENT_STOCK', `Insufficient stock for medicine ${medicineId}`, 400, { medicineId, requested, available });
    }
}
exports.InsufficientStockError = InsufficientStockError;
// ============================================
// PAYMENT ERRORS (4701)
// ============================================
class PaymentFailedError extends RisaCareError {
    constructor(reason) {
        super('PAYMENT_FAILED', `Payment processing failed: ${reason}`, 402, { reason });
    }
}
exports.PaymentFailedError = PaymentFailedError;
class InsufficientBalanceError extends RisaCareError {
    constructor(required, available) {
        super('INSUFFICIENT_BALANCE', `Insufficient wallet balance. Required: ${required}, Available: ${available}`, 402, { required, available });
    }
}
exports.InsufficientBalanceError = InsufficientBalanceError;
class RefundFailedError extends RisaCareError {
    constructor(transactionId, reason) {
        super('REFUND_FAILED', `Refund failed for transaction ${transactionId}: ${reason}`, 500, { transactionId, reason });
    }
}
exports.RefundFailedError = RefundFailedError;
// ============================================
// AUTH & SECURITY ERRORS
// ============================================
class UnauthorizedError extends RisaCareError {
    constructor(message = 'Unauthorized access') {
        super('UNAUTHORIZED', message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends RisaCareError {
    constructor(message = 'Access forbidden') {
        super('FORBIDDEN', message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
class ConsentRequiredError extends RisaCareError {
    constructor(consentType) {
        super('CONSENT_REQUIRED', `Required consent not given: ${consentType}`, 403, { consentType });
    }
}
exports.ConsentRequiredError = ConsentRequiredError;
class BiometricVerificationRequiredError extends RisaCareError {
    constructor(action) {
        super('BIOMETRIC_REQUIRED', `Biometric verification required for: ${action}`, 403, { action });
    }
}
exports.BiometricVerificationRequiredError = BiometricVerificationRequiredError;
// ============================================
// RATE LIMIT ERRORS
// ============================================
class RateLimitExceededError extends RisaCareError {
    constructor(retryAfter, limit) {
        super('RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.', 429, { retryAfter, limit });
    }
}
exports.RateLimitExceededError = RateLimitExceededError;
// ============================================
// SERVICE ERRORS
// ============================================
class ServiceUnavailableError extends RisaCareError {
    constructor(service) {
        super('SERVICE_UNAVAILABLE', `Service temporarily unavailable: ${service}`, 503, { service }, true);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
class ExternalServiceError extends RisaCareError {
    constructor(service, reason) {
        super('EXTERNAL_SERVICE_ERROR', `External service error (${service}): ${reason}`, 502, { service, reason });
    }
}
exports.ExternalServiceError = ExternalServiceError;
class ValidationError extends RisaCareError {
    constructor(errors) {
        super('VALIDATION_ERROR', 'Request validation failed', 400, { errors });
    }
}
exports.ValidationError = ValidationError;
class InvalidTokenError extends RisaCareError {
    constructor(reason = 'Invalid or expired token') {
        super('INVALID_TOKEN', reason, 401, { reason });
    }
}
exports.InvalidTokenError = InvalidTokenError;
// ============================================
// AI ERRORS
// ============================================
class AIProcessingError extends RisaCareError {
    constructor(reason) {
        super('AI_PROCESSING_FAILED', `AI processing failed: ${reason}`, 500, { reason });
    }
}
exports.AIProcessingError = AIProcessingError;
class AIInterpretationError extends RisaCareError {
    constructor(recordId, reason) {
        super('AI_INTERPRETATION_FAILED', `AI interpretation failed for record ${recordId}: ${reason}`, 500, { recordId, reason });
    }
}
exports.AIInterpretationError = AIInterpretationError;
class SymptomAssessmentError extends RisaCareError {
    constructor(reason) {
        super('SYMPTOM_ASSESSMENT_FAILED', `Symptom assessment failed: ${reason}`, 500, { reason });
    }
}
exports.SymptomAssessmentError = SymptomAssessmentError;
class EmergencyDetectedError extends RisaCareError {
    constructor(symptoms) {
        super('EMERGENCY_DETECTED', 'Emergency symptoms detected', 400, { symptoms, action: 'seek_immediate_help' }, false);
    }
}
exports.EmergencyDetectedError = EmergencyDetectedError;
// ============================================
// WELLNESS ERRORS
// ============================================
class WellnessEntryNotFoundError extends RisaCareError {
    constructor(entryId) {
        super('WELLNESS_ENTRY_NOT_FOUND', `Wellness entry not found: ${entryId}`, 404, { entryId });
    }
}
exports.WellnessEntryNotFoundError = WellnessEntryNotFoundError;
class ChallengeNotFoundError extends RisaCareError {
    constructor(challengeId) {
        super('CHALLENGE_NOT_FOUND', `Challenge not found: ${challengeId}`, 404, { challengeId });
    }
}
exports.ChallengeNotFoundError = ChallengeNotFoundError;
class ChallengeAlreadyJoinedError extends RisaCareError {
    constructor(challengeId) {
        super('CHALLENGE_ALREADY_JOINED', `Challenge already joined: ${challengeId}`, 400, { challengeId });
    }
}
exports.ChallengeAlreadyJoinedError = ChallengeAlreadyJoinedError;
class CycleDataNotFoundError extends RisaCareError {
    constructor(profileId) {
        super('CYCLE_DATA_NOT_FOUND', `Cycle data not found for profile: ${profileId}`, 404, { profileId });
    }
}
exports.CycleDataNotFoundError = CycleDataNotFoundError;
// ============================================
// CORPORATE ERRORS (4708)
// ============================================
class CorporateNotFoundError extends RisaCareError {
    constructor(corporateId) {
        super('CORPORATE_NOT_FOUND', `Corporate not found: ${corporateId}`, 404, { corporateId });
    }
}
exports.CorporateNotFoundError = CorporateNotFoundError;
class EmployeeNotFoundError extends RisaCareError {
    constructor(employeeId) {
        super('EMPLOYEE_NOT_FOUND', `Employee not found: ${employeeId}`, 404, { employeeId });
    }
}
exports.EmployeeNotFoundError = EmployeeNotFoundError;
class SubscriptionExpiredError extends RisaCareError {
    constructor(corporateId) {
        super('SUBSCRIPTION_EXPIRED', `Subscription expired for corporate: ${corporateId}`, 403, { corporateId });
    }
}
exports.SubscriptionExpiredError = SubscriptionExpiredError;
class EmployeeLimitExceededError extends RisaCareError {
    constructor(limit) {
        super('EMPLOYEE_LIMIT_EXCEEDED', `Employee limit exceeded: ${limit}`, 403, { limit });
    }
}
exports.EmployeeLimitExceededError = EmployeeLimitExceededError;
// ============================================
// ERROR HANDLER UTILITIES
// ============================================
function isRisaCareError(error) {
    return error instanceof RisaCareError;
}
function getErrorStatusCode(error) {
    if (error instanceof RisaCareError) {
        return error.statusCode;
    }
    return 500;
}
function formatErrorResponse(error, requestId) {
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
exports.ERROR_CODES = {
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
};
//# sourceMappingURL=index.js.map
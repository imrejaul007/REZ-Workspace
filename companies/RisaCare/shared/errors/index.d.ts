export declare class RisaCareError extends Error {
    code: string;
    statusCode: number;
    details?: Record<string, unknown> | undefined;
    isOperational: boolean;
    constructor(code: string, message: string, statusCode?: number, details?: Record<string, unknown> | undefined, isOperational?: boolean);
    toJSON(): {
        code: string;
        message: string;
        statusCode: number;
        details: Record<string, unknown> | undefined;
    };
}
export declare class RecordNotFoundError extends RisaCareError {
    constructor(recordId: string);
}
export declare class RecordUploadError extends RisaCareError {
    constructor(reason: string, details?: Record<string, unknown>);
}
export declare class InvalidDocumentTypeError extends RisaCareError {
    constructor(type: string);
}
export declare class FileTooLargeError extends RisaCareError {
    constructor(size: number, maxSize: number);
}
export declare class UnsupportedFormatError extends RisaCareError {
    constructor(format: string, allowedFormats: string[]);
}
export declare class OCRProcessingError extends RisaCareError {
    constructor(recordId: string, reason: string);
}
export declare class ExtractionFailedError extends RisaCareError {
    constructor(recordId: string, reason: string);
}
export declare class ProfileNotFoundError extends RisaCareError {
    constructor(profileId: string);
}
export declare class UserProfileNotFoundError extends RisaCareError {
    constructor(userId: string);
}
export declare class ProfileUpdateError extends RisaCareError {
    constructor(reason: string);
}
export declare class FamilyMemberNotFoundError extends RisaCareError {
    constructor(memberId: string);
}
export declare class MaxProfilesReachedError extends RisaCareError {
    constructor(limit: number);
}
export declare class AppointmentNotFoundError extends RisaCareError {
    constructor(appointmentId: string);
}
export declare class BookingUnavailableError extends RisaCareError {
    constructor(reason: string);
}
export declare class SlotNotAvailableError extends RisaCareError {
    constructor(doctorId: string, date: string, time: string);
}
export declare class AppointmentCancellationError extends RisaCareError {
    constructor(appointmentId: string, reason: string);
}
export declare class DoctorNotFoundError extends RisaCareError {
    constructor(doctorId: string);
}
export declare class DoctorUnavailableError extends RisaCareError {
    constructor(doctorId: string);
}
export declare class LabNotFoundError extends RisaCareError {
    constructor(labId: string);
}
export declare class TestNotFoundError extends RisaCareError {
    constructor(testId: string);
}
export declare class OrderCreationError extends RisaCareError {
    constructor(reason: string);
}
export declare class MedicineNotFoundError extends RisaCareError {
    constructor(medicineId: string);
}
export declare class PrescriptionExpiredError extends RisaCareError {
    constructor(prescriptionId: string);
}
export declare class InsufficientStockError extends RisaCareError {
    constructor(medicineId: string, requested: number, available: number);
}
export declare class PaymentFailedError extends RisaCareError {
    constructor(reason: string);
}
export declare class InsufficientBalanceError extends RisaCareError {
    constructor(required: number, available: number);
}
export declare class RefundFailedError extends RisaCareError {
    constructor(transactionId: string, reason: string);
}
export declare class UnauthorizedError extends RisaCareError {
    constructor(message?: string);
}
export declare class ForbiddenError extends RisaCareError {
    constructor(message?: string);
}
export declare class ConsentRequiredError extends RisaCareError {
    constructor(consentType: string);
}
export declare class BiometricVerificationRequiredError extends RisaCareError {
    constructor(action: string);
}
export declare class RateLimitExceededError extends RisaCareError {
    constructor(retryAfter: number, limit: number);
}
export declare class ServiceUnavailableError extends RisaCareError {
    constructor(service: string);
}
export declare class ExternalServiceError extends RisaCareError {
    constructor(service: string, reason: string);
}
export declare class ValidationError extends RisaCareError {
    constructor(errors: Record<string, string[]>);
}
export declare class InvalidTokenError extends RisaCareError {
    constructor(reason?: string);
}
export declare class AIProcessingError extends RisaCareError {
    constructor(reason: string);
}
export declare class AIInterpretationError extends RisaCareError {
    constructor(recordId: string, reason: string);
}
export declare class SymptomAssessmentError extends RisaCareError {
    constructor(reason: string);
}
export declare class EmergencyDetectedError extends RisaCareError {
    constructor(symptoms: string[]);
}
export declare class WellnessEntryNotFoundError extends RisaCareError {
    constructor(entryId: string);
}
export declare class ChallengeNotFoundError extends RisaCareError {
    constructor(challengeId: string);
}
export declare class ChallengeAlreadyJoinedError extends RisaCareError {
    constructor(challengeId: string);
}
export declare class CycleDataNotFoundError extends RisaCareError {
    constructor(profileId: string);
}
export declare class CorporateNotFoundError extends RisaCareError {
    constructor(corporateId: string);
}
export declare class EmployeeNotFoundError extends RisaCareError {
    constructor(employeeId: string);
}
export declare class SubscriptionExpiredError extends RisaCareError {
    constructor(corporateId: string);
}
export declare class EmployeeLimitExceededError extends RisaCareError {
    constructor(limit: number);
}
export declare function isRisaCareError(error: unknown): error is RisaCareError;
export declare function getErrorStatusCode(error: unknown): number;
export declare function formatErrorResponse(error: RisaCareError | Error, requestId: string): {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
        requestId: string;
        timestamp: string;
    };
};
export declare const ERROR_CODES: {
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly RECORD_NOT_FOUND: "RECORD_NOT_FOUND";
    readonly RECORD_UPLOAD_FAILED: "RECORD_UPLOAD_FAILED";
    readonly INVALID_DOCUMENT_TYPE: "INVALID_DOCUMENT_TYPE";
    readonly FILE_TOO_LARGE: "FILE_TOO_LARGE";
    readonly UNSUPPORTED_FORMAT: "UNSUPPORTED_FORMAT";
    readonly OCR_FAILED: "OCR_FAILED";
    readonly EXTRACTION_FAILED: "EXTRACTION_FAILED";
    readonly PROFILE_NOT_FOUND: "PROFILE_NOT_FOUND";
    readonly USER_PROFILE_NOT_FOUND: "USER_PROFILE_NOT_FOUND";
    readonly PROFILE_UPDATE_FAILED: "PROFILE_UPDATE_FAILED";
    readonly FAMILY_MEMBER_NOT_FOUND: "FAMILY_MEMBER_NOT_FOUND";
    readonly MAX_PROFILES_REACHED: "MAX_PROFILES_REACHED";
    readonly APPOINTMENT_NOT_FOUND: "APPOINTMENT_NOT_FOUND";
    readonly BOOKING_UNAVAILABLE: "BOOKING_UNAVAILABLE";
    readonly SLOT_NOT_AVAILABLE: "SLOT_NOT_AVAILABLE";
    readonly APPOINTMENT_CANCELLATION_FAILED: "APPOINTMENT_CANCELLATION_FAILED";
    readonly DOCTOR_NOT_FOUND: "DOCTOR_NOT_FOUND";
    readonly DOCTOR_UNAVAILABLE: "DOCTOR_UNAVAILABLE";
    readonly LAB_NOT_FOUND: "LAB_NOT_FOUND";
    readonly TEST_NOT_FOUND: "TEST_NOT_FOUND";
    readonly ORDER_CREATION_FAILED: "ORDER_CREATION_FAILED";
    readonly MEDICINE_NOT_FOUND: "MEDICINE_NOT_FOUND";
    readonly PRESCRIPTION_EXPIRED: "PRESCRIPTION_EXPIRED";
    readonly INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK";
    readonly PAYMENT_FAILED: "PAYMENT_FAILED";
    readonly INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE";
    readonly REFUND_FAILED: "REFUND_FAILED";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly CONSENT_REQUIRED: "CONSENT_REQUIRED";
    readonly BIOMETRIC_REQUIRED: "BIOMETRIC_REQUIRED";
    readonly INVALID_TOKEN: "INVALID_TOKEN";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly AI_PROCESSING_FAILED: "AI_PROCESSING_FAILED";
    readonly AI_INTERPRETATION_FAILED: "AI_INTERPRETATION_FAILED";
    readonly SYMPTOM_ASSESSMENT_FAILED: "SYMPTOM_ASSESSMENT_FAILED";
    readonly EMERGENCY_DETECTED: "EMERGENCY_DETECTED";
    readonly WELLNESS_ENTRY_NOT_FOUND: "WELLNESS_ENTRY_NOT_FOUND";
    readonly CHALLENGE_NOT_FOUND: "CHALLENGE_NOT_FOUND";
    readonly CHALLENGE_ALREADY_JOINED: "CHALLENGE_ALREADY_JOINED";
    readonly CYCLE_DATA_NOT_FOUND: "CYCLE_DATA_NOT_FOUND";
    readonly CORPORATE_NOT_FOUND: "CORPORATE_NOT_FOUND";
    readonly EMPLOYEE_NOT_FOUND: "EMPLOYEE_NOT_FOUND";
    readonly SUBSCRIPTION_EXPIRED: "SUBSCRIPTION_EXPIRED";
    readonly EMPLOYEE_LIMIT_EXCEEDED: "EMPLOYEE_LIMIT_EXCEEDED";
};
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

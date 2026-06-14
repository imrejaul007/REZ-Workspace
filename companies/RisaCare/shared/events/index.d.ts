import { z } from 'zod';
export declare const BaseEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    eventType: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: string;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: string;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const HealthEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    eventType: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
} & {
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: string;
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: string;
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const RecordUploadedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.record.uploaded">;
    data: z.ZodObject<{
        recordId: z.ZodString;
        profileId: z.ZodString;
        type: z.ZodEnum<["blood_report", "urine_report", "stool_report", "xray", "ct_scan", "mri", "ultrasound", "ecg", "echo", "prescription", "discharge_summary", "medical_certificate", "vaccination_certificate", "insurance_document", "lab_report", "pathology_report", "imaging_report", "doctor_notes", "other"]>;
        title: z.ZodString;
        file: z.ZodObject<{
            filename: z.ZodString;
            mimeType: z.ZodString;
            size: z.ZodNumber;
            storageKey: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            size: number;
            filename: string;
            mimeType: string;
            storageKey: string;
        }, {
            size: number;
            filename: string;
            mimeType: string;
            storageKey: string;
        }>;
        processing: z.ZodObject<{
            status: z.ZodEnum<["pending"]>;
            estimatedCompletionTime: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            status: "pending";
            estimatedCompletionTime?: string | undefined;
        }, {
            status: "pending";
            estimatedCompletionTime?: string | undefined;
        }>;
        metadata: z.ZodOptional<z.ZodObject<{
            uploadSource: z.ZodOptional<z.ZodEnum<["mobile", "web", "api", "wearable"]>>;
        }, "strip", z.ZodTypeAny, {
            uploadSource?: "wearable" | "mobile" | "web" | "api" | undefined;
        }, {
            uploadSource?: "wearable" | "mobile" | "web" | "api" | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        recordId: string;
        type: "other" | "blood_report" | "urine_report" | "stool_report" | "xray" | "ct_scan" | "mri" | "ultrasound" | "ecg" | "echo" | "prescription" | "discharge_summary" | "medical_certificate" | "vaccination_certificate" | "insurance_document" | "lab_report" | "pathology_report" | "imaging_report" | "doctor_notes";
        title: string;
        file: {
            size: number;
            filename: string;
            mimeType: string;
            storageKey: string;
        };
        processing: {
            status: "pending";
            estimatedCompletionTime?: string | undefined;
        };
        metadata?: {
            uploadSource?: "wearable" | "mobile" | "web" | "api" | undefined;
        } | undefined;
    }, {
        profileId: string;
        recordId: string;
        type: "other" | "blood_report" | "urine_report" | "stool_report" | "xray" | "ct_scan" | "mri" | "ultrasound" | "ecg" | "echo" | "prescription" | "discharge_summary" | "medical_certificate" | "vaccination_certificate" | "insurance_document" | "lab_report" | "pathology_report" | "imaging_report" | "doctor_notes";
        title: string;
        file: {
            size: number;
            filename: string;
            mimeType: string;
            storageKey: string;
        };
        processing: {
            status: "pending";
            estimatedCompletionTime?: string | undefined;
        };
        metadata?: {
            uploadSource?: "wearable" | "mobile" | "web" | "api" | undefined;
        } | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        recordId: string;
        type: "other" | "blood_report" | "urine_report" | "stool_report" | "xray" | "ct_scan" | "mri" | "ultrasound" | "ecg" | "echo" | "prescription" | "discharge_summary" | "medical_certificate" | "vaccination_certificate" | "insurance_document" | "lab_report" | "pathology_report" | "imaging_report" | "doctor_notes";
        title: string;
        file: {
            size: number;
            filename: string;
            mimeType: string;
            storageKey: string;
        };
        processing: {
            status: "pending";
            estimatedCompletionTime?: string | undefined;
        };
        metadata?: {
            uploadSource?: "wearable" | "mobile" | "web" | "api" | undefined;
        } | undefined;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.record.uploaded";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        recordId: string;
        type: "other" | "blood_report" | "urine_report" | "stool_report" | "xray" | "ct_scan" | "mri" | "ultrasound" | "ecg" | "echo" | "prescription" | "discharge_summary" | "medical_certificate" | "vaccination_certificate" | "insurance_document" | "lab_report" | "pathology_report" | "imaging_report" | "doctor_notes";
        title: string;
        file: {
            size: number;
            filename: string;
            mimeType: string;
            storageKey: string;
        };
        processing: {
            status: "pending";
            estimatedCompletionTime?: string | undefined;
        };
        metadata?: {
            uploadSource?: "wearable" | "mobile" | "web" | "api" | undefined;
        } | undefined;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.record.uploaded";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const RecordProcessingStartedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.record.processing.started">;
    data: z.ZodObject<{
        recordId: z.ZodString;
        profileId: z.ZodString;
        ocrJobId: z.ZodString;
        fileType: z.ZodString;
        estimatedDurationSeconds: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        recordId: string;
        ocrJobId: string;
        fileType: string;
        estimatedDurationSeconds?: number | undefined;
    }, {
        profileId: string;
        recordId: string;
        ocrJobId: string;
        fileType: string;
        estimatedDurationSeconds?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        recordId: string;
        ocrJobId: string;
        fileType: string;
        estimatedDurationSeconds?: number | undefined;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.record.processing.started";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        recordId: string;
        ocrJobId: string;
        fileType: string;
        estimatedDurationSeconds?: number | undefined;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.record.processing.started";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const RecordProcessingCompletedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.record.processing.completed">;
    data: z.ZodObject<{
        recordId: z.ZodString;
        profileId: z.ZodString;
        processingDurationMs: z.ZodNumber;
        ocr: z.ZodObject<{
            confidence: z.ZodNumber;
            pagesProcessed: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            confidence: number;
            pagesProcessed: number;
        }, {
            confidence: number;
            pagesProcessed: number;
        }>;
        extraction: z.ZodObject<{
            confidence: z.ZodNumber;
            biomarkersExtracted: z.ZodNumber;
            dateIdentified: z.ZodBoolean;
            doctorIdentified: z.ZodBoolean;
            labIdentified: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            confidence: number;
            biomarkersExtracted: number;
            dateIdentified: boolean;
            doctorIdentified: boolean;
            labIdentified: boolean;
        }, {
            confidence: number;
            biomarkersExtracted: number;
            dateIdentified: boolean;
            doctorIdentified: boolean;
            labIdentified: boolean;
        }>;
        category: z.ZodOptional<z.ZodEnum<["diabetes", "cardiac", "liver", "thyroid", "hormonal", "kidney", "blood", "womens_health", "preventive", "fitness", "nutrition", "respiratory", "digestive", "musculoskeletal", "neurological", "dermatological", "ophthalmic", "dental", "mental_health", "general"]>>;
        isAbnormal: z.ZodBoolean;
        hasFollowUpRequired: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        recordId: string;
        isAbnormal: boolean;
        hasFollowUpRequired: boolean;
        processingDurationMs: number;
        ocr: {
            confidence: number;
            pagesProcessed: number;
        };
        extraction: {
            confidence: number;
            biomarkersExtracted: number;
            dateIdentified: boolean;
            doctorIdentified: boolean;
            labIdentified: boolean;
        };
        category?: "diabetes" | "cardiac" | "liver" | "thyroid" | "hormonal" | "kidney" | "blood" | "womens_health" | "preventive" | "fitness" | "nutrition" | "respiratory" | "digestive" | "musculoskeletal" | "neurological" | "dermatological" | "ophthalmic" | "dental" | "mental_health" | "general" | undefined;
    }, {
        profileId: string;
        recordId: string;
        isAbnormal: boolean;
        hasFollowUpRequired: boolean;
        processingDurationMs: number;
        ocr: {
            confidence: number;
            pagesProcessed: number;
        };
        extraction: {
            confidence: number;
            biomarkersExtracted: number;
            dateIdentified: boolean;
            doctorIdentified: boolean;
            labIdentified: boolean;
        };
        category?: "diabetes" | "cardiac" | "liver" | "thyroid" | "hormonal" | "kidney" | "blood" | "womens_health" | "preventive" | "fitness" | "nutrition" | "respiratory" | "digestive" | "musculoskeletal" | "neurological" | "dermatological" | "ophthalmic" | "dental" | "mental_health" | "general" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        recordId: string;
        isAbnormal: boolean;
        hasFollowUpRequired: boolean;
        processingDurationMs: number;
        ocr: {
            confidence: number;
            pagesProcessed: number;
        };
        extraction: {
            confidence: number;
            biomarkersExtracted: number;
            dateIdentified: boolean;
            doctorIdentified: boolean;
            labIdentified: boolean;
        };
        category?: "diabetes" | "cardiac" | "liver" | "thyroid" | "hormonal" | "kidney" | "blood" | "womens_health" | "preventive" | "fitness" | "nutrition" | "respiratory" | "digestive" | "musculoskeletal" | "neurological" | "dermatological" | "ophthalmic" | "dental" | "mental_health" | "general" | undefined;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.record.processing.completed";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        recordId: string;
        isAbnormal: boolean;
        hasFollowUpRequired: boolean;
        processingDurationMs: number;
        ocr: {
            confidence: number;
            pagesProcessed: number;
        };
        extraction: {
            confidence: number;
            biomarkersExtracted: number;
            dateIdentified: boolean;
            doctorIdentified: boolean;
            labIdentified: boolean;
        };
        category?: "diabetes" | "cardiac" | "liver" | "thyroid" | "hormonal" | "kidney" | "blood" | "womens_health" | "preventive" | "fitness" | "nutrition" | "respiratory" | "digestive" | "musculoskeletal" | "neurological" | "dermatological" | "ophthalmic" | "dental" | "mental_health" | "general" | undefined;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.record.processing.completed";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const RecordProcessingFailedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.record.processing.failed">;
    data: z.ZodObject<{
        recordId: z.ZodString;
        profileId: z.ZodString;
        error: z.ZodObject<{
            code: z.ZodString;
            message: z.ZodString;
            stage: z.ZodEnum<["ocr", "extraction", "categorization"]>;
        }, "strip", z.ZodTypeAny, {
            message: string;
            code: string;
            stage: "ocr" | "extraction" | "categorization";
        }, {
            message: string;
            code: string;
            stage: "ocr" | "extraction" | "categorization";
        }>;
        retryable: z.ZodBoolean;
        retryCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        error: {
            message: string;
            code: string;
            stage: "ocr" | "extraction" | "categorization";
        };
        profileId: string;
        recordId: string;
        retryable: boolean;
        retryCount: number;
    }, {
        error: {
            message: string;
            code: string;
            stage: "ocr" | "extraction" | "categorization";
        };
        profileId: string;
        recordId: string;
        retryable: boolean;
        retryCount: number;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        error: {
            message: string;
            code: string;
            stage: "ocr" | "extraction" | "categorization";
        };
        profileId: string;
        recordId: string;
        retryable: boolean;
        retryCount: number;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.record.processing.failed";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        error: {
            message: string;
            code: string;
            stage: "ocr" | "extraction" | "categorization";
        };
        profileId: string;
        recordId: string;
        retryable: boolean;
        retryCount: number;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.record.processing.failed";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const RecordInterpretedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.record.interpreted">;
    data: z.ZodObject<{
        recordId: z.ZodString;
        profileId: z.ZodString;
        interpretation: z.ZodObject<{
            biomarkersInterpreted: z.ZodNumber;
            confidence: z.ZodNumber;
            needsDoctorConsult: z.ZodBoolean;
            urgency: z.ZodEnum<["low", "medium", "high"]>;
        }, "strip", z.ZodTypeAny, {
            urgency: "low" | "high" | "medium";
            confidence: number;
            needsDoctorConsult: boolean;
            biomarkersInterpreted: number;
        }, {
            urgency: "low" | "high" | "medium";
            confidence: number;
            needsDoctorConsult: boolean;
            biomarkersInterpreted: number;
        }>;
        riskSignalsGenerated: z.ZodNumber;
        processingTimeMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        recordId: string;
        interpretation: {
            urgency: "low" | "high" | "medium";
            confidence: number;
            needsDoctorConsult: boolean;
            biomarkersInterpreted: number;
        };
        riskSignalsGenerated: number;
        processingTimeMs: number;
    }, {
        profileId: string;
        recordId: string;
        interpretation: {
            urgency: "low" | "high" | "medium";
            confidence: number;
            needsDoctorConsult: boolean;
            biomarkersInterpreted: number;
        };
        riskSignalsGenerated: number;
        processingTimeMs: number;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        recordId: string;
        interpretation: {
            urgency: "low" | "high" | "medium";
            confidence: number;
            needsDoctorConsult: boolean;
            biomarkersInterpreted: number;
        };
        riskSignalsGenerated: number;
        processingTimeMs: number;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.record.interpreted";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        recordId: string;
        interpretation: {
            urgency: "low" | "high" | "medium";
            confidence: number;
            needsDoctorConsult: boolean;
            biomarkersInterpreted: number;
        };
        riskSignalsGenerated: number;
        processingTimeMs: number;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.record.interpreted";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const RecordDeletedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.record.deleted">;
    data: z.ZodObject<{
        recordId: z.ZodString;
        profileId: z.ZodString;
        fileStorageKeys: z.ZodArray<z.ZodString, "many">;
        deletedBy: z.ZodEnum<["user", "system", "admin"]>;
        reason: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        recordId: string;
        fileStorageKeys: string[];
        deletedBy: "user" | "system" | "admin";
        reason?: string | undefined;
    }, {
        profileId: string;
        recordId: string;
        fileStorageKeys: string[];
        deletedBy: "user" | "system" | "admin";
        reason?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        recordId: string;
        fileStorageKeys: string[];
        deletedBy: "user" | "system" | "admin";
        reason?: string | undefined;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.record.deleted";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        recordId: string;
        fileStorageKeys: string[];
        deletedBy: "user" | "system" | "admin";
        reason?: string | undefined;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.record.deleted";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const RecordSharedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.record.shared">;
    data: z.ZodObject<{
        recordId: z.ZodString;
        profileId: z.ZodString;
        sharedWith: z.ZodObject<{
            entityType: z.ZodEnum<["doctor", "lab", "hospital"]>;
            entityId: z.ZodString;
            entityName: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            entityType: "doctor" | "lab" | "hospital";
            entityId: string;
            entityName: string;
        }, {
            entityType: "doctor" | "lab" | "hospital";
            entityId: string;
            entityName: string;
        }>;
        consentId: z.ZodString;
        expiresAt: z.ZodOptional<z.ZodString>;
        accessScope: z.ZodDefault<z.ZodEnum<["full", "summary"]>>;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        recordId: string;
        consentId: string;
        sharedWith: {
            entityType: "doctor" | "lab" | "hospital";
            entityId: string;
            entityName: string;
        };
        accessScope: "summary" | "full";
        expiresAt?: string | undefined;
    }, {
        profileId: string;
        recordId: string;
        consentId: string;
        sharedWith: {
            entityType: "doctor" | "lab" | "hospital";
            entityId: string;
            entityName: string;
        };
        expiresAt?: string | undefined;
        accessScope?: "summary" | "full" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        recordId: string;
        consentId: string;
        sharedWith: {
            entityType: "doctor" | "lab" | "hospital";
            entityId: string;
            entityName: string;
        };
        accessScope: "summary" | "full";
        expiresAt?: string | undefined;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.record.shared";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        recordId: string;
        consentId: string;
        sharedWith: {
            entityType: "doctor" | "lab" | "hospital";
            entityId: string;
            entityName: string;
        };
        expiresAt?: string | undefined;
        accessScope?: "summary" | "full" | undefined;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.record.shared";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const AppointmentBookedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.appointment.booked">;
    data: z.ZodObject<{
        appointmentId: z.ZodString;
        profileId: z.ZodString;
        providerType: z.ZodEnum<["doctor", "lab", "pharmacy", "wellness"]>;
        providerId: z.ZodString;
        providerName: z.ZodString;
        type: z.ZodEnum<["consultation", "follow_up", "diagnostic_test", "health_package", "teleconsult", "home_visit"]>;
        schedule: z.ZodObject<{
            date: z.ZodString;
            startTime: z.ZodString;
            mode: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            date: string;
            mode: string;
            startTime: string;
        }, {
            date: string;
            mode: string;
            startTime: string;
        }>;
        payment: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
            method: z.ZodString;
            transactionId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            currency: string;
            method: string;
            transactionId: string;
            amount: number;
        }, {
            currency: string;
            method: string;
            transactionId: string;
            amount: number;
        }>;
        isFirstVisit: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        type: "consultation" | "follow_up" | "diagnostic_test" | "health_package" | "teleconsult" | "home_visit";
        appointmentId: string;
        providerType: "doctor" | "lab" | "pharmacy" | "wellness";
        providerId: string;
        schedule: {
            date: string;
            mode: string;
            startTime: string;
        };
        payment: {
            currency: string;
            method: string;
            transactionId: string;
            amount: number;
        };
        providerName: string;
        isFirstVisit: boolean;
    }, {
        profileId: string;
        type: "consultation" | "follow_up" | "diagnostic_test" | "health_package" | "teleconsult" | "home_visit";
        appointmentId: string;
        providerType: "doctor" | "lab" | "pharmacy" | "wellness";
        providerId: string;
        schedule: {
            date: string;
            mode: string;
            startTime: string;
        };
        payment: {
            currency: string;
            method: string;
            transactionId: string;
            amount: number;
        };
        providerName: string;
        isFirstVisit: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        type: "consultation" | "follow_up" | "diagnostic_test" | "health_package" | "teleconsult" | "home_visit";
        appointmentId: string;
        providerType: "doctor" | "lab" | "pharmacy" | "wellness";
        providerId: string;
        schedule: {
            date: string;
            mode: string;
            startTime: string;
        };
        payment: {
            currency: string;
            method: string;
            transactionId: string;
            amount: number;
        };
        providerName: string;
        isFirstVisit: boolean;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.appointment.booked";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        type: "consultation" | "follow_up" | "diagnostic_test" | "health_package" | "teleconsult" | "home_visit";
        appointmentId: string;
        providerType: "doctor" | "lab" | "pharmacy" | "wellness";
        providerId: string;
        schedule: {
            date: string;
            mode: string;
            startTime: string;
        };
        payment: {
            currency: string;
            method: string;
            transactionId: string;
            amount: number;
        };
        providerName: string;
        isFirstVisit: boolean;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.appointment.booked";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const AppointmentConfirmedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.appointment.confirmed">;
    data: z.ZodObject<{
        appointmentId: z.ZodString;
        profileId: z.ZodString;
        providerType: z.ZodEnum<["doctor", "lab", "pharmacy", "wellness"]>;
        providerId: z.ZodString;
        meetingLink: z.ZodOptional<z.ZodString>;
        reminders: z.ZodObject<{
            reminder24h: z.ZodString;
            reminder1h: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            reminder24h: string;
            reminder1h: string;
        }, {
            reminder24h: string;
            reminder1h: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        appointmentId: string;
        reminders: {
            reminder24h: string;
            reminder1h: string;
        };
        providerType: "doctor" | "lab" | "pharmacy" | "wellness";
        providerId: string;
        meetingLink?: string | undefined;
    }, {
        profileId: string;
        appointmentId: string;
        reminders: {
            reminder24h: string;
            reminder1h: string;
        };
        providerType: "doctor" | "lab" | "pharmacy" | "wellness";
        providerId: string;
        meetingLink?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        appointmentId: string;
        reminders: {
            reminder24h: string;
            reminder1h: string;
        };
        providerType: "doctor" | "lab" | "pharmacy" | "wellness";
        providerId: string;
        meetingLink?: string | undefined;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.appointment.confirmed";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        appointmentId: string;
        reminders: {
            reminder24h: string;
            reminder1h: string;
        };
        providerType: "doctor" | "lab" | "pharmacy" | "wellness";
        providerId: string;
        meetingLink?: string | undefined;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.appointment.confirmed";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const AppointmentCompletedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.appointment.completed">;
    data: z.ZodObject<{
        appointmentId: z.ZodString;
        profileId: z.ZodString;
        providerType: z.ZodEnum<["doctor", "lab", "pharmacy", "wellness"]>;
        providerId: z.ZodString;
        duration: z.ZodNumber;
        completedAt: z.ZodString;
        followUpRequired: z.ZodBoolean;
        followUpAppointmentId: z.ZodOptional<z.ZodString>;
        prescriptionIssued: z.ZodOptional<z.ZodBoolean>;
        testsOrdered: z.ZodOptional<z.ZodBoolean>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        appointmentId: string;
        duration: number;
        completedAt: string;
        providerType: "doctor" | "lab" | "pharmacy" | "wellness";
        providerId: string;
        followUpRequired: boolean;
        notes?: string | undefined;
        followUpAppointmentId?: string | undefined;
        prescriptionIssued?: boolean | undefined;
        testsOrdered?: boolean | undefined;
    }, {
        profileId: string;
        appointmentId: string;
        duration: number;
        completedAt: string;
        providerType: "doctor" | "lab" | "pharmacy" | "wellness";
        providerId: string;
        followUpRequired: boolean;
        notes?: string | undefined;
        followUpAppointmentId?: string | undefined;
        prescriptionIssued?: boolean | undefined;
        testsOrdered?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        appointmentId: string;
        duration: number;
        completedAt: string;
        providerType: "doctor" | "lab" | "pharmacy" | "wellness";
        providerId: string;
        followUpRequired: boolean;
        notes?: string | undefined;
        followUpAppointmentId?: string | undefined;
        prescriptionIssued?: boolean | undefined;
        testsOrdered?: boolean | undefined;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.appointment.completed";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        appointmentId: string;
        duration: number;
        completedAt: string;
        providerType: "doctor" | "lab" | "pharmacy" | "wellness";
        providerId: string;
        followUpRequired: boolean;
        notes?: string | undefined;
        followUpAppointmentId?: string | undefined;
        prescriptionIssued?: boolean | undefined;
        testsOrdered?: boolean | undefined;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.appointment.completed";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const AppointmentCancelledEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.appointment.cancelled">;
    data: z.ZodObject<{
        appointmentId: z.ZodString;
        profileId: z.ZodString;
        providerType: z.ZodEnum<["doctor", "lab", "pharmacy", "wellness"]>;
        providerId: z.ZodString;
        cancelledBy: z.ZodEnum<["user", "provider", "system"]>;
        reason: z.ZodString;
        refundId: z.ZodOptional<z.ZodString>;
        refundAmount: z.ZodOptional<z.ZodNumber>;
        cancelledAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        reason: string;
        appointmentId: string;
        providerType: "doctor" | "lab" | "pharmacy" | "wellness";
        providerId: string;
        cancelledAt: string;
        cancelledBy: "provider" | "user" | "system";
        refundId?: string | undefined;
        refundAmount?: number | undefined;
    }, {
        profileId: string;
        reason: string;
        appointmentId: string;
        providerType: "doctor" | "lab" | "pharmacy" | "wellness";
        providerId: string;
        cancelledAt: string;
        cancelledBy: "provider" | "user" | "system";
        refundId?: string | undefined;
        refundAmount?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        reason: string;
        appointmentId: string;
        providerType: "doctor" | "lab" | "pharmacy" | "wellness";
        providerId: string;
        cancelledAt: string;
        cancelledBy: "provider" | "user" | "system";
        refundId?: string | undefined;
        refundAmount?: number | undefined;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.appointment.cancelled";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        reason: string;
        appointmentId: string;
        providerType: "doctor" | "lab" | "pharmacy" | "wellness";
        providerId: string;
        cancelledAt: string;
        cancelledBy: "provider" | "user" | "system";
        refundId?: string | undefined;
        refundAmount?: number | undefined;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.appointment.cancelled";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const CycleLoggedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.cycle.logged">;
    data: z.ZodObject<{
        entryId: z.ZodString;
        profileId: z.ZodString;
        date: z.ZodString;
        cycleType: z.ZodEnum<["period_start", "period_end", "spotting", "intercourse", "ovulation", "fertile_window", "symptom", "mood"]>;
        flowIntensity: z.ZodOptional<z.ZodEnum<["light", "medium", "heavy"]>>;
        symptoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        mood: z.ZodOptional<z.ZodString>;
        cycleDay: z.ZodNumber;
        predictedNextPeriod: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        date: string;
        entryId: string;
        cycleType: "ovulation" | "period_start" | "period_end" | "spotting" | "intercourse" | "fertile_window" | "symptom" | "mood";
        cycleDay: number;
        symptoms?: string[] | undefined;
        flowIntensity?: "heavy" | "light" | "medium" | undefined;
        mood?: string | undefined;
        predictedNextPeriod?: string | undefined;
    }, {
        profileId: string;
        date: string;
        entryId: string;
        cycleType: "ovulation" | "period_start" | "period_end" | "spotting" | "intercourse" | "fertile_window" | "symptom" | "mood";
        cycleDay: number;
        symptoms?: string[] | undefined;
        flowIntensity?: "heavy" | "light" | "medium" | undefined;
        mood?: string | undefined;
        predictedNextPeriod?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        date: string;
        entryId: string;
        cycleType: "ovulation" | "period_start" | "period_end" | "spotting" | "intercourse" | "fertile_window" | "symptom" | "mood";
        cycleDay: number;
        symptoms?: string[] | undefined;
        flowIntensity?: "heavy" | "light" | "medium" | undefined;
        mood?: string | undefined;
        predictedNextPeriod?: string | undefined;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.cycle.logged";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        date: string;
        entryId: string;
        cycleType: "ovulation" | "period_start" | "period_end" | "spotting" | "intercourse" | "fertile_window" | "symptom" | "mood";
        cycleDay: number;
        symptoms?: string[] | undefined;
        flowIntensity?: "heavy" | "light" | "medium" | undefined;
        mood?: string | undefined;
        predictedNextPeriod?: string | undefined;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.cycle.logged";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const HabitCompletedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.habit.completed">;
    data: z.ZodObject<{
        entryId: z.ZodString;
        profileId: z.ZodString;
        habitType: z.ZodEnum<["water", "sleep", "steps", "workout", "meditation", "nutrition"]>;
        value: z.ZodNumber;
        unit: z.ZodOptional<z.ZodString>;
        goal: z.ZodNumber;
        goalAchieved: z.ZodBoolean;
        currentStreak: z.ZodNumber;
        totalStreak: z.ZodNumber;
        source: z.ZodEnum<["manual", "wearable", "integration"]>;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        entryId: string;
        value: number;
        habitType: "nutrition" | "water" | "sleep" | "steps" | "workout" | "meditation";
        goal: number;
        source: "manual" | "wearable" | "integration";
        currentStreak: number;
        goalAchieved: boolean;
        totalStreak: number;
        unit?: string | undefined;
    }, {
        profileId: string;
        entryId: string;
        value: number;
        habitType: "nutrition" | "water" | "sleep" | "steps" | "workout" | "meditation";
        goal: number;
        source: "manual" | "wearable" | "integration";
        currentStreak: number;
        goalAchieved: boolean;
        totalStreak: number;
        unit?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        entryId: string;
        value: number;
        habitType: "nutrition" | "water" | "sleep" | "steps" | "workout" | "meditation";
        goal: number;
        source: "manual" | "wearable" | "integration";
        currentStreak: number;
        goalAchieved: boolean;
        totalStreak: number;
        unit?: string | undefined;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.habit.completed";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        entryId: string;
        value: number;
        habitType: "nutrition" | "water" | "sleep" | "steps" | "workout" | "meditation";
        goal: number;
        source: "manual" | "wearable" | "integration";
        currentStreak: number;
        goalAchieved: boolean;
        totalStreak: number;
        unit?: string | undefined;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.habit.completed";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const ChallengeJoinedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.challenge.joined">;
    data: z.ZodObject<{
        challengeId: z.ZodString;
        profileId: z.ZodString;
        challengeName: z.ZodString;
        challengeType: z.ZodString;
        duration: z.ZodObject<{
            startDate: z.ZodString;
            endDate: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            startDate: string;
            endDate: string;
        }, {
            startDate: string;
            endDate: string;
        }>;
        requirements: z.ZodObject<{
            dailyGoal: z.ZodNumber;
            totalDays: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            dailyGoal: number;
            totalDays: number;
        }, {
            dailyGoal: number;
            totalDays: number;
        }>;
        rewards: z.ZodObject<{
            coins: z.ZodNumber;
            badge: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            coins: number;
            badge?: string | undefined;
        }, {
            coins: number;
            badge?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        challengeId: string;
        duration: {
            startDate: string;
            endDate: string;
        };
        challengeName: string;
        challengeType: string;
        requirements: {
            dailyGoal: number;
            totalDays: number;
        };
        rewards: {
            coins: number;
            badge?: string | undefined;
        };
    }, {
        profileId: string;
        challengeId: string;
        duration: {
            startDate: string;
            endDate: string;
        };
        challengeName: string;
        challengeType: string;
        requirements: {
            dailyGoal: number;
            totalDays: number;
        };
        rewards: {
            coins: number;
            badge?: string | undefined;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        challengeId: string;
        duration: {
            startDate: string;
            endDate: string;
        };
        challengeName: string;
        challengeType: string;
        requirements: {
            dailyGoal: number;
            totalDays: number;
        };
        rewards: {
            coins: number;
            badge?: string | undefined;
        };
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.challenge.joined";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        challengeId: string;
        duration: {
            startDate: string;
            endDate: string;
        };
        challengeName: string;
        challengeType: string;
        requirements: {
            dailyGoal: number;
            totalDays: number;
        };
        rewards: {
            coins: number;
            badge?: string | undefined;
        };
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.challenge.joined";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const ChallengeCompletedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.challenge.completed">;
    data: z.ZodObject<{
        challengeId: z.ZodString;
        profileId: z.ZodString;
        challengeName: z.ZodString;
        completedAt: z.ZodString;
        finalStreak: z.ZodNumber;
        totalPoints: z.ZodNumber;
        completedDays: z.ZodNumber;
        rewardsEarned: z.ZodObject<{
            coins: z.ZodNumber;
            badge: z.ZodOptional<z.ZodString>;
            cashback: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            coins: number;
            badge?: string | undefined;
            cashback?: number | undefined;
        }, {
            coins: number;
            badge?: string | undefined;
            cashback?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        challengeId: string;
        completedAt: string;
        challengeName: string;
        totalPoints: number;
        completedDays: number;
        finalStreak: number;
        rewardsEarned: {
            coins: number;
            badge?: string | undefined;
            cashback?: number | undefined;
        };
    }, {
        profileId: string;
        challengeId: string;
        completedAt: string;
        challengeName: string;
        totalPoints: number;
        completedDays: number;
        finalStreak: number;
        rewardsEarned: {
            coins: number;
            badge?: string | undefined;
            cashback?: number | undefined;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        challengeId: string;
        completedAt: string;
        challengeName: string;
        totalPoints: number;
        completedDays: number;
        finalStreak: number;
        rewardsEarned: {
            coins: number;
            badge?: string | undefined;
            cashback?: number | undefined;
        };
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.challenge.completed";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        challengeId: string;
        completedAt: string;
        challengeName: string;
        totalPoints: number;
        completedDays: number;
        finalStreak: number;
        rewardsEarned: {
            coins: number;
            badge?: string | undefined;
            cashback?: number | undefined;
        };
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.challenge.completed";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const HealthScoreUpdatedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.score.updated">;
    data: z.ZodObject<{
        profileId: z.ZodString;
        score: z.ZodNumber;
        grade: z.ZodString;
        trend: z.ZodEnum<["improving", "stable", "declining"]>;
        components: z.ZodObject<{
            preventive: z.ZodNumber;
            activity: z.ZodNumber;
            lifestyle: z.ZodNumber;
            biomarkers: z.ZodNumber;
            engagement: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lifestyle: number;
            preventive: number;
            biomarkers: number;
            activity: number;
            engagement: number;
        }, {
            lifestyle: number;
            preventive: number;
            biomarkers: number;
            activity: number;
            engagement: number;
        }>;
        badges: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            newlyEarned: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            name: string;
            id: string;
            newlyEarned: boolean;
        }, {
            name: string;
            id: string;
            newlyEarned: boolean;
        }>, "many">;
        previousScore: z.ZodOptional<z.ZodNumber>;
        improvement: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        trend: "improving" | "stable" | "declining";
        score: number;
        grade: string;
        components: {
            lifestyle: number;
            preventive: number;
            biomarkers: number;
            activity: number;
            engagement: number;
        };
        badges: {
            name: string;
            id: string;
            newlyEarned: boolean;
        }[];
        previousScore?: number | undefined;
        improvement?: number | undefined;
    }, {
        profileId: string;
        trend: "improving" | "stable" | "declining";
        score: number;
        grade: string;
        components: {
            lifestyle: number;
            preventive: number;
            biomarkers: number;
            activity: number;
            engagement: number;
        };
        badges: {
            name: string;
            id: string;
            newlyEarned: boolean;
        }[];
        previousScore?: number | undefined;
        improvement?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        trend: "improving" | "stable" | "declining";
        score: number;
        grade: string;
        components: {
            lifestyle: number;
            preventive: number;
            biomarkers: number;
            activity: number;
            engagement: number;
        };
        badges: {
            name: string;
            id: string;
            newlyEarned: boolean;
        }[];
        previousScore?: number | undefined;
        improvement?: number | undefined;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.score.updated";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        trend: "improving" | "stable" | "declining";
        score: number;
        grade: string;
        components: {
            lifestyle: number;
            preventive: number;
            biomarkers: number;
            activity: number;
            engagement: number;
        };
        badges: {
            name: string;
            id: string;
            newlyEarned: boolean;
        }[];
        previousScore?: number | undefined;
        improvement?: number | undefined;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.score.updated";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const AIInterpretedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.ai.interpreted">;
    data: z.ZodObject<{
        recordId: z.ZodString;
        profileId: z.ZodString;
        biomarkersInterpreted: z.ZodNumber;
        confidence: z.ZodNumber;
        responseTimeMs: z.ZodNumber;
        model: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        recordId: string;
        confidence: number;
        biomarkersInterpreted: number;
        responseTimeMs: number;
        model?: string | undefined;
    }, {
        profileId: string;
        recordId: string;
        confidence: number;
        biomarkersInterpreted: number;
        responseTimeMs: number;
        model?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        recordId: string;
        confidence: number;
        biomarkersInterpreted: number;
        responseTimeMs: number;
        model?: string | undefined;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.ai.interpreted";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        recordId: string;
        confidence: number;
        biomarkersInterpreted: number;
        responseTimeMs: number;
        model?: string | undefined;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.ai.interpreted";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const SymptomAssessedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.symptom.assessed">;
    data: z.ZodObject<{
        sessionId: z.ZodString;
        profileId: z.ZodString;
        symptoms: z.ZodArray<z.ZodString, "many">;
        urgency: z.ZodEnum<["self_care", "consult_doctor", "urgent_care", "emergency"]>;
        recommendedSpecialty: z.ZodOptional<z.ZodString>;
        recommendedTests: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        confidence: z.ZodNumber;
        responseTimeMs: z.ZodNumber;
        emergencyDetected: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        symptoms: string[];
        urgency: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
        confidence: number;
        sessionId: string;
        responseTimeMs: number;
        emergencyDetected: boolean;
        recommendedSpecialty?: string | undefined;
        recommendedTests?: string[] | undefined;
    }, {
        profileId: string;
        symptoms: string[];
        urgency: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
        confidence: number;
        sessionId: string;
        responseTimeMs: number;
        emergencyDetected: boolean;
        recommendedSpecialty?: string | undefined;
        recommendedTests?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        symptoms: string[];
        urgency: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
        confidence: number;
        sessionId: string;
        responseTimeMs: number;
        emergencyDetected: boolean;
        recommendedSpecialty?: string | undefined;
        recommendedTests?: string[] | undefined;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.symptom.assessed";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        symptoms: string[];
        urgency: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
        confidence: number;
        sessionId: string;
        responseTimeMs: number;
        emergencyDetected: boolean;
        recommendedSpecialty?: string | undefined;
        recommendedTests?: string[] | undefined;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.symptom.assessed";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const CopilotInteractionEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.copilot.interaction">;
    data: z.ZodObject<{
        sessionId: z.ZodString;
        profileId: z.ZodString;
        task: z.ZodEnum<["explain_report", "track_biomarker", "compare_reports", "find_doctor", "book_appointment", "interpret_symptoms", "medication_reminder", "track_cycle", "health_score_insight", "preventive_checkup", "family_health", "general_health"]>;
        userMessage: z.ZodString;
        aiResponse: z.ZodOptional<z.ZodString>;
        confidence: z.ZodNumber;
        actionsTriggered: z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            label: z.ZodString;
            payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            label: string;
            payload: Record<string, unknown>;
        }, {
            type: string;
            label: string;
            payload: Record<string, unknown>;
        }>, "many">;
        responseTimeMs: z.ZodNumber;
        feedbackGiven: z.ZodOptional<z.ZodEnum<["positive", "negative"]>>;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        confidence: number;
        sessionId: string;
        responseTimeMs: number;
        task: "medication_reminder" | "explain_report" | "track_biomarker" | "compare_reports" | "find_doctor" | "book_appointment" | "interpret_symptoms" | "track_cycle" | "health_score_insight" | "preventive_checkup" | "family_health" | "general_health";
        userMessage: string;
        actionsTriggered: {
            type: string;
            label: string;
            payload: Record<string, unknown>;
        }[];
        aiResponse?: string | undefined;
        feedbackGiven?: "positive" | "negative" | undefined;
    }, {
        profileId: string;
        confidence: number;
        sessionId: string;
        responseTimeMs: number;
        task: "medication_reminder" | "explain_report" | "track_biomarker" | "compare_reports" | "find_doctor" | "book_appointment" | "interpret_symptoms" | "track_cycle" | "health_score_insight" | "preventive_checkup" | "family_health" | "general_health";
        userMessage: string;
        actionsTriggered: {
            type: string;
            label: string;
            payload: Record<string, unknown>;
        }[];
        aiResponse?: string | undefined;
        feedbackGiven?: "positive" | "negative" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        confidence: number;
        sessionId: string;
        responseTimeMs: number;
        task: "medication_reminder" | "explain_report" | "track_biomarker" | "compare_reports" | "find_doctor" | "book_appointment" | "interpret_symptoms" | "track_cycle" | "health_score_insight" | "preventive_checkup" | "family_health" | "general_health";
        userMessage: string;
        actionsTriggered: {
            type: string;
            label: string;
            payload: Record<string, unknown>;
        }[];
        aiResponse?: string | undefined;
        feedbackGiven?: "positive" | "negative" | undefined;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.copilot.interaction";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        confidence: number;
        sessionId: string;
        responseTimeMs: number;
        task: "medication_reminder" | "explain_report" | "track_biomarker" | "compare_reports" | "find_doctor" | "book_appointment" | "interpret_symptoms" | "track_cycle" | "health_score_insight" | "preventive_checkup" | "family_health" | "general_health";
        userMessage: string;
        actionsTriggered: {
            type: string;
            label: string;
            payload: Record<string, unknown>;
        }[];
        aiResponse?: string | undefined;
        feedbackGiven?: "positive" | "negative" | undefined;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.copilot.interaction";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const RiskDetectedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.risk.detected">;
    data: z.ZodObject<{
        riskId: z.ZodString;
        profileId: z.ZodString;
        signalType: z.ZodEnum<["abnormal_biomarker", "recurring_deficiency", "trend_concern", "medication_adherence", "checkup_due", "vaccination_due", "lifestyle_risk", "symptom_pattern"]>;
        severity: z.ZodEnum<["info", "warning", "urgent"]>;
        title: z.ZodString;
        description: z.ZodString;
        sourceBiomarkers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        recommendedAction: z.ZodObject<{
            type: z.ZodEnum<["self_care", "consult_doctor", "urgent_care", "emergency"]>;
            description: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
            description: string;
        }, {
            type: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
            description: string;
        }>;
        riskScore: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        severity: "info" | "warning" | "urgent";
        title: string;
        description: string;
        signalType: "abnormal_biomarker" | "recurring_deficiency" | "trend_concern" | "medication_adherence" | "checkup_due" | "vaccination_due" | "lifestyle_risk" | "symptom_pattern";
        recommendedAction: {
            type: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
            description: string;
        };
        riskId: string;
        sourceBiomarkers?: string[] | undefined;
        riskScore?: number | undefined;
    }, {
        profileId: string;
        severity: "info" | "warning" | "urgent";
        title: string;
        description: string;
        signalType: "abnormal_biomarker" | "recurring_deficiency" | "trend_concern" | "medication_adherence" | "checkup_due" | "vaccination_due" | "lifestyle_risk" | "symptom_pattern";
        recommendedAction: {
            type: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
            description: string;
        };
        riskId: string;
        sourceBiomarkers?: string[] | undefined;
        riskScore?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        severity: "info" | "warning" | "urgent";
        title: string;
        description: string;
        signalType: "abnormal_biomarker" | "recurring_deficiency" | "trend_concern" | "medication_adherence" | "checkup_due" | "vaccination_due" | "lifestyle_risk" | "symptom_pattern";
        recommendedAction: {
            type: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
            description: string;
        };
        riskId: string;
        sourceBiomarkers?: string[] | undefined;
        riskScore?: number | undefined;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.risk.detected";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        severity: "info" | "warning" | "urgent";
        title: string;
        description: string;
        signalType: "abnormal_biomarker" | "recurring_deficiency" | "trend_concern" | "medication_adherence" | "checkup_due" | "vaccination_due" | "lifestyle_risk" | "symptom_pattern";
        recommendedAction: {
            type: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
            description: string;
        };
        riskId: string;
        sourceBiomarkers?: string[] | undefined;
        riskScore?: number | undefined;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.risk.detected";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const AlertTriggeredEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.alert.triggered">;
    data: z.ZodObject<{
        alertId: z.ZodString;
        profileId: z.ZodString;
        alertType: z.ZodEnum<["checkup_due", "vaccination_due", "medication_due", "followup_due", "preventive"]>;
        title: z.ZodString;
        description: z.ZodString;
        priority: z.ZodEnum<["low", "medium", "high"]>;
        actionRequired: z.ZodBoolean;
        actionItems: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        deadline: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        title: string;
        description: string;
        alertId: string;
        alertType: "preventive" | "checkup_due" | "vaccination_due" | "medication_due" | "followup_due";
        priority: "low" | "high" | "medium";
        actionRequired: boolean;
        actionItems?: string[] | undefined;
        deadline?: string | undefined;
    }, {
        profileId: string;
        title: string;
        description: string;
        alertId: string;
        alertType: "preventive" | "checkup_due" | "vaccination_due" | "medication_due" | "followup_due";
        priority: "low" | "high" | "medium";
        actionRequired: boolean;
        actionItems?: string[] | undefined;
        deadline?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        title: string;
        description: string;
        alertId: string;
        alertType: "preventive" | "checkup_due" | "vaccination_due" | "medication_due" | "followup_due";
        priority: "low" | "high" | "medium";
        actionRequired: boolean;
        actionItems?: string[] | undefined;
        deadline?: string | undefined;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.alert.triggered";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        title: string;
        description: string;
        alertId: string;
        alertType: "preventive" | "checkup_due" | "vaccination_due" | "medication_due" | "followup_due";
        priority: "low" | "high" | "medium";
        actionRequired: boolean;
        actionItems?: string[] | undefined;
        deadline?: string | undefined;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.alert.triggered";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const EmergencyDetectedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.emergency.detected">;
    data: z.ZodObject<{
        sessionId: z.ZodString;
        profileId: z.ZodString;
        symptoms: z.ZodArray<z.ZodString, "many">;
        severity: z.ZodLiteral<"critical">;
        recommendedAction: z.ZodEnum<["call_emergency", "go_to_emergency"]>;
        emergencyNumbers: z.ZodArray<z.ZodString, "many">;
        locationShared: z.ZodOptional<z.ZodBoolean>;
        notificationSent: z.ZodObject<{
            emergencyContacts: z.ZodBoolean;
            medicalServices: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            emergencyContacts: boolean;
            medicalServices: boolean;
        }, {
            emergencyContacts: boolean;
            medicalServices: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        symptoms: string[];
        severity: "critical";
        recommendedAction: "call_emergency" | "go_to_emergency";
        sessionId: string;
        emergencyNumbers: string[];
        notificationSent: {
            emergencyContacts: boolean;
            medicalServices: boolean;
        };
        locationShared?: boolean | undefined;
    }, {
        profileId: string;
        symptoms: string[];
        severity: "critical";
        recommendedAction: "call_emergency" | "go_to_emergency";
        sessionId: string;
        emergencyNumbers: string[];
        notificationSent: {
            emergencyContacts: boolean;
            medicalServices: boolean;
        };
        locationShared?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        symptoms: string[];
        severity: "critical";
        recommendedAction: "call_emergency" | "go_to_emergency";
        sessionId: string;
        emergencyNumbers: string[];
        notificationSent: {
            emergencyContacts: boolean;
            medicalServices: boolean;
        };
        locationShared?: boolean | undefined;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.emergency.detected";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        symptoms: string[];
        severity: "critical";
        recommendedAction: "call_emergency" | "go_to_emergency";
        sessionId: string;
        emergencyNumbers: string[];
        notificationSent: {
            emergencyContacts: boolean;
            medicalServices: boolean;
        };
        locationShared?: boolean | undefined;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.emergency.detected";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const ProfileCreatedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.profile.created">;
    data: z.ZodObject<{
        profileId: z.ZodString;
        userId: z.ZodString;
        relationship: z.ZodString;
        name: z.ZodString;
        age: z.ZodOptional<z.ZodNumber>;
        gender: z.ZodString;
        isPrimary: z.ZodBoolean;
        hasHealthData: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        name: string;
        userId: string;
        profileId: string;
        relationship: string;
        isPrimary: boolean;
        gender: string;
        hasHealthData: boolean;
        age?: number | undefined;
    }, {
        name: string;
        userId: string;
        profileId: string;
        relationship: string;
        isPrimary: boolean;
        gender: string;
        hasHealthData: boolean;
        age?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        name: string;
        userId: string;
        profileId: string;
        relationship: string;
        isPrimary: boolean;
        gender: string;
        hasHealthData: boolean;
        age?: number | undefined;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.profile.created";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        name: string;
        userId: string;
        profileId: string;
        relationship: string;
        isPrimary: boolean;
        gender: string;
        hasHealthData: boolean;
        age?: number | undefined;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.profile.created";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const ProfileUpdatedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.profile.updated">;
    data: z.ZodObject<{
        profileId: z.ZodString;
        userId: z.ZodString;
        changes: z.ZodArray<z.ZodObject<{
            field: z.ZodString;
            previousValue: z.ZodOptional<z.ZodUnknown>;
            newValue: z.ZodOptional<z.ZodUnknown>;
        }, "strip", z.ZodTypeAny, {
            field: string;
            previousValue?: unknown;
            newValue?: unknown;
        }, {
            field: string;
            previousValue?: unknown;
            newValue?: unknown;
        }>, "many">;
        source: z.ZodEnum<["user", "api", "wearable"]>;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        profileId: string;
        source: "wearable" | "api" | "user";
        changes: {
            field: string;
            previousValue?: unknown;
            newValue?: unknown;
        }[];
    }, {
        userId: string;
        profileId: string;
        source: "wearable" | "api" | "user";
        changes: {
            field: string;
            previousValue?: unknown;
            newValue?: unknown;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        userId: string;
        profileId: string;
        source: "wearable" | "api" | "user";
        changes: {
            field: string;
            previousValue?: unknown;
            newValue?: unknown;
        }[];
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.profile.updated";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        userId: string;
        profileId: string;
        source: "wearable" | "api" | "user";
        changes: {
            field: string;
            previousValue?: unknown;
            newValue?: unknown;
        }[];
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.profile.updated";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const FamilyAddedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.family.added">;
    data: z.ZodObject<{
        userId: z.ZodString;
        profileId: z.ZodString;
        memberProfileId: z.ZodString;
        relationship: z.ZodString;
        name: z.ZodString;
        age: z.ZodOptional<z.ZodNumber>;
        hasHealthData: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        name: string;
        userId: string;
        profileId: string;
        relationship: string;
        hasHealthData: boolean;
        memberProfileId: string;
        age?: number | undefined;
    }, {
        name: string;
        userId: string;
        profileId: string;
        relationship: string;
        hasHealthData: boolean;
        memberProfileId: string;
        age?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        name: string;
        userId: string;
        profileId: string;
        relationship: string;
        hasHealthData: boolean;
        memberProfileId: string;
        age?: number | undefined;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.family.added";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        name: string;
        userId: string;
        profileId: string;
        relationship: string;
        hasHealthData: boolean;
        memberProfileId: string;
        age?: number | undefined;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.family.added";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const ConsentUpdatedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.consent.updated">;
    data: z.ZodObject<{
        userId: z.ZodString;
        profileId: z.ZodString;
        consentType: z.ZodEnum<["share", "analytics", "research", "third_party"]>;
        action: z.ZodEnum<["given", "withdrawn"]>;
        version: z.ZodString;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        profileId: string;
        consentType: "share" | "analytics" | "research" | "third_party";
        action: "given" | "withdrawn";
        version: string;
        timestamp: string;
    }, {
        userId: string;
        profileId: string;
        consentType: "share" | "analytics" | "research" | "third_party";
        action: "given" | "withdrawn";
        version: string;
        timestamp: string;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        userId: string;
        profileId: string;
        consentType: "share" | "analytics" | "research" | "third_party";
        action: "given" | "withdrawn";
        version: string;
        timestamp: string;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.consent.updated";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        userId: string;
        profileId: string;
        consentType: "share" | "analytics" | "research" | "third_party";
        action: "given" | "withdrawn";
        version: string;
        timestamp: string;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.consent.updated";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const OrderCreatedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.order.created">;
    data: z.ZodObject<{
        orderId: z.ZodString;
        profileId: z.ZodString;
        orderType: z.ZodEnum<["lab_test", "health_package", "medicine"]>;
        items: z.ZodArray<z.ZodObject<{
            itemId: z.ZodString;
            name: z.ZodString;
            quantity: z.ZodNumber;
            price: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            name: string;
            price: number;
            itemId: string;
            quantity: number;
        }, {
            name: string;
            price: number;
            itemId: string;
            quantity: number;
        }>, "many">;
        labId: z.ZodOptional<z.ZodString>;
        pharmacyId: z.ZodOptional<z.ZodString>;
        totalAmount: z.ZodNumber;
        discount: z.ZodOptional<z.ZodNumber>;
        paymentMethod: z.ZodString;
        homeCollection: z.ZodOptional<z.ZodObject<{
            address: z.ZodRecord<z.ZodString, z.ZodUnknown>;
            preferredSlot: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            address: Record<string, unknown>;
            preferredSlot: string;
        }, {
            address: Record<string, unknown>;
            preferredSlot: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        orderId: string;
        orderType: "health_package" | "lab_test" | "medicine";
        items: {
            name: string;
            price: number;
            itemId: string;
            quantity: number;
        }[];
        totalAmount: number;
        paymentMethod: string;
        labId?: string | undefined;
        homeCollection?: {
            address: Record<string, unknown>;
            preferredSlot: string;
        } | undefined;
        pharmacyId?: string | undefined;
        discount?: number | undefined;
    }, {
        profileId: string;
        orderId: string;
        orderType: "health_package" | "lab_test" | "medicine";
        items: {
            name: string;
            price: number;
            itemId: string;
            quantity: number;
        }[];
        totalAmount: number;
        paymentMethod: string;
        labId?: string | undefined;
        homeCollection?: {
            address: Record<string, unknown>;
            preferredSlot: string;
        } | undefined;
        pharmacyId?: string | undefined;
        discount?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        orderId: string;
        orderType: "health_package" | "lab_test" | "medicine";
        items: {
            name: string;
            price: number;
            itemId: string;
            quantity: number;
        }[];
        totalAmount: number;
        paymentMethod: string;
        labId?: string | undefined;
        homeCollection?: {
            address: Record<string, unknown>;
            preferredSlot: string;
        } | undefined;
        pharmacyId?: string | undefined;
        discount?: number | undefined;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.order.created";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        orderId: string;
        orderType: "health_package" | "lab_test" | "medicine";
        items: {
            name: string;
            price: number;
            itemId: string;
            quantity: number;
        }[];
        totalAmount: number;
        paymentMethod: string;
        labId?: string | undefined;
        homeCollection?: {
            address: Record<string, unknown>;
            preferredSlot: string;
        } | undefined;
        pharmacyId?: string | undefined;
        discount?: number | undefined;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.order.created";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export declare const OrderCompletedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodString;
    source: z.ZodObject<{
        service: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        instanceId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }, {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"risa.health.order.completed">;
    data: z.ZodObject<{
        orderId: z.ZodString;
        profileId: z.ZodString;
        orderType: z.ZodString;
        completedAt: z.ZodString;
        deliveryMethod: z.ZodEnum<["home_collection", "pickup", "digital"]>;
        reportRecordId: z.ZodOptional<z.ZodString>;
        commissionEarned: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        profileId: string;
        completedAt: string;
        orderId: string;
        orderType: string;
        deliveryMethod: "home_collection" | "pickup" | "digital";
        reportRecordId?: string | undefined;
        commissionEarned?: number | undefined;
    }, {
        profileId: string;
        completedAt: string;
        orderId: string;
        orderType: string;
        deliveryMethod: "home_collection" | "pickup" | "digital";
        reportRecordId?: string | undefined;
        commissionEarned?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    data: {
        profileId: string;
        completedAt: string;
        orderId: string;
        orderType: string;
        deliveryMethod: "home_collection" | "pickup" | "digital";
        reportRecordId?: string | undefined;
        commissionEarned?: number | undefined;
    };
    version: string;
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.order.completed";
    profileId?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}, {
    userId: string;
    data: {
        profileId: string;
        completedAt: string;
        orderId: string;
        orderType: string;
        deliveryMethod: "home_collection" | "pickup" | "digital";
        reportRecordId?: string | undefined;
        commissionEarned?: number | undefined;
    };
    source: {
        service: string;
        version?: string | undefined;
        instanceId?: string | undefined;
    };
    timestamp: string;
    eventId: string;
    eventType: "risa.health.order.completed";
    profileId?: string | undefined;
    version?: string | undefined;
    correlationId?: string | undefined;
    causationId?: string | undefined;
}>;
export type BaseEvent = z.infer<typeof BaseEventSchema>;
export type HealthEvent = z.infer<typeof HealthEventSchema>;
export type RecordUploadedEvent = z.infer<typeof RecordUploadedEventSchema>;
export type RecordProcessingStartedEvent = z.infer<typeof RecordProcessingStartedEventSchema>;
export type RecordProcessingCompletedEvent = z.infer<typeof RecordProcessingCompletedEventSchema>;
export type RecordProcessingFailedEvent = z.infer<typeof RecordProcessingFailedEventSchema>;
export type RecordInterpretedEvent = z.infer<typeof RecordInterpretedEventSchema>;
export type RecordDeletedEvent = z.infer<typeof RecordDeletedEventSchema>;
export type RecordSharedEvent = z.infer<typeof RecordSharedEventSchema>;
export type AppointmentBookedEvent = z.infer<typeof AppointmentBookedEventSchema>;
export type AppointmentConfirmedEvent = z.infer<typeof AppointmentConfirmedEventSchema>;
export type AppointmentCompletedEvent = z.infer<typeof AppointmentCompletedEventSchema>;
export type AppointmentCancelledEvent = z.infer<typeof AppointmentCancelledEventSchema>;
export type CycleLoggedEvent = z.infer<typeof CycleLoggedEventSchema>;
export type HabitCompletedEvent = z.infer<typeof HabitCompletedEventSchema>;
export type ChallengeJoinedEvent = z.infer<typeof ChallengeJoinedEventSchema>;
export type ChallengeCompletedEvent = z.infer<typeof ChallengeCompletedEventSchema>;
export type HealthScoreUpdatedEvent = z.infer<typeof HealthScoreUpdatedEventSchema>;
export type AIInterpretedEvent = z.infer<typeof AIInterpretedEventSchema>;
export type SymptomAssessedEvent = z.infer<typeof SymptomAssessedEventSchema>;
export type CopilotInteractionEvent = z.infer<typeof CopilotInteractionEventSchema>;
export type RiskDetectedEvent = z.infer<typeof RiskDetectedEventSchema>;
export type AlertTriggeredEvent = z.infer<typeof AlertTriggeredEventSchema>;
export type EmergencyDetectedEvent = z.infer<typeof EmergencyDetectedEventSchema>;
export type ProfileCreatedEvent = z.infer<typeof ProfileCreatedEventSchema>;
export type ProfileUpdatedEvent = z.infer<typeof ProfileUpdatedEventSchema>;
export type FamilyAddedEvent = z.infer<typeof FamilyAddedEventSchema>;
export type ConsentUpdatedEvent = z.infer<typeof ConsentUpdatedEventSchema>;
export type OrderCreatedEvent = z.infer<typeof OrderCreatedEventSchema>;
export type OrderCompletedEvent = z.infer<typeof OrderCompletedEventSchema>;
export declare const EVENT_TYPES: {
    readonly RECORD_UPLOADED: "risa.health.record.uploaded";
    readonly RECORD_PROCESSING_STARTED: "risa.health.record.processing.started";
    readonly RECORD_PROCESSING_COMPLETED: "risa.health.record.processing.completed";
    readonly RECORD_PROCESSING_FAILED: "risa.health.record.processing.failed";
    readonly RECORD_INTERPRETED: "risa.health.record.interpreted";
    readonly RECORD_DELETED: "risa.health.record.deleted";
    readonly RECORD_SHARED: "risa.health.record.shared";
    readonly APPOINTMENT_BOOKED: "risa.health.appointment.booked";
    readonly APPOINTMENT_CONFIRMED: "risa.health.appointment.confirmed";
    readonly APPOINTMENT_COMPLETED: "risa.health.appointment.completed";
    readonly APPOINTMENT_CANCELLED: "risa.health.appointment.cancelled";
    readonly CYCLE_LOGGED: "risa.health.cycle.logged";
    readonly HABIT_COMPLETED: "risa.health.habit.completed";
    readonly CHALLENGE_JOINED: "risa.health.challenge.joined";
    readonly CHALLENGE_COMPLETED: "risa.health.challenge.completed";
    readonly SCORE_UPDATED: "risa.health.score.updated";
    readonly AI_INTERPRETED: "risa.health.ai.interpreted";
    readonly SYMPTOM_ASSESSED: "risa.health.symptom.assessed";
    readonly COPILOT_INTERACTION: "risa.health.copilot.interaction";
    readonly RISK_DETECTED: "risa.health.risk.detected";
    readonly ALERT_TRIGGERED: "risa.health.alert.triggered";
    readonly EMERGENCY_DETECTED: "risa.health.emergency.detected";
    readonly PROFILE_CREATED: "risa.health.profile.created";
    readonly PROFILE_UPDATED: "risa.health.profile.updated";
    readonly FAMILY_ADDED: "risa.health.family.added";
    readonly CONSENT_UPDATED: "risa.health.consent.updated";
    readonly ORDER_CREATED: "risa.health.order.created";
    readonly ORDER_COMPLETED: "risa.health.order.completed";
};
export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];
export declare const EVENT_SCHEMA_MAP: Record<string, z.ZodSchema>;

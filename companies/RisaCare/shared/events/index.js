"use strict";
// RisaCare Shared Events - Event Definitions for Event Bus
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVENT_SCHEMA_MAP = exports.EVENT_TYPES = exports.OrderCompletedEventSchema = exports.OrderCreatedEventSchema = exports.ConsentUpdatedEventSchema = exports.FamilyAddedEventSchema = exports.ProfileUpdatedEventSchema = exports.ProfileCreatedEventSchema = exports.EmergencyDetectedEventSchema = exports.AlertTriggeredEventSchema = exports.RiskDetectedEventSchema = exports.CopilotInteractionEventSchema = exports.SymptomAssessedEventSchema = exports.AIInterpretedEventSchema = exports.HealthScoreUpdatedEventSchema = exports.ChallengeCompletedEventSchema = exports.ChallengeJoinedEventSchema = exports.HabitCompletedEventSchema = exports.CycleLoggedEventSchema = exports.AppointmentCancelledEventSchema = exports.AppointmentCompletedEventSchema = exports.AppointmentConfirmedEventSchema = exports.AppointmentBookedEventSchema = exports.RecordSharedEventSchema = exports.RecordDeletedEventSchema = exports.RecordInterpretedEventSchema = exports.RecordProcessingFailedEventSchema = exports.RecordProcessingCompletedEventSchema = exports.RecordProcessingStartedEventSchema = exports.RecordUploadedEventSchema = exports.HealthEventSchema = exports.BaseEventSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("../types");
// ============================================
// BASE EVENT SCHEMAS
// ============================================
exports.BaseEventSchema = zod_1.z.object({
    eventId: zod_1.z.string().uuid(),
    eventType: zod_1.z.string(),
    version: zod_1.z.string().default('1.0'),
    timestamp: zod_1.z.string().datetime(),
    source: zod_1.z.object({
        service: zod_1.z.string(),
        version: zod_1.z.string().optional(),
        instanceId: zod_1.z.string().optional()
    }),
    correlationId: zod_1.z.string().uuid().optional(),
    causationId: zod_1.z.string().uuid().optional()
});
exports.HealthEventSchema = exports.BaseEventSchema.extend({
    userId: zod_1.z.string(),
    profileId: zod_1.z.string().uuid().optional()
});
// ============================================
// RECORD EVENTS
// ============================================
exports.RecordUploadedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.record.uploaded'),
    data: zod_1.z.object({
        recordId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        type: types_1.HealthDocumentTypeSchema,
        title: zod_1.z.string(),
        file: zod_1.z.object({
            filename: zod_1.z.string(),
            mimeType: zod_1.z.string(),
            size: zod_1.z.number(),
            storageKey: zod_1.z.string()
        }),
        processing: zod_1.z.object({
            status: zod_1.z.enum(['pending']),
            estimatedCompletionTime: zod_1.z.string().datetime().optional()
        }),
        metadata: zod_1.z.object({
            uploadSource: zod_1.z.enum(['mobile', 'web', 'api', 'wearable']).optional()
        }).optional()
    })
});
exports.RecordProcessingStartedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.record.processing.started'),
    data: zod_1.z.object({
        recordId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        ocrJobId: zod_1.z.string(),
        fileType: zod_1.z.string(),
        estimatedDurationSeconds: zod_1.z.number().optional()
    })
});
exports.RecordProcessingCompletedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.record.processing.completed'),
    data: zod_1.z.object({
        recordId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        processingDurationMs: zod_1.z.number(),
        ocr: zod_1.z.object({
            confidence: zod_1.z.number().min(0).max(1),
            pagesProcessed: zod_1.z.number()
        }),
        extraction: zod_1.z.object({
            confidence: zod_1.z.number().min(0).max(1),
            biomarkersExtracted: zod_1.z.number(),
            dateIdentified: zod_1.z.boolean(),
            doctorIdentified: zod_1.z.boolean(),
            labIdentified: zod_1.z.boolean()
        }),
        category: types_1.HealthCategorySchema.optional(),
        isAbnormal: zod_1.z.boolean(),
        hasFollowUpRequired: zod_1.z.boolean()
    })
});
exports.RecordProcessingFailedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.record.processing.failed'),
    data: zod_1.z.object({
        recordId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        error: zod_1.z.object({
            code: zod_1.z.string(),
            message: zod_1.z.string(),
            stage: zod_1.z.enum(['ocr', 'extraction', 'categorization'])
        }),
        retryable: zod_1.z.boolean(),
        retryCount: zod_1.z.number()
    })
});
exports.RecordInterpretedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.record.interpreted'),
    data: zod_1.z.object({
        recordId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        interpretation: zod_1.z.object({
            biomarkersInterpreted: zod_1.z.number(),
            confidence: zod_1.z.number(),
            needsDoctorConsult: zod_1.z.boolean(),
            urgency: zod_1.z.enum(['low', 'medium', 'high'])
        }),
        riskSignalsGenerated: zod_1.z.number(),
        processingTimeMs: zod_1.z.number()
    })
});
exports.RecordDeletedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.record.deleted'),
    data: zod_1.z.object({
        recordId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        fileStorageKeys: zod_1.z.array(zod_1.z.string()),
        deletedBy: zod_1.z.enum(['user', 'system', 'admin']),
        reason: zod_1.z.string().optional()
    })
});
exports.RecordSharedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.record.shared'),
    data: zod_1.z.object({
        recordId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        sharedWith: zod_1.z.object({
            entityType: zod_1.z.enum(['doctor', 'lab', 'hospital']),
            entityId: zod_1.z.string(),
            entityName: zod_1.z.string()
        }),
        consentId: zod_1.z.string(),
        expiresAt: zod_1.z.string().datetime().optional(),
        accessScope: zod_1.z.enum(['full', 'summary']).default('summary')
    })
});
// ============================================
// APPOINTMENT EVENTS
// ============================================
exports.AppointmentBookedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.appointment.booked'),
    data: zod_1.z.object({
        appointmentId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        providerType: types_1.ProviderTypeSchema,
        providerId: zod_1.z.string(),
        providerName: zod_1.z.string(),
        type: types_1.AppointmentTypeSchema,
        schedule: zod_1.z.object({
            date: zod_1.z.string(),
            startTime: zod_1.z.string(),
            mode: zod_1.z.string()
        }),
        payment: zod_1.z.object({
            amount: zod_1.z.number(),
            currency: zod_1.z.string(),
            method: zod_1.z.string(),
            transactionId: zod_1.z.string()
        }),
        isFirstVisit: zod_1.z.boolean()
    })
});
exports.AppointmentConfirmedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.appointment.confirmed'),
    data: zod_1.z.object({
        appointmentId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        providerType: types_1.ProviderTypeSchema,
        providerId: zod_1.z.string(),
        meetingLink: zod_1.z.string().url().optional(),
        reminders: zod_1.z.object({
            reminder24h: zod_1.z.string().datetime(),
            reminder1h: zod_1.z.string().datetime()
        })
    })
});
exports.AppointmentCompletedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.appointment.completed'),
    data: zod_1.z.object({
        appointmentId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        providerType: types_1.ProviderTypeSchema,
        providerId: zod_1.z.string(),
        duration: zod_1.z.number(),
        completedAt: zod_1.z.string().datetime(),
        followUpRequired: zod_1.z.boolean(),
        followUpAppointmentId: zod_1.z.string().optional(),
        prescriptionIssued: zod_1.z.boolean().optional(),
        testsOrdered: zod_1.z.boolean().optional(),
        notes: zod_1.z.string().optional()
    })
});
exports.AppointmentCancelledEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.appointment.cancelled'),
    data: zod_1.z.object({
        appointmentId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        providerType: types_1.ProviderTypeSchema,
        providerId: zod_1.z.string(),
        cancelledBy: zod_1.z.enum(['user', 'provider', 'system']),
        reason: zod_1.z.string(),
        refundId: zod_1.z.string().optional(),
        refundAmount: zod_1.z.number().optional(),
        cancelledAt: zod_1.z.string().datetime()
    })
});
// ============================================
// WELLNESS EVENTS
// ============================================
exports.CycleLoggedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.cycle.logged'),
    data: zod_1.z.object({
        entryId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        date: zod_1.z.string(),
        cycleType: zod_1.z.enum(['period_start', 'period_end', 'spotting', 'intercourse', 'ovulation', 'fertile_window', 'symptom', 'mood']),
        flowIntensity: zod_1.z.enum(['light', 'medium', 'heavy']).optional(),
        symptoms: zod_1.z.array(zod_1.z.string()).optional(),
        mood: zod_1.z.string().optional(),
        cycleDay: zod_1.z.number(),
        predictedNextPeriod: zod_1.z.string().optional()
    })
});
exports.HabitCompletedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.habit.completed'),
    data: zod_1.z.object({
        entryId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        habitType: zod_1.z.enum(['water', 'sleep', 'steps', 'workout', 'meditation', 'nutrition']),
        value: zod_1.z.number(),
        unit: zod_1.z.string().optional(),
        goal: zod_1.z.number(),
        goalAchieved: zod_1.z.boolean(),
        currentStreak: zod_1.z.number(),
        totalStreak: zod_1.z.number(),
        source: zod_1.z.enum(['manual', 'wearable', 'integration'])
    })
});
exports.ChallengeJoinedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.challenge.joined'),
    data: zod_1.z.object({
        challengeId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        challengeName: zod_1.z.string(),
        challengeType: zod_1.z.string(),
        duration: zod_1.z.object({
            startDate: zod_1.z.string(),
            endDate: zod_1.z.string()
        }),
        requirements: zod_1.z.object({
            dailyGoal: zod_1.z.number(),
            totalDays: zod_1.z.number()
        }),
        rewards: zod_1.z.object({
            coins: zod_1.z.number(),
            badge: zod_1.z.string().optional()
        })
    })
});
exports.ChallengeCompletedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.challenge.completed'),
    data: zod_1.z.object({
        challengeId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        challengeName: zod_1.z.string(),
        completedAt: zod_1.z.string().datetime(),
        finalStreak: zod_1.z.number(),
        totalPoints: zod_1.z.number(),
        completedDays: zod_1.z.number(),
        rewardsEarned: zod_1.z.object({
            coins: zod_1.z.number(),
            badge: zod_1.z.string().optional(),
            cashback: zod_1.z.number().optional()
        })
    })
});
exports.HealthScoreUpdatedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.score.updated'),
    data: zod_1.z.object({
        profileId: zod_1.z.string().uuid(),
        score: zod_1.z.number(),
        grade: zod_1.z.string(),
        trend: zod_1.z.enum(['improving', 'stable', 'declining']),
        components: zod_1.z.object({
            preventive: zod_1.z.number(),
            activity: zod_1.z.number(),
            lifestyle: zod_1.z.number(),
            biomarkers: zod_1.z.number(),
            engagement: zod_1.z.number()
        }),
        badges: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            name: zod_1.z.string(),
            newlyEarned: zod_1.z.boolean()
        })),
        previousScore: zod_1.z.number().optional(),
        improvement: zod_1.z.number().optional()
    })
});
// ============================================
// AI EVENTS
// ============================================
exports.AIInterpretedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.ai.interpreted'),
    data: zod_1.z.object({
        recordId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        biomarkersInterpreted: zod_1.z.number(),
        confidence: zod_1.z.number(),
        responseTimeMs: zod_1.z.number(),
        model: zod_1.z.string().optional()
    })
});
exports.SymptomAssessedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.symptom.assessed'),
    data: zod_1.z.object({
        sessionId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        symptoms: zod_1.z.array(zod_1.z.string()),
        urgency: zod_1.z.enum(['self_care', 'consult_doctor', 'urgent_care', 'emergency']),
        recommendedSpecialty: zod_1.z.string().optional(),
        recommendedTests: zod_1.z.array(zod_1.z.string()).optional(),
        confidence: zod_1.z.number(),
        responseTimeMs: zod_1.z.number(),
        emergencyDetected: zod_1.z.boolean()
    })
});
exports.CopilotInteractionEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.copilot.interaction'),
    data: zod_1.z.object({
        sessionId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        task: types_1.CopilotTaskSchema,
        userMessage: zod_1.z.string(),
        aiResponse: zod_1.z.string().optional(),
        confidence: zod_1.z.number(),
        actionsTriggered: zod_1.z.array(zod_1.z.object({
            type: zod_1.z.string(),
            label: zod_1.z.string(),
            payload: zod_1.z.record(zod_1.z.unknown())
        })),
        responseTimeMs: zod_1.z.number(),
        feedbackGiven: zod_1.z.enum(['positive', 'negative']).optional()
    })
});
// ============================================
// RISK & ALERT EVENTS
// ============================================
exports.RiskDetectedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.risk.detected'),
    data: zod_1.z.object({
        riskId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        signalType: types_1.RiskSignalTypeSchema,
        severity: types_1.RiskSeveritySchema,
        title: zod_1.z.string(),
        description: zod_1.z.string(),
        sourceBiomarkers: zod_1.z.array(zod_1.z.string()).optional(),
        recommendedAction: zod_1.z.object({
            type: zod_1.z.enum(['self_care', 'consult_doctor', 'urgent_care', 'emergency']),
            description: zod_1.z.string()
        }),
        riskScore: zod_1.z.number().optional()
    })
});
exports.AlertTriggeredEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.alert.triggered'),
    data: zod_1.z.object({
        alertId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        alertType: zod_1.z.enum(['checkup_due', 'vaccination_due', 'medication_due', 'followup_due', 'preventive']),
        title: zod_1.z.string(),
        description: zod_1.z.string(),
        priority: zod_1.z.enum(['low', 'medium', 'high']),
        actionRequired: zod_1.z.boolean(),
        actionItems: zod_1.z.array(zod_1.z.string()).optional(),
        deadline: zod_1.z.string().datetime().optional()
    })
});
exports.EmergencyDetectedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.emergency.detected'),
    data: zod_1.z.object({
        sessionId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        symptoms: zod_1.z.array(zod_1.z.string()),
        severity: zod_1.z.literal('critical'),
        recommendedAction: zod_1.z.enum(['call_emergency', 'go_to_emergency']),
        emergencyNumbers: zod_1.z.array(zod_1.z.string()),
        locationShared: zod_1.z.boolean().optional(),
        notificationSent: zod_1.z.object({
            emergencyContacts: zod_1.z.boolean(),
            medicalServices: zod_1.z.boolean()
        })
    })
});
// ============================================
// PROFILE EVENTS
// ============================================
exports.ProfileCreatedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.profile.created'),
    data: zod_1.z.object({
        profileId: zod_1.z.string().uuid(),
        userId: zod_1.z.string(),
        relationship: zod_1.z.string(),
        name: zod_1.z.string(),
        age: zod_1.z.number().optional(),
        gender: zod_1.z.string(),
        isPrimary: zod_1.z.boolean(),
        hasHealthData: zod_1.z.boolean()
    })
});
exports.ProfileUpdatedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.profile.updated'),
    data: zod_1.z.object({
        profileId: zod_1.z.string().uuid(),
        userId: zod_1.z.string(),
        changes: zod_1.z.array(zod_1.z.object({
            field: zod_1.z.string(),
            previousValue: zod_1.z.unknown().optional(),
            newValue: zod_1.z.unknown().optional()
        })),
        source: zod_1.z.enum(['user', 'api', 'wearable'])
    })
});
exports.FamilyAddedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.family.added'),
    data: zod_1.z.object({
        userId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        memberProfileId: zod_1.z.string().uuid(),
        relationship: zod_1.z.string(),
        name: zod_1.z.string(),
        age: zod_1.z.number().optional(),
        hasHealthData: zod_1.z.boolean()
    })
});
exports.ConsentUpdatedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.consent.updated'),
    data: zod_1.z.object({
        userId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        consentType: zod_1.z.enum(['share', 'analytics', 'research', 'third_party']),
        action: zod_1.z.enum(['given', 'withdrawn']),
        version: zod_1.z.string(),
        timestamp: zod_1.z.string().datetime()
    })
});
// ============================================
// COMMERCE EVENTS
// ============================================
exports.OrderCreatedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.order.created'),
    data: zod_1.z.object({
        orderId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        orderType: zod_1.z.enum(['lab_test', 'health_package', 'medicine']),
        items: zod_1.z.array(zod_1.z.object({
            itemId: zod_1.z.string(),
            name: zod_1.z.string(),
            quantity: zod_1.z.number(),
            price: zod_1.z.number()
        })),
        labId: zod_1.z.string().optional(),
        pharmacyId: zod_1.z.string().optional(),
        totalAmount: zod_1.z.number(),
        discount: zod_1.z.number().optional(),
        paymentMethod: zod_1.z.string(),
        homeCollection: zod_1.z.object({
            address: zod_1.z.record(zod_1.z.unknown()),
            preferredSlot: zod_1.z.string()
        }).optional()
    })
});
exports.OrderCompletedEventSchema = exports.HealthEventSchema.extend({
    eventType: zod_1.z.literal('risa.health.order.completed'),
    data: zod_1.z.object({
        orderId: zod_1.z.string(),
        profileId: zod_1.z.string().uuid(),
        orderType: zod_1.z.string(),
        completedAt: zod_1.z.string().datetime(),
        deliveryMethod: zod_1.z.enum(['home_collection', 'pickup', 'digital']),
        reportRecordId: zod_1.z.string().optional(),
        commissionEarned: zod_1.z.number().optional()
    })
});
// ============================================
// EVENT TYPE REGISTRY
// ============================================
exports.EVENT_TYPES = {
    // Record events
    RECORD_UPLOADED: 'risa.health.record.uploaded',
    RECORD_PROCESSING_STARTED: 'risa.health.record.processing.started',
    RECORD_PROCESSING_COMPLETED: 'risa.health.record.processing.completed',
    RECORD_PROCESSING_FAILED: 'risa.health.record.processing.failed',
    RECORD_INTERPRETED: 'risa.health.record.interpreted',
    RECORD_DELETED: 'risa.health.record.deleted',
    RECORD_SHARED: 'risa.health.record.shared',
    // Appointment events
    APPOINTMENT_BOOKED: 'risa.health.appointment.booked',
    APPOINTMENT_CONFIRMED: 'risa.health.appointment.confirmed',
    APPOINTMENT_COMPLETED: 'risa.health.appointment.completed',
    APPOINTMENT_CANCELLED: 'risa.health.appointment.cancelled',
    // Wellness events
    CYCLE_LOGGED: 'risa.health.cycle.logged',
    HABIT_COMPLETED: 'risa.health.habit.completed',
    CHALLENGE_JOINED: 'risa.health.challenge.joined',
    CHALLENGE_COMPLETED: 'risa.health.challenge.completed',
    SCORE_UPDATED: 'risa.health.score.updated',
    // AI events
    AI_INTERPRETED: 'risa.health.ai.interpreted',
    SYMPTOM_ASSESSED: 'risa.health.symptom.assessed',
    COPILOT_INTERACTION: 'risa.health.copilot.interaction',
    // Risk events
    RISK_DETECTED: 'risa.health.risk.detected',
    ALERT_TRIGGERED: 'risa.health.alert.triggered',
    EMERGENCY_DETECTED: 'risa.health.emergency.detected',
    // Profile events
    PROFILE_CREATED: 'risa.health.profile.created',
    PROFILE_UPDATED: 'risa.health.profile.updated',
    FAMILY_ADDED: 'risa.health.family.added',
    CONSENT_UPDATED: 'risa.health.consent.updated',
    // Commerce events
    ORDER_CREATED: 'risa.health.order.created',
    ORDER_COMPLETED: 'risa.health.order.completed'
};
// ============================================
// EVENT SCHEMA REGISTRY
// ============================================
exports.EVENT_SCHEMA_MAP = {
    [exports.EVENT_TYPES.RECORD_UPLOADED]: exports.RecordUploadedEventSchema,
    [exports.EVENT_TYPES.RECORD_PROCESSING_STARTED]: exports.RecordProcessingStartedEventSchema,
    [exports.EVENT_TYPES.RECORD_PROCESSING_COMPLETED]: exports.RecordProcessingCompletedEventSchema,
    [exports.EVENT_TYPES.RECORD_PROCESSING_FAILED]: exports.RecordProcessingFailedEventSchema,
    [exports.EVENT_TYPES.RECORD_INTERPRETED]: exports.RecordInterpretedEventSchema,
    [exports.EVENT_TYPES.RECORD_DELETED]: exports.RecordDeletedEventSchema,
    [exports.EVENT_TYPES.RECORD_SHARED]: exports.RecordSharedEventSchema,
    [exports.EVENT_TYPES.APPOINTMENT_BOOKED]: exports.AppointmentBookedEventSchema,
    [exports.EVENT_TYPES.APPOINTMENT_CONFIRMED]: exports.AppointmentConfirmedEventSchema,
    [exports.EVENT_TYPES.APPOINTMENT_COMPLETED]: exports.AppointmentCompletedEventSchema,
    [exports.EVENT_TYPES.APPOINTMENT_CANCELLED]: exports.AppointmentCancelledEventSchema,
    [exports.EVENT_TYPES.CYCLE_LOGGED]: exports.CycleLoggedEventSchema,
    [exports.EVENT_TYPES.HABIT_COMPLETED]: exports.HabitCompletedEventSchema,
    [exports.EVENT_TYPES.CHALLENGE_JOINED]: exports.ChallengeJoinedEventSchema,
    [exports.EVENT_TYPES.CHALLENGE_COMPLETED]: exports.ChallengeCompletedEventSchema,
    [exports.EVENT_TYPES.SCORE_UPDATED]: exports.HealthScoreUpdatedEventSchema,
    [exports.EVENT_TYPES.AI_INTERPRETED]: exports.AIInterpretedEventSchema,
    [exports.EVENT_TYPES.SYMPTOM_ASSESSED]: exports.SymptomAssessedEventSchema,
    [exports.EVENT_TYPES.COPILOT_INTERACTION]: exports.CopilotInteractionEventSchema,
    [exports.EVENT_TYPES.RISK_DETECTED]: exports.RiskDetectedEventSchema,
    [exports.EVENT_TYPES.ALERT_TRIGGERED]: exports.AlertTriggeredEventSchema,
    [exports.EVENT_TYPES.EMERGENCY_DETECTED]: exports.EmergencyDetectedEventSchema,
    [exports.EVENT_TYPES.PROFILE_CREATED]: exports.ProfileCreatedEventSchema,
    [exports.EVENT_TYPES.PROFILE_UPDATED]: exports.ProfileUpdatedEventSchema,
    [exports.EVENT_TYPES.FAMILY_ADDED]: exports.FamilyAddedEventSchema,
    [exports.EVENT_TYPES.CONSENT_UPDATED]: exports.ConsentUpdatedEventSchema,
    [exports.EVENT_TYPES.ORDER_CREATED]: exports.OrderCreatedEventSchema,
    [exports.EVENT_TYPES.ORDER_COMPLETED]: exports.OrderCompletedEventSchema
};
//# sourceMappingURL=index.js.map
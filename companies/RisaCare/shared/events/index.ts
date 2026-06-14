// RisaCare Shared Events - Event Definitions for Event Bus

import { z } from 'zod';
import {
  HealthDocumentTypeSchema,
  HealthCategorySchema,
  ProviderTypeSchema,
  AppointmentTypeSchema,
  WellnessTypeSchema,
  RiskSignalTypeSchema,
  RiskSeveritySchema,
  CopilotTaskSchema
} from '../types';

// ============================================
// BASE EVENT SCHEMAS
// ============================================

export const BaseEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.string(),
  version: z.string().default('1.0'),
  timestamp: z.string().datetime(),
  source: z.object({
    service: z.string(),
    version: z.string().optional(),
    instanceId: z.string().optional()
  }),
  correlationId: z.string().uuid().optional(),
  causationId: z.string().uuid().optional()
});

export const HealthEventSchema = BaseEventSchema.extend({
  userId: z.string(),
  profileId: z.string().uuid().optional()
});

// ============================================
// RECORD EVENTS
// ============================================

export const RecordUploadedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.record.uploaded'),
  data: z.object({
    recordId: z.string(),
    profileId: z.string().uuid(),
    type: HealthDocumentTypeSchema,
    title: z.string(),
    file: z.object({
      filename: z.string(),
      mimeType: z.string(),
      size: z.number(),
      storageKey: z.string()
    }),
    processing: z.object({
      status: z.enum(['pending']),
      estimatedCompletionTime: z.string().datetime().optional()
    }),
    metadata: z.object({
      uploadSource: z.enum(['mobile', 'web', 'api', 'wearable']).optional()
    }).optional()
  })
});

export const RecordProcessingStartedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.record.processing.started'),
  data: z.object({
    recordId: z.string(),
    profileId: z.string().uuid(),
    ocrJobId: z.string(),
    fileType: z.string(),
    estimatedDurationSeconds: z.number().optional()
  })
});

export const RecordProcessingCompletedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.record.processing.completed'),
  data: z.object({
    recordId: z.string(),
    profileId: z.string().uuid(),
    processingDurationMs: z.number(),
    ocr: z.object({
      confidence: z.number().min(0).max(1),
      pagesProcessed: z.number()
    }),
    extraction: z.object({
      confidence: z.number().min(0).max(1),
      biomarkersExtracted: z.number(),
      dateIdentified: z.boolean(),
      doctorIdentified: z.boolean(),
      labIdentified: z.boolean()
    }),
    category: HealthCategorySchema.optional(),
    isAbnormal: z.boolean(),
    hasFollowUpRequired: z.boolean()
  })
});

export const RecordProcessingFailedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.record.processing.failed'),
  data: z.object({
    recordId: z.string(),
    profileId: z.string().uuid(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      stage: z.enum(['ocr', 'extraction', 'categorization'])
    }),
    retryable: z.boolean(),
    retryCount: z.number()
  })
});

export const RecordInterpretedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.record.interpreted'),
  data: z.object({
    recordId: z.string(),
    profileId: z.string().uuid(),
    interpretation: z.object({
      biomarkersInterpreted: z.number(),
      confidence: z.number(),
      needsDoctorConsult: z.boolean(),
      urgency: z.enum(['low', 'medium', 'high'])
    }),
    riskSignalsGenerated: z.number(),
    processingTimeMs: z.number()
  })
});

export const RecordDeletedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.record.deleted'),
  data: z.object({
    recordId: z.string(),
    profileId: z.string().uuid(),
    fileStorageKeys: z.array(z.string()),
    deletedBy: z.enum(['user', 'system', 'admin']),
    reason: z.string().optional()
  })
});

export const RecordSharedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.record.shared'),
  data: z.object({
    recordId: z.string(),
    profileId: z.string().uuid(),
    sharedWith: z.object({
      entityType: z.enum(['doctor', 'lab', 'hospital']),
      entityId: z.string(),
      entityName: z.string()
    }),
    consentId: z.string(),
    expiresAt: z.string().datetime().optional(),
    accessScope: z.enum(['full', 'summary']).default('summary')
  })
});

// ============================================
// APPOINTMENT EVENTS
// ============================================

export const AppointmentBookedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.appointment.booked'),
  data: z.object({
    appointmentId: z.string(),
    profileId: z.string().uuid(),
    providerType: ProviderTypeSchema,
    providerId: z.string(),
    providerName: z.string(),
    type: AppointmentTypeSchema,
    schedule: z.object({
      date: z.string(),
      startTime: z.string(),
      mode: z.string()
    }),
    payment: z.object({
      amount: z.number(),
      currency: z.string(),
      method: z.string(),
      transactionId: z.string()
    }),
    isFirstVisit: z.boolean()
  })
});

export const AppointmentConfirmedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.appointment.confirmed'),
  data: z.object({
    appointmentId: z.string(),
    profileId: z.string().uuid(),
    providerType: ProviderTypeSchema,
    providerId: z.string(),
    meetingLink: z.string().url().optional(),
    reminders: z.object({
      reminder24h: z.string().datetime(),
      reminder1h: z.string().datetime()
    })
  })
});

export const AppointmentCompletedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.appointment.completed'),
  data: z.object({
    appointmentId: z.string(),
    profileId: z.string().uuid(),
    providerType: ProviderTypeSchema,
    providerId: z.string(),
    duration: z.number(),
    completedAt: z.string().datetime(),
    followUpRequired: z.boolean(),
    followUpAppointmentId: z.string().optional(),
    prescriptionIssued: z.boolean().optional(),
    testsOrdered: z.boolean().optional(),
    notes: z.string().optional()
  })
});

export const AppointmentCancelledEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.appointment.cancelled'),
  data: z.object({
    appointmentId: z.string(),
    profileId: z.string().uuid(),
    providerType: ProviderTypeSchema,
    providerId: z.string(),
    cancelledBy: z.enum(['user', 'provider', 'system']),
    reason: z.string(),
    refundId: z.string().optional(),
    refundAmount: z.number().optional(),
    cancelledAt: z.string().datetime()
  })
});

// ============================================
// WELLNESS EVENTS
// ============================================

export const CycleLoggedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.cycle.logged'),
  data: z.object({
    entryId: z.string(),
    profileId: z.string().uuid(),
    date: z.string(),
    cycleType: z.enum(['period_start', 'period_end', 'spotting', 'intercourse', 'ovulation', 'fertile_window', 'symptom', 'mood']),
    flowIntensity: z.enum(['light', 'medium', 'heavy']).optional(),
    symptoms: z.array(z.string()).optional(),
    mood: z.string().optional(),
    cycleDay: z.number(),
    predictedNextPeriod: z.string().optional()
  })
});

export const HabitCompletedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.habit.completed'),
  data: z.object({
    entryId: z.string(),
    profileId: z.string().uuid(),
    habitType: z.enum(['water', 'sleep', 'steps', 'workout', 'meditation', 'nutrition']),
    value: z.number(),
    unit: z.string().optional(),
    goal: z.number(),
    goalAchieved: z.boolean(),
    currentStreak: z.number(),
    totalStreak: z.number(),
    source: z.enum(['manual', 'wearable', 'integration'])
  })
});

export const ChallengeJoinedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.challenge.joined'),
  data: z.object({
    challengeId: z.string(),
    profileId: z.string().uuid(),
    challengeName: z.string(),
    challengeType: z.string(),
    duration: z.object({
      startDate: z.string(),
      endDate: z.string()
    }),
    requirements: z.object({
      dailyGoal: z.number(),
      totalDays: z.number()
    }),
    rewards: z.object({
      coins: z.number(),
      badge: z.string().optional()
    })
  })
});

export const ChallengeCompletedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.challenge.completed'),
  data: z.object({
    challengeId: z.string(),
    profileId: z.string().uuid(),
    challengeName: z.string(),
    completedAt: z.string().datetime(),
    finalStreak: z.number(),
    totalPoints: z.number(),
    completedDays: z.number(),
    rewardsEarned: z.object({
      coins: z.number(),
      badge: z.string().optional(),
      cashback: z.number().optional()
    })
  })
});

export const HealthScoreUpdatedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.score.updated'),
  data: z.object({
    profileId: z.string().uuid(),
    score: z.number(),
    grade: z.string(),
    trend: z.enum(['improving', 'stable', 'declining']),
    components: z.object({
      preventive: z.number(),
      activity: z.number(),
      lifestyle: z.number(),
      biomarkers: z.number(),
      engagement: z.number()
    }),
    badges: z.array(z.object({
      id: z.string(),
      name: z.string(),
      newlyEarned: z.boolean()
    })),
    previousScore: z.number().optional(),
    improvement: z.number().optional()
  })
});

// ============================================
// AI EVENTS
// ============================================

export const AIInterpretedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.ai.interpreted'),
  data: z.object({
    recordId: z.string(),
    profileId: z.string().uuid(),
    biomarkersInterpreted: z.number(),
    confidence: z.number(),
    responseTimeMs: z.number(),
    model: z.string().optional()
  })
});

export const SymptomAssessedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.symptom.assessed'),
  data: z.object({
    sessionId: z.string(),
    profileId: z.string().uuid(),
    symptoms: z.array(z.string()),
    urgency: z.enum(['self_care', 'consult_doctor', 'urgent_care', 'emergency']),
    recommendedSpecialty: z.string().optional(),
    recommendedTests: z.array(z.string()).optional(),
    confidence: z.number(),
    responseTimeMs: z.number(),
    emergencyDetected: z.boolean()
  })
});

export const CopilotInteractionEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.copilot.interaction'),
  data: z.object({
    sessionId: z.string(),
    profileId: z.string().uuid(),
    task: CopilotTaskSchema,
    userMessage: z.string(),
    aiResponse: z.string().optional(),
    confidence: z.number(),
    actionsTriggered: z.array(z.object({
      type: z.string(),
      label: z.string(),
      payload: z.record(z.unknown())
    })),
    responseTimeMs: z.number(),
    feedbackGiven: z.enum(['positive', 'negative']).optional()
  })
});

// ============================================
// RISK & ALERT EVENTS
// ============================================

export const RiskDetectedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.risk.detected'),
  data: z.object({
    riskId: z.string(),
    profileId: z.string().uuid(),
    signalType: RiskSignalTypeSchema,
    severity: RiskSeveritySchema,
    title: z.string(),
    description: z.string(),
    sourceBiomarkers: z.array(z.string()).optional(),
    recommendedAction: z.object({
      type: z.enum(['self_care', 'consult_doctor', 'urgent_care', 'emergency']),
      description: z.string()
    }),
    riskScore: z.number().optional()
  })
});

export const AlertTriggeredEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.alert.triggered'),
  data: z.object({
    alertId: z.string(),
    profileId: z.string().uuid(),
    alertType: z.enum(['checkup_due', 'vaccination_due', 'medication_due', 'followup_due', 'preventive']),
    title: z.string(),
    description: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
    actionRequired: z.boolean(),
    actionItems: z.array(z.string()).optional(),
    deadline: z.string().datetime().optional()
  })
});

export const EmergencyDetectedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.emergency.detected'),
  data: z.object({
    sessionId: z.string(),
    profileId: z.string().uuid(),
    symptoms: z.array(z.string()),
    severity: z.literal('critical'),
    recommendedAction: z.enum(['call_emergency', 'go_to_emergency']),
    emergencyNumbers: z.array(z.string()),
    locationShared: z.boolean().optional(),
    notificationSent: z.object({
      emergencyContacts: z.boolean(),
      medicalServices: z.boolean()
    })
  })
});

// ============================================
// PROFILE EVENTS
// ============================================

export const ProfileCreatedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.profile.created'),
  data: z.object({
    profileId: z.string().uuid(),
    userId: z.string(),
    relationship: z.string(),
    name: z.string(),
    age: z.number().optional(),
    gender: z.string(),
    isPrimary: z.boolean(),
    hasHealthData: z.boolean()
  })
});

export const ProfileUpdatedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.profile.updated'),
  data: z.object({
    profileId: z.string().uuid(),
    userId: z.string(),
    changes: z.array(z.object({
      field: z.string(),
      previousValue: z.unknown().optional(),
      newValue: z.unknown().optional()
    })),
    source: z.enum(['user', 'api', 'wearable'])
  })
});

export const FamilyAddedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.family.added'),
  data: z.object({
    userId: z.string(),
    profileId: z.string().uuid(),
    memberProfileId: z.string().uuid(),
    relationship: z.string(),
    name: z.string(),
    age: z.number().optional(),
    hasHealthData: z.boolean()
  })
});

export const ConsentUpdatedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.consent.updated'),
  data: z.object({
    userId: z.string(),
    profileId: z.string().uuid(),
    consentType: z.enum(['share', 'analytics', 'research', 'third_party']),
    action: z.enum(['given', 'withdrawn']),
    version: z.string(),
    timestamp: z.string().datetime()
  })
});

// ============================================
// COMMERCE EVENTS
// ============================================

export const OrderCreatedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.order.created'),
  data: z.object({
    orderId: z.string(),
    profileId: z.string().uuid(),
    orderType: z.enum(['lab_test', 'health_package', 'medicine']),
    items: z.array(z.object({
      itemId: z.string(),
      name: z.string(),
      quantity: z.number(),
      price: z.number()
    })),
    labId: z.string().optional(),
    pharmacyId: z.string().optional(),
    totalAmount: z.number(),
    discount: z.number().optional(),
    paymentMethod: z.string(),
    homeCollection: z.object({
      address: z.record(z.unknown()),
      preferredSlot: z.string()
    }).optional()
  })
});

export const OrderCompletedEventSchema = HealthEventSchema.extend({
  eventType: z.literal('risa.health.order.completed'),
  data: z.object({
    orderId: z.string(),
    profileId: z.string().uuid(),
    orderType: z.string(),
    completedAt: z.string().datetime(),
    deliveryMethod: z.enum(['home_collection', 'pickup', 'digital']),
    reportRecordId: z.string().optional(),
    commissionEarned: z.number().optional()
  })
});

// ============================================
// EVENT TYPES EXPORTS
// ============================================

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

// ============================================
// EVENT TYPE REGISTRY
// ============================================

export const EVENT_TYPES = {
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
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

// ============================================
// EVENT SCHEMA REGISTRY
// ============================================

export const EVENT_SCHEMA_MAP: Record<string, z.ZodSchema> = {
  [EVENT_TYPES.RECORD_UPLOADED]: RecordUploadedEventSchema,
  [EVENT_TYPES.RECORD_PROCESSING_STARTED]: RecordProcessingStartedEventSchema,
  [EVENT_TYPES.RECORD_PROCESSING_COMPLETED]: RecordProcessingCompletedEventSchema,
  [EVENT_TYPES.RECORD_PROCESSING_FAILED]: RecordProcessingFailedEventSchema,
  [EVENT_TYPES.RECORD_INTERPRETED]: RecordInterpretedEventSchema,
  [EVENT_TYPES.RECORD_DELETED]: RecordDeletedEventSchema,
  [EVENT_TYPES.RECORD_SHARED]: RecordSharedEventSchema,
  [EVENT_TYPES.APPOINTMENT_BOOKED]: AppointmentBookedEventSchema,
  [EVENT_TYPES.APPOINTMENT_CONFIRMED]: AppointmentConfirmedEventSchema,
  [EVENT_TYPES.APPOINTMENT_COMPLETED]: AppointmentCompletedEventSchema,
  [EVENT_TYPES.APPOINTMENT_CANCELLED]: AppointmentCancelledEventSchema,
  [EVENT_TYPES.CYCLE_LOGGED]: CycleLoggedEventSchema,
  [EVENT_TYPES.HABIT_COMPLETED]: HabitCompletedEventSchema,
  [EVENT_TYPES.CHALLENGE_JOINED]: ChallengeJoinedEventSchema,
  [EVENT_TYPES.CHALLENGE_COMPLETED]: ChallengeCompletedEventSchema,
  [EVENT_TYPES.SCORE_UPDATED]: HealthScoreUpdatedEventSchema,
  [EVENT_TYPES.AI_INTERPRETED]: AIInterpretedEventSchema,
  [EVENT_TYPES.SYMPTOM_ASSESSED]: SymptomAssessedEventSchema,
  [EVENT_TYPES.COPILOT_INTERACTION]: CopilotInteractionEventSchema,
  [EVENT_TYPES.RISK_DETECTED]: RiskDetectedEventSchema,
  [EVENT_TYPES.ALERT_TRIGGERED]: AlertTriggeredEventSchema,
  [EVENT_TYPES.EMERGENCY_DETECTED]: EmergencyDetectedEventSchema,
  [EVENT_TYPES.PROFILE_CREATED]: ProfileCreatedEventSchema,
  [EVENT_TYPES.PROFILE_UPDATED]: ProfileUpdatedEventSchema,
  [EVENT_TYPES.FAMILY_ADDED]: FamilyAddedEventSchema,
  [EVENT_TYPES.CONSENT_UPDATED]: ConsentUpdatedEventSchema,
  [EVENT_TYPES.ORDER_CREATED]: OrderCreatedEventSchema,
  [EVENT_TYPES.ORDER_COMPLETED]: OrderCompletedEventSchema
};

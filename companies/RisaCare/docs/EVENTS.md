# RisaCare — Event Definitions

---

## Overview

RisaCare uses the REZ Event Bus (Port 4025) for all event-driven communication. This document defines all events emitted and consumed by the health platform.

---

## Event Schema Standards

### Base Event Structure

```typescript
interface BaseEvent {
  eventId: string;           // UUID
  eventType: string;         // e.g., "health.record.uploaded"
  version: string;           // e.g., "1.0"
  timestamp: string;          // ISO 8601
  source: {
    service: string;         // e.g., "health-records-service"
    version: string;
    instanceId: string;
  };
  correlationId?: string;    // For tracing
  causationId?: string;      // Original trigger event
}

interface HealthEvent extends BaseEvent {
  userId: string;
  profileId?: string;
  data: Record<string, unknown>;
}
```

---

## 1. Record Events

### 1.1 health.record.uploaded

Emitted when a user uploads a new health record.

```typescript
interface RecordUploadedEvent extends HealthEvent {
  eventType: 'health.record.uploaded';
  data: {
    recordId: string;
    profileId: string;
    type: HealthDocumentType;
    title: string;
    file: {
      filename: string;
      mimeType: string;
      size: number;
      storageKey: string;
    };
    processing: {
      status: 'pending';
      estimatedCompletionTime?: string;
    };
    metadata: {
      uploadSource: 'mobile' | 'web' | 'api' | 'wearable';
      deviceInfo?: string;
    };
  };
}

// Schema
{
  "type": "object",
  "required": ["eventId", "eventType", "timestamp", "source", "userId", "profileId", "data"],
  "properties": {
    "eventId": { "type": "string", "format": "uuid" },
    "eventType": { "const": "health.record.uploaded" },
    "timestamp": { "type": "string", "format": "date-time" },
    "source": { "$ref": "#/definitions/EventSource" },
    "userId": { "type": "string" },
    "profileId": { "type": "string" },
    "data": {
      "type": "object",
      "required": ["recordId", "profileId", "type", "title", "file"],
      "properties": {
        "recordId": { "type": "string" },
        "profileId": { "type": "string" },
        "type": { "type": "string" },
        "title": { "type": "string" },
        "file": {
          "type": "object",
          "properties": {
            "filename": { "type": "string" },
            "mimeType": { "type": "string" },
            "size": { "type": "number" },
            "storageKey": { "type": "string" }
          }
        },
        "processing": {
          "type": "object",
          "properties": {
            "status": { "type": "string" },
            "estimatedCompletionTime": { "type": "string" }
          }
        }
      }
    }
  }
}
```

### 1.2 health.record.processing.started

Emitted when OCR processing begins.

```typescript
interface RecordProcessingStartedEvent extends HealthEvent {
  eventType: 'health.record.processing.started';
  data: {
    recordId: string;
    profileId: string;
    ocrJobId: string;
    fileType: string;
    estimatedDurationSeconds: number;
  };
}
```

### 1.3 health.record.processing.completed

Emitted when OCR and extraction are complete.

```typescript
interface RecordProcessingCompletedEvent extends HealthEvent {
  eventType: 'health.record.processing.completed';
  data: {
    recordId: string;
    profileId: string;
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
    category: HealthCategory;
    isAbnormal: boolean;
    hasFollowUpRequired: boolean;
  };
}
```

### 1.4 health.record.processing.failed

Emitted when processing fails.

```typescript
interface RecordProcessingFailedEvent extends HealthEvent {
  eventType: 'health.record.processing.failed';
  data: {
    recordId: string;
    profileId: string;
    error: {
      code: string;
      message: string;
      stage: 'ocr' | 'extraction' | 'categorization';
    };
    retryable: boolean;
    retryCount: number;
  };
}
```

### 1.5 health.record.interpreted

Emitted when AI interprets a record.

```typescript
interface RecordInterpretedEvent extends HealthEvent {
  eventType: 'health.record.interpreted';
  data: {
    recordId: string;
    profileId: string;
    interpretation: {
      biomarkersInterpreted: number;
      confidence: number;
      needsDoctorConsult: boolean;
      urgency: 'low' | 'medium' | 'high';
    };
    riskSignalsGenerated: number;
    processingTimeMs: number;
  };
}
```

### 1.6 health.record.deleted

Emitted when a record is deleted.

```typescript
interface RecordDeletedEvent extends HealthEvent {
  eventType: 'health.record.deleted';
  data: {
    recordId: string;
    profileId: string;
    fileStorageKeys: string[];
    deletedBy: 'user' | 'system' | 'admin';
    reason?: string;
  };
}
```

### 1.7 health.record.shared

Emitted when a record is shared with a provider.

```typescript
interface RecordSharedEvent extends HealthEvent {
  eventType: 'health.record.shared';
  data: {
    recordId: string;
    profileId: string;
    sharedWith: {
      entityType: 'doctor' | 'lab' | 'hospital';
      entityId: string;
      entityName: string;
    };
    consentId: string;
    expiresAt?: string;
    accessScope: 'full' | 'summary';
  };
}
```

---

## 2. Appointment Events

### 2.1 health.appointment.booked

Emitted when an appointment is created.

```typescript
interface AppointmentBookedEvent extends HealthEvent {
  eventType: 'health.appointment.booked';
  data: {
    appointmentId: string;
    profileId: string;
    providerType: 'doctor' | 'lab' | 'wellness';
    providerId: string;
    providerName: string;
    type: 'consultation' | 'follow_up' | 'diagnostic_test' | 'teleconsult';
    schedule: {
      date: string;
      startTime: string;
      mode: string;
    };
    payment: {
      amount: number;
      currency: string;
      method: string;
      transactionId: string;
    };
    isFirstVisit: boolean;
  };
}
```

### 2.2 health.appointment.confirmed

Emitted when an appointment is confirmed.

```typescript
interface AppointmentConfirmedEvent extends HealthEvent {
  eventType: 'health.appointment.confirmed';
  data: {
    appointmentId: string;
    profileId: string;
    providerType: string;
    providerId: string;
    meetingLink?: string;
    reminders: {
      reminder24h: string;    // Scheduled time
      reminder1h: string;
    };
  };
}
```

### 2.3 health.appointment.started

Emitted when a teleconsult or appointment begins.

```typescript
interface AppointmentStartedEvent extends HealthEvent {
  eventType: 'health.appointment.started';
  data: {
    appointmentId: string;
    profileId: string;
    providerType: string;
    providerId: string;
    startTime: string;
    meetingId?: string;
  };
}
```

### 2.4 health.appointment.completed

Emitted when an appointment is completed.

```typescript
interface AppointmentCompletedEvent extends HealthEvent {
  eventType: 'health.appointment.completed';
  data: {
    appointmentId: string;
    profileId: string;
    providerType: string;
    providerId: string;
    duration: number;         // minutes
    completedAt: string;
    followUpRequired: boolean;
    followUpAppointmentId?: string;
    prescriptionIssued?: boolean;
    testsOrdered?: boolean;
    notes?: string;
  };
}
```

### 2.5 health.appointment.cancelled

Emitted when an appointment is cancelled.

```typescript
interface AppointmentCancelledEvent extends HealthEvent {
  eventType: 'health.appointment.cancelled';
  data: {
    appointmentId: string;
    profileId: string;
    providerType: string;
    providerId: string;
    cancelledBy: 'user' | 'provider' | 'system';
    reason: string;
    refundId?: string;
    refundAmount?: number;
    cancelledAt: string;
  };
}
```

---

## 3. Wellness Events

### 3.1 health.cycle.logged

Emitted when a menstrual cycle entry is logged.

```typescript
interface CycleLoggedEvent extends HealthEvent {
  eventType: 'health.cycle.logged';
  data: {
    entryId: string;
    profileId: string;
    date: string;
    cycleType: 'period_start' | 'period_end' | 'spotting' | 'intercourse' | 'ovulation' | 'fertile_window' | 'symptom' | 'mood';
    flowIntensity?: 'light' | 'medium' | 'heavy';
    symptoms?: string[];
    mood?: string;
    cycleDay: number;
    predictedNextPeriod?: string;
  };
}
```

### 3.2 health.habit.completed

Emitted when a wellness habit is logged.

```typescript
interface HabitCompletedEvent extends HealthEvent {
  eventType: 'health.habit.completed';
  data: {
    entryId: string;
    profileId: string;
    habitType: 'water' | 'sleep' | 'steps' | 'workout' | 'meditation' | 'nutrition';
    value: number;
    unit?: string;
    goal: number;
    goalAchieved: boolean;
    currentStreak: number;
    totalStreak: number;
    source: 'manual' | 'wearable' | 'integration';
  };
}
```

### 3.3 health.challenge.joined

Emitted when a user joins a wellness challenge.

```typescript
interface ChallengeJoinedEvent extends HealthEvent {
  eventType: 'health.challenge.joined';
  data: {
    challengeId: string;
    profileId: string;
    challengeName: string;
    challengeType: string;
    duration: {
      startDate: string;
      endDate: string;
    };
    requirements: {
      dailyGoal: number;
      totalDays: number;
    };
    rewards: {
      coins: number;
      badge?: string;
    };
  };
}
```

### 3.4 health.challenge.completed

Emitted when a user completes a challenge.

```typescript
interface ChallengeCompletedEvent extends HealthEvent {
  eventType: 'health.challenge.completed';
  data: {
    challengeId: string;
    profileId: string;
    challengeName: string;
    completedAt: string;
    finalStreak: number;
    totalPoints: number;
    completedDays: number;
    rewardsEarned: {
      coins: number;
      badge?: string;
      cashback?: number;
    };
  };
}
```

### 3.5 health.score.updated

Emitted when health score is recalculated.

```typescript
interface HealthScoreUpdatedEvent extends HealthEvent {
  eventType: 'health.score.updated';
  data: {
    profileId: string;
    score: number;
    grade: string;
    trend: 'improving' | 'stable' | 'declining';
    components: {
      preventive: number;
      activity: number;
      lifestyle: number;
      biomarkers: number;
      engagement: number;
    };
    badges: Array<{
      id: string;
      name: string;
      newlyEarned: boolean;
    }>;
    previousScore?: number;
    improvement?: number;
  };
}
```

---

## 4. AI Events

### 4.1 health.ai.interpreted

Emitted when AI interprets a health report.

```typescript
interface AIInterpretedEvent extends HealthEvent {
  eventType: 'health.ai.interpreted';
  data: {
    recordId: string;
    profileId: string;
    biomarkersInterpreted: number;
    confidence: number;
    responseTimeMs: number;
    model: string;
    tokensUsed?: number;
    costIncurred?: number;
  };
}
```

### 4.2 health.symptom.assessed

Emitted when AI assesses symptoms.

```typescript
interface SymptomAssessedEvent extends HealthEvent {
  eventType: 'health.symptom.assessed';
  data: {
    sessionId: string;
    profileId: string;
    symptoms: string[];
    urgency: 'self_care' | 'consult_doctor' | 'urgent_care' | 'emergency';
    recommendedSpecialty?: string;
    recommendedTests?: string[];
    confidence: number;
    responseTimeMs: number;
    emergencyDetected: boolean;
  };
}
```

### 4.3 health.copilot.interaction

Emitted for each AI copilot interaction.

```typescript
interface CopilotInteractionEvent extends HealthEvent {
  eventType: 'health.copilot.interaction';
  data: {
    sessionId: string;
    profileId: string;
    task: CopilotTask;
    userMessage: string;
    aiResponse?: string;
    confidence: number;
    actionsTriggered: Array<{
      type: string;
      label: string;
      payload: Record<string, unknown>;
    }>;
    responseTimeMs: number;
    feedbackGiven?: 'positive' | 'negative';
  };
}
```

---

## 5. Risk & Alert Events

### 5.1 health.risk.detected

Emitted when a health risk signal is generated.

```typescript
interface RiskDetectedEvent extends HealthEvent {
  eventType: 'health.risk.detected';
  data: {
    riskId: string;
    profileId: string;
    signalType: RiskSignalType;
    severity: 'info' | 'warning' | 'urgent';
    title: string;
    description: string;
    sourceBiomarkers?: string[];
    recommendedAction: {
      type: 'self_care' | 'consult_doctor' | 'urgent_care' | 'emergency';
      description: string;
    };
    riskScore?: number;
  };
}
```

### 5.2 health.alert.triggered

Emitted when a proactive health alert is triggered.

```typescript
interface AlertTriggeredEvent extends HealthEvent {
  eventType: 'health.alert.triggered';
  data: {
    alertId: string;
    profileId: string;
    alertType: 'checkup_due' | 'vaccination_due' | 'medication_due' | 'followup_due' | 'preventive';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    actionRequired: boolean;
    actionItems?: string[];
    deadline?: string;
  };
}
```

### 5.3 health.emergency.detected

Emitted when emergency symptoms are detected.

```typescript
interface EmergencyDetectedEvent extends HealthEvent {
  eventType: 'health.emergency.detected';
  data: {
    sessionId: string;
    profileId: string;
    symptoms: string[];
    severity: 'critical';
    recommendedAction: 'call_emergency' | 'go_to_emergency';
    emergencyNumbers: string[];
    locationShared?: boolean;
    notificationSent: {
      emergencyContacts: boolean;
      medicalServices: boolean;
    };
  };
}
```

---

## 6. Profile Events

### 6.1 health.profile.created

Emitted when a new health profile is created.

```typescript
interface ProfileCreatedEvent extends HealthEvent {
  eventType: 'health.profile.created';
  data: {
    profileId: string;
    userId: string;
    relationship: string;
    name: string;
    age?: number;
    gender: string;
    isPrimary: boolean;
    hasHealthData: boolean;
  };
}
```

### 6.2 health.profile.updated

Emitted when profile health data is updated.

```typescript
interface ProfileUpdatedEvent extends HealthEvent {
  eventType: 'health.profile.updated';
  data: {
    profileId: string;
    userId: string;
    changes: Array<{
      field: string;
      previousValue?: unknown;
      newValue?: unknown;
    }>;
    source: 'user' | 'api' | 'wearable';
  };
}
```

### 6.3 health.family.added

Emitted when a family member is added.

```typescript
interface FamilyAddedEvent extends HealthEvent {
  eventType: 'health.family.added';
  data: {
    userId: string;
    profileId: string;
    memberProfileId: string;
    relationship: string;
    name: string;
    age?: number;
    hasHealthData: boolean;
  };
}
```

### 6.4 health.consent.updated

Emitted when consent settings change.

```typescript
interface ConsentUpdatedEvent extends HealthEvent {
  eventType: 'health.consent.updated';
  data: {
    userId: string;
    profileId: string;
    consentType: 'share' | 'analytics' | 'research' | 'third_party';
    action: 'given' | 'withdrawn';
    version: string;
    timestamp: string;
  };
}
```

---

## 7. Commerce Events

### 7.1 health.order.created

Emitted when a lab test or order is placed.

```typescript
interface OrderCreatedEvent extends HealthEvent {
  eventType: 'health.order.created';
  data: {
    orderId: string;
    profileId: string;
    orderType: 'lab_test' | 'health_package' | 'medicine';
    items: Array<{
      itemId: string;
      name: string;
      quantity: number;
      price: number;
    }>;
    labId?: string;
    pharmacyId?: string;
    totalAmount: number;
    discount?: number;
    paymentMethod: string;
    homeCollection?: {
      address: Address;
      preferredSlot: string;
    };
  };
}
```

### 7.2 health.order.completed

Emitted when an order is delivered/completed.

```typescript
interface OrderCompletedEvent extends HealthEvent {
  eventType: 'health.order.completed';
  data: {
    orderId: string;
    profileId: string;
    orderType: string;
    completedAt: string;
    deliveryMethod: 'home_collection' | 'pickup' | 'digital';
    reportRecordId?: string;     // If lab report was uploaded
    commissionEarned?: number;
  };
}
```

---

## 8. Event Consumers

### Event to Consumer Mapping

```typescript
const eventConsumers: Record<string, ConsumerConfig[]> = {
  // Feature Store updates
  'health.record.uploaded': [
    { handler: 'updateRecordCountMetrics', service: 'health-records-service' },
    { handler: 'updateFeatureStore', service: 'REZ-feature-store' },
    { handler: 'updateUserSegments', service: 'REZ-realtime-segments' },
    { handler: 'updateHealthScoreFeatures', service: 'REZ-feature-store' }
  ],

  'health.record.processing.completed': [
    { handler: 'processExtractedBiomarkers', service: 'health-ai-service' },
    { handler: 'updateBiomarkerTrends', service: 'REZ-feature-store' },
    { handler: 'generateRiskSignals', service: 'health-ai-service' }
  ],

  // Appointment handling
  'health.appointment.booked': [
    { handler: 'sendBookingConfirmation', service: 'health-booking-service' },
    { handler: 'scheduleReminders', service: 'health-booking-service' },
    { handler: 'updateEngagementMetrics', service: 'REZ-feature-store' }
  ],

  'health.appointment.completed': [
    { handler: 'updateEngagementScore', service: 'REZ-feature-store' },
    { handler: 'sendFollowupReminders', service: 'health-booking-service' },
    { handler: 'processCompletionMetrics', service: 'health-marketplace-service' }
  ],

  // Wellness tracking
  'health.cycle.logged': [
    { handler: 'updateCycleAnalysis', service: 'health-wellness-service' },
    { handler: 'updateEngagementMetrics', service: 'REZ-feature-store' }
  ],

  'health.habit.completed': [
    { handler: 'updateStreaks', service: 'health-wellness-service' },
    { handler: 'updateHealthScore', service: 'health-wellness-service' },
    { handler: 'checkBadgeEligibility', service: 'health-wellness-service' }
  ],

  'health.challenge.joined': [
    { handler: 'initiateChallengeTracking', service: 'health-wellness-service' },
    { handler: 'allocateChallengeRewards', service: 'RABTUL-wallet' }
  ],

  'health.challenge.completed': [
    { handler: 'distributeRewards', service: 'RABTUL-wallet' },
    { handler: 'awardBadge', service: 'health-wellness-service' },
    { handler: 'updateEngagementScore', service: 'REZ-feature-store' }
  ],

  // AI processing
  'health.record.interpreted': [
    { handler: 'logAIUsage', service: 'health-ai-service' },
    { handler: 'updateHealthScoreFeatures', service: 'REZ-feature-store' }
  ],

  'health.symptom.assessed': [
    { handler: 'logAIUsage', service: 'health-ai-service' },
    { handler: 'updateSearchMetrics', service: 'health-booking-service' }
  ],

  // Risk management
  'health.risk.detected': [
    { handler: 'createRiskRecord', service: 'health-records-service' },
    { handler: 'sendRiskNotification', service: 'RABTUL-notify' },
    { handler: 'escalateIfNeeded', service: 'REZ-care-service' }
  ],

  'health.emergency.detected': [
    { handler: 'triggerEmergencyProtocol', service: 'health-ai-service' },
    { handler: 'sendEmergencyNotification', service: 'RABTUL-notify' },
    { handler: 'notifyEmergencyContacts', service: 'RABTUL-notify' },
    { handler: 'logEmergencyEvent', service: 'health-records-service' }
  ],

  // Profile updates
  'health.profile.updated': [
    { handler: 'updateFeatureStore', service: 'REZ-feature-store' },
    { handler: 'syncToIdentityGraph', service: 'REZ-identity-graph' },
    { handler: 'updateUserSegments', service: 'REZ-realtime-segments' }
  ],

  // Commerce
  'health.order.created': [
    { handler: 'processOrder', service: 'health-marketplace-service' },
    { handler: 'sendOrderConfirmation', service: 'RABTUL-notify' },
    { handler: 'scheduleCollection', service: 'health-marketplace-service' }
  ],

  'health.order.completed': [
    { handler: 'processCommission', service: 'health-marketplace-service' },
    { handler: 'sendCompletionNotification', service: 'RABTUL-notify' },
    { handler: 'updateEngagementMetrics', service: 'REZ-feature-store' }
  ]
};
```

---

## 9. Dead Letter Queue Events

### DLQ Event Structure

```typescript
interface DLQEvent {
  originalEvent: HealthEvent;
  error: {
    code: string;
    message: string;
    stack?: string;
    retryCount: number;
    lastRetryAt: string;
  };
  processingInfo: {
    consumer: string;
    handler: string;
    failedAt: string;
    dlqEntryAt: string;
  };
}
```

### DLQ Event Types

| Original Event | DLQ Handler |
|----------------|-------------|
| `health.record.uploaded` | `retryOcrProcessing` |
| `health.record.processing.completed` | `retryFeatureUpdate` |
| `health.appointment.booked` | `retryReminderScheduling` |
| `health.risk.detected` | `retryRiskNotification` |
| `health.emergency.detected` | `emergencyAlertOverride` |

---

## 10. Event Publishing Guidelines

### Publishing an Event

```typescript
// Example: Publishing record.uploaded event
import { eventBus } from '@rez/event-bus-client';

async function publishRecordUploaded(record: HealthRecord) {
  const event: RecordUploadedEvent = {
    eventId: crypto.randomUUID(),
    eventType: 'health.record.uploaded',
    version: '1.0',
    timestamp: new Date().toISOString(),
    source: {
      service: 'health-records-service',
      version: process.env.SERVICE_VERSION,
      instanceId: process.env.INSTANCE_ID
    },
    correlationId: getCorrelationId(),
    userId: record.userId,
    profileId: record.profileId,
    data: {
      recordId: record.recordId,
      profileId: record.profileId,
      type: record.type,
      title: record.title,
      file: {
        filename: record.file.filename,
        mimeType: record.file.mimeType,
        size: record.file.size,
        storageKey: record.file.storageKey
      },
      processing: {
        status: 'pending'
      },
      metadata: {
        uploadSource: getUploadSource()
      }
    }
  };

  await eventBus.publish('health.record.uploaded', event, {
    partitionKey: record.userId,  // Ensures ordering per user
    delivery: 'at-least-once'
  });
}
```

### Best Practices

1. **Partition by userId** — Ensures events for same user are processed in order
2. **Include correlationId** — Enables tracing across services
3. **Set delivery semantics** — `at-least-once` for most events
4. **Include versioning** — Schema evolution support
5. **Log before publish** — Audit trail
6. **Handle publish failures** — Retry with exponential backoff

# RisaCare — Ecosystem Integration Guide

---

## Overview

RisaCare is built on top of the REZ ecosystem. This guide details how to integrate with existing REZ services.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          RisaCare PLATFORM                                │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    INTEGRATION LAYER                                  │   │
│  │                                                                      │   │
│  │   REZ Intelligence  │  RABTUL Core  │  Other REZ  │  External      │   │
│  │   Client            │  Service      │  Services   │  APIs          │   │
│  │                     │  Clients      │             │                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. REZ Intelligence Integration

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      REZ INTELLIGENCE INTEGRATION                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   RisaCare                                                          │
│       │                                                                    │
│       ▼                                                                    │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │                    REZ Intelligence Client                          │    │
│   │                                                                      │    │
│   │   getIntelligenceClient({ apiKey })                               │    │
│   │                                                                      │    │
│   └────────────────────────────┬────────────────────────────────────────┘    │
│                                │                                              │
│       ┌────────────────────────┼────────────────────────┐                    │
│       │                        │                        │                    │
│       ▼                        ▼                        ▼                    │
│   ┌────────┐            ┌────────────┐           ┌──────────┐            │
│   │ Health │            │   Central   │           │  Memory  │            │
│   │ Expert │            │   Intent    │           │  Layer   │            │
│   │ 3011   │            │    4018     │           │   4201   │            │
│   └────────┘            └────────────┘           └──────────┘            │
│       │                        │                        │                    │
│       └────────────────────────┼────────────────────────┘                    │
│                                │                                              │
│                                ▼                                              │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │                  REZ Intelligence Services                        │    │
│   │                                                                      │    │
│   │  Feature Store │ Decision Engine │ Identity Graph │ Signal Agg │    │
│   │     4127      │     4128       │     4050       │   4142    │    │
│   └─────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Client Setup

```typescript
// integrations/rez-intelligence/index.ts

import { rezIntelligenceClient } from './integrations/rez-intelligence';

// Use the client directly
const response = await rezIntelligenceClient.health.interpret({
  recordType: 'blood_report',
  reportDate: '2026-05-27',
  rawText: 'Hemoglobin: 14.5 g/dL',
  extractedBiomarkers: [{ name: 'Hemoglobin', value: 14.5, unit: 'g/dL' }],
  userContext: { allergies: [], chronicConditions: [] }
});
```

### Health Expert Integration (Port 3011)

```typescript
// integrations/rez-intelligence/health-expert.ts

import { getHealthIntelligenceClient, HealthContext } from './client';

export interface BiomarkerInterpretation {
  name: string;
  value: string | number;
  unit?: string;
  referenceRange: string;
  status: 'normal' | 'low' | 'high' | 'borderline' | 'critical';
  explanation: string;
  confidence: number;
  needsAttention: boolean;
}

export interface ReportInterpretationRequest {
  recordType: string;
  reportDate: string;
  rawText: string;
  extractedBiomarkers: Array<{
    name: string;
    value: string | number;
    unit?: string;
    referenceRange?: { min?: number; max?: number };
  }>;
  userContext: HealthContext;
}

export interface ReportInterpretationResponse {
  interpretations: BiomarkerInterpretation[];
  overallAssessment: {
    summary: string;
    needsDoctorConsult: boolean;
    urgency: 'low' | 'medium' | 'high';
  };
  riskSignals: Array<{
    indicator: string;
    action: string;
  }>;
  confidence: number;
}

export async function interpretHealthReport(
  request: ReportInterpretationRequest
): Promise<ReportInterpretationResponse> {
  const client = getHealthIntelligenceClient();

  const response = await client.healthExpert.interpret({
    type: 'report_interpretation',
    data: request,
    options: {
      includeExplanations: true,
      includeComparisons: true,
      safetyMode: 'strict'
    }
  });

  return response as ReportInterpretationResponse;
}

export interface SymptomAssessmentRequest {
  symptoms: Array<{
    symptom: string;
    duration?: string;
    severity?: number;
    location?: string;
  }>;
  userContext: HealthContext;
}

export interface SymptomAssessmentResponse {
  urgencyLevel: 'self_care' | 'consult_doctor' | 'urgent_care' | 'emergency';
  reasoning: string;
  recommendedSpecialties: string[];
  recommendedTests?: string[];
  selfCareGuidance?: string[];
  emergencyFlags: boolean;
  confidence: number;
}

export async function assessSymptoms(
  request: SymptomAssessmentRequest
): Promise<SymptomAssessmentResponse> {
  const client = getHealthIntelligenceClient();

  const response = await client.healthExpert.assess({
    type: 'symptom_assessment',
    data: request,
    options: {
      safetyMode: 'strict',
      includeRouting: true
    }
  });

  return response as SymptomAssessmentResponse;
}
```

### Memory Layer Integration (Port 4201)

```typescript
// integrations/rez-intelligence/memory-layer.ts

import { getHealthIntelligenceClient } from './client';

export interface HealthMemory {
  allergies: string[];
  chronicConditions: Array<{
    name: string;
    diagnosedDate: string;
    status: string;
  }>;
  recurringDeficiencies: string[];
  preferredDoctors: Array<{
    id: string;
    name: string;
    specialization: string;
  }>;
  preferredLabs: string[];
  recentSymptoms: string[];
  healthGoals: string[];
}

export interface MemoryEntry {
  type: string;
  content: string;
  timestamp: string;
  source: 'record' | 'user' | 'ai' | 'appointment';
  metadata?: Record<string, unknown>;
}

export async function getHealthMemory(
  profileId: string
): Promise<HealthMemory> {
  const client = getHealthIntelligenceClient();

  const memory = await client.memory.getContext({
    entityType: 'health_profile',
    entityId: profileId,
    scope: 'health'
  });

  return memory as HealthMemory;
}

export async function storeHealthMemory(
  profileId: string,
  entry: MemoryEntry
): Promise<void> {
  const client = getHealthIntelligenceClient();

  await client.memory.store({
    entityType: 'health_profile',
    entityId: profileId,
    scope: 'health',
    entry: {
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString()
    }
  });
}

export async function getHealthTimeline(
  profileId: string,
  options: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}
): Promise<MemoryEntry[]> {
  const client = getHealthIntelligenceClient();

  const timeline = await client.memory.getTimeline({
    entityType: 'health_profile',
    entityId: profileId,
    scope: 'health',
    ...options
  });

  return timeline as MemoryEntry[];
}
```

### Feature Store Integration (Port 4127)

```typescript
// integrations/rez-intelligence/feature-store.ts

import { getHealthIntelligenceClient } from './client';

export interface HealthFeatures {
  // Biomarker features
  biomarkerTrends: Record<string, {
    current: number;
    trend: 'improving' | 'stable' | 'worsening';
    percentChange?: number;
  }>;

  // Health score components
  healthScore: {
    overall: number;
    preventive: number;
    activity: number;
    lifestyle: number;
    biomarkers: number;
    engagement: number;
  };

  // Risk features
  riskFactors: Array<{
    factor: string;
    score: number;
  }>;

  // Engagement features
  engagement: {
    recordsUploaded: number;
    appointmentsCompleted: number;
    wellnessActivities: number;
    lastActive: string;
  };
}

export async function getHealthFeatures(
  profileId: string
): Promise<HealthFeatures> {
  const client = getHealthIntelligenceClient();

  const features = await client.featureStore.getFeatures({
    entityType: 'health_profile',
    entityId: profileId,
    featureSet: 'health'
  });

  return features as HealthFeatures;
}

export async function updateHealthFeatures(
  profileId: string,
  features: Partial<HealthFeatures>
): Promise<void> {
  const client = getHealthIntelligenceClient();

  await client.featureStore.updateFeatures({
    entityType: 'health_profile',
    entityId: profileId,
    featureSet: 'health',
    features
  });
}
```

### Decision Engine Integration (Port 4128)

```typescript
// integrations/rez-intelligence/decision-engine.ts

import { getHealthIntelligenceClient } from './client';

export interface RecommendationDecision {
  type: 'health_tip' | 'doctor_recommendation' | 'test_recommendation' | 'wellness_action';
  priority: number;
  title: string;
  description: string;
  action?: {
    type: 'navigate' | 'action';
    label: string;
    payload: Record<string, unknown>;
  };
  confidence: number;
}

export async function getHealthRecommendations(
  profileId: string,
  context: {
    recentRecords?: string[];
    upcomingAppointments?: string[];
    wellnessStreak?: number;
  }
): Promise<RecommendationDecision[]> {
  const client = getHealthIntelligenceClient();

  const decisions = await client.decisionEngine.decide({
    entityType: 'health_profile',
    entityId: profileId,
    decisionType: 'health_recommendations',
    context,
    options: {
      maxResults: 5,
      includeReasoning: false
    }
  });

  return decisions as RecommendationDecision[];
}

export async function shouldTriggerHealthAlert(
  profileId: string,
  alertType: string,
  data: Record<string, unknown>
): Promise<{
  shouldAlert: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message?: string;
}> {
  const client = getHealthIntelligenceClient();

  const decision = await client.decisionEngine.decide({
    entityType: 'health_profile',
    entityId: profileId,
    decisionType: 'health_alert',
    context: { alertType, data }
  });

  return decision as { shouldAlert: boolean; priority: string; message?: string };
}
```

---

## 2. RABTUL Core Services Integration

### Service URLs

```typescript
// integrations/rabtul/config.ts

export const RABTUL_SERVICES = {
  AUTH: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
  PAYMENT: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4001',
  WALLET: process.env.WALLET_SERVICE_URL || 'http://localhost:4004',
  NOTIFY: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011',
  BOOKING: process.env.BOOKING_SERVICE_URL || 'http://localhost:4020',
  PROFILE: process.env.PROFILE_SERVICE_URL || 'http://localhost:4013'
};

export const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;
```

### Auth Service Integration (Port 4002)

```typescript
// integrations/rabtul/auth.ts

import { RABTUL_SERVICES, INTERNAL_TOKEN } from './config';

export interface AuthUser {
  userId: string;
  email: string;
  phone?: string;
  name?: string;
  createdAt: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export async function verifyUserToken(token: string): Promise<AuthUser | null> {
  const response = await fetch(`${RABTUL_SERVICES.AUTH}/api/auth/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': INTERNAL_TOKEN!
    },
    body: JSON.stringify({ token })
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data.user;
}

export async function generateServiceToken(
  serviceName: string,
  userId: string
): Promise<string> {
  const response = await fetch(`${RABTUL_SERVICES.AUTH}/api/auth/service-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': INTERNAL_TOKEN!
    },
    body: JSON.stringify({ serviceName, userId })
  });

  const data = await response.json();
  return data.token;
}

export async function sendOTP(phone: string): Promise<{ success: boolean; messageId?: string }> {
  const response = await fetch(`${RABTUL_SERVICES.AUTH}/api/auth/otp/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': INTERNAL_TOKEN!
    },
    body: JSON.stringify({ phone, channel: 'sms' })
  });

  const data = await response.json();
  return { success: data.success, messageId: data.messageId };
}

export async function verifyOTP(
  phone: string,
  otp: string,
  messageId: string
): Promise<{ success: boolean; token?: string }> {
  const response = await fetch(`${RABTUL_SERVICES.AUTH}/api/auth/otp/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': INTERNAL_TOKEN!
    },
    body: JSON.stringify({ phone, otp, messageId })
  });

  const data = await response.json();
  return { success: data.success, token: data.token };
}
```

### Wallet Service Integration (Port 4004)

```typescript
// integrations/rabtul/wallet.ts

import { RABTUL_SERVICES, INTERNAL_TOKEN } from './config';

export interface WalletBalance {
  userId: string;
  coins: number;
  cashback: number;
  currency: string;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: string;
  balance: number;
}

export async function getWalletBalance(userId: string): Promise<WalletBalance> {
  const response = await fetch(`${RABTUL_SERVICES.WALLET}/api/wallet/balance`, {
    method: 'GET',
    headers: {
      'X-User-Id': userId,
      'X-Internal-Token': INTERNAL_TOKEN!
    }
  });

  const data = await response.json();
  return data;
}

export async function addHealthCoins(
  userId: string,
  amount: number,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<{ transactionId: string; newBalance: number }> {
  const response = await fetch(`${RABTUL_SERVICES.WALLET}/api/wallet/credit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId,
      'X-Internal-Token': INTERNAL_TOKEN!
    },
    body: JSON.stringify({
      amount,
      reason: `health:${reason}`,
      metadata: {
        source: 'risa-care',
        ...metadata
      }
    })
  });

  const data = await response.json();
  return data;
}

export async function deductCoins(
  userId: string,
  amount: number,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<{ transactionId: string; newBalance: number }> {
  const response = await fetch(`${RABTUL_SERVICES.WALLET}/api/wallet/debit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId,
      'X-Internal-Token': INTERNAL_TOKEN!
    },
    body: JSON.stringify({
      amount,
      reason: `health:${reason}`,
      metadata: {
        source: 'risa-care',
        ...metadata
      }
    })
  });

  const data = await response.json();
  return data;
}

export async function getTransactionHistory(
  userId: string,
  options: { limit?: number; offset?: number; type?: string } = {}
): Promise<{ transactions: Transaction[]; total: number }> {
  const params = new URLSearchParams({
    limit: String(options.limit || 20),
    offset: String(options.offset || 0),
    ...(options.type && { type: options.type })
  });

  const response = await fetch(`${RABTUL_SERVICES.WALLET}/api/wallet/transactions?${params}`, {
    method: 'GET',
    headers: {
      'X-User-Id': userId,
      'X-Internal-Token': INTERNAL_TOKEN!
    }
  });

  const data = await response.json();
  return data;
}

// Health-specific reward functions
export const HealthRewards = {
  RECORD_UPLOAD: 5,
  APPOINTMENT_BOOKED: 3,
  APPOINTMENT_COMPLETED: 10,
  WELLNESS_CHALLENGE_JOINED: 5,
  WELLNESS_CHALLENGE_COMPLETED: 50,
  HEALTH_SCORE_IMPROVED: 20,
  YEARLY_CHECKUP: 100,
  CONSISTENT_TRACKING: 15, // 7-day streak
  WOMENS_HEALTH_LOG: 2
};
```

### Payment Service Integration (Port 4001)

```typescript
// integrations/rabtul/payment.ts

import { RABTUL_SERVICES, INTERNAL_TOKEN } from './config';

export interface PaymentRequest {
  userId: string;
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  paymentLink?: string;
  error?: string;
}

export async function createPayment(
  request: PaymentRequest
): Promise<PaymentResult> {
  const response = await fetch(`${RABTUL_SERVICES.PAYMENT}/api/payments/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': INTERNAL_TOKEN!
    },
    body: JSON.stringify({
      ...request,
      source: 'risa-care',
      metadata: {
        ...request.metadata,
        service: 'health'
      }
    })
  });

  const data = await response.json();
  return data;
}

export async function verifyPayment(transactionId: string): Promise<{
  valid: boolean;
  amount?: number;
  status?: string;
}> {
  const response = await fetch(
    `${RABTUL_SERVICES.PAYMENT}/api/payments/verify/${transactionId}`,
    {
      method: 'GET',
      headers: {
        'X-Internal-Token': INTERNAL_TOKEN!
      }
    }
  );

  const data = await response.json();
  return data;
}

export async function refundPayment(
  transactionId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; refundId?: string }> {
  const response = await fetch(`${RABTUL_SERVICES.PAYMENT}/api/payments/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': INTERNAL_TOKEN!
    },
    body: JSON.stringify({
      transactionId,
      amount,
      reason,
      source: 'risa-care'
    })
  });

  const data = await response.json();
  return data;
}
```

### Notification Service Integration (Port 4011)

```typescript
// integrations/rabtul/notification.ts

import { RABTUL_SERVICES, INTERNAL_TOKEN } from './config';

export type NotificationChannel = 'push' | 'sms' | 'email' | 'whatsapp';

export interface NotificationPayload {
  userId: string;
  channels: NotificationChannel[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  template?: string;
  scheduledAt?: string;
}

// Health-specific notification templates
export const HealthNotificationTemplates = {
  APPOINTMENT_REMINDER: 'health_appointment_reminder',
  REPORT_READY: 'health_report_ready',
  MEDICATION_REMINDER: 'health_medication_reminder',
  CHECKUP_DUE: 'health_checkup_due',
  HEALTH_ALERT: 'health_alert',
  WELLNESS_ACHIEVEMENT: 'health_achievement',
  CHALLENGE_REMINDER: 'health_challenge_reminder',
  REFILL_REMINDER: 'health_refill_reminder'
};

export async function sendNotification(
  payload: NotificationPayload
): Promise<{ messageId: string; channel: NotificationChannel }[]> {
  const response = await fetch(`${RABTUL_SERVICES.NOTIFY}/api/notifications/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': INTERNAL_TOKEN!
    },
    body: JSON.stringify({
      ...payload,
      source: 'risa-care',
      priority: payload.data?.severity === 'urgent' ? 'high' : 'normal'
    })
  });

  const data = await response.json();
  return data.messages;
}

export async function sendAppointmentReminder(
  userId: string,
  appointment: {
    id: string;
    doctorName: string;
    date: string;
    time: string;
    mode: string;
    meetingLink?: string;
  },
  reminderType: '24h' | '1h' | '15m'
): Promise<void> {
  await sendNotification({
    userId,
    channels: ['push', 'sms'],
    title: `Appointment Reminder${reminderType === '24h' ? ' - Tomorrow' : ''}`,
    body: `Your appointment with ${appointment.doctorName} is ${reminderType === '24h' ? 'tomorrow' : 'in ' + reminderType}`,
    template: HealthNotificationTemplates.APPOINTMENT_REMINDER,
    data: {
      appointmentId: appointment.id,
      doctorName: appointment.doctorName,
      date: appointment.date,
      time: appointment.time,
      mode: appointment.mode,
      meetingLink: appointment.meetingLink,
      reminderType
    },
    scheduledAt: undefined // Send immediately
  });
}

export async function scheduleHealthAlert(
  userId: string,
  alert: {
    type: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'urgent';
    actionRequired: boolean;
    actionData?: Record<string, unknown>;
  }
): Promise<void> {
  await sendNotification({
    userId,
    channels: alert.severity === 'urgent' ? ['push', 'sms', 'call'] : ['push'],
    title: alert.title,
    body: alert.description,
    template: HealthNotificationTemplates.HEALTH_ALERT,
    data: {
      alertType: alert.type,
      severity: alert.severity,
      actionRequired: alert.actionRequired,
      ...alert.actionData
    }
  });
}
```

### Booking Service Integration (Port 4020)

```typescript
// integrations/rabtul/booking.ts

import { RABTUL_SERVICES, INTERNAL_TOKEN } from './config';

export interface BookingSlot {
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  mode: 'in_clinic' | 'teleconsult' | 'home_visit';
}

export interface CreateBookingRequest {
  userId: string;
  profileId: string;
  providerType: 'doctor' | 'lab';
  providerId: string;
  type: 'consultation' | 'diagnostic_test' | 'follow_up';
  schedule: {
    date: string;
    startTime: string;
    mode: 'in_clinic' | 'teleconsult' | 'home_visit';
  };
  payment?: {
    amount: number;
    method: 'wallet' | 'card' | 'upi';
  };
  notes?: string;
}

export interface BookingResponse {
  bookingId: string;
  status: string;
  confirmationNumber: string;
  meetingLink?: string;
  paymentStatus?: string;
}

// Extend RABTUL booking for healthcare-specific features
export async function createHealthBooking(
  request: CreateBookingRequest
): Promise<BookingResponse> {
  const response = await fetch(`${RABTUL_SERVICES.BOOKING}/api/bookings/health`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': INTERNAL_TOKEN!
    },
    body: JSON.stringify({
      ...request,
      source: 'risa-care',
      category: 'healthcare'
    })
  });

  const data = await response.json();
  return data;
}

export async function getAvailableSlots(
  providerId: string,
  date: string,
  mode: 'in_clinic' | 'teleconsult' | 'home_visit'
): Promise<BookingSlot[]> {
  const params = new URLSearchParams({
    providerId,
    date,
    mode
  });

  const response = await fetch(
    `${RABTUL_SERVICES.BOOKING}/api/slots?${params}`,
    {
      method: 'GET',
      headers: {
        'X-Internal-Token': INTERNAL_TOKEN!
      }
    }
  );

  const data = await response.json();
  return data.slots;
}

export async function cancelBooking(
  bookingId: string,
  reason: string
): Promise<{ success: boolean; refundId?: string }> {
  const response = await fetch(
    `${RABTUL_SERVICES.BOOKING}/api/bookings/${bookingId}/cancel`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN!
      },
      body: JSON.stringify({ reason, source: 'risa-care' })
    }
  );

  const data = await response.json();
  return data;
}
```

---

## 3. Event Bus Integration (Port 4025)

```typescript
// integrations/event-bus/client.ts

import { EventBusClient } from '@rez/event-bus-client';

let eventBus: EventBusClient | null = null;

export function getEventBusClient(): EventBusClient {
  if (!eventBus) {
    eventBus = new EventBusClient({
      url: process.env.REZ_EVENT_BUS_URL || 'http://localhost:4025',
      apiKey: process.env.REZ_EVENT_BUS_API_KEY,
      consumerGroup: 'risa-care'
    });
  }
  return eventBus;
}

// Publish health events
export async function publishHealthEvent(
  eventType: string,
  payload: Record<string, unknown>,
  options: { userId: string; profileId?: string } & Record<string, unknown> = {} as any
): Promise<void> {
  const client = getEventBusClient();

  await client.publish(eventType, {
    eventId: crypto.randomUUID(),
    eventType,
    version: '1.0',
    timestamp: new Date().toISOString(),
    source: {
      service: 'risa-care',
      version: process.env.SERVICE_VERSION || '1.0.0',
      instanceId: process.env.INSTANCE_ID || 'local'
    },
    userId: options.userId,
    profileId: options.profileId,
    data: payload
  }, {
    partitionKey: options.userId
  });
}

// Subscribe to events
export async function subscribeToHealthEvents(
  handlers: Record<string, (event: any) => Promise<void>>
): Promise<void> {
  const client = getEventBusClient();

  for (const [eventType, handler] of Object.entries(handlers)) {
    await client.subscribe(eventType, handler);
  }
}
```

---

## 4. Safe QR Integration

```typescript
// integrations/safe-qr/medical-info.ts

import { RABTUL_SERVICES, INTERNAL_TOKEN } from './config';

export interface EmergencyMedicalInfo {
  name: string;
  bloodGroup?: string;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: Array<{
    name: string;
    dosage: string;
  }>;
  emergencyContacts: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
  medicalNotes?: string;
}

export async function getEmergencyMedicalInfo(
  profileId: string
): Promise<EmergencyMedicalInfo | null> {
  const response = await fetch(
    `${RABTUL_SERVICES.SAFE_QR_URL || 'http://localhost:4060'}/api/medical-info/${profileId}`,
    {
      method: 'GET',
      headers: {
        'X-Internal-Token': INTERNAL_TOKEN!
      }
    }
  );

  if (!response.ok) return null;

  const data = await response.json();
  return data;
}

export async function updateEmergencyMedicalInfo(
  profileId: string,
  info: Partial<EmergencyMedicalInfo>
): Promise<void> {
  await fetch(
    `${RABTUL_SERVICES.SAFE_QR_URL || 'http://localhost:4060'}/api/medical-info/${profileId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN!
      },
      body: JSON.stringify(info)
    }
  );
}

export async function generateEmergencyQRCode(
  profileId: string
): Promise<{ qrCodeUrl: string; shortUrl: string }> {
  const response = await fetch(
    `${RABTUL_SERVICES.SAFE_QR_URL || 'http://localhost:4060'}/api/emergency-qr/${profileId}/generate`,
    {
      method: 'POST',
      headers: {
        'X-Internal-Token': INTERNAL_TOKEN!
      }
    }
  );

  const data = await response.json();
  return data;
}
```

---

## 5. REZ Ride Integration (Hospital Transfers)

```typescript
// integrations/rez-ride/transport.ts

export interface RideBookingRequest {
  userId: string;
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  dropoffLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  scheduledTime?: string;
  vehicleType: 'auto' | 'cab' | 'suv';
  purpose: 'hospital_visit' | 'lab_visit' | 'pharmacy';
  notes?: string;
}

export interface RideBookingResponse {
  rideId: string;
  driverName?: string;
  driverPhone?: string;
  pickupTime?: string;
  estimatedArrival?: string;
  estimatedFare: number;
  status: string;
}

export async function bookHealthRide(
  request: RideBookingRequest
): Promise<RideBookingResponse> {
  // Integration with ReZ Ride API
  const response = await fetch('https://api.rez.money/ride/v1/book', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${request.userId}` // Use REZ auth
    },
    body: JSON.stringify({
      ...request,
      source: 'risa-care',
      metadata: {
        purpose: request.purpose,
        notes: request.notes
      }
    })
  });

  const data = await response.json();
  return data;
}

export async function trackHealthRide(rideId: string): Promise<{
  status: string;
  driverLocation?: { lat: number; lng: number };
  eta?: string;
}> {
  const response = await fetch(`https://api.rez.money/ride/v1/rides/${rideId}/track`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.USER_TOKEN}`
    }
  });

  const data = await response.json();
  return data;
}
```

---

## 6. External Integrations

### OCR Service

```typescript
// integrations/external/ocr.ts

export interface OCRResult {
  text: string;
  confidence: number;
  pages: number;
  language: string;
  structured?: Record<string, unknown>;
}

export async function processHealthDocument(
  fileBuffer: Buffer,
  documentType: string
): Promise<OCRResult> {
  // Using external OCR service (Google Cloud Vision, AWS Textract, or custom)
  const response = await fetch('https://api.ocr-service.com/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'X-API-Key': process.env.OCR_SERVICE_API_KEY,
      'X-Document-Type': documentType
    },
    body: fileBuffer
  });

  const data = await response.json();
  return data;
}
```

### Lab Integrations (Future)

```typescript
// integrations/labs/interface.ts

export interface LabIntegration {
  labId: string;
  labName: string;
  apiEndpoint: string;
  authentication: 'api_key' | 'oauth' | 'basic';
}

export const LAB_INTEGRATIONS: LabIntegration[] = [
  {
    labId: 'apollo',
    labName: 'Apollo Diagnostics',
    apiEndpoint: 'https://api.apollo247.com',
    authentication: 'api_key'
  },
  {
    labId: 'srl',
    labName: 'SRL Diagnostics',
    apiEndpoint: 'https://api.srl.in',
    authentication: 'api_key'
  },
  {
    labId: 'thyrocare',
    labName: 'Thyrocare',
    apiEndpoint: 'https://api.thyrocare.com',
    authentication: 'api_key'
  }
];

export async function fetchLabResults(
  labId: string,
  patientId: string,
  dateRange: { start: string; end: string }
): Promise<any[]> {
  const integration = LAB_INTEGRATIONS.find(l => l.labId === labId);
  if (!integration) throw new Error(`Lab ${labId} not supported`);

  // Lab-specific API implementation
  const response = await fetch(`${integration.apiEndpoint}/results`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env[`LAB_${labId.toUpperCase()}_API_KEY`]
    },
    body: JSON.stringify({ patientId, dateRange })
  });

  return response.json();
}
```

---

## 7. Integration Checklist

### Pre-Production

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       INTEGRATION CHECKLIST                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  REZ INTELLIGENCE                                                          │
│  □ Health Expert (3011) connectivity                                        │
│  □ Memory Layer (4201) connectivity                                         │
│  □ Feature Store (4127) connectivity                                       │
│  □ Decision Engine (4128) connectivity                                     │
│  □ API key configured                                                      │
│  □ Rate limits understood                                                   │
│  □ Error handling implemented                                               │
│                                                                              │
│  RABTUL SERVICES                                                           │
│  □ Auth Service (4002) - Token verification                                 │
│  □ Wallet Service (4004) - Coins, rewards                                   │
│  □ Payment Service (4001) - Transactions                                    │
│  □ Notification Service (4011) - Alerts                                     │
│  □ Booking Service (4020) - Appointments                                   │
│  □ Internal token configured                                               │
│  □ Service-to-service auth working                                         │
│                                                                              │
│  EVENT BUS                                                                 │
│  □ Event Bus (4025) connectivity                                           │
│  □ Consumer group configured                                                │
│  □ Event schema validation                                                 │
│  □ Dead letter queue handling                                              │
│                                                                              │
│  OTHER REZ                                                                  │
│  □ Safe QR - Medical emergency info                                        │
│  □ REZ Ride - Hospital transport (optional)                                │
│                                                                              │
│  EXTERNAL                                                                   │
│  □ OCR Service - Document processing                                        │
│  □ Lab APIs - Results (future)                                              │
│  □ Pharmacy APIs - Medicines (future)                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Error Handling Patterns

```typescript
// integrations/utils/error-handling.ts

export class IntegrationError extends Error {
  constructor(
    public service: string,
    public code: string,
    message: string,
    public retryable: boolean = false
  ) {
    super(`[${service}] ${code}: ${message}`);
    this.name = 'IntegrationError';
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries: number; backoffMs: number } = { maxRetries: 3, backoffMs: 1000 }
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < options.maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (!isRetryable(error) || i === options.maxRetries - 1) {
        throw error;
      }
      await sleep(options.backoffMs * Math.pow(2, i));
    }
  }

  throw lastError!;
}

function isRetryable(error: unknown): boolean {
  if (error instanceof IntegrationError) {
    return error.retryable;
  }
  // Network errors are generally retryable
  if (error instanceof TypeError || error instanceof FetchError) {
    return true;
  }
  return false;
}

export async function withCircuitBreaker<T>(
  fn: () => Promise<T>,
  service: string
): Promise<T> {
  // Implementation using REZ Circuit Breaker (4030)
  const circuitBreaker = getCircuitBreaker(service);

  if (!circuitBreaker.allowsRequest()) {
    throw new IntegrationError(
      service,
      'CIRCUIT_OPEN',
      `Circuit breaker open for ${service}`,
      true
    );
  }

  try {
    const result = await fn();
    circuitBreaker.recordSuccess();
    return result;
  } catch (error) {
    circuitBreaker.recordFailure();
    throw error;
  }
}
```

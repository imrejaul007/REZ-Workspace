# RisaCare — Database Schemas

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   MongoDB (Primary)          Redis (Cache)           S3/GCS (Files)         │
│   ┌──────────────────┐      ┌──────────────┐      ┌──────────────────┐    │
│   │ health-profiles  │      │ Sessions     │      │ Health Records   │    │
│   │ health-records   │      │ Cache        │      │ Prescriptions    │    │
│   │ health-appointments│    │ Rate Limits  │      │ Processed OCR    │    │
│   │ health-timeline  │      │ Job Status   │      │ Thumbnails       │    │
│   │ health-wellness  │      │ Copilot Ctx  │      │ Exports          │    │
│   │ health-doctors   │      └──────────────┘      └──────────────────┘    │
│   │ health-labs      │                                                        │
│   │ health-pharmacies│                                                        │
│   │ health-risks     │                                                        │
│   │ health-audit     │                                                        │
│   └──────────────────┘                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. MongoDB Collections

### 1.1 health-profiles

Unified health profile for each user.

```typescript
// Collection: health-profiles
// Indexes: userId (unique), profiles.profileId (unique)

interface HealthProfile {
  _id: ObjectId;

  // Primary key from RABTUL Auth
  userId: string;
  userId_hash: string; // SHA-256 hash for lookup

  // Family profiles
  profiles: Array<{
    profileId: string;        // UUID
    name: string;
    relationship: 'self' | 'father' | 'mother' | 'spouse' | 'child' | 'sibling' | 'other';
    age?: number;
    gender: string;
    dateOfBirth?: string;
    bloodGroup?: string;
    isPrimary: boolean;
    isMinor: boolean;

    // Health data
    health: {
      allergies: Array<{
        allergen: string;
        type: 'food' | 'medication' | 'environmental' | 'other';
        severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
        notes?: string;
        diagnosedDate?: string;
      }>;
      chronicConditions: Array<{
        name: string;
        diagnosedDate: string;
        status: 'active' | 'managed' | 'resolved';
        medications?: string[];
        notes?: string;
      }>;
      currentMedications: Array<{
        name: string;
        dosage: string;
        frequency: string;
        startDate: string;
        endDate?: string;
        purpose?: string;
        prescribedBy?: string;
      }>;
      vaccinationHistory: Array<{
        name: string;
        date: string;
        nextDueDate?: string;
        provider?: string;
        lotNumber?: string;
      }>;
      familyHistory: Array<{
        condition: string;
        relation: 'father' | 'mother' | 'sibling' | 'grandparent';
        notes?: string;
      }>;
      pregnancyStatus?: 'none' | 'pregnant' | 'trying' | 'lactating';
      menstrualProfile?: {
        cycleLength: number;
        periodLength: number;
        lastPeriodStart?: string;
        symptoms: string[];
        flowIntensity: 'light' | 'medium' | 'heavy';
        pmsSymptoms: string[];
        irregularCycles: boolean;
      };
      lifestyle: {
        smoking: 'never' | 'former' | 'current' | 'occasional';
        alcohol: 'never' | 'occasional' | 'moderate' | 'heavy';
        sleepHours: number;
        waterIntake: number;
        activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
        stressLevel: 'low' | 'moderate' | 'high' | 'very-high';
        foodPreferences: string[];
      };
    };

    // Emergency contacts
    emergencyContacts: Array<{
      name: string;
      relationship: string;
      phone: string;
      isPrimary: boolean;
    }>;

    // Wearable data (aggregated)
    wearableData?: {
      lastSync?: string;
      dataTypes: string[];
      avgSteps?: number;
      avgHeartRate?: number;
      avgSleepHours?: number;
    };
  }>;

  // Preferences
  preferences: {
    notifications: {
      appointments: boolean;
      medications: boolean;
      reminders: boolean;
      reports: boolean;
      healthAlerts: boolean;
      wellnessTips: boolean;
    };
    privacyLevel: 'strict' | 'balanced' | 'open';
    language: string;
    timezone: string;
  };

  // Consent management
  consent: {
    version: string;
    givenAt: string;
    withdrawnAt?: string;
    anonymousAnalytics: boolean;
    researchParticipation: boolean;
    thirdPartySharing: boolean;
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

// Indexes
db.health-profiles.createIndex({ "userId": 1 }, { unique: true });
db.health-profiles.createIndex({ "profiles.profileId": 1 }, { unique: true });
db.health-profiles.createIndex({ "userId_hash": 1 });
db.health-profiles.createIndex({ "profiles.health.allergies.allergen": 1 });
db.health-profiles.createIndex({ "profiles.health.chronicConditions.name": 1 });
```

### 1.2 health-records

Health documents (reports, prescriptions, scans).

```typescript
// Collection: health-records
// Indexes: userId, profileId, type, date

interface HealthRecord {
  _id: ObjectId;
  recordId: string;          // UUID

  userId: string;
  profileId: string;

  // Document metadata
  type: HealthDocumentType;
  title: string;
  description?: string;

  // File storage
  file: {
    url: string;
    filename: string;
    mimeType: string;
    size: number;
    storageKey: string;      // S3/GCS key
    thumbnailUrl?: string;
  };

  // Processing status
  processing: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    ocrJobId?: string;
    ocrStatus?: 'pending' | 'processing' | 'completed' | 'failed';
    extractionStatus?: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
  };

  // AI-extracted data
  extracted: {
    date?: string;           // Report date
    doctorName?: string;
    hospitalName?: string;
    labName?: string;
    doctorRegistration?: string;

    biomarkers: Array<{
      name: string;
      value: string | number;
      unit?: string;
      referenceRange: {
        min?: number;
        max?: number;
        text?: string;
      };
      status: 'normal' | 'low' | 'high' | 'critical' | 'borderline';
      trend?: 'improving' | 'stable' | 'worsening' | 'fluctuating';
      historicalValues?: Array<{
        value: string | number;
        date: string;
        sourceRecordId: string;
      }>;
    }>;

    diagnosis?: string[];
    icdCodes?: string[];
    medications?: Array<{
      name: string;
      dosage?: string;
      frequency?: string;
    }>;
    rawText?: string;        // Full OCR text (encrypted)
    ocrConfidence: number;
    aiConfidence: number;
  };

  // Categorization
  category: HealthCategory;
  tags: string[];
  isAbnormal: boolean;
  hasFollowUpRequired: boolean;
  abnormalBiomarkers?: string[];

  // Sharing
  sharing: {
    isShared: boolean;
    sharedWith: Array<{
      entityType: 'doctor' | 'lab' | 'hospital';
      entityId: string;
      sharedAt: Date;
      expiresAt?: Date;
      consentId?: string;
    }>;
  };

  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;        // userId
  lastAccessedAt: Date;
}

// Type definitions
type HealthDocumentType =
  | 'blood_report'
  | 'urine_report'
  | 'stool_report'
  | 'xray'
  | 'ct_scan'
  | 'mri'
  | 'ultrasound'
  | 'ecg'
  | 'echo'
  | 'prescription'
  | 'discharge_summary'
  | 'medical_certificate'
  | 'vaccination_certificate'
  | 'insurance_document'
  | 'lab_report'
  | 'pathology_report'
  | 'imaging_report'
  | 'doctor_notes'
  | 'other';

type HealthCategory =
  | 'diabetes'
  | 'cardiac'
  | 'liver'
  | 'thyroid'
  | 'hormonal'
  | 'kidney'
  | 'blood'
  | 'womens_health'
  | 'preventive'
  | 'fitness'
  | 'nutrition'
  | 'respiratory'
  | 'digestive'
  | 'musculoskeletal'
  | 'neurological'
  | 'dermatological'
  | 'ophthalmic'
  | 'dental'
  | 'mental_health'
  | 'general';

// Indexes
db.health-records.createIndex({ "recordId": 1 }, { unique: true });
db.health-records.createIndex({ "userId": 1, "profileId": 1 });
db.health-records.createIndex({ "profileId": 1, "type": 1 });
db.health-records.createIndex({ "profileId": 1, "extracted.date": -1 });
db.health-records.createIndex({ "profileId": 1, "category": 1 });
db.health-records.createIndex({ "extracted.biomarkers.name": 1 });
db.health-records.createIndex({ "tags": 1 });
db.health-records.createIndex({ "processing.status": 1 });
db.health-records.createIndex({ "createdAt": -1 });
db.health-records.createIndex({ "profileId": 1, "isAbnormal": 1 });
```

### 1.3 health-appointments

Doctor, lab, and other healthcare appointments.

```typescript
// Collection: health-appointments
// Indexes: userId, profileId, providerId, schedule

interface HealthAppointment {
  _id: ObjectId;
  appointmentId: string;

  userId: string;
  profileId: string;

  // Provider
  providerType: 'doctor' | 'lab' | 'pharmacy' | 'wellness';
  providerId: string;
  providerDetails: {
    name: string;
    specialization?: string;
    photo?: string;
    address?: Address;
    phone?: string;
    email?: string;
  };

  // Appointment details
  type: 'consultation' | 'follow_up' | 'diagnostic_test' | 'health_package' | 'teleconsult' | 'home_visit';
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  mode: 'in_clinic' | 'teleconsult' | 'home_visit' | 'online';

  // Schedule
  schedule: {
    date: string;
    startTime: string;
    endTime?: string;
    timezone: string;
  };

  // Location / meeting
  address?: Address;
  meetingLink?: string;
  meetingId?: string;

  // Patient info for appointment
  patientInfo?: {
    symptoms?: string[];
    notes?: string;
    relatedRecordIds?: string[];
  };

  // Payment
  payment: {
    amount: number;
    currency: string;
    status: 'pending' | 'paid' | 'refunded' | 'failed';
    method?: string;
    transactionId?: string;
    refundId?: string;
    refundAmount?: number;
  };

  // Follow-up
  followUpAppointmentId?: string;
  previousAppointmentId?: string;

  // Notes
  notes?: string;
  doctorNotes?: string;      // Post-appointment notes
  cancellationReason?: string;

  // Reminders
  reminders: {
    sent24h: boolean;
    sent1h: boolean;
    sent15m: boolean;
  };

  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  cancelledAt?: Date;
  completedAt?: Date;
}

interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Indexes
db.health-appointments.createIndex({ "appointmentId": 1 }, { unique: true });
db.health-appointments.createIndex({ "userId": 1, "profileId": 1 });
db.health-appointments.createIndex({ "profileId": 1, "schedule.date": 1 });
db.health-appointments.createIndex({ "providerId": 1, "schedule.date": 1 });
db.health-appointments.createIndex({ "status": 1, "schedule.date": 1 });
db.health-appointments.createIndex({ "profileId": 1, "status": 1, "schedule.date": -1 });
```

### 1.4 health-timeline

Unified health timeline for records and events.

```typescript
// Collection: health-timeline
// Indexes: profileId, date

interface HealthTimelineEvent {
  _id: ObjectId;
  eventId: string;

  userId: string;
  profileId: string;

  date: string;              // Event date (YYYY-MM-DD)
  createdAt: Date;

  type: TimelineEventType;
  category?: HealthCategory;

  title: string;
  description?: string;

  // Relations
  relatedRecordIds: string[];
  relatedAppointmentId?: string;
  relatedDoctorId?: string;
  relatedLabId?: string;

  // Metadata
  metadata: {
    // For record events
    recordType?: HealthDocumentType;
    isAbnormal?: boolean;

    // For appointment events
    appointmentType?: string;
    doctorName?: string;

    // For symptom events
    symptoms?: string[];
    severity?: string;

    // For wellness events
    habitType?: string;
    value?: number;

    // Generic
    [key: string]: unknown;
  };

  // AI insights
  insights?: Array<{
    type: 'positive' | 'neutral' | 'concerning';
    message: string;
  }>;

  // User interaction
  isRead: boolean;
  readAt?: Date;
  isDismissed: boolean;
  dismissedAt?: Date;
}

type TimelineEventType =
  | 'record_uploaded'
  | 'appointment'
  | 'prescription'
  | 'vaccination'
  | 'surgery'
  | 'condition_diagnosed'
  | 'medication_started'
  | 'medication_stopped'
  | 'test_result'
  | 'symptom_reported'
  | 'wellness_activity'
  | 'checkup_reminder'
  | 'medication_reminder'
  | 'health_alert';

// Indexes
db.health-timeline.createIndex({ "eventId": 1 }, { unique: true });
db.health-timeline.createIndex({ "profileId": 1, "date": -1 });
db.health-timeline.createIndex({ "profileId": 1, "type": 1 });
db.health-timeline.createIndex({ "profileId": 1, "category": 1 });
db.health-timeline.createIndex({ "date": -1 });
db.health-timeline.createIndex({ "profileId": 1, "isRead": 1 });
```

### 1.5 health-wellness

Wellness tracking data (cycles, habits, challenges).

```typescript
// Collection: health-wellness
// Indexes: userId, profileId, type, date

interface WellnessEntry {
  _id: ObjectId;
  entryId: string;

  userId: string;
  profileId: string;

  date: string;
  type: WellnessType;
  createdAt: Date;
  updatedAt: Date;

  // Type-specific data
  data: WellnessData;
}

type WellnessType = 'cycle' | 'habit' | 'challenge' | 'score';
type WellnessData = CycleData | HabitData | ChallengeData | ScoreData;

interface CycleData {
  cycleType: 'period_start' | 'period_end' | 'spotting' | 'intercourse' | 'ovulation' | 'fertile_window' | 'symptom' | 'mood' | 'custom';
  flowIntensity?: 'light' | 'medium' | 'heavy';
  symptoms?: string[];
  mood?: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  energy?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  cervicalMucus?: string;
  temperature?: number;
  ovulationConfirmed?: boolean;
}

interface HabitData {
  habitType: 'water' | 'sleep' | 'steps' | 'workout' | 'meditation' | 'nutrition' | 'custom';
  value: number | string;
  unit?: string;
  goal?: number;
  source?: 'manual' | 'wearable' | 'integration';
  notes?: string;
  completed: boolean;
}

interface ChallengeData {
  challengeId: string;
  challengeName: string;
  progress: {
    currentStreak: number;
    longestStreak: number;
    totalPoints: number;
    completedDays: number;
  };
  joinedAt: string;
  completedAt?: string;
  status: 'active' | 'completed' | 'abandoned';
}

interface ScoreData {
  score: number;
  grade: string;
  components: Record<string, number>;
  trend: 'improving' | 'stable' | 'declining';
  calculatedAt: string;
}

// Compound index for efficient queries
db.health-wellness.createIndex({ "entryId": 1 }, { unique: true });
db.health-wellness.createIndex({ "profileId": 1, "type": 1, "date": -1 });
db.health-wellness.createIndex({ "profileId": 1, "date": -1 });
db.health-wellness.createIndex({ "userId": 1, "date": -1 });
```

### 1.6 health-risks

AI-generated health risk signals and alerts.

```typescript
// Collection: health-risks
// Indexes: profileId, signalType, severity, createdAt

interface HealthRisk {
  _id: ObjectId;
  riskId: string;

  userId: string;
  profileId: string;

  signalType: RiskSignalType;
  severity: 'info' | 'warning' | 'urgent';

  title: string;
  description: string;

  // Source data
  sourceRecordIds?: string[];
  sourceBiomarkers?: string[];

  // Risk assessment
  riskFactors?: Array<{
    factor: string;
    contribution: number;     // 0-1
  }>;

  // Recommended action
  recommendedAction: {
    type: 'self_care' | 'consult_doctor' | 'urgent_care' | 'emergency';
    specialty?: string;
    description: string;
    urgency?: 'low' | 'medium' | 'high';
  };

  // Status
  status: 'active' | 'acknowledged' | 'dismissed' | 'resolved';
  dismissible: boolean;

  // User interaction
  isRead: boolean;
  readAt?: Date;
  acknowledgedAt?: Date;
  dismissedAt?: Date;
  dismissedReason?: string;

  // Resolution
  resolvedAt?: Date;
  resolution?: string;
  relatedAppointmentId?: string;

  // Audit
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

type RiskSignalType =
  | 'abnormal_biomarker'
  | 'recurring_deficiency'
  | 'trend_concern'
  | 'medication_adherence'
  | 'checkup_due'
  | 'vaccination_due'
  | 'lifestyle_risk'
  | 'symptom_pattern';

// Indexes
db.health-risks.createIndex({ "riskId": 1 }, { unique: true });
db.health-risks.createIndex({ "profileId": 1, "status": 1 });
db.health-risks.createIndex({ "profileId": 1, "severity": 1 });
db.health-risks.createIndex({ "profileId": 1, "signalType": 1 });
db.health-risks.createIndex({ "createdAt": -1 });
db.health-risks.createIndex({ "status": 1, "expiresAt": 1 }, { expireAfterSeconds: 0 });
```

### 1.7 health-doctors

Doctor/provider directory.

```typescript
// Collection: health-doctors
// Indexes: doctorId, specializations, city

interface Doctor {
  _id: ObjectId;
  doctorId: string;

  // Basic info
  name: string;
  photo?: string;
  gender?: string;

  // Credentials
  credentials: {
    specializations: string[];
    qualifications: string[];
    yearsOfExperience: number;
    languages: string[];
    registrationNumber?: string;
  };

  // Practice
  practice: {
    hospitalAffiliations: string[];
    clinicName?: string;
    clinicAddress?: Address;
    consultationFees: {
      inClinic?: number;
      teleconsult?: number;
      homeVisit?: number;
    };
    consultationModes: ('in_clinic' | 'teleconsult' | 'home_visit')[];
  };

  // Availability
  availability: {
    workingDays: number[];   // 0-6
    hours: {
      start: string;
      end: string;
    };
    slots: Array<{
      date: string;
      times: string[];
    }>;
    nextAvailable?: string;
  };

  // Ratings
  ratings: {
    average: number;
    totalReviews: number;
    responseRate?: number;
    satisfactionScore?: number;
  };

  // Additional
  insuranceAccepted?: string[];
  bio?: string;
  awards?: string[];
  publications?: string[];

  // Verification
  isVerified: boolean;
  verificationDate?: Date;

  // Status
  isActive: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

// Indexes
db.health-doctors.createIndex({ "doctorId": 1 }, { unique: true });
db.health-doctors.createIndex({ "credentials.specializations": 1 });
db.health-doctors.createIndex({ "practice.clinicAddress.city": 1 });
db.health-doctors.createIndex({ "credentials.languages": 1 });
db.health-doctors.createIndex({ "isActive": 1, "credentials.specializations": 1 });
db.health-doctors.createIndex({ "ratings.average": -1 });
db.health-doctors.createIndex({ "practice.consultationFees.inClinic": 1 });
```

### 1.8 health-labs

Lab directory and test catalog.

```typescript
// Collection: health-labs
// Indexes: labId, city, nablAccredited

interface Lab {
  _id: ObjectId;
  labId: string;

  name: string;
  logo?: string;
  type: 'chain' | 'independent' | 'hospital';

  address: Address;
  phone?: string;
  email?: string;
  website?: string;

  // Accreditation
  nablAccredited: boolean;
  nabacCertificateNumber?: string;
  certifications?: string[];

  // Services
  services: {
    homeCollection: boolean;
    homeCollectionFee?: number;
    reportDelivery: 'online' | 'physical' | 'both';
    emergencyTests: boolean;
    slotBasedAppointments: boolean;
  };

  // Operating hours
  operatingHours: {
    [day: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };

  // Rating
  ratings: {
    average: number;
    totalReviews: number;
  };

  // Tests offered
  tests: Array<{
    testId: string;
    name: string;
    category: string;
    price: number;
    discountedPrice?: number;
    turnaroundTime: string;
    parameters?: string[];
    homeCollection?: boolean;
    preparation?: string[];
  }>;

  // Status
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

interface Test {
  _id: ObjectId;
  testId: string;

  name: string;
  description?: string;
  category: string;
  subcategory?: string;

  // Parameters
  parameters: string[];
  preparation?: string[];

  // Pricing
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };

  // Turnaround
  turnaroundTime: string;

  // Related
  similarTests?: string[];
  recommendedFor?: string[];
  isPopular: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// Indexes
db.health-labs.createIndex({ "labId": 1 }, { unique: true });
db.health-labs.createIndex({ "address.city": 1 });
db.health-labs.createIndex({ "nablAccredited": 1, "address.city": 1 });
db.health-labs.createIndex({ "services.homeCollection": 1 });
```

### 1.9 health-audit

Audit trail for sensitive operations.

```typescript
// Collection: health-audit
// Indexes: userId, action, timestamp

interface AuditEntry {
  _id: ObjectId;
  auditId: string;

  // Who
  userId: string;
  profileId?: string;
  actorType: 'user' | 'system' | 'admin' | 'doctor' | 'api';

  // What
  action: AuditAction;
  resourceType: string;
  resourceId: string;

  // Details
  details: {
    description: string;
    previousState?: Record<string, unknown>;
    newState?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  };

  // Context
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;

  // Compliance
  consentId?: string;
  dataProcessingBasis?: string;

  // Timestamp
  timestamp: Date;
}

type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'share'
  | 'export'
  | 'consent_given'
  | 'consent_withdrawn'
  | 'access_granted'
  | 'access_revoked'
  | 'emergency_access'
  | 'biometric_verified';

// Indexes
db.health-audit.createIndex({ "auditId": 1 }, { unique: true });
db.health-audit.createIndex({ "userId": 1, "timestamp": -1 });
db.health-audit.createIndex({ "resourceType": 1, "resourceId": 1 });
db.health-audit.createIndex({ "action": 1, "timestamp": -1 });
db.health-audit.createIndex({ "timestamp": -1 });
db.health-audit.createIndex({ "actorType": 1, "timestamp": -1 });
```

---

## 2. Redis Schema

### Session Data

```
Key: session:{userId}
TTL: 24 hours

Value:
{
  "profileId": "profile_123",
  "lastActive": "2026-03-15T10:00:00Z",
  "settings": { ... }
}
```

### Profile Cache

```
Key: profile:{userId}
TTL: 1 hour

Value:
{
  "profiles": [...],
  "preferences": {...}
}
```

### Biomarker Trends (Hot Data)

```
Key: trends:{profileId}:{biomarker}
TTL: 6 hours

Value:
[
  { "value": 14.5, "date": "2026-03-14", "recordId": "rec_123" },
  { "value": 14.2, "date": "2025-09-01", "recordId": "rec_456" }
]
```

### Doctor Slots Cache

```
Key: slots:{doctorId}:{date}
TTL: 5 minutes

Value:
{
  "date": "2026-03-16",
  "mode": "teleconsult",
  "slots": [
    { "time": "09:00", "available": true },
    { "time": "09:30", "available": true }
  ],
  "updatedAt": "2026-03-15T10:00:00Z"
}
```

### OCR Job Status

```
Key: ocr:{jobId}
TTL: 1 hour

Value:
{
  "status": "completed",
  "progress": 100,
  "result": {
    "text": "...",
    "confidence": 0.95
  },
  "error": null
}
```

### Rate Limiting (Sliding Window)

```
Key: ratelimit:{userId}:{endpoint}
TTL: 1 hour (cleaned after)

Value:
{
  "count": 45,
  "windowStart": "2026-03-15T09:00:00Z",
  "requests": ["req1", "req2", ...]
}
```

### AI Copilot Context

```
Key: copilot:{sessionId}
TTL: 30 minutes

Value:
{
  "userId": "user_xyz",
  "profileId": "profile_123",
  "conversationHistory": [
    { "role": "user", "message": "...", "timestamp": "..." },
    { "role": "ai", "message": "...", "timestamp": "..." }
  ],
  "context": {
    "currentTask": "explain_report",
    "entities": {...}
  }
}
```

### Health Score Cache

```
Key: healthscore:{profileId}
TTL: 1 hour

Value:
{
  "score": 78,
  "grade": "B+",
  "components": {...},
  "calculatedAt": "2026-03-15T00:00:00Z"
}
```

---

## 3. S3/GCS File Storage Schema

### Bucket: `risa-care-records`

#### Directory Structure

```
risa-care-records/
├── user-uploads/
│   ├── {userId}/
│   │   ├── {profileId}/
│   │   │   ├── reports/
│   │   │   │   ├── {recordId}.pdf
│   │   │   │   ├── {recordId}_1.jpg
│   │   │   │   └── {recordId}_2.png
│   │   │   ├── prescriptions/
│   │   │   │   └── {prescriptionId}.pdf
│   │   │   ├── scans/
│   │   │   │   └── {scanId}.dcm
│   │   │   └── images/
│   │   │       └── {imageId}.jpg
│   │   └── temp/
│   │       └── {tempUploadId}/
│   │           └── ... (cleaned after 24h)
│   └── shared/
│       └── {shareId}/
│           └── {recordId}.pdf (time-limited access)
│
├── processed/
│   ├── ocr/
│   │   └── {recordId}_raw.txt (encrypted)
│   ├── thumbnails/
│   │   └── {recordId}_thumb.jpg
│   └── extracted/
│       └── {recordId}_data.json
│
└── exports/
    └── {userId}/
        └── {exportId}_health_data.zip (cleaned after 7 days)
```

### File Lifecycle

| Path Pattern | Retention | Action |
|-------------|-----------|--------|
| `user-uploads/*/temp/*` | 24 hours | Auto-delete |
| `user-uploads/*/reports/*` | Indefinite | User-controlled |
| `user-uploads/*/prescriptions/*` | Indefinite | User-controlled |
| `processed/*` | 90 days | Regenerate from source |
| `exports/*` | 7 days | Auto-delete |

### File Metadata

Stored in DynamoDB or as S3 metadata:

```json
{
  "fileId": "file_abc123",
  "recordId": "rec_xyz",
  "userId": "user_xyz",
  "profileId": "profile_123",
  "type": "health_record",
  "filename": "cbc_march.pdf",
  "mimeType": "application/pdf",
  "size": 245000,
  "checksum": "sha256:abc123...",
  "createdAt": "2026-03-15T10:30:00Z",
  "lastAccessedAt": "2026-03-15T10:35:00Z",
  "accessCount": 5,
  "sharedWith": []
}
```

---

## 4. Data Retention Policies

### Retention Schedule

| Data Type | Retention Period | Action on Expiry |
|-----------|------------------|------------------|
| Health Records | Indefinite (user-controlled) | Notify user |
| Medical History | Indefinite (user-controlled) | Notify user |
| Wellness Data | 7 years | Anonymize |
| Appointment History | 7 years | Anonymize |
| Audit Logs | 7 years | Archive |
| Session Data | 24 hours | Auto-delete |
| Temp Uploads | 24 hours | Auto-delete |
| Data Exports | 7 days | Auto-delete |
| OCR Results | 90 days | Regenerate |

### Deletion Procedures

```typescript
// Soft delete (user-initiated)
interface DeletionRequest {
  requestId: string;
  userId: string;
  requestType: 'profile' | 'records' | 'export';
  scope: 'all' | 'specific';
  specificIds?: string[];
  reason?: string;
  requestedAt: Date;
  scheduledDeletionAt: Date;  // 30 days from request
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
}
```

---

## 5. Migration Scripts

### Add new index

```javascript
// Example: Add index for new query pattern
db.health-records.createIndex(
  { "profileId": 1, "extracted.biomarkers.name": 1, "extracted.date": -1 },
  { name: "profile_biomarker_date_idx", background: true }
);
```

### Backfill missing data

```javascript
// Example: Backfill category for untagged records
db.health-records.find({ category: null }).forEach(record => {
  const category = inferCategory(record.type, record.extracted);
  db.health-records.updateOne(
    { _id: record._id },
    { $set: { category: category, updatedAt: new Date() } }
  );
});
```

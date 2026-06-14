# RisaCare — Complete Product Specification

---

## 1. Product Identity

### Definition

RisaCare is **Healthcare Intelligence + Coordination Infrastructure** — not telemedicine.

It provides:

- Unified health records and timeline
- AI-powered health interpretation
- Symptom navigation and routing
- Provider discovery and booking
- Preventive wellness engagement
- Family health management

### What RisaCare IS

- AI-powered healthcare navigation
- Healthcare coordination infrastructure
- Personal health OS
- Healthcare commerce layer
- Preventive wellness platform
- Unified health records system
- Healthcare intelligence engine

### What RisaCare IS NOT

- An AI doctor
- A diagnosis platform
- A prescription engine
- A replacement for medical professionals

---

## 2. User Identity & Health Profile System

### User Profile Schema

```typescript
interface UserProfile {
  id: string;
  basic: {
    name: string;
    age: number;
    gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
    bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';
    height?: number; // cm
    weight?: number; // kg
    bmi?: number;
    language: string;
    city: string;
    emergencyContacts: EmergencyContact[];
  };
  health: {
    allergies: Allergy[];
    chronicConditions: ChronicCondition[];
    previousSurgeries: Surgery[];
    currentMedications: Medication[];
    vaccinationHistory: Vaccination[];
    familyHistory: FamilyHistoryItem[];
    pregnancyStatus?: 'none' | 'pregnant' | 'trying' | 'lactating';
    menstrualProfile?: MenstrualProfile;
    lifestyle: LifestyleData;
  };
  family: {
    members: FamilyMember[];
    primaryProfileId: string;
  };
  preferences: {
    notifications: NotificationPreferences;
    dataSharing: DataSharingConsent;
    privacyLevel: 'strict' | 'balanced' | 'open';
  };
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

interface Allergy {
  allergen: string;
  type: 'food' | 'medication' | 'environmental' | 'other';
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  notes?: string;
  diagnosedDate?: string;
}

interface ChronicCondition {
  name: string;
  diagnosedDate: string;
  status: 'active' | 'managed' | 'resolved';
  medications?: string[];
  notes?: string;
}

interface Surgery {
  name: string;
  date: string;
  hospital?: string;
  doctor?: string;
  notes?: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  purpose?: string;
  prescribedBy?: string;
}

interface Vaccination {
  name: string;
  date: string;
  nextDueDate?: string;
  provider?: string;
  lotNumber?: string;
}

interface FamilyHistoryItem {
  condition: string;
  relation: 'father' | 'mother' | 'sibling' | 'grandparent' | 'maternal-grandparent' | 'paternal-grandparent';
  notes?: string;
}

interface MenstrualProfile {
  cycleLength: number; // days
  periodLength: number; // days
  lastPeriodStart?: string;
  symptoms: string[];
  flowIntensity: 'light' | 'medium' | 'heavy';
  pmsSymptoms: string[];
  irregularCycles: boolean;
}

interface LifestyleData {
  smoking: 'never' | 'former' | 'current' | 'occasional';
  alcohol: 'never' | 'occasional' | 'moderate' | 'heavy';
  sleepHours: number;
  waterIntake: number; // glasses per day
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  stressLevel: 'low' | 'moderate' | 'high' | 'very-high';
  foodPreferences: string[];
}

interface FamilyMember {
  id: string;
  name: string;
  relationship: 'father' | 'mother' | 'spouse' | 'child' | 'sibling' | 'other';
  age?: number;
  gender: string;
  isMinor: boolean;
  canAccessRecords: boolean;
  managedBy: string; // userId of manager
}

interface NotificationPreferences {
  appointments: boolean;
  medications: boolean;
  reminders: boolean;
  reports: boolean;
  healthAlerts: boolean;
  wellnessTips: boolean;
}

interface DataSharingConsent {
  anonymousAnalytics: boolean;
  researchParticipation: boolean;
  thirdPartySharing: boolean;
}
```

---

## 3. Health Records System

### Supported Document Types

```typescript
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

interface HealthRecord {
  id: string;
  userId: string;
  profileId: string; // family member or self
  type: HealthDocumentType;
  title: string;
  description?: string;

  // File metadata
  file: {
    url: string;
    filename: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
  };

  // AI-extracted data
  extracted: {
    date: string;
    doctorName?: string;
    hospitalName?: string;
    labName?: string;
    biomarkers: Biomarker[];
    diagnosis?: string[];
    icdCodes?: string[];
    notes?: string;
    rawText?: string;
    ocrConfidence: number;
    aiConfidence: number;
  };

  // Categorization
  category: HealthCategory;
  tags: string[];
  isAbnormal: boolean;
  hasFollowUpRequired: boolean;

  // Timeline
  createdAt: string;
  updatedAt: string;
}

interface Biomarker {
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
  historicalValues?: HistoricalValue[];
}

interface HistoricalValue {
  value: string | number;
  date: string;
  sourceRecordId: string;
}

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
```

### Health Timeline

```typescript
interface HealthTimelineEvent {
  id: string;
  userId: string;
  profileId: string;
  date: string;

  type:
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
    | 'wellness_activity';

  title: string;
  description?: string;

  relatedRecordIds: string[];
  relatedAppointmentId?: string;

  metadata: Record<string, unknown>;

  createdAt: string;
}

// Timeline query options
interface TimelineQuery {
  userId: string;
  profileId?: string;
  startDate?: string;
  endDate?: string;
  categories?: HealthCategory[];
  types?: string[];
  searchQuery?: string;
  limit?: number;
  offset?: number;
}
```

---

## 4. AI Health Interpretation System

### Report Simplification

AI explains biomarkers in plain language:

```typescript
interface BiomarkerExplanation {
  biomarker: string;
  userValue: string | number;
  unit?: string;
  referenceRange: string;
  status: 'normal' | 'low' | 'high' | 'critical' | 'borderline';

  explanation: {
    whatItMeans: string;
    whyItMatters: string;
    possibleCauses?: string[];
    generalGuidance: string;
  };

  confidence: {
    aiConfidence: number; // 0-1
    extractionConfidence: number; // 0-1
    hasEnoughHistory: boolean;
  };

  disclaimer: string;
  source?: string;
}
```

### Trend Analysis

```typescript
interface TrendAnalysis {
  biomarker: string;
  values: Array<{
    value: string | number;
    date: string;
    recordId: string;
  }>;

  trend: 'improving' | 'stable' | 'worsening' | 'fluctuating' | 'insufficient_data';

  statistics: {
    average?: number;
    min?: number;
    max?: number;
    count: number;
    percentChange?: number;
  };

  insights: Array<{
    type: 'positive' | 'neutral' | 'concerning';
    message: string;
    recommendation?: string;
  }>;

  disclaimer: string;
}
```

### Health Risk Signals

```typescript
interface HealthRiskSignal {
  id: string;
  userId: string;
  profileId: string;

  signalType:
    | 'abnormal_biomarker'
    | 'recurring_deficiency'
    | 'trend_concern'
    | 'medication_adherence'
    | 'checkup_due'
    | 'vaccination_due'
    | 'lifestyle_risk';

  severity: 'info' | 'warning' | 'urgent';

  title: string;
  description: string;

  relatedBiomarkers?: string[];
  relatedRecords?: string[];

  recommendedAction: {
    type: 'self_care' | 'consult_doctor' | 'urgent_care' | 'emergency';
    specialty?: string;
    description: string;
  };

  dismissible: boolean;
  createdAt: string;
  readAt?: string;
}
```

---

## 5. Symptom Navigation AI

### Symptom Intake

```typescript
interface SymptomIntake {
  sessionId: string;
  userId: string;
  profileId: string;

  symptoms: Array<{
    symptom: string;
    duration?: string;
    severity?: 1 | 2 | 3 | 4 | 5;
    location?: string;
    triggers?: string[];
    associatedSymptoms?: string[];
  }>;

  context: {
    age: number;
    gender: string;
    existingConditions?: string[];
    currentMedications?: string[];
    allergies?: string[];
    recentTravel?: boolean;
    temperature?: number;
  };

  conversationHistory: Array<{
    role: 'user' | 'ai';
    message: string;
    timestamp: string;
  }>;
}
```

### Urgency Assessment

```typescript
interface UrgencyAssessment {
  level: 'self_care' | 'consult_doctor' | 'urgent_care' | 'emergency';

  reasoning: string;

  recommendedAction: {
    type: 'self_care' | 'consult_doctor' | 'urgent_care' | 'emergency';
    description: string;
    timeframe?: string;
  };

  routing: {
    specialty?: string;
    specificSymptoms?: string[];
    diagnosticTests?: string[];
    selfCareInstructions?: string[];
  };

  emergencyIndicators?: string[];

  disclaimer: string;
  confidence: number;
}
```

### Smart Routing

```typescript
interface SmartRouting {
  recommendedSpecialties: Array<{
    specialty: string;
    relevanceScore: number;
    reason: string;
  }>;

  recommendedTests?: Array<{
    testName: string;
    reason: string;
    urgency: 'routine' | 'soon' | 'urgent';
  }>;

  selfCareGuidance?: string[];

  emergencyFlags: boolean;
  emergencySymptoms?: string[];
}
```

---

## 6. Doctor Discovery & Booking

### Doctor Profile

```typescript
interface Doctor {
  id: string;
  name: string;
  photo?: string;

  credentials: {
    specializations: string[];
    qualifications: string[];
    yearsOfExperience: number;
    languages: string[];
  };

  practice: {
    hospitalAffiliations: string[];
    clinicAddress?: Address;
    consultationModes: ('in_clinic' | 'teleconsult' | 'home_visit')[];
    consultationFees: {
      inClinic?: number;
      teleconsult?: number;
      homeVisit?: number;
    };
  };

  availability: {
    workingDays: number[]; // 0-6
    slots: TimeSlot[];
    nextAvailable?: string;
  };

  ratings: {
    average: number;
    totalReviews: number;
  };

  insuranceAccepted?: string[];

  languages: string[];
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

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  mode: 'in_clinic' | 'teleconsult' | 'home_visit';
}
```

### Booking

```typescript
interface HealthBooking {
  id: string;
  userId: string;
  profileId: string;

  providerType: 'doctor' | 'lab' | 'pharmacy' | 'wellness';
  providerId: string;

  type:
    | 'consultation'
    | 'follow_up'
    | 'diagnostic_test'
    | 'health_package'
    | 'teleconsult'
    | 'home_visit';

  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

  schedule: {
    date: string;
    startTime: string;
    endTime?: string;
    mode: 'in_clinic' | 'teleconsult' | 'home_visit' | 'online';
  };

  address?: Address;
  meetingLink?: string;

  payment: {
    amount: number;
    currency: string;
    status: 'pending' | 'paid' | 'refunded';
    method?: string;
  };

  notes?: string;
  cancellationReason?: string;

  createdAt: string;
  updatedAt: string;
}
```

---

## 7. Diagnostics Marketplace

### Lab Test

```typescript
interface LabTest {
  id: string;
  name: string;
  description?: string;
  category: string;

  parameters: string[];

  preparation?: string[];

  turnaroundTime: string;

  pricing: {
    amount: number;
    currency: string;
    discountedAmount?: number;
    validUntil?: string;
  };

  lab: {
    id: string;
    name: string;
    address: Address;
    rating?: number;
    nablAccredited: boolean;
    homeCollection: boolean;
    distance?: number;
  };

  homeCollection: {
    available: boolean;
    fees?: number;
    slots: string[];
  };
}

interface TestPackage {
  id: string;
  name: string;
  description: string;
  category: 'preventive' | 'diabetes' | 'cardiac' | 'thyroid' | 'womens_health' | 'senior' | 'fitness' | 'custom';

  tests: string[];

  includes: string[];
  notIncluded?: string[];

  recommendedFor: string[];

  pricing: {
    amount: number;
    currency: string;
    discountedAmount?: number;
  };

  lab: {
    id: string;
    name: string;
    nablAccredited: boolean;
  };
}
```

---

## 8. Pharmacy Infrastructure

### Prescription

```typescript
interface Prescription {
  id: string;
  userId: string;
  profileId: string;
  recordId?: string;

  doctor: {
    name: string;
    specialization?: string;
    registrationNumber?: string;
    contact?: string;
  };

  date: string;
  validUntil?: string;

  medications: Array<{
    name: string;
    genericName?: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    isGenericAvailable: boolean;
  }>;

  tests?: string[];
  advice?: string[];

  status: 'active' | 'completed' | 'cancelled';
}

interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  manufacturer?: string;

  composition?: string;
  form: 'tablet' | 'capsule' | 'syrup' | 'injection' | 'ointment' | 'drops' | 'patch' | 'inhaler' | 'other';

  strength?: string;

  pricing: {
    amount: number;
    currency: string;
    perUnit?: number;
  };

  requiresPrescription: boolean;

  pharmacies: Array<{
    id: string;
    name: string;
    address: Address;
    stock: number;
    price: number;
    deliveryTime?: string;
  }>;
}
```

---

## 9. Women's Health Platform

### Menstrual Cycle

```typescript
interface MenstrualCycleEntry {
  id: string;
  userId: string;
  profileId: string;

  date: string;
  type: 'period_start' | 'period_end' | 'spotting' | 'intercourse' | 'ovulation' | 'fertile_window' | 'symptom' | 'mood' | 'custom';

  flowIntensity?: 'light' | 'medium' | 'heavy';
  symptoms?: string[];
  mood?: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  energy?: 1 | 2 | 3 | 4 | 5;
  notes?: string;

  createdAt: string;
}

interface CycleAnalysis {
  userId: string;
  profileId: string;

  currentCycle: {
    startDate: string;
    dayNumber: number;
    predictedEnd?: string;
  };

  cycleStatistics: {
    averageLength: number;
    averagePeriodLength: number;
    cycleLengthTrend: 'regular' | 'slightly_irregular' | 'irregular';
    lastUpdated: string;
  };

  predictions: {
    nextPeriodStart?: string;
    fertileWindow?: {
      start: string;
      end: string;
    };
    ovulationDate?: string;
  };

  insights: Array<{
    type: 'positive' | 'neutral' | 'concerning';
    message: string;
    relatedSymptoms?: string[];
  }>;

  disclaimer: string;
}
```

---

## 10. Fitness & Wellness Layer

### Habit Tracking

```typescript
interface HabitEntry {
  id: string;
  userId: string;
  profileId: string;

  date: string;
  type: 'water' | 'sleep' | 'steps' | 'workout' | 'meditation' | 'nutrition' | 'custom';

  value: number | string;
  unit?: string;
  goal?: number;

  source?: 'manual' | 'wearable' | 'integration';

  notes?: string;
  createdAt: string;
}

interface WellnessChallenge {
  id: string;
  name: string;
  description: string;
  type: 'hydration' | 'sleep' | 'steps' | 'workout' | 'meditation' | 'preventive' | 'custom';

  duration: {
    startDate: string;
    endDate: string;
  };

  requirements: {
    dailyGoal: number;
    totalDays: number;
    minimumDaysRequired: number;
  };

  rewards: {
    coins: number;
    badge?: string;
    cashback?: number;
  };

  progress: {
    currentStreak: number;
    longestStreak: number;
    totalPoints: number;
    completedDays: number;
  };
}
```

---

## 11. Health Score Engine

### RisaCare Score

```typescript
interface HealthScore {
  userId: string;
  profileId: string;
  date: string;

  overall: {
    score: number; // 0-100
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    trend: 'improving' | 'stable' | 'declining';
  };

  components: {
    preventive: {
      score: number;
      weight: number;
      factors: {
        checkupRecency: number;
        vaccinationStatus: number;
        screeningCompletion: number;
      };
    };

    activity: {
      score: number;
      weight: number;
      factors: {
        dailyActivity: number;
        workoutConsistency: number;
        stepGoalAchievement: number;
      };
    };

    lifestyle: {
      score: number;
      weight: number;
      factors: {
        sleepQuality: number;
        hydration: number;
        stressManagement: number;
        substanceAvoidance: number;
      };
    };

    biomarkers: {
      score: number;
      weight: number;
      factors: {
        normalRanges: number;
        trendDirection: number;
        deficiencyTracking: number;
      };
    };

    engagement: {
      score: number;
      weight: number;
      factors: {
        recordUploads: number;
        healthCopilotUsage: number;
        challengeParticipation: number;
      };
    };
  };

  badges: Array<{
    id: string;
    name: string;
    earnedAt: string;
  }>;

  streaks: {
    habitStreak: number;
    checkupStreak: number;
    preventiveStreak: number;
  };
}
```

---

## 12. AI Health Copilot

### Copilot Tasks

```typescript
type CopilotTask =
  | 'explain_report'
  | 'track_biomarker'
  | 'compare_reports'
  | 'find_doctor'
  | 'book_appointment'
  | 'interpret_symptoms'
  | 'medication_reminder'
  | 'track_cycle'
  | 'health_score_insight'
  | 'preventive_checkup'
  | 'family_health'
  | 'general_health';

interface CopilotIntent {
  task: CopilotTask;
  confidence: number;
  entities: {
    biomarkers?: string[];
    symptoms?: string[];
    dates?: string[];
    doctors?: string[];
    tests?: string[];
    medications?: string[];
    profiles?: string[];
  };
  context: {
    currentProfileId: string;
    recentRecords?: string[];
    conversationHistory?: string[];
  };
}

interface CopilotResponse {
  task: CopilotTask;
  message: string;
  data?: unknown;
  actions?: Array<{
    type: 'navigate' | 'action' | 'form' | 'external';
    label: string;
    payload: Record<string, unknown>;
  }>;
  confidence: number;
  disclaimer?: string;
  source?: string;
}
```

---

## 13. Feature Flags

```typescript
interface FeatureFlags {
  // Core Features
  healthRecords: boolean;
  aiInterpretation: boolean;
  symptomNavigation: boolean;
  doctorBooking: boolean;
  labMarketplace: boolean;
  pharmacyDiscovery: boolean;

  // Advanced Features
  women'sHealth: boolean;
  fitnessTracking: boolean;
  healthScore: boolean;
  familyProfiles: boolean;
  corporateWellness: boolean;

  // AI Features
  aiCopilot: boolean;
  predictiveAlerts: boolean;
  wearableIntegration: boolean;

  // Commerce
  appointments: boolean;
  labOrders: boolean;
  medicineOrders: boolean;

  // Platform
  multiLanguage: boolean;
  voiceInput: boolean;
  offlineMode: boolean;
}
```

---

## 14. Error Handling

### Error Types

```typescript
interface HealthAPIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId: string;
}

type HealthErrorCode =
  | 'RECORD_NOT_FOUND'
  | 'OCR_FAILED'
  | 'EXTRACTION_FAILED'
  | 'INVALID_DOCUMENT_TYPE'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FORMAT'
  | 'BOOKING_UNAVAILABLE'
  | 'DOCTOR_NOT_FOUND'
  | 'SLOT_NOT_AVAILABLE'
  | 'PAYMENT_FAILED'
  | 'PRESCRIPTION_EXPIRED'
  | 'MEDICINE_NOT_FOUND'
  | 'UNAUTHORIZED_ACCESS'
  | 'CONSENT_REQUIRED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SERVICE_UNAVAILABLE';
```

---

## 15. Rate Limits

```typescript
interface RateLimits {
  // Per user per hour
  recordUpload: 50;
  aiInterpretations: 100;
  symptomQueries: 30;
  doctorSearch: 100;
  bookings: 10;
  labOrders: 10;

  // Global
  ocrRequests: 1000; // per minute
  aiRequests: 2000; // per minute
}
```

---

## 16. Retention Features

### High-Retention Feature Priority

| Feature | Retention Score | Why |
|---------|-----------------|-----|
| Health Records Vault | ⭐⭐⭐⭐⭐ | "Google Drive for Health" — sticky once records accumulate |
| Biomarker Trends | ⭐⭐⭐⭐⭐ | Users love tracking progress |
| Family Profiles | ⭐⭐⭐⭐ | One person manages multiple family members |
| Women's Health | ⭐⭐⭐⭐ | Standalone vertical with deep engagement |
| Health Score | ⭐⭐⭐ | Gamification drives engagement |
| Symptom Navigation | ⭐⭐⭐ | Useful but not sticky alone |
| Doctor Booking | ⭐⭐ | Transactional, not sticky |

---

## 17. Compliance & Privacy

### Data Handling

```typescript
interface PrivacySettings {
  consentVersion: string;
  consentGivenAt: string;

  sharing: {
    anonymousAnalytics: boolean;
    researchParticipation: boolean;
    thirdPartySharing: boolean;
    hospitalDataSharing: boolean;
  };

  retention: {
    recordsRetentionDays: number;
    logsRetentionDays: number;
    analyticsRetentionDays: number;
  };

  rights: {
    exportData: boolean;
    deleteData: boolean;
    restrictProcessing: boolean;
  };
}
```

### Compliance Requirements

- **DPDP Act** — India's Digital Personal Data Protection Act compliance ready
- **HIPAA-inspired** — Healthcare-grade storage and access controls
- **Consent-first** — All data sharing requires explicit consent
- **Audit trails** — All access logged and auditable
- **Encryption** — At rest and in transit
- **Right to deletion** — Users can request data deletion

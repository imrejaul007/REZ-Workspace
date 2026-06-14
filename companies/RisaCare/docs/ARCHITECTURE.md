# RisaCare — Technical Architecture

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RisaCare PLATFORM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  Patient App  │  Doctor App  │  Family Dashboard  │  Admin  │  Corporate  │
└───────┬───────────┬────────────┬─────────────────┬───────┬────────────────┘
        │           │            │                 │       │
        ▼           ▼            ▼                 ▼       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RisaCare API GATEWAY (4700)                         │
│  Authentication │ Rate Limiting │ Request Validation │ Routing │ Logging     │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                                       │
├──────────────┬──────────────┬──────────────┬──────────────┬───────────────┤
│   RECORDS    │   AI SERVICE │   PROFILE    │   BOOKING    │  MARKETPLACE  │
│   SERVICE    │              │   SERVICE    │   SERVICE    │   SERVICE    │
│   (4702)     │   (4703)     │   (4704)     │   (4705)     │   (4706)      │
├──────────────┴──────────────┴──────────────┴──────────────┴───────────────┤
│                         WELLNESS SERVICE (4707)                              │
│   Women's Health  │  Fitness Tracking  │  Habit Challenges                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                         CORPORATE SERVICE (4708)                             │
│   B2B Dashboard  │  Employee Wellness  │  Anonymous Analytics               │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      REZ INTELLIGENCE LAYER                                  │
├──────────────┬──────────────┬──────────────┬──────────────┬───────────────┤
│   HEALTH     │   IDENTITY   │   MEMORY     │   FEATURE    │   DECISION    │
│   EXPERT     │   GRAPH      │   LAYER      │   STORE      │   ENGINE      │
│   (3011)     │   (4050)     │   (4201)     │   (4127)     │   (4128)      │
├──────────────┴──────────────┴──────────────┴──────────────┴───────────────┤
│                         CENTRAL INTENT (4018)                                │
│                     Event Bus (4025) │ Feature Store (4127)                  │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       RABTUL CORE SERVICES                                   │
├──────────────┬──────────────┬──────────────┬──────────────┬───────────────┤
│   AUTH       │   WALLET     │   PAYMENT    │   NOTIFY     │   BOOKING     │
│   (4002)     │   (4004)     │   (4001)     │   (4011)     │   (4020)      │
└──────────────┴──────────────┴──────────────┴──────────────┴───────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                           │
├──────────────┬──────────────┬──────────────┬──────────────┬───────────────┤
│   MongoDB    │   Redis      │   S3/GCS     │   Atlas      │   Cloud       │
│   (Primary)  │   (Cache)    │   (Files)    │   Search     │   SQL         │
└──────────────┴──────────────┴──────────────┴──────────────┴───────────────┘
```

---

## 2. Service Architecture

### Service Directory

```
RisaCare/
├── risa-care-api-gateway/           # Port: 4700
│   ├── src/
│   │   ├── index.ts                  # Entry point
│   │   ├── routes/                   # Route definitions
│   │   ├── middleware/               # Auth, rate limit, validation
│   │   ├── services/                 # Gateway services
│   │   └── utils/                    # Helpers
│   └── package.json
│
├── health-records-service/           # Port: 4702
│   ├── src/
│   │   ├── index.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── recordService.ts      # CRUD operations
│   │   │   ├── ocrService.ts         # OCR processing
│   │   │   ├── extractionService.ts  # AI extraction
│   │   │   └── storageService.ts     # File storage
│   │   ├── models/
│   │   ├── events/                   # Event handlers
│   │   └── utils/
│   └── package.json
│
├── health-ai-service/                # Port: 4703
│   ├── src/
│   │   ├── index.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── interpretationService.ts
│   │   │   ├── symptomService.ts
│   │   │   ├── copilotService.ts
│   │   │   ├── trendService.ts
│   │   │   └── riskService.ts
│   │   ├── prompts/                  # AI prompts
│   │   └── utils/
│   └── package.json
│
├── health-profile-service/          # Port: 4704
│   ├── src/
│   │   ├── index.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── profileService.ts
│   │   │   ├── familyService.ts
│   │   │   └── consentService.ts
│   │   └── models/
│   └── package.json
│
├── health-booking-service/           # Port: 4705
│   ├── src/
│   │   ├── index.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── doctorService.ts
│   │   │   ├── bookingService.ts
│   │   │   ├── slotService.ts
│   │   │   └── reminderService.ts
│   │   └── models/
│   └── package.json
│
├── health-marketplace-service/       # Port: 4706
│   ├── src/
│   │   ├── index.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── labService.ts
│   │   │   ├── pharmacyService.ts
│   │   │   ├── orderService.ts
│   │   │   └── commissionService.ts
│   │   └── models/
│   └── package.json
│
├── health-wellness-service/          # Port: 4707
│   ├── src/
│   │   ├── index.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── cycleService.ts
│   │   │   ├── habitService.ts
│   │   │   ├── challengeService.ts
│   │   │   └── scoreService.ts
│   │   └── models/
│   └── package.json
│
├── health-corporate-service/         # Port: 4708
│   ├── src/
│   │   ├── index.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── corporateService.ts
│   │   │   ├── employeeService.ts
│   │   │   └── analyticsService.ts
│   │   └── models/
│   └── package.json
│
├── integrations/                     # External integrations
│   ├── rez-intelligence/              # REZ Intelligence client
│   ├── rabtul-services/               # RABTUL clients
│   ├── safe-qr/                       # Safe QR integration
│   ├── wearables/                     # Health data integrations
│   ├── labs/                          # Lab API integrations
│   └── pharmacies/                    # Pharmacy integrations
│
└── shared/                           # Shared code
    ├── types/                         # Zod schemas & types
    ├── events/                        # Event definitions
    ├── errors/                        # Error classes
    └── utils/                         # Common utilities
```

---

## 3. Data Flow Architecture

### Health Record Upload Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        HEALTH RECORD UPLOAD FLOW                              │
└──────────────────────────────────────────────────────────────────────────────┘

  User                    API Gateway            Records Service         AI Service
    │                          │                      │                      │
    │  POST /records/upload     │                      │                      │
    │─────────────────────────►│                      │                      │
    │                          │  Validate + Route    │                      │
    │                          │─────────────────────►│                      │
    │                          │                      │                      │
    │                          │                      │  Store file (S3)     │
    │                          │                      │───────────────────────│
    │                          │                      │◄──────────────────────│
    │                          │                      │                      │
    │                          │                      │  Emit: record.uploaded│
    │                          │                      │─────────────────────►│
    │                          │                      │                      │
    │                          │                      │  Trigger OCR         │
    │                          │                      │─────────────────────►│
    │                          │                      │                      │
    │                          │                      │      ┌───────────────┤
    │                          │                      │      │ OCR Engine    │
    │                          │                      │      │ • Text extract│
    │                          │                      │      │ • Confidence  │
    │                          │                      │      └───────┬───────┤
    │                          │                      │◄─────────────┘       │
    │                          │                      │                      │
    │                          │                      │  AI Biomarker Extract│
    │                          │                      │─────────────────────►│
    │                          │                      │                      │
    │                          │                      │      ┌───────────────┤
    │                          │                      │      │ Health Expert │
    │                          │                      │      │ • Parse values│
    │                          │                      │      │ • Normalize   │
    │                          │                      │      │ • Categorize  │
    │                          │                      │      │ • Risk assess │
    │                          │                      │      └───────┬───────┤
    │                          │                      │◄─────────────┘       │
    │                          │                      │                      │
    │                          │                      │  Store structured   │
    │                          │                      │  record + timeline   │
    │                          │                      │────────────────────►│
    │                          │                      │                      │  Memory Layer
    │                          │                      │                      │  • Remember
    │                          │                      │                      │    allergies
    │                          │                      │                      │  • Update
    │                          │                      │                      │    context
    │                          │                      │◄────────────────────│
    │                          │                      │                      │
    │  201 Created             │                      │                      │
    │  { record, biomarkers }  │                      │                      │
    │◄─────────────────────────│                      │                      │
    │                          │                      │                      │
    │                          │  Emit: health.record.created                 │
    │                          │────────────────────►│                      │
    │                          │                      │                      │  Event Bus
    │                          │                     ▼                      ▼
    │                          │              ┌─────────────────────────────┐│
    │                          │              │    Feature Store (4127)    ││
    │                          │              │  • Update health scores    ││
    │                          │              │  • Trigger alerts          ││
    │                          │              │  • Update segments        ││
    │                          │              └─────────────────────────────┘│
```

### AI Interpretation Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        AI INTERPRETATION FLOW                                │
└──────────────────────────────────────────────────────────────────────────────┘

  User                    AI Service               Health Expert        Memory Layer
    │                          │                      │                      │
    │  POST /ai/interpret       │                      │                      │
    │  { recordId }             │                      │                      │
    │─────────────────────────►│                      │                      │
    │                          │                      │                      │
    │                          │  Get user context     │                      │
    │                          │─────────────────────►│                      │
    │                          │                      │                      │
    │                          │      ┌───────────────────────────┐           │
    │                          │      │ Memory Layer (4201)       │           │
    │                          │      │ • User allergies          │           │
    │                          │      │ • Past conditions         │           │
    │                          │      │ • Previous doctors       │           │
    │                          │      │ • Recent symptoms        │           │
    │                          │      └─────────────┬─────────────┘           │
    │                          │◄──────────────────┘                        │
    │                          │                      │                      │
    │                          │  Prompt Engineering │                      │
    │                          │────────────────────►│                      │
    │                          │                      │                      │
    │                          │      ┌───────────────────────────┐           │
    │                          │      │ Health Expert (3011)       │           │
    │                          │      │ • Extract biomarkers      │           │
    │                          │      │ • Generate explanations   │           │
    │                          │      │ • Assess trends          │           │
    │                          │      │ • Safety disclaimers      │           │
    │                          │      │ • Confidence scoring     │           │
    │                          │      └─────────────┬─────────────┘           │
    │                          │◄──────────────────┘                        │
    │                          │                      │                      │
    │                          │  Apply Trust Layer                          │
    │                          │  • Add disclaimers                           │
    │                          │  • Add uncertainty indicators                │
    │                          │  • Add escalation paths                       │
    │                          │                      │                      │
    │  200 OK                  │                      │                      │
    │  { explanation,          │                      │                      │
    │    trends, signals }      │                      │                      │
    │◄─────────────────────────│                      │                      │
    │                          │                      │                      │
```

---

## 4. Database Architecture

### MongoDB Collections

```javascript
// health-users (extends REZ unified profile)
{
  _id: ObjectId,
  userId: String,           // Links to RABTUL auth
  profiles: [{
    profileId: String,
    name: String,
    relationship: String,   // self, father, mother, spouse, child, sibling
    age: Number,
    gender: String,
    bloodGroup: String,
    isPrimary: Boolean
  }],
  health: {
    allergies: [],
    chronicConditions: [],
    currentMedications: [],
    familyHistory: []
  },
  emergencyContacts: [],
  consent: {
    version: String,
    givenAt: Date,
    ...permissions
  },
  preferences: {},
  createdAt: Date,
  updatedAt: Date
}

// health-records
{
  _id: ObjectId,
  userId: String,
  profileId: String,
  type: String,             // blood_report, prescription, etc.
  title: String,
  file: {
    url: String,
    filename: String,
    mimeType: String,
    size: Number,
    storageKey: String
  },
  extracted: {
    date: Date,
    doctorName: String,
    hospitalName: String,
    labName: String,
    biomarkers: [{
      name: String,
      value: Mixed,
      unit: String,
      referenceRange: {},
      status: String,
      trend: String
    }],
    diagnosis: [String],
    rawText: String,
    ocrConfidence: Number,
    aiConfidence: Number
  },
  category: String,
  tags: [String],
  isAbnormal: Boolean,
  hasFollowUpRequired: Boolean,
  ocrJobId: String,
  createdAt: Date,
  updatedAt: Date
}

// health-appointments
{
  _id: ObjectId,
  userId: String,
  profileId: String,
  providerType: String,     // doctor, lab, pharmacy, wellness
  providerId: String,
  providerDetails: {},
  type: String,
  status: String,
  schedule: {
    date: Date,
    startTime: String,
    endTime: String,
    mode: String
  },
  address: {},
  meetingLink: String,
  payment: {
    amount: Number,
    status: String,
    transactionId: String
  },
  notes: String,
  reminderSent: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// health-timeline
{
  _id: ObjectId,
  userId: String,
  profileId: String,
  date: Date,
  type: String,
  title: String,
  description: String,
  relatedRecordIds: [ObjectId],
  relatedAppointmentId: ObjectId,
  metadata: {},
  createdAt: Date
}

// health-wellness
{
  _id: ObjectId,
  userId: String,
  profileId: String,
  type: String,            // cycle, habit, challenge
  data: Mixed,              // Type-specific data
  date: Date,
  createdAt: Date,
  updatedAt: Date
}

// health-risks
{
  _id: ObjectId,
  userId: String,
  profileId: String,
  signalType: String,
  severity: String,
  title: String,
  description: String,
  relatedRecordIds: [ObjectId],
  recommendedAction: {},
  dismissible: Boolean,
  dismissedAt: Date,
  readAt: Date,
  createdAt: Date
}

// health-doctors (provider directory)
{
  _id: ObjectId,
  doctorId: String,
  name: String,
  photo: String,
  specializations: [String],
  qualifications: [String],
  yearsOfExperience: Number,
  languages: [String],
  practice: {},
  availability: {},
  ratings: {},
  insuranceAccepted: [String],
  isVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// health-labs
{
  _id: ObjectId,
  labId: String,
  name: String,
  address: {},
  tests: [{
    testId: String,
    name: String,
    price: Number,
    turnaroundTime: String,
    homeCollection: Boolean
  }],
  rating: Number,
  nablAccredited: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Redis Cache Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                        REDIS CACHE LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  USER SESSIONS                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Session:{userId} → { profileId, lastActive, settings }   │  │
│  │  TTL: 24 hours                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  USER PROFILES                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  HealthProfile:{userId} → { serialized profile data }     │  │
│  │  TTL: 1 hour                                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  BIOMARKER TRENDS (HOT DATA)                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  BiomarkerTrend:{userId}:{profileId}:{biomarker} → [...]  │  │
│  │  TTL: 6 hours                                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  DOCTOR AVAILABILITY                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  DoctorSlots:{doctorId}:{date} → { available slots }     │  │
│  │  TTL: 5 minutes                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  OCR JOB STATUS                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  OCRJob:{jobId} → { status, progress, result, error }     │  │
│  │  TTL: 1 hour                                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  RATE LIMITING                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  RateLimit:{userId}:{endpoint} → { count, windowStart } │  │
│  │  TTL: 1 hour (sliding window)                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  AI COPILOT CONTEXT                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CopilotCtx:{sessionId} → { conversationHistory }        │  │
│  │  TTL: 30 minutes                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### File Storage (S3/GCS)

```
┌─────────────────────────────────────────────────────────────────┐
│                        FILE STORAGE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BUCKET: risa-care-records                                      │
│  ├── user-uploads/                                              │
│  │   ├── {userId}/                                              │
│  │   │   ├── {profileId}/                                       │
│  │   │   │   ├── reports/                                       │
│  │   │   │   │   ├── {recordId}.pdf                            │
│  │   │   │   │   ├── {recordId}_1.jpg                          │
│  │   │   │   │   └── {recordId}_2.png                          │
│  │   │   │   └── prescriptions/                                │
│  │   │   │       └── {prescriptionId}.pdf                      │
│  │   │   └── images/                                            │
│  │   │       └── {imageId}.jpg                                 │
│  │   └── temp/                                                  │
│  │       └── {tempUploadId}/  (cleaned after 24h)              │
│  │                                                            │
│  ├── processed/                                                 │
│  │   ├── ocr/                                                  │
│  │   │   └── {recordId}_raw.txt                                │
│  │   └── thumbnails/                                           │
│  │       └── {recordId}_thumb.jpg                              │
│  │                                                            │
│  └── exports/                                                  │
│      └── {userId}/                                             │
│          └── {exportId}_health_data.zip                        │
│                                                                  │
│  RETENTION POLICY                                              │
│  ├── Active records: Indefinite                                 │
│  ├── Temp uploads: 24 hours                                     │
│  └── Data exports: 7 days                                      │
│                                                                  │
│  ENCRYPTION                                                    │
│  ├── At rest: AES-256                                          │
│  └── In transit: TLS 1.3                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. API Gateway Architecture

```typescript
// Gateway middleware stack
const middlewareStack = [
  // 1. Request parsing
  'bodyParser',
  'jsonParser',
  'urlParser',

  // 2. Security
  'helmet',              // Security headers
  'cors',                // CORS handling
  'requestId',           // Request ID generation

  // 3. Authentication
  'authenticate',        // JWT verification
  'loadUser',            // Load user context

  // 4. Rate limiting
  'rateLimit',           // Per-endpoint limits
  'quotaCheck',          // API quota

  // 5. Validation
  'validate',            // Input validation (Zod)
  'sanitize',            // XSS prevention

  // 6. Route handling
  'route',

  // 7. Response
  'compress',
  'responseTime',

  // 8. Logging
  'logger'
];

// Route configuration
const routes = {
  '/api/v1/records': {
    service: 'health-records-service',
    endpoints: {
      'POST /upload': 'uploadRecord',
      'GET /': 'listRecords',
      'GET /:id': 'getRecord',
      'DELETE /:id': 'deleteRecord',
      'GET /timeline': 'getTimeline'
    }
  },

  '/api/v1/ai': {
    service: 'health-ai-service',
    endpoints: {
      'POST /interpret': 'interpretReport',
      'POST /symptoms': 'assessSymptoms',
      'GET /trends/:biomarker': 'getTrends',
      'POST /copilot': 'processCopilot'
    }
  },

  '/api/v1/profile': {
    service: 'health-profile-service',
    endpoints: {
      'GET /': 'getProfile',
      'PUT /': 'updateProfile',
      'GET /family': 'getFamilyMembers',
      'POST /family': 'addFamilyMember',
      'PUT /family/:id': 'updateFamilyMember',
      'DELETE /family/:id': 'removeFamilyMember'
    }
  },

  '/api/v1/booking': {
    service: 'health-booking-service',
    endpoints: {
      'GET /doctors': 'searchDoctors',
      'GET /doctors/:id': 'getDoctor',
      'GET /doctors/:id/slots': 'getAvailableSlots',
      'POST /appointments': 'createBooking',
      'GET /appointments': 'listBookings',
      'PUT /appointments/:id': 'updateBooking',
      'DELETE /appointments/:id': 'cancelBooking'
    }
  },

  '/api/v1/marketplace': {
    service: 'health-marketplace-service',
    endpoints: {
      'GET /labs': 'searchLabs',
      'GET /tests': 'searchTests',
      'GET /tests/:id': 'getTestDetails',
      'POST /orders': 'createOrder',
      'GET /pharmacies': 'searchPharmacies',
      'GET /medicines/:id': 'getMedicineAvailability'
    }
  },

  '/api/v1/wellness': {
    service: 'health-wellness-service',
    endpoints: {
      'GET /cycle': 'getCycleData',
      'POST /cycle': 'logCycleEntry',
      'GET /habits': 'getHabitData',
      'POST /habits': 'logHabitEntry',
      'GET /challenges': 'listChallenges',
      'POST /challenges/:id/join': 'joinChallenge',
      'GET /score': 'getHealthScore'
    }
  }
};
```

---

## 6. Event-Driven Architecture

### Event Bus Integration

```typescript
// Health events emitted to REZ Event Bus (4025)
const healthEvents = {
  // Record events
  'health.record.uploaded': {
    schema: {
      userId: 'string',
      profileId: 'string',
      recordId: 'string',
      type: 'string',
      category: 'string',
      isAbnormal: 'boolean'
    }
  },

  'health.record.interpreted': {
    schema: {
      userId: 'string',
      profileId: 'string',
      recordId: 'string',
      biomarkers: 'array',
      riskSignals: 'array'
    }
  },

  'health.record.deleted': {
    schema: {
      userId: 'string',
      recordId: 'string'
    }
  },

  // Appointment events
  'health.appointment.booked': {
    schema: {
      userId: 'string',
      profileId: 'string',
      appointmentId: 'string',
      providerType: 'string',
      providerId: 'string',
      date: 'string'
    }
  },

  'health.appointment.completed': {
    schema: {
      userId: 'string',
      appointmentId: 'string',
      type: 'string'
    }
  },

  // Wellness events
  'health.cycle.logged': {
    schema: {
      userId: 'string',
      profileId: 'string',
      type: 'string',
      date: 'string'
    }
  },

  'health.habit.completed': {
    schema: {
      userId: 'string',
      profileId: 'string',
      habitType: 'string',
      streak: 'number'
    }
  },

  'health.challenge.joined': {
    schema: {
      userId: 'string',
      challengeId: 'string'
    }
  },

  // AI events
  'health.ai.interpreted': {
    schema: {
      userId: 'string',
      recordId: 'string',
      confidence: 'number',
      responseTime: 'number'
    }
  },

  'health.symptom.assessed': {
    schema: {
      userId: 'string',
      urgencyLevel: 'string',
      recommendedSpecialty: 'string'
    }
  },

  // Risk events
  'health.risk.detected': {
    schema: {
      userId: 'string',
      profileId: 'string',
      riskType: 'string',
      severity: 'string',
      biomarkers: 'array'
    }
  },

  'health.alert.triggered': {
    schema: {
      userId: 'string',
      alertType: 'string',
      message: 'string',
      requiresAction: 'boolean'
    }
  }
};
```

### Event Processing

```typescript
// Event consumers
const eventConsumers = {
  // Feature Store updates
  'health.record.uploaded': [
    {
      handler: 'updateHealthScoreFeatures',
      service: 'feature-store'
    },
    {
      handler: 'updateBiomarkerTrends',
      service: 'feature-store'
    },
    {
      handler: 'updateUserSegments',
      service: 'realtime-segments'
    }
  ],

  'health.appointment.completed': [
    {
      handler: 'updateEngagementScore',
      service: 'feature-store'
    },
    {
      handler: 'sendFollowupReminders',
      service: 'notification-service'
    }
  ],

  'health.risk.detected': [
    {
      handler: 'triggerProactiveCare',
      service: 'care-service'
    },
    {
      handler: 'notifyCareTeam',
      service: 'notification-service'
    }
  ],

  'health.challenge.joined': [
    {
      handler: 'initiateChallengeTracking',
      service: 'wellness-service'
    },
    {
      handler: 'updateGamification',
      service: 'wallet-service'
    }
  ]
};
```

---

## 7. AI Service Architecture

### AI Pipeline

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           AI SERVICE PIPELINE                                 │
└──────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                         INPUT PROCESSING                                  │
  │  • Validate request                                                       │
  │  • Load user context (memory layer)                                       │
  │  • Load profile (unified profile)                                        │
  │  • Check feature flags                                                   │
  └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                      TRUST LAYER (Pre-Processing)                         │
  │  • Check for emergency indicators                                         │
  │  • Apply safety filters                                                   │
  │  • Load conversation history                                              │
  └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                      CONTEXT AGGREGATION                                  │
  │  • Fetch from Memory Layer (allergies, conditions, history)              │
  │  • Fetch from Feature Store (biomarker trends, health scores)            │
  │  • Fetch from Unified Profile (demographics, preferences)                │
  │  • Combine into context window                                           │
  └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                      PROMPT ENGINEERING                                   │
  │  • Select appropriate prompt template                                     │
  │  • Inject user context                                                    │
  │  • Inject safety guidelines                                               │
  │  • Inject disclaimer templates                                            │
  │  • Apply output constraints                                               │
  └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                      AI EXECUTION                                         │
  │  • Route to appropriate expert:                                           │
  │    - Health Expert (3011) for medical queries                           │
  │    - Fitness Expert (3010) for wellness queries                         │
  │    - Central Intent (4018) for routing                                   │
  │  • Execute with timeout (30s max)                                         │
  │  • Capture usage metrics                                                 │
  └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                      RESPONSE PROCESSING                                  │
  │  • Validate response schema                                               │
  │  • Calculate confidence scores                                             │
  │  • Add uncertainty indicators                                             │
  │  • Inject mandatory disclaimers                                           │
  │  • Format for UI consumption                                              │
  └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                      TRUST LAYER (Post-Processing)                       │
  │  • Safety check output                                                    │
  │  • Add escalation paths if needed                                         │
  │  • Audit log entry                                                         │
  │  • Rate limit check                                                        │
  └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                              ┌───────────┐
                              │  RESPONSE │
                              └───────────┘
```

### Prompt Templates

```typescript
// Report Interpretation Prompt
const reportInterpretationPrompt = `
<system>
You are RisaCare AI, a healthcare navigation assistant.
You help users understand their health reports in plain language.
You are NOT a doctor and CANNOT diagnose conditions.
You CANNOT prescribe medications or treatments.

CRITICAL RULES:
1. Always explain biomarkers in simple, clear language
2. Never diagnose - always use "may indicate" or "appears to suggest"
3. Always include uncertainty indicators
4. Always include safety disclaimers
5. Always suggest consulting a doctor for abnormal results
6. Never make definitive statements about diseases
7. Consider the user's health context (allergies, conditions, medications)

Your responses must be:
- Safe and responsible
- Clear and understandable
- Supportive, not alarming
- Actionable with next steps
</system>

<context>
User Profile:
- Age: {age}
- Gender: {gender}
- Known Allergies: {allergies}
- Chronic Conditions: {conditions}
- Current Medications: {medications}

Historical Context:
- Previous similar tests: {previousTests}
- Trend direction: {trendDirection}
- Last checkup: {lastCheckup}

Report Details:
- Report Type: {reportType}
- Date: {reportDate}
- Lab Name: {labName}
- biomarkers:
{biomarkers}

Extracted Information:
- Raw OCR Text: {rawText}
- AI Confidence: {aiConfidence}%
</context>

<task>
1. Explain each biomarker in simple terms
2. Indicate if values are normal, low, high, or borderline
3. Compare with previous results if available
4. Identify any concerning patterns
5. Provide general guidance (not medical advice)
6. Include appropriate disclaimers
</task>

<output_format>
Return JSON with the following structure:
{
  "explanations": [
    {
      "biomarker": "string",
      "value": "string",
      "status": "normal|low|high|borderline|critical",
      "whatItMeans": "string (simple explanation)",
      "whyItMatters": "string",
      "trend": "improving|stable|worsening|null",
      "confidence": 0-100,
      "needsAttention": boolean,
      "generalGuidance": "string"
    }
  ],
  "overallAssessment": {
    "summary": "string",
    "needsDoctorConsult": boolean,
    "urgency": "low|medium|high"
  },
  "safetySignals": [
    {
      "indicator": "string",
      "action": "string"
    }
  ],
  "disclaimer": "This is not medical advice. Please consult a healthcare professional for interpretation.",
  "confidence": 0-100
}
</output_format>
`;
```

---

## 8. Security Architecture

### Authentication Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION FLOW                                    │
└──────────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐                      ┌──────────┐                      ┌──────────┐
  │   User   │                      │   API    │                      │  RABTUL  │
  │   App    │                      │ Gateway  │                      │   Auth   │
  └────┬─────┘                      └────┬─────┘                      └────┬─────┘
       │                                 │                                 │
       │  1. Login Request               │                                 │
       │────────────────────────────────►│                                 │
       │                                 │                                 │
       │                                 │  2. Verify Credentials          │
       │                                 │────────────────────────────────►│
       │                                 │                                 │
       │                                 │◄────────────────────────────────│
       │                                 │  3. JWT Token                   │
       │  4. JWT Token                   │                                 │
       │◄────────────────────────────────│                                 │
       │                                 │                                 │
       │  5. API Request + Token          │                                 │
       │────────────────────────────────►│                                 │
       │                                 │                                 │
       │                                 │  6. Verify Token                │
       │                                 │────────────────────────────────►│
       │                                 │                                 │
       │                                 │◄────────────────────────────────│
       │                                 │  7. User Context                │
       │                                 │                                 │
       │                                 │  8. Load Health Profile         │
       │                                 │────────────────────────────────►│
       │                                 │  REZ Unified Profile (4120)    │
       │                                 │                                 │
       │  9. Response + Health Context    │                                 │
       │◄────────────────────────────────│                                 │
```

### Security Layers

```typescript
// Security middleware stack
const securityMiddleware = [
  // 1. TLS/SSL (infrastructure level)

  // 2. Helmet (security headers)
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true
    }
  }),

  // 3. CORS
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
  }),

  // 4. Rate limiting
  rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: {
      recordUpload: 50,
      aiInterpretations: 100,
      symptomQueries: 30,
      general: 1000
    },
    message: 'Rate limit exceeded'
  }),

  // 5. Input validation (Zod)
  validate(healthRecordSchema),

  // 6. XSS sanitization
  sanitize(),

  // 7. Request ID
  requestId(),

  // 8. Audit logging
  auditLog(),

  // 9. Biometric verification (for sensitive actions)
  biometricVerify({
    requiredFor: [
      'delete_record',
      'share_record',
      'view_sensitive',
      'emergency_access'
    ]
  })
];

// Biometric verification flow
const biometricFlow = {
  step1: 'User initiates sensitive action',
  step2: 'App prompts biometric (Face ID / fingerprint)',
  step3: 'App sends action + biometric token to gateway',
  step4: 'Gateway verifies with RABTUL Auth',
  step5: 'If verified, proceed with action',
  step6: 'Log biometric verification in audit trail'
};
```

### Data Encryption

```typescript
// Encryption at rest (MongoDB field-level)
const encryptionConfig = {
  // Sensitive fields encrypted with AES-256
  encryptedFields: [
    'health.allergies',
    'health.chronicConditions',
    'health.currentMedications',
    'emergencyContacts.phone',
    'extracted.rawText'
  ],

  // Key management
  keyManagement: 'aws-kms', // or 'gcp-kms'
  keyRotationPeriod: '90 days',

  // Backup encryption
  backupEncryption: true,
  backupKeySeparate: true
};

// Encryption in transit
const transitConfig = {
  tlsVersion: '1.3',
  cipherSuites: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256'
  ]
};
```

---

## 9. Monitoring & Observability

### Metrics Architecture

```typescript
// Health-specific metrics
const healthMetrics = {
  // API Metrics
  api: {
    requests_total: 'counter',
    requests_by_endpoint: 'counter',
    request_duration_seconds: 'histogram',
    request_errors_total: 'counter',
    active_requests: 'gauge'
  },

  // Business Metrics
  business: {
    records_uploaded_total: 'counter',
    records_by_type: 'counter',
    appointments_booked_total: 'counter',
    appointments_completed_total: 'counter',
    ai_interpretations_total: 'counter',
    symptom_assessments_total: 'counter',
    active_users_health: 'gauge',
    family_profiles_created: 'counter'
  },

  // AI Metrics
  ai: {
    interpretation_latency_seconds: 'histogram',
    interpretation_confidence: 'histogram',
    ocr_confidence: 'histogram',
    ai_requests_total: 'counter',
    ai_errors_total: 'counter',
    safety_escalations_total: 'counter'
  },

  // Health Score Metrics
  healthScore: {
    average_score: 'gauge',
    score_distribution: 'histogram',
    score_trending_up: 'counter',
    score_trending_down: 'counter'
  },

  // Engagement Metrics
  engagement: {
    daily_active_users: 'gauge',
    monthly_active_users: 'gauge',
    records_per_user: 'histogram',
    ai_usage_per_user: 'histogram',
    wellness_activities_total: 'counter'
  }
};

// Alerting rules
const alertRules = {
  // API Health
  apiErrorRate: {
    condition: 'error_rate > 5%',
    severity: 'critical',
    window: '5m'
  },

  // AI Health
  aiLatencyP99: {
    condition: 'p99_latency > 10s',
    severity: 'warning'
  },

  aiConfidenceDrop: {
    condition: 'avg_confidence < 60%',
    severity: 'warning'
  },

  // Business Health
  zeroUploads: {
    condition: 'records_uploaded == 0 for 24h',
    severity: 'info'
  },

  // Security
  authFailureSpike: {
    condition: 'auth_failures > 100 in 5m',
    severity: 'critical'
  },

  dataBreachAttempt: {
    condition: 'unauthorized_access_attempts > 10',
    severity: 'critical'
  }
};
```

### Logging Strategy

```typescript
// Structured logging format
const logFormat = {
  timestamp: 'ISO 8601',
  level: 'debug|info|warn|error',
  requestId: 'uuid',
  userId: 'user_id',
  profileId: 'profile_id',
  action: 'action_type',
  service: 'service_name',
  duration: 'milliseconds',
  status: 'success|failure',
  error?: {
    code: 'error_code',
    message: 'error_message',
    stack: 'stack_trace'
  },
  metadata: {}
};

// Health-specific log events
const healthLogEvents = {
  // Record events
  'record.upload.started': { level: 'info', PII: false },
  'record.upload.completed': { level: 'info', PII: false },
  'record.upload.failed': { level: 'error', PII: false },
  'record.ocr.started': { level: 'debug', PII: false },
  'record.ocr.completed': { level: 'debug', PII: false },
  'record.extraction.started': { level: 'debug', PII: true },
  'record.extraction.completed': { level: 'debug', PII: true },
  'record.deleted': { level: 'info', PII: false },
  'record.shared': { level: 'info', PII: false },

  // AI events
  'ai.interpretation.requested': { level: 'info', PII: false },
  'ai.interpretation.completed': { level: 'info', PII: false },
  'ai.symptom.assessed': { level: 'info', PII: false },
  'ai.emergency.detected': { level: 'critical', PII: false },
  'ai.safety.escalation': { level: 'warning', PII: false },

  // Access events
  'health.record.accessed': { level: 'info', PII: true },
  'health.emergency.accessed': { level: 'critical', PII: true },
  'health.data.exported': { level: 'info', PII: true },
  'health.data.deleted': { level: 'warning', PII: true }
};
```

---

## 10. Deployment Architecture

### Container Structure

```yaml
# docker-compose.yml
version: '3.8'

services:
  health-api-gateway:
    build: ./risa-care-api-gateway
    ports:
      - "4700:4700"
    environment:
      - NODE_ENV=production
      - PORT=4700
      - INTERNAL_SERVICE_TOKEN=${INTERNAL_SERVICE_TOKEN}
      - REDIS_URL=redis://redis:6379
      - MONGODB_URI=mongodb://mongo:27017/risa-care
      - S3_BUCKET=${S3_BUCKET}
      - AWS_REGION=${AWS_REGION}
    depends_on:
      - redis
      - mongo
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  health-records-service:
    build: ./health-records-service
    ports:
      - "4702:4702"
    environment:
      - NODE_ENV=production
      - PORT=4702
      - MONGODB_URI=mongodb://mongo:27017/risa-care
      - S3_BUCKET=${S3_BUCKET}
      - REZ_INTELLIGENCE_URL=http://rez-intent-predictor:4018
      - REZ_HEALTH_EXPERT_URL=http://risa-care-expert:3011
    depends_on:
      - mongo
    deploy:
      replicas: 2

  health-ai-service:
    build: ./health-ai-service
    ports:
      - "4703:4703"
    environment:
      - NODE_ENV=production
      - PORT=4703
      - REZ_INTELLIGENCE_URL=http://rez-intent-predictor:4018
      - REZ_HEALTH_EXPERT_URL=http://risa-care-expert:3011
      - REZ_MEMORY_LAYER_URL=http://REZ-memory-layer:4201
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    deploy:
      replicas: 3

  # ... other services

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=risa-care

volumes:
  redis_data:
  mongo_data:
```

### Kubernetes Configuration

```yaml
# health-services.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: health-records-service
  namespace: risa-care
spec:
  replicas: 3
  selector:
    matchLabels:
      app: health-records-service
  template:
    metadata:
      labels:
        app: health-records-service
    spec:
      containers:
        - name: health-records-service
          image: risa-care/records-service:latest
          ports:
            - containerPort: 4702
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          env:
            - name: MONGODB_URI
              valueFrom:
                secretKeyRef:
                  name: risa-care-secrets
                  key: mongodb-uri
            - name: INTERNAL_SERVICE_TOKEN
              valueFrom:
                secretKeyRef:
                  name: risa-care-secrets
                  key: internal-token
          livenessProbe:
            httpGet:
              path: /health
              port: 4702
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 4702
            initialDelaySeconds: 5
            periodSeconds: 5
```

---

## 11. Scalability Considerations

### Horizontal Scaling

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SCALING ARCHITECTURE                                 │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────┐
                         │  Load Balancer  │
                         │  (API Gateway)  │
                         └────────┬────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
     ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
     │  Gateway Pod 1  │ │  Gateway Pod 2  │ │  Gateway Pod 3  │
     └────────────────┘ └────────────────┘ └────────────────┘
              │                   │                   │
              └───────────────────┼───────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  Service Mesh   │
                         │   (Istio/Envoy) │
                         └────────┬────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
 ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
 │ Records Svc  │          │   AI Svc      │          │  Profile Svc │
 │ (3 replicas) │          │ (5 replicas)  │          │ (2 replicas) │
 └──────────────┘          └──────────────┘          └──────────────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  Redis Cluster  │
                         │  (Read Replica) │
                         └─────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  MongoDB RS     │
                         │ Primary + 2 RCs │
                         └─────────────────┘
```

### Auto-scaling Triggers

```yaml
# Horizontal Pod Autoscaler configuration
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: health-ai-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: health-ai-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
    - type: Pods
      pods:
        metric:
          name: ai_requests_per_second
        target:
          type: AverageValue
          averageValue: "100"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
```

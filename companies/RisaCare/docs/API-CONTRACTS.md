# RisaCare — API Contracts

---

## Base Configuration

```
Base URL: https://api.rez.money/health/v1
Authentication: Bearer JWT (RABTUL Auth)
Rate Limit: See Rate Limits section
Content-Type: application/json
```

### Standard Response Format

```typescript
// Success Response
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    requestId: string;
    timestamp: string;
  };
}

// Error Response
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId: string;
    timestamp: string;
  };
}
```

---

## 1. Health Records API

### Base Path: `/records`

#### Upload Record

```
POST /records/upload
Content-Type: multipart/form-data
```

**Request:**
```
file: binary (required)
profileId: string (required)
type: HealthDocumentType (required)
title: string (optional)
description: string (optional)
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "rec_abc123",
    "userId": "user_xyz",
    "profileId": "profile_123",
    "type": "blood_report",
    "title": "CBC Test - March 2026",
    "file": {
      "url": "https://storage.rez.health/records/...",
      "filename": "cbc_march.pdf",
      "mimeType": "application/pdf",
      "size": 245000
    },
    "status": "processing",
    "createdAt": "2026-03-15T10:30:00Z"
  },
  "meta": {
    "requestId": "req_123"
  }
}
```

**WebSocket Event:** `record.processing.status` (sent when OCR completes)

---

#### Get Record

```
GET /records/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "rec_abc123",
    "userId": "user_xyz",
    "profileId": "profile_123",
    "type": "blood_report",
    "title": "CBC Test - March 2026",
    "file": {
      "url": "https://storage.rez.health/records/...",
      "filename": "cbc_march.pdf"
    },
    "extracted": {
      "date": "2026-03-14",
      "doctorName": "Dr. Priya Sharma",
      "hospitalName": "Apollo Hospital",
      "labName": "Apollo Diagnostics",
      "biomarkers": [
        {
          "name": "Hemoglobin",
          "value": 14.5,
          "unit": "g/dL",
          "referenceRange": { "min": 12, "max": 17 },
          "status": "normal"
        },
        {
          "name": "Vitamin D",
          "value": 18,
          "unit": "ng/mL",
          "referenceRange": { "min": 30, "max": 100 },
          "status": "low"
        }
      ],
      "ocrConfidence": 0.95,
      "aiConfidence": 0.88
    },
    "category": "blood",
    "tags": ["cbc", "routine", "annual"],
    "isAbnormal": true,
    "hasFollowUpRequired": true,
    "createdAt": "2026-03-15T10:30:00Z",
    "updatedAt": "2026-03-15T10:35:00Z"
  }
}
```

---

#### List Records

```
GET /records
```

**Query Parameters:**
```
profileId: string (optional)
type: HealthDocumentType (optional)
category: HealthCategory (optional)
startDate: ISO8601 (optional)
endDate: ISO8601 (optional)
search: string (optional)
limit: number (default: 20, max: 100)
offset: number (default: 0)
sortBy: date|title|type (default: date)
sortOrder: asc|desc (default: desc)
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "rec_abc123",
      "type": "blood_report",
      "title": "CBC Test - March 2026",
      "date": "2026-03-14",
      "labName": "Apollo Diagnostics",
      "isAbnormal": true,
      "category": "blood"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    },
    "requestId": "req_123"
  }
}
```

---

#### Delete Record

```
DELETE /records/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "deleted": true,
    "recordId": "rec_abc123"
  }
}
```

---

#### Get Health Timeline

```
GET /records/timeline
```

**Query Parameters:**
```
profileId: string (optional)
startDate: ISO8601 (optional)
endDate: ISO8601 (optional)
types: string[] (optional)
categories: string[] (optional)
search: string (optional)
limit: number (default: 50)
offset: number (default: 0)
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "evt_001",
      "date": "2026-03-14",
      "type": "record_uploaded",
      "title": "CBC Test",
      "description": "Blood report from Apollo Diagnostics",
      "category": "blood",
      "relatedRecordId": "rec_abc123",
      "isAbnormal": true
    },
    {
      "id": "evt_002",
      "date": "2026-02-01",
      "type": "appointment",
      "title": "General Physician Consultation",
      "description": "Dr. Sharma",
      "relatedAppointmentId": "apt_xyz"
    },
    {
      "id": "evt_003",
      "date": "2026-01-15",
      "type": "vaccination",
      "title": "Flu Vaccine",
      "relatedRecordId": "rec_vac123"
    }
  ],
  "meta": {
    "pagination": { ... }
  }
}
```

---

## 2. AI Interpretation API

### Base Path: `/ai`

#### Interpret Report

```
POST /ai/interpret
```

**Request:**
```json
{
  "recordId": "rec_abc123",
  "profileId": "profile_123",
  "options": {
    "includeTrends": true,
    "includeComparisons": true,
    "includeAlerts": true
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "recordId": "rec_abc123",
    "interpretations": [
      {
        "biomarker": "Hemoglobin",
        "value": "14.5 g/dL",
        "status": "normal",
        "explanation": {
          "whatItMeans": "Hemoglobin carries oxygen in your blood. Your level is within the healthy range.",
          "whyItMatters": "Normal hemoglobin indicates your blood can effectively transport oxygen to your body's tissues.",
          "generalGuidance": "Continue maintaining a balanced diet rich in iron."
        },
        "confidence": 92,
        "needsAttention": false,
        "trend": "stable"
      },
      {
        "biomarker": "Vitamin D",
        "value": "18 ng/mL",
        "status": "low",
        "explanation": {
          "whatItMeans": "Your Vitamin D level is below the recommended range of 30-100 ng/mL.",
          "whyItMatters": "Vitamin D is essential for bone health, immune function, and mood regulation.",
          "possibleCauses": [
            "Limited sun exposure",
            "Dietary insufficiency",
            "Absorption issues"
          ],
          "generalGuidance": "Consider increasing sun exposure, consuming Vitamin D-rich foods, or consulting your doctor about supplementation."
        },
        "confidence": 88,
        "needsAttention": true,
        "trend": "stable",
        "recommendedAction": "consult_doctor"
      }
    ],
    "overallAssessment": {
      "summary": "Most values are normal. Vitamin D shows a deficiency that may need attention.",
      "needsDoctorConsult": true,
      "urgency": "medium"
    },
    "safetySignals": [
      {
        "indicator": "Vitamin D below 20 ng/mL",
        "action": "Consider consulting a doctor for Vitamin D supplementation"
      }
    ],
    "trends": {
      "biomarkers": [
        {
          "name": "Hemoglobin",
          "trend": "stable",
          "values": [
            { "value": 14.2, "date": "2025-09-01" },
            { "value": 14.5, "date": "2026-03-14" }
          ]
        }
      ]
    },
    "disclaimer": "This interpretation is for educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider with any questions about your health.",
    "confidence": 85
  }
}
```

---

#### Assess Symptoms

```
POST /ai/symptoms
```

**Request:**
```json
{
  "profileId": "profile_123",
  "conversation": [
    {
      "role": "user",
      "message": "I've been having fever and cough for 3 days"
    },
    {
      "role": "ai",
      "message": "How severe is your fever? Have you measured your temperature?"
    },
    {
      "role": "user",
      "message": "Around 101°F. I also have body ache."
    }
  ],
  "context": {
    "age": 32,
    "gender": "male",
    "existingConditions": [],
    "allergies": ["penicillin"]
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_abc",
    "assessment": {
      "urgency": "consult_doctor",
      "reasoning": "You have had a fever for 3 days with body aches. While this could be a viral infection, prolonged fever should be evaluated.",
      "recommendedAction": {
        "type": "consult_doctor",
        "description": "Based on your symptoms, we recommend consulting a General Physician.",
        "timeframe": "within 24-48 hours"
      }
    },
    "routing": {
      "specialties": [
        {
          "specialty": "General Physician",
          "relevanceScore": 0.95,
          "reason": "Primary care for fever and respiratory symptoms"
        }
      ],
      "tests": [
        {
          "testName": "CBC (Complete Blood Count)",
          "reason": "Doctors commonly order this to evaluate fever causes",
          "urgency": "routine"
        },
        {
          "testName": "COVID-19 / Influenza Test",
          "reason": "To rule out common viral infections",
          "urgency": "recommended"
        }
      ]
    },
    "selfCare": [
      "Stay hydrated - drink plenty of fluids",
      "Rest adequately",
      "Take fever reducers if needed (avoid aspirin in viral infections)",
      "Monitor temperature regularly"
    ],
    "emergencyFlags": false,
    "message": "Based on your symptoms, a General Physician consultation would be appropriate. I've also listed some tests that doctors commonly recommend for these symptoms. Would you like me to help you find a doctor or book any tests?",
    "confidence": 78,
    "disclaimer": "This is not a medical diagnosis. Please consult a healthcare professional for proper evaluation."
  }
}
```

---

#### Get Biomarker Trends

```
GET /ai/trends/:biomarkerName
```

**Query Parameters:**
```
profileId: string (required)
startDate: ISO8601 (optional)
endDate: ISO8601 (optional)
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "biomarker": "Vitamin D",
    "profileId": "profile_123",
    "trend": "stable",
    "values": [
      { "value": 15, "date": "2025-06-01", "source": "Apollo Diagnostics" },
      { "value": 16, "date": "2025-09-01", "source": "SRL Labs" },
      { "value": 18, "date": "2026-03-14", "source": "Apollo Diagnostics" }
    ],
    "statistics": {
      "average": 16.3,
      "min": 15,
      "max": 18,
      "count": 3
    },
    "referenceRange": {
      "min": 30,
      "max": 100,
      "unit": "ng/mL"
    },
    "insights": [
      {
        "type": "concerning",
        "message": "Your Vitamin D levels have been consistently below the normal range across 3 tests.",
        "recommendation": "Consider consulting a doctor about Vitamin D supplementation."
      }
    ],
    "trendAnalysis": "Your Vitamin D levels appear stable but consistently low. This suggests an ongoing deficiency that may benefit from dietary changes or supplementation under medical guidance.",
    "disclaimer": "This trend analysis is for informational purposes only. Consult your doctor for personalized advice."
  }
}
```

---

#### Health Copilot

```
POST /ai/copilot
```

**Request:**
```json
{
  "message": "Compare my last two thyroid reports",
  "profileId": "profile_123",
  "sessionId": "session_abc" // optional, for context
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "intent": {
      "task": "compare_reports",
      "confidence": 0.92,
      "entities": {
        "biomarkers": ["TSH", "T3", "T4"],
        "tests": ["thyroid"]
      }
    },
    "message": "Here's a comparison of your two thyroid reports:",
    "data": {
      "comparison": {
        "TSH": {
          "jan2026": "2.5 mIU/L",
          "mar2026": "2.8 mIU/L",
          "change": "+0.3",
          "status": "both_normal",
          "trend": "stable"
        },
        "T3": {
          "jan2026": "1.2 ng/mL",
          "mar2026": "1.3 ng/mL",
          "change": "+0.1",
          "status": "both_normal",
          "trend": "stable"
        },
        "T4": {
          "jan2026": "7.5 μg/dL",
          "mar2026": "7.2 μg/dL",
          "change": "-0.3",
          "status": "both_normal",
          "trend": "stable"
        }
      }
    },
    "actions": [
      {
        "type": "navigate",
        "label": "View full report",
        "payload": { "recordId": "rec_thyroid_latest" }
      },
      {
        "type": "navigate",
        "label": "Book follow-up",
        "payload": { "specialty": "endocrinology" }
      }
    ],
    "confidence": 88,
    "disclaimer": "This comparison is based on AI-extracted data. Please consult your doctor for medical interpretation."
  }
}
```

**Supported Tasks:**
- `explain_report` - Explain a health report
- `track_biomarker` - Show biomarker trends
- `compare_reports` - Compare two reports
- `find_doctor` - Find a doctor
- `book_appointment` - Book an appointment
- `interpret_symptoms` - Assess symptoms
- `medication_reminder` - Set medication reminder
- `track_cycle` - Track menstrual cycle
- `health_score_insight` - Explain health score
- `preventive_checkup` - Get preventive checkup info
- `family_health` - Family health queries
- `general_health` - General health questions

---

## 3. Health Profile API

### Base Path: `/profile`

#### Get Profile

```
GET /profile
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "user_xyz",
    "profiles": [
      {
        "profileId": "profile_123",
        "name": "Rahul Sharma",
        "relationship": "self",
        "age": 32,
        "gender": "male",
        "bloodGroup": "B+",
        "isPrimary": true,
        "health": {
          "allergies": [
            { "allergen": "Penicillin", "type": "medication", "severity": "moderate" }
          ],
          "chronicConditions": [],
          "currentMedications": [],
          "vaccinationHistory": [
            { "name": "COVID-19", "date": "2025-01-15" },
            { "name": "Flu Vaccine", "date": "2025-10-01" }
          ],
          "familyHistory": [
            { "condition": "Diabetes Type 2", "relation": "father" },
            { "condition": "Hypertension", "relation": "mother" }
          ],
          "lifestyle": {
            "smoking": "never",
            "alcohol": "occasional",
            "sleepHours": 7,
            "waterIntake": 6,
            "activityLevel": "moderate",
            "stressLevel": "moderate"
          }
        },
        "emergencyContacts": [
          { "name": "Priya Sharma", "relationship": "Spouse", "phone": "+91-9876543210", "isPrimary": true }
        ]
      }
    ],
    "preferences": {
      "notifications": {
        "appointments": true,
        "medications": true,
        "reminders": true,
        "reports": true,
        "healthAlerts": true,
        "wellnessTips": true
      },
      "privacyLevel": "balanced"
    },
    "consent": {
      "version": "1.0",
      "givenAt": "2026-01-01T00:00:00Z",
      "anonymousAnalytics": true,
      "researchParticipation": false,
      "thirdPartySharing": false
    }
  }
}
```

---

#### Update Profile

```
PUT /profile
```

**Request:**
```json
{
  "profileId": "profile_123",
  "health": {
    "allergies": [
      { "allergen": "Penicillin", "type": "medication", "severity": "moderate" },
      { "allergen": "Dust", "type": "environmental", "severity": "mild" }
    ],
    "lifestyle": {
      "sleepHours": 7.5,
      "activityLevel": "active"
    }
  }
}
```

---

#### Add Family Member

```
POST /profile/family
```

**Request:**
```json
{
  "name": "Anita Sharma",
  "relationship": "mother",
  "age": 58,
  "gender": "female",
  "bloodGroup": "A+",
  "isMinor": false,
  "canAccessRecords": false,
  "health": {
    "allergies": [],
    "chronicConditions": [
      { "name": "Hypertension", "diagnosedDate": "2020-05-01", "status": "managed" }
    ],
    "currentMedications": [
      { "name": "Amlodipine", "dosage": "5mg", "frequency": "once daily", "startDate": "2020-05-01" }
    ]
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "profileId": "profile_mom",
    "name": "Anita Sharma",
    "relationship": "mother",
    "createdAt": "2026-03-15T10:00:00Z"
  }
}
```

---

## 4. Booking API

### Base Path: `/booking`

#### Search Doctors

```
GET /booking/doctors
```

**Query Parameters:**
```
specialty: string (optional)
symptoms: string (optional)
city: string (optional)
language: string (optional)
mode: in_clinic|teleconsult|home_visit (optional)
minFee: number (optional)
maxFee: number (optional)
availability: today|tomorrow|this_week (optional)
sortBy: fee|rating|distance|availability (default: rating)
limit: number (default: 20)
offset: number (default: 0)
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc_123",
      "name": "Dr. Priya Sharma",
      "photo": "https://storage.rez.health/doctors/doc_123.jpg",
      "specializations": ["General Physician", "Internal Medicine"],
      "qualifications": ["MBBS", "MD - Internal Medicine"],
      "yearsOfExperience": 12,
      "languages": ["English", "Hindi", "Tamil"],
      "practice": {
        "hospitalAffiliations": ["Apollo Hospital", "Fortis"],
        "consultationFees": {
          "inClinic": 800,
          "teleconsult": 600
        },
        "consultationModes": ["in_clinic", "teleconsult"]
      },
      "ratings": { "average": 4.7, "totalReviews": 234 },
      "nextAvailable": "2026-03-16T10:00:00Z",
      "distance": 2.5
    }
  ],
  "meta": {
    "pagination": { ... }
  }
}
```

---

#### Get Doctor Slots

```
GET /booking/doctors/:id/slots
```

**Query Parameters:**
```
date: ISO8601 (required)
mode: in_clinic|teleconsult|home_visit (default: in_clinic)
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "doctorId": "doc_123",
    "date": "2026-03-16",
    "mode": "teleconsult",
    "slots": [
      { "time": "09:00", "available": true },
      { "time": "09:30", "available": true },
      { "time": "10:00", "available": false },
      { "time": "10:30", "available": true }
    ]
  }
}
```

---

#### Create Appointment

```
POST /booking/appointments
```

**Request:**
```json
{
  "profileId": "profile_123",
  "providerType": "doctor",
  "providerId": "doc_123",
  "type": "consultation",
  "schedule": {
    "date": "2026-03-16",
    "startTime": "09:30",
    "mode": "teleconsult"
  },
  "payment": {
    "method": "wallet",
    "amount": 600
  },
  "notes": "Following up on thyroid results"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "apt_xyz",
    "status": "confirmed",
    "providerType": "doctor",
    "providerId": "doc_123",
    "providerDetails": {
      "name": "Dr. Priya Sharma",
      "specialization": "General Physician"
    },
    "schedule": {
      "date": "2026-03-16",
      "startTime": "09:30",
      "mode": "teleconsult"
    },
    "meetingLink": "https://rez.health/call/abc123",
    "payment": {
      "amount": 600,
      "currency": "INR",
      "status": "paid",
      "transactionId": "txn_123"
    },
    "reminder": {
      "24h": true,
      "1h": true
    },
    "createdAt": "2026-03-15T10:00:00Z"
  }
}
```

---

#### List Appointments

```
GET /booking/appointments
```

**Query Parameters:**
```
profileId: string (optional)
status: pending|confirmed|completed|cancelled (optional)
type: consultation|diagnostic_test|teleconsult (optional)
startDate: ISO8601 (optional)
endDate: ISO8601 (optional)
limit: number (default: 20)
offset: number (default: 0)
```

---

#### Cancel Appointment

```
DELETE /booking/appointments/:id
```

**Request:**
```json
{
  "reason": "Schedule conflict"
}
```

---

## 5. Marketplace API

### Base Path: `/marketplace`

#### Search Labs

```
GET /marketplace/labs
```

**Query Parameters:**
```
city: string (required)
testId: string (optional)
nablOnly: boolean (default: false)
homeCollection: boolean (default: false)
sortBy: price|rating|distance|turnaround (default: rating)
```

---

#### Search Tests

```
GET /marketplace/tests
```

**Query Parameters:**
```
query: string (optional)
category: preventive|diabetes|cardiac|thyroid|womens_health|senior|fitness (optional)
minPrice: number (optional)
maxPrice: number (optional)
city: string (optional)
includesHomeCollection: boolean (default: false)
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "test_cbc",
      "name": "Complete Blood Count (CBC)",
      "description": "Evaluates overall health and detects blood disorders",
      "category": "preventive",
      "parameters": ["Hemoglobin", "RBC", "WBC", "Platelets", "Hematocrit"],
      "preparation": ["No fasting required"],
      "turnaroundTime": "Same Day",
      "pricing": {
        "amount": 450,
        "currency": "INR",
        "discountedAmount": 399
      },
      "labs": [
        {
          "labId": "lab_apollo",
          "name": "Apollo Diagnostics",
          "price": 399,
          "rating": 4.5,
          "nablAccredited": true,
          "homeCollection": true,
          "homeCollectionFee": 100,
          "distance": 2.5
        },
        {
          "labId": "lab_srl",
          "name": "SRL Diagnostics",
          "price": 350,
          "rating": 4.2,
          "nablAccredited": true,
          "homeCollection": true,
          "homeCollectionFee": 150,
          "distance": 4.0
        }
      ]
    }
  ]
}
```

---

#### Order Test

```
POST /marketplace/orders
```

**Request:**
```json
{
  "profileId": "profile_123",
  "orderType": "lab_test",
  "testId": "test_cbc",
  "labId": "lab_apollo",
  "homeCollection": true,
  "collectionAddress": {
    "line1": "123 Main Street",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001"
  },
  "preferredSlot": {
    "date": "2026-03-18",
    "timeSlot": "09:00-12:00"
  },
  "payment": {
    "method": "wallet",
    "amount": 499
  }
}
```

---

#### Get Test Details

```
GET /marketplace/tests/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "test_cbc",
    "name": "Complete Blood Count (CBC)",
    "description": "...",
    "parameters": [...],
    "preparation": ["No fasting required"],
    "turnaroundTime": "Same Day",
    "aiGuidance": "This is a routine test that doctors commonly order as part of annual health checkups or when evaluating symptoms like fatigue, weakness, or fever.",
    "pricing": {
      "amount": 450,
      "currency": "INR",
      "discountedAmount": 399
    },
    "allLabs": [...],
    "similarTests": [
      { "id": "test_cbc_extended", "name": "CBC with Peripheral Smear" },
      { "id": "test_hemogram", "name": "Complete Hemogram" }
    ]
  }
}
```

---

## 6. Wellness API

### Base Path: `/wellness`

#### Get Cycle Data

```
GET /wellness/cycle
```

**Query Parameters:**
```
profileId: string (required)
startDate: ISO8601 (optional)
endDate: ISO8601 (optional)
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "profileId": "profile_123",
    "currentCycle": {
      "startDate": "2026-03-01",
      "dayNumber": 14,
      "predictedEnd": "2026-03-05"
    },
    "statistics": {
      "averageLength": 28,
      "averagePeriodLength": 4,
      "cycleLengthTrend": "regular"
    },
    "predictions": {
      "nextPeriodStart": "2026-03-29",
      "fertileWindow": {
        "start": "2026-03-13",
        "end": "2026-03-18"
      },
      "ovulationDate": "2026-03-15"
    },
    "recentEntries": [
      { "date": "2026-03-01", "type": "period_start", "flowIntensity": "medium" },
      { "date": "2026-03-14", "type": "symptom", "symptoms": ["mild_cramps", "bloating"] }
    ],
    "insights": [
      {
        "type": "positive",
        "message": "Your cycles have been regular this month."
      }
    ],
    "disclaimer": "This information is for educational purposes only. It is not a guarantee of fertility or ovulation timing."
  }
}
```

---

#### Log Cycle Entry

```
POST /wellness/cycle
```

**Request:**
```json
{
  "profileId": "profile_123",
  "date": "2026-03-14",
  "type": "symptom",
  "symptoms": ["mild_cramps", "bloating", "fatigue"],
  "mood": "okay",
  "energy": 3,
  "notes": "Feeling a bit tired"
}
```

---

#### Get Health Score

```
GET /wellness/score
```

**Query Parameters:**
```
profileId: string (required)
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "profileId": "profile_123",
    "date": "2026-03-15",
    "overall": {
      "score": 78,
      "grade": "B+",
      "trend": "improving"
    },
    "components": {
      "preventive": {
        "score": 65,
        "factors": {
          "checkupRecency": 80,
          "vaccinationStatus": 70,
          "screeningCompletion": 50
        }
      },
      "activity": {
        "score": 85,
        "factors": {
          "dailyActivity": 90,
          "workoutConsistency": 80,
          "stepGoalAchievement": 85
        }
      },
      "lifestyle": {
        "score": 75,
        "factors": {
          "sleepQuality": 70,
          "hydration": 75,
          "stressManagement": 80,
          "substanceAvoidance": 75
        }
      },
      "biomarkers": {
        "score": 82,
        "factors": {
          "normalRanges": 90,
          "trendDirection": 75,
          "deficiencyTracking": 80
        }
      },
      "engagement": {
        "score": 88,
        "factors": {
          "recordUploads": 85,
          "healthCopilotUsage": 90,
          "challengeParticipation": 90
        }
      }
    },
    "badges": [
      { "id": "early_bird", "name": "Early Bird", "earnedAt": "2026-02-15" },
      { "id": "hydration_hero", "name": "Hydration Hero", "earnedAt": "2026-03-01" }
    ],
    "streaks": {
      "habitStreak": 12,
      "checkupStreak": 3,
      "preventiveStreak": 1
    },
    "topRecommendations": [
      {
        "title": "Complete your annual health checkup",
        "description": "It's been over 12 months since your last comprehensive checkup.",
        "action": "Book Now"
      },
      {
        "title": "Improve sleep quality",
        "description": "Your average sleep duration is slightly below the recommended 7-8 hours.",
        "action": "Learn More"
      }
    ]
  }
}
```

---

## 7. Rate Limits

### Per User Per Hour

| Endpoint | Limit |
|----------|-------|
| `POST /records/upload` | 50 |
| `POST /ai/interpret` | 100 |
| `POST /ai/symptoms` | 30 |
| `POST /ai/copilot` | 100 |
| `GET /records/*` | 500 |
| `POST /booking/*` | 20 |
| `POST /marketplace/*` | 20 |

### Global Limits

| Service | Limit |
|---------|-------|
| OCR Requests | 1,000/minute |
| AI Requests | 2,000/minute |

### Rate Limit Response (429)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in X minutes.",
    "details": {
      "retryAfter": 3600,
      "limit": 100,
      "remaining": 0
    },
    "requestId": "req_123",
    "timestamp": "2026-03-15T10:00:00Z"
  }
}
```

---

## 8. WebSocket Events

### Connection

```
wss://api.rez.money/health/v1/ws
Authentication: Bearer JWT (same as REST)
```

### Subscribe to Events

```json
{
  "action": "subscribe",
  "channels": [
    "records.processing",
    "appointments.upcoming",
    "wellness.reminders",
    "health.alerts"
  ]
}
```

### Event Payloads

#### Record Processing Complete

```json
{
  "event": "records.processing",
  "data": {
    "recordId": "rec_abc123",
    "status": "completed",
    "extracted": {
      "biomarkersCount": 24,
      "aiConfidence": 0.88
    }
  }
}
```

#### Upcoming Appointment Reminder

```json
{
  "event": "appointments.upcoming",
  "data": {
    "appointmentId": "apt_xyz",
    "type": "consultation",
    "doctorName": "Dr. Priya Sharma",
    "scheduledAt": "2026-03-16T09:30:00Z",
    "mode": "teleconsult",
    "meetingLink": "https://rez.health/call/abc123",
    "reminderType": "1h"
  }
}
```

#### Health Alert

```json
{
  "event": "health.alerts",
  "data": {
    "alertId": "alert_123",
    "type": "checkup_due",
    "title": "Annual Checkup Reminder",
    "description": "It's been over 12 months since your last comprehensive health checkup.",
    "severity": "info",
    "action": {
      "type": "navigate",
      "label": "Book Checkup",
      "payload": { "type": "preventive_package" }
    }
  }
}
```

---

## 9. Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `RECORD_NOT_FOUND` | 404 | Health record not found |
| `OCR_FAILED` | 500 | OCR processing failed |
| `EXTRACTION_FAILED` | 500 | AI extraction failed |
| `INVALID_DOCUMENT_TYPE` | 400 | Unsupported document type |
| `FILE_TOO_LARGE` | 400 | File exceeds 25MB limit |
| `UNSUPPORTED_FORMAT` | 400 | Unsupported file format |
| `BOOKING_UNAVAILABLE` | 409 | Slot no longer available |
| `DOCTOR_NOT_FOUND` | 404 | Doctor not found |
| `SLOT_NOT_AVAILABLE` | 409 | Time slot not available |
| `PAYMENT_FAILED` | 402 | Payment processing failed |
| `PRESCRIPTION_EXPIRED` | 400 | Prescription has expired |
| `MEDICINE_NOT_FOUND` | 404 | Medicine not found |
| `UNAUTHORIZED_ACCESS` | 401 | Not authorized |
| `CONSENT_REQUIRED` | 403 | Consent not given |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

# Healthcare & Fitness Ecosystem Architecture

## Overview

The Healthcare & Fitness ecosystem in REZ Merchant provides a comprehensive platform for healthcare providers and fitness businesses to manage appointments, patient records, wellness programs, and integrations with the REZ Mind intent graph.

---

## Healthcare Services List

| Service | Description | Key Features |
|---------|-------------|--------------|
| **Appointment Scheduling** | Manage patient appointments with healthcare providers | Real-time availability, multi-provider calendars, conflict detection |
| **Patient Records Management** | HIPAA-compliant electronic health records | Secure storage, access controls, audit logging |
| **Telemedicine** | Virtual consultations and remote monitoring | Video integration, prescription management, follow-up scheduling |
| **Billing & Insurance** | Healthcare billing and insurance claim processing | CPT code mapping, insurance verification, claim status tracking |
| **Lab Integration** | Connect with diagnostic labs | Order management, results delivery, specimen tracking |
| **Pharmacy Integration** | E-prescription and pharmacy connectivity | Drug interaction checks, refill management, dosage tracking |

---

## Fitness Services List

| Service | Description | Key Features |
|---------|-------------|--------------|
| **Class Scheduling** | Fitness class and session booking | Instructor management, capacity tracking, waitlist management |
| **Personal Training** | 1:1 and small group training sessions | Trainer profiles, session packages, progress tracking |
| **Membership Management** | Subscription and membership plans | Tiered memberships, renewal automation, pause/suspend options |
| **Gym Equipment Tracking** | Asset management for fitness equipment | Maintenance schedules, usage analytics, depreciation tracking |
| **Nutrition Planning** | Diet and meal planning integrations | Calorie tracking, macro monitoring, meal prep coordination |
| **Fitness Assessments** | Body composition and fitness evaluations | Progress reports, goal setting, achievement tracking |

---

## API Endpoints

### Healthcare APIs

```
Base Path: /api/v1/healthcare

POST   /appointments              # Create healthcare appointment
GET    /appointments              # List appointments (with filters)
GET    /appointments/:id          # Get appointment details
PUT    /appointments/:id          # Update appointment
DELETE /appointments/:id          # Cancel appointment

POST   /patients                  # Register new patient
GET    /patients                  # List patients
GET    /patients/:id              # Get patient profile
PUT    /patients/:id              # Update patient information

POST   /consultations             # Start telemedicine consultation
GET    /consultations/:id         # Get consultation details
PUT    /consultations/:id/complete # Complete and record consultation

POST   /prescriptions             # Create prescription
GET    /prescriptions/:id        # Get prescription details
PUT    /prescriptions/:id/refill # Request refill
```

### Fitness APIs

```
Base Path: /api/v1/fitness

POST   /classes                   # Create fitness class
GET    /classes                   # List available classes
GET    /classes/:id               # Get class details
POST   /classes/:id/book          # Book class spot
DELETE /classes/:id/book/:bookingId # Cancel booking

POST   /trainers                  # Register trainer
GET    /trainers                  # List trainers
GET    /trainers/:id              # Get trainer profile
PUT    /trainers/:id/availability  # Update availability

POST   /memberships               # Create membership plan
GET    /memberships               # List membership plans
POST   /memberships/subscribe      # Subscribe to membership
PUT    /memberships/:id/pause     # Pause membership

POST   /assessments               # Create fitness assessment
GET    /assessments/:id           # Get assessment results
PUT    /assessments/:id/progress  # Update progress metrics
```

### Shared APIs

```
POST   /api/v1/health/fitness-events     # Log health/fitness event
GET    /api/v1/health/insights            # Get health insights
POST   /api/v1/health/goals               # Set health/fitness goals
GET    /api/v1/health/goals/progress      # Track goal progress
```

---

## Integration with REZ Mind

### Intent Graph Integration

The Healthcare & Fitness ecosystem connects to REZ Mind for intelligent intent tracking and personalization.

```
REZ Mind Integration Layer

┌─────────────────────────────────────────────────────────┐
│                    Healthcare/Fitness                     │
│                  Business Applications                   │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│              Intent Event Emitter Service                │
│  - Emits user_intent events for booking, purchases       │
│  - Tracks engagement patterns                            │
│  - Monitors health/fitness goal progress                 │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   REZ Mind (Intent Graph)                 │
│  - Stores intent signals                                 │
│  - ML scoring for recommendations                         │
│  - Autonomous agent orchestration                        │
└─────────────────────────────────────────────────────────┘
```

### Intent Signals

| Signal Type | Description | Tracked Events |
|-------------|-------------|----------------|
| `healthcare_interest` | User shows interest in healthcare services | Search, view provider profile, read health content |
| `fitness_engagement` | User engagement with fitness content | Class views, trainer follows, workout logs |
| `appointment_intent` | Intent to book appointment/class | Add to cart, start checkout, abandon booking |
| `wellness_goals` | User's stated health goals | Goal creation, progress updates, milestone achievements |
| `subscription_intent` | Interest in memberships/packages | Plan comparison, pricing views, trial signups |

### ML Scoring Features

- **Health Score**: Aggregated wellness metric based on activity, assessments, and goals
- **Engagement Score**: Likelihood to convert based on engagement patterns
- **Churn Risk**: Probability of subscription cancellation
- **Upsell Propensity**: Likelihood to purchase premium services
- **Class Preference**: Predicted interest in specific class types

---

## Features Matrix

### Core Features

| Feature | Healthcare | Fitness | Status |
|---------|------------|---------|--------|
| Appointment/Class Scheduling | Yes | Yes | GA |
| Patient/Member Profiles | Yes | Yes | GA |
| Calendar Management | Yes | Yes | GA |
| Waitlist Management | Yes | Yes | GA |
| Email Notifications | Yes | Yes | GA |
| SMS Notifications | Yes | Yes | GA |
| Payment Processing | Yes | Yes | GA |
| Reporting Dashboard | Yes | Yes | GA |

### Advanced Features

| Feature | Healthcare | Fitness | Status |
|---------|------------|---------|--------|
| Telemedicine/Video Sessions | Yes | No | GA |
| E-Prescriptions | Yes | No | GA |
| Insurance Claims | Yes | No | GA |
| Lab Integration | Yes | No | GA |
| Personal Training Sessions | No | Yes | GA |
| Nutrition Planning | No | Yes | GA |
| Equipment Tracking | No | Yes | GA |
| Fitness Assessments | No | Yes | GA |
| Membership Tiers | Yes | Yes | GA |
| Package Bundles | Yes | Yes | GA |

### REZ Mind Integration Features

| Feature | Healthcare | Fitness | Status |
|---------|------------|---------|--------|
| Intent Tracking | Yes | Yes | GA |
| Personalized Recommendations | Yes | Yes | GA |
| Smart Notifications | Yes | Yes | GA |
| Churn Prediction | Yes | Yes | GA |
| Cross-sell Recommendations | Yes | Yes | GA |
| Autonomous Agents | Yes | Yes | Beta |
| Predictive Scheduling | Yes | Yes | Roadmap |

### Security & Compliance

| Feature | Healthcare | Fitness | Status |
|---------|------------|---------|--------|
| HIPAA Compliance | Yes | N/A | GA |
| Data Encryption (at rest) | Yes | Yes | GA |
| Data Encryption (in transit) | Yes | Yes | GA |
| Audit Logging | Yes | Yes | GA |
| Access Controls | Yes | Yes | GA |
| Data Export | Yes | Yes | GA |
| Right to Delete | Yes | Yes | GA |

---

## Data Models

### Key Entities

```
Healthcare:
├── Patient
│   ├── id, name, email, phone
│   ├── dateOfBirth, gender, bloodType
│   ├── allergies[], medicalHistory[]
│   ├── insuranceInfo, emergencyContact
│   └── createdAt, updatedAt

├── Appointment
│   ├── id, patientId, providerId
│   ├── scheduledAt, duration, type
│   ├── status, notes, attachments[]
│   └── createdAt, updatedAt

└── Prescription
    ├── id, patientId, providerId
    ├── medication, dosage, frequency
    ├── startDate, endDate, refillsRemaining
    └── status

Fitness:
├── Member
│   ├── id, name, email, phone
│   ├── membershipId, membershipTier
│   ├── fitnessGoals[], preferences
│   ├── emergencyContact, healthNotes
│   └── createdAt, updatedAt

├── FitnessClass
│   ├── id, name, description
│   ├── instructorId, schedule
│   ├── capacity, enrolledCount
│   ├── duration, intensityLevel
│   └── equipmentRequired[]

└── Assessment
    ├── id, memberId, trainerId
    ├── date, metrics{}
    ├── bodyComposition, fitnessLevel
    ├── goals[], recommendations[]
    └── nextAssessmentDate
```

---

## Environment Configuration

```bash
# Healthcare/Fitness Service Configuration
HEALTHCARE_SERVICE_URL=http://localhost:4005
FITNESS_SERVICE_URL=http://localhost:4006
REZ_MIND_URL=http://localhost:4001

# Database
MONGODB_URI=mongodb://localhost:27017/healthcare_fitness

# Redis (for sessions and caching)
REDIS_URL=redis://localhost:6379

# Security
HIPAA_AUDIT_LOG_ENABLED=true
DATA_RETENTION_DAYS=2555  # 7 years for healthcare

# External Integrations
VIDEO_PROVIDER_API_KEY=
LAB_INTEGRATION_API_KEY=
PHARMACY_NETWORK_ID=
```

---

## Getting Started

### 1. Service Setup

```bash
cd industry-os/healthcare-fitness-ecosystem
npm install
npm run build
```

### 2. Configuration

Copy `.env.example` to `.env` and configure:
- Database connections
- External service API keys
- REZ Mind endpoint
- Security settings

### 3. Run Services

```bash
# Healthcare service
npm run dev:healthcare

# Fitness service
npm run dev:fitness
```

### 4. Integration Testing

```bash
npm run test:integration
```

---

## Support

For questions or issues with the Healthcare & Fitness ecosystem:
- Documentation: `/docs/healthcare-fitness`
- Slack: `#healthcare-fitness-support`
- Email: support@rez.com

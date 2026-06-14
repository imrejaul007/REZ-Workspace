# risacare-health-memory

**Health Memory Platform** - The foundation for MyRisa Health Intelligence

Following RTNM Doctrine: `CorpID → Memory → Knowledge → Twin → Agent → Intelligence`

---

## Overview

`risacare-health-memory` is the foundational memory layer for MyRisa that stores all health-related data. This becomes the moat that enables:

- Personalized health predictions
- Cross-domain health intelligence
- Health twin creation
- AI-powered health agents

---

## Why Build This First?

Most health startups build features first and infrastructure later:

```
❌ What most teams build:
1. Cycle Tracker
2. Pregnancy Tracker
3. Chat Assistant
4. Reports Upload

Result: Data Silos
```

`risacare-health-memory` builds the foundation first:

```
✅ What RTNM builds:
CorpID → Health Memory → Health Knowledge Graph → Health Twin → Health Intelligence → Health Agents
```

---

## Core Entities

| Entity | Description |
|--------|-------------|
| **Person** | Core identity for health context |
| **Medical Report** | Lab results, imaging, pathology, prescriptions |
| **Medication** | All medications with dosage, frequency, reminders |
| **Symptom** | Symptom tracking with severity, triggers, remedies |
| **Condition** | Diagnoses with ICD codes, status tracking |
| **Appointment** | Doctor visits, procedures, follow-ups |
| **Allergy** | Allergies with severity and reactions |
| **Vaccination** | Vaccination records with dose tracking |
| **Procedure** | Surgeries and medical procedures |
| **Family Member** | Connected family health context |
| **Life Event** | Events that trigger twin evolution |

---

## Women's Health Entities

| Entity | Description |
|--------|-------------|
| **Menstrual Cycle** | Period tracking, flow intensity, symptoms |
| **Pregnancy** | Due date, trimester, outcomes |
| **Fertility Window** | Fertile days, ovulation prediction |

---

## Architecture

```
risacare-health-memory
│
├── src/
│   ├── config.ts              # Configuration
│   ├── index.ts                # Express server
│   ├── types/
│   │   └── index.ts           # Zod schemas & TypeScript types
│   ├── models/
│   │   └── database.ts        # PostgreSQL schema & queries
│   ├── services/
│   │   └── healthMemoryService.ts  # Business logic
│   └── routes/
│       └── healthMemoryRoutes.ts   # API endpoints
│
├── tests/                     # Unit tests
├── docs/                      # Documentation
└── package.json
```

---

## API Endpoints

### Person
- `GET /api/health/person` - Get or create person
- `PUT /api/health/person` - Update person profile

### Medical Reports
- `POST /api/health/reports` - Add medical report
- `GET /api/health/reports` - Get medical reports

### Medications
- `POST /api/health/medications` - Add medication
- `GET /api/health/medications` - Get medications
- `PATCH /api/health/medications/:id` - Update medication status

### Symptoms
- `POST /api/health/symptoms` - Log symptom
- `GET /api/health/symptoms` - Get symptoms

### Conditions
- `POST /api/health/conditions` - Add condition
- `GET /api/health/conditions` - Get conditions

### Appointments
- `POST /api/health/appointments` - Schedule appointment
- `GET /api/health/appointments` - Get appointments

### Allergies
- `POST /api/health/allergies` - Add allergy
- `GET /api/health/allergies` - Get allergies

### Women's Health
- `POST /api/health/menstrual` - Log menstrual cycle
- `GET /api/health/menstrual` - Get menstrual cycles
- `POST /api/health/pregnancy` - Create pregnancy record
- `GET /api/health/pregnancy` - Get pregnancy records
- `POST /api/health/fertility` - Record fertility window

### Family Health
- `POST /api/health/family` - Add family member
- `GET /api/health/family` - Get family members

### Life Events
- `POST /api/health/life-events` - Record life event
- `GET /api/health/life-events` - Get life events

### Analytics
- `GET /api/health/timeline` - Get health timeline
- `GET /api/health/summary` - Get health summary

---

## Usage

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Run Tests
```bash
npm test
```

---

## Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=risacare_health_memory

# Service
PORT=4801
NODE_ENV=development

# External Services
AUTH_SERVICE_URL=http://localhost:4002
MEMORY_SERVICE_URL=http://localhost:4520
INTELLIGENCE_SERVICE_URL=http://localhost:4530
GENIE_MEMORY_URL=http://localhost:4703
SHAB_API_URL=http://localhost:4970
```

---

## Dependencies

- **Express** - Web framework
- **pg** - PostgreSQL client
- **uuid** - UUID generation
- **zod** - Schema validation
- **date-fns** - Date utilities

---

## What's Next?

This is **Phase 0** of the MyRisa architecture:

```
Phase 0: Health Memory ← Current
Phase 0.5: Health Knowledge Graph
Phase 1: Women's Health Intelligence
Phase 2: Family Health Graph
Phase 3: Health Twin
Phase 4: Health Genie
Phase 5: Health Agents
```

---

## Strategic Value

Building Health Memory first means:

1. **No Data Silos** - All health data in one place
2. **Personalization** - Years of data enable predictions
3. **Intelligence** - Knowledge graph enables insights
4. **Agents** - Memory enables autonomous health agents
5. **Moat** - Longitudinal health data is irreplaceable

---

**License:** Proprietary - RTNM Digital
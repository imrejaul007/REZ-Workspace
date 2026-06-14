# MyRisa Universal Memory

**Human Intelligence OS** - All 7 Domains of Human Wellbeing

Following RTNM Doctrine: `Identity → Memory → Knowledge → Twin → Agent → Intelligence`

---

## Overview

MyRisa Universal Memory is the foundational memory layer for the Human Intelligence OS. It stores all aspects of human wellbeing across 7 interconnected domains, enabling personalized intelligence, predictions, and autonomous agents.

---

## The 7 Domains

### 1. Physical Health
- Vitals (heart rate, blood pressure, weight, etc.)
- Lab results, imaging, diagnoses
- Medications, allergies, vaccinations
- Procedures, appointments

### 2. Mental Wellness
- Daily mood check-ins
- Stress patterns and sources
- Anxiety tracking
- Therapy sessions
- Mental wellness goals
- Burnout risk assessment

### 3. Sexual Wellness
- Sexual activity tracking
- Libido trends
- Fertility tracking (BBT, cervical mucus, ovulation)
- Contraception management
- Reproductive health

### 4. Lifestyle
- Sleep quality and patterns
- Nutrition and eating habits
- Exercise and fitness
- Habit tracking (streaks, goals)
- Travel and social activity

### 5. Work-Life Balance
- Work hours and meeting load
- Deep work vs context switching
- PTO usage and recovery
- Burnout risk assessment
- Energy and productivity scores

### 6. Family
- Family member profiles
- Child health and milestones
- Elder care coordination
- Care tasks and reminders
- Care circle (permissions)

### 7. Relationships
- Relationship tracking
- Interaction logging
- Quality time metrics
- Communication patterns
- Conflict resolution

---

## Architecture

```
CorpID
    ↓
MyRisa Universal Memory (Port 4800)
    │
    ├── Physical Health Memory
    ├── Mental Wellness Memory
    ├── Sexual Wellness Memory
    ├── Lifestyle Memory
    ├── Work-Life Memory
    ├── Family Memory
    └── Relationship Memory
    │
    ↓
Human Knowledge Graph
    │
    ↓
Human Twin
    │
    ├── Physical Health Twin
    ├── Mental Wellness Twin
    ├── Sexual Wellness Twin
    ├── Lifestyle Twin
    ├── Work-Life Twin
    ├── Family Twin
    └── Relationship Twin
    │
    ↓
Human Intelligence
    │
    ↓
Human Agents
```

---

## Key Features

### Human Twin
Unified view of the entire person across all domains:

```json
{
  "personId": "...",
  "domains": {
    "physical": { "healthScore": 85, "conditions": [], ... },
    "mental": { "wellnessScore": 72, "moodTrend": "improving", ... },
    "sexual": { "sexualWellnessScore": 78, ... },
    "lifestyle": { "lifestyleScore": 65, "sleepQuality": "good", ... },
    "worklife": { "workLifeBalanceScore": 70, "burnoutRisk": "low", ... },
    "family": { "familyHealthScore": 80, "dependentsCount": 2, ... },
    "relationships": { "relationshipScore": 75, ... }
  },
  "overallScore": 74,
  "insights": [...],
  "predictions": [...]
}
```

### Cross-Domain Intelligence
- Life events trigger twin evolution across all domains
- Mental wellness affects physical health
- Work-life balance impacts relationships
- Family health connects to personal health

### Consultation Copilot
Before consultation:
- Generates pre-visit summary from memory
- Prepares relevant questions
- Summarizes recent changes

After consultation:
- Records diagnosis and prescriptions
- Schedules follow-ups
- Updates relevant domain memories

---

## API Endpoints

### Core
- `POST /api/person` - Create/get person
- `GET /api/human-twin` - Get complete human twin
- `GET /api/summary` - Get human memory summary

### Life Events
- `POST /api/life-events` - Record life event
- `GET /api/life-events` - Get life events

### Physical Health
- `POST /api/physical/vitals` - Log vitals
- `GET /api/physical/vitals` - Get vitals

### Mental Wellness
- `POST /api/mental/mood` - Log mood
- `GET /api/mental/mood` - Get mood history
- `POST /api/mental/stress` - Log stress
- `GET /api/mental/summary` - Get mental wellness summary

### Sexual Wellness
- `POST /api/sexual/activity` - Log sexual activity
- `POST /api/sexual/libido` - Log libido
- `POST /api/sexual/fertility` - Log fertility data
- `POST /api/sexual/contraception` - Set contraception

### Lifestyle
- `POST /api/lifestyle/sleep` - Log sleep
- `POST /api/lifestyle/nutrition` - Log nutrition
- `POST /api/lifestyle/exercise` - Log exercise
- `POST /api/lifestyle/habits` - Create habit
- `GET /api/lifestyle/habits` - Get habits

### Work-Life Balance
- `POST /api/worklife/record` - Log work day
- `GET /api/worklife/score` - Get work-life balance score
- `GET /api/worklife/burnout` - Assess burnout risk

### Family
- `POST /api/family/member` - Add family member
- `GET /api/family/members` - Get family members
- `POST /api/family/care-task` - Create care task
- `GET /api/family/care-tasks` - Get care tasks
- `POST /api/family/care-circle` - Add to care circle

### Relationships
- `POST /api/relationships` - Add relationship
- `GET /api/relationships` - Get relationships
- `GET /api/relationships/health` - Get relationship health score

### Consultations
- `POST /api/consultations` - Schedule consultation
- `GET /api/consultations` - Get consultations

---

## Environment Variables

```bash
PORT=4800
NODE_ENV=development
```

---

## Strategic Value

### What Makes This Different

| Traditional Health App | MyRisa Universal Memory |
|------------------------|-------------------------|
| Tracks periods | Tracks physical + mental + sexual + lifestyle |
| Siloed data | Connected across7 domains |
| Single user | Family + relationships |
| Health only | Human intelligence |
| Insights only | Predictions + agents |

### The Moat

Years of longitudinal data across all human domains becomes:
- **Irreplaceable** - Can't be replicated overnight
- **Personalized** - Deep understanding of the individual
- **Predictive** - Patterns enable predictions
- **Agentic** - Powers autonomous health agents

---

## What's Next

```
Phase 0: Universal Memory ← Current
Phase 0.5: Human Knowledge Graph
Phase 1: Human Twin
Phase 2: Human Intelligence
Phase 3: Human Agents
Phase 4: MyRisa App
```

---

## Brand Structure

```
RisaCare (Company)
│
├── MyRisa (Consumer App)
│ ├── MyRisa Universal Memory (Port 4800)
│    ├── MyRisa Human Twin (Port 4801)
│    ├── MyRisa Intelligence (Port 4802)
│    └── MyRisa Agents (Port 4803)
│
├── RisaCare Clinics
├── RisaCare Hospital
└── RisaCare Intelligence (B2B)
```

---

**License:** Proprietary - RTNM Digital
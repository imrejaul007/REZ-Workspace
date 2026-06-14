# MyRisa - Complete Documentation

**Personal Wellbeing Intelligence Platform**
**Tagline:** "Your Health. Understood."
**Version:** 1.0.0
**Date:** June 11, 2026
**Company:** RisaCare (Healthcare vertical under RTNM Digital)
**Port:** 4900

---

## Overview

MyRisa is not just a health app. It's a **Personal Wellbeing Intelligence Platform** that unifies all aspects of human wellbeing into a single intelligent system.

### Vision

> "Your Health. Understood."

MyRisa connects:
- Physical Health
- Mental Wellness
- Sexual Wellness
- Lifestyle
- Work-Life Balance
- Family
- Relationships

Through a **Human Twin** that learns, predicts, and provides actionable insights.

---

## The 7 Domains

### Domain 1: Women's Health 🌸
**Service:** myrisa-womens-health-service (Port 4820)

| Feature | Description |
|---------|-------------|
| **Cycle Tracking** | Period dates, flow, symptoms |
| **Fertility Window** | Ovulation prediction, fertile days |
| **Pregnancy Tracking** | Week-by-week, baby development |
| **PCOS Management** | Symptom tracking, care plans |
| **Menopause Support** | Perimenopause, postmenopause tracking |

### Domain 2: Sexual Wellness 💜
**Service:** myrisa-sexual-wellness-service (Port 4821)

| Feature | Description |
|---------|-------------|
| **Libido Tracking** | Level trends, affecting factors |
| **Contraception** | Method tracking, reminders, side effects |
| **Reproductive Health** | STD screenings, pap smears |
| **Intimacy Journal** | Emotional & physical intimacy scores |
| **Partner Connection** | Quality time, communication |

### Domain 3: Mental Wellness 🧠
**Service:** risa-care-mental-health-service (Port 4722)

| Feature | Description |
|---------|-------------|
| **Mood Tracking** | Daily check-ins, trends |
| **Stress Analysis** | Sources, coping mechanisms |
| **Therapy Sessions** | Booking, notes, homework |
| **Crisis Support** | Emergency resources, safety plans |
| **Mindfulness** | Meditation, breathing exercises |

### Domain 4: Sleep 😴
**Service:** risa-care-sleep-service (Port 4729)

| Feature | Description |
|---------|-------------|
| **Sleep Logging** | Bedtime, wake time, quality |
| **Sleep Analysis** | Patterns, stages, disturbances |
| **Factor Tracking** | Caffeine, exercise, stress impact |
| **Disorder Detection** | Insomnia, sleep apnea indicators |
| **Recommendations** | Personalized sleep tips |

### Domain 5: Lifestyle 🏃
**Service:** risa-care-wellness-service (Port 4703)

| Feature | Description |
|---------|-------------|
| **Activity Tracking** | Steps, calories, exercise |
| **Nutrition Logging** | Meals, macros, water intake |
| **Habit Tracking** | Streaks, goals, consistency |
| **Weight Management** | Progress, trends, goals |
| **Wellness Score** | Daily & weekly scores |

### Domain 6: Work-Life Balance ⚡
**Service:** myrisa-worklife-service (Port 4822)

| Feature | Description |
|---------|-------------|
| **Work Hours** | Daily tracking, meeting load |
| **Burnout Assessment** | Exhaustion, cynicism, inefficacy |
| **Energy Levels** | Daily energy tracking |
| **PTO Management** | Balance, usage, reminders |
| **Productivity** | Deep work, tasks completed |

### Domain 7: Relationships ❤️
**Service:** myrisa-relationships-service (Port 4823)

| Feature | Description |
|---------|-------------|
| **Partner Tracking** | Relationship status, quality |
| **Interaction Logging** | Calls, dates, quality time |
| **Communication Score** | Quality, frequency |
| **Intimacy Health** | Emotional & physical intimacy |
| **Relationship Goals** | Improvement targets |

---

## Key Features

### 1. Human Twin
Unified view of the person across all 7 domains.

```typescript
interface HumanTwinState {
  overallScore: number;
  domains: {
    physical: { score: number; conditions: string[] };
    mental: { score: number; moodTrend: string };
    sexual: { score: number; libidoLevel: number };
    lifestyle: { score: number; sleepQuality: string };
    worklife: { score: number; burnoutRisk: string };
    family: { score: number; memberCount: number };
    relationships: { score: number; quality: number };
  };
  insights: string[];
  predictions: Prediction[];
  lifeEvents: LifeEvent[];
}
```

### 2. Unified Dashboard
Single view showing:
- Overall wellbeing score
- Domain breakdowns
- Quick actions
- Today's focus
- Insights & recommendations

### 3. Consultation Copilot
**Service:** myrisa-consultation-copilot (Port 4825)

Before Visit:
- AI-generated pre-visit summary
- Questions to ask the doctor
- Relevant health history

After Visit:
- Post-visit notes storage
- Prescription tracking
- Follow-up reminders

### 4. Cross-Domain Intelligence
Patterns that span multiple domains:
- Stress → Sleep → Mood → Work productivity
- Period → Libido → Emotional state
- Exercise → Energy → Work performance

---

## Services Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     MyRisa App (Port 4900)                      │
│              "Your Health. Understood."                          │
│                 Consumer Interface                               │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Women's     │     │   Human      │     │ Consultation │
│  Health     │     │   Twin       │     │   Copilot    │
│  (4820)     │     │   (4824)     │     │   (4825)     │
└───────────────┘     └───────────────┘     └───────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Sexual      │     │  Work-Life   │     │ Relationships│
│  Wellness    │     │  Balance     │     │   (4823)     │
│  (4821)      │     │  (4822)      │     │              │
└───────────────┘     └───────────────┘     └───────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Mental      │     │   Sleep      │     │   Wellness   │
│  Health      │     │   (4729)     │     │   (4703)     │
│  (4722)      │     │              │     │              │
└───────────────┘     └───────────────┘     └───────────────┘
        │
        ▼
┌───────────────┐
│  Care Circle  │
│   (4706)     │
└───────────────┘

---

## Extended Services

### Auth Service (4910)
Integration with RABTUL Auth (4002) for secure authentication.

| Endpoint | Description |
|----------|-------------|
| POST /auth/login | Login with RABTUL token |
| POST /auth/verify | Verify MyRisa token |
| POST /auth/logout | Logout user |
| GET /auth/oauth-url | Get OAuth URL |
| POST /auth/oauth/callback | Handle OAuth callback |

### Genie Health (4920)
AI Health Assistant integrating with HOJAI AI and Genie Memory.

| Endpoint | Description |
|----------|-------------|
| POST /genie/chat | Chat with AI assistant |
| GET /genie/briefing/:userId | Get daily briefing |
| GET /genie/predictions/:userId | Get health predictions |
| GET /genie/context/:userId | Get health context |

### Family Service (4930)
Shab AI integration for family health coordination.

| Endpoint | Description |
|----------|-------------|
| GET /family/summary/:userId | Get family health summary |
| POST /family/member | Add family member |
| GET /family/members/:userId | Get family connections |
| POST /family/share | Share health data |
| POST /family/care-task | Create care task |
| GET /family/elder/:userId/:elderId | Get elder care summary |

---

## All Services

### MyRisa Services (New)

| Service | Port | Description |
|---------|------|-------------|
| myrisa-app | 4900 | Consumer interface |
| myrisa-universal-memory | 4800 | All domains memory |
| myrisa-womens-health-service | 4820 | Cycle, fertility, pregnancy |
| myrisa-sexual-wellness-service | 4821 | Libido, contraception |
| myrisa-worklife-service | 4822 | Burnout, energy, PTO |
| myrisa-relationships-service | 4823 | Partner, quality time |
| myrisa-human-twin-service | 4824 | Unified twin |
| myrisa-consultation-copilot | 4825 | Pre/post-visit |
| myrisa-auth-service | 4910 | RABTUL integration |
| myrisa-genie-health | 4920 | AI health assistant |
| myrisa-family-service | 4930 | Shab AI integration |

### Integrated Services (Existing)

| Service | Port | Used For |
|---------|------|---------|
| risa-care-wellness-service | 4703 | Exercise, nutrition, habits |
| risa-care-mental-health-service | 4722 | Mood, stress, therapy |
| risa-care-sleep-service | 4729 | Sleep tracking |
| risa-care-care-circle-service | 4706 | Family, caregivers |

---

## API Endpoints

### Dashboard
```
GET /api/dashboard/:userId
```

### Women's Health
```
GET  /api/womens-health/profile/:userId
POST /api/womens-health/period
GET  /api/womens-health/prediction/:userId
GET  /api/womens-health/pregnancy-week/:userId
GET  /api/womens-health/insights/:userId
```

### Sexual Wellness
```
POST /api/sexual-wellness/activity
POST /api/sexual-wellness/libido
GET  /api/sexual-wellness/insights/:userId
```

### Work-Life
```
POST /api/worklife/work
GET  /api/worklife/score/:userId
GET  /api/worklife/burnout/:userId
GET  /api/worklife/insights/:userId
```

### Relationships
```
GET  /api/relationships/:userId
POST /api/relationships
POST /api/relationships/:id/interactions
GET  /api/relationships/:userId/health
```

### Human Twin
```
GET /api/twin/:userId
GET /api/twin/:userId/score
GET /api/twin/:userId/insights
GET /api/twin/:userId/timeline
```

### Consultations
```
POST /api/consultations
GET  /api/consultations/upcoming
POST /api/consultations/:id/pre-visit
POST /api/consultations/:id/questions
```

### Mental Health
```
POST /api/mental/mood
GET  /api/mental/trends/:userId
GET  /api/mental/insights/:userId
```

### Sleep
```
POST /api/sleep
GET  /api/sleep/analysis/:userId
```

---

## Mobile App (React Native)

MyRisa comes with a React Native mobile app for iOS and Android.

### Screens

| Screen | Purpose |
|--------|---------|
| Home | Dashboard with scores & quick actions |
| Women's Health | Cycle, fertility, pregnancy, PCOS, menopause |
| Mental Health | Mood, stress, therapy, crisis support |
| Sleep | Sleep tracking & analysis |
| Work-Life | Burnout, energy, PTO, productivity |
| Lifestyle | Exercise, nutrition, habits |
| Relationships | Partner, quality time |
| Profile | User settings |
| Twin | Human twin visualization |
| Consultation | Doctor visit prep |
| Dashboard | Full wellbeing view |

### Installation

```bash
cd myrisa-mobile-app
npm install
npm start
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native + Expo |
| UI | React Native Paper |
| Navigation | React Navigation |
| State | React hooks |
| API | Axios |
| Storage | AsyncStorage |

---

## RTNM Integration

### HOJAI AI Integration
- MemoryOS (4520) - Health memory storage
- Intelligence (4530) - ML predictions
- Agents (4550) - Health agents
- Knowledge Graph - Cross-domain relationships

### RABTUL Integration
- Auth (4002) - User authentication
- Wallet (4004) - Premium subscriptions
- Notifications (4011) - Reminders

### Genie Integration
- Genie Memory (4703) - Personal health context
- Genie Briefing (4706) - Daily health summaries
- Genie Relationship (4704) - Social connections

### Shab AI Integration
- Family Health Graph - Connected family members
- Elder Care - Care coordination
- Child Health - Family monitoring

---

## Getting Started

### Installation
```bash
cd RisaCare/myrisa-app
npm install
npm run dev
```

### Service Ports
```bash
# Start all MyRisa services
npm run dev  # Port 4900

# Individual services (in separate terminals)
tsx src/services/womensHealth.ts  # Port 4820
tsx src/services/sexualWellness.ts  # Port 4821
tsx src/services/worklife.ts  # Port 4822
tsx src/services/relationships.ts  # Port 4823
tsx src/services/humanTwin.ts  # Port 4824
tsx src/services/consultationCopilot.ts  # Port 4825
```

### Environment Variables
```bash
# MyRisa Services
WOMENS_HEALTH_URL=http://localhost:4820
SEXUAL_WELLNESS_URL=http://localhost:4821
WORKLIFE_URL=http://localhost:4822
RELATIONSHIPS_URL=http://localhost:4823
HUMAN_TWIN_URL=http://localhost:4824
CONSULTATION_URL=http://localhost:4825

# Existing Services
WELLNESS_URL=http://localhost:4703
MENTAL_HEALTH_URL=http://localhost:4722
SLEEP_URL=http://localhost:4729
CARE_CIRCLE_URL=http://localhost:4706
```

---

## Strategic Value

### Why MyRisa is Different

| Traditional Health App | MyRisa |
|------------------------|--------|
| Tracks periods | Tracks physical + mental + sexual + lifestyle |
| Siloed data | Connected across 7 domains |
| Single user | Family + relationships |
| Health only | Human intelligence |
| Insights only | Predictions + agents |
| App | Platform |

### The Moat

Years of longitudinal data across all human domains becomes:
- **Irreplaceable** - Can't be replicated overnight
- **Personalized** - Deep understanding of the individual
- **Predictive** - Patterns enable predictions
- **Agentic** - Powers autonomous health agents

---

## Brand Structure

```
RisaCare (Company)
│
├── MyRisa (Consumer App)
│ ├── MyRisa App (4900)
│ ├── Women's Health (4820)
│ ├── Sexual Wellness (4821)
│ ├── Work-Life Balance (4822)
│ ├── Relationships (4823)
│ ├── Human Twin (4824)
│ └── Consultation Copilot (4825)
│
├── RisaCare Clinics
├── RisaCare Hospital
└── RisaCare Intelligence (B2B)
```

---

**License:** Proprietary - RTNM Digital
# MyRisa - Personal Wellbeing Intelligence Platform

**"Your Health. Understood."**

MyRisa unifies all aspects of human wellbeing into a single intelligent platform. It connects Physical Health, Mental Wellness, Sexual Wellness, Lifestyle, Work-Life Balance, Family, and Relationships through a Human Twin that learns and adapts to each user.

---

## Overview

MyRisa is not just another health app. It's a **Personal Wellbeing Intelligence Platform** that:

- Connects 7+ wellbeing domains in one place
- Creates a unified Human Twin that learns from all data
- Provides AI-powered insights across domains
- Prepares you for medical consultations
- Tracks life events that affect your health

---

## The 7 Domains

| Domain | Icon | Description |
|--------|------|-------------|
| **Women's Health** | 🌸 | Cycle, Fertility, Pregnancy, PCOS, Menopause |
| **Sexual Wellness** | 💜 | Libido, Contraception, Intimacy |
| **Mental Wellness** | 🧠 | Mood, Stress, Therapy, Crisis Support |
| **Sleep** | 😴 | Sleep tracking, analysis, recommendations |
| **Lifestyle** | 🏃 | Exercise, Nutrition, Habits |
| **Work-Life** | ⚡ | Burnout, Energy, Productivity, PTO |
| **Relationships** | ❤️ | Partner, Quality Time, Intimacy |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MyRisa App (4900)                       │
│                    Consumer Interface                             │
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
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Existing RisaCare Services                    │
├──────────────┬──────────────┬──────────────┬───────────────────────┤
│  Wellness    │  Mental     │  Sleep       │  Care Circle          │
│  (4703)     │  Health     │  (4729)      │  (4706)              │
│              │  (4722)     │              │                      │
└──────────────┴──────────────┴──────────────┴───────────────────────┘
```

---

## Key Features

### 1. Unified Dashboard
```json
GET /api/dashboard/:userId

Response:
{
  "overallScore": 78,
  "greeting": "Good morning!",
  "todayFocus": "Stay balanced today.",
  "domainScores": [
    { "domain": "mental", "score": 75, "trend": "stable" },
    { "domain": "work", "score": 80, "trend": "up" }
  ],
  "quickActions": [...],
  "insights": [...]
}
```

### 2. Human Twin
Your complete health twin that:
- Aggregates data from all domains
- Calculates cross-domain insights
- Predicts health trends
- Updates in real-time

```json
GET /api/twin/:userId

Response:
{
  "overallScore": 78,
  "domains": {
    "physical": { "score": 85 },
    "mental": { "score": 72 },
    "sexual": { "score": 80 },
    "lifestyle": { "score": 75 },
    "worklife": { "score": 78 },
    "family": { "score": 90 },
    "relationships": { "score": 75 }
  },
  "insights": [...],
  "predictions": [...]
}
```

### 3. Consultation Copilot
Before your appointment:
- AI-generated pre-visit summary
- Questions to ask your doctor
- Relevant health history

After your appointment:
- Post-visit notes storage
- Follow-up task reminders
- Prescription tracking

---

## API Endpoints

### Dashboard
- `GET /api/dashboard/:userId` - Get unified dashboard

### Women's Health
- `GET /api/womens-health/profile/:userId`
- `POST /api/womens-health/period`
- `GET /api/womens-health/prediction/:userId`
- `GET /api/womens-health/pregnancy-week/:userId`
- `GET /api/womens-health/insights/:userId`

### Sexual Wellness
- `POST /api/sexual-wellness/activity`
- `POST /api/sexual-wellness/libido`
- `GET /api/sexual-wellness/insights/:userId`

### Work-Life
- `POST /api/worklife/work`
- `GET /api/worklife/score/:userId`
- `GET /api/worklife/burnout/:userId`
- `GET /api/worklife/insights/:userId`

### Relationships
- `GET /api/relationships/:userId`
- `POST /api/relationships`
- `POST /api/relationships/:id/interactions`
- `GET /api/relationships/:userId/health`

### Human Twin
- `GET /api/twin/:userId`
- `GET /api/twin/:userId/score`
- `GET /api/twin/:userId/insights`
- `GET /api/twin/:userId/timeline`

### Consultations
- `POST /api/consultations`
- `GET /api/consultations/upcoming`
- `POST /api/consultations/:id/pre-visit`
- `POST /api/consultations/:id/questions`

### Mental Health
- `POST /api/mental/mood`
- `GET /api/mental/trends/:userId`
- `GET /api/mental/insights/:userId`

### Sleep
- `POST /api/sleep`
- `GET /api/sleep/analysis/:userId`

---

## Quick Start

```bash
cd myrisa-app
npm install
npm run dev
```

Service runs on **port 4900**.

---

## Environment Variables

```bash
# MyRisa Services
WOMENS_HEALTH_URL=http://localhost:4820
SEXUAL_WELLNESS_URL=http://localhost:4821
WORKLIFE_URL=http://localhost:4822
RELATIONSHIPS_URL=http://localhost:4823
HUMAN_TWIN_URL=http://localhost:4824
CONSULTATION_URL=http://localhost:4825

# Existing RisaCare Services
WELLNESS_URL=http://localhost:4703
MENTAL_HEALTH_URL=http://localhost:4722
SLEEP_URL=http://localhost:4729
CARE_CIRCLE_URL=http://localhost:4706
```

---

## Brand

**Name:** MyRisa
**Tagline:** "Your Health. Understood."
**Vision:** Personal Wellbeing Intelligence Platform

---

**License:** Proprietary - RTNM Digital
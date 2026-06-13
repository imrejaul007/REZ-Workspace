# Fitness & Wellness Industry OS - Integration Specification

**Version:** 1.0  
**Date:** June 12, 2026  
**Industry:** Fitness & Wellness  
**Key Integration Point:** MyRisa ↔ TwinOS (Body Twin, Fitness Twin)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Capability Matrix](#2-product-capability-matrix)
3. [Twin Architecture](#3-twin-architecture)
4. [Integration Flows](#4-integration-flows)
5. [Agent Architecture](#5-agent-architecture)
6. [Business Copilot Integration](#6-business-copilot-integration)
7. [Economic Integration](#7-economic-integration)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. Executive Summary

### 1.1 Industry Overview

The fitness and wellness industry in India is experiencing unprecedented growth, driven by:

- **Rising Health Awareness**: Post-pandemic consciousness about physical and mental wellness
- **Digital Transformation**: 65% of gym-goers now use fitness apps alongside physical memberships
- **Personalization Demand**: Users expect tailored workout and nutrition plans based on their biometrics
- **Integrated Wellness**: Convergence of fitness, nutrition, mental health, and sleep tracking

### 1.2 Industry Challenges

| Challenge | Impact | Current State |
|-----------|--------|---------------|
| Fragmented fitness data | Incomplete health picture | Separate apps for steps, diet, sleep |
| Limited personalization | Generic programs, poor adherence | One-size-fits-all workout plans |
| Disconnected wellness ecosystem | Missed prevention opportunities | Fitness apps don't talk to health apps |
| Member churn | 40-60% annual gym attrition | No early warning system |
| Revenue leakage | Missed upsell opportunities | No unified member view |
| Trainer inconsistency | Variable member experience | No performance tracking |

### 1.3 Current Product Landscape

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  FITNESS & WELLNESS INDUSTRY OS                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Consumer Facing                    Merchant Facing                       │
│  ┌─────────────┐                   ┌─────────────────────────────────┐│
│  │ MyRisa      │                   │ REZ POS (4803)                  ││
│  │ (7 Domains) │                   │ REZ Loyalty (4701)               ││
│  │             │                   │ REZ Dashboard                   ││
│  │ RisaCare B2C│                   │ REZ Business Copilot            ││
│  └─────────────┘                   └─────────────────────────────────┘│
│                                     │                                   │
│  ┌──────────────────────────────────┴───────────────────────────────┐  │
│  │                      TwinOS Platform                              │  │
│  │  Body Twin | Fitness Twin | Trainer Twin | Gym Twin | Goal Twin  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Key Integration Opportunity

By connecting MyRisa, RisaCare B2C, REZ Loyalty, and REZ POS through TwinOS:

| Opportunity | Value Driver | Integration Complexity |
|-------------|--------------|----------------------|
| Unified fitness profile | 40% increase in personalization | Medium |
| Predictive churn detection | 25% reduction in member attrition | High |
| Real-time body adaptation | 35% improvement in goal achievement | Medium |
| Cross-sell wellness services | 20% increase in average member value | Low |
| Natural language fitness queries | 50% faster insights access | Low |
| Connected trainer-membereperience | 30% improvement in retention | Medium |

### 1.5 Expected Outcomes

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Member retention | 60% annual | 75% annual | +25% |
| Goal achievement rate | 25% | 45% | +80% |
| Personalization score | 2.5/5 | 4.5/5 | +80% |
| Member lifetime value | ₹8,000/year | ₹12,000/year | +50% |
| Trainer productivity | 15 members/trainer | 25 members/trainer | +67% |
| Data utilization | 20% | 85% | +325% |

---

## 2. Product Capability Matrix

### 2.1 MyRisa

| Attribute | Details |
|-----------|--------|
| **Company** | RisaCare |
| **Tagline** | "Your Health. Understood." |
| **Core Capabilities** | Personal wellbeing tracking across 7 domains, AI-powered insights, Body Twin integration, cross-domain intelligence |
| **Data Produced** | Wellness scores, sleep patterns, activity data, mood trends, cycle data, nutrition logs, biometric trends, health goals |
| **Data Needed** | User identity, fitness goals, workout data, gym memberships, trainer information |
| **Current Integration** | Partial - Connected to RisaCare B2B, needs TwinOS for Body/Fitness Twin |
| **API Base URL** | `http://localhost:4900` or `MYRISA_SERVICE_URL` |

**Key Endpoints:**
```
GET  /api/profile                    - Get user profile
GET  /api/wellness/scores            - Get wellness domain scores
POST /api/activity/log               - Log workout activity
GET  /api/sleep/analysis             - Get sleep analysis
POST /api/goals/set                  - Set health goals
GET  /api/body/composition           - Get body composition data
GET  /api/trends/:domain             - Get domain trends
POST /api/twin/sync                  - Sync with Body Twin
```

**MyRisa 7 Wellbeing Domains:**

| Domain | Service | Description |
|--------|---------|-------------|
| Women's Health | 4820 | Cycle tracking, fertility, pregnancy, PCOS, menopause |
| Sexual Wellness | 4821 | Libido, contraception, intimacy, reproductive health |
| Mental Wellness | 4722 | Mood tracker, therapy, crisis support, mindfulness |
| Sleep | 4729 | Sleep logging, analysis, disorder detection |
| Lifestyle | 4703 | Exercise, nutrition, habits, weight management |
| Work-Life Balance | 4822 | Burnout assessment, energy, productivity, PTO |
| Relationships | 4823 | Partner tracking, intimacy health, quality time |

---

### 2.2 RisaCare B2C

| Attribute | Details |
|-----------|--------|
| **Company** | RisaCare |
| **Core Capabilities** | Consumer health services, teleconsult with fitness experts, health insurance integration, nutrition consultation |
| **Data Produced** | Consultation records, health recommendations, specialist referrals, lab orders |
| **Data Needed** | Fitness data from Body Twin, gym history, dietary preferences, injury history |
| **Current Integration** | Partial - Connected to MyRisa, needs Fitness Twin for holistic recommendations |
| **API Base URL** | `http://localhost:4770` or `RISACARE_B2C_SERVICE_URL` |

**Key Endpoints:**
```
POST /api/consultation/book          - Book fitness expert consultation
GET  /api/consultation/:id           - Get consultation details
GET  /api/nutrition/plan            - Get AI-generated nutrition plan
POST /api/health/risk-assessment    - Get health risk assessment
GET  /api/referrals/fitness         - Get fitness specialist referrals
```

---

### 2.3 REZ Loyalty

| Attribute | Details |
|-----------|--------|
| **Company** | REZ Merchant |
| **Port** | 4701 |
| **Core Capabilities** | Multi-brand loyalty programs, points accumulation, tier management, rewards redemption, gamification |
| **Data Produced** | Points balance, transaction history, tier status, reward redemptions, engagement scores |
| **Data Needed** | Member profiles, transaction data, engagement activities, fitness achievements |
| **Current Integration** | Connected to RABTUL Wallet, needs Fitness Twin for achievement-based rewards |
| **API Base URL** | `http://localhost:4701` or `REZ_LOYALTY_SERVICE_URL` |

**Key Endpoints:**
```
GET  /api/members/:id                - Get member profile
POST /api/points/earn               - Earn points
POST /api/points/redeem             - Redeem points
GET  /api/tiers/:memberId           - Get tier status
POST /api/rewards/claim              - Claim reward
GET  /api/activities/:memberId      - Get activity history
POST /api/achievements/unlock       - Unlock fitness achievement
```

**Fitness-Specific Loyalty Features:**
```
Points Earned:
  - Workout completion: 10 points/session
  - Goal achievement: 50-500 points
  - Class attendance: 15 points/class
  - Referral: 100 points
  - Streak bonus: 2x points for 7-day streak
  - MyRisa sync: 5 points/day

Points Redeemed:
  - Free gym day: 500 points
  - Personal training session: 2000 points
  - Nutrition plan: 1500 points
  - REZ Marketplace items: Variable
  - Partner gym access: Variable
```

---

### 2.4 REZ POS

| Attribute | Details |
|-----------|--------|
| **Company** | REZ Merchant |
| **Port** | 4803 (Fitness vertical) |
| **Core Capabilities** | Membership billing, class booking, inventory for supplements, multi-location support, staff management |
| **Data Produced** | Membership records, class schedules, attendance, sales data, member check-ins |
| **Data Needed** | Member fitness profiles, trainer schedules, class capacity, pricing tiers |
| **Current Integration** | Connected to RABTUL Pay, needs Fitness Twin for personalized class recommendations |
| **API Base URL** | `http://localhost:4803` or `REZ_POS_SERVICE_URL` |

**Key Endpoints:**
```
GET  /api/memberships/:memberId      - Get member subscriptions
POST /api/classes/book               - Book fitness class
GET  /api/classes/schedule           - Get class schedule
POST /api/checkin/:memberId         - Record gym check-in
GET  /api/attendance/:date           - Get attendance data
POST /api/membership/upgrade         - Upgrade membership tier
GET  /api/inventory/supplements      - Get supplement inventory
```

---

## 3. Twin Architecture

### 3.1 Body Twin

| Attribute | Details |
|-----------|--------|
| **Type** | Entity Digital Twin |
| **Twin ID** | `body-{uuid}` |
| **Domain** | Physical Body Composition |
| **Port** | 4824 (via MyRisa Human Twin Service) |

**Attributes:**

```json
{
  "bodyTwinId": "body-{uuid}",
  "userId": "uuid",
  
  "demographics": {
    "age": 32,
    "gender": "male|female|other",
    "height": { "value": 175, "unit": "cm" },
    "currentWeight": { "value": 78, "unit": "kg" },
    "targetWeight": { "value": 75, "unit": "kg" }
  },
  
  "bodyComposition": {
    "bmi": 25.5,
    "bodyFatPercentage": 22.0,
    "muscleMass": { "value": 35, "unit": "kg" },
    "waterPercentage": 55.0,
    "boneDensity": "normal",
    "visceralFat": 8,
    "metabolicAge": 30
  },
  
  "biometrics": {
    "restingHeartRate": 68,
    "maxHeartRate": 192,
    "bloodPressure": { "systolic": 120, "diastolic": 80 },
    "vo2Max": 42.5,
    "recoveryRate": "good",
    "hrv": 65
  },
  
  "measurements": {
    "chest": { "value": 100, "unit": "cm" },
    "waist": { "value": 84, "unit": "cm" },
    "hips": { "value": 98, "unit": "cm" },
    "arms": { "value": 35, "unit": "cm" },
    "thighs": { "value": 58, "unit": "cm" }
  },
  
  "capabilities": {
    "strengthLevel": "intermediate",
    "enduranceLevel": "beginner",
    "flexibilityLevel": "advanced",
    "balanceLevel": "intermediate",
    "cardioLevel": "beginner"
  },
  
  "limitations": {
    "injuries": [
      { "type": "ACL strain", "date": "2025-03-15", "recoveryStatus": "healed" }
    ],
    "chronicConditions": ["mild asthma"],
    "restrictions": ["avoid high-impact jumping"],
    "painPoints": ["lower back tension"]
  },
  
  "preferences": {
    "workoutTime": "morning",
    "workoutDuration": 60,
    "preferredEnvironment": "air-conditioned gym",
    "musicPreference": "high energy",
    "motivationStyle": "achievement-based"
  },
  
  "progress": {
    "weightHistory": [
      { "date": "2026-01-01", "value": 82 },
      { "date": "2026-03-01", "value": 80 },
      { "date": "2026-06-01", "value": 78 }
    ],
    "measurementHistory": [],
    "strengthProgress": {},
    "enduranceProgress": {}
  },
  
  "wearables": {
    "connectedDevices": ["apple-watch-series-9", "withings-scale"],
    "lastSync": "2026-06-12T08:30:00Z",
    "dataQuality": "excellent"
  },
  
  "wellnessIntegration": {
    "sleepQuality": 78,
    "stressLevel": 45,
    "recoveryScore": 82,
    "energyLevel": 70
  }
}
```

**Relationships:**

| Relationship | Twin Type | Direction | Description |
|--------------|-----------|-----------|-------------|
| ownedBy | User | ← | User who owns this body |
| linkedTo | Fitness Twin | ↔ | Current fitness program |
| supervisedBy | Trainer Twin | ← | Assigned trainer |
| memberOf | Gym Twin | → | Home gym location |
| workingTowards | Goal Twin | → | Active fitness goals |
| syncedFrom | MyRisa | ← | Wellness data from MyRisa |
| updatedBy | REZ POS | → | Check-in/measurement data |

**Agents Managing Body Twin:**

| Agent | Role | Actions |
|-------|------|---------|
| Body Analysis Agent | Analyze body composition | Calculate metrics, compare benchmarks, detect anomalies |
| Progress Tracking Agent | Monitor changes | Track trends, celebrate milestones, identify plateaus |
| Limitation Manager Agent | Handle restrictions | Update injuries, suggest modifications, prevent re-injury |
| Wearable Sync Agent | Device integration | Sync Apple Health, Google Fit, fitness bands |
| Biometric Monitor Agent | Health monitoring | Track vitals, alert on concerning patterns |

---

### 3.2 Fitness Twin

| Attribute | Details |
|-----------|--------|
| **Type** | Program Digital Twin |
| **Twin ID** | `fitness-{uuid}` |
| **Domain** | Workout Programs & Exercise Data |
| **Port** | 4824 (via MyRisa Human Twin Service) |

**Attributes:**

```json
{
  "fitnessTwinId": "fitness-{uuid}",
  "userId": "uuid",
  "bodyTwinId": "body-{uuid}",
  
  "programDetails": {
    "name": "Strength Building Phase 2",
    "type": "hypertrophy|strength|cardio|flexibility|hybrid",
    "phase": "week-4-of-12",
    "startDate": "2026-05-01",
    "endDate": "2026-07-31",
    "status": "active|paused|completed",
    "difficulty": "beginner|intermediate|advanced"
  },
  
  "workoutStructure": {
    "daysPerWeek": 4,
    "sessionDuration": 60,
    "restBetweenSets": 90,
    "progressiveOverload": true,
    "periodization": "linear|undulating|block"
  },
  
  "routine": {
    "monday": {
      "name": "Upper Body Push",
      "exercises": [
        {
          "exerciseId": "bench-press",
          "name": "Bench Press",
          "sets": 4,
          "reps": "8-10",
          "weight": { "value": 60, "unit": "kg" },
          "rest": 90,
          "notes": "Focus on controlled descent"
        }
      ]
    },
    "wednesday": {
      "name": "Lower Body",
      "exercises": []
    },
    "friday": {
      "name": "Upper Body Pull",
      "exercises": []
    },
    "saturday": {
      "name": "Full Body + Cardio",
      "exercises": []
    }
  },
  
  "exerciseLibrary": {
    "totalExercises": 45,
    "masteredExercises": 28,
    "newExercises": [
      { "name": "Romanian Deadlift", "introducedOn": "2026-06-01", "proficiency": 65 }
    ],
    "problematicExercises": []
  },
  
  "performance": {
    "estimatedOneRepMax": {
      "benchPress": 72.5,
      "squat": 100,
      "deadlift": 120
    },
    "volumePerWeek": { "value": 25000, "unit": "kg" },
    "intensityAverage": 75,
    "recoveryStatus": "adequate"
  },
  
  "cardioProfile": {
    "preferredActivities": ["running", "cycling", "rowing"],
    "currentEndurance": "moderate",
    "heartRateZones": {
      "zone1": { "min": 120, "max": 140, "duration": 30 },
      "zone2": { "min": 140, "max": 160, "duration": 20 },
      "zone3": { "min": 160, "max": 175, "duration": 10 }
    },
    "weeklyCardioVolume": 150
  },
  
  "trainingHistory": {
    "sessionsCompleted": 16,
    "sessionsMissed": 2,
    "totalVolume": 180000,
    "personalRecords": [
      { "exercise": "bench-press", "weight": 70, "date": "2026-06-08", "type": "PR" }
    ],
    "consistencyScore": 89
  },
  
  "adaptations": {
    "muscleBalance": {
      "leftRight": { "imbalance": 3, "status": "acceptable" },
      "pushPull": { "ratio": 0.95, "status": "balanced" },
      "agonistAntagonist": { "ratio": 1.0, "status": "balanced" }
    },
    "strengthGains": 12.5,
    "enduranceGains": 8.3,
    "flexibilityGains": 15.0
  },
  
  "aiRecommendations": {
    "nextPhaseExercises": ["incline dumbbell press", "romanian deadlift"],
    "suggestedModifications": ["add core superset"],
    "intensityAdjustment": "maintain current load for 2 weeks",
    "recoveryRecommendation": "consider deload week"
  }
}
```

**Relationships:**

| Relationship | Twin Type | Direction | Description |
|--------------|-----------|-----------|-------------|
| targets | Body Twin | → | Aims to improve body composition |
| ownedBy | User | ← | User following this program |
| designedBy | Trainer Twin | ← | Trainer who created it |
| executedAt | Gym Twin | → | Location where workouts happen |
| alignedWith | Goal Twin | ↔ | Supports specific goals |
| syncedTo | REZ POS | → | Class booking integration |
| informedBy | MyRisa | ← | Activity data from wellness domains |

**Agents Managing Fitness Twin:**

| Agent | Role | Actions |
|-------|------|---------|
| Program Designer Agent | Create workout plans | Generate progressive programs |
| Exercise Coach Agent | Guide form & technique | Provide instructions, corrections |
| Intensity Manager Agent | Adjust difficulty | Monitor RPE, adjust loads |
| Recovery Optimizer Agent | Manage rest | Track recovery, suggest deloads |
| PR Tracker Agent | Monitor achievements | Identify and celebrate PRs |
| Exercise Substitute Agent | Handle limitations | Suggest alternatives for injured muscles |

---

### 3.3 Trainer Twin

| Attribute | Details |
|-----------|--------|
| **Type** | Person Digital Twin |
| **Twin ID** | `trainer-{uuid}` |
| **Domain** | Fitness Trainer Profile & Performance |
| **Port** | 4824 |

**Attributes:**

```json
{
  "trainerTwinId": "trainer-{uuid}",
  "userId": "uuid",
  
  "identity": {
    "displayName": "Priya Sharma",
    "certifications": [
      { "name": "ACE Certified Personal Trainer", "expiry": "2027-12-31" },
      { "name": "Sports Nutrition Specialist", "expiry": "2026-08-15" }
    ],
    "specializations": ["strength-training", "weight-loss", "post-rehab"],
    "experience": { "years": 6, "sessionsDelivered": 3500 }
  },
  
  "availability": {
    "schedule": {
      "monday": ["09:00-12:00", "14:00-18:00"],
      "tuesday": ["09:00-12:00", "14:00-18:00"],
      "wednesday": ["09:00-12:00"],
      "thursday": ["09:00-12:00", "14:00-18:00"],
      "friday": ["09:00-12:00", "14:00-18:00"],
      "saturday": ["10:00-14:00"]
    },
    "timezone": "Asia/Kolkata",
    "bookingBuffer": 30,
    "maxConcurrentMembers": 25
  },
  
  "performance": {
    "memberRetention": 82,
    "goalAchievementRate": 68,
    "averageSessionRating": 4.7,
    "totalMembers": 22,
    "newMembersThisMonth": 3,
    "churnedMembersThisMonth": 1
  },
  
  "expertise": {
    "strengthTraining": { "level": 95, "memberCount": 15 },
    "cardioConditioning": { "level": 85, "memberCount": 10 },
    "flexibilityMobility": { "level": 90, "memberCount": 8 },
    "weightLoss": { "level": 88, "memberCount": 12 },
    "postRehabilitation": { "level": 75, "memberCount": 5 },
    "sportsPerformance": { "level": 70, "memberCount": 3 }
  },
  
  "memberRoster": [
    {
      "memberId": "member-{uuid}",
      "bodyTwinId": "body-{uuid}",
      "fitnessTwinId": "fitness-{uuid}",
      "assignedSince": "2026-01-15",
      "currentPhase": "strength-building-phase2",
      "lastSession": "2026-06-11",
      "nextSession": "2026-06-13",
      "status": "active"
    }
  ],
  
  "sessionHistory": {
    "thisMonth": {
      "sessionsConducted": 28,
      "sessionsMissed": 1,
      "averageDuration": 55,
      "memberSatisfaction": 4.8
    },
    "total": {
      "sessionsConducted": 3500,
      "hoursDelivered": 3200,
      "averageRating": 4.7
    }
  },
  
  "earnings": {
    "baseSalary": 45000,
    "perSessionRate": 500,
    "thisMonth": 18500,
    "pendingPayout": 8500
  },
  
  "preferences": {
    "communicationStyle": "encouraging",
    "programmingStyle": "periodized",
    "feedbackFrequency": "after-every-set",
    "sessionFormat": "45min training + 15min planning"
  }
}
```

**Relationships:**

| Relationship | Twin Type | Direction | Description |
|--------------|-----------|-----------|-------------|
| manages | Body Twin | → | Trainer's own body (role model) |
| trains | Body Twin | → | Members under supervision |
| designs | Fitness Twin | → | Programs for members |
| worksAt | Gym Twin | → | Primary gym location |
| supports | Goal Twin | ← | Goals they're helping achieve |
| memberOf | Gym Twin | → | Gym they work for |

**Agents Managing Trainer Twin:**

| Agent | Role | Actions |
|-------|------|---------|
| Schedule Optimizer Agent | Manage availability | Optimize slot allocation |
| Member Matcher Agent | Assign new members | Match based on goals/needs |
| Performance Coach Agent | Track trainer metrics | Coach improvement areas |
| Client Health Monitor Agent | Watch member progress | Alert trainer to concerns |

---

### 3.4 Gym Twin

| Attribute | Details |
|-----------|--------|
| **Type** | Location Digital Twin |
| **Twin ID** | `gym-{uuid}` |
| **Domain** | Fitness Facility Operations |
| **Port** | 4803 (via REZ POS) |

**Attributes:**

```json
{
  "gymTwinId": "gym-{uuid}",
  
  "facility": {
    "name": "FitZone Premium Gym - Indiranagar",
    "type": "premium|budget|crossfit|powerlifting|boutique",
    "address": {
      "street": "100 Feet Road",
      "area": "Indiranagar",
      "city": "Bangalore",
      "pincode": "560038"
    },
    "operatingHours": {
      "weekdays": "05:30-23:00",
      "weekends": "06:00-22:00",
      "holidays": "07:00-20:00"
    },
    "totalArea": { "value": 5000, "unit": "sqft" }
  },
  
  "equipment": {
    "cardio": {
      "treadmills": 12,
      "ellipticals": 6,
      "stationaryBikes": 8,
      "rowingMachines": 4,
      "stairClimbers": 3
    },
    "strength": {
      "benches": 6,
      "squatRacks": 4,
      "deadliftPlatforms": 2,
      "cableMachines": 8,
      "dumbbells": { "maxWeight": 50, "pairs": 20 }
    },
    "functional": {
      "powerRacks": 2,
      "battleRopes": 1,
      "kettlebells": { "maxWeight": 32, "pairs": 10 },
      "medicineBalls": 8,
      "resistanceBands": 20
    },
    "condition": {
      "excellent": 85,
      "good": 10,
      "needsMaintenance": 5
    }
  },
  
  "zones": [
    { "name": "Cardio Zone", "capacity": 30, "currentOccupancy": 18 },
    { "name": "Free Weights Area", "capacity": 40, "currentOccupancy": 22 },
    { "name": "Machine Area", "capacity": 35, "currentOccupancy": 15 },
    { "name": "Group Fitness Studio", "capacity": 25, "currentOccupancy": 12 },
    { "name": "Functional Training Zone", "capacity": 20, "currentOccupancy": 8 }
  ],
  
  "classes": {
    "offered": [
      {
        "classId": "yoga-morning",
        "name": "Morning Yoga",
        "instructor": "trainer-{uuid}",
        "schedule": "Mon-Sat 06:30",
        "duration": 60,
        "capacity": 20,
        "enrolled": 15,
        "category": "flexibility"
      }
    ],
    "popularity": {
      "yoga": 85,
      "hiit": 92,
      "strength": 78,
      "zumba": 95,
      "pilates": 65
    }
  },
  
  "staff": {
    "trainers": [
      { "trainerId": "trainer-{uuid}", "specialization": "strength", "status": "available" }
    ],
    "frontDesk": 4,
    "cleaning": 3,
    "maintenance": 2
  },
  
  "memberMetrics": {
    "totalMembers": 450,
    "activeMembers": 320,
    "visitsPerDay": 180,
    "peakHours": ["07:00-09:00", "18:00-20:00"],
    "averageSessionDuration": 65,
    "memberSatisfaction": 4.3
  },
  
  "financials": {
    "monthlyRevenue": 1250000,
    "membershipRevenue": 950000,
    "personalTrainingRevenue": 200000,
    "retailRevenue": 100000,
    "occupancyRate": 72,
    "revenuePerMember": 3906
  },
  
  "amenities": {
    "changingRooms": true,
    "showers": true,
    "lockers": true,
    "parking": true,
    "wifi": true,
    "nutritionBar": true,
    "sauna": false,
    "pool": false,
    "parkingSpaces": 30
  },
  
  "owner": {
    "ownerId": "owner-{uuid}",
    "franchiseName": "FitZone Fitness",
    "unitsOwned": 3
  }
}
```

**Relationships:**

| Relationship | Twin Type | Direction | Description |
|--------------|-----------|-----------|-------------|
| employs | Trainer Twin | ← | Trainers working here |
| hosts | Body Twin | ← | Members who train here |
| executes | Fitness Twin | ← | Workouts performed here |
| supports | Goal Twin | ← | Goals being worked toward |
| manages | REZ POS | → | POS for billing/attendance |
| integratedWith | REZ Loyalty | → | Loyalty program |

**Agents Managing Gym Twin:**

| Agent | Role | Actions |
|-------|------|---------|
| Occupancy Optimizer Agent | Manage capacity | Predict crowds, suggest alternatives |
| Equipment Maintenance Agent | Track equipment health | Schedule maintenance, predict failures |
| Class Scheduler Agent | Optimize class times | Match demand to trainer availability |
| Revenue Agent | Track gym performance | Monitor KPIs, suggest improvements |
| Trainer Scheduler Agent | Staff optimization | Ensure coverage, balance workload |

---

### 3.5 Goal Twin

| Attribute | Details |
|-----------|--------|
| **Type** | Objective Digital Twin |
| **Twin ID** | `goal-{uuid}` |
| **Domain** | Fitness Goals & Progress Tracking |
| **Port** | 4824 |

**Attributes:**

```json
{
  "goalTwinId": "goal-{uuid}",
  "userId": "uuid",
  "bodyTwinId": "body-{uuid}",
  "fitnessTwinId": "fitness-{uuid}",
  
  "goalDetails": {
    "goalId": "goal-{uuid}",
    "title": "Lose 5kg and build muscle",
    "category": "body-composition|strength|endurance|flexibility|lifestyle",
    "priority": "high|medium|low",
    "createdAt": "2026-05-01",
    "targetDate": "2026-08-01",
    "status": "active|paused|achieved|abandoned",
    "motivation": "wedding in 3 months, want to look fit"
  },
  
  "milestones": [
    {
      "milestoneId": "mile-{uuid}",
      "title": "Lose first 2kg",
      "targetDate": "2026-05-31",
      "status": "achieved",
      "achievedDate": "2026-05-28",
      "criteria": { "metric": "weight", "operator": "<=", "value": 80 }
    },
    {
      "milestoneId": "mile-{uuid}",
      "title": "Body fat under 20%",
      "targetDate": "2026-06-30",
      "status": "in-progress",
      "progress": 65,
      "currentValue": 22.0,
      "targetValue": 20.0
    }
  ],
  
  "metrics": {
    "primaryMetric": {
      "name": "bodyFat",
      "current": 22.0,
      "target": 18.0,
      "start": 25.0,
      "unit": "%",
      "progress": 43
    },
    "secondaryMetrics": [
      { "name": "weight", "current": 78, "target": 73, "start": 82, "unit": "kg" },
      { "name": "muscleMass", "current": 33, "target": 36, "start": 31, "unit": "kg" }
    ]
  },
  
  "timeline": {
    "startDate": "2026-05-01",
    "targetDate": "2026-08-01",
    "expectedDuration": 92,
    "remainingDays": 50,
    "daysOnTrack": 38,
    "daysBehind": 4,
    "onTrackStatus": "ahead"
  },
  
  "actionPlan": {
    "weeklyWorkouts": 4,
    "workoutTypes": ["strength", "cardio", "flexibility"],
    "nutritionCalorieTarget": 2200,
    "proteinTarget": 165,
    "cardioMinutesPerWeek": 150,
    "sleepTarget": 7.5,
    "waterIntakeTarget": 3.0
  },
  
  "obstacles": [
    {
      "obstacleId": "obs-{uuid}",
      "description": "Work travel twice a month",
      "impact": "medium",
      "solution": "Hotel workout plan + resistance bands",
      "resolved": true
    }
  ],
  
  "supportSystem": {
    "trainerId": "trainer-{uuid}",
    "accountabilityPartner": "friend-{uuid}",
    "gymBuddy": "buddy-{uuid}",
    "familySupport": "high"
  },
  
  "rewards": {
    "milestones": [
      { "milestone": "first-2kg", "reward": "new workout shirt", "claimed": true },
      { "milestone": "under-20bf", "reward": "professional photoshoot", "claimed": false }
    ],
    "finalReward": "vacation to mountaineering destination"
  },
  
  "aiInsights": {
    "successProbability": 78,
    "riskFactors": ["inconsistent protein intake", "missing Saturday workouts"],
    "recommendedAdjustments": ["prep meals on Sunday", "find hotel gym for travel"],
    "similarSuccessCases": 145,
    "averageCompletionTime": 87
  }
}
```

**Relationships:**

| Relationship | Twin Type | Direction | Description |
|--------------|-----------|-----------|-------------|
| ownedBy | User | ← | User pursuing this goal |
| improves | Body Twin | → | Goal targets body change |
| guidedBy | Fitness Twin | → | Program supports goal |
| coachedBy | Trainer Twin | → | Trainer helps achieve |
| pursuedAt | Gym Twin | → | Location of workouts |
| syncedTo | REZ Loyalty | → | Achievement rewards |
| informedBy | MyRisa | ← | Wellness data context |

**Agents Managing Goal Twin:**

| Agent | Role | Actions |
|-------|------|---------|
| Goal Setting Agent | Help define goals | SMART goal framework, realistic targets |
| Progress Tracker Agent | Monitor milestones | Update progress, celebrate wins |
| Obstacle Navigator Agent | Solve challenges | Identify blockers, suggest solutions |
| Motivation Agent | Maintain engagement | Send encouragement, adjust expectations |
| Timeline Agent | Manage deadlines | Track pace, recalculate if needed |
| Reward Manager Agent | Deliver incentives | Unlock achievements, claim rewards |

---

## 4. Integration Flows

### 4.1 MyRisa to Body Twin - Wellness Sync

| Attribute | Details |
|-----------|--------|
| **Source** | MyRisa (4703, 4729, 4820-4823) |
| **Target** | TwinOS (Body Twin) |
| **Direction** | Bidirectional |
| **Port** | 4824 |

**Data Flow:**
```
MyRisa Wellness Domains → Body Twin Context
├── Sleep Quality Score (4729)
├── Activity Level (4703)
├── Mental Wellness Index (4722)
├── Women's Health Status (4820)
├── Stress Level (4822)
└── Energy Score (4823)

Body Twin → MyRisa Context
├── Body Composition Metrics
├── Biometric Trends
└── Capability Assessments
```

**API Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/body-twin/sync` | Sync body data from MyRisa |
| GET | `/api/v1/body-twin/{userId}` | Fetch Body Twin data |
| PUT | `/api/v1/body-twin/{userId}/composition` | Update body composition |
| POST | `/api/v1/body-twin/{userId}/measurement` | Log new measurement |
| GET | `/api/v1/body-twin/{userId}/trends` | Get longitudinal trends |

**Events:**
- `body.measured` - New measurement recorded
- `composition.updated` - Body composition changed
- `biometrics.alert` - Concerning biometric reading
- `wellness.integrated` - Wellness data synced
- `capability.improved` - New capability level reached

**Error Handling:**
- Retry with exponential backoff (max 5 attempts)
- Dead letter queue for failed syncs
- Conflict resolution: latest measurement wins
- Anomaly detection before data persistence

---

### 4.2 MyRisa to Fitness Twin - Activity Integration

| Attribute | Details |
|-----------|--------|
| **Source** | MyRisa (Lifestyle Domain - 4703) |
| **Target** | TwinOS (Fitness Twin) |
| **Direction** | Bidirectional |
| **Port** | 4824 |

**Data Flow:**
```
MyRisa Activity → Fitness Twin
├── Workout Sessions (type, duration, intensity)
├── Exercise Library Usage
├── Heart Rate During Workouts
├── Steps and Daily Activity
├── Calorie Burn
└── Recovery Metrics

Fitness Twin → MyRisa
├── Current Program Structure
├── Recommended Exercises
├── Upcoming Workout Schedule
└── Trainer Notes
```

**API Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/fitness-twin/activity` | Log workout activity |
| GET | `/api/v1/fitness-twin/{userId}/program` | Get current program |
| PUT | `/api/v1/fitness-twin/{userId}/progress` | Update progress |
| GET | `/api/v1/fitness-twin/{userId}/recommendations` | Get AI recommendations |
| POST | `/api/v1/fitness-twin/{userId}/pr` | Record personal record |

**Events:**
- `workout.completed` - Workout session logged
- `exercise.modified` - Exercise changed/substituted
- `program.phase-complete` - Current phase finished
- `pr.achieved` - New personal record set
- `intensity.adjusted` - Load/intensity modified

---

### 4.3 REZ POS to Body/Fitness Twin - Gym Operations

| Attribute | Details |
|-----------|--------|
| **Source** | REZ POS (4803) |
| **Target** | TwinOS (Body/Fitness/Gym Twins) |
| **Direction** | Bidirectional |
| **Port** | 4824, 4803 |

**Data Flow:**
```
REZ POS → Twins
├── Check-in/Check-out timestamps
├── Class attendance records
├── Membership tier information
├── Payment transactions
├── Staff schedules
└── Equipment usage (IoT)

Twins → REZ POS
├── Personalized class recommendations
├── Member fitness profile for trainers
├── Attendance predictions
└── Revenue optimization suggestions
```

**API Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/pos/checkin` | Record gym check-in with twin context |
| GET | `/api/v1/pos/member/{id}/profile` | Get member twin data |
| POST | `/api/v1/pos/class/book` | Book class with fitness recommendation |
| GET | `/api/v1/pos/occupancy/current` | Get current gym occupancy |
| POST | `/api/v1/pos/membership/upgrade` | Upgrade with twin insights |

**Events:**
- `member.checked-in` - Member entered gym
- `member.checked-out` - Member left gym
- `class.enrolled` - Member joined class
- `class.started` - Class session began
- `class.completed` - Class session ended
- `membership.upgraded` - Tier changed

---

### 4.4 REZ Loyalty to Goal Twin - Achievement System

| Attribute | Details |
|-----------|--------|
| **Source** | REZ Loyalty (4701) |
| **Target** | TwinOS (Goal Twin) |
| **Direction** | Bidirectional |
| **Port** | 4824, 4701 |

**Data Flow:**
```
Goal Twin → REZ Loyalty
├── Milestone achievement notifications
├── Progress updates
├── Goal category/type
└── Achievement unlocks

REZ Loyalty → Goal Twin
├── Points earned for goal activities
├── Tier progression based on consistency
├── Reward redemption status
└── Gamification elements
```

**API Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/loyalty/goal/earn` | Earn points for goal activity |
| GET | `/api/v1/loyalty/goal/{userId}/status` | Get loyalty status for goal |
| POST | `/api/v1/loyalty/goal/milestone` | Unlock milestone reward |
| GET | `/api/v1/loyalty/goal/{userId}/rewards` | Get available rewards |
| POST | `/api/v1/loyalty/goal/streak` | Update activity streak |

**Events:**
- `goal.milestone.achieved` - Milestone reached
- `goal.points.earned` - Points credited
- `goal.streak.updated` - Streak extended
- `goal.reward.claimed` - Reward redeemed
- `goal.tier.advanced` - Loyalty tier upgraded

---

### 4.5 RisaCare B2C to Body Twin - Health Integration

| Attribute | Details |
|-----------|--------|
| **Source** | RisaCare B2C (4770) |
| **Target** | TwinOS (Body Twin) |
| **Direction** | Bidirectional |
| **Port** | 4824, 4770 |

**Data Flow:**
```
RisaCare B2C → Body Twin
├── Health risk assessments
├── Specialist recommendations
├── Injury assessments
├── Nutrition requirements
└── Medical clearances

Body Twin → RisaCare B2C
├── Current fitness level
├── Exercise history
├── Injury history
├── Limitations and restrictions
└── Recovery status
```

**API Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/risacare/health-sync` | Sync health data with Body Twin |
| GET | `/api/v1/risacare/fitness-clearance/{userId}` | Get fitness clearance |
| POST | `/api/v1/risacare/consultation/{userId}` | Book consultation with twin context |
| GET | `/api/v1/risacare/recommendations/{userId}` | Get health-fitness recommendations |

**Events:**
- `health.risk.identified` - Health risk detected
- `fitness.clearance.issued` - Medical clearance given
- `restriction.added` - New exercise restriction
- `nutrition.plan.generated` - Diet plan created

---

### 4.6 Trainer Dashboard Integration - Trainer Twin Sync

| Attribute | Details |
|-----------|--------|
| **Source** | REZ POS (Trainer Module - 4803) |
| **Target** | TwinOS (Trainer Twin) |
| **Direction** | Bidirectional |
| **Port** | 4824, 4803 |

**Data Flow:**
```
REZ POS Trainer Module → Trainer Twin
├── Session schedules
├── Member assignments
├── Performance reviews
├── Availability updates
└── Earnings tracking

Trainer Twin → REZ POS Trainer Module
├── Member fitness profiles
├── Program recommendations
├── Progress alerts
└── Optimization suggestions
```

**API Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/trainer/schedule` | Update trainer schedule |
| GET | `/api/v1/trainer/{id}/roster` | Get assigned members |
| PUT | `/api/v1/trainer/{id}/performance` | Update performance metrics |
| GET | `/api/v1/trainer/{id}/recommendations` | Get AI coaching suggestions |

**Events:**
- `trainer.member.assigned` - New member assigned
- `trainer.schedule.updated` - Availability changed
- `trainer.goal.achieved` - Member reached goal
- `trainer.pr.announced` - Member achieved PR

---

### 4.7 Cross-Twin Intelligence Flow

| Attribute | Details |
|-----------|--------|
| **Source** | All Twins |
| **Target** | Business Copilot |
| **Direction** | Aggregated |
| **Port** | 4824, 4022 |

**Data Flow:**
```
All Twins → Intelligence Aggregation
├── Body + Fitness + Goals = Progress Score
├── Trainer + Member = Coaching Effectiveness
├── Gym + Members = Occupancy Patterns
└── Loyalty + Goals = Engagement Score

Intelligence → Insights & Recommendations
├── Churn Prediction
├── Goal Completion Forecast
├── Personalization Engine
└── Revenue Optimization
```

**API Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/intelligence/progress/{userId}` | Get overall progress score |
| GET | `/api/v1/intelligence/churn/{gymId}` | Get churn predictions |
| GET | `/api/v1/intelligence/recommendations/{userId}` | Get personalized recommendations |
| GET | `/api/v1/intelligence/gym/{gymId}/dashboard` | Get gym analytics |

---

## 5. Agent Architecture

### 5.1 Body Analysis Agent

| Attribute | Details |
|-----------|--------|
| **Role** | Comprehensive body composition analysis |
| **Autonomy Level** | L3 (Autonomous with human oversight) |
| **Port** | 4824 |
| **Skills** | biometrics-analysis, body-composition, trend-detection |

**Twins Managed:**
- Body Twin (primary)
- Fitness Twin (secondary)

**Actions:**
- Analyze body composition metrics
- Compare against benchmarks and trends
- Detect anomalies in biometrics
- Generate body analysis reports
- Recommend body composition improvements
- Monitor progress toward body goals

**Skills:**
```yaml
- biometrics-analysis:
    capabilities: ["heart-rate", "blood-pressure", "hrv", "vo2max"]
    benchmarks: ["age-appropriate", "gender-adjusted", "activity-adjusted"]
    anomaly_detection: true
    
- body-composition:
    metrics: ["bmi", "body-fat", "muscle-mass", "water", "visceral-fat"]
    assessment: ["healthy-range", "improvement-areas", "strengths"]
    recommendations: ["target-body-fat", "muscle-gain", "maintenance"]
    
- trend-detection:
    analysis_frequency: "daily"
    patterns: ["weight-cycling", "plateau", "consistent-improvement"]
    alerts: ["concerning-trends", "celebration-worthy"]
```

---

### 5.2 Fitness Coach Agent

| Attribute | Details |
|-----------|--------|
| **Role** | AI-powered workout programming and coaching |
| **Autonomy Level** | L3 (Autonomous with trainer override) |
| **Port** | 4824 |
| **Skills** | program-design, exercise-selection, intensity-management |

**Twins Managed:**
- Fitness Twin (primary)
- Body Twin (secondary)
- Goal Twin (tertiary)

**Actions:**
- Design progressive workout programs
- Select exercises based on goals and limitations
- Adjust intensity based on recovery
- Substitute exercises for injuries
- Track and celebrate PRs
- Generate workout instructions

**Skills:**
```yaml
- program-design:
    periodization: ["linear", "undulating", "block", "conjugate"]
    progression: ["linear", "exponential", "double-progression"]
    exercise_selection: ["movement-patterns", "muscle-balance", "individual-history"]
    
- exercise-selection:
    criteria: ["goal-aligned", "limitation-aware", "equipment-available"]
    substitutions: ["primary-movements", "secondary-movements", "isolation"]
    form_cues: ["setup", "execution", "common-mistakes"]
    
- intensity-management:
    metrics: ["rpe", "rhr", "recovery-score", "sleep-quality"]
    adjustments: ["maintain", "progress", "deload"]
    frequency: "after-each-session"
```

---

### 5.3 Trainer Intelligence Agent

| Attribute | Details |
|-----------|--------|
| **Role** | Trainer performance optimization and member matching |
| **Autonomy Level** | L2 (Recommends, human approves) |
| **Port** | 4824 |
| **Skills** | performance-tracking, member-matching, schedule-optimization |

**Twins Managed:**
- Trainer Twin (primary)
- Body Twin (for member matching)
- Goal Twin (for member matching)

**Actions:**
- Track trainer performance metrics
- Match new members to appropriate trainers
- Optimize trainer schedules
- Identify training opportunities
- Coach trainers on improvement areas
- Generate trainer performance reports

**Skills:**
```yaml
- performance-tracking:
    metrics: ["member-retention", "goal-achievement", "session-rating", "response-time"]
    frequency: "weekly"
    benchmarks: ["gym-average", "industry-standard"]
    
- member-matching:
    criteria: ["goal-alignment", "personality-match", "availability", "specialization"]
    algorithm: "weighted-scoring"
    confidence_threshold: 0.75
    
- schedule-optimization:
    constraints: ["trainer-availability", "member-preference", "peak-hours"]
    objectives: ["maximize-utilization", "minimize-gap", "balance-workload"]
    optimization: "constraint-satisfaction"
```

---

### 5.4 Goal Achievement Agent

| Attribute | Details |
|-----------|--------|
| **Role** | Guide members toward goal achievement |
| **Autonomy Level** | L3 (Autonomous) |
| **Port** | 4824 |
| **Skills** | goal-setting, milestone-tracking, motivation, obstacle-resolution |

**Twins Managed:**
- Goal Twin (primary)
- Fitness Twin (secondary)
- Body Twin (tertiary)

**Actions:**
- Set realistic, achievable goals using SMART framework
- Create milestone breakdowns
- Track daily/weekly progress
- Adjust timelines based on pace
- Provide motivation and encouragement
- Identify and solve obstacles
- Unlock rewards at milestones

**Skills:**
```yaml
- goal-setting:
    framework: "smart"  # Specific, Measurable, Achievable, Relevant, Time-bound
    difficulty: ["beginner", "intermediate", "advanced"]
    category: ["body-composition", "strength", "endurance", "lifestyle"]
    
- milestone-tracking:
    frequency: "weekly-check"
    metrics: ["primary-metric", "secondary-metrics", "behavioral-habits"]
    status: ["on-track", "ahead", "behind", "stalled"]
    
- motivation:
    techniques: ["positive-reinforcement", "social-proof", "goal-reminder", "streak"]
    frequency: "daily"
    channels: ["push-notification", "in-app", "whatsapp"]
    
- obstacle-resolution:
    identification: ["barrier-analysis", "pattern-detection"]
    solutions: ["alternative-approaches", "support-resources", "timeline-adjustment"]
    escalation: ["trainer-alert", "member-support"]
```

---

### 5.5 Gym Operations Agent

| Attribute | Details |
|-----------|--------|
| **Role** | Optimize gym operations and member experience |
| **Autonomy Level** | L3 (Autonomous) |
| **Port** | 4803, 4824 |
| **Skills** | occupancy-prediction, class-scheduling, equipment-maintenance |

**Twins Managed:**
- Gym Twin (primary)
- Trainer Twin (secondary)
- Body Twin (for occupancy patterns)

**Actions:**
- Predict gym occupancy by hour/day
- Optimize class scheduling
- Schedule equipment maintenance
- Balance trainer workload
- Identify peak and off-peak times
- Generate operational reports

**Skills:**
```yaml
- occupancy-prediction:
    granularity: ["hourly", "daily", "weekly"]
    features: ["day-of-week", "time-of-day", "weather", "events", "membership-tier"]
    accuracy_target: 0.85
    
- class-scheduling:
    constraints: ["instructor-availability", "room-capacity", "equipment"]
    objectives: ["maximize-enrollment", "minimize-conflicts", "balance-offerings"]
    optimization: "multi-objective"
    
- equipment-maintenance:
    tracking: ["usage-hours", "wear-indicators", "member-reports"]
    prediction: ["failure-risk", "maintenance-window"]
    scheduling: ["preventive", "corrective"]
```

---

### 5.6 Churn Prevention Agent

| Attribute | Details |
|-----------|--------|
| **Role** | Identify at-risk members and prevent churn |
| **Autonomy Level** | L2 (Recommends, human executes) |
| **Port** | 4824 |
| **Skills** | risk-detection, engagement-analysis, retention-tactics |

**Twins Managed:**
- Body Twin (behavior patterns)
- Fitness Twin (engagement)
- Goal Twin (motivation)
- Trainer Twin (relationship strength)

**Actions:**
- Monitor engagement signals
- Predict churn probability
- Identify churn risk factors
- Trigger retention interventions
- Escalate high-risk cases to staff
- Track intervention effectiveness

**Skills:**
```yaml
- risk-detection:
    signals: ["check-in-decline", "class-missed", "goal-stalled", "payment-issue"]
    frequency: "daily"
    threshold: "configurable-per-gym"
    
- engagement-analysis:
    metrics: ["visit-frequency", "class-participation", "trainer-interaction", "goal-progress"]
    trends: ["improving", "stable", "declining"]
    segments: ["highly-engaged", "moderately-engaged", "at-risk", "dormant"]
    
- retention-tactics:
    interventions: ["personal-reach-out", "incentive-offer", "goal-reset", "trainer-assignment"]
    timing: ["immediate", "scheduled", "milestone-based"]
    escalation: ["front-desk-call", "trainer-message", "manager-alert"]
```

---

### 5.7 Nutrition Integration Agent

| Attribute | Details |
|-----------|--------|
| **Role** | Connect fitness goals with nutrition planning |
| **Autonomy Level** | L2 (Recommends, human approves major changes) |
| **Port** | 4824, 4725 |
| **Skills** | calorie-calculation, macro-split, meal-planning, supplement-advice |

**Twins Managed:**
- Body Twin (metrics)
- Fitness Twin (demands)
- Goal Twin (targets)
- MyRisa Nutrition (4725)

**Actions:**
- Calculate daily calorie needs
- Recommend macro splits
- Generate meal suggestions
- Track dietary adherence
- Adjust based on progress
- Coordinate with RisaCare nutrition service

**Skills:**
```yaml
- calorie-calculation:
    methods: ["mifflin-st-jeor", "katch-mcardle", "activity-factor"]
    adjustment: ["goal-based", "progress-based"]
    
- macro-split:
    ranges: ["balanced", "high-protein", "low-carb", "athletic"]
    calculation: ["body-weight-based", "lean-mass-based"]
    
- meal-planning:
    preferences: ["vegetarian", "non-vegetarian", "vegan", "allergies"]
    constraints: ["budget", "cooking-time", "availability"]
    integration: ["grocery-ordering", "meal-prep"]
```

---

## 6. Business Copilot Integration

### 6.1 Insights Available to Gym Owners & Managers

**Operational Insights:**
- Hourly/daily/weekly/monthly member visits
- Class enrollment rates and waitlists
- Trainer utilization and productivity
- Equipment usage and availability
- Peak hours and crowding patterns
- Staff scheduling efficiency

**Financial Insights:**
- Revenue by membership tier
- Personal training revenue
- Retail supplement sales
- Cost per acquisition
- Member lifetime value
- Revenue per available member

**Member Insights:**
- Goal achievement rates
- Attendance trends
- Churn probability scores
- Engagement score distribution
- Trainer effectiveness ratings
- Class preference patterns

**Wellness Insights (via MyRisa):**
- Average member wellness scores
- Sleep quality correlation with attendance
- Stress level impact on retention
- Activity level distribution

### 6.2 Natural Language Queries Supported

| Category | Sample Queries |
|----------|---------------|
| **Operations** | "What's our busiest hour on Saturdays?", "Show me trainer utilization this week", "When should we schedule the new HIIT class?" |
| **Members** | "Which members are at risk of churning?", "Show me members who haven't visited in 2 weeks", "What's our retention rate for goal-based members?" |
| **Revenue** | "How much did personal training generate this month?", "Compare revenue across our 3 locations", "What's our projected revenue for next quarter?" |
| **Performance** | "Which trainer has the best goal achievement rate?", "Show me class popularity trends", "What's our average member's progress score?" |
| **Recommendations** | "What should we do to reduce morning wait times?", "How can we improve member retention?", "Which equipment needs maintenance soon?" |

### 6.3 Dashboard Views Needed

**Executive Dashboard:**
- Total active members
- Revenue summary (MTD, YTD)
- Key performance indicators with trends
- Churn alerts and action items
- Comparative performance (vs previous period, vs targets)

**Operations Dashboard:**
- Real-time gym occupancy
- Class schedule and enrollment
- Trainer schedule and assignments
- Equipment status
- Maintenance alerts

**Member Analytics Dashboard:**
- Member engagement scores
- Goal achievement funnel
- Attendance heat map
- Trainer performance comparison
- Churn risk indicators

**Financial Dashboard:**
- Revenue breakdown by category
- Membership tier distribution
- Personal training metrics
- Retail performance
- Cost analysis

**Wellness Dashboard (via MyRisa):**
- Member wellness trends
- Sleep quality correlation
- Stress level distribution
- Activity patterns

---

## 7. Economic Integration

### 7.1 Payment Flows

```
Member Journey Flow:
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Member    │────>│   REZ POS    │────>│   RABTUL    │
│  Enrolls    │     │  (Membership)│     │   Payment   │
└─────────────┘     └──────────────┘     └─────────────┘
                          │                     │
                          v                     v
                   ┌────────────────────────────────┐
                   │         Goal Twin             │
                   │   (Track Progress)              │
                   └────────────────────────────────┘
                          │                     │
                          v                     v
                   ┌────────────────────────────────┐
                   │      REZ Loyalty              │
                   │   (Points & Rewards)            │
                   └────────────────────────────────┘
                          │
                          v
                   ┌────────────────────────────────┐
                   │      RABTUL Wallet             │
                   │   (Balance & Transactions)      │
                   └────────────────────────────────┘
```

**Payment Flows:**

| Flow | Source | Target | Description |
|------|--------|--------|-------------|
| Membership Dues | Member | Gym | Monthly/yearly gym membership |
| Personal Training | Member | Trainer | Per-session PT fees |
| Class Booking | Member | Gym | Drop-in or bundled classes |
| Retail Purchase | Member | Gym | Supplements, merchandise |
| Rewards Redemption | REZ Loyalty | Member | Points for rewards |
| Trainer Payout | Gym | Trainer | Weekly/monthly earnings |
| Referral Bonus | REZ Loyalty | Member | Points for referrals |

### 7.2 Rewards/Loyalty Integration

**Fitness-Specific Rewards Program:**

```
Points Earning Activities:
├── Workout Completion: 10 points/session
├── Goal Milestone: 100-500 points (based on difficulty)
├── Class Attendance: 15 points/class
├── Referral: 200 points
├── 7-Day Streak: 2x points multiplier
├── MyRisa Sync: 5 points/day
├── Review/Rating: 25 points
└── Challenge Completion: 150 points

Points Redemption Options:
├── Free Gym Day: 500 points
├── PT Session (30 min): 1500 points
├── PT Session (60 min): 2500 points
├── Nutrition Plan: 1000 points
├── Supplement Discount (10%): 300 points
├── REZ Marketplace Items: Variable
├── Partner Gym Day Pass: 800 points
└── Merchandise: Variable
```

**Tier Structure:**

| Tier | Points Required | Benefits |
|------|-----------------|----------|
| Bronze | 0 | Basic rewards, 1x points |
| Silver | 2,000 | Priority booking, 1.25x points |
| Gold | 5,000 | Free guest passes, 1.5x points |
| Platinum | 10,000 | Personal training discount, 2x points |
| Diamond | 25,000 | VIP events, exclusive classes, 2.5x points |

### 7.3 Wallet Usage

**RABTUL Wallet Integration for Fitness:**

| Use Case | Flow |
|----------|------|
| **Membership Auto-Pay** | Wallet auto-deducted for monthly dues |
| **PT Session Payment** | Pay trainer directly from wallet |
| **Class Booking** | Wallet for drop-in classes |
| **Rewards Accumulation** | Fitness rewards credited to wallet |
| **Referral Bonuses** | Referral rewards to wallet |
| **Supplement Purchase** | In-gym retail via wallet |
| **Contest Winnings** | Challenge prizes to wallet |

**Wallet Balances for Fitness:**
- Member wallet: Membership dues, PT payments, purchases
- Trainer wallet: Earnings, tips, bonuses
- Gym wallet: Revenue collection, expense payments
- Rewards wallet: Fitness-specific reward points

---

## 8. Implementation Roadmap

### Phase 1: Core Integration (Weeks 1-2)

#### Week 1 (Days 1-5)

**Tasks:**
1. Set up TwinOS infrastructure for Fitness vertical
2. Deploy Body Twin and Fitness Twin data models
3. Create MyRisa to TwinOS sync API endpoints
4. Configure RABTUL Auth integration for fitness
5. Set up REZ POS integration for check-in/attendance
6. Implement base Body Twin with demographics and biometrics
7. Implement base Fitness Twin with program structure

#### Week 2 (Days 6-10)

**Tasks:**
1. Integrate MyRisa Lifestyle domain to Body Twin
2. Integrate MyRisa Sleep domain to Body Twin
3. Connect REZ POS check-ins to Body/Fitness Twins
4. Deploy Body Analysis Agent with basic metrics
5. Deploy Fitness Coach Agent with program tracking
6. End-to-end testing of core member journey
7. UAT with 3 pilot gyms

**Phase 1 Deliverables:**
- TwinOS Fitness namespace deployed
- Body Twin with demographics, biometrics, composition
- Fitness Twin with program structure, exercise library
- MyRisa Wellness data flowing to Body Twin
- REZ POS check-in data syncing to twins
- 2 operational AI agents (Body Analysis, Fitness Coach)
- 3 pilot gym integrations live

---

### Phase 2: Advanced Features (Weeks 3-4)

#### Week 3 (Days 11-15)

**Tasks:**
1. Deploy Trainer Twin and Gym Twin models
2. Connect Trainer scheduling to Trainer Twin
3. Integrate REZ Loyalty for achievement system
4. Deploy Goal Achievement Agent with milestone tracking
5. Connect RisaCare B2C for health-fitness bridge
6. Deploy Trainer Intelligence Agent
7. Integrate Nutrition Integration Agent

#### Week 4 (Days 16-20)

**Tasks:**
1. Deploy Gym Operations Agent
2. Deploy Churn Prevention Agent
3. Connect all agents with Business Copilot
4. Implement REZ Loyalty integration for gamification
5. Performance optimization and load testing
6. Security audit and compliance review
7. UAT expansion to 10 pilot gyms

**Phase 2 Deliverables:**
- All 5 Twin types deployed (Body, Fitness, Trainer, Gym, Goal)
- REZ Loyalty integration for fitness rewards
- REZ POS fully integrated for operations
- RisaCare B2C health-fitness bridge
- 7 operational AI agents
- Business Copilot dashboards for gym operations
- 10 pilot gym deployments

---

### Phase 3: Optimization & Scale (Weeks 5-6)

#### Week 5 (Days 21-25)

**Tasks:**
1. Deploy cross-twin intelligence aggregation
2. Implement predictive churn scoring
3. Optimize agent performance based on feedback
4. Scale infrastructure for 50+ gyms
5. Implement personalized class recommendations
6. Deploy revenue optimization features
7. Set up real-time alerts and escalations

#### Week 6 (Days 26-30)

**Tasks:**
1. Full deployment across all pilot gyms
2. Training program for gym staff on AI workflows
3. Training program for trainers on agent tools
4. Member education on MyRisa integration
5. Performance monitoring and SLA tracking
6. Feedback collection and agent refinement
7. Documentation and knowledge base creation
8. Go-live celebration and success metrics review

**Phase 3 Deliverables:**
- Predictive churn scoring from combined data
- 50+ gym deployment capability
- Business Copilot dashboards (operations, revenue, member insights)
- Complete fitness wellness integration with proactive health
- Full staff and trainer training programs
- Real-time alerts and escalations operational
- Production-ready Fitness & Wellness OS

---

## Appendix A: API Endpoint Summary

| Integration | Source | Target | Key Endpoints |
|-------------|--------|--------|---------------|
| MyRisa-Body | MyRisa | Body Twin | `/body-twin/sync`, `/body-twin/{id}`, `/body-twin/{id}/trends` |
| MyRisa-Fitness | MyRisa | Fitness Twin | `/fitness-twin/activity`, `/fitness-twin/{id}/program` |
| POS-Twins | REZ POS | All Twins | `/pos/checkin`, `/pos/member/{id}/profile` |
| Loyalty-Goals | REZ Loyalty | Goal Twin | `/loyalty/goal/earn`, `/loyalty/goal/milestone` |
| RisaCare-Body | RisaCare B2C | Body Twin | `/risacare/health-sync`, `/risacare/fitness-clearance` |
| Trainer-Twins | REZ POS | Trainer Twin | `/trainer/schedule`, `/trainer/{id}/roster` |
| Intelligence | All Twins | Copilot | `/intelligence/progress/{id}`, `/intelligence/churn/{gymId}` |

---

## Appendix B: Event Summary

| Event | Source | Target | Trigger |
|-------|--------|--------|---------|
| `body.measured` | REZ POS | Body Twin | New measurement recorded |
| `workout.completed` | MyRisa | Fitness Twin | Workout session logged |
| `member.checked-in` | REZ POS | Gym Twin | Member entered gym |
| `goal.milestone.achieved` | Goal Twin | REZ Loyalty | Milestone reached |
| `trainer.member.assigned` | REZ POS | Trainer Twin | New member assigned |
| `health.risk.identified` | MyRisa | Body Twin | Health risk detected |
| `pr.achieved` | Fitness Twin | Goal Twin | New personal record |
| `churn.risk.detected` | Churn Agent | Trainer Twin | Risk score above threshold |
| `class.enrolled` | REZ POS | Fitness Twin | Member joined class |
| `wellness.integrated` | MyRisa | Body Twin | Wellness data synced |

---

## Appendix C: Port Registry for Fitness & Wellness OS

| Service | Port | Purpose |
|---------|------|---------|
| TwinOS Gateway | 4824 | Body/Fitness/Trainer/Gym/Goal Twin access |
| Body Twin | 4824-B1 | Body entity management |
| Fitness Twin | 4824-F1 | Fitness program management |
| Trainer Twin | 4824-T1 | Trainer profile management |
| Gym Twin | 4824-G1 | Gym location management |
| Goal Twin | 4824-GL1 | Goal tracking management |
| MyRisa App | 4900 | Consumer interface |
| MyRisa Wellness | 4703 | Exercise, nutrition, habits |
| MyRisa Sleep | 4729 | Sleep tracking and analysis |
| MyRisa Mental | 4722 | Mental wellness |
| MyRisa Women's | 4820 | Women's health |
| REZ POS Fitness | 4803 | Gym operations, billing |
| REZ Loyalty | 4701 | Points and rewards |
| RisaCare B2C | 4770 | Health consultations |
| RABTUL Auth | 4002 | JWT authentication |
| RABTUL Payment | 4001 | Payment processing |
| RABTUL Wallet | 4004 | Balance management |
| RABTUL Notify | 4005 | Notifications |
| Business Copilot | 4022 | Analytics and insights |

---

**Document Version:** 1.0  
**Last Updated:** June 12, 2026  
**Status:** Ready for Implementation  
**Prepared by:** Claude Code (AI Assistant)

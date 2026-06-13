# Fitness OS Integration Specification

## Version 1.0 | June 2026

---

## 1. Executive Summary

This document defines the integration architecture for the Fitness OS vertical, connecting fitness tracking, wellness management, and gym operations through a unified TwinOS framework. The system enables fitness businesses to deliver personalized health experiences by correlating Body Twins, Fitness Twins, Trainer Twins, Gym Twins, and Goal Twins.

**Core Value Proposition**: Transform fragmented fitness operations into an intelligent, interconnected ecosystem where body metrics automatically inform workout recommendations, trainer expertise is matched to client goals, and gym resources are optimized in real-time.

**Key Integration Point**: MyRisa serves as the primary data source across 7 health domains, feeding biometric and activity intelligence into TwinOS where Body Twin data drives personalized fitness recommendations and trainer matching.

---

## 2. Product Capability Matrix

| Product | Port | Core Function | Data Inputs | Data Outputs |
|---------|------|---------------|-------------|--------------|
| MyRisa | 4300 | 7-domain health tracking (Sleep, Nutrition, Fitness, Stress, Recovery, Mindfulness, Hydration) | Wearables, manual input, integrations | Biometric data, insights, recommendations |
| RisaCare B2C | 4400 | Client-facing wellness portal, progress tracking | MyRisa data, user input | Progress reports, coach messaging |
| REZ Loyalty | 3200 | Points management, rewards, membership tiers | Transaction data, engagement | Points balance, rewards, tier status |
| REZ POS | 3100 | Point of sale, transactions, billing | Sales data, inventory | Transaction records, revenue analytics |
| TwinOS | 4142 | Digital twin orchestration, relationship mapping | All product outputs | Twin states, relationship graphs |

### Fitness CRM Service
| Attribute | Value |
|-----------|-------|
| **Port** | `TBD` |
| **Company** | REZ Merchant |
| **Capabilities** | Customer profiles, segmentation, campaigns, visit tracking |
| **Data Produced** | Customer segments, campaign results, churn risk |
| **Data Needed** | Customer Twin, Transaction Twin |
| **TwinOS Role** | CUSTOMER INTELLIGENCE |

### MyRisa 7 Domains

1. **Fitness Domain** - Workout tracking, strength training, cardio
2. **Nutrition Domain** - Meal planning, calorie tracking, macros
3. **Sleep Domain** - Sleep quality, patterns, recommendations
4. **Mindfulness Domain** - Meditation, stress management
5. **Recovery Domain** - Rest days, stretching, mobility
6. **Biometrics Domain** - Vitals, body measurements, health markers
7. **Social Domain** - Challenges, community, motivation

---

## 3. Twin JSON Schemas

### 3.1 Body Twin (4142-B1)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Body Twin",
  "description": "Represents an individual's body metrics and health state",
  "twinId": "4142-B1",
  "version": "1.0",
  "attributes": {
    "bodyId": { "type": "string", "format": "uuid" },
    "userId": { "type": "string", "format": "uuid" },
    "fullName": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "dateOfBirth": { "type": "string", "format": "date" },
    "gender": { "type": "string" },
    "height": { "type": "number", "unit": "cm" },
    "weight": { "type": "number", "unit": "kg" },
    "bodyComposition": {
      "type": "object",
      "properties": {
        "bodyFatPercentage": { "type": "number" },
        "muscleMass": { "type": "number", "unit": "kg" },
        "waterPercentage": { "type": "number" },
        "boneMass": { "type": "number", "unit": "kg" },
        "visceralFat": { "type": "number" }
      }
    },
    "vitalMetrics": {
      "type": "object",
      "properties": {
        "restingHeartRate": { "type": "number", "unit": "bpm" },
        "bloodPressureSystolic": { "type": "number" },
        "bloodPressureDiastolic": { "type": "number" },
        "heartRateVariability": { "type": "number", "unit": "ms" },
        "bloodOxygen": { "type": "number", "unit": "%" }
      }
    },
    "fitnessMetrics": {
      "type": "object",
      "properties": {
        "vo2Max": { "type": "number" },
        "fitnessAge": { "type": "number" },
        "flexibilityScore": { "type": "number" },
        "strengthLevel": { "type": "enum", "enum": ["Beginner", "Intermediate", "Advanced", "Elite"] },
        "enduranceLevel": { "type": "enum", "enum": ["Beginner", "Intermediate", "Advanced", "Elite"] }
      }
    },
    "sleepMetrics": {
      "type": "object",
      "properties": {
        "avgSleepDuration": { "type": "number", "unit": "hours" },
        "sleepQuality": { "type": "number", "minimum": 0, "maximum": 100 },
        "deepSleepPercentage": { "type": "number" },
        "remSleepPercentage": { "type": "number" },
        "sleepScore": { "type": "number", "minimum": 0, "maximum": 100 }
      }
    },
    "nutritionMetrics": {
      "type": "object",
      "properties": {
        "dailyCaloriesTarget": { "type": "number" },
        "dailyProteinTarget": { "type": "number", "unit": "g" },
        "dailyCarbsTarget": { "type": "number", "unit": "g" },
        "dailyFatTarget": { "type": "number", "unit": "g" },
        "hydrationTarget": { "type": "number", "unit": "ml" }
      }
    },
    "stressMetrics": {
      "type": "object",
      "properties": {
        "stressLevel": { "type": "number", "minimum": 0, "maximum": 100 },
        "cortisolTrend": { "type": "string" },
        "recoveryScore": { "type": "number", "minimum": 0, "maximum": 100 }
      }
    },
    "lastUpdated": { "type": "string", "format": "date-time" },
    "dataSources": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "relationships": {
    "HAS_GOAL": {
      "type": "array",
      "items": { "$ref": "#/definitions/GoalTwin" }
    },
    "WORKS_WITH": {
      "type": "array",
      "items": { "$ref": "#/definitions/TrainerTwin" }
    },
    "TRACKS_PROGRESS": {
      "type": "array",
      "items": { "$ref": "#/definitions/FitnessTwin" }
    },
    "VISITS": {
      "type": "array",
      "items": { "$ref": "#/definitions/GymTwin" }
    }
  },
  "managingAgent": "Fitness Assessment Agent",
  "dataSources": ["MyRisa", "Wearables", "Manual Input", "RisaCare B2C"],
  "updateTriggers": ["Biometric reading received", "Wearable sync", "Manual update", "Daily aggregation"]
}
```

### 3.2 Fitness Twin (4142-F1)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Fitness Twin",
  "description": "Represents a fitness activity or workout session",
  "twinId": "4142-F1",
  "version": "1.0",
  "attributes": {
    "fitnessId": { "type": "string", "format": "uuid" },
    "activityType": {
      "type": "enum",
      "enum": ["Strength", "Cardio", "HIIT", "Yoga", "Pilates", "Swimming", "Cycling", "Running", "CrossFit", "Functional", "Mobility", "Sports"],
      "description": "Primary activity classification"
    },
    "sessionDate": { "type": "string", "format": "date-time" },
    "duration": { "type": "number", "unit": "minutes" },
    "intensity": { "type": "enum", "enum": ["Light", "Moderate", "Vigorous", "Max Effort"] },
    "location": {
      "type": "object",
      "properties": {
        "gymId": { "type": "string" },
        "gymName": { "type": "string" },
        "equipment": { "type": "array", "items": { "type": "string" } }
      }
    },
    "performanceMetrics": {
      "type": "object",
      "properties": {
        "caloriesBurned": { "type": "number" },
        "avgHeartRate": { "type": "number" },
        "maxHeartRate": { "type": "number" },
        "activeMinutes": { "type": "number" },
        "distance": { "type": "number" },
        "elevation": { "type": "number" }
      }
    },
    "exercises": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "sets": { "type": "integer" },
          "reps": { "type": "integer" },
          "weight": { "type": "number" },
          "duration": { "type": "number" },
          "notes": { "type": "string" }
        }
      }
    },
    "perceivedExertion": { "type": "number", "minimum": 1, "maximum": 10 },
    "mood": { "type": "enum", "enum": ["Very Low", "Low", "Neutral", "High", "Very High"] },
    "recoveryImpact": { "type": "number", "minimum": -100, "maximum": 100 },
    "postSessionNotes": { "type": "string" }
  },
  "relationships": {
    "PERFORMED_BY": { "$ref": "#/definitions/BodyTwin" },
    "GUIDED_BY": { "$ref": "#/definitions/TrainerTwin" },
    "LOCATION": { "$ref": "#/definitions/GymTwin" },
    "SUPPORTS": {
      "type": "array",
      "items": { "$ref": "#/definitions/GoalTwin" }
    }
  },
  "managingAgent": "Workout Agent",
  "dataSources": ["MyRisa", "REZ POS", "Wearables", "Trainer Input"],
  "updateTriggers": ["Workout completed", "Session logged", "Performance milestone", "Trainer review"]
}
```

### 3.3 Trainer Twin (4142-TR1)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Trainer Twin",
  "description": "Represents a fitness trainer with expertise and availability",
  "twinId": "4142-TR1",
  "version": "1.0",
  "attributes": {
    "trainerId": { "type": "string", "format": "uuid" },
    "fullName": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "phone": { "type": "string" },
    "certifications": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "issuingBody": { "type": "string" },
          "expirationDate": { "type": "string", "format": "date" },
          "level": { "type": "string" }
        }
      }
    },
    "specializations": {
      "type": "array",
      "items": { "type": "string" }
    },
    "experience": {
      "type": "object",
      "properties": {
        "yearsActive": { "type": "integer" },
        "clientsTrained": { "type": "integer" },
        "certifications": { "type": "integer" }
      }
    },
    "trainingStyle": {
      "type": "enum",
      "enum": ["Motivational", "Technical", "Holistic", "High-Intensity", "Rehabilitation", "Athletic"],
      "description": "Primary training approach"
    },
    "availability": {
      "type": "object",
      "properties": {
        "schedule": { "type": "object" },
        "currentClients": { "type": "integer" },
        "maxClients": { "type": "integer" },
        "preferredTimes": { "type": "array" }
      }
    },
    "performanceMetrics": {
      "type": "object",
      "properties": {
        "clientSatisfaction": { "type": "number" },
        "goalAchievementRate": { "type": "number" },
        "retentionRate": { "type": "number" },
        "avgSessionRating": { "type": "number" }
      }
    },
    "ratings": {
      "type": "object",
      "properties": {
        "overall": { "type": "number" },
        "professionalism": { "type": "number" },
        "knowledge": { "type": "number" },
        "communication": { "type": "number" }
      }
    },
    "pricing": {
      "type": "object",
      "properties": {
        "hourlyRate": { "type": "number" },
        "packageRates": { "type": "object" },
        "currency": { "type": "string", "default": "USD" }
      }
    }
  },
  "relationships": {
    "TRAINS": {
      "type": "array",
      "items": { "$ref": "#/definitions/BodyTwin" }
    },
    "GUIDES": {
      "type": "array",
      "items": { "$ref": "#/definitions/FitnessTwin" }
    },
    "AFFILIATED_WITH": {
      "type": "array",
      "items": { "$ref": "#/definitions/GymTwin" }
    },
    "SPECIALIZES_IN": {
      "type": "array",
      "items": { "$ref": "#/definitions/GoalTwin" }
    }
  },
  "managingAgent": "Booking Agent",
  "dataSources": ["HR System", "REZ POS", "RisaCare B2C"],
  "updateTriggers": ["Client assigned", "Session completed", "Certification updated", "Availability changed"]
}
```

### 3.4 Gym Twin (4142-G1)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Gym Twin",
  "description": "Represents a fitness facility with resources and capacity",
  "twinId": "4142-G1",
  "version": "1.0",
  "attributes": {
    "gymId": { "type": "string", "format": "uuid" },
    "gymName": { "type": "string" },
    "brand": { "type": "string" },
    "address": {
      "type": "object",
      "properties": {
        "street": { "type": "string" },
        "city": { "type": "string" },
        "state": { "type": "string" },
        "zipCode": { "type": "string" },
        "country": { "type": "string" }
      }
    },
    "location": {
      "type": "object",
      "properties": {
        "latitude": { "type": "number" },
        "longitude": { "type": "number" }
      }
    },
    "facilityType": { "type": "enum", "enum": ["Large Gym", "Boutique", "CrossFit Box", "Yoga Studio", "Pool", "Outdoor", "Mobile"] },
    "operatingHours": {
      "type": "object",
      "properties": {
        "monday": { "type": "object" },
        "tuesday": { "type": "object" },
        "wednesday": { "type": "object" },
        "thursday": { "type": "object" },
        "friday": { "type": "object" },
        "saturday": { "type": "object" },
        "sunday": { "type": "object" }
      }
    },
    "amenities": {
      "type": "array",
      "items": { "type": "string" }
    },
    "equipment": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "quantity": { "type": "integer" },
          "condition": { "type": "enum", "enum": ["Excellent", "Good", "Fair", "Needs Replacement"] }
        }
      }
    },
    "capacity": {
      "type": "object",
      "properties": {
        "maxMembers": { "type": "integer" },
        "currentMembers": { "type": "integer" },
        "peakOccupancy": { "type": "integer" },
        "avgOccupancy": { "type": "number" }
      }
    },
    "staff": {
      "type": "object",
      "properties": {
        "trainers": { "type": "integer" },
        "frontDesk": { "type": "integer" },
        "maintenance": { "type": "integer" }
      }
    },
    "membershipTiers": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "price": { "type": "number" },
          "features": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "performanceMetrics": {
      "type": "object",
      "properties": {
        "revenue": { "type": "number" },
        "memberRetention": { "type": "number" },
        "ptRevenue": { "type": "number" },
        "classAttendance": { "type": "number" }
      }
    }
  },
  "relationships": {
    "EMPLOYS": {
      "type": "array",
      "items": { "$ref": "#/definitions/TrainerTwin" }
    },
    "HOSTS": {
      "type": "array",
      "items": { "$ref": "#/definitions/FitnessTwin" }
    },
    "WELCOMES": {
      "type": "array",
      "items": { "$ref": "#/definitions/BodyTwin" }
    }
  },
  "managingAgent": "Progress Agent",
  "dataSources": ["REZ POS", "REZ Loyalty", "Facility Management"],
  "updateTriggers": ["Member check-in", "Equipment status change", "Class scheduled", "Peak hours analysis"]
}
```

### 3.5 Goal Twin (4142-GO1)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Goal Twin",
  "description": "Represents a fitness or wellness goal with progress tracking",
  "twinId": "4142-GO1",
  "version": "1.0",
  "attributes": {
    "goalId": { "type": "string", "format": "uuid" },
    "goalType": {
      "type": "enum",
      "enum": ["Weight Loss", "Muscle Gain", "Endurance", "Flexibility", "Stress Reduction", "Sleep Improvement", "Nutrition", "Competition", "Rehabilitation", "General Wellness"],
      "description": "Primary goal classification"
    },
    "title": { "type": "string" },
    "description": { "type": "string" },
    "status": { "type": "enum", "enum": ["Active", "Paused", "Completed", "Abandoned"] },
    "priority": { "type": "enum", "enum": ["Critical", "High", "Medium", "Low"] },
    "createdDate": { "type": "string", "format": "date-time" },
    "targetDate": { "type": "string", "format": "date" },
    "targetValue": { "type": "number" },
    "currentValue": { "type": "number" },
    "unit": { "type": "string" },
    "progressPercentage": { "type": "number", "minimum": 0, "maximum": 100 },
    "milestones": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "targetValue": { "type": "number" },
          "achievedDate": { "type": "string", "format": "date" },
          "status": { "type": "enum", "enum": ["Pending", "Achieved", "Missed"] }
        }
      }
    },
    "metrics": {
      "type": "object",
      "properties": {
        "consistency": { "type": "number" },
        "velocity": { "type": "number" },
        "onTrack": { "type": "boolean" },
        "lastProgressDate": { "type": "string", "format": "date-time" }
      }
    },
    "adjustments": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "date": { "type": "string", "format": "date-time" },
          "previousTarget": { "type": "number" },
          "newTarget": { "type": "number" },
          "reason": { "type": "string" }
        }
      }
    }
  },
  "relationships": {
    "SET_BY": { "$ref": "#/definitions/BodyTwin" },
    "GUIDED_BY": { "$ref": "#/definitions/TrainerTwin" },
    "SUPPORTED_BY": {
      "type": "array",
      "items": { "$ref": "#/definitions/FitnessTwin" }
    },
    "MEASURED_AT": { "$ref": "#/definitions/GymTwin" }
  },
  "managingAgent": "Nutrition Agent",
  "dataSources": ["MyRisa", "RisaCare B2C", "Trainer Input"],
  "updateTriggers": ["Progress update", "Milestone reached", "Goal modified", "Target date approached"]
}
```

---

## 4. Integration Flows

### 4.1 MyRisa Body Twin Integration Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MYRISA BODY TWIN FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

[MyRisa:4300] ───► [TwinOS:4142] ───► [RisaCare B2C:4400]
       │                 │                    │
       │                 ▼                    │
       │          ┌──────────────┐             │
       │          │  Biometric   │             │
       │          │  Ingestion   │             │
       │          └──────────────┘             │
       │                 │                    │
       │                 ▼                    │
       │          ┌──────────────────────────────────┐
       │          │     BODY TWIN UPDATE             │
       │          │  • Parse 7-domain data           │
       │          │  • Calculate derived metrics     │
       │          │  • Update vital metrics          │
       │          │  • Store sleep/nutrition data    │
       │          │  • Generate health insights     │
       │          └──────────────────────────────────┘
       │                 │
       │                 ▼
       │          ┌──────────────────────────────────┐
       │          │     RECOMMENDATION ENGINE        │
       │          │  • Analyze current state         │
       │          │  • Compare to goals              │
       │          │  • Generate workout recs        │
       │          │  • Generate nutrition recs      │
       │          │  • Generate recovery recs       │
       │          └──────────────────────────────────┘
       │                 │
       │                 ▼
       │          ┌──────────────────────────────────┐
       │          │     TRAINER MATCHING             │
       │          │  • Match based on goals          │
       │          │  • Match based on body type      │
       │          │  • Match based on preferences    │
       │          │  • Generate trainer suggestions  │
       │          └──────────────────────────────────┘
       │                 │
       ▼                 ▼
  [Progress          [Client
   Dashboard]         Experience]
```

### 4.2 API Endpoints

#### TwinOS API (Port 4142)

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/twin/create` | POST | Create new twin instance | Twin schema | Twin ID + state |
| `/twin/{twinId}` | GET | Retrieve twin state | - | Twin JSON |
| `/twin/{twinId}` | PUT | Update twin attributes | Partial twin | Updated twin |
| `/twin/{twinId}/relate` | POST | Create relationship | Source, target, type | Relationship ID |
| `/twin/{twinId}/query` | POST | Query twin graph | Cypher query | Query results |
| `/twin/bulk` | POST | Bulk twin operations | Array of operations | Results array |
| `/twin/subscribe` | WS | Real-time updates | Twin ID | Stream of changes |

#### MyRisa API (Port 4300)

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/biometrics` | POST | Submit biometric data | Biometric object | Confirmation |
| `/biometrics/{userId}` | GET | Get user biometrics | - | Biometric data |
| `/insights` | GET | Get health insights | User ID | Insight list |
| `/recommendations` | GET | Get recommendations | User ID | Recommendation list |
| `/sync` | POST | Sync wearable data | Device data | Sync status |

#### RisaCare B2C API (Port 4400)

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/clients` | GET | List clients | Filters | Client list |
| `/clients/{id}` | GET | Get client details | - | Client profile |
| `/progress` | GET | Get progress report | Client ID | Progress data |
| `/messages` | POST | Send client message | Message | Delivery status |
| `/bookings` | GET | Get bookings | Client ID | Booking list |

#### REZ Loyalty API (Port 3200)

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/points/balance` | GET | Get points balance | User ID | Balance info |
| `/points/earn` | POST | Earn points | Transaction | Points awarded |
| `/points/redeem` | POST | Redeem points | Redemption | Redemption status |
| `/rewards` | GET | List available rewards | - | Reward list |
| `/tiers` | GET | Get tier status | User ID | Tier info |

#### REZ POS API (Port 3100)

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/transactions` | POST | Create transaction | Transaction | Transaction ID |
| `/transactions/{id}` | GET | Get transaction | - | Transaction details |
| `/revenue` | GET | Get revenue report | Date range | Revenue data |
| `/inventory` | GET | Get inventory status | - | Inventory data |

---

## 5. Agent Definitions

### 5.1 Fitness Assessment Agent

**Purpose**: Conduct comprehensive fitness assessments and establish baseline metrics.

**Capabilities**:
- Initial fitness assessment administration
- Body composition analysis
- Cardiovascular fitness testing
- Flexibility assessment
- Strength baseline establishment
- Goal setting facilitation
- Risk factor identification

**Trigger Events**:
- New member onboarding
- Annual fitness re-assessment
- Goal modification request
- Injury recovery completion
- Training program change

**Actions**:
```
ON assessment_request:
  1. Retrieve or create Body Twin (4142-B1)
  2. Conduct fitness assessment battery
  3. Process body composition data
  4. Calculate fitness metrics (VO2 max, strength levels)
  5. Analyze sleep and recovery data from MyRisa
  6. Evaluate stress markers
  7. Generate baseline report
  8. Facilitate goal setting with Goal Twin creation
  9. Recommend trainer matching
  10. Store assessment in Body Twin history
```

### 5.2 Workout Agent

**Purpose**: Generate personalized workouts, track sessions, and optimize training plans.

**Capabilities**:
- Workout generation based on goals and current fitness
- Exercise selection and progression
- Training periodization
- Recovery recommendation
- Workout logging and tracking
- Performance trend analysis
- Real-time workout adjustments

**Trigger Events**:
- Workout scheduled
- Previous workout completed
- Goal progress check
- Recovery status update
- Trainer recommendation received
- Competition preparation

**Actions**:
```
ON workout_event:
  1. Load Body Twin current state
  2. Load Goal Twin progress
  3. Analyze recent training load
  4. Check recovery metrics from MyRisa
  5. Generate or adjust workout plan
  6. Create Fitness Twin (4142-F1) for session
  7. If trainer assigned → Sync with Trainer Twin
  8. After session → Update Body Twin metrics
  9. Update Goal Twin progress
  10. Generate post-workout recommendations
```

### 5.3 Nutrition Agent

**Purpose**: Generate nutrition recommendations, track dietary intake, and optimize nutrition for goals.

**Capabilities**:
- Calorie and macro calculation based on goals
- Meal planning and recommendations
- Food logging analysis
- Nutritional gap identification
- Hydration tracking
- Supplement recommendations
- Dietary adjustment suggestions

**Trigger Events**:
- Nutrition goal set
- Meal logged
- Weight plateau detected
- Body composition change
- Training load change
- Pre/post competition preparation

**Actions**:
```
ON nutrition_event:
  1. Load Body Twin nutritional targets
  2. Load Goal Twin requirements
  3. Analyze recent dietary intake
  4. Calculate nutritional gaps
  5. Generate meal recommendations
  6. Adjust targets based on training load
  7. If hydration concern → Send reminder
  8. Update Body Twin nutrition metrics
  9. Log dietary adherence to Goal Twin
```

### 5.4 Progress Agent

**Purpose**: Track progress across all goals, generate reports, and trigger interventions.

**Capabilities**:
- Multi-goal progress tracking
- Trend analysis and visualization
- Milestone detection
- Intervention trigger management
- Progress report generation
- Comparative analytics
- Goal trajectory prediction

**Trigger Events**:
- Fitness session completed
- Body metrics updated
- Milestone approached
- Goal deadline approaching
- Plateau detected
- Regression detected
- Weekly/monthly review

**Actions**:
```
ON progress_event:
  1. Aggregate data from all relevant twins
  2. Calculate progress metrics
  3. Compare against goal trajectories
  4. If on track → Generate encouragement
  5. If plateau → Trigger intervention workflow
  6. If regression → Alert trainer and adjust plan
  7. If milestone reached → Generate celebration
  8. Update all affected twins
  9. Generate progress report
  10. Trigger REZ Loyalty rewards if applicable
```

### 5.5 Booking Agent

**Purpose**: Manage class and trainer bookings, optimize scheduling, and handle waitlists.

**Capabilities**:
- Class booking management
- Trainer session scheduling
- Availability optimization
- Waitlist management
- Cancellation handling
- Recurring booking setup
- Conflict resolution

**Trigger Events**:
- Booking request received
- Class slot opened
- Trainer availability changed
- Cancellation received
- Waitlist position reached
- No-show recorded
- Late cancellation

**Actions**:
```
ON booking_event:
  1. Validate booking request
  2. Check availability (Gym Twin, Trainer Twin)
  3. If available → Confirm booking
  4. If waitlist → Add to waitlist
  5. Send confirmation notification
  6. If cancellation → Process and release slot
  7. If no-show → Update attendance records
  8. Sync with REZ POS for payment
  9. Update Gym Twin capacity metrics
  10. Process loyalty points if applicable
```

### 5.6 CRM Agent

**Purpose**: Manage member engagement, segmentation, and campaign orchestration for improved retention and growth.

**Capabilities**:
- Member profiling across all fitness domains
- Segmentation based on engagement patterns
- Campaign orchestration for retention and reactivation
- Churn prediction and prevention
- Visit tracking and analytics
- Personalization for member experience

**Trigger Events**:
- Member check-in recorded
- Goal progress milestone
- Membership renewal approaching
- Engagement drop detected
- New member onboarding complete
- Class attendance pattern change

**Actions**:
```
ON crm_event:
  1. Load Body Twin and Gym Twin for member context
  2. Analyze engagement patterns from visit history
  3. Score churn risk based on activity decline
  4. If high churn risk → Trigger retention campaign
  5. Segment member for targeted communications
  6. Sync profile data to REZ CRM
  7. Update Body Twin with engagement metrics
  8. Trigger loyalty rewards if engagement milestones hit
  9. Generate personalized workout/nutrition nudges
```

---

## 6. Business Copilot Queries

The REZ Business Copilot provides natural language access to Fitness OS data through TwinOS.

### 6.1 Member Analytics Queries

```
User: "Show me all members who haven't visited in the last 14 days"
Copilot → TwinOS Query:
  MATCH (b:BodyTwin)-[:VISITS]->(g:GymTwin)
  WHERE b.lastVisit < date() - duration('P14D')
  RETURN b.fullName, b.email, b.lastVisit
  ORDER BY b.lastVisit

User: "Which members are closest to achieving their weight loss goals?"
Copilot → TwinOS Query:
  MATCH (b:BodyTwin)-[:HAS_GOAL]->(g:GoalTwin {goalType: "Weight Loss", status: "Active"})
  WHERE g.progressPercentage >= 80
  RETURN b.fullName, g.title, g.progressPercentage, g.targetDate
  ORDER BY g.progressPercentage DESC

User: "What's the average body fat percentage by age group?"
Copilot → TwinOS Aggregation:
  MATCH (b:BodyTwin)
  WHERE b.bodyComposition.bodyFatPercentage IS NOT NULL
  RETURN 
    CASE 
      WHEN date().year - date(b.dateOfBirth).year < 30 THEN "Under 30"
      WHEN date().year - date(b.dateOfBirth).year < 40 THEN "30-39"
      WHEN date().year - date(b.dateOfBirth).year < 50 THEN "40-49"
      ELSE "50+"
    END as ageGroup,
    avg(b.bodyComposition.bodyFatPercentage) as avgBodyFat
  ORDER BY ageGroup
```

### 6.2 Trainer Performance Queries

```
User: "Show me trainers ranked by client goal achievement rate"
Copilot → TwinOS Query:
  MATCH (t:TrainerTwin)
  WHERE t.performanceMetrics.goalAchievementRate IS NOT NULL
  RETURN t.fullName, t.specializations, t.performanceMetrics.goalAchievementRate,
         t.performanceMetrics.clientSatisfaction
  ORDER BY t.performanceMetrics.goalAchievementRate DESC

User: "Which trainers have availability for new clients?"
Copilot → TwinOS Query:
  MATCH (t:TrainerTwin)
  WHERE t.availability.currentClients < t.availability.maxClients
  RETURN t.fullName, t.specializations, t.availability.currentClients,
         t.availability.maxClients - t.availability.currentClients as availableSlots

User: "Show me trainer session history for the past month"
Copilot → TwinOS Query:
  MATCH (t:TrainerTwin)-[:GUIDES]->(f:FitnessTwin)
  WHERE f.sessionDate >= date() - duration('P30D')
  RETURN t.fullName, count(f) as sessions, sum(f.duration) as totalMinutes
  ORDER BY sessions DESC
```

### 6.3 Gym Operations Queries

```
User: "Which gyms are at peak capacity right now?"
Copilot → TwinOS Query:
  MATCH (g:GymTwin)
  WHERE g.capacity.currentMembers >= g.capacity.peakOccupancy * 0.9
  RETURN g.gymName, g.address.city, g.capacity.currentMembers,
         g.capacity.maxMembers, (g.capacity.currentMembers * 100.0 / g.capacity.maxMembers) as occupancyRate

User: "Show me equipment maintenance needs across all gyms"
Copilot → TwinOS Query:
  MATCH (g:GymTwin)
  UNWIND g.equipment as eq
  WHERE eq.condition IN ["Fair", "Needs Replacement"]
  RETURN g.gymName, eq.name, eq.quantity, eq.condition
  ORDER BY eq.condition, g.gymName

User: "What's the PT revenue breakdown by gym this month?"
Copilot → TwinOS Aggregation:
  MATCH (g:GymTwin)
  RETURN g.gymName, g.performanceMetrics.ptRevenue
  ORDER BY g.performanceMetrics.ptRevenue DESC
```

### 6.4 Goal Progress Queries

```
User: "Show me all active goals with less than 50% progress"
Copilot → TwinOS Query:
  MATCH (g:GoalTwin {status: "Active"})
  WHERE g.progressPercentage < 50
  RETURN g.title, g.goalType, g.progressPercentage, g.targetDate
  ORDER BY g.targetDate

User: "Which members have abandoned their goals in the last 90 days?"
Copilot → TwinOS Query:
  MATCH (g:GoalTwin {status: "Abandoned"})
  WHERE g.createdDate >= date() - duration('P90D')
  MATCH (b:BodyTwin)-[:HAS_GOAL]->(g)
  RETURN b.fullName, g.title, g.goalType, g.createdDate

User: "Show me goal achievement rates by goal type"
Copilot → TwinOS Aggregation:
  MATCH (g:GoalTwin)
  RETURN g.goalType,
         count(CASE WHEN g.status = "Completed" THEN 1 END) as completed,
         count(CASE WHEN g.status = "Active" THEN 1 END) as active,
         count(CASE WHEN g.status = "Abandoned" THEN 1 END) as abandoned,
         count(CASE WHEN g.status = "Completed" THEN 1 END) * 100.0 / count(g) as achievementRate
  ORDER BY achievementRate DESC
```

### 6.5 Loyalty and Engagement Queries

```
User: "Which members have earned the most loyalty points this quarter?"
Copilot → TwinOS Query:
  MATCH (b:BodyTwin)-[:VISITS]->(g:GymTwin)
  WHERE b.loyaltyPoints IS NOT NULL
  RETURN b.fullName, b.loyaltyPoints, b.tier
  ORDER BY b.loyaltyPoints DESC
  LIMIT 20

User: "Show me member retention by gym location"
Copilot → TwinOS Aggregation:
  MATCH (g:GymTwin)
  RETURN g.gymName, g.address.city, g.performanceMetrics.memberRetention
  ORDER BY g.performanceMetrics.memberRetention DESC

User: "Which members are eligible for tier upgrade?"
Copilot → TwinOS Query:
  MATCH (b:BodyTwin)
  WHERE b.loyaltyPoints >= 5000 AND b.tier = "Silver"
  RETURN b.fullName, b.loyaltyPoints, b.tier
```

---

## 7. Economic Integration

### 7.1 Revenue Model

| Revenue Stream | Calculation | Twin Attribution |
|---------------|-------------|------------------|
| Membership Dues | Per-member monthly fee | Body Twin membership records |
| Personal Training | Per-session rate × sessions | Trainer Twin booking records |
| Class Revenue | Per-class fee × attendance | Fitness Twin class sessions |
| Retail Sales | Product margin × sales | REZ POS transactions |
| Nutrition Plans | Subscription fee | Nutrition Agent subscriptions |
| Assessment Fees | Per-assessment fee | Fitness Assessment Agent |
| Loyalty Redemption | Points redeemed value | REZ Loyalty redemptions |

### 7.2 Cost Attribution

| Cost Center | Attribution Method | Twin Correlation |
|-------------|-------------------|------------------|
| AI/ML Processing | API call count per twin type | Twin operation volume |
| Wearable Integration | Device sync count | Body Twin sync events |
| Trainer Commissions | PT revenue share | Trainer Twin performance |
| Equipment Depreciation | Usage hours per gym | Gym Twin equipment |
| Loyalty Rewards | Points value redeemed | REZ Loyalty transactions |

### 7.3 Pricing Tiers

| Tier | Capabilities | Monthly Price |
|------|--------------|---------------|
| Basic | Body Twin, MyRisa access, basic tracking | $19.99/mo |
| Premium | Full twin suite, trainer matching, nutrition | $49.99/mo |
| Elite | All features, unlimited PT sessions, VIP access | $149.99/mo |

---

## 8. Implementation Roadmap

### Week 1-2: Foundation

| Day | Task | Deliverable |
|-----|------|-------------|
| 1-2 | Environment setup | Dev environment configured |
| 3-4 | TwinOS core deployment | TwinOS running on port 4142 |
| 5-7 | Schema implementation | All 5 twin schemas validated |
| 8-10 | MyRisa integration | MyRisa connected to TwinOS |
| 11-14 | Basic API endpoints | CRUD operations functional |

**Milestone**: Basic twin creation and relationship management operational.

### Week 3-4: Agent Development

| Day | Task | Deliverable |
|-----|------|-------------|
| 15-17 | Fitness Assessment Agent | Agent deployed, assessments functional |
| 18-20 | Workout Agent | Agent deployed, workout generation |
| 21-23 | Nutrition Agent | Agent deployed, nutrition recommendations |
| 24-26 | Progress Agent | Agent deployed, progress tracking |
| 27-28 | Booking Agent | Agent deployed, booking management |

**Milestone**: All 5 agents operational and connected to twins.

### Week 5: Integration & Testing

| Day | Task | Deliverable |
|-----|------|-------------|
| 29-31 | End-to-end flow testing | MyRisa to Body Twin flow complete |
| 32-33 | API security audit | All endpoints secured |
| 34-35 | Performance testing | Load testing complete |
| 36-37 | Data migration prep | Migration scripts validated |
| 38 | Staging deployment | Staging environment operational |

**Milestone**: Full integration tested and staged for production.

### Week 6: Go-Live Preparation

| Day | Task | Deliverable |
|-----|------|-------------|
| 39-40 | Production deployment | Production environment live |
| 41-42 | REZ Loyalty integration | Loyalty system connected |
| 43 | User acceptance testing | Stakeholder sign-off |
| 44 | Training documentation | User guides completed |
| 45 | Go-live | System operational |
| 46-47 | Hypercare support | 24/7 support for 48 hours |
| 48 | Project closure | Documentation, lessons learned |

**Milestone**: Fitness OS fully operational with all integrations live.

---

## Appendix A: Port Reference

| Service | Port | Protocol |
|---------|------|----------|
| MyRisa | 4300 | HTTP/REST |
| RisaCare B2C | 4400 | HTTP/REST |
| REZ Loyalty | 3200 | HTTP/REST |
| REZ POS | 3100 | HTTP/REST |
| TwinOS | 4142 | HTTP/REST + WebSocket |

## Appendix B: Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| FIT-001 | Twin creation failed | Check schema validity |
| FIT-002 | Biometric sync failed | Retry with exponential backoff |
| FIT-003 | Booking conflict | Find alternative slot |
| FIT-004 | Trainer unavailable | Match alternative trainer |
| FIT-005 | Goal validation failed | Verify goal parameters |

---

*Document Version: 1.0*
*Last Updated: June 2026*
*Owner: Fitness OS Integration Team*

# RisaCare Wellness Service

**Health and Wellness Tracking**

Service for tracking wellness metrics, activity, nutrition, sleep, and overall health indicators.

## Overview

RisaCare Wellness Service provides:
- Activity and step tracking
- Sleep analysis
- Nutrition logging
- Water intake tracking
- Stress level monitoring
- Wellness scores and insights

## Features

### Activity Tracking
- Step count
- Distance walked
- Calories burned
- Active minutes
- Exercise sessions

### Sleep Analysis
- Sleep duration
- Sleep stages
- Sleep quality score
- Bedtime/wake time
- Sleep disturbances

### Nutrition
- Food logging
- Calorie tracking
- Macro tracking (protein, carbs, fat)
- Meal planning
- Nutrition goals

### Hydration
- Water intake logging
- Daily goals
- Reminders
- Hydration trends

### Wellness Score
- Daily wellness score
- Weekly trends
- Score factors
- Improvement suggestions

## Quick Start

```bash
cd risa-care-wellness-service
npm install
npm run dev
```

Service runs on **port 4703**.

## API Endpoints

### Activity
```
POST /api/activity                        - Log activity
GET  /api/activity/:userId              - Get activity data
GET  /api/activity/:userId/summary       - Get daily summary
GET  /api/activity/:userId/trends       - Get trends
```

### Sleep
```
POST /api/sleep                           - Log sleep
GET  /api/sleep/:userId                 - Get sleep data
GET  /api/sleep/:userId/analysis        - Get sleep analysis
```

### Nutrition
```
POST /api/nutrition                       - Log meal
GET  /api/nutrition/:userId             - Get nutrition data
GET  /api/nutrition/:userId/goals       - Get nutrition goals
PUT  /api/nutrition/:userId/goals       - Update goals
```

### Hydration
```
POST /api/hydration                       - Log water intake
GET  /api/hydration/:userId             - Get hydration data
GET  /api/hydration/:userId/summary     - Get daily summary
```

### Wellness Score
```
GET  /api/wellness/:userId/score        - Get current score
GET  /api/wellness/:userId/insights    - Get insights
```

## Usage Examples

### Log Activity
```bash
curl -X POST http://localhost:4703/api/activity \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "type": "walk",
    "steps": 10000,
    "distance": 8.5,
    "duration": 60,
    "caloriesBurned": 350,
    "date": "2024-01-20"
  }'
```

### Log Sleep
```bash
curl -X POST http://localhost:4703/api/sleep \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "bedtime": "2024-01-20T22:30:00Z",
    "wakeTime": "2024-01-21T06:30:00Z",
    "quality": 85,
    "deepSleep": 120,
    "lightSleep": 240,
    "remSleep": 90
  }'
```

### Log Meal
```bash
curl -X POST http://localhost:4703/api/nutrition \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "mealType": "lunch",
    "foods": [
      {"name": "Brown Rice", "calories": 220, "protein": 5, "carbs": 45, "fat": 2},
      {"name": "Grilled Chicken", "calories": 300, "protein": 35, "carbs": 0, "fat": 8}
    ],
    "totalCalories": 520,
    "date": "2024-01-20T13:00:00Z"
  }'
```

## Activity Types

| Type | Units |
|------|-------|
| walk | steps, distance, duration |
| run | steps, distance, duration, pace |
| swim | duration, laps, distance |
| cycle | duration, distance, speed |
| gym | duration, calories |
| yoga | duration, type |
| other | duration, description |

## Wellness Score Factors

| Factor | Weight |
|--------|--------|
| Sleep Quality | 25% |
| Activity Level | 25% |
| Nutrition | 20% |
| Hydration | 15% |
| Stress Level | 15% |

## Integration

Integrates with:
- RisaCare API Gateway (4700)
- RisaCare Profile Service (4701)
- RisaCare Nutrition Service (4725)
- RisaCare Sleep Service (4729)
- Wearable devices (future)

## Port Configuration

| Service | Port |
|---------|------|
| Wellness Service | 4703 |

## License

Proprietary - RTNM Group

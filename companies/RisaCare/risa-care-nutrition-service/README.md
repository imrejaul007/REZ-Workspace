# RisaCare Nutrition Service

**AI-Powered Diet Planning and Calorie Tracking**

A comprehensive nutrition management service for RisaCare Healthcare OS.

## Overview

RisaCare Nutrition Service helps users:
- Track daily calorie and macro intake
- Create personalized diet plans based on goals
- Search a database of foods with nutritional information
- Get AI-powered meal suggestions
- Monitor weekly nutrition trends

## Features

### Food Database
- Search foods by name or category
- Track calories, protein, carbs, fat, and fiber
- Custom food entry support
- Allergen information

### Meal Logging
- Log meals by type (breakfast, lunch, dinner, snack)
- Track daily nutrition totals
- View macro breakdowns
- Log water/hydration intake

### Diet Planning
- Goal-based diet plans (weight loss, muscle building, diabetic, etc.)
- AI-generated meal suggestions
- Macro target calculation
- Dietary restriction handling

### Analytics
- Daily nutrition summary
- Weekly trends tracking
- Macro breakdown visualization
- Goal progress monitoring

## Quick Start

```bash
cd risa-care-nutrition-service
npm install
npm run dev
```

Service runs on **port 4725**.

## API Endpoints

### Health Check
```
GET /health
```

### Food Database
```
GET  /foods              - List all foods
GET  /foods/search?q=    - Search foods
GET  /foods/:id           - Get food details
POST /foods               - Add custom food
```

### Meal Logging
```
POST /meals/log           - Log a meal
GET  /meals/daily         - Get daily log
GET  /meals/summary       - Get nutrition summary
GET  /meals/weekly        - Get weekly trends
GET  /meals/macros        - Get macro breakdown
```

### Diet Plans
```
POST /diet-plans          - Create diet plan
GET  /diet-plans/active   - Get active plan
GET  /diet-plans/:id      - Get plan by ID
GET  /diet-plans/recommendations - Get AI recommendations
GET  /diet-plans/suggestions - Get meal suggestions
```

### Hydration
```
POST /hydration           - Log water intake
```

### Recipes
```
GET  /recipes/search     - Search recipes
GET  /recipes/:id        - Get recipe details
```

## Usage Examples

### Log a Meal
```bash
curl -X POST http://localhost:4725/meals/log \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "date": "2026-06-02",
    "type": "breakfast",
    "foods": [{"foodId": "food-1", "quantity": 1}],
    "time": "08:30"
  }'
```

### Get Nutrition Summary
```bash
curl "http://localhost:4725/meals/summary?userId=user-123&date=2026-06-02"
```

### Create Diet Plan
```bash
curl -X POST http://localhost:4725/diet-plans \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "goal": "weight_loss",
    "targetCalories": 1800,
    "restrictions": ["no-gluten"]
  }'
```

## Diet Goals

| Goal | Description |
|------|-------------|
| weight_loss | Calorie deficit for fat loss |
| weight_gain | Calorie surplus for bulk |
| maintenance | Maintain current weight |
| muscle_building | High protein for muscle growth |
| diabetic | Low GI, stable blood sugar |
| heart_healthy | Low sodium, heart-friendly |

## Macro Ratios by Goal

| Goal | Protein | Carbs | Fat |
|------|---------|-------|-----|
| weight_loss | 35% | 35% | 30% |
| muscle_building | 40% | 40% | 20% |
| maintenance | 30% | 40% | 30% |
| diabetic | 30% | 35% | 35% |

## Architecture

```
risa-care-nutrition-service/
├── src/
│   ├── index.ts              # Express server entry
│   ├── models/
│   │   └── nutrition.ts     # Types & in-memory DB
│   └── services/
│       ├── dietPlanService.ts  # Diet plan logic
│       └── services.ts        # Additional services
├── package.json
├── tsconfig.json
└── README.md
```

## Integration

Integrates with:
- RisaCare Core (4700-4708)
- RisaCare Profile Service for user data
- RABTUL Auth for authentication

## Port Configuration

| Service | Port |
|---------|------|
| Nutrition Service | 4725 |

## License

Proprietary - RTNM Group

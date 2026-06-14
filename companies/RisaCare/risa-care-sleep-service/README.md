# RisaCare Sleep Service

**AI-Powered Sleep Tracking and Analysis**

A comprehensive sleep management service for RisaCare Healthcare OS.

## Overview

RisaCare Sleep Service helps users:
- Track sleep patterns and quality
- Set and monitor sleep goals
- Analyze sleep factors
- Get AI-powered improvement recommendations
- Detect potential sleep disorders

## Features

### Sleep Tracking
- Log sleep with bedtime and wake time
- Track sleep quality (1-10 scale)
- Record sleep stages (light, deep, REM)
- Track awakenings during night
- Monitor sleep efficiency

### Sleep Analysis
- Pattern recognition over time
- Weekly summaries
- Sleep stage analysis
- Goal comparison
- Trend visualization

### Sleep Goals
- Set target sleep duration
- Define ideal bedtime and wake time
- Track goal progress
- Weekly/monthly goal adherence

### Factor Analysis
- Track factors affecting sleep (caffeine, exercise, stress, etc.)
- Correlation analysis between factors and sleep quality
- Daily factor summaries
- Impact visualization

### Recommendations
- AI-powered sleep tips
- Personalized bedtime suggestions
- Sleep hygiene scoring
- Improvement action plans

### Disorder Detection
- Early indicators for common sleep disorders
- Insomnia, sleep apnea, restless leg syndrome detection
- Severity assessment
- Professional consultation suggestions

## Quick Start

```bash
cd risa-care-sleep-service
npm install
npm run dev
```

Service runs on **port 4729**.

## API Endpoints

### Sleep Tracking
```
POST /api/sleep                    - Log sleep
GET  /api/sleep/:userId/:date     - Get sleep record
GET  /api/sleep/:userId/history   - Get sleep history
GET  /api/sleep/:userId/analysis   - Get comprehensive analysis
GET  /api/sleep/:userId/patterns   - Get sleep patterns
GET  /api/sleep/:userId/trend      - Get trend data
GET  /api/sleep/:userId/efficiency - Get sleep efficiency
```

### Sleep Goals
```
POST /api/goals                    - Set sleep goal
GET  /api/goals/:userId           - Get user's goal
PUT  /api/goals/:goalId           - Update goal
GET  /api/goals/:userId/progress  - Get goal progress
DELETE /api/goals/:goalId          - Delete goal
```

### Insights
```
GET  /api/insights/:userId          - Get insights
GET  /api/insights/:userId/disorders - Get disorder indicators
```

### Recommendations
```
GET  /api/recommendations/:userId       - Get recommendations
GET  /api/recommendations/:userId/bedtime - Get bedtime suggestion
GET  /api/recommendations/:userId/hygiene-score - Get hygiene score
GET  /api/recommendations/tips            - Get sleep tips
```

### Sleep Factors
```
POST /api/factors                     - Log a sleep factor
GET  /api/factors/:userId             - Get all factors
GET  /api/factors/:userId/impact      - Get factor impact analysis
GET  /api/factors/:userId/:type       - Get factors by type
GET  /api/factors/:userId/daily/:date - Get daily summary
DELETE /api/factors/:factorId          - Delete factor
```

### Disorders
```
GET  /api/disorders/:userId       - Get user's disorders
POST /api/disorders              - Add a disorder
PUT  /api/disorders/:disorderId  - Update disorder
DELETE /api/disorders/:disorderId - Delete disorder
```

## Usage Examples

### Log Sleep
```bash
curl -X POST http://localhost:4729/api/sleep \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "date": "2026-06-02",
    "bedtime": "23:00",
    "wakeTime": "07:00",
    "quality": 8,
    "deepSleep": 2.5,
    "lightSleep": 3,
    "remSleep": 1.5,
    "awakenings": 1
  }'
```

### Get Sleep Analysis
```bash
curl "http://localhost:4729/api/sleep/user-123/analysis?days=30"
```

### Set Sleep Goal
```bash
curl -X POST http://localhost:4729/api/goals \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "targetDuration": 8,
    "targetBedtime": "23:00",
    "targetWakeTime": "07:00",
    "days": [0, 1, 2, 3, 4, 5, 6]
  }'
```

### Log Sleep Factor
```bash
curl -X POST http://localhost:4729/api/factors \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "date": "2026-06-02",
    "type": "caffeine",
    "impact": "negative",
    "notes": "2 cups of coffee after 4pm"
  }'
```

## Sleep Stages

| Stage | Description |
|-------|-------------|
| awake | Periods of wakefulness during sleep |
| light | Light sleep, easy to wake |
| deep | Deep sleep, restorative |
| rem | REM sleep, dreaming occurs |

## Sleep Factors

| Factor | Impact |
|--------|--------|
| caffeine | Late caffeine affects sleep onset |
| exercise | Regular exercise improves sleep |
| screen_time | Blue light disrupts melatonin |
| stress | High stress reduces sleep quality |
| meals | Late eating affects sleep |
| alcohol | Affects REM sleep and causes awakenings |

## Sleep Quality Score

Quality is rated 1-10:
- 8-10: Excellent
- 6-7: Good
- 4-5: Fair
- 1-3: Poor

## Architecture

```
risa-care-sleep-service/
├── src/
│   ├── index.ts                    # Express server entry
│   ├── models/
│   │   └── sleep.ts               # Types & in-memory DB
│   ├── routes/
│   │   └── sleepRoutes.ts         # Express routes
│   └── services/
│       ├── sleepTrackingService.ts     # Sleep tracking
│       ├── sleepAnalysisService.ts     # Pattern analysis
│       ├── sleepGoalService.ts        # Goal management
│       ├── sleepImprovementService.ts # Recommendations
│       └── factorAnalysisService.ts    # Factor correlation
├── package.json
├── tsconfig.json
└── README.md
```

## Integration

Integrates with:
- RisaCare Core (4700-4708)
- RisaCare Chronic Care for sleep-affected conditions
- RABTUL Auth for authentication

## Port Configuration

| Service | Port |
|---------|------|
| Sleep Service | 4729 |

## License

Proprietary - RTNM Group

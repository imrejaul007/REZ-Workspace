# RisaCare Mental Health Service

A comprehensive mental health support service providing therapy, counseling, mood tracking, support groups, crisis intervention, and self-harm safety planning.

**Port:** 4722  
**Company:** RisaCare (Healthcare vertical under RTNM Group)  
**Part of:** REZ Ecosystem

## Features

### 1. Mood Tracking & Insights
- Log daily mood entries (1-10 scale for mood, energy, anxiety, sleep, stress)
- Track triggers and activities
- Generate personalized insights and trends
- Identify patterns and correlations

### 2. Therapy & Counseling
- Browse certified counselors and therapists
- Filter by specialization, language, rating, and price
- Book individual, group, couples, or family sessions
- Track homework and session notes
- Rate and review sessions

### 3. Support Groups
- Join peer support groups by type (anxiety, depression, grief, addiction, etc.)
- View upcoming group sessions
- Connect with others who understand your journey

### 4. Crisis Support
- Create personalized crisis plans
- Trigger emergency alerts with resources
- Access breathing exercises and grounding techniques
- 24/7 helpline information (India-focused)

### 5. Self-Harm Safety Planning
- Log incidents securely
- Generate personalized safety plans
- Track coping strategies effectiveness
- Get immediate crisis resources

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The service will be available at `http://localhost:4722`

## API Endpoints

### Mood Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mood` | Log a mood entry |
| GET | `/api/mood/:userId` | Get mood history |
| GET | `/api/mood/:userId/trends` | Get mood trends (day/week/month/year) |
| GET | `/api/mood/:userId/triggers` | Get common triggers |
| GET | `/api/mood/:userId/insights` | Get personalized insights |

### Counselors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/counselors` | List counselors (with filters) |
| GET | `/api/counselors/:id` | Get counselor details |

### Therapy Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions` | Book a session |
| GET | `/api/sessions/:userId` | Get user's sessions |
| GET | `/api/sessions/:userId/upcoming` | Get upcoming sessions |
| GET | `/api/sessions/:userId/homework` | Get homework assignments |
| PUT | `/api/sessions/:sessionId/complete` | Complete a session |
| PUT | `/api/sessions/:sessionId/cancel` | Cancel a session |

### Support Groups

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/groups` | List support groups |
| GET | `/api/groups/:groupId` | Get group details |
| POST | `/api/groups/:groupId/join` | Join a group |
| POST | `/api/groups/:groupId/leave` | Leave a group |
| GET | `/api/groups/:groupId/sessions` | Get group sessions |
| GET | `/api/groups/:groupId/members` | Get group members |
| GET | `/api/groups/user/:userId` | Get user's groups |

### Crisis Support

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/crisis-plan` | Create crisis plan |
| GET | `/api/crisis-plan/:userId` | Get crisis plan |
| PUT | `/api/crisis-plan/:userId` | Update crisis plan |
| POST | `/api/crisis/alert` | Trigger crisis alert |
| GET | `/api/crisis/resources` | Get crisis resources |
| GET | `/api/crisis/safety-tips` | Get safety tips |
| GET | `/api/crisis/breathing-exercises` | Get breathing exercises |
| GET | `/api/crisis/grounding-techniques` | Get grounding techniques |

### Self-Harm Support

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/self-harm/log` | Log an incident |
| GET | `/api/self-harm/:userId` | Get incident history |
| GET | `/api/self-harm/:userId/safety-plan` | Get personalized safety plan |
| POST | `/api/self-harm/:userId/mark-safe` | Mark as safe |
| GET | `/api/self-harm/:userId/statistics` | Get statistics |
| GET | `/api/self-harm/resources` | Get crisis resources |

### Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile/:userId` | Get mental health profile |
| PUT | `/api/profile/:userId` | Update profile |

## Example Requests

### Log Mood Entry

```bash
curl -X POST http://localhost:4722/api/mood \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "mood": 7,
    "energy": 6,
    "anxiety": 4,
    "sleep": 8,
    "stress": 3,
    "triggers": ["work", "sleep"],
    "activities": ["exercise", "meditation"],
    "exerciseDone": true
  }'
```

### Book Therapy Session

```bash
curl -X POST http://localhost:4722/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "providerId": "counselor-1",
    "type": "individual",
    "therapyType": "cognitive_behavioral",
    "date": "2026-06-15T10:00:00Z"
  }'
```

### Trigger Crisis Alert

```bash
curl -X POST http://localhost:4722/api/crisis/alert \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "type": "immediate",
    "severity": "critical",
    "reason": "Feeling unsafe, need immediate support"
  }'
```

## Data Models

### Mood Entry
```typescript
{
  userId: string;
  date: Date;
  mood: number;        // 1-10
  energy: number;       // 1-10
  anxiety: number;      // 1-10
  sleep: number;        // 1-10
  stress: number;       // 1-10
  notes?: string;
  triggers: string[];
  activities: string[];
  medicationTaken: boolean;
  exerciseDone: boolean;
  socialInteraction: boolean;
}
```

### Crisis Plan
```typescript
{
  userId: string;
  emergencyContacts: {
    name: string;
    relationship: string;
    phone: string;
    isPrimary: boolean;
  }[];
  warningSigns: string[];
  copingStrategies: string[];
  reasonsToLive: string[];
  safePlaces: string[];
  personalStatement?: string;
  professionalContacts?: {
    name: string;
    phone: string;
    notes?: string;
  }[];
}
```

## India Crisis Helplines (Built-in)

- **iCall (TISS):** 9152987821 (Mon-Sat, 8am-10pm)
- **Vandrevala Foundation:** 1860-2662-345 (24/7)
- **NIMHANS:** +91-80-4611 0000 (24/7)
- **COOJ Mental Health:** 0832-2548449 (24/7)
- **Roshni Trust:** 040-6620 2000 (24/7)
- **Emergency:** 112

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Validation:** Zod
- **Unique IDs:** UUID

## Project Structure

```
risa-care-mental-health-service/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── models/
│   │   └── mentalHealth.ts      # TypeScript interfaces & Zod schemas
│   ├── services/
│   │   ├── moodTrackingService.ts
│   │   ├── therapyService.ts
│   │   ├── supportGroupService.ts
│   │   ├── crisisService.ts
│   │   └── selfHarmService.ts
│   └── routes/
│       └── mentalHealthRoutes.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Production Considerations

1. **Database:** Currently uses in-memory storage. For production, integrate with PostgreSQL or MongoDB.

2. **Authentication:** Add JWT authentication middleware for protected routes.

3. **Rate Limiting:** Implement rate limiting on sensitive endpoints.

4. **Logging:** Add structured logging (e.g., Winston or Pino).

5. **Monitoring:** Add health checks and metrics for production deployment.

6. **Security:**
   - Validate all inputs with Zod
   - Sanitize user data
   - Use HTTPS in production
   - Implement CORS policies

7. **Compliance:**
   - HIPAA considerations for mental health data
   - Data encryption at rest
   - Audit logging for sensitive operations

## Related Services

- **RisaCare Core:** Main healthcare platform
- **RABTUL Auth:** Authentication service (Port 4002)
- **RABTUL Notifications:** Notifications service (Port 4011)

## License

Part of RTNM Group / RisaCare - All rights reserved.

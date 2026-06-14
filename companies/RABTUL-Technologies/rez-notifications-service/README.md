# ReZ Notifications Service

Unified notification service supporting push, SMS, email, WhatsApp, and in-app notifications.

## Tech Stack

- **Queue:** BullMQ (Redis-backed)
- **Cache:** Redis (ioredis)
- **Templates:** Handlebars
- **Email:** Nodemailer
- **SMS:** Twilio
- **Push:** Firebase Admin
- **Logging:** Winston, Pino
- **Error Tracking:** Sentry

## Environment Variables

```env
# Redis (required for BullMQ)
REDIS_URL=redis://localhost:6379

# Twilio (for SMS/WhatsApp)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Email (Nodemailer)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

# Firebase (for Push)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Sentry
SENTRY_DSN=
```

## API Endpoints

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/notifications/send` | Send notification |
| GET | `/api/v1/notifications/:userId` | Get user notifications |
| PUT | `/api/v1/notifications/:notificationId/read` | Mark as read |
| PUT | `/api/v1/notifications/:userId/read-all` | Mark all as read |
| GET | `/api/v1/notifications/:userId/unread-count` | Get unread count |
| DELETE | `/api/v1/notifications/:notificationId` | Delete notification |

### Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/templates` | List all templates |
| GET | `/api/v1/templates/:templateId` | Get template details |
| POST | `/api/v1/templates/:templateId/render` | Render template with variables |

### Subscribers
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/subscribers` | Register subscriber |
| GET | `/api/v1/subscribers/:userId` | Get subscriber preferences |
| PUT | `/api/v1/subscribers/:userId` | Update preferences |
| DELETE | `/api/v1/subscribers/:userId` | Unsubscribe |

## Available Templates

| Template ID | Description | Variables |
|-------------|-------------|-----------|
| `streak_milestone` | Streak achievement notification | streakDays, rewardCoins, nextMilestone |
| `tier_upgrade` | Loyalty tier upgrade | oldTier, newTier, benefits |
| `badge_earned` | Gamification badge earned | badgeName, badgeDescription, rewardCoins |
| `points_expiry` | Points expiring reminder | points, daysRemaining, expiryDate |
| `churn_risk` | Win-back campaign | offer, discount, expiryDate |
| `referral_signup` | Referral signup notification | friendName, rewardCoins |

## Local Setup

### Prerequisites
- Node.js 20+
- Redis server

### Installation

```bash
cd rez-notifications-service

npm install

cp .env.example .env
```

### Running Locally

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Testing

```bash
npm test
```

## Usage Example

```typescript
import { NotificationService } from '@rez/notifications-service';

// Send a notification
await notificationService.send({
  userId: 'user_123',
  channel: 'email',
  type: 'order_confirmation',
  template: 'order_confirmation',
  data: {
    orderId: 'ORD-456',
    total: 99.99,
    items: 3
  }
});
```

## Rate Limits

| Channel | Limit | Window |
|---------|-------|--------|
| Push | 100/minute | 60 seconds |
| SMS | 10/hour | 3600 seconds |
| Email | 50/hour | 3600 seconds |
| WhatsApp | 20/hour | 3600 seconds |
| In-App | 200/minute | 60 seconds |

## License

MIT

# REZ Gym Service

REZ Gym OS - Core gym and fitness center management

**Port:** 4300

## Features

- **Membership Management**: Comprehensive membership tiers and plans
- **Class Scheduling**: Create and manage gym classes
- **Trainer Management**: Track trainer profiles and schedules
- **Equipment Tracking**: Monitor gym equipment and maintenance
- **Payment Processing**: Handle membership payments and renewals
- **Access Control**: QR code-based gym access
- **Analytics Dashboard**: Real-time gym insights

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/memberships | List memberships |
| POST | /api/memberships | Create membership |
| GET | /api/classes | List gym classes |
| POST | /api/classes | Create class |
| GET | /api/trainers | List trainers |
| POST | /api/trainers | Add trainer |

## Quick Start

```bash
npm install
npm run dev
```

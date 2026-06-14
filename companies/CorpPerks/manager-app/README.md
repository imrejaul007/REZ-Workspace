# CorpPerks Manager Mobile App

Complete team management solution for managers on the go - handle attendance, leave, performance, and 1:1 meetings from your mobile device.

## Features

### Dashboard
- Team overview with real-time attendance
- Pending approvals summary
- Upcoming meetings
- Recent activity feed
- Quick actions for common tasks

### Team Management
- View all team members
- Team member details with performance scores
- Filter by status (Active, On Leave, Probation)
- Search functionality

### Attendance
- Today's attendance overview
- Weekly/monthly attendance summary
- Attendance correction requests
- Team member attendance details
- GPS and QR code check-in support

### Leave Management
- Pending leave requests
- Leave approval workflow
- Leave balance tracking
- Calendar view
- Bulk actions

### Performance
- Team performance overview
- OKR tracking and progress
- Performance reviews (multi-step wizard)
- Promotion readiness assessment
- 360 feedback

### 1:1 Meetings
- Schedule new meetings
- Meeting templates
- Action items tracking
- Meeting history
- Follow-up reminders

### Reports
- Attendance reports
- Leave reports
- Performance reports
- Team overview reports
- Export to PDF/Excel/CSV

## Tech Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tabs + Native Stack)
- **State Management**: Zustand
- **HTTP Client**: Fetch API
- **Styling**: StyleSheet with custom design system

## Project Structure

```
manager-app/
├── app/
│   ├── index.tsx                 # Dashboard
│   ├── team/
│   │   ├── index.tsx             # Team list
│   │   └── [id].tsx             # Team member detail
│   ├── attendance/
│   │   ├── index.tsx            # Attendance overview
│   │   └── review.tsx           # Attendance review
│   ├── leave/
│   │   ├── index.tsx            # Leave management
│   │   └── approve.tsx          # Leave approvals
│   ├── performance/
│   │   ├── index.tsx            # Performance overview
│   │   └── review.tsx           # Performance review
│   ├── 1on1/
│   │   ├── index.tsx            # 1:1 meetings
│   │   └── schedule.tsx         # Schedule meeting
│   └── reports/
│       └── index.tsx            # Reports
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── ListItem.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── StatCard.tsx
│   │   └── EmptyState.tsx
│   ├── services/
│   │   └── api.ts               # API service with mock data
│   ├── store/
│   │   └── index.ts             # Zustand store
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── utils/
│   │   └── theme.ts             # Design system tokens
│   └── navigation/
│       └── AppNavigator.tsx     # Navigation configuration
├── App.tsx                       # App entry point
├── app.json                      # Expo configuration
├── package.json
└── tsconfig.json
```

## Design System

### Colors
- Primary: Purple (#8B5CF6)
- Secondary: Indigo (#6366F1)
- Success: Green (#22C55E)
- Warning: Amber (#F59E0B)
- Error: Red (#EF4444)

### Typography
- Font sizes: 10, 12, 14, 16, 18, 24, 32px
- Font weights: 400, 500, 600, 700

## Getting Started

```bash
# Install dependencies
cd manager-app
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## API Integration

The app uses mock data for development. To connect to a real backend:

1. Update `EXPO_PUBLIC_API_URL` in your environment
2. Update `EXPO_PUBLIC_INTERNAL_TOKEN` for authentication
3. The API service in `src/services/api.ts` handles all HTTP requests

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/manager` | GET | Get manager profile |
| `/api/dashboard/stats` | GET | Dashboard statistics |
| `/api/team` | GET | List team members |
| `/api/team/:id` | GET | Team member details |
| `/api/attendance` | GET | Attendance records |
| `/api/attendance/summary` | GET | Attendance summary |
| `/api/leave` | GET | Leave requests |
| `/api/leave/:id/approve` | POST | Approve leave |
| `/api/leave/:id/reject` | POST | Reject leave |
| `/api/performance/okrs` | GET | Team OKRs |
| `/api/performance/reviews` | GET | Performance reviews |
| `/api/meetings` | GET | List meetings |
| `/api/meetings` | POST | Schedule meeting |
| `/api/reports` | GET | Team reports |

## Navigation

The app uses a bottom tab navigator with nested stack navigators:

- **Dashboard** - Home screen with overview
- **Team** - Team list with member details
- **Attendance** - Attendance overview with review
- **Leave** - Leave management with approvals
- **Performance** - Performance tracking with reviews
- **1:1** - Meetings with scheduling
- **Reports** - Team reports generation

## Platform

- iOS Bundle: `com.corpperks.manager`
- Android Package: `com.corpperks.manager`
- Expo Scheme: `corpperks-manager`

## Company

**CorpPerks** - Enterprise HR SaaS Platform

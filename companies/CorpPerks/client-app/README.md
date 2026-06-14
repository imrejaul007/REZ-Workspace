# CorpPerks Client Portal Mobile App

Modern mobile app for CorpPerks clients to manage their projects, invoices, and communications.

## Features

### Dashboard
- Overview of active projects and pending invoices
- Revenue summary with monthly breakdown
- Upcoming deadlines
- Recent activity feed
- Quick actions

### Projects
- View all projects with filtering (All, Active, In Progress, Completed)
- Project details with milestones, tasks, team, and documents
- Budget and spending tracking
- Progress visualization

### Invoices
- View all invoices with status filtering
- Invoice details with item breakdown
- Payment status tracking (Pending, Paid, Overdue)
- Summary stats for outstanding and overdue amounts
- Pay Now functionality

### Messages
- Real-time conversations with project team
- Unread message badges
- Search functionality
- Project-linked conversations

## Tech Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tabs + Native Stack)
- **State Management**: Zustand
- **HTTP Client**: Fetch API
- **Styling**: StyleSheet with custom design system

## Project Structure

```
client-app/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Dashboard
│   │   ├── projects.tsx       # Projects list
│   │   ├── invoices.tsx       # Invoices list
│   │   └── messages.tsx       # Messages list
│   └── project/
│       └── [id].tsx           # Project detail
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── ListItem.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── StatCard.tsx
│   │   └── EmptyState.tsx
│   ├── services/
│   │   └── api.ts             # API service with mock data
│   ├── store/
│   │   └── index.ts           # Zustand store
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   ├── utils/
│   │   └── theme.ts           # Design system tokens
│   └── navigation/
│       └── AppNavigator.tsx   # Navigation configuration
├── App.tsx                     # App entry point
├── app.json                    # Expo configuration
├── package.json
└── tsconfig.json
```

## Design System

### Colors
- Primary: Teal (#14B8A6)
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
cd client-app
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
| `/api/client` | GET | Get client profile |
| `/api/dashboard/stats` | GET | Dashboard statistics |
| `/api/projects` | GET | List all projects |
| `/api/projects/:id` | GET | Project details |
| `/api/invoices` | GET | List all invoices |
| `/api/invoices/:id` | GET | Invoice details |
| `/api/conversations` | GET | List conversations |
| `/api/messages/:convId` | GET | Get messages |

## Platform

- iOS Bundle: `com.corpperks.client`
- Android Package: `com.corpperks.client`
- Expo Scheme: `corpperks-client`

## Company

**CorpPerks** - Enterprise HR SaaS Platform

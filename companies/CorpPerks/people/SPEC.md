# MyTalent - Employee Life OS

## Overview

MyTalent is a comprehensive Employee Life OS built with Expo React Native. It provides employees with a unified platform to manage their work life including attendance, payroll, benefits, career development, and financial wellness.

## Tech Stack

- **Framework**: Expo SDK 50 (React Native)
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tabs + Native Stack)
- **State Management**: Zustand with AsyncStorage persistence
- **Styling**: StyleSheet with custom design system
- **Location**: Expo Location
- **Notifications**: Expo Notifications
- **Camera**: Expo Camera (for face attendance)

## App Structure

### Navigation

**7 Bottom Tab Screens**:
1. Home - Dashboard with overview
2. Work - Workspace hub (Attendance, Leave, Tasks, Productivity)
3. Pay - Payroll and payslips
4. Benefits - Benefits hub and partner offers
5. Money - Financial health (RidZa integration)
6. Career - Career growth and development
7. Profile - Personal profile and settings

### Screen Hierarchy

```
├── Home Dashboard
├── Work Tab
│   ├── Attendance
│   ├── Leave Management
│   ├── Tasks
│   └── Productivity
├── Pay Tab
│   └── Payslip Detail
├── Benefits Tab
│   ├── Health Benefits
│   └── Partner Offers
├── Money Tab
│   ├── Salary Advance
│   ├── Credit Cards
│   ├── Loans
│   └── Insurance
├── Career Tab
│   ├── Skill Gap Analysis
│   ├── Career Paths
│   ├── AI Career Coach
│   └── Internal Mobility
└── Profile Tab
    ├── CorpID Passport
    ├── Trust Wallet
    ├── Document Vault
    ├── People Directory
    ├── Announcements
    ├── Support Center
    └── AI Copilot
```

## Features

### 1. Attendance Management
- GPS check-in/check-out
- Face recognition attendance
- QR code attendance
- Work from home toggle
- Geo-fence verification
- Attendance history
- Monthly summary

### 2. Leave Management
- Leave balance tracking
- Leave type cards (Sick, Casual, Earned, WFH)
- Apply for leave with modal
- Leave history
- Holiday calendar

### 3. Task Management
- Daily/Weekly/Assigned tabs
- Priority indicators
- Progress tracking
- Task completion
- Due date management

### 4. Payroll
- Current month salary summary
- Payslip history
- Payslip detail view with download
- PF/ESI information
- Tax details
- Bonus history
- Incentive earnings

### 5. Benefits Hub
- Category filtering
- Health insurance details
- Wellness programs
- Partner offers with claiming
- Learning & development budget
- Benefits summary

### 6. Money Hub (RidZa)
- Financial health score
- Salary advance
- Credit card marketplace
- Loan products
- Insurance marketplace

### 7. Career Development
- Career progress tracking
- Skill gap analysis
- Career path visualization
- AI Career Coach chatbot
- Internal job openings
- Learning recommendations

### 8. Profile
- CorpID passport with CI score
- Trust wallet with badges
- Document vault
- People directory
- Support center
- AI Copilot assistant

## Services

### API Integrations

| Service | Port | Purpose |
|---------|------|---------|
| RABTUL Auth | 4002 | Authentication |
| RABTUL Profile | 4013 | User profiles |
| RABTUL Wallet | 4004 | Coins & rewards |
| RABTUL Notifications | 4011 | Push notifications |
| CorpPerks Backend | 4006 | Attendance, Leave, Payroll |
| REZ Merchant Bridge | 4008 | Benefits & offers |
| RidZa | 4503 | Financial services |
| CorpID | 4702 | Identity verification |
| REZ AI | 4033 | AI Copilot |

### Service Files

```
src/services/
├── authService.ts
├── profileService.ts
├── walletService.ts
├── notificationsService.ts
├── attendanceService.ts
├── leaveService.ts
├── payrollService.ts
├── benefitsService.ts
├── ridzaService.ts
├── corpIdService.ts
├── aiCopilotService.ts
└── careerService.ts
```

## Design System

### Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | #8B5CF6 | Main actions, headers |
| Secondary | #6366F1 | Secondary elements |
| Success | #22C55E | Positive states |
| Warning | #F59E0B | Warnings |
| Error | #EF4444 | Errors |

### Components

- Card
- Button
- ProgressRing
- ProgressBar
- BalanceCard
- ScoreCard
- StatusBadge
- EmptyState
- ListItem

## Mock Data

Comprehensive mock data is provided for:
- Employee profiles
- Attendance records
- Leave balances and requests
- Payslips
- Benefits and offers
- CorpID profiles
- Financial health scores
- Career progress
- Tasks

## Getting Started

```bash
cd CorpPerks/people

# Install dependencies
npm install

# Start development
npm start

# Build for iOS
npm run ios

# Build for Android
npm run android
```

## Build Commands

```bash
# Prebuild native code
npx expo prebuild

# Build iOS
eas build --platform ios

# Build Android
eas build --platform android
```

## Environment Variables

```bash
# Optional - falls back to mock data
AUTH_SERVICE_URL=http://localhost:4002
PROFILE_SERVICE_URL=http://localhost:4013
WALLET_SERVICE_URL=http://localhost:4004
NOTIFICATION_SERVICE_URL=http://localhost:4011
ATTENDANCE_SERVICE_URL=http://localhost:4006
BENEFITS_SERVICE_URL=http://localhost:4008
RIDZA_SERVICE_URL=http://localhost:4503
CORPID_SERVICE_URL=http://localhost:4702
AI_SERVICE_URL=http://localhost:4033
INTERNAL_SERVICE_TOKEN=your-token
```

## Architecture

```
people/
├── app/                    # Screen components
│   ├── (tabs)/            # Bottom tab screens
│   │   ├── index.tsx      # Home Dashboard
│   │   ├── work.tsx       # Work Hub
│   │   ├── pay.tsx        # Payroll
│   │   ├── benefits.tsx   # Benefits Hub
│   │   ├── money.tsx      # Money Hub
│   │   ├── career.tsx     # Career Hub
│   │   └── profile.tsx     # Profile
│   ├── work/              # Work stack screens
│   ├── pay/               # Pay stack screens
│   ├── benefits/          # Benefits stack screens
│   ├── money/             # Money stack screens
│   ├── career/            # Career stack screens
│   └── profile/           # Profile stack screens
├── src/
│   ├── components/        # Reusable components
│   ├── data/              # Mock data
│   ├── navigation/        # Navigation setup
│   ├── services/          # API integrations
│   ├── store/             # Zustand store
│   ├── types/             # TypeScript types
│   └── utils/             # Utilities
├── App.tsx               # Entry point
├── app.json              # Expo config
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript config
```

## Status

- Build: Ready
- Type Safety: Full TypeScript
- Mock Data: Complete
- Services: All integrated
- Navigation: 7 tabs + 25 stack screens

# MyRisa Mobile App

**"Your Health. Understood."**

Personal Wellbeing Intelligence Platform - React Native Mobile App

---

## Overview

MyRisa is a React Native mobile app that provides a unified interface for all 7 wellbeing domains:
- 🌸 Women's Health
- 💜 Sexual Wellness
- 🧠 Mental Wellness
- 😴 Sleep
- 🏃 Lifestyle
- ⚡ Work-Life Balance
- ❤️ Relationships

---

## Features

### Core Features

- **Unified Dashboard** - Single view of overall wellbeing score
- **Human Twin** - Visual representation of your health state
- **Quick Actions** - Log mood, sleep, period, work with one tap
- **Domain Tracking** - Detailed tracking for each wellbeing domain
- **Consultation Copilot** - Prepare for doctor visits
- **Insights** - AI-powered health insights

### Screens

| Screen | Purpose |
|--------|---------|
| Home | Dashboard with scores and quick actions |
| Women's Health | Cycle, fertility, pregnancy, PCOS |
| Mental Health | Mood, stress, therapy |
| Sleep | Sleep logging and analysis |
| Work-Life | Burnout, energy, PTO |
| Relationships | Partner, quality time |
| Profile | User settings and preferences |
| Twin | Visual health twin |
| Consultation | Doctor visit preparation |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native + Expo |
| UI | React Native Paper (Material Design 3) |
| Navigation | React Navigation |
| State | React hooks |
| API | Axios |
| Storage | AsyncStorage |

---

## Installation

### Prerequisites
- Node.js 18+
- Expo CLI
- npm or yarn

### Setup

```bash
cd myrisa-mobile-app
npm install
npm start
```

### Run on Device

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

### API Server

Make sure the MyRisa backend is running:

```bash
cd ../myrisa-app
npm install
npm run dev
# Runs on port 4900
```

---

## Project Structure

```
myrisa-mobile-app/
├── App.tsx                 # Main app component
├── package.json
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── WomensHealthScreen.tsx
│   │   ├── MentalHealthScreen.tsx
│   │   ├── SleepScreen.tsx
│   │   ├── WorkLifeScreen.tsx
│   │   ├── LifestyleScreen.tsx
│   │   ├── RelationshipsScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── ConsultationScreen.tsx
│   │   └── TwinScreen.tsx
│   ├── services/
│   │   └── ApiService.ts    # API client
│   └── navigation/
│       └── (future: navigation setup)
```

---

## API Integration

The app connects to the MyRisa backend:

| Service | Port | Purpose |
|---------|------|---------|
| MyRisa App | 4900 | Consumer interface |
| Women's Health | 4820 | Cycle, fertility |
| Sexual Wellness | 4821 | Libido, contraception |
| Work-Life | 4822 | Burnout, energy |
| Relationships | 4823 | Partner, quality time |
| Human Twin | 4824 | Unified twin |
| Consultation | 4825 | Pre/post-visit |

---

## Screenshots (Placeholder)

```
┌─────────────────────────────┐
│  🏠 Home                   │
├─────────────────────────────┤
│  Good morning!             │
│  Your Health. Understood.  │
│                             │
│  ┌─────┐   Overall: 78    │
│  │  78 │   [View Twin →] │
│  └─────┘                   │
│                             │
│  Quick Actions             │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐│
│  │ 😊 │ │ 😴 │ │ 🌸 │ │ ⚡ ││
│  │Mood│ │Sleep│ │Period│ │Work ││
│  └────┘ └────┘ └────┘ └────┘│
│                             │
│  Your Wellbeing            │
│  Mental Wellness    75 →   │
│  Work-Life        80 →    │
│  Sleep           70 →     │
│  Relationships   75 →    │
│                             │
│  [📅 Prepare Doctor Visit] │
└─────────────────────────────┘
```

---

## Color Scheme

| Domain | Color | Hex |
|--------|-------|-----|
| Women's Health | Rose | #E57373 |
| Sexual Wellness | Purple | #BA68C8 |
| Mental Health | Indigo | #7986CB |
| Sleep | Deep Blue | #5C6BC0 |
| Lifestyle | Teal | #4DB6AC |
| Work-Life | Amber | #FFB74D |
| Relationships | Red | #EF5350 |

---

## Future Enhancements

- [ ] Push notifications
- [ ] Apple Health / Google Fit integration
- [ ] Wearable device sync
- [ ] Offline mode
- [ ] Family sharing
- [ ] AI Chat (Genie integration)
- [ ] Voice input for logging
- [ ] Widgets

---

## Brand

**Name:** MyRisa
**Tagline:** "Your Health. Understood."
**Company:** RisaCare (Healthcare vertical under RTNM Digital)

---

**License:** Proprietary - RTNM Digital
# RisaCare Mobile App

React Native (Expo) mobile app for RisaCare - India's Healthcare Operating System.

## Features

- **Health Records** - Upload, view, and manage health reports
- **AI Assistant** - Get insights about your health
- **Doctor Booking** - Find and book appointments
- **Wellness Tracking** - Track habits, cycles, and health scores
- **Family Profiles** - Manage health for your entire family

## Setup

```bash
# Install dependencies
cd risa-care-mobile
npm install

# Start development
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Requirements

- Node.js 18+
- Expo SDK 50+
- iOS 13+ / Android 6.0+

## Structure

```
src/
├── api/          # API client
├── screens/      # Screen components
├── store/        # Zustand state
└── components/  # Reusable components
```

## Configuration

Update API URL in `src/api/index.ts`:
```typescript
const API_BASE_URL = 'http://your-server:4700/health/v1';
```

# Do App — AI-Powered Chat Commerce

**Version:** 3.1.0 | **SDK:** Expo 53 | **Updated:** June 1, 2026

---

## Overview

Do is an AI-powered chat app for the ReZ ecosystem. Chat to discover venues, book experiences, and manage your wallet.

---

## Features

| Feature | Description |
|---------|-------------|
| **AI Chat** | Natural language booking |
| **Biometric Auth** | Face ID / Touch ID |
| **Voice Input** | Speech to text |
| **Deep Linking** | `do://` scheme |
| **Map View** | Explore on map |
| **Character Counter** | 500 char limit |
| **Draft Saving** | Auto-save messages |
| **Style Advisor** | Personalized suggestions |
| **Karma Wallet** | Coins & rewards |
| **Real-time Nudges** | AI-powered notifications |

---

## Quick Start

```bash
# Install
cd do-app
npm install

# Start development
npm run start

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

---

## Deep Links

| URL | Route |
|-----|-------|
| `do://chat` | Chat |
| `do://wallet` | Wallet |
| `do://profile` | Profile |
| `do://explore` | Explore |
| `do://booking/:id` | Booking Detail |
| `do://settings` | Settings |

---

## Tech Stack

- **Framework:** Expo SDK 53
- **Navigation:** Expo Router
- **State:** Zustand, React Query
- **Animations:** Moti, Lottie, Reanimated
- **Biometric:** expo-local-authentication
- **Voice:** expo-av

---

## Project Structure

```
do-app/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   ├── onboarding/         # Style preferences
│   ├── auth/              # Phone OTP
│   ├── booking/[id].tsx   # Booking detail
│   └── settings/          # App settings
│
├── src/
│   ├── components/
│   │   ├── chat/          # Chat UI
│   │   ├── VoiceInputButton.tsx
│   │   └── CharacterCounter.tsx
│   ├── hooks/
│   │   ├── useBiometricAuth.ts
│   │   ├── useVoiceInput.ts
│   │   ├── useDeepLinking.ts
│   │   └── useDraft.ts
│   ├── screens/
│   │   └── ExploreMapScreen.tsx
│   └── services/
│
└── do-backend/            # Express backend
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| [CLAUDE.md](CLAUDE.md) | Developer guide |
| [FEATURES.md](FEATURES.md) | Feature list |
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [SECURITY-AUDIT.md](SECURITY-AUDIT.md) | Security audit |
| [SETUP.md](SETUP.md) | Setup guide |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Deployment |

---

## Security

- Expo SDK 53 (latest)
- JWT authentication
- Biometric auth (Face ID / Touch ID)
- Rate limiting
- Input validation (Zod)
- Secure storage for tokens

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for all changes.

---

*Last Updated: June 1, 2026*

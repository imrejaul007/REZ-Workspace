# Do App Changelog

All notable changes to this project will be documented in this file.

## [3.1.0] - 2026-06-01

### Added (June 1, 2026)

#### New Features
- **Biometric Authentication** - Face ID / Touch ID support
  - `useBiometricAuth.ts` - Hook for biometric operations
  - `useBiometricGuard.ts` - App lock guard
  - `biometric.tsx` - Settings screen
- **Voice Input** - Speech to text in chat
  - `useVoiceInput.ts` - Voice recognition hook
  - `VoiceInputButton.tsx` - Animated mic with waveform
  - `voiceService.ts` - Speech/TTS service
- **Deep Linking** - Universal link support
  - `do://chat`, `do://wallet`, `do://profile`, `do://explore`, `do://booking/:id`
  - `useDeepLinking.ts` - Deep link handler
  - `+not-found.tsx` - 404 handler
- **Map View** - Explore venues on map
  - `ExploreMapScreen.tsx` - Full map view
  - `VenueMarker.tsx` - Custom markers
- **Character Counter** - Chat input limit display
  - `CharacterCounter.tsx` - Color-coded counter
- **Draft Saving** - Auto-save message drafts
  - `useDraft.ts` - Draft persistence hook

### Upgraded

#### Expo SDK Upgrade
- **SDK**: 52 -> 53
- **expo**: ~52.0.0 -> ~53.0.0
- **expo-av**: ~15.0.2 -> ~15.1.0
- **expo-image-picker**: ~16.0.6 -> ~16.0.0
- **expo-local-authentication**: ~15.0.2 -> ~15.0.0
- **expo-notifications**: ~0.29.0 -> ~0.30.0
- **expo-secure-store**: ~14.0.1 -> ~14.0.0
- **expo-sharing**: ~13.0.1 -> ~13.0.0
- **@react-native-async-storage/async-storage**: 1.23.1 -> 2.1.0

#### Security Improvements
- High severity vulnerabilities: 15 -> 7 (53% reduction)
- Moderate severity vulnerabilities: 5 -> 9 (some remained)
- Total vulnerabilities: 20 -> 16 (20% reduction)

### Known Issues
- TypeScript errors present in codebase (pre-existing, not SDK 53 related)
- These require fixes to types, imports, and theme properties

---

## [3.0.0] - 2026-05-13

### Added

#### New Features
- **Style Preferences Onboarding** - Users can set their vibe, occasions, and cuisine preferences during onboarding
- **Style Advisor Chat Mode** - Toggle between general and style-focused chat recommendations
- **For You Section** - Personalized venue recommendations based on user preferences in Explore
- **Trend Predictions API** - `/discovery/trends` endpoint with AI trend scores
- **Avatar Upload** - Camera and gallery photo selection for profile picture
- **Rich Push Notifications** - Notification templates for booking, wallet, karma, and deals
- **WebSocket Client** - Real-time communication service with auto-reconnect
- **Notifications API Route** - Full push token and preferences management
- **Complaints API Route** - Create, view, and manage complaints

#### REZ Mind Integration
- **Intent Capture Service** - Track all user events to REZ Intelligence
- **Agent Orchestrator Service** - Connect to 38 AI agents
- **Nudge Engine** - Real-time personalized push notifications
- **Attribution Tracking** - Conversion attribution with touchpoints
- **Predictive Scoring** - Churn risk, LTV, booking probability

#### Screens
- `/settings/notifications` - Notification preferences
- `/settings/addresses` - Address management
- `/settings/edit-profile` - Edit profile details

#### Booking Actions
- Get Directions - Open maps with venue address
- Call Venue - Phone number dialer
- Add to Calendar - Native calendar integration
- Reschedule - Contact venue flow

### Changed
- Refunds screen now connects to complaints API
- Profile screen has edit button for quick access
- Onboarding flow includes style preferences step

### Security
- OTP bypass removed
- Rate limiting on auth endpoints
- Input validation with Zod

---

## [2.0.0] - 2026-05-12

### Added
- AI chat interface with Do persona
- Phone + OTP authentication
- Wallet integration (coins, karma)
- Venue discovery
- Booking management
- Real-time WebSocket
- Offline support
- Idempotent transactions
- Rate limiting
- Input validation (Zod)

---

## [1.0.0] - 2026-05-04

### Added
- Initial project setup
- Expo Router navigation
- Theme system
- Basic UI components

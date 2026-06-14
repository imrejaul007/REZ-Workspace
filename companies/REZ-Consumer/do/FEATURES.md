# Do App - Complete Feature Breakdown

**Version:** 3.0.0
**Date:** May 13, 2026

---

## TABLE OF CONTENTS

1. [Authentication](#1-authentication)
2. [Onboarding](#2-onboarding)
3. [Chat Interface](#3-chat-interface)
4. [Style Advisor](#4-style-advisor)
5. [Discovery/Explore](#5-discoveryexplore)
6. [For You Section](#6-for-you-section)
7. [Booking](#7-booking)
8. [Wallet](#8-wallet)
9. [Profile](#9-profile)
10. [Settings](#10-settings)
11. [Complaints](#11-complaints)
12. [Refunds](#12-refunds)
13. [Notifications](#13-notifications)
14. [Push Notifications](#14-push-notifications)
15. [Real-time Features](#15-real-time-features)
16. [REZ Mind Integration](#16-rez-mind-integration)
17. [Intent Tracking](#17-intent-tracking)
18. [Dormancy Detection](#18-dormancy-detection)
19. [Nudge Engine](#19-nudge-engine)
20. [Attribution Tracking](#20-attribution-tracking)
21. [Predictive Scoring](#21-predictive-scoring)
22. [AI Agents](#22-ai-agents)
23. [Security](#23-security)
24. [Offline Support](#24-offline-support)
25. [Navigation & Routing](#25-navigation--routing)

---

## 1. AUTHENTICATION

### 1.1 Phone Verification
- [x] Phone number input with country code
- [x] Format validation (Indian mobile numbers)
- [x] OTP send via SMS
- [x] 4-digit OTP input with auto-focus
- [x] OTP expiration (5 minutes)
- [x] Resend OTP option
- [x] Loading states during verification
- [x] Error handling for failed verification
- [x] Token storage in secure storage

### 1.2 JWT Management
- [x] JWT token generation
- [x] Token refresh mechanism
- [x] Token persistence across app restarts
- [x] Automatic token refresh on expiry
- [x] Logout with token invalidation

### 1.3 Session Management
- [x] Session ID generation
- [x] Session persistence
- [x] Multi-device support detection

---

## 2. ONBOARDING

### 2.1 Introduction Slides
- [x] Swipeable intro slides
- [x] Skip option
- [x] 4 feature slides:
  - Chat to Book
  - Earn Rewards
  - Karma Tiers
  - One App, Everything

### 2.2 Style Preferences
- [x] Vibe selection (multi-select)
  - Casual
  - Formal
  - Trendy
  - Minimal
  - Bold
  - Classic
- [x] Occasion selection (multi-select)
  - Date Night
  - Work/Office
  - Parties
  - Family Time
  - Fitness
  - Relaxation
- [x] Cuisine preferences (multi-select)
  - Indian
  - Chinese
  - Italian
  - Japanese
  - Continental
  - Cafe/Bakery
  - Fast Food
  - Healthy

### 2.3 Flow
- [x] Intro slides → Style preferences → Auth
- [x] Skip style preferences option
- [x] Save preferences to store
- [x] Sync preferences to REZ Mind

---

## 3. CHAT INTERFACE

### 3.1 Message Bubbles
- [x] User message bubbles (right-aligned)
- [x] Do message bubbles (left-aligned)
- [x] Timestamp display
- [x] Message status (sending, sent, delivered, read)

### 3.2 Input
- [x] Text input with placeholder
- [x] Send button
- [x] Quick action chips
- [x] Keyboard handling
- [x] Auto-scroll to bottom

### 3.3 Quick Actions
- [x] Pre-defined quick actions
- [x] Tappable suggestion chips
- [x] Custom quick actions per mode

### 3.4 Chat Cards
- [x] Entity cards (venues)
- [x] Reward cards (coins earned)
- [x] Booking confirmation cards
- [x] Action buttons on cards

### 3.5 Typing Indicator
- [x] Animated typing dots
- [x] Show when Do is "typing"
- [x] Smooth animation

### 3.6 Empty State
- [x] Logo display
- [x] Personalized greeting
- [x] Suggestion chips

### 3.7 Location Integration
- [x] Request location permission
- [x] Include location in chat
- [x] Location-aware recommendations

---

## 4. STYLE ADVISOR

### 4.1 Mode Toggle
- [x] Toggle button on empty state
- [x] Switch between General/Style Advisor mode
- [x] Visual indicator (sparkle icon)

### 4.2 Style Actions
- [x] "I'm bored"
- [x] "I'm hungry"
- [x] "Suggest something romantic"
- [x] "Need to relax"

### 4.3 Personalized Suggestions
- [x] Based on user's vibe preferences
- [x] Based on cuisine preferences
- [x] Based on occasion preferences

### 4.4 Chat Enhancements
- [x] Style-focused quick actions
- [x] Personalized greeting with name
- [x] Mood-based suggestions

---

## 5. DISCOVERY/EXPLORE

### 5.1 Search
- [x] Search input field
- [x] Real-time search
- [x] Search history
- [x] Category filtering
- [x] Location-based results

### 5.2 Categories
- [x] Restaurants
- [x] Cafes
- [x] Trials
- [x] Spa & Wellness
- [x] Events
- [x] Fitness

### 5.3 Mood-Based Discovery
- [x] Mood chips (horizontal scroll)
- [x] I'm bored
- [x] Celebrate
- [x] Relax
- [x] Adventure
- [x] Date Night
- [x] Mood-based recommendations

### 5.4 Trending
- [x] Trending venues section
- [x] Trending badge
- [x] Karma discount display

### 5.5 Nearby
- [x] Location-based nearby venues
- [x] Distance display
- [x] MapPin indicator

### 5.6 Entity Cards
- [x] Image placeholder
- [x] Name and type
- [x] Rating display
- [x] Karma discount badge
- [x] Price level indicator
- [x] Distance
- [x] Tap to view details

### 5.7 Trend Predictions API
- [x] AI trend scores
- [x] Category-based trends
- [x] Peak time predictions

---

## 6. FOR YOU SECTION

### 6.1 Personalized Recommendations
- [x] Based on vibes preferences
- [x] Based on cuisines
- [x] Based on occasions

### 6.2 Dynamic Sections
- [x] Cuisine-based recommendations
- [x] Romantic spots for date night
- [x] Relaxation venues
- [x] Trendy spots

### 6.3 UI
- [x] Heart icon indicator
- [x] Horizontal scroll cards
- [x] Tap to explore

---

## 7. BOOKING

### 7.1 Booking Detail View
- [x] Venue image
- [x] Venue name and type
- [x] Address display
- [x] Date and time
- [x] Party size
- [x] Confirmation code
- [x] Status badge
- [x] Karma discount display
- [x] Coins earned badge

### 7.2 Booking Actions
- [x] Show QR Code
- [x] Share booking
- [x] Get Directions (opens maps)
- [x] Call Venue (opens dialer)
- [x] Add to Calendar
- [x] Reschedule
- [x] Cancel Booking

### 7.3 QR Code
- [x] Modal overlay
- [x] QR code display
- [x] Tap to dismiss
- [x] Confirmation code text

### 7.4 Share
- [x] Native share sheet
- [x] Booking details text

### 7.5 Cancellation
- [x] Confirmation dialog
- [x] Haptic feedback on success
- [x] Navigate back on success

### 7.6 External Links
- [x] Google Maps (Android)
- [x] Apple Maps (iOS)
- [x] Tel: links
- [x] Calendar integration

---

## 8. WALLET

### 8.1 Balance Display
- [x] Coin balance
- [x] Cash balance
- [x] Karma tier badge
- [x] Multiplier display

### 8.2 Karma Tier System
- [x] Bronze tier
- [x] Silver tier
- [x] Gold tier
- [x] Platinum tier
- [x] Progress bar
- [x] Points to next tier
- [x] Benefits display

### 8.3 Quick Actions
- [x] Earn coins (Alert - Coming Soon)
- [x] Redeem (Alert - Coming Soon)

### 8.4 Action Grid
- [x] Gift Coins
- [x] Get Gold
- [x] View Badges
- [x] History (Coming Soon alerts)

### 8.5 Transaction History
- [x] Recent transactions list
- [x] Transaction type icons
- [x] Amount display
- [x] Timestamp
- [x] Reason/description

---

## 9. PROFILE

### 9.1 Profile Header
- [x] Avatar display
- [x] Name display
- [x] Phone number
- [x] Karma stats (points, bookings)
- [x] Edit button

### 9.2 Recent Bookings
- [x] Last 3 bookings
- [x] Tap to view detail
- [x] Empty state

### 9.3 Statistics
- [x] Karma points
- [x] Bookings count

### 9.4 Settings Links
- [x] Notifications → `/settings/notifications`
- [x] Addresses → `/settings/addresses`
- [x] Edit Profile → `/settings/edit-profile`
- [x] Haptic Feedback toggle
- [x] Sound Effects toggle

### 9.5 Account
- [x] Help & Support
- [x] Privacy Policy
- [x] Terms of Service
- [x] Sign Out (with confirmation)

---

## 10. SETTINGS

### 10.1 Notifications Settings
- [x] Push Notifications toggle
- [x] Booking Reminders toggle
- [x] Wallet Updates toggle
- [x] Deals & Offers toggle
- [x] Karma Updates toggle
- [x] Chat Messages toggle
- [x] Haptic Feedback toggle
- [x] Sound Effects toggle
- [x] Save to backend API
- [x] Visual feedback on save

### 10.2 Addresses
- [x] List saved addresses
- [x] Default address badge
- [x] Add new address
- [x] Edit address
- [x] Delete address (with confirmation)
- [x] Set as default
- [x] Label (Home, Office, etc.)
- [x] Street address
- [x] City
- [x] PIN code
- [x] Form validation

### 10.3 Edit Profile
- [x] Avatar change (camera/gallery)
- [x] Name editing
- [x] Email editing
- [x] Bio editing
- [x] Save to backend
- [x] Cancel option

---

## 11. COMPLAINTS

### 11.1 List View
- [x] List of complaints
- [x] Status badge
- [x] Type display
- [x] Date
- [x] Empty state

### 11.2 Create Complaint
- [x] Type selection
- [x] Description input
- [x] Order ID (optional)
- [x] Submit button
- [x] Success feedback

### 11.3 Complaint Types
- [x] Booking issue
- [x] Payment issue
- [x] Service issue
- [x] Other

### 11.4 Status Tracking
- [x] Registered
- [x] Investigating
- [x] Resolved
- [x] Escalated
- [x] Closed

---

## 12. REFUNDS

### 12.1 List View
- [x] List of refund requests
- [x] Status badge
- [x] Amount display
- [x] Date
- [x] Empty state

### 12.2 Refund Status
- [x] Submitted
- [x] Under Review
- [x] Resolved
- [x] Escalated
- [x] Closed

### 12.3 Request Refund
- [x] Navigate to complaints
- [x] Contact support option

---

## 13. NOTIFICATIONS

### 13.1 Permission Handling
- [x] Request permission on first launch
- [x] Permission denied handling
- [x] Settings redirect option

### 13.2 Token Management
- [x] Get Expo push token
- [x] Register token to backend
- [x] Unregister on logout

### 13.3 Categories
- [x] Booking notifications
- [x] Wallet notifications
- [x] Deal notifications

### 13.4 Action Handlers
- [x] Tap to navigate
- [x] Dismiss action
- [x] View action

---

## 14. PUSH NOTIFICATIONS

### 14.1 Notification Templates
- [x] Booking confirmed
- [x] Booking reminder (1 hour before)
- [x] Coins earned
- [x] Coins spent
- [x] Karma upgrade
- [x] Deal of the day

### 14.2 Categories
- [x] View action
- [x] Dismiss action
- [x] Claim action (for deals)

### 14.3 Badge Management
- [x] Set badge count
- [x] Clear on app open

### 14.4 Background Handling
- [x] App state listener
- [x] Clear badge on foreground

---

## 15. REAL-TIME FEATURES

### 15.1 WebSocket Connection
- [x] Connect on auth
- [x] Disconnect on logout
- [x] Auto-reconnect with backoff
- [x] Token-based auth
- [x] Session ID in connection

### 15.2 Message Types
- [x] Send message
- [x] Typing indicators
- [x] Heartbeat/ping-pong
- [x] Error handling

### 15.3 Message Flow
- [x] Real-time message receive
- [x] Add to chat store
- [x] Auto-scroll to bottom

---

## 16. REZ MIND INTEGRATION

### 16.1 Services Connected
- [x] Intent Graph
- [x] User Intelligence
- [x] Agent Orchestrator
- [x] Campaign Service

### 16.2 API Client
- [x] Intent capture
- [x] Dormancy check
- [x] Revival trigger
- [x] Recommendations
- [x] Behavioral profile
- [x] User preferences

### 16.3 Error Handling
- [x] Graceful fallback
- [x] Console warnings
- [x] Non-blocking failures

---

## 17. INTENT TRACKING

### 17.1 Events Tracked
- [x] `chat_message` - User sends message
- [x] `entity_view` - User views venue
- [x] `entity_save` - User saves venue
- [x] `search` - User searches
- [x] `booking_start` - User starts booking
- [x] `booking_complete` - Booking confirmed
- [x] `booking_cancelled` - Booking cancelled
- [x] `payment_success` - Payment completed
- [x] `wallet_transaction` - Wallet change
- [x] `profile_view` - User views profile
- [x] `style_preferences_set` - Preferences saved
- [x] `onboarding_complete` - Onboarding done
- [x] `app_open` - App starts
- [x] `app_close` - App closes

### 17.2 Batch Processing
- [x] Event queue
- [x] Flush interval
- [x] Priority events (immediate)
- [x] Background processing

---

## 18. DORMANCY DETECTION

### 18.1 Dormancy Check
- [x] Check on app open
- [x] Days since active
- [x] Risk level (low/medium/high)

### 18.2 Revival Triggers
- [x] Push notification
- [x] Offer (coins, discount)
- [x] Channel selection

### 18.3 Automated Revival
- [x] Hourly monitoring
- [x] 7+ days dormant → trigger
- [x] 14+ days → high priority

---

## 19. NUGE ENGINE

### 19.1 Nudge Types
- [x] Dormancy nudge
- [x] Trend nudge
- [x] Personalized nudge
- [x] Social nudge
- [x] Urgency nudge

### 19.2 Nudge UI
- [x] NudgeBanner component
- [x] NudgeList component
- [x] InlineNudgeCard component
- [x] Dismiss functionality

### 19.3 Context
- [x] Time of day
- [x] Day of week
- [x] User location

---

## 20. ATTRIBUTION TRACKING

### 20.1 Touchpoints
- [x] Nudge shown
- [x] Nudge clicked
- [x] Nudge dismissed
- [x] Conversion

### 20.2 Attribution Window
- [x] 7-day lookback
- [x] Last click attribution
- [x] Multi-touch tracking

### 20.3 Summary Metrics
- [x] Impressions count
- [x] Clicks count
- [x] CTR
- [x] Conversions
- [x] Conversion rate
- [x] Revenue
- [x] Top channel

---

## 21. PREDICTIVE SCORING

### 21.1 Churn Risk
- [x] Score (0-1)
- [x] Level (low/medium/high)
- [x] Factors array

### 21.2 LTV Prediction
- [x] Lifetime value amount
- [x] Tier (standard/premium/vip)
- [x] Confidence score

### 21.3 Booking Probability
- [x] Per-entity scoring
- [x] Confidence score
- [x] Factors

---

## 22. AI AGENTS

### 22.1 User Intelligence (15)
- [x] PersonalizationAgent
- [x] SegmentClassifierAgent
- [x] RecommendationQualityAgent
- [x] EngagementScoreAgent
- [x] SessionAnalyzerAgent
- [x] SearchIntentAgent
- [x] BrowsePatternAgent
- [x] PurchasePredictorAgent
- [x] AbandonmentDetectorAgent
- [x] RetentionTriggerAgent
- [x] WinBackAgent
- [x] ReferralPotentialAgent
- [x] SurveyTriggerAgent
- [x] FeedbackAnalyzerAgent
- [x] NPSPredictorAgent

### 22.2 Commerce (15)
- [x] DemandSignalAgent
- [x] ScarcityAgent
- [x] PriceElasticityAgent
- [x] ReorderPredictorAgent
- [x] TasteEvolutionAgent
- [x] ChurnRiskAgent
- [x] LTVPredictorAgent
- [x] InventoryAlertAgent
- [x] DemandForecastAgent
- [x] CompetitorMonitorAgent
- [x] TrendDetectorAgent
- [x] PriceOptimizerAgent
- [x] OfferMatcherAgent
- [x] CrossSellAgent
- [x] UrgencyTriggerAgent

### 22.3 Autonomous (8)
- [x] DemandSignal
- [x] Scarcity
- [x] Personalization
- [x] Attribution
- [x] AdaptiveScoring
- [x] FeedbackLoop
- [x] NetworkEffect
- [x] RevenueAttribution

---

## 23. SECURITY

### 23.1 Authentication
- [x] JWT validation
- [x] Token expiration check
- [x] Refresh token flow

### 23.2 Rate Limiting
- [x] Auth rate limits
- [x] Chat rate limits
- [x] General limits

### 23.3 Input Validation
- [x] Zod schemas
- [x] Phone format
- [x] OTP length
- [x] Amount validation
- [x] Idempotency keys

### 23.4 OTP Security
- [x] No bypass
- [x] Expiration
- [x] Single use

---

## 24. OFFLINE SUPPORT

### 24.1 Caching
- [x] User profile cache
- [x] Wallet state cache
- [x] Chat history cache

### 24.2 Queue
- [x] Offline message queue
- [x] Sync on reconnect

### 24.3 State Persistence
- [x] MMKV storage
- [x] Zustand persist

---

## 25. NAVIGATION & ROUTING

### 25.1 Public Routes
- [x] `/onboarding`
- [x] `/auth`

### 25.2 Tab Routes
- [x] `/` (Chat)
- [x] `/explore`
- [x] `/wallet`
- [x] `/profile`

### 25.3 Detail Routes
- [x] `/booking/[id]`
- [x] `/complaints`
- [x] `/refunds`

### 25.4 Settings Routes
- [x] `/settings/notifications`
- [x] `/settings/addresses`
- [x] `/settings/edit-profile`
- [x] `/profile/avatar`

### 25.5 Animations
- [x] Fade transitions
- [x] Slide from right
- [x] Modal zoom

---

## SCREENS SUMMARY

| Screen | Route | Features |
|--------|--------|----------|
| Onboarding | `/onboarding` | Slides + Style prefs |
| Auth | `/auth` | Phone + OTP |
| Chat | `/` | Messages + Cards |
| Explore | `/explore` | Search + Categories + Mood |
| Wallet | `/wallet` | Balance + History |
| Profile | `/profile` | Stats + Links |
| Booking Detail | `/booking/[id]` | Actions + QR |
| Complaints | `/complaints` | List + Create |
| Refunds | `/refunds` | List |
| Notifications | `/settings/notifications` | Toggles |
| Addresses | `/settings/addresses` | CRUD |
| Edit Profile | `/settings/edit-profile` | Edit fields |
| Avatar | `/profile/avatar` | Camera/Gallery |

---

## SERVICES SUMMARY

| Service | File | Purpose |
|---------|------|---------|
| API Client | `rezApi.ts` | Auth, Profile, Wallet |
| REZ Mind | `rezMindService.ts` | Intent, Dormancy, Recs |
| Event Tracking | `eventTracking.ts` | All user events |
| Agent Orchestrator | `agentOrchestrator.ts` | 38 AI agents |
| Nudge Engine | `nudgeEngine.ts` | Real-time nudges |
| Attribution | `attributionTracking.ts` | Conversion tracking |
| WebSocket | `websocketService.ts` | Real-time chat |
| Avatar | `avatarService.ts` | Image picker |
| Notifications | `notifications.ts` | Push handling |
| Offline | `offline.ts` | Caching, queue |

---

## HOOKS SUMMARY

| Hook | Purpose |
|------|---------|
| `useAuth` | Authentication state |
| `useReZMindSetup` | Initialize REZ Mind |
| `useIntentTracking` | Track events |
| `useDormancyDetection` | Check dormancy |
| `useRecommendations` | Get ML recs |
| `useBehavioralProfile` | Get personality |
| `usePredictiveScoring` | Churn, LTV, probability |
| `useNudgeEngine` | Real-time nudges |
| `useAttribution` | Track conversions |
| `useAppLifecycle` | Open/close tracking |

---

## BACKEND ROUTES

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|----------|
| `/auth/otp/send` | POST | Public | Send OTP |
| `/auth/otp/verify` | POST | Public | Verify OTP |
| `/auth/me` | GET | JWT | Current user |
| `/auth/logout` | POST | JWT | Logout |
| `/auth/refresh` | POST | Public | Refresh token |
| `/do/chat/message` | POST | JWT | Send message |
| `/do/chat/history` | GET | JWT | Chat history |
| `/discovery` | GET | - | Search venues |
| `/discovery/trending` | GET | - | Trending |
| `/discovery/trends` | GET | - | AI predictions |
| `/discovery/nearby` | GET | - | Nearby |
| `/discovery/mood/:mood` | GET | - | Mood discovery |
| `/wallet` | GET | JWT | Balance |
| `/wallet/transactions` | GET | JWT | History |
| `/wallet/debit` | POST | JWT | Spend |
| `/wallet/credit` | POST | JWT | Earn |
| `/wallet/karma` | GET | JWT | Karma status |
| `/bookings` | GET | JWT | List |
| `/bookings/:id` | GET | JWT | Detail |
| `/bookings` | POST | JWT | Create |
| `/bookings/:id` | DELETE | JWT | Cancel |
| `/profile` | GET | JWT | Full profile |
| `/profile/preferences` | PATCH | JWT | Update prefs |
| `/profile/style-preferences` | GET | JWT | Get styles |
| `/profile/style-preferences` | PATCH | JWT | Update styles |
| `/notifications/register-token` | POST | JWT | Push token |
| `/notifications/unregister-token` | DELETE | JWT | Remove token |
| `/notifications/preferences` | GET | JWT | Get prefs |
| `/notifications/preferences` | PATCH | JWT | Update prefs |
| `/do/complaints` | GET | JWT | List |
| `/do/complaints` | POST | JWT | Create |
| `/do/complaints/:id` | GET | JWT | Detail |
| `/do/complaints/:id` | DELETE | JWT | Close |

---

*Last Updated: May 13, 2026*

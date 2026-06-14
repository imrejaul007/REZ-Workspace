# Do App - Detailed Features Report

**Version:** 1.0.0  
**Date:** June 1, 2026  
**Status:** COMPLETE

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
25. [Navigation](#25-navigation)
26. [Missing Features](#26-missing-features)
27. [Recommendations](#27-recommendations)

---

## 1. AUTHENTICATION

### 1.1 Phone Verification
| Feature | Status | Implementation |
|---------|--------|----------------|
| Phone number input with country code | ✅ | `+91` prefix |
| Format validation (Indian mobile) | ✅ | Regex validation |
| OTP send via SMS | ✅ | Backend integration |
| 4-digit OTP input with auto-focus | ✅ | `autoFocus` prop |
| OTP expiration (5 minutes) | ✅ | Timer countdown |
| Resend OTP option | ✅ | 30s cooldown |
| Loading states during verification | ✅ | `loading` state |
| Error handling for failed verification | ✅ | Toast notifications |
| Token storage in secure storage | ✅ | MMKV storage |

### 1.2 JWT Management
| Feature | Status | Implementation |
|---------|--------|----------------|
| JWT token generation | ✅ | Backend signed JWT |
| Token refresh mechanism | ✅ | Auto-refresh on expiry |
| Token persistence across app restarts | ✅ | MMKV storage |
| Automatic token refresh on expiry | ✅ | Intercept 401 errors |
| Logout with token invalidation | ✅ | Clear storage |

### 1.3 Session Management
| Feature | Status | Implementation |
|---------|--------|----------------|
| Session ID generation | ✅ | UUID generation |
| Session persistence | ✅ | MMKV |
| Multi-device support detection | ✅ | Device fingerprint |

### 1.4 Biometric Authentication
| Feature | Status | Priority |
|---------|--------|----------|
| Face ID / Touch ID | ❌ MISSING | P1 |
| Biometric fallback to PIN | ❌ MISSING | P1 |

---

## 2. ONBOARDING

### 2.1 Introduction Slides
| Feature | Status | Implementation |
|---------|--------|----------------|
| Swipeable intro slides | ✅ | `@react-native-pager-view` |
| Skip option | ✅ | Skip button |
| 4 feature slides | ✅ | Custom slides |
| Progress indicators | ✅ | Pagination dots |

**Slide Content:**
1. "Chat to Book" - Natural language booking
2. "Earn Rewards" - Karma coins system
3. "Karma Tiers" - Bronze to Platinum
4. "One App, Everything" - All-in-one

### 2.2 Style Preferences
| Feature | Status | Options |
|---------|--------|---------|
| Vibe selection (multi-select) | ✅ | 6 vibes |
| Occasion selection (multi-select) | ✅ | 7 occasions |
| Cuisine preferences (multi-select) | ✅ | 9 cuisines |
| Preference persistence | ✅ | Zustand store |

**Vibe Options:**
- Casual
- Formal
- Trendy
- Minimal
- Bold
- Classic

**Occasion Options:**
- Date Night
- Work/Office
- Parties
- Family Time
- Fitness
- Relaxation
- Adventure

**Cuisine Options:**
- Indian
- Chinese
- Italian
- Japanese
- Continental
- Cafe/Bakery
- Fast Food
- Healthy
- Other

### 2.3 Onboarding Flow
| Feature | Status | Implementation |
|---------|--------|----------------|
| Intro slides → Style → Auth | ✅ | Sequential flow |
| Skip style preferences | ✅ | Skip button |
| Save preferences to store | ✅ | Zustand |
| Sync preferences to REZ Mind | ✅ | API call |

---

## 3. CHAT INTERFACE

### 3.1 Message Bubbles
| Feature | Status | Implementation |
|---------|--------|----------------|
| User message bubbles (right) | ✅ | Blue background |
| Do message bubbles (left) | ✅ | White background |
| Timestamp display | ✅ | Below message |
| Message status indicators | ✅ | Sending/Sent/Delivered/Read |
| Avatar display | ✅ | Left of Do messages |

### 3.2 Input Area
| Feature | Status | Implementation |
|---------|--------|----------------|
| Text input with placeholder | ✅ | "Message Do..." |
| Send button | ✅ | Arrow icon |
| Quick action chips | ✅ | Horizontal scroll |
| Keyboard handling | ✅ | `KeyboardAvoidingView` |
| Auto-scroll to bottom | ✅ | `ScrollView` ref |
| Character counter | ❌ MISSING | P2 |
| Draft saving | ❌ MISSING | P2 |

### 3.3 Quick Actions
| Feature | Status | Categories |
|---------|--------|------------|
| Pre-defined quick actions | ✅ | Dynamic per context |
| Tappable suggestion chips | ✅ | `Chip` component |
| Custom actions per mode | ✅ | General/Style modes |

**General Mode Actions:**
- 🔍 Explore
- 📍 Nearby
- 💬 Chat with support
- 🎁 View offers

**Style Mode Actions:**
- 👗 Suggest an outfit
- 🍽️ I'm hungry
- 🎉 I'm bored
- 💕 Suggest something romantic

### 3.4 Chat Cards
| Feature | Status | Implementation |
|---------|--------|----------------|
| Entity cards (venues) | ✅ | `EntityCard` component |
| Reward cards (coins) | ✅ | `CoinAnimation` component |
| Booking confirmation cards | ✅ | `ActionCard` component |
| Action buttons on cards | ✅ | Inline buttons |

**Entity Card Fields:**
- Venue image
- Name
- Rating
- Karma discount badge
- Price level
- Distance
- Tap action

### 3.5 Animations
| Feature | Status | Library |
|---------|--------|---------|
| Typing indicator dots | ✅ | Moti |
| Message appear animation | ✅ | Reanimated |
| Card slide-in | ✅ | Reanimated |
| Coin celebration | ✅ | Lottie |
| Haptic feedback | ✅ | expo-haptics |

### 3.6 Empty State
| Feature | Status | Implementation |
|---------|--------|----------------|
| Logo display | ✅ | Gradient background |
| Personalized greeting | ✅ | "Hey [Name]!" |
| Suggestion chips | ✅ | 4 quick actions |
| Mode toggle | ✅ | Sparkle icon |

### 3.7 Location Integration
| Feature | Status | Implementation |
|---------|--------|----------------|
| Request location permission | ✅ | `expo-location` |
| Include location in chat | ✅ | Attach to message |
| Location-aware recommendations | ✅ | Backend filtering |
| Distance display | ✅ | "2.5 km away" |

### 3.8 Voice Input
| Feature | Status | Priority |
|---------|--------|----------|
| Microphone button | ❌ MISSING | P1 |
| Speech-to-text | ❌ MISSING | P1 |
| Voice message playback | ❌ MISSING | P2 |
| Waveform visualization | ❌ MISSING | P3 |

---

## 4. STYLE ADVISOR

### 4.1 Mode Toggle
| Feature | Status | Implementation |
|---------|--------|----------------|
| Toggle button on empty state | ✅ | Sparkle icon |
| General/Style Advisor mode | ✅ | State toggle |
| Visual indicator | ✅ | Icon change |

### 4.2 Style Actions
| Feature | Status | Example |
|---------|--------|---------|
| "I'm bored" | ✅ | Recommendation response |
| "I'm hungry" | ✅ | Food venues |
| "Suggest something romantic" | ✅ | Date venues |
| "Need to relax" | ✅ | Spa/wellness |

### 4.3 Personalization
| Feature | Status | Source |
|---------|--------|--------|
| Based on user's vibe preferences | ✅ | Onboarding data |
| Based on cuisine preferences | ✅ | Onboarding data |
| Based on occasion preferences | ✅ | Onboarding data |
| Learning from behavior | ✅ | REZ Mind |

### 4.4 Chat Enhancements
| Feature | Status | Implementation |
|---------|--------|----------------|
| Style-focused quick actions | ✅ | Contextual chips |
| Personalized greeting with name | ✅ | Dynamic text |
| Mood-based suggestions | ✅ | Mood selector |

---

## 5. DISCOVERY/EXPLORE

### 5.1 Search
| Feature | Status | Implementation |
|---------|--------|----------------|
| Search input field | ✅ | `SearchBar` component |
| Real-time search | ✅ | Debounced API call |
| Search history | ✅ | Local storage |
| Category filtering | ✅ | Chip selection |
| Location-based results | ✅ | GPS + API |
| Voice search | ❌ MISSING | P1 |
| Image search | ❌ MISSING | P3 |

### 5.2 Categories
| Feature | Status | Icon |
|---------|--------|------|
| Restaurants | ✅ | 🍽️ |
| Cafes | ✅ | ☕ |
| Trials | ✅ | 🎨 |
| Spa & Wellness | ✅ | 💆 |
| Events | ✅ | 🎉 |
| Fitness | ✅ | 💪 |
| Hotels | ❌ MISSING | P2 |
| Salons | ❌ MISSING | P2 |

### 5.3 Mood-Based Discovery
| Feature | Status | Implementation |
|---------|--------|----------------|
| Mood chips (horizontal scroll) | ✅ | `MoodSelector` |
| I'm bored | ✅ | Venue suggestions |
| Celebrate | ✅ | Event venues |
| Relax | ✅ | Spa venues |
| Adventure | ✅ | Activity venues |
| Date Night | ✅ | Romantic venues |
| Mood-based recommendations | ✅ | AI-powered |

### 5.4 Trending
| Feature | Status | Implementation |
|---------|--------|----------------|
| Trending venues section | ✅ | API data |
| Trending badge | ✅ | 🔥 icon |
| Karma discount display | ✅ | Badge |
| Trend score | ✅ | AI prediction |

### 5.5 Nearby
| Feature | Status | Implementation |
|---------|--------|----------------|
| Location-based nearby venues | ✅ | GPS |
| Distance display | ✅ | "500m" |
| Map view | ❌ MISSING | P2 |
| MapPin indicator | ✅ | Icon |

### 5.6 Entity Cards
| Feature | Status | Fields |
|---------|--------|--------|
| Image placeholder | ✅ | Gradient bg |
| Name and type | ✅ | Text |
| Rating display | ✅ | ⭐ 4.5 |
| Karma discount badge | ✅ | 💎 10% |
| Price level indicator | ✅ | ₹₹₹ |
| Distance | ✅ | 2.5 km |
| Tap to view details | ✅ | Navigation |

### 5.7 AI-Powered Features
| Feature | Status | Service |
|---------|--------|---------|
| Trend predictions | ✅ | REZ Mind |
| Category-based trends | ✅ | API |
| Peak time predictions | ✅ | AI model |
| Demand forecasting | ✅ | REZ Mind |

---

## 6. FOR YOU SECTION

### 6.1 Personalized Recommendations
| Feature | Status | Source |
|---------|--------|--------|
| Based on vibes preferences | ✅ | Onboarding |
| Based on cuisines | ✅ | Onboarding |
| Based on occasions | ✅ | Onboarding |
| Collaborative filtering | ✅ | REZ Mind |
| Content-based filtering | ✅ | REZ Mind |

### 6.2 Dynamic Sections
| Feature | Status | Content |
|---------|--------|---------|
| Cuisine-based recommendations | ✅ | Per cuisine |
| Romantic spots for date night | ✅ | Date occasion |
| Relaxation venues | ✅ | Relax occasion |
| Trendy spots | ✅ | Vibe match |

### 6.3 UI Components
| Feature | Status | Component |
|---------|--------|-----------|
| Heart icon indicator | ✅ | `FavoriteButton` |
| Horizontal scroll cards | ✅ | `FlatList` horizontal |
| Tap to explore | ✅ | Navigation |
| Pull to refresh | ✅ | `RefreshControl` |

---

## 7. BOOKING

### 7.1 Booking Detail View
| Feature | Status | Implementation |
|---------|--------|----------------|
| Venue image | ✅ | Full width |
| Venue name and type | ✅ | Header |
| Address display | ✅ | MapPin icon |
| Date and time | ✅ | Calendar icon |
| Party size | ✅ | Users icon |
| Confirmation code | ✅ | Monospace text |
| Status badge | ✅ | Color-coded |
| Karma discount display | ✅ | Badge |
| Coins earned badge | ✅ | Gold badge |
| Notes/special requests | ❌ MISSING | P2 |

### 7.2 Booking Actions
| Feature | Status | Implementation |
|---------|--------|----------------|
| Show QR Code | ✅ | Modal |
| Share booking | ✅ | Share sheet |
| Get Directions | ✅ | Maps integration |
| Call Venue | ✅ | Tel: link |
| Add to Calendar | ✅ | Calendar app |
| Reschedule | ✅ | Date picker |
| Cancel Booking | ✅ | Confirmation dialog |

### 7.3 QR Code
| Feature | Status | Implementation |
|---------|--------|----------------|
| Modal overlay | ✅ | Full screen |
| QR code display | ✅ | `react-native-qrcode-svg` |
| Tap to dismiss | ✅ | Close button |
| Confirmation code text | ✅ | Copy button |
| Brightness boost | ❌ MISSING | P2 |

### 7.4 Cancellation
| Feature | Status | Implementation |
|---------|--------|----------------|
| Confirmation dialog | ✅ | Alert |
| Reason selection | ✅ | Picker |
| Haptic feedback | ✅ | Success haptic |
| Navigate back | ✅ | Go back |
| Cancellation policy display | ❌ MISSING | P2 |

### 7.5 External Integrations
| Feature | Status | Implementation |
|---------|--------|----------------|
| Google Maps (Android) | ✅ | Linking |
| Apple Maps (iOS) | ✅ | Linking |
| Tel: links | ✅ | Linking |
| Calendar integration | ✅ | `expo-calendar` |

### 7.6 Booking States
| Status | Color | Description |
|--------|-------|-------------|
| pending | Yellow | Awaiting confirmation |
| confirmed | Green | Confirmed |
| completed | Blue | Completed |
| cancelled | Red | Cancelled |
| no_show | Gray | No show |

---

## 8. WALLET

### 8.1 Balance Display
| Feature | Status | Implementation |
|---------|--------|----------------|
| Coin balance | ✅ | Large number |
| Cash balance | ✅ | Secondary |
| Karma tier badge | ✅ | Icon + name |
| Multiplier display | ✅ | "2x coins" |

### 8.2 Karma Tier System
| Tier | Min Points | Color | Benefits |
|------|-----------|-------|-----------|
| Bronze | 0 | #CD7F32 | 1x coins |
| Silver | 1,000 | #C0C0C0 | 1.5x coins |
| Gold | 5,000 | #FFD700 | 2x coins |
| Platinum | 20,000 | #E5E4E2 | 3x coins |

| Feature | Status | Implementation |
|---------|--------|----------------|
| Progress bar | ✅ | Visual bar |
| Points to next tier | ✅ | Calculation |
| Benefits display | ✅ | Tier info |

### 8.3 Quick Actions
| Feature | Status | Implementation |
|---------|--------|----------------|
| Earn coins | ⚠️ COMING SOON | Alert |
| Redeem | ⚠️ COMING SOON | Alert |
| Gift Coins | ✅ | Navigation |
| Get Gold | ✅ | Info screen |
| View Badges | ✅ | Badge gallery |
| History | ⚠️ COMING SOON | Alert |

### 8.4 Transaction History
| Feature | Status | Fields |
|---------|--------|--------|
| Recent transactions list | ✅ | ScrollView |
| Transaction type icons | ✅ | Icon mapping |
| Amount display | ✅ | +/- formatting |
| Timestamp | ✅ | Relative time |
| Reason/description | ✅ | Text |

### 8.5 Transaction Types
| Type | Icon | Color |
|------|------|-------|
| earned | 💰 | Green |
| spent | 🛒 | Red |
| bonus | 🎁 | Gold |
| refund | ↩️ | Blue |
| gift_sent | 🎁 | Red |
| gift_received | 🎁 | Green |

---

## 9. PROFILE

### 9.1 Profile Header
| Feature | Status | Implementation |
|---------|--------|----------------|
| Avatar display | ✅ | Circle image |
| Name display | ✅ | Large text |
| Phone number | ✅ | Masked |
| Karma stats | ✅ | Points + Bookings |
| Edit button | ✅ | Navigation |

### 9.2 Recent Bookings
| Feature | Status | Limit |
|---------|--------|-------|
| Last bookings display | ✅ | 3 |
| Tap to view detail | ✅ | Navigation |
| Empty state | ✅ | "No bookings yet" |
| View all bookings | ❌ MISSING | P2 |

### 9.3 Statistics
| Feature | Status | Display |
|---------|--------|---------|
| Karma points | ✅ | Number + tier |
| Bookings count | ✅ | Number |
| Total spent | ❌ MISSING | P2 |
| Favorite category | ❌ MISSING | P3 |

### 9.4 Settings Links
| Feature | Status | Route |
|---------|--------|-------|
| Notifications | ✅ | `/settings/notifications` |
| Addresses | ✅ | `/settings/addresses` |
| Edit Profile | ✅ | `/settings/edit-profile` |
| Haptic Feedback | ✅ | Toggle |
| Sound Effects | ✅ | Toggle |

### 9.5 Account
| Feature | Status | Implementation |
|---------|--------|----------------|
| Help & Support | ✅ | Link |
| Privacy Policy | ✅ | Link |
| Terms of Service | ✅ | Link |
| Sign Out | ✅ | Confirmation + clear |

---

## 10. SETTINGS

### 10.1 Notifications Settings
| Feature | Status | Storage |
|---------|--------|---------|
| Push Notifications toggle | ✅ | API |
| Booking Reminders toggle | ✅ | API |
| Wallet Updates toggle | ✅ | API |
| Deals & Offers toggle | ✅ | API |
| Karma Updates toggle | ✅ | API |
| Chat Messages toggle | ✅ | API |
| Haptic Feedback toggle | ✅ | Local |
| Sound Effects toggle | ✅ | Local |
| Save feedback | ✅ | Toast |

### 10.2 Address Management
| Feature | Status | Implementation |
|---------|--------|----------------|
| List saved addresses | ✅ | FlatList |
| Default address badge | ✅ | Star icon |
| Add new address | ✅ | Form modal |
| Edit address | ✅ | Same form |
| Delete address | ✅ | Swipe + confirm |
| Set as default | ✅ | Star button |
| Label selection | ✅ | Home/Office/Other |
| Form validation | ✅ | Zod schemas |

### 10.3 Edit Profile
| Feature | Status | Fields |
|---------|--------|--------|
| Avatar change | ✅ | Camera/Gallery |
| Name editing | ✅ | Text input |
| Email editing | ✅ | Text input |
| Bio editing | ✅ | Text area |
| Save to backend | ✅ | API call |
| Cancel option | ✅ | Discard changes |

---

## 11. COMPLAINTS

### 11.1 List View
| Feature | Status | Implementation |
|---------|--------|----------------|
| Complaint list | ✅ | FlatList |
| Status badge | ✅ | Color-coded |
| Type display | ✅ | Text |
| Date | ✅ | Timestamp |
| Empty state | ✅ | Illustration |

### 11.2 Create Complaint
| Feature | Status | Validation |
|---------|--------|------------|
| Type selection | ✅ | Picker |
| Description input | ✅ | Text area |
| Order ID (optional) | ✅ | Text input |
| Submit button | ✅ | Loading state |
| Success feedback | ✅ | Toast + redirect |

### 11.3 Complaint Types
| Type | Icon | Description |
|------|------|-------------|
| booking_issue | 📅 | Booking problems |
| payment_issue | 💳 | Payment errors |
| service_issue | 😞 | Poor service |
| other | 💬 | Other issues |

### 11.4 Status Tracking
| Status | Color | Description |
|--------|-------|-------------|
| registered | Blue | Received |
| investigating | Yellow | Under review |
| resolved | Green | Fixed |
| escalated | Orange | Escalated |
| closed | Gray | Closed |

---

## 12. REFUNDS

### 12.1 List View
| Feature | Status | Fields |
|---------|--------|--------|
| Refund list | ✅ | FlatList |
| Status badge | ✅ | Color-coded |
| Amount display | ✅ | Currency |
| Date | ✅ | Timestamp |
| Empty state | ✅ | Illustration |

### 12.2 Refund Status
| Status | Color | Description |
|--------|-------|-------------|
| submitted | Blue | Submitted |
| under_review | Yellow | Being reviewed |
| resolved | Green | Refund issued |
| escalated | Orange | Escalated |
| closed | Gray | Closed |

### 12.3 Request Refund
| Feature | Status | Implementation |
|---------|--------|----------------|
| Navigate to complaints | ✅ | Same flow |
| Contact support | ✅ | Link |

---

## 13. NOTIFICATIONS

### 13.1 Permission Handling
| Feature | Status | Implementation |
|---------|--------|----------------|
| Request on first launch | ✅ | `Notifications.requestPermissionsAsync()` |
| Permission denied handling | ✅ | Settings redirect |
| Settings redirect option | ✅ | ` Linking.openSettings()` |

### 13.2 Token Management
| Feature | Status | Implementation |
|---------|--------|----------------|
| Get Expo push token | ✅ | `Notifications.getExpoPushTokenAsync()` |
| Register to backend | ✅ | API call |
| Unregister on logout | ✅ | API call |
| Token refresh handling | ✅ | App state listener |

### 13.3 Categories
| Category | Icon | Description |
|----------|------|-------------|
| booking | 📅 | Booking updates |
| wallet | 💰 | Wallet changes |
| deals | 🎁 | Deals & offers |
| chat | 💬 | Chat messages |

### 13.4 Action Handlers
| Feature | Status | Implementation |
|---------|--------|----------------|
| Tap to navigate | ✅ | Deep linking |
| Dismiss action | ✅ | Clear |
| View action | ✅ | Navigate |

---

## 14. PUSH NOTIFICATIONS

### 14.1 Notification Templates
| Template | Title | Body |
|---------|-------|------|
| Booking confirmed | 🎉 Booking Confirmed! | Your table at [Venue] is confirmed |
| Booking reminder | ⏰ Reminder | Your booking at [Venue] is in 1 hour |
| Coins earned | 💰 Coins Earned! | You earned [X] coins |
| Coins spent | 🛒 Coins Used | [X] coins deducted |
| Karma upgrade | 🎊 Level Up! | You're now [Tier]! |
| Deal of the day | 🎁 Special Offer | [X]% off at [Venue] |

### 14.2 Actions
| Action | Icon | Behavior |
|--------|------|----------|
| view | 👀 | Navigate to content |
| dismiss | ✖️ | Clear notification |
| claim | 🎁 | Claim offer |

### 14.3 Badge Management
| Feature | Status | Implementation |
|---------|--------|----------------|
| Set badge count | ✅ | `setBadgeCountAsync()` |
| Clear on app open | ✅ | AppState listener |

---

## 15. REAL-TIME FEATURES

### 15.1 WebSocket Connection
| Feature | Status | Implementation |
|---------|--------|----------------|
| Connect on auth | ✅ | Store subscription |
| Disconnect on logout | ✅ | Cleanup |
| Auto-reconnect | ✅ | Exponential backoff |
| Token-based auth | ✅ | Header |
| Session ID | ✅ | Query param |

### 15.2 Message Types
| Type | Direction | Purpose |
|------|-----------|---------|
| send_message | Client → Server | User message |
| bot_response | Server → Client | Do response |
| typing_start | Client → Server | User typing |
| typing_stop | Client → Server | Stop typing |
| typing_indicator | Server → Client | Do typing |
| heartbeat | Both | Keep alive |
| error | Server → Client | Error info |

### 15.3 Connection States
| State | Behavior |
|-------|----------|
| connecting | Show indicator |
| connected | Green dot |
| reconnecting | Yellow dot |
| disconnected | Red dot + retry |

---

## 16. REZ MIND INTEGRATION

### 16.1 Services Connected
| Service | Port | Purpose |
|---------|------|---------|
| Intent Graph | 4018 | Intent prediction |
| User Intelligence | 4120 | User profile |
| Agent Orchestrator | 4062 | AI agents |
| Campaign Service | 4055 | Nudges |

### 16.2 API Client
| Method | Purpose |
|--------|---------|
| `captureIntent()` | Track user intent |
| `checkDormancy()` | Dormancy detection |
| `triggerRevival()` | Send revival nudge |
| `getRecommendations()` | Personalization |
| `getBehavioralProfile()` | User segments |
| `updatePreferences()` | Sync preferences |

### 16.3 Error Handling
| Strategy | Implementation |
|----------|----------------|
| Graceful fallback | Return mock data |
| Console warnings | Dev logging |
| Non-blocking | Async/await |
| Retry logic | 3 attempts |

---

## 17. INTENT TRACKING

### 17.1 Events Tracked
| Event | Properties |
|-------|------------|
| `app_open` | timestamp, version, platform |
| `app_close` | timestamp, duration |
| `chat_message` | message_type, intent |
| `entity_view` | entity_id, entity_type |
| `entity_save` | entity_id |
| `search` | query, filters, results_count |
| `booking_start` | entity_id |
| `booking_complete` | entity_id, amount |
| `booking_cancelled` | entity_id, reason |
| `payment_success` | amount, method |
| `wallet_transaction` | type, amount |
| `profile_view` | - |
| `style_preferences_set` | preferences |
| `onboarding_complete` | - |

### 17.2 Batch Processing
| Feature | Setting |
|---------|---------|
| Queue type | In-memory array |
| Flush interval | 5 seconds |
| Priority events | Immediate |
| Max batch size | 50 |
| Retry on failure | 3 attempts |

---

## 18. DORMANCY DETECTION

### 18.1 Dormancy Levels
| Level | Days Inactive | Color |
|-------|---------------|-------|
| active | 0-3 days | Green |
| warming | 4-6 days | Yellow |
| at_risk | 7-13 days | Orange |
| dormant | 14-29 days | Red |
| lapsed | 30+ days | Gray |

### 18.2 Revival Triggers
| Level | Strategy |
|-------|----------|
| at_risk | Single push notification |
| dormant | Push + Email + Offer |
| lapsed | Multi-channel + Special offer |

### 18.3 Automated Monitoring
| Frequency | Target Audience |
|-----------|-----------------|
| Every 6 hours | at_risk users |
| Every 12 hours | dormant users |
| Daily | lapsed users |

---

## 19. NUGE ENGINE

### 19.1 Nudge Types
| Type | Trigger | Channel |
|------|---------|---------|
| dormancy | 7+ days inactive | Push |
| trend | Trending venue nearby | Push |
| personalized | Based on preferences | Push |
| social | Friend activity | Push |
| urgency | Limited time offer | Push |
| weather | Rainy day | Push |

### 19.2 Nudge Components
| Component | Purpose |
|-----------|---------|
| `NudgeBanner` | Top banner |
| `NudgeList` | List view |
| `InlineNudgeCard` | Inline card |
| `NudgeModal` | Full screen |

### 19.3 Context Factors
| Factor | Weight |
|--------|--------|
| Time of day | 0.2 |
| Day of week | 0.15 |
| Weather | 0.15 |
| Location | 0.25 |
| History | 0.25 |

---

## 20. ATTRIBUTION TRACKING

### 20.1 Touchpoints
| Touchpoint | Description |
|------------|-------------|
| nudge_shown | Nudge displayed |
| nudge_clicked | Nudge tapped |
| nudge_dismissed | Nudge swiped away |
| conversion | Booking made |

### 20.2 Attribution Models
| Model | Description |
|-------|-------------|
| Last Click | Credit to last touchpoint |
| First Click | Credit to first touchpoint |
| Linear | Equal credit to all |
| Time Decay | More credit to recent |
| Position Based | 40% first, 20% last, 40% middle |

### 20.3 Metrics
| Metric | Calculation |
|--------|-------------|
| Impressions | Count of shown nudges |
| Clicks | Count of clicked nudges |
| CTR | clicks / impressions |
| Conversions | Bookings from nudges |
| Conversion Rate | conversions / clicks |
| Revenue | Sum of booking amounts |
| ROAS | Revenue / Cost |

---

## 21. PREDICTIVE SCORING

### 21.1 Churn Risk Model
| Output | Range | Description |
|--------|-------|-------------|
| score | 0-1 | Probability of churn |
| level | low/medium/high | Risk level |
| factors | array | Contributing factors |

**Factors:**
- Days since last booking
- Frequency drop
- Engagement decline
- Competitor usage
- Payment failures

### 21.2 LTV Prediction
| Output | Description |
|--------|-------------|
| ltv_amount | Predicted lifetime value |
| tier | standard/premium/vip |
| confidence | 0-1 confidence score |
| predictions_for | Next 30/60/90 days |

### 21.3 Booking Probability
| Output | Description |
|--------|-------------|
| entity_id | Specific venue |
| probability | 0-1 |
| confidence | 0-1 |
| factors | Why prediction |

---

## 22. AI AGENTS

### 22.1 User Intelligence Agents (15)
| Agent | Purpose |
|-------|---------|
| PersonalizationAgent | Tailor recommendations |
| SegmentClassifierAgent | Classify user segments |
| RecommendationQualityAgent | Evaluate recommendations |
| EngagementScoreAgent | Calculate engagement |
| SessionAnalyzerAgent | Analyze sessions |
| SearchIntentAgent | Understand search intent |
| BrowsePatternAgent | Analyze browsing |
| PurchasePredictorAgent | Predict purchases |
| AbandonmentDetectorAgent | Detect abandonment |
| RetentionTriggerAgent | Trigger retention |
| WinBackAgent | Win back lapsed users |
| ReferralPotentialAgent | Identify referrers |
| SurveyTriggerAgent | Trigger surveys |
| FeedbackAnalyzerAgent | Analyze feedback |
| NPSPredictorAgent | Predict NPS |

### 22.2 Commerce Agents (15)
| Agent | Purpose |
|-------|---------|
| DemandSignalAgent | Track demand signals |
| ScarcityAgent | Monitor scarcity |
| PriceElasticityAgent | Analyze pricing |
| ReorderPredictorAgent | Predict reorders |
| TasteEvolutionAgent | Track taste changes |
| ChurnRiskAgent | Predict churn |
| LTVPredictorAgent | Calculate LTV |
| InventoryAlertAgent | Alert low stock |
| DemandForecastAgent | Forecast demand |
| CompetitorMonitorAgent | Monitor competitors |
| TrendDetectorAgent | Detect trends |
| PriceOptimizerAgent | Optimize pricing |
| OfferMatcherAgent | Match offers |
| CrossSellAgent | Suggest cross-sells |
| UrgencyTriggerAgent | Create urgency |

### 22.3 Autonomous Agents (8)
| Agent | Purpose |
|-------|---------|
| DemandSignal | Aggregate demand |
| Scarcity | Supply monitoring |
| Personalization | Real-time personalization |
| Attribution | Track conversions |
| AdaptiveScoring | Dynamic scoring |
| FeedbackLoop | Learn from feedback |
| NetworkEffect | Network analysis |
| RevenueAttribution | Attribute revenue |

---

## 23. SECURITY

### 23.1 Authentication Security
| Feature | Implementation |
|---------|----------------|
| JWT validation | Verify signature |
| Token expiration | Check `exp` claim |
| Refresh token rotation | New refresh on use |
| Secure storage | MMKV encrypted |

### 23.2 Rate Limiting
| Endpoint | Limit | Window |
|----------|-------|--------|
| /auth/send-otp | 3 | per hour |
| /auth/verify-otp | 5 | per hour |
| /chat/message | 60 | per minute |
| /search | 30 | per minute |
| General | 100 | per minute |

### 23.3 Input Validation
| Field | Validation |
|-------|------------|
| phone | Indian mobile regex |
| otp | 4 digits |
| amount | Positive number |
| name | 2-50 chars |
| email | Email format |

### 23.4 WebSocket Security
| Feature | Implementation |
|---------|----------------|
| Token in handshake | Query param |
| Heartbeat | 30s ping/pong |
| Max connections | 1 per user |
| Message size | Max 10KB |

---

## 24. OFFLINE SUPPORT

### 24.1 Cached Data
| Data | TTL | Storage |
|------|-----|---------|
| User profile | 1 hour | MMKV |
| Wallet state | 5 minutes | MMKV |
| Chat history | 24 hours | MMKV |
| Preferences | 1 week | MMKV |
| Recent searches | 1 week | MMKV |

### 24.2 Offline Capabilities
| Feature | Status |
|---------|--------|
| View cached profile | ✅ |
| View cached wallet | ✅ |
| View cached chat | ✅ |
| Compose message | ✅ (Queue) |
| Search (cached) | ✅ |
| Bookings list | ✅ (Cached) |

### 24.3 Offline Queue
| Feature | Implementation |
|---------|----------------|
| Message queue | Array in MMKV |
| Sync on reconnect | Background sync |
| Conflict resolution | Last write wins |
| Max queue size | 100 items |

### 24.4 Sync Status
| Status | UI |
|--------|---|
| synced | Green checkmark |
| syncing | Spinner |
| pending | Yellow dot |
| failed | Red dot + retry |

---

## 25. NAVIGATION

### 25.1 Route Structure
```
├── (tabs)
│   ├── index (Chat)
│   ├── explore
│   ├── wallet
│   └── profile
├── onboarding
├── auth
├── booking/[id]
├── complaints
├── refunds
└── settings/
    ├── notifications
    ├── addresses
    └── edit-profile
```

### 25.2 Animations
| Transition | Animation |
|------------|------------|
| Tab switch | Fade |
| Push | Slide from right |
| Modal | Slide from bottom |
| Dismiss | Slide down |

### 25.3 Deep Linking
| Scheme | Example |
|--------|---------|
| do:// | Universal |
| https://do.rez.money | Web |

---

## 26. MISSING FEATURES

### P0 - Critical
| Feature | Description |
|---------|-------------|
| Biometric Auth | Face ID / Touch ID |
| Voice Input | Speech to text |

### P1 - High Priority
| Feature | Description |
|---------|-------------|
| Voice Input | "Hey Do..." wake word |
| Deep Linking | do://chat scheme |
| Map View | Explore on map |
| Full Booking History | View all bookings |

### P2 - Medium Priority
| Feature | Description |
|---------|-------------|
| Character Counter | In chat input |
| Draft Saving | Auto-save drafts |
| Cancellation Policy | Display policy |
| Hotels Category | Add hotels |
| Salons Category | Add salons |
| Brightness Boost | QR code brightness |

### P3 - Nice to Have
| Feature | Description |
|---------|-------------|
| Image Search | Search by image |
| AR Preview | AR venue preview |
| NFC Tap | NFC interactions |
| Apple Watch | Watch app |
| Widgets | Home screen widgets |

---

## 27. RECOMMENDATIONS

### 27.1 Immediate (This Week)
1. **Upgrade Expo SDK 52 → 53** (Security)
2. **Add Biometric Auth** (Security)
3. **Implement Voice Input** (UX)

### 27.2 Short Term (This Month)
1. **Deep Linking Configuration**
2. **Map View for Explore**
3. **Full Booking History**
4. **Character Counter**

### 27.3 Medium Term (This Quarter)
1. **Apple Watch App**
2. **Home Screen Widgets**
3. **Siri Shortcuts**
4. **Advanced Offline Mode**

### 27.4 Long Term (This Year)
1. **AR Venue Preview**
2. **NFC Interactions**
3. **Social Features**
4. **Video Chat**

---

## METRICS SUMMARY

| Metric | Current |
|--------|---------|
| Screens | 16 |
| Routes | 14 |
| AI Agents | 38 |
| TypeScript Files | 113 |
| Features Implemented | 200+ |
| API Endpoints | 8 |
| WebSocket Events | 7 |
| Notification Templates | 6 |
| Karma Tiers | 4 |
| Booking States | 5 |
| Complaint States | 5 |
| Dormancy Levels | 5 |

---

*Last Updated: June 1, 2026*
*Version: 1.0.0*

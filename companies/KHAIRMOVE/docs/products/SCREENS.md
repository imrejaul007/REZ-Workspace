# KHAIRMOVE - Complete Screens Inventory

**Last Updated:** June 12, 2026
**Version:** 1.0.0

---

## 📱 Mobile Apps Overview

| App | Platform | Location | Screens | Status |
|-----|----------|----------|---------|--------|
| khaimove-user-app | Expo | `khaimove-user-app/` | 5 | ✅ |
| khaimove-driver-app | Expo | `khaimove-driver-app/` | 2 | ⚠️ Partial |
| khaimove-admin-dashboard | Next.js | `khaimove-admin-dashboard/` | 3 | ⚠️ Partial |
| airzy-mobile | Expo | `airzy/apps/mobile/` | 11 | ✅ |
| rider-circle-app | Expo | `rider-circle/rider-circle-app/` | 10+ | ✅ |

---

## 1. KHAIRMOVE User App

**Location:** `/khaimove-user-app/`
**Port:** Expo (development)

### Screens

| Screen | File | Description |
|--------|------|-------------|
| Home | `HomeScreen.tsx` | Main dashboard with vehicle selection |
| Ride | `RideScreen.tsx` | Ride booking flow |
| Tracking | `TrackingScreen.tsx` | Real-time ride tracking |
| History | `HistoryScreen.tsx` | Past rides |
| Profile | `ProfileScreen.tsx` | User profile & settings |

### Navigation
- `AppNavigator.tsx` - Main navigation

### Components
- `components/` - Reusable UI components

### Missing Screens
- [ ] Login/OTP Screen
- [ ] Payment Screen
- [ ] Help/Support Screen
- [ ] Notification Screen
- [ ] Settings Screen
- [ ] Referral Screen

---

## 2. KHAIRMOVE Driver App

**Location:** `/khaimove-driver-app/`
**Port:** Expo (development)

### Screens

| Screen | File | Description |
|--------|------|-------------|
| Dashboard | `DriverDashboard.tsx` | Earnings, stats, status |
| Ride Request | `RideRequestScreen.tsx` | Accept/reject rides |

### Missing Screens
- [ ] Login/OTP Screen
- [ ] Profile Screen
- [ ] Earnings Screen
- [ ] History Screen
- [ ] Vehicle Screen
- [ ] Help/Support Screen
- [ ] Settings Screen
- [ ] Document Upload Screen
- [ ] Notification Screen

---

## 3. KHAIRMOVE Admin Dashboard

**Location:** `/khaimove-admin-dashboard/`
**Port:** Next.js

### Pages

| Page | File | Description |
|------|------|-------------|
| Dashboard | `Dashboard.tsx` | Stats overview |
| Operations | `Operations.tsx` | Daily operations |

### Missing Pages
- [ ] Login Page
- [ ] Users Management
- [ ] Drivers Management
- [ ] Rides Management
- [ ] Earnings Reports
- [ ] Heatmaps
- [ ] Settings

---

## 4. Airzy Mobile App

**Location:** `/airzy/apps/mobile/`
**Port:** Expo

### Screens

| Screen | File | Description |
|--------|------|-------------|
| Home | `HomeScreen.tsx` | Dashboard with flight/lounge info |
| Flights | `FlightsScreen.tsx` | Flight search & booking |
| Flight Search | `FlightSearchScreen.tsx` | Search filters |
| Flight Details | `FlightDetailsScreen.tsx` | Flight info |
| Lounge Search | `LoungeSearchScreen.tsx` | Lounge discovery |
| Lounge Details | `LoungeDetailsScreen.tsx` | Lounge info |
| Itinerary | `ItineraryScreen.tsx` | Trip planning |
| Itinerary Details | `ItineraryDetailsScreen.tsx` | Trip details |
| Wallet | `WalletScreen.tsx` | Airzy coins & membership |
| Login | `LoginScreen.tsx` | OTP login |
| Settings | `SettingsScreen.tsx` | App settings |

### Navigation
- `App.tsx` - Main app entry

### Missing Screens
- [ ] Hotel Search Screen
- [ ] Hotel Details Screen
- [ ] Transfer Booking Screen
- [ ] Visa Assistant Screen
- [ ] Document Vault Screen
- [ ] Lounge Reviews Screen
- [ ] Notifications Screen
- [ ] Profile/Account Screen
- [ ] Corporate Travel Screen
- [ ] Gate Navigation Screen
- [ ] Dining Screen
- [ ] Social/Reviews Screen

---

## 5. Rider Circle App

**Location:** `/rider-circle/rider-circle-app/`
**Port:** Expo (Expo Router)

### Tabs (Bottom Navigation)

| Tab | File | Description |
|-----|------|-------------|
| Home | `app/(tabs)/index.tsx` | Dashboard |
| Ride | `app/(tabs)/ride.tsx` | Start ride, GPS |
| Community | `app/(tabs)/community.tsx` | Social feed |
| Discover | `app/(tabs)/discover.tsx` | Routes & POI |
| Profile | `app/(tabs)/profile.tsx` | Profile & settings |

### Auth Screens

| Screen | File | Description |
|--------|------|-------------|
| Landing | `app/index.tsx` | Welcome screen |
| Login | `app/auth/login.tsx` | Phone OTP |
| Signup | `app/auth/signup.tsx` | 2-step wizard |

### Ride Screens

| Screen | File | Description |
|--------|------|-------------|
| Active Ride | `app/ride/` | GPS tracking |
| Ride Stats | `app/ride/` | Current ride info |

### Community Screens

| Screen | File | Description |
|--------|------|-------------|
| Feed | `app/community/` | Social posts |
| Post Details | `app/community/` | Comments |

### Profile Screens

| Screen | File | Description |
|--------|------|-------------|
| My Bikes | `app/profile/` | Bike collection |
| Edit Profile | `app/profile/` | Settings |

### Genie Screens

| Screen | File | Description |
|--------|------|-------------|
| AI Chat | `app/genie.tsx` | Genie assistant |
| Genie Tab | `app/genie/` | Chat interface |

### SOS Screens

| Screen | File | Description |
|--------|------|-------------|
| SOS | `app/sos.tsx` | Emergency features |
| SOS Tab | `app/sos/` | Safety tools |

### Event Screens

| Screen | File | Description |
|--------|------|-------------|
| Events | `app/event/` | Community events |

### Group Screens

| Screen | File | Description |
|--------|------|-------------|
| Groups | `app/group/` | Rider groups |

### Missing Screens
- [ ] Bike Add/Edit Screen
- [ ] Bike Health Screen
- [ ] SOS Nearby List
- [ ] Route Create Screen
- [ ] Route Details Screen
- [ ] Leaderboard Screen
- [ ] Achievements Screen
- [ ] Settings Screen

---

## 6. Airzy Web App

**Location:** `/airzy/apps/web/`
**Port:** Next.js

### Missing Pages
- [ ] Home Page
- [ ] Flight Search Page
- [ ] Lounge Search Page
- [ ] Wallet Page
- [ ] Profile Page
- [ ] Booking Page

---

## 7. REZ Delivery UI

**Location:** `/rez-delivery-ui/`
**Port:** Vite/React

### Pages

| Page | Description |
|------|-------------|
| Tracking | Package tracking |
| Delivery | Delivery booking |

### Missing Pages
- [ ] Home Page
- [ ] Order Page
- [ ] History Page
- [ ] Profile Page

---

## Screen Completion Summary

| App | Total Screens | Complete | Missing |
|-----|---------------|----------|---------|
| khaimove-user-app | ~15 | 5 | 10 |
| khaimove-driver-app | ~12 | 2 | 10 |
| khaimove-admin-dashboard | ~10 | 2 | 8 |
| airzy-mobile | ~25 | 11 | 14 |
| rider-circle-app | ~20 | 10+ | 10 |
| airzy-web | ~10 | 0 | 10 |
| rez-delivery-ui | ~8 | 2 | 6 |
| **TOTAL** | **~100** | **~32** | **~68** |

---

## Priority Screens to Build

### P0 - Critical
1. **User App Login/OTP**
2. **Driver App Login/OTP**
3. **Admin Login**
4. **Airzy Hotel Screens**
5. **Rider Circle Bike Screens**

### P1 - High
1. **Airzy Transfer Booking**
2. **Airzy Notifications**
3. **Driver Earnings Screen**
4. **User Payment Screen**
5. **Admin Users/Drivers Management**

### P2 - Medium
1. **Airzy Visa/Documents**
2. **Airzy Gate Navigation**
3. **Airzy Dining**
4. **Airzy Social/Reviews**
5. **Rider Circle Leaderboard**

### P3 - Low
1. **Airzy Corporate Travel**
2. **Airzy Web Pages**
3. **Rider Circle Achievements**
4. **REZ Delivery Full UI**

---

**Last Updated:** June 12, 2026
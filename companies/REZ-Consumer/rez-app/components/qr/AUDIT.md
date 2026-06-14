# QR Scanner Phase II Implementation Audit

## Overview
This document tracks the implementation status of 4 new QR intents:
- Room Hub (`room-hub`)
- Menu QR (`menu-qr`)
- Rez Now (`rez-now`)
- Ad Campaign (`ad-campaign`)

---

## Implementation Status

### Payload Types (`utils/qr/qrPayload.ts`)

- [x] `RoomHubPayload` interface defined
- [x] `MenuQrPayload` interface defined
- [x] `RezNowPayload` interface defined
- [x] `AdCampaignPayload` interface defined
- [x] `UnifiedQrPayload` union type updated
- [x] `QrIntentKind` type updated
- [x] `validateRoomHub()` validator implemented
- [x] `validateMenuQr()` validator implemented
- [x] `validateRezNow()` validator implemented
- [x] `validateAdCampaign()` validator implemented
- [x] `parseQrPayload()` switch statement updated

### Intent Router (`utils/qr/qrIntentRouter.ts`)

- [x] `room-hub` route case implemented
- [x] `menu-qr` route case implemented
- [x] `rez-now` route case implemented
- [x] `ad-campaign` route case implemented

### Native Screens

- [x] `/app/room-service/[hotelId]/[roomId].tsx` created
  - Room header with hotel name and room number
  - Services grid (food, housekeeping, concierge, checkout)
  - Amenities list
  - Pull-to-refresh support
  - Error handling with retry
- [x] `/app/store/[storeSlug]/menu.tsx` created
  - Table banner for table-specific orders
  - Search functionality
  - Category filtering
  - Menu items with availability status
  - Popular item badges
  - Pull-to-refresh support
- [x] `/app/campaign/[campaignId].tsx` created
  - Reward display based on type
  - Claim button with authentication check
  - Share functionality
  - Terms and conditions display
  - Expiry date handling

### Deep Linking (`app.config.js`)

- [x] `eas.schemes` array updated with new domains
- [x] Android intent filter for `adsqr.rezapp.com` added
- [x] `now.rez.money` existing filter retained

### Tests (`utils/qr/__tests__/qrPayload.test.ts`)

- [x] Phase II intents added to happy path test matrix
- [x] `room-hub` validation tests (valid, optional fields, missing fields)
- [x] `menu-qr` validation tests (valid, optional fields, missing fields)
- [x] `rez-now` validation tests (valid, all page values, invalid page)
- [x] `ad-campaign` validation tests (valid, all reward types, invalid types, missing fields)
- [x] Phase II route tests added

---

## Verification Checklist

### All new payloads parse correctly
```typescript
// Run tests:
npm test -- --testPathPattern="qrPayload.test.ts"
```
- [ ] `room-hub` with all fields
- [ ] `room-hub` without optional fields
- [ ] `menu-qr` with table number
- [ ] `menu-qr` without table number
- [ ] `rez-now` with each page type
- [ ] `rez-now` without page
- [ ] `ad-campaign` with each reward type
- [ ] `ad-campaign` without optional fields

### All new routes navigate correctly
- [ ] `/room-service/hotel123/room456?token=...&checkIn=...&checkOut=...`
- [ ] `/store/my-restaurant/menu?tableNumber=5`
- [ ] `/store/my-venue?page=menu`
- [ ] `/campaign/campaign123?rewardType=discount`

### Deep links work on iOS
```bash
# Test via xcrun simctl
xcrun simctl openurl booted "rezapp://room-service/h1/r1?token=t1"
xcrun simctl openurl booted "rezapp://menu-qr/store123/my-restaurant?tableNumber=5"
xcrun simctl openurl booted "rezapp://rez-now/store123/my-venue"
xcrun simctl openurl booted "rezapp://ad-campaign/c123?rewardType=coins"
```

### Deep links work on Android
```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "rezapp://room-service/h1/r1?token=t1" money.rez.app
```

### Web fallback works
```bash
# Test URL resolution
curl "https://rezapp.com/room-service/h1/r1?token=t1"
curl "https://now.rez.money/menu-qr/store123/my-restaurant?tableNumber=5"
curl "https://adsqr.rezapp.com/campaign/c123"
```

### Error handling works
- [ ] Invalid room-hub payload shows error message
- [ ] Missing campaignId shows error message
- [ ] Invalid rewardType shows validation error
- [ ] Network errors show retry option

### Tests pass
```bash
npm test -- --testPathPattern="qrPayload.test.ts" --verbose
```
Expected output: All tests passing (including new Phase II tests)

---

## Edge Cases to Verify

1. **Empty strings**: All required string fields reject empty/whitespace strings
2. **Invalid enum values**: `page` and `rewardType` only accept predefined values
3. **Extra fields**: Extra fields in payload are ignored (not rejected)
4. **Case sensitivity**: Intent names are case-sensitive
5. **Version mismatch**: `v` must be exactly `1`; other values rejected
6. **Token validation**: Room hub token is required and must be non-empty

---

## Rollback Plan

If issues are found:

1. **Revert payload changes**: Remove Phase II interfaces and validators from `qrPayload.ts`
2. **Revert router changes**: Remove Phase II cases from `qrIntentRouter.ts`
3. **Revert config changes**: Remove new schemes from `app.config.js`
4. **Keep screens**: Screens can remain as standalone features (not connected to QR)
5. **Revert tests**: Remove Phase II test cases

---

## Notes

- All screens include `withErrorBoundary` wrapper for error handling
- API calls have fallback to mock data when backend unavailable
- Screens use existing design system constants for consistency
- All new screens follow expo-router conventions for dynamic routes

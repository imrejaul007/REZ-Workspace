# REZ Profile Service

**Purpose:** Static user profile data
**NOT:** Subscription tier (REE decides), wallet balance (Wallet Service)

---

## User Types Supported (All 7 Roles)

| Role | Examples |
|------|-----------|
| user | End users |
| consumer | App users |
| merchant | Store owners |
| admin | Platform admins |
| support | Support agents |
| operator | Backend operators |
| super_admin | Full access |

## Identity Segments (9 Types)

| Segment | Badge | Example |
|---------|-------|---------|
| normal | - | Default users |
| verified | ✓ | Phone/email verified |
| student | 🎓 | Student discount |
| pro | ⭐ | Pro subscription |
| creator | 🎬 | Content creator |
| business | 💼 | Corporate account |
| influencer | 🌟 | Influencer |
| host | 🎤 | Event host |
| vip | 👑 | VIP tier |

---

## Data Ownership

| Data | Owner |
|------|--------|
| name, avatar, bio | Profile Service |
| preferences | Profile Service |
| addresses | Profile Service |
| payment methods | Profile Service |
| **subscription tier** | **REE Service** |
| **coins, balance** | **Wallet Service** |
| **karma points** | **Gamification Service** |

---

## API Endpoints

```
GET  /profile/:userId        → Profile data
PATCH /profile/:userId        → Update profile
GET  /preferences/:userId    → Preferences
PATCH /preferences/:id       → Update prefs
GET  /addresses/:userId     → Addresses
POST  /addresses/:userId      → Add address
GET  /payment-methods/:userId → Payment methods
```

---

## Correct Architecture

```
App ─────────────────────────────┐
 │ │
 ├──── Profile ──────┬─────────┤
 │ │ │
 │ Profile Service │ │
 │ name, avatar │ │
 │ prefs, addresses │ │
 │ │
 ├─────────────────────┴─────────┤
 │ │
 ├──── Wallet ─────┬─────────────┤
 │ │ │
 │ Wallet Service │ │
 │ coins, balance │
 │
 ├──── REE ──────────┬──────────┤
 │ │ │
 │ Subscription tier │
 │ pricing, rules │
 │ discounts, offers │
 └──────────────────────┴──────────┘
```

---

**Profile Service = static data only
REE Service = subscription decisions
Wallet Service = balance decisions
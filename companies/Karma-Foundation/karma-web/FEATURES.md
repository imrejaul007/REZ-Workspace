# karma-web - Features & Pages

**Package:** karma-web  
**Framework:** Next.js 14 (App Router)  
**Purpose:** Consumer web application for Karma Foundation

---

## Pages Overview

### Consumer Pages

| Page | Route | Purpose | Status |
|------|-------|---------|--------|
| Home | `/karma/home` | Dashboard with karma overview | ✅ |
| My Karma | `/karma/my-karma` | Passport & earn history | ✅ |
| Explore | `/karma/explore` | Event discovery | ✅ |
| Event Detail | `/karma/event/[id]` | Event information | ✅ |
| Missions | `/karma/missions` | Available missions | ✅ |
| Micro Actions | `/karma/micro-actions` | Daily quick actions | ✅ |
| Leaderboard | `/karma/leaderboard` | Rankings | ✅ |
| Wallet | `/karma/wallet` | Karma coins | ✅ |
| Communities | `/karma/communities` | Cause communities | ✅ |
| Community Detail | `/karma/communities/[slug]` | Community feed | ✅ |

### Corporate Pages

| Page | Route | Purpose | Status |
|------|-------|---------|--------|
| Corporate | `/karma/corporate` | CSR overview | ✅ |
| Benefits | `/karma/corp/benefits` | Employee benefits | ✅ |
| Gifts | `/karma/corp/gifts` | Corporate gifts | ✅ |
| Hotels | `/karma/corp/hotels` | Partner hotels | ✅ |
| Wallet | `/karma/corp/wallet` | Corporate wallet | ✅ |

### Utility Pages

| Page | Route | Purpose | Status |
|------|-------|---------|--------|
| Lost Items | `/karma/lost-items` | Lost & found | ✅ |

---

## Page Details

### Home (`/karma/home`)

**Purpose:** Main dashboard showing karma overview

**Components:**
- Karma score card with level indicator
- Recent activity feed
- Upcoming events carousel
- Quick action buttons
- Leaderboard preview
- Community highlights

**API Calls:**
- `GET /api/karma/user/:userId`
- `GET /api/karma/score`
- `GET /api/karma/events?limit=5`
- `GET /api/karma/leaderboard?limit=5`

---

### My Karma (`/karma/my-karma`)

**Purpose:** Personal karma passport and history

**Components:**
- Karma passport with level badge
- Trust score gauge
- Karma history timeline
- Level progress bar
- Earned badges grid
- Conversion history list

**API Calls:**
- `GET /api/karma/user/:userId`
- `GET /api/karma/user/:userId/level`
- `GET /api/karma/user/:userId/history`
- `GET /api/karma/badges/my`

---

### Explore (`/karma/explore`)

**Purpose:** Discover events and activities

**Components:**
- Search bar with filters
- Category tabs (Education, Health, Environment, etc.)
- Event cards grid
- Map view toggle
- Date range filter
- Distance filter

**API Calls:**
- `GET /api/karma/events`
- `GET /api/karma/events/nearby`

---

### Event Detail (`/karma/event/[id]`)

**Purpose:** Detailed event information

**Components:**
- Event hero image
- Event title and description
- Date, time, location
- Karma multiplier badge
- NGO/organizer info
- Join button
- Participant count
- Reviews section

**API Calls:**
- `GET /api/karma/events/:id`
- `POST /api/karma/event/join`

---

### Missions (`/karma/missions`)

**Purpose:** Daily and weekly challenges

**Components:**
- Active missions list
- Mission progress indicators
- Mission categories
- Completion rewards
- Streak counter

**API Calls:**
- `GET /api/karma/missions`
- `POST /api/karma/missions/:id/complete`

---

### Micro Actions (`/karma/micro-actions`)

**Purpose:** Quick daily actions for karma

**Components:**
- Daily action cards
- Quick claim buttons
- Points preview
- Action history

**API Calls:**
- `GET /api/karma/micro-actions`
- `POST /api/karma/micro-actions/claim`

---

### Leaderboard (`/karma/leaderboard`)

**Purpose:** Rankings and competition

**Components:**
- Top 3 podium display
- Scrollable ranking list
- Time period filter (Weekly/Monthly/All-time)
- User rank highlight
- Karma score display

**API Calls:**
- `GET /api/karma/leaderboard`
- `GET /api/karma/leaderboard/me`

---

### Wallet (`/karma/wallet`)

**Purpose:** Karma coins management

**Components:**
- Coin balance card
- Transaction history
- Conversion button
- Redeem options

**API Calls:**
- `GET /api/karma/wallet/balance`
- `GET /api/karma/wallet/transactions`

---

### Communities (`/karma/communities`)

**Purpose:** Cause-based communities

**Components:**
- Community list
- Category filters
- Member count badges
- Join/Leave buttons
- Featured communities

**API Calls:**
- `GET /api/karma/communities`
- `GET /api/karma/communities/recommended`

---

### Community Detail (`/karma/communities/[slug]`)

**Purpose:** Community feed and details

**Components:**
- Community header
- Member count
- Post feed
- Create post button
- About section
- Related events

**API Calls:**
- `GET /api/karma/communities/:slug`
- `GET /api/karma/communities/:slug/feed`
- `POST /api/karma/communities/:slug/posts`

---

### Corporate (`/karma/corporate`)

**Purpose:** CSR program overview for companies

**Components:**
- CSR benefits overview
- Partner tier cards
- Case studies
- Contact form

---

### Corp Benefits (`/karma/corp/benefits`)

**Purpose:** Employee benefit programs

**Components:**
- Benefit categories
- Redemption options
- Balance display
- Usage history

---

### Corp Gifts (`/karma/corp/gifts`)

**Purpose:** Corporate gift catalog

**Components:**
- Gift categories
- Gift cards
- Bulk ordering
- Price filters

---

### Corp Hotels (`/karma/corp/hotels`)

**Purpose:** Partner hotel network

**Components:**
- Hotel listings
- Location map
- Partner benefits
- Booking integration

---

### Corp Wallet (`/karma/corp/wallet`)

**Purpose:** Corporate karma wallet

**Components:**
- Total balance
- Allocation history
- Employee distribution
- Budget tracking

---

### Lost Items (`/karma/lost-items`)

**Purpose:** Lost and found feature

**Components:**
- Report lost item form
- Found items list
- Search functionality
- Contact owner

---

## Components Library

### Core Components

| Component | Purpose | Status |
|-----------|---------|--------|
| KarmaCard | Display karma score | ✅ |
| LevelBadge | Show level indicator | ✅ |
| TrustGauge | Trust score visualization | ✅ |
| EventCard | Event listing card | ✅ |
| MissionCard | Mission display | ✅ |
| LeaderboardRow | Ranking entry | ✅ |
| CommunityCard | Community preview | ✅ |
| CoinBalance | Coin display | ✅ |
| ProgressBar | Level progress | ✅ |

### UI Components (shadcn/ui)

| Component | Status |
|-----------|--------|
| Button | ✅ |
| Card | ✅ |
| Input | ✅ |
| Dialog | ✅ |
| Tabs | ✅ |
| Avatar | ✅ |
| Badge | ✅ |
| Progress | ✅ |
| Skeleton | ✅ |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| NEXT_PUBLIC_API_URL | Yes | Karma API base URL |
| NEXT_PUBLIC_TOKEN_DERIV_SECRET | Yes | Token encryption secret |

---

## Deployment

| Platform | Status |
|----------|--------|
| Vercel | ✅ Configured |
| Custom Domain | karma.rez.money |

---

## Security Features

| Feature | Status | Description |
|---------|--------|-------------|
| Token Encryption | ✅ | AES-GCM with PBKDF2 |
| HTTPS Only | ✅ | Enforced by Vercel |
| CSP Headers | ✅ | Content Security Policy |
| Auth Guards | ✅ | Protected routes |

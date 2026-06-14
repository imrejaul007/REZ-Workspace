# Airzy - Premium Airport & Frequent Traveler Ecosystem

> **Tagline:** "Smart companion for frequent travelers"
> **Positioning:** "Premium airport lifestyle ecosystem"
> **Company:** KHAIRMOVE

Airzy is KHAIRMOVE's premium airport and frequent traveler ecosystem, built on the ReZ platform, REZ Intelligence, and RABTUL services.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                              AIRZY MOBILE APP (Expo)                           │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      AIRZY API GATEWAY (Port 4500)               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│  ┌─────────────────────────────────┼────────────────────────────────────┐  │
│  │                                 │                                    │  │
│  ▼                                 ▼                                    ▼        │
│ ┌─────────────────┐    ┌─────────────────────┐    ┌────────────────────┐ │
│ │   RABTUL       │    │    REZ INTELLIGENCE │    │    EXTERNAL       │ │
│ ├─────────────────┤    ├─────────────────────┤    ├────────────────────┤ │
│ │Auth 4002    ◄──┼───►│Intent 4018      ◄───┼────│Amadeus        ────┤ │
│ │Payment 4001  ◄──┼───►│Travel Expert 3003◄──┤    │DreamFolks     ────┤ │
│ │Wallet 4004   ◄──┼───►│Signal 4121     ◄───┤    │Priority Pass   ────┤ │
│ │Notify 4011   ◄──┼───►│Predictive 4123 ◄───┤    │                  │ │
│ │Profile 4013  ◄──┼───►│Care 4058      ◄───┤    │                  │ │
│ └─────────────────┘    └─────────────────────┘    └────────────────────┘ │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      AIRZY SERVICES (Ports 4501-4509)             │  │
│  ├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤  │
│  │ Flight │ Lounge  │Itinerary│ Wallet  │ AI Brain│ Hotel  │Transfer │  │
│  │  4501  │  4502   │  4503   │  4504   │  4505   │  4507   │  4508  │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──┘  │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    DATA FLOW (Airzy → Intelligence → DOOH)         │  │
│  │                                                                      │  │
│  │  Airzy Travelers ──► REZ Intelligence ──► REZ Media DOOH           │  │
│  │       │                    │                    │                        │  │
│  │       ▼                    ▼                    ▼                        │  │
│  │  [Flight Data]     [Signal Processing]     [Targeted Ads]            │  │
│  │  [Lounge Visits]   [Behavior Analysis]    [QR Attribution]           │  │
│  │  [Hotel Stays]    [Predictions]          [Conversion Tracking]       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Complete Service Catalog (16 Services)

| Service | Port | Type | External Dependency | Status |
|---------|------|------|---------------------|--------|
| `airzy-api-gateway` | 4500 | NEW | - | ✅ Ready |
| `airzy-flight-service` | 4501 | NEW | Amadeus | ✅ Ready |
| `airzy-lounge-service` | 4502 | NEW | DreamFolks, Priority Pass | ✅ Ready |
| `airzy-itinerary-service` | 4503 | NEW | - | ✅ Ready |
| `airzy-wallet-extension` | 4504 | EXTEND | RABTUL Wallet | ✅ Ready |
| `airzy-ai-brain` | 4505 | NEW | REZ Intelligence | ✅ Ready |
| `airzy-corp-service` | 4506 | NEW | CorpPerks | ✅ Ready |
| `airzy-hotel-extension` | 4507 | NEW | - | ✅ Ready |
| `airzy-transfer-extension` | 4508 | NEW | ReZ Ride | ✅ Ready |
| `airzy-dooh-extension` | 4509 | NEW | REZ Media DOOH | ✅ Ready |
| `airzy-gate-navigation` | 4510 | NEW | - | ✅ **BUILT** |
| `airzy-dining-extension` | 4511 | NEW | REZ NOW | ✅ **BUILT** |
| `airzy-visa-service` | 4512 | NEW | - | ✅ **BUILT** |
| `airzy-document-vault` | 4513 | NEW | DigiLocker | ✅ **BUILT** |
| `airzy-social-extension` | 4514 | NEW | - | ✅ **BUILT** |
| `airzy-travel-finance` | 4515 | NEW | RidZa, RABTUL | ✅ **BUILT** |

---

## Features by Layer

### Layer 1 - Travel Utility
| Feature | Service | Status |
|---------|---------|--------|
| Flight search & booking | `airzy-flight-service` | Ready |
| Hotel booking (airport) | `airzy-hotel-extension` | Ready |
| Airport transfers | `airzy-transfer-extension` | Ready |

### Layer 2 - Airport Experience
| Feature | Service | Status |
|---------|---------|--------|
| Lounge booking | `airzy-lounge-service` | ✅ Ready |
| Airport dining | `airzy-dining-extension` | ✅ Built |
| Porter/concierge | `airzy-corp-service` | ✅ Ready |
| Gate navigation | `airzy-gate-navigation` | ✅ Built |

### Layer 3 - Rewards & Wallet
| Feature | Service | Status |
|---------|---------|--------|
| Airzy Coins | `airzy-wallet-extension` | Ready |
| Membership tiers | `airzy-wallet-extension` | Ready |
| Coin multipliers | `airzy-wallet-extension` | Ready |
| Lounge credits | `airzy-wallet-extension` | Ready |

### Layer 4 - AI Traveler Brain
| Feature | Service | Status |
|---------|---------|--------|
| Travel prediction | `airzy-ai-brain` | Ready |
| Contextual offers | `airzy-ai-brain` | Ready |
| Proactive reminders | `airzy-ai-brain` | Ready |

### Layer 5 - Premium Layer
| Feature | Service | Status |
|---------|---------|--------|
| Membership tiers | `airzy-wallet-extension` | ✅ Ready |
| Unlimited lounge (Royale) | `airzy-lounge-service` | ✅ Ready |
| Concierge service | `airzy-corp-service` | ✅ Ready |

### Layer 6 - Visa & Documents
| Feature | Service | Status |
|---------|---------|--------|
| Visa requirements | `airzy-visa-service` | ✅ Built |
| Visa assistant (AI) | `airzy-visa-service` | ✅ Built |
| Document vault | `airzy-document-vault` | ✅ Built |
| DigiLocker integration | `airzy-document-vault` | ✅ Built |
| Travel folder | `airzy-document-vault` | ✅ Built |

### Layer 7 - Travel Finance
| Feature | Service | Status |
|---------|---------|--------|
| Travel BNPL | `airzy-travel-finance` | ✅ Built |
| Forex conversion | `airzy-travel-finance` | ✅ Built |
| Forex cards | `airzy-travel-finance` | ✅ Built |
| Travel insurance | `airzy-travel-finance` | ✅ Built |

### Layer 8 - Traveler Social
| Feature | Service | Status |
|---------|---------|--------|
| Traveler reviews | `airzy-social-extension` | ✅ Built |
| Itinerary sharing | `airzy-social-extension` | ✅ Built |
| Travel tips | `airzy-social-extension` | ✅ Built |
| Community | `airzy-social-extension` | ✅ Built |

---

## Membership Tiers

| Tier | Fee/yr | Lounge Visits | Coin Rate | Key Benefits |
|------|--------|--------------|-----------|--------------|
| **Basic** | Free | 0 | 1.0x | Earn 1% coins, airport offers |
| **Plus** | ₹2,999 | 2 | 1.5x | 2 lounge visits, priority support |
| **Elite** | ₹9,999 | 5 | 2.0x | 5 lounge visits, concierge, transfers |
| **Royale** | ₹29,999 | Unlimited | 3.0x | All Elite + VIP services |

---

## Directory Structure

```
airzy/
├── airzy-api-gateway/           # Port 4500 - Main API Gateway
├── airzy-flight-service/        # Port 4501 - Amadeus integration
├── airzy-lounge-service/        # Port 4502 - DreamFolks + Priority Pass
├── airzy-itinerary-service/     # Port 4503 - Trip management
├── airzy-wallet-extension/      # Port 4504 - Membership tiers + coins
├── airzy-ai-brain/              # Port 4505 - Travel intelligence
├── airzy-corp-service/          # Port 4506 - Corporate travel
├── airzy-hotel-extension/       # Port 4507 - Airport hotels
├── airzy-transfer-extension/     # Port 4508 - Airport transfers
├── airzy-dooh-extension/        # Port 4509 - Airport DOOH + attribution
├── airzy-gate-navigation/       # Port 4510 - Gate wayfinding ✅ NEW
├── airzy-dining-extension/      # Port 4511 - Airport dining ✅ NEW
├── integrations/
│   ├── amadeus/                 # Amadeus API client
│   └── dreamfolks/              # DreamFolks + Priority Pass clients
├── shared/
│   ├── types/                   # Canonical TypeScript types + Zod schemas
│   └── clients/                 # RABTUL + REZ Intelligence clients
└── apps/
    └── mobile/                  # Expo mobile app
        ├── App.tsx
        └── screens/
```

---

## Quick Start

```bash
# 1. Navigate to Airzy
cd /KHAIRMOVE/airzy

# 2. Install dependencies
npm install

# 3. Set environment variables
export AMADEUS_CLIENT_ID=your_id
export AMADEUS_CLIENT_SECRET=your_secret
export DREAMFOLKS_API_KEY=your_key
export INTERNAL_SERVICE_TOKEN=your_token

# 4. Deploy all services
./deploy.sh deploy

# 5. Check status
./deploy.sh status
```

---

## External Integrations

| Provider | Purpose | Status |
|---------|---------|--------|
| **Amadeus** | Flight search/booking | Ready |
| **DreamFolks** | Lounge network (1000+ lounges) | Ready |
| **Priority Pass** | Lounge membership (700+ lounges) | Ready |

---

## Reuse from Existing Ecosystem

| Existing Service | Reuse For |
|-----------------|-----------|
| RABTUL Auth (4002) | User authentication |
| RABTUL Payment (4001) | Flight/hotel payments |
| RABTUL Wallet (4004) | Airzy Coins base |
| RABTUL Notify (4011) | Trip reminders |
| REZ Travel Expert (3003) | Travel AI |
| REZ Care (4058) | Concierge support |
| REZ WhatsApp (4202) | WhatsApp updates |
| REZ DOOH | Airport advertising |
| ReZ Ride | Airport transfers |
| REZ NOW | Airport merchants |

---

## Related

| Repo | Purpose |
|------|---------|
| KHAIRMOVE/khaimove-ride-service | Airport transfers |
| KHAIRMOVE/buzzlocal-rides-integration | Rides integration |
| REZ-Intelligence | AI platform |
| RABTUL-Technologies | Infrastructure services |

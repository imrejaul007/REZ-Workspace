# rez-guest-mobile-app

**Port:** 4041

Guest Mobile App Backend Service providing guest profiles, loyalty management, booking access, and digital keys.

## Features

- **Guest Profiles** - Registration, login, profile management
- **Loyalty & Rewards** - Points system, tier management, reward redemption
- **Booking Management** - View and access bookings
- **Digital Keys** - BLE/NFC/QR digital room keys

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new guest |
| POST | `/api/auth/login` | Login guest |
| GET | `/api/profile` | Get guest profile |
| PUT | `/api/profile` | Update profile |
| GET | `/api/bookings` | List guest bookings |
| GET | `/api/loyalty` | Get loyalty status |
| GET | `/api/loyalty/rewards` | List available rewards |
| POST | `/api/loyalty/redeem` | Redeem points |
| GET | `/api/digital-key/:bookingId` | Get digital key |

## Loyalty Tiers

| Tier | Points | Multiplier |
|------|--------|------------|
| Bronze | 0+ | 1.0x |
| Silver | 5,000+ | 1.25x |
| Gold | 20,000+ | 1.5x |
| Platinum | 50,000+ | 2.0x |

## Quick Start

```bash
npm install
npm run dev    # Development
npm test      # Tests
npm start     # Production
```

## Demo Data

- Demo guest: `demo@stayown.com` / `demo123`
- Demo booking: Confirmation code `GH-ABC123`

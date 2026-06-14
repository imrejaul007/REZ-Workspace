# REZ QR Unified Hub

Cross-company QR integration service for the REZ ecosystem.

## Features

- **Unified QR Scanning** - Single endpoint for all QR types across companies
- **Cross-Company Rewards** - Issue and track rewards across companies
- **QR Analytics Hub** - Consolidated analytics for all QR types
- **Cross-Promotion Engine** - Create campaigns that span multiple companies
- **Unified Dashboard** - Admin panel for QR management

## Quick Start

```bash
cd RABTUL-Technologies/REZ-qr-unified
npm install
npm run dev
```

## API Endpoints

### QR Scanning
- `POST /api/scans` - Record QR scan

### Rewards
- `POST /api/rewards` - Issue reward
- `GET /api/rewards/:userId` - Get user rewards

### Campaigns
- `POST /api/campaigns` - Create cross-company campaign
- `GET /api/campaigns` - List campaigns

### Analytics
- `GET /api/analytics/:company` - Get company stats
- `GET /api/companies` - List all companies

## Environment Variables

```
PORT=4090
MONGODB_URI=mongodb://localhost:27017/rez-qr-unified
ALLOWED_ORIGINS=https://rez.money,https://admin.rez.money
```

## Companies Supported

| Company | Color | QR Types |
|---------|-------|----------|
| REZ Consumer | Indigo | safe-qr, creator-qr |
| REZ Merchant | Green | menu-qr, table-qr, salon-qr |
| REZ Media | Amber | ad-campaign, dooh-qr |
| StayOwn | Purple | room-hub, menu-qr |
| Karma Foundation | Green | event-checkin |
| RisaCare | Cyan | health-qr, appointment-qr |
| NeXha | Pink | b2b-qr |
| CorpPerks | Blue | employee-qr |

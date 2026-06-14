# CorpID Shield - Consumer Fraud Protection App

> **Port:** 4716 | **Company:** REZ-Consumer | **Category:** Consumer Security | **Priority:** P1
> **Competitor:** IronTrex, Truecaller

## Overview

Consumer-facing mobile app for scam protection, identity monitoring, UPI safety, and breach alerts. Protects everyday users from digital fraud.

## Features

### 🛡️ Protection Features

| Feature | Description |
|---------|-------------|
| **Scam Call Detection** | Real-time screening of incoming calls |
| **SMS Phishing Protection** | Detect malicious links, fake bank alerts |
| **QR Code Safety** | Verify QR codes before scanning |
| **UPI Transaction Safety** | Check merchant trust before paying |
| **Dark Web Monitoring** | Check if your data is leaked |
| **AI Guardian** | Chat with AI about fraud questions |
| **Trust Score** | Your personal trust rating (like CIBIL) |

### 📱 Screens

- **Dashboard** - Trust score, active protection, recent alerts
- **Call Shield** - Scam call detection, community reports
- **Message Guard** - SMS analysis, phishing detection
- **UPI Safety** - Merchant verification, transaction safety
- **Breach Monitor** - Email/phone/PAN monitoring
- **AI Guardian** - Chat interface for fraud questions

## Quick Start

```bash
cd REZ-Consumer/corpid-shield-app
npm install
npm run dev
```

## API Reference

### Register User
```bash
curl -X POST http://localhost:4716/api/register \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "email": "user@example.com"}'
```

### Check Phone for Scam
```bash
curl -X POST http://localhost:4716/api/scam/check-phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+919999999999", "callerName": "SBI Bank"}'
```

**Response:**
```json
{
  "callId": "call_abc123",
  "phoneNumber": "+919999999999",
  "riskLevel": "CONFIRMED_SCAM",
  "riskScore": 85,
  "category": "bank_impersonation",
  "warnings": [
    "Bank impersonation detected",
    "Never share OTP or password with callers"
  ],
  "recommendations": ["Hang up immediately", "Report to 1930"]
}
```

### Analyze SMS
```bash
curl -X POST http://localhost:4716/api/scam/analyze-sms \
  -H "Content-Type: application/json" \
  -d '{"message": "Your account is blocked. Click here to verify: sbi-secure.xyz"}'
```

### Verify UPI
```bash
curl -X POST http://localhost:4716/api/upi/verify \
  -H "Content-Type: application/json" \
  -d '{"upiId": "merchant@upi", "amount": 500}'
```

### Chat with AI Guardian
```bash
curl -X POST http://localhost:4716/api/guardian/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Is this message from HDFC real?"}'
```

**Response:**
```json
{
  "queryId": "q_abc123",
  "answer": "Here's how to identify fake bank communications:\n\n🚨 RED FLAGS:\n• Urgency: 'Your account will be blocked'\n• OTP requests: 'Share your OTP'\n• Links: Click to verify\n\n✅ SAFE: Verify through official app, call number on card",
  "confidence": 0.85,
  "riskLevel": "LOW",
  "recommendations": [
    "Verify caller identity through official channels",
    "Never share OTP with anyone"
  ]
}
```

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register user |
| GET | `/api/user/:userId` | Get user profile |
| POST | `/api/scam/check-phone` | Check phone for scam |
| POST | `/api/scam/analyze-sms` | Analyze SMS |
| POST | `/api/scam/report` | Report a scam |
| POST | `/api/upi/verify` | Verify UPI ID |
| POST | `/api/qr/analyze` | Analyze QR code |
| POST | `/api/breach/check` | Check for breaches |
| POST | `/api/guardian/chat` | Chat with AI Guardian |
| GET | `/api/trust-score/:userId` | Get trust score |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CorpID Shield App                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                    Protection Layer                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │  │
│  │  │  Call   │ │   SMS   │ │   QR    │ │  UPI   │ │  │
│  │  │Protection│ │Protection│ │Protection│ │ Safety │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │  │
│  └─────────────────────────────────────────────────────┘  │
│                            │                               │
│                            ▼                               │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                   Intelligence Layer                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │  │
│  │  │  Breach  │ │  Dark    │ │ Identity │ │ Fraud  │ │  │
│  │  │ Monitor  │ │ Web Scan │ │ Protection│ │ Network│  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │  │
│  └─────────────────────────────────────────────────────┘  │
│                            │                               │
│                            ▼                               │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                    AI Guardian Layer                   │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │         AI Copilot for Fraud Questions        │  │  │
│  │  │  "Is this WhatsApp message a scam?"          │  │  │
│  │  │  "Should I pay this UPI request?"              │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Mobile App Structure

```
CorpIDShield/
├── App.tsx                    # Main app entry
├── app/                       # Expo Router pages
│   ├── _layout.tsx           # Root layout
│   ├── index.tsx             # Dashboard
│   ├── call-shield.tsx       # Call protection
│   ├── message-guard.tsx     # SMS protection
│   ├── upi-safety.tsx        # UPI safety
│   ├── breach-monitor.tsx    # Breach monitoring
│   ├── ai-guardian.tsx       # AI copilot
│   ├── trust-profile.tsx      # Trust score
│   └── settings.tsx          # App settings
└── src/
    ├── components/
    ├── services/             # API services
    ├── hooks/
    ├── stores/              # State (Zustand)
    └── types/
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo SDK 53 (React Native) |
| Router | Expo Router |
| State | Zustand |
| API | REST + GraphQL |
| Real-time | WebSocket |
| Storage | AsyncStorage |

## Pricing Tiers

| Tier | Price | Features |
|------|-------|----------|
| Free | ₹0 | Basic protection, 10 checks/mo |
| Shield | ₹49/mo | Full protection, 100 checks/mo |
| Shield+ | ₹199/mo | Family protection, unlimited |

## Integration Points

- **HOJAI TrustOS**: Trust scores, fraud network
- **CorpID**: Identity verification
- **REZ Fraud Network**: Scam number database
- **REZ Payment**: UPI safety, merchant verification

## Related Services

- [REZ Threat Graph](../REZ-Intelligence/reaz-threat-graph/) - Fraud network
- [CorpID Guardian](../hojai-ai/corpID-guardian/) - Identity
- [TrustOS](../hojai-ai/trust-os/) - Trust infrastructure

## Files

```
corpild-shield-app/
├── README.md
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── server.ts
    ├── types/index.ts
    └── services/
        ├── scamDetector.ts    ← Scam detection
        └── guardianAI.ts     ← AI chatbot
```

---

**Version:** 1.0.0 | **Updated:** June 4, 2026

# CorpID Shield — Consumer Fraud Protection App

**Port:** N/A (Mobile App)
**Company:** REZ-Consumer
**Parent Brand:** CorpID Guardian
**Competitor:** IronTrex, Truecaller

## Purpose

Consumer-facing mobile app for scam protection, identity monitoring, UPI safety, and breach alerts. Protects everyday users from digital fraud.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CorpID Shield App                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                    Protection Layer                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │  │
│  │  │  Call    │ │   SMS    │ │   QR     │ │  UPI   │ │  │
│  │  │ Protection│ │Protection│ │ Protection│ │Safety  │  │
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
│  │                    AI Guardian Layer                  │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │         AI Copilot for Fraud Questions        │  │  │
│  │  │  "Is this WhatsApp message a scam?"          │  │  │
│  │  │  "Should I pay this UPI request?"            │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Features

### 1. Scam Call Protection
- **Incoming Call Screening**: Real-time scam detection
- **Spam Caller Database**: Community-reported numbers
- **Bank Impersonation Alerts**: "SBI calling" verification
- **Government Impersonation**: Fake KYC call alerts
- **Unknown Caller ID**: Who's calling analysis

### 2. SMS Protection
- **Phishing Link Detection**: Malicious URL scanning
- **Fake Bank Alert Detection**: "Your account is blocked"
- **OTP Request Warnings**: Never share OTP alerts
- **Lottery Scam Detection**: Fake prize messages
- **Job Scam Detection**: Fake job offer alerts

### 3. QR Code Protection
- **Merchant Verification**: Is this merchant legit?
- **UPI ID Verification**: Is this UPI ID safe?
- **Amount Confirmation**: Double-check before paying
- **Fake QR Detection**: Scam QR alerts

### 4. UPI Safety Engine
- **Pre-Payment Check**: Recipient trust score
- **Merchant Risk Score**: Before paying
- **Amount Alerts**: Unusual amount warnings
- **First-Time Recipient**: Extra verification
- **Suspicious Pattern Detection**: Fraud behavior

### 5. Dark Web Monitoring
- **Email Breach Check**: Is your email leaked?
- **Phone Breach Check**: Is your number leaked?
- **PAN Breach Check**: Is your PAN leaked?
- **Aadhaar Breach Check**: Is your Aadhaar leaked?
- **Password Breach Check**: Have I Been Pwned integration

### 6. Identity Protection
- **Aadhaar Monitoring**: Unauthorized usage alerts
- **PAN Monitoring**: Fake loan applications
- **Phone Number Monitoring**: SIM swap alerts
- **Email Monitoring**: Account takeover alerts

### 7. AI Guardian (Copilot)
- Natural language fraud queries
- "Is this message real?"
- "Should I click this link?"
- "Is this UPI ID safe to pay?"
- Fraud education and tips

### 8. Trust Score
- Personal trust score (like CIBIL for trust)
- Based on verified identity, fraud reports
- Improves with good behavior
- Visible to merchants

## Screens

### 1. Dashboard (Home)
- Trust Score display
- Active protection status
- Recent alerts
- Quick actions

### 2. Call Shield
- Recent calls with threat level
- Report spam button
- Block list management
- Community feed

### 3. Message Guard
- SMS analysis
- Phishing link detection
- Report message
- Safe sender list

### 4. UPI Safety
- Payment verification
- Merchant trust scores
- Transaction safety check
- Suspicious activity alerts

### 5. Breach Monitor
- Email monitoring
- Phone monitoring
- PAN monitoring
- Breach history

### 6. AI Guardian
- Chat interface
- Fraud questions
- Scam tips
- Report center

### 7. Trust Profile
- Personal trust score
- Score factors
- Improvement tips
- Verified badges

## Mobile App Structure

```
CorpIDShield/
├── App.tsx                    # Main app entry
├── app/                      # Expo Router pages
│   ├── _layout.tsx          # Root layout
│   ├── index.tsx            # Dashboard
│   ├── call-shield.tsx      # Call protection
│   ├── message-guard.tsx     # SMS protection
│   ├── upi-safety.tsx       # UPI safety
│   ├── breach-monitor.tsx   # Breach monitoring
│   ├── ai-guardian.tsx      # AI copilot
│   ├── trust-profile.tsx    # Trust score
│   └── settings.tsx         # App settings
├── src/
│   ├── components/          # Reusable components
│   ├── services/            # API services
│   ├── hooks/               # Custom hooks
│   ├── stores/              # State management
│   ├── utils/               # Utilities
│   └── types/               # TypeScript types
└── package.json
```

## Integration Points

### With HOJAI TrustOS
- Get trust scores from TrustOS
- Report fraud to Trust Graph
- Sync protection status

### With CorpID
- Identity verification
- Trust score calculation
- Profile management

### With REZ Fraud Network
- Share fraud intelligence
- Get scam number database
- Report fraudulent actors

### With REZ Payment Service
- UPI safety checks
- Merchant verification
- Transaction monitoring

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo SDK 53 (React Native) |
| Router | Expo Router |
| State | Zustand |
| API | REST + GraphQL |
| Real-time | WebSocket |
| Maps | Mapbox |
| Storage | AsyncStorage |
| Notifications | Expo Notifications |

## Pricing Tiers

| Tier | Price | Features |
|------|-------|----------|
| Free | ₹0 | Basic protection, 10 checks/mo |
| Shield | ₹49/mo | Full protection, 100 checks/mo |
| Shield+ | ₹199/mo | Family protection, unlimited |

## Screens Mockup

### Dashboard Screen
```
┌─────────────────────────────────┐
│  CorpID Shield        [≡]     │
├─────────────────────────────────┤
│                                 │
│    ┌─────────────────────┐     │
│    │   🔒 Your Score     │     │
│    │      850 / 1000     │     │
│    │   ████████████░░░   │     │
│    │   Excellent Trust   │     │
│    └─────────────────────┘     │
│                                 │
│  ┌───────┐ ┌───────┐ ┌───────┐│
│  │ 📞    │ │ 💬    │ │ 💳    ││
│  │Call   │ │SMS    │ │UPI    ││
│  │Shield │ │Guard  │ │Safety ││
│  │  ✅    │ │  ✅    │ │  ✅    ││
│  └───────┘ └───────┘ └───────┘│
│                                 │
│  Recent Alerts                  │
│  ┌─────────────────────────────┐
│  │ ⚠️ Suspicious UPI ID        │
│  │    Detected 2 min ago       │
│  └─────────────────────────────┘
│  ┌─────────────────────────────┐
│  │ ✅ Merchant Verified        │
│  │    ₹500 safe to pay        │
│  └─────────────────────────────┘
│                                 │
│  [🤖 Ask AI Guardian]          │
└─────────────────────────────────┘
```

## Status

🟡 PLANNED - Implementation pending

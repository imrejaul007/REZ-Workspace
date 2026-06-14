# REZ CorpPerks Service

**Enterprise Benefits & Rewards Platform**

---

## Features

### Employee Benefits
- [x] Benefit catalog management
- [x] Employee enrollment
- [x] Bulk CSV import
- [x] Department allocation
- [x] Budget limits
- [x] Redemption tracking

### GST & Invoicing
- [x] GST calculation (18%)
- [x] Invoice generation
- [x] GSTR-1 reports
- [x] E-invoicing
- [x] ITC eligibility

### Rewards & Wallet
- [x] Corp wallet
- [x] Transaction history
- [x] Karma points
- [x] Coin rewards

### Integrations
- [x] BambooHR
- [x] GreytHR
- [x] Zoho People
- [x] StayOwn
- [x] Razorpay

---

## Security

- [x] JWT verification
- [x] Rate limiting
- [x] CORS strict
- [x] Audit logging
- [x] MongoDB models
- [x] Redis caching

---

## API Endpoints

### Benefits
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/corp/benefits | - | List benefits |
| POST | /api/corp/benefits | JWT | Create benefit |

### Employees
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/corp/employees | - | List employees |
| POST | /api/corp/employees | JWT | Enroll employee |
| POST | /api/corp/employees/bulk-import | JWT | CSV import |

### GST
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/gst/calculate | - | Calculate GST |
| POST | /api/gst/invoices | JWT | Create invoice |
| GET | /api/gst/invoices | JWT | List invoices |

### Finance
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/finance/wallet | JWT | Wallet balance |
| POST | /api/finance/topup | JWT | Add funds |
| GET | /api/finance/cards | JWT | Expense cards |

---

## Setup

```bash
# Install
npm install

# Configure
cp .env.example .env
# Edit .env with real credentials

# Run
npm run dev
```

---

## Security Setup

1. Generate secrets:
```bash
openssl rand -base64 32  # JWT_SECRET
openssl rand -hex 32     # INTERNAL_SERVICE_TOKEN
```

2. Configure CORS_ORIGIN (production domains only)

3. Enable MongoDB auth

4. Add HMAC signatures for webhooks

---

## Monitoring

- Health: `GET /health`
- Metrics: `GET /metrics`
- Sentry: Automatic error tracking

---

## Version

2.0.0 - May 2026

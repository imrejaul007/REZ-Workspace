# RIDZA FinanceOS - Islamic Finance Platform

**Shariah-Compliant Financial Services - Ethical Banking for Everyone**

> "Finance with Faith - Ethical wealth, Islamic principles"

**Version:** 1.0.0 | **Date:** June 10, 2026 | **Port:** 5150-5199 (Islamic Finance Suite)

---

## Overview

RIDZA FinanceOS is RTNM Digital's Islamic finance platform, providing Shariah-compliant financial services for the RTNM ecosystem. Built on Islamic finance principles of fairness, transparency, and ethical investing, RIDZA offers halal banking, investments, and takaful (insurance) services.

RIDZA serves Muslim communities and ethical investors seeking financial services that align with Islamic law (Shariah), ensuring all transactions are free from riba (interest), gharar (excessive uncertainty), and prohibited activities.

## Architecture

```
                                    ┌─────────────────────────────────────────┐
                                    │           External Clients              │
                                    │    (Users, Businesses, Institutions)    │
                                    └──────────────────┬──────────────────────┘
                                                       │
                                       ┌───────────────┴───────────────┐
                                       ▼                               ▼
                            ┌─────────────────┐            ┌─────────────────┐
                            │  Consumer App   │            │  Business App   │
                            │                │            │                 │
                            └────────┬────────┘            └────────┬────────┘
                                     │                              │
                            ┌─────────┴──────────────────────────────┴────────┐
                            │           RIDZA FinanceOS Gateway (5150)         │
                            ├─────────────────────────────────────────────────┤
                            │  ┌────────────┐  ┌──────────────────┐          │
                            │  │  Murabaha │  │     Mudarabah   │          │
                            │  │   Engine  │  │      Engine     │          │
                            │  └────────────┘  └──────────────────┘          │
                            │  ┌────────────┐  ┌──────────────────┐          │
                            │  │   Ijara   │  │    Musharakah   │          │
                            │  │   Engine  │  │      Engine     │          │
                            │  └────────────┘  └──────────────────┘          │
                            │  ┌────────────┐  ┌──────────────────┐          │
                            │  │  Takaful  │  │    Shariah      │          │
                            │  │   Engine  │  │     Board       │          │
                            │  └────────────┘  └──────────────────┘          │
                            └─────────────────────────────────────────────────┘
                                                       │
                           ┌───────────────────────────┼───────────────────────────┐
                           │                           │                           │
                           ▼                           ▼                           ▼
                    ┌─────────────┐            ┌─────────────┐            ┌─────────────┐
                    │  RABTUL    │            │   LawGens   │            │  AssetMind  │
                    │  (Wallet,  │            │  (Shariah   │            │  (Ethical  │
                    │   Payments)│            │  Compliance)│            │  Investing) │
                    └─────────────┘            └─────────────┘            └─────────────┘
```

## Products & Services

### Core Shariah Products

| Product | Description |
|---------|-------------|
| **Murabaha** | Cost-plus financing for asset purchase |
| **Mudarabah** | Profit-sharing investment account |
| **Ijara** | Lease-to-own financing |
| **Musharakah** | Joint venture partnership |
| **Salam** | Forward commodity sale |
| **Istisna** | Manufacturing/property finance |

### Takaful (Islamic Insurance)

| Product | Description |
|---------|-------------|
| **Family Takaful** | Life insurance alternative |
| **Health Takaful** | Healthcare coverage |
| **General Takaful** | Property, vehicle, travel |
| **Education Takaful** | Child education savings |

### Investment Products

| Product | Description |
|---------|-------------|
| **Islamic Savings** | Halal savings accounts |
| **Shariah Funds** | ESG-compliant investment funds |
| **Sukuk** | Islamic bonds |
| **Real Estate Fund** | Halal property investment |

## Key Features

### Shariah-Compliant Financing

- **Murabaha Financing** - Buy items at cost + markup, pay in installments
- **Ijara Financing** - Lease with option to own at end
- **Tashir Financing** - Partnership-based business financing
- **No Interest** - All transactions based on profit/loss sharing
- **Transparent Pricing** - Clear disclosure of costs and profits
- **Asset-Backed** - Financing tied to real assets

### Ethical Investments

- **Shariah Screening** - AI-powered halal compliance check
- **Sector Exclusions** - No alcohol, gambling, pork, etc.
- **Zakat Calculator** - Automatic charity calculation
- **Screening Ratios** - Debt, cash ratios per company
- **Continuous Monitoring** - Real-time compliance updates
- **Ethical Diversification** - Diversified halal portfolio

### Takaful (Islamic Insurance)

- **Tabarru Contribution** - Voluntary donation for mutual aid
- **Waqf-based** - Charity-based insurance model
- **No Interest** - No riba in any transaction
- **Transparent Operations** - Clear process documentation
- **Shariah Board Approval** - All products approved by scholars

### Digital Banking

- **Digital Account Opening** - Quick Shariah account setup
- **Mobile Banking** - Full-service mobile app
- **QR Payments** - Contactless Shariah payments
- **Bill Payments** - Utility, telecom, etc.
- **Remittances** - International transfers (HALA remittance)
- **Budget Management** - Halal spending tracker

---

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB 6.0+
- npm or yarn
- Docker (optional)

### Installation

```bash
# Navigate to RIDZA directory
cd RIDZA-FinanceOS-git

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Running Locally

```bash
# Start development server
npm run dev

# RIDZA FinanceOS Gateway starts on port 5150
```

### Docker Deployment

```bash
# Build Docker image
docker build -t ridza-financeos:latest .

# Run container
docker run -d \
  --name ridza-financeos \
  -p 5150:5150 \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/ridza \
  ridza-financeos:latest
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5150` | Gateway port |
| `NODE_ENV` | `development` | Environment mode |
| `MONGODB_URI` | `mongodb://localhost:27017/ridza` | MongoDB connection |
| `SHARIAH_BOARD_URL` | - | Shariah board API |
| `CURRENCY` | `INR` | Default currency |
| `MAX_FINANCING_AMOUNT` | `10000000` | Maximum financing |
| `PROFIT_RATE_MIN` | `8` | Minimum profit rate (%) |
| `PROFIT_RATE_MAX` | `18` | Maximum profit rate (%) |
| `ZAKAT_RATE` | `2.5` | Zakat rate (%) |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |

### Docker Compose

```yaml
version: '3.8'
services:
  ridza:
    build: .
    ports:
      - "5150:5150"
    environment:
      - PORT=5150
      - MONGODB_URI=mongodb://mongo:27017/ridza
      - NODE_ENV=production
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:6.0
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

volumes:
  mongo-data:
```

---

## API Endpoints

### Murabaha Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/murabaha/calculate` | Calculate cost + markup |
| `POST` | `/api/murabaha/apply` | Apply for murabaha financing |
| `GET` | `/api/murabaha/:id` | Get murabaha details |
| `GET` | `/api/murabaha` | List user murabahas |
| `POST` | `/api/murabaha/:id/payment` | Make payment |

### Mudarabah Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/mudarabah/invest` | Invest in mudarabah |
| `GET` | `/api/mudarabah/accounts` | List mudarabah accounts |
| `GET` | `/api/mudarabah/:id/profits` | Get profit statements |
| `POST` | `/api/mudarabah/:id/withdraw` | Withdraw profits |

### Ijara Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ijara/calculate` | Calculate lease payments |
| `POST` | `/api/ijara/apply` | Apply for ijara financing |
| `GET` | `/api/ijara/:id` | Get ijara details |
| `GET` | `/api/ijara` | List user ijara agreements |
| `POST` | `/api/ijara/:id/transfer` | Transfer ownership at end |

### Takaful Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/takaful/apply` | Apply for takaful |
| `GET` | `/api/takaful/:id` | Get takaful details |
| `GET` | `/api/takaful` | List user takaful policies |
| `POST` | `/api/takaful/:id/contribute` | Make tabarru contribution |
| `POST` | `/api/takaful/:id/claim` | File a claim |

### Zakat Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/zakat/calculate` | Calculate zakat due |
| `GET` | `/api/zakat/calculator` | Online zakat calculator |
| `POST` | `/api/zakat/pay` | Pay zakat |

### Investment Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/investments/funds` | List available funds |
| `POST` | `/api/investments/buy` | Buy units |
| `POST` | `/api/investments/sell` | Sell units |
| `GET` | `/api/investments/portfolio` | Get portfolio |
| `GET` | `/api/investments/:id/performance` | Fund performance |

### Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check |
| `GET` | `/health/ready` | Kubernetes readiness |
| `GET` | `/health/live` | Kubernetes liveness |

---

## API Examples

### Apply for Murabaha Financing

```bash
curl -X POST http://localhost:5150/api/murabaha/apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "amount": 100000,
    "asset_description": "Commercial vehicle",
    "tenure_months": 24,
    "purpose": "business_expansion",
    "documents": {
      "quotation": "base64_encoded_pdf"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "mur_abc123",
    "status": "pending_shariah_review",
    "amount": 100000,
    "cost_price": 100000,
    "markup_percentage": 10,
    "total_payable": 110000,
    "monthly_payment": 4583.33,
    "tenure_months": 24,
    "shariah_compliance": {
      "asset_verified": true,
      "prohibited_sector": false,
      "board_approved": true
    },
    "created_at": "2026-06-10T09:00:00Z"
  }
}
```

### Calculate Zakat

```bash
curl -X POST http://localhost:5150/api/zakat/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "assets": {
      "cash": 50000,
      "gold": 100000,
      "stocks": 200000,
      "business_inventory": 75000
    },
    "liabilities": {
      "short_term_debts": 25000
    },
    "nisab_threshold": 612000
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_assets": 425000,
    "total_liabilities": 25000,
    "net_assets": 400000,
    "nisab_met": false,
    "nisab_threshold": 612000,
    "zakat_payable": 0,
    "currency": "INR",
    "calculation_date": "2026-06-10",
    "breakdown": {
      "cash_zakat": 0,
      "gold_zakat": 2500,
      "stocks_zakat": 5000,
      "business_zakat": 1875
    },
    "charity_recipients": [
      "Karma Foundation",
      "Local Mosque Fund"
    ]
  }
}
```

### Invest in Mudarabah

```bash
curl -X POST http://localhost:5150/api/mudarabah/invest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "amount": 50000,
    "tenure_months": 12,
    "profit_sharing_ratio": {
      "investor": 70,
      "bank": 30
    },
    "auto_renew": true
  }'
```

### Apply for Health Takaful

```bash
curl -X POST http://localhost:5150/api/takaful/apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "type": "health",
    "plan": "family_premium",
    "coverage_amount": 500000,
    "members": [
      {
        "name": "Ahmed Khan",
        "relation": "self",
        "dob": "1985-03-15",
        "health_status": "healthy"
      },
      {
        "name": "Fatima Khan",
        "relation": "spouse",
        "dob": "1988-07-22",
        "health_status": "healthy"
      }
    ],
    "tabarru_contribution_annual": 12000
  }'
```

### Check Investment Halal Status

```bash
curl -X POST http://localhost:5150/api/investments/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "company_name": "Reliance Industries",
    "stock_symbol": "RELIANCE",
    "exchange": "NSE"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "company_name": "Reliance Industries",
    "stock_symbol": "RELIANCE",
    "exchange": "NSE",
    "is_halal": true,
    "shariah_compliance_score": 85,
    "screening_results": {
      "prohibited_activities": false,
      "debt_ratio": 0.18,
      "cash_ratio": 0.05,
      "interest_income_ratio": 0.02
    },
    "recommendation": "compliant",
    "last_updated": "2026-06-01"
  }
}
```

---

## Shariah Screening Criteria

### Prohibited Sectors (Automatic Exclusion)

| Sector | Reason |
|--------|--------|
| Alcohol | Prohibited substance |
| Gambling/Casinos | Khamr (intoxicants) |
| Pork | Haraam meat |
| Conventional Banking | Riba (interest) |
| Insurance (Conventional) | Gharar (excessive uncertainty) |
| Weapons/Arms | Violence |
| Tobacco | Harmful substances |
| Entertainment (Adult) | Haraam content |

### Financial Ratios (Per Company)

| Ratio | Maximum Allowed | Calculation |
|-------|----------------|-------------|
| Debt to Total Assets | < 33% | Total Debt / Total Assets |
| Cash to Total Assets | < 33% | Cash / Total Assets |
| Interest Income to Total | < 5% | Interest Income / Total Income |

---

## Directory Structure

```
RIDZA-FinanceOS-git/
├── src/
│   ├── index.ts              # Main entry point
│   ├── config/
│   │   └── database.ts       # Database configuration
│   ├── middleware/
│   │   ├── auth.ts          # Authentication middleware
│   │   └── shariah.ts       # Shariah compliance middleware
│   ├── models/
│   │   ├── murabaha.ts      # Murabaha model
│   │   ├── mudarabah.ts     # Mudarabah model
│   │   ├── ijara.ts         # Ijara model
│   │   ├── musharakah.ts    # Musharakah model
│   │   ├── takaful.ts       # Takaful model
│   │   └── investment.ts    # Investment model
│   ├── routes/
│   │   ├── murabaha.ts      # Murabaha routes
│   │   ├── mudarabah.ts     # Mudarabah routes
│   │   ├── ijara.ts         # Ijara routes
│   │   ├── takaful.ts       # Takaful routes
│   │   ├── zakat.ts         # Zakat routes
│   │   └── investment.ts    # Investment routes
│   └── services/
│       ├── shariah.service.ts    # Shariah compliance
│       ├── murabaha.service.ts
│       ├── mudarabah.service.ts
│       ├── ijara.service.ts
│       └── takaful.service.ts
├── dist/                   # Compiled output
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## Security Features

- **Shariah Compliance** - All products verified by Shariah board
- **KYC/AML** - Full regulatory compliance
- **JWT Authentication** - Secure token-based auth
- **Biometric Auth** - Fingerprint, face recognition
- **Data Encryption** - At-rest and in-transit
- **Audit Trail** - Complete transaction logging
- **Fraud Detection** - AI-powered anomaly detection

---

## Shariah Board

RIDZA operates under the guidance of a Shariah Board comprising Islamic scholars:

- **Mufti Ibrahim Desai** - Chairman (Deoband seminary)
- **Sheikh Abdul Qadir** - Member (Al-Azhar)
- **Maulana Hassan Ali** - Member (Darul Uloom)

### Board Responsibilities

1. Approve all financial products
2. Review contracts and documentation
3. Monitor ongoing compliance
4. Issue fatwas (rulings)
5. Handle shariah grievances

---

## Integration Points

### Internal Services

| Service | Integration | Purpose |
|---------|-------------|---------|
| **RABTUL Wallet** | Payments | Halal payment processing |
| **RABTUL Auth** | Authentication | Secure access |
| **AssetMind** | Investment screening | ESG/halal analysis |
| **LawGens** | Documentation | Shariah-compliant contracts |

### External Integrations

| Integration | Description |
|-------------|-------------|
| **AAOIFI** | Islamic finance standards |
| **SEC** | Regulatory compliance |
| **ISRA** | Islamic banking research |
| **Islamic Development Bank** | Interbank financing |

---

## Port Registry

RIDZA FinanceOS uses ports in the 5150-5199 range:

| Service | Port | Description |
|---------|------|-------------|
| **RIDZA Gateway** | 5150 | Main API gateway |
| **Murabaha Engine** | 5151 | Murabaha financing |
| **Mudarabah Engine** | 5152 | Profit-sharing investments |
| **Ijara Engine** | 5153 | Lease financing |
| **Takaful Engine** | 5154 | Islamic insurance |
| **Shariah Board API** | 5155 | Compliance verification |

---

## Related Products

- [RABTUL Technologies](/Users/rejaulkarim/Documents/ReZ%20Full%20App/RABTUL/) - Wallet and payments
- [REZ Financial](/Users/rejaulkarim/Documents/ReZ%20Full%20App/REZ-Financial/) - Conventional finance
- [AssetMind](/Users/rejaulkarim/Documents/ReZ%20Full%20App/AssetMind/) - Financial intelligence
- [LawGens](/Users/rejaulkarim/Documents/ReZ%20Full%20App/LawGens/) - Shariah documentation

---

## Troubleshooting

### Common Issues

**Product Not Shariah Compliant**
```
Error: Investment in prohibited sector
```
Solution: Choose alternative halal investment product.

**Zakat Not Applicable**
```
Error: Net assets below nisab threshold
```
Solution: Accumulate wealth to reach nisab (approx. 3 oz gold).

**Shariah Board Review Pending**
```
Error: Awaiting board approval
```
Solution: Wait for Shariah board review (1-3 business days).

---

## License

Proprietary - RTNM Digital / RIDZA

---

Built with ❤️ by RTNM Digital - "Finance with Faith - Ethical wealth, Islamic principles"
# RABTUL Technologies - Complete Features

**Version:** 1.0.0
**Last Updated:** June 14, 2026
**Status:** ✅ PRODUCTION READY - 178+ Services

---

## COMPANY OVERVIEW

**RABTUL Technologies** is the core platform services provider for the entire RTNM ecosystem. It handles authentication, payments, wallets, orders, and the economic layer (loyalty, rewards, referrals, treasury).

**Parent:** RTNM Group
**Role:** Infrastructure Provider

---

## SERVICE CATEGORIES

| Category | Count | Description |
|----------|-------|-------------|
| Core Services | 12 | Auth, Payment, Wallet, Order, etc. |
| Infrastructure | 12 | Circuit breaker, retry, DLQ, etc. |
| Economic Layer | 6 | Treasury, Loyalty, Rewards, Referral |
| BuzzLocal | 8 | Community services |
| Shopify Apps | 18 | E-commerce integrations |
| Productivity | 6 | Forms, Pages, Links, Video, Sign |
| Intelligence | 30+ | AI/ML services |
| QR Ecosystem | 8 | QR commerce services |
| Other | 80+ | Various services |

**Total: 178+ services**

---

## CORE SERVICES (Ports 4000-4020)

### API Gateway
| Port | Service | Features |
|------|---------|----------|
| 4000 | api-gateway | Routing, rate limiting, auth |

### Authentication
| Port | Service | Features |
|------|---------|----------|
| 4002 | rez-auth-service | JWT, OTP, TOTP, MFA, OAuth, Social login |

### Payments
| Port | Service | Features |
|------|---------|----------|
| 4001 | rez-payment-service | Razorpay, UPI, Cards, Webhooks, Refunds |

### Wallet
| Port | Service | Features |
|------|---------|----------|
| 4004 | rez-wallet-service | Coins, Balance, Multi-currency, Transfers |

### Orders
| Port | Service | Features |
|------|---------|----------|
| 4006 | rez-order-service | Order lifecycle, State machine, Tracking |

### Catalog
| Port | Service | Features |
|------|---------|----------|
| 4007 | rez-catalog-service | Products, Categories, Inventory, Pricing |

### Search
| Port | Service | Features |
|------|---------|----------|
| 4008 | rez-search-service | Full-text, Autocomplete, Fuzzy search |

### Delivery
| Port | Service | Features |
|------|---------|----------|
| 4009 | rez-delivery-service | Driver tracking, Route optimization |

### Notifications
| Port | Service | Features |
|------|---------|----------|
| 4011 | rez-notifications-service | Push, SMS, Email, WhatsApp |

### Profile
| Port | Service | Features |
|------|---------|----------|
| 4013 | rez-profile-service | User profiles, Preferences |

### Analytics
| Port | Service | Features |
|------|---------|----------|
| 4016 | rez-analytics-service | Dashboards, Charts, Reports |

### Booking
| Port | Service | Features |
|------|---------|----------|
| 4020 | rez-booking-service | Hotels, Travel, Events |

---

## ECONOMIC LAYER (Ports 4040-4055)

### Treasury OS
| Port | Service | Features |
|------|---------|----------|
| 4055 | REZ-treasury-os | Cash Management, Investments, Forecasting, Escrow |

### Loyalty
| Port | Service | Features |
|------|---------|----------|
| 4040 | REZ-unified-loyalty | Points, Tiers, Cross-brand loyalty |

### Referral
| Port | Service | Features |
|------|---------|----------|
| 4041 | rez-referral-os | Commission, Payouts, Multi-level |

### Multi-Currency
| Port | Service | Features |
|------|---------|----------|
| 4042 | REZ-multi-currency | INR, USD, EUR, GBP support |

### Rewards
| Port | Service | Features |
|------|---------|----------|
| 4043 | rez-rewards | Gamification, Badges, Achievements |

### Trust Engine
| Port | Service | Features |
|------|---------|----------|
| 4050 | rabtul-trust-engine | Trust scores, Reputation, Verification |

---

## INFRASTRUCTURE (Ports 4030-4060)

| Port | Service | Features |
|------|---------|----------|
| 4030 | REZ-circuit-breaker | Fault tolerance, Fallback |
| 4031 | REZ-retry-service | Exponential backoff, BullMQ |
| 4032 | REZ-dlq-service | Dead letter queue, Replay |
| 4033 | REZ-idempotency-service | Request deduplication |
| 4034 | REZ-policy-engine | Access control, Compliance |
| 4035 | REZ-secrets-manager | AES-256 encryption, Rotation |
| 4038 | REZ-scheduler-service | Cron jobs, Batch processing |
| 4025 | REZ-observability-platform | Logs, Traces, Metrics, Alerts |

---

## BUZZLOCAL SERVICES (Ports 4201-4208)

| Port | Service | Features |
|------|---------|----------|
| 4201 | buzzlocal-feed-service | Feed, Posts |
| 4202 | buzzlocal-community-service | Community features |
| 4203 | buzzlocal-intelligence-service | AI intelligence |
| 4204 | buzzlocal-notification-service | Push notifications |
| 4205 | buzzlocal-payment-service | Payments |
| 4206 | buzzlocal-realtime-service | WebSocket |
| 4207 | buzzlocal-vibe-service | Crowd intelligence |
| 4208 | buzzlocal-weather-service | Weather data |

---

## QR ECOSYSTEM (Ports 4090-4300)

| Port | Service | Features |
|------|---------|----------|
| 4300 | rez-qr-cloud-service | QR commerce (7 QR types) |
| 4090 | REZ-qr-unified | Cross-company QR hub |
| 4025 | REZ-table-qr-service | Restaurant table QR |
| 3031 | REZ-shelf-qr | Retail shelf QR |

### QR Types
- Safe QR (Emergency)
- Verify QR (Authenticity)
- Menu QR (Restaurant)
- Table QR (Ordering)
- Shelf QR (Retail)
- Payment QR (UPI)
- Campaign QR (Marketing)

---

## PRODUCTIVITY SERVICES (Ports 4092-4106)

| Port | Service | Features |
|------|---------|----------|
| 4092 | REZ-forms-service | AI form builder (Tally competitor) |
| 4100 | REZ-pages-service | One-page sites (Carrd competitor) |
| 4101 | REZ-links-service | Link-in-bio |
| 4102 | REZ-video-service | Async video |
| 4104 | REZ-sign-service | E-signatures |
| 4105 | REZ-cms-service | Content CMS (Notion competitor) |
| 4106 | REZ-sites-service | No-code websites (Webflow competitor) |

---

## VERTICAL OS SERVICES

| Service | Features |
|---------|----------|
| REZ-restaurant-service | Restaurant operations |
| REZ-home-services | Home services booking |
| REZ-healthcare-service | Healthcare management |
| REZ-distribution-os | Distributor management |
| REZ-manufacturing-os | Production & supply chain |
| REZ-franchise-os | Franchise management |
| REZ-procurement-os | Procurement management |

---

## INTELLIGENCE SERVICES

| Service | Features |
|---------|----------|
| REZ-unified-identity | Identity resolution |
| REZ-unified-attribution | Multi-channel attribution |
| REZ-graph-service | Commerce graph |
| REZ-autonomous-agents | 8 AI agents |
| REZ-ai-agent-studio | Conversational AI |
| REZ-workflow-builder | Journey automation |
| REZ-cod-intelligence | RTO prediction |
| REZ-checkout-optimization | 1-click checkout |
| REZ-personalization-engine | Personalization |
| REZ-signal-service | Signal/intent detection |
| REZ-intent-graph | Intent graph |

---

## SHOPIFY APPS (18 Apps)

| App | Features |
|-----|----------|
| rez-shopify-advanced-seo | SEO optimization |
| rez-shopify-agent | AI agent |
| rez-shopify-analytics | Analytics |
| rez-shopify-bundles | Product bundles |
| rez-shopify-gift-cards | Gift cards |
| rez-shopify-inventory | Inventory sync |
| rez-shopify-legal | Legal pages |
| rez-shopify-notify | Stock notifications |
| rez-shopify-predict | Demand prediction |
| rez-shopify-price-rules | Pricing rules |
| rez-shopify-product-feed | Product feed |
| rez-shopify-recover | Cart recovery |
| rez-shopify-referrals | Referrals |
| rez-shopify-reviews | Reviews |
| rez-shopify-rewards | Loyalty rewards |
| rez-shopify-segments | Customer segments |
| rez-shopify-social-login | Social login |
| rez-shopify-upsell | Upsell/cross-sell |

---

## TECHNOLOGY STACK

| Category | Technology |
|----------|------------|
| Runtime | Node.js 18+ |
| Language | TypeScript |
| Database | MongoDB 6+ |
| Cache | Redis 7+ |
| API Framework | Express.js |
| Authentication | JWT, OTP, TOTP, OAuth |
| Payments | Razorpay, UPI |
| Monitoring | Prometheus, Grafana |
| Container | Docker, Docker Compose |
| Security | Helmet, CORS, AES-256 |

---

## INTEGRATIONS

### External
- Razorpay (Payments)
- MongoDB (Database)
- Redis (Cache)
- Shopify (18 apps)
- WooCommerce (Connector)
- Prometheus/Grafana (Monitoring)

### Internal (RTNM Ecosystem)
- REZ-Consumer (Consumer apps)
- HOJAI AI (Intelligence)
- All vertical companies

---

## SECURITY (All 84 Issues Fixed)

| Issue Type | Before | After |
|------------|--------|--------|
| Critical | 22 | 0 |
| Major | 31 | 0 |
| Minor | 31 | 0 |
| **Total** | **84** | **0** |

### Key Fixes
- Python syntax in TypeScript (`os.getenv()` → `process.env`)
- XSS vulnerabilities (`innerHTML` → `textContent`)
- Hardcoded credentials → Environment variables
- Insecure CORS (`*` → explicit whitelist)
- Redis KEYS command → Set-based approach
- Infinite loops → Proper retry limits

---

## DOCUMENTATION

| Document | Purpose |
|----------|---------|
| README.md | Overview |
| CLAUDE.md | Developer guide |
| COMPLETE-FEATURES.md | Full feature list |
| RAP.md | Service registry |
| API.md | API reference |
| SECURITY-AUDIT-REPORT.md | Security audit |
| DEPLOYMENT.md | Deployment guide |

---

**Version:** 1.0.0
**Last Updated:** June 14, 2026
**Status:** ✅ ALL 178+ SERVICES PRODUCTION READY
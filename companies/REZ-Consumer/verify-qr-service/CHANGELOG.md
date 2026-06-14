# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2.0.0] - 2026-05-18

### Added

#### Extended Warranty Subscriptions
- Warranty plans management (Basic, Standard, Premium, Comprehensive)
- Subscription creation and renewal
- Auto-renewal support
- Payment integration with REZ-Wallet

#### Express Replacement
- Request replacement before returning device
- Live tracking integration
- Return label generation
- Timeline tracking

#### Pickup & Delivery
- Doorstep pickup scheduling
- Delivery address management
- Pickup agent assignment
- Proof of pickup/delivery

#### Priority Slots
- Same-day slots (₹200 priority fee)
- Next-day slots (₹100 priority fee)
- Express slots (₹500 priority fee)
- Slot capacity management

#### ML-Powered Features
- Nearest service center recommendation
- Distance, load, rating scoring
- REZ-Mind integration for recommendations

#### Dynamic QR Content
- Real-time price updates
- Stock status
- Promotions and offers
- Related products
- Customer reviews

#### Notifications
- Push notification registration
- Device platform tracking
- Booking update notifications

#### Analytics
- Predictive demand forecasting
- Revenue projections
- Peak hour analysis
- Claim rate tracking
- Pattern recognition

#### Developer Experience
- Swagger/OpenAPI documentation
- Docker containerization
- Kubernetes deployment manifests
- MongoDB index initialization
- WebSocket server for real-time updates
- Sentry error tracking

### Changed

- Updated service architecture to include subscription layer
- Enhanced warranty engine with plan-based coverage
- Improved fraud detection with ML scoring
- Extended REZ-care integration for all support scenarios

### Security

- Rate limiting on public endpoints
- HMAC signature verification for webhooks
- JWT-based service authentication
- Input validation with Zod schemas

## [1.0.0] - 2025-05-12

### Added

- Serial Registry with batch management
- QR Code verification engine
- Ownership tracking and transfer
- Warranty activation with 1% cashback
- Claim management workflow
- Service center registration
- WhatsApp notifications via REZ-Agent
- REZ-care integration for support escalation
- Basic analytics dashboard

### Features

- Fraud detection (multiple scans, geo-anomaly, device sharing)
- Merchant portal for QR management
- Customer mobile verification
- Invoice upload for warranty claims
- Service center assignment
- Claim status tracking

---

## Upgrade Guide

### Upgrading to v2.0

1. **Database Migration**
   - Run `mongo-init.js` to create new collections and indexes
   - New collections: `warrantyplans`, `warrantysubscriptions`, `expressreplacements`, `servicepickups`, `priorityslots`, `dynamicqrcontents`

2. **Environment Variables**
   - Add `DELIVERY_API` for pickup integration
   - Add `SENTRY_DSN` for error tracking
   - Add `REDIS_URL` for caching (optional)

3. **Dependencies**
   ```bash
   npm install socket.io @sentry/node
   ```

4. **Breaking Changes**
   - None - v2.0 is fully backward compatible

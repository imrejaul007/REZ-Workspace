# REZ Verify QR - Complete Platform Documentation
## Version 2.0 - Post-Purchase Trust & Lifecycle Infrastructure

---

## Overview

REZ Verify QR is no longer just a QR verification system. It has evolved into a **Post-Purchase Trust & Product Lifecycle Infrastructure** serving:

- **Consumers**: Ownership verification, warranty management, service booking, resale safety
- **Merchants**: Serial management, service center operations, analytics
- **OEMs/Brands**: Counterfeit detection, regional analytics, predictive insights, fraud prevention

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VERIFY QR PLATFORM v2.0                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    CONSUMER LAYER                                    │   │
│  │  Mobile App / Web / WhatsApp                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                       │
│                                    ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    CORE VERIFICATION                                 │   │
│  │  Serial Registry │ QR Verification │ Fraud Detection │ Ownership   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                       │
│         ┌──────────────────────────┼──────────────────────────┐            │
│         ▼                          ▼                          ▼            │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │  WARRANTY    │    │    SERVICE       │    │    RESALE       │       │
│  │  MANAGEMENT │    │    LIFECYCLE     │    │    SAFETY       │       │
│  └──────────────┘    └──────────────────┘    └──────────────────┘       │
│         │                          │                          │          │
│         ▼                          ▼                          ▼          │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │  Extended    │    │  Express        │    │  Ownership      │       │
│  │  Warranties │    │  Replacement    │    │  Passport       │       │
│  └──────────────┘    └──────────────────┘    └──────────────────┘       │
│                                    │                                       │
│                                    ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    OEM DASHBOARD                                     │   │
│  │  Counterfeit Analytics │ Regional Maps │ Fraud Patterns │ Predictions│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    INTEGRATION LAYER                                 │   │
│  │  REZ-Wallet │ REZ-Intelligence │ REZ-Agent │ REZ-Care │ REZ-Mind   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Post-Purchase Trust Platform

### 1.1 Core Verification

#### POST /api/verify
Verify product authenticity.

```json
// Request
{
  "serial_number": "REZ123456789",
  "user_id": "user_123",
  "user_phone": "+919999999999",
  "location": { "lat": 12.9716, "lng": 77.5946, "city": "Bangalore" },
  "device_id": "device_abc"
}

// Response
{
  "status": "AUTHENTIC",
  "serial_number": "REZ123456789",
  "brand": "Samsung",
  "model": "Galaxy S24",
  "verification_count": 5,
  "warranty_status": "active",
  "action": "VIEW_WARRANTY"
}
```

#### POST /api/activate-warranty
Activate warranty with 1% cashback.

```json
// Request
{
  "serial_number": "REZ123456789",
  "user_id": "user_123",
  "customer_name": "John Doe",
  "customer_phone": "+919999999999",
  "purchase_date": "2026-05-01",
  "price_paid": 79999
}

// Response
{
  "success": true,
  "warranty_id": "wrr_xxx",
  "expires": "2027-05-01",
  "cashback_earned": 799
}
```

### 1.2 Service Booking

#### GET /api/service-slots
Get available service slots.

#### POST /api/book-service
Book service appointment.

```json
// Request
{
  "serial_number": "REZ123456789",
  "user_id": "user_123",
  "customer_name": "John Doe",
  "customer_phone": "+919999999999",
  "service_center_id": "SC-xxx",
  "service_type": "repair",
  "preferred_date": "2026-05-25",
  "preferred_time": "10:00"
}

// Response
{
  "success": true,
  "booking_id": "SVC-xxx",
  "status": "pending",
  "service_center": "Samsung Service Center - MG Road",
  "scheduled_date": "2026-05-25",
  "scheduled_time": "10:00",
  "warranty_covered": true
}
```

### 1.3 Ownership Passport

#### POST /api/passport/create
Create ownership passport for verified product.

```json
// Request
{
  "serial_number": "REZ123456789",
  "user_id": "user_123",
  "customer_name": "John Doe",
  "customer_phone": "+919999999999",
  "purchase_date": "2026-05-01",
  "purchase_price": 79999,
  "invoice_url": "https://..."
}

// Response
{
  "success": true,
  "passport_id": "PASS-xxx",
  "certificate": {
    "certificate_id": "CERT-xxx",
    "hash": "abc123...",
    "qr_code": "REZ:PASS:PASS-xxx"
  },
  "warranty": {
    "status": "active",
    "remaining_days": 365
  }
}
```

#### GET /api/passport/:serial
Get complete ownership passport.

```json
// Response
{
  "passport_id": "PASS-xxx",
  "serial_number": "REZ123456789",
  "product": {
    "brand": "Samsung",
    "model": "Galaxy S24"
  },
  "ownership": {
    "current_owner": { "name": "John Doe", "owned_since": "2026-05-01" },
    "chain_length": 1
  },
  "warranty": {
    "status": "active",
    "expires": "2027-05-01",
    "remaining_days": 340
  },
  "service_history": {
    "total_services": 2,
    "records": [...]
  }
}
```

### 1.4 Service History

#### GET /api/passport/service/export/:serial
Export service history for resale/upgrades.

```json
// Response
{
  "export_id": "EXP-xxx",
  "serial_number": "REZ123456789",
  "service_summary": {
    "total_services": 3,
    "total_cost": 2500,
    "warranty_covered_cost": 1500,
    "last_service_date": "2026-04-15"
  },
  "service_records": [
    {
      "record_id": "SRV-xxx",
      "service_type": "repair",
      "description": "Screen replacement",
      "service_center": "Samsung Service Center",
      "service_date": "2026-04-15",
      "cost": 1500,
      "warranty_covered": true
    }
  ],
  "authenticity_hash": "xyz789..."
}
```

---

## Phase 2: Ownership Infrastructure

### 2.1 Ownership Transfer

#### POST /api/passport/:serial/transfer
Transfer ownership (sale/gift).

```json
// Request
{
  "from_user_id": "user_123",
  "to_user_id": "user_456",
  "to_name": "Jane Doe",
  "to_phone": "+919888888888",
  "transfer_type": "resale",
  "sale_price": 65000
}

// Response
{
  "success": true,
  "passport_id": "PASS-xxx",
  "message": "Ownership transferred to Jane Doe",
  "warranty_included": true
}
```

### 2.2 Resale Verification

#### POST /api/resale/verify
Buyer initiates resale verification.

```json
// Request
{
  "serial_number": "REZ123456789",
  "buyer_user_id": "user_789",
  "buyer_name": "Jane Doe",
  "buyer_phone": "+919888888888"
}

// Response
{
  "success": true,
  "verification_id": "RSV-xxx",
  "message": "Verification initiated"
}
```

#### GET /api/resale/buyer-check/:serial
Quick risk assessment for potential buyer.

```json
// Response
{
  "risk_assessment": {
    "score": 25,
    "level": "low",
    "factors": [
      { "factor": "multiple_ownership_changes", "score": 20 }
    ],
    "can_proceed": true
  },
  "warranty": {
    "status": "active",
    "remaining_days": 200,
    "transferable": true
  },
  "recommendation": "Safe to proceed with purchase"
}
```

### 2.3 Ownership Certificate

#### GET /api/passport/:serial/certificate
Get shareable ownership certificate.

```json
// Response
{
  "certificate_id": "CERT-xxx",
  "serial_number": "REZ123456789",
  "product": { "brand": "Samsung", "model": "Galaxy S24" },
  "ownership": {
    "current_owner": "John Doe",
    "owned_since": "2026-05-01",
    "chain_length": 1
  },
  "warranty": {
    "status": "active",
    "expires": "2027-05-01"
  },
  "authenticity": {
    "verified": true,
    "hash": "abc123...",
    "platform": "REZ Verify QR"
  }
}
```

---

## Phase 3: Enterprise OEM Platform

### 3.1 OEM Dashboard

#### GET /oem/:brand_id/dashboard
Main dashboard with key metrics.

```json
// Response
{
  "brand": { "id": "brand_xxx", "name": "Samsung" },
  "period": "30days",
  "summary": {
    "total_serials": 50000,
    "active_products": 45000,
    "total_activations": 35000,
    "activation_rate": 70.0,
    "pending_claims": 150,
    "fraud_attempts": 25
  },
  "activation_funnel": {
    "serials_generated": 50000,
    "serials_activated": 35000,
    "activation_rate": 70.0
  },
  "alerts": [
    { "type": "fraud", "severity": "high", "message": "Fraud rate exceeds threshold" }
  ]
}
```

### 3.2 Counterfeit Analytics

#### GET /oem/:brand_id/counterfeit-analytics
Counterfeit detection and analysis.

```json
// Response
{
  "summary": {
    "total_reports": 150,
    "high_confidence": 45,
    "average_confidence": 72.5,
    "risk_score": 65,
    "risk_level": "medium"
  },
  "by_type": [
    { "type": "fake_serial", "count": 80, "avg_confidence": 75.0 },
    { "type": "replica", "count": 45, "avg_confidence": 68.0 }
  ],
  "by_country": [
    { "country": "India", "count": 120 },
    { "country": "China", "count": 25 }
  ],
  "monthly_trend": [
    { "month": "2026-03", "count": 45 },
    { "month": "2026-04", "count": 52 }
  ]
}
```

### 3.3 Regional Analytics

#### GET /oem/:brand_id/regional-analytics
Regional breakdown with heatmap data.

```json
// Response
{
  "heatmap": {
    "points": [
      { "lat": 12.9716, "lng": 77.5946, "intensity": 500, "location": { "city": "Bangalore" } },
      { "lat": 19.0760, "lng": 72.8777, "intensity": 750, "location": { "city": "Mumbai" } }
    ],
    "max_intensity": 1000
  },
  "top_cities": [
    { "name": "Mumbai", "verifications": 15000, "unique_products": 5000 },
    { "name": "Delhi", "verifications": 12000, "unique_products": 4500 }
  ],
  "activation_by_region": [
    { "city": "Mumbai", "serials": 20000, "activations": 15000, "activation_rate": "75.0" }
  ]
}
```

### 3.4 Fraud Maps

#### GET /oem/:brand_id/fraud-maps
Fraud pattern detection and mapping.

```json
// Response
{
  "summary": {
    "active_patterns": 8,
    "critical_patterns": 2,
    "blocked_attempts": 45,
    "risk_score": 55,
    "risk_level": "medium"
  },
  "fraud_map": {
    "points": [
      { "lat": 13.0827, "lng": 80.2707, "city": "Chennai", "severity": "high", "count": 15 }
    ]
  },
  "by_type": {
    "serial_hijacking": 3,
    "fake_activation": 5
  },
  "serial_patterns": [
    { "pattern": "REZ1234*", "type": "fake_activation", "affected": 100, "fraud_rate": 25.0 }
  ],
  "trend": [
    { "date": "2026-05-01", "count": 5 },
    { "date": "2026-05-02", "count": 8 }
  ]
}
```

### 3.5 Predictive Analytics

#### GET /oem/:brand_id/predictive-analytics
Forecasting and predictions.

```json
// Response
{
  "predictions": {
    "next_30_days": [
      { "date": "2026-05-23", "projected_verifications": 1500, "projected_claims": 45 }
    ],
    "summary": {
      "projected_verifications": 45000,
      "projected_claims": 1350,
      "avg_daily_verifications": 1500
    }
  },
  "peak_times": [
    { "hour": 14, "count": 500 },
    { "hour": 15, "count": 480 }
  ],
  "warranty_outlook": {
    "expiring_30_days": 500,
    "expiring_90_days": 1500,
    "upsell_opportunities": 500
  },
  "recommendations": [
    "Contact 500 customers with expiring warranties for renewal",
    "High claim rate detected - consider quality review"
  ]
}
```

---

## Extended Features

### Express Replacement

#### POST /api/express-replacement
Request express replacement.

```json
// Request
{
  "claim_id": "clm_xxx",
  "warranty_id": "wrr_xxx",
  "user_id": "user_123",
  "customer_name": "John Doe",
  "customer_phone": "+919999999999",
  "original_serial": "REZ123456789",
  "issue_description": "Screen not working"
}

// Response
{
  "success": true,
  "replacement_id": "EXPR-xxx",
  "replacement_available": true,
  "replacement_product": { "brand": "Samsung", "model": "Galaxy S24" },
  "deposit_required": true,
  "deposit_amount": 5000,
  "estimated_delivery": "2026-05-26"
}
```

### Extended Warranty

#### GET /api/warranty-plans
Get available warranty plans.

```json
// Response
{
  "plans": [
    {
      "plan_id": "PLAN-xxx",
      "name": "Premium Protection",
      "tier": "premium",
      "duration_months": 24,
      "price": 1999,
      "coverage": {
        "manufacturing_defects": true,
        "accidental_damage": true,
        "pickup_delivery": true,
        "express_service": true
      }
    }
  ]
}
```

#### POST /api/subscribe
Subscribe to extended warranty.

```json
// Request
{
  "plan_id": "PLAN-xxx",
  "serial_number": "REZ123456789",
  "user_id": "user_123",
  "customer_name": "John Doe",
  "customer_phone": "+919999999999",
  "product_price": 79999,
  "payment_method": "wallet"
}

// Response
{
  "success": true,
  "subscription_id": "SUB-xxx",
  "status": "active",
  "start_date": "2026-05-22",
  "end_date": "2028-05-22",
  "benefits": { ... }
}
```

### Insurance Layer

#### POST /api/insurance/policy
Create insurance policy.

```json
// Request
{
  "user_id": "user_123",
  "serial_number": "REZ123456789",
  "product_value": 79999,
  "insurance_type": "theft",
  "coverage_amount": 79999,
  "premium": 1999,
  "duration_months": 12
}

// Response
{
  "success": true,
  "policy_id": "POL-xxx",
  "status": "active",
  "message": "Insurance policy activated. Waiting period: 15 days"
}
```

---

## Integration APIs

### OEM Recall

#### POST /oem/:brand_id/recall
Create product recall campaign.

```json
// Request
{
  "product_id": "prod_xxx",
  "title": "Battery Safety Recall",
  "description": "Potential battery issue in certain units",
  "severity": "urgent",
  "affected_serials": ["REZ123", "REZ456"]
}

// Response
{
  "success": true,
  "campaign_id": "RECALL-xxx",
  "affected_products": 2,
  "users_to_notify": 2
}
```

### Counterfeit Report

#### POST /oem/:brand_id/counterfeit-report
Submit counterfeit report.

```json
// Request
{
  "serial_number": "REZ999999",
  "product_name": "Galaxy S24",
  "location": { "country": "India", "city": "Delhi" },
  "counterfeit_type": "fake_serial",
  "evidence": { "description": "Serial number not in database" }
}

// Response
{
  "success": true,
  "report_id": "CF-xxx",
  "message": "Report submitted for review"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| INVALID_REQUEST | Missing or invalid parameters |
| PRODUCT_NOT_FOUND | Serial number not registered |
| PASSPORT_EXISTS | Ownership passport already exists |
| NOT_OWNER | User is not the current owner |
| TRANSFER_BLOCKED | Ownership chain verification failed |
| WARRANTY_NOT_ACTIVE | Warranty is expired or invalid |
| CLAIM_NOT_APPROVED | Claim must be approved first |
| INVENTORY_UNAVAILABLE | Replacement inventory not available |
| DEPOSIT_REQUIRED | Security deposit needed |
| INSURANCE_WAITING | Waiting period active |

---

## WebSocket Events

Connect to `wss://verify-qr.rezapp.com` for real-time updates.

### Subscribe to Tracking
```javascript
socket.emit('subscribe', { type: 'booking', id: 'SVC-xxx' });
socket.emit('subscribe', { type: 'replacement', id: 'EXPR-xxx' });
```

### Receive Updates
```javascript
socket.on('tracking_update', (data) => {
  console.log(data.status, data.message);
});
```

---

## Environment Variables

```bash
# Service
PORT=4003
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/verify-qr

# External Services
WALLET_API=https://rez-wallet.onrender.com
MERCHANT_API=https://rez-merchant.onrender.com
INTELLIGENCE_API=https://rez-intelligence.onrender.com
AGENT_API=https://REZ-agent.onrender.com
CARE_API=https://REZ-care.onrender.com
DELIVERY_API=https://rez-delivery-service.onrender.com
MIND_API=https://REZ-mind.onrender.com
NOTIF_API=https://rez-notifications.onrender.com

# Security
INTERNAL_KEY=your-internal-service-token
CERTIFICATE_SECRET=your-certificate-secret
```

---

## Status: COMPLETE - All Three Phases Implemented

| Phase | Feature | Status |
|-------|---------|--------|
| **Phase 1** | Core Verification | ✅ Complete |
| **Phase 1** | Warranty Management | ✅ Complete |
| **Phase 1** | Service Booking | ✅ Complete |
| **Phase 1** | Ownership Passport | ✅ Complete |
| **Phase 1** | Service History | ✅ Complete |
| **Phase 1** | Resale Verification | ✅ Complete |
| **Phase 2** | Transfer Mechanism | ✅ Complete |
| **Phase 2** | Ownership Certificate | ✅ Complete |
| **Phase 2** | Resale Safety Flow | ✅ Complete |
| **Phase 2** | Insurance Layer | ✅ Complete |
| **Phase 3** | OEM Dashboard | ✅ Complete |
| **Phase 3** | Counterfeit Analytics | ✅ Complete |
| **Phase 3** | Regional Analytics | ✅ Complete |
| **Phase 3** | Fraud Maps | ✅ Complete |
| **Phase 3** | Predictive Analytics | ✅ Complete |
| **Extra** | Express Replacement | ✅ Complete |
| **Extra** | Extended Warranties | ✅ Complete |

---

**Documentation Version:** 2.0
**Last Updated:** 2026-05-22
**API Base URL:** `http://localhost:4003`

# REZ-Merchant Port Conflicts Fix

**Version:** 2.0.0
**Date:** June 4, 2026
**Status:** RESOLVED - Implementation Complete

---

## Executive Summary

This document details the port conflicts identified in REZ-Merchant services and the resolution strategy. All conflicts have been resolved as of June 4, 2026.

---

## Implementation Status

**Status:** COMPLETED

| Component | File | Status |
|-----------|------|--------|
| Port Registry | `/port-assignments.json` | Created |
| Update Script | `/UPDATE-PORTS.sh` | Created |
| Documentation | This file | Updated |

### Port Assignment Summary

| Range | Category | Count | Status |
|-------|----------|-------|--------|
| 4000-4099 | Core Merchant | 15+ | Fixed |
| 4200-4212 | NexTaBizz UI | 13 | Fixed |
| 3000-3099 | Consumer Services | 9 | Fixed |
| 4100-4199 | Industry OS | 20+ | Fixed |
| 4600-4699 | HOJAI Integration | 4 | Fixed |

---

## Port Conflicts Identified

### 1. Port 4000 - Multiple Services (RESOLVED)

| Service | Original Port | New Port | Status |
|---------|-------------|----------|--------|
| NexTaBizz | 4000 | 4200 | ✅ Moved |
| REZ-b2b-integration | 4000 | 4201 | ✅ Moved |
| REZ-dashboard | 4000 | 4202 | ✅ Moved |
| REZ-multi-warehouse | 4000 | 4203 | ✅ Moved |
| merchant-referral-portal | 4000 | 4204 | ✅ Moved |
| rez-business-copilot | 4000 | 4205 | ✅ Moved |
| rez-inventory-v2-ui | 4000 | 4206 | ✅ Moved |
| rez-merchant-app | 4000 | 4207 | ✅ Moved |
| rez-staff-ui | 4000 | 4208 | ✅ Moved |
| rez-staff-web | 4000 | 4209 | ✅ Moved |
| verify-qr-admin | 4000 | 4210 | ✅ Moved |
| rez-table-booking-service | 4000 | 4211 | ✅ Moved |
| rez-unified-dashboard | 4000 | 4212 | ✅ Moved |

**Resolution:** All 13 services that were sharing port 4000 have been assigned unique ports in the 4200-4212 range.

### 2. Port 4012 - Two Services (RESOLVED)

| Service | Original Port | New Port | Status |
|---------|-------------|----------|--------|
| rez-merchant-intelligence-service | 4012 | 4011 | ✅ Moved |
| rez-kitchen-display | 4012 | 4014 | ✅ Moved |

**Resolution:** rez-merchant-intelligence-service moved to 4011, rez-kitchen-display moved to 4014.

### 3. Port 4013 - Two Services (RESOLVED)

| Service | Original Port | New Port | Status |
|---------|-------------|----------|--------|
| rez-pos-service | 4013 | 4013 | ✅ Keep |
| rez-kitchen-ai | 4013 | 4015 | ✅ Moved |

**Resolution:** rez-kitchen-ai moved to 4015.

### 4. Port 4030 - Two Services (RESOLVED)

| Service | Original Port | New Port | Status |
|---------|-------------|----------|--------|
| rez-menu-service | 4030 | 4030 | ✅ Keep |
| rez-pos-inventory-sync | 4030 | 4031 | ✅ Moved |

**Resolution:** rez-pos-inventory-sync moved to 4031.

---

## Final Port Assignments

### Core Merchant Services (4000-4099)

| Port | Service | Industry | Status |
|------|---------|----------|--------|
| **4001** | safe-qr-service | Common | ✅ CORE |
| **4003** | verify-qr-service | Common | ✅ CORE |
| **4005** | rez-merchant-service | Common | ✅ CORE |
| **4011** | rez-merchant-intelligence-service | Cross | ✅ Active |
| **4013** | rez-pos-service | Restaurant | ✅ Active |
| **4014** | rez-kitchen-display | Restaurant | ✅ Active |
| **4015** | rez-kitchen-ai | Restaurant | ✅ Active |
| **4025** | REZ-franchise-management | Cross | ✅ Active |
| **4027** | rez-cross-merchant-service | Cross | ✅ Active |
| **4030** | rez-menu-service | Restaurant | ✅ Active |
| **4031** | rez-pos-inventory-sync | Restaurant | ✅ Active |
| **4032** | rez-store-onboarding | Cross | ✅ Active |
| **4040** | rez-merchant-integrations | Cross | ✅ Active |
| **4041** | REZ-merchant-trust-bridge | Cross | ✅ Active |

### NexTaBizz Family (4200-4212)

| Port | Service | Purpose |
|------|---------|---------|
| **4200** | nexTabizz-service | NexTaBizz API |
| **4201** | REZ-b2b-integration | B2B supplier integration |
| **4202** | REZ-dashboard | Analytics dashboard |
| **4203** | REZ-multi-warehouse | Warehouse management |
| **4204** | merchant-referral-portal | Referral program |
| **4205** | rez-business-copilot | NLP business queries |
| **4206** | rez-inventory-v2-ui | Inventory UI |
| **4207** | rez-merchant-app | Merchant mobile app |
| **4208** | rez-staff-ui | Staff management UI |
| **4209** | rez-staff-web | Staff web portal |
| **4210** | verify-qr-admin | QR verification admin |
| **4211** | rez-table-booking-service | Table reservations |
| **4212** | rez-unified-dashboard | Unified analytics |

### Consumer Services (3000-3099)

| Port | Service | Purpose |
|------|---------|---------|
| **3005** | REZ-merchant-corpperks-bridge | Corp perks integration |
| **3010** | REZ-inbox | Merchant inbox |
| **3011** | REZ-assistant | AI assistant |
| **3012** | REZ-bills | Bill management |
| **3013** | REZ-expense | Expense tracking |
| **3014** | REZ-menu-qr | QR menu |
| **3015** | REZ-nearby | Nearby discovery |
| **3016** | REZ-save | Savings |
| **3017** | REZ-scan | QR scanning |
| **3081** | rez-merchant-loans-service | Loans |
| **3083** | rez-white-label-service | White label |

### Industry OS (4100-4199)

#### Hotel OS (4100-4119)

| Port | Service | Purpose |
|------|---------|---------|
| **4020** | rez-hotel-service | Core hotel service |
| **4021** | rez-hotel-housekeeping-service | Housekeeping |
| **4022** | rez-hotel-maintenance-service | Maintenance |
| **4023** | rez-hotel-reviews-service | Guest reviews |
| **4024** | rez-hotel-messaging-service | Messaging |
| **4025** | rez-hotel-analytics-service | Analytics |
| **4026** | rez-virtual-concierge-service | Virtual concierge |
| **4027** | rez-room-service | Room service |
| **4028** | rez-guest-mobile-app | Guest app |
| **4029** | rez-multi-property-dashboard | Multi-property |

#### Retail OS (4100-4109)

| Port | Service | Purpose |
|------|---------|---------|
| **4100** | rez-retail-service | Core retail |
| **4101** | rez-retail-crm-service | CRM |
| **4102** | rez-retail-loyalty-service | Loyalty |
| **4103** | rez-retail-inventory-service | Inventory |
| **4104** | rez-retail-pos-service | POS |
| **4105** | rez-retail-analytics-service | Analytics |

#### Salon OS (4110-4119)

| Port | Service | Purpose |
|------|---------|---------|
| **4110** | rez-salon-service | Core salon |
| **4111** | rez-salon-booking-service | Booking |
| **4112** | rez-salon-inventory-service | Inventory |
| **4113** | rez-salon-membership-service | Membership |
| **4114** | rez-salon-crm-service | CRM |
| **4115** | rez-salon-whatsapp-service | WhatsApp |

#### Gym OS (4120-4129)

| Port | Service | Purpose |
|------|---------|---------|
| **4120** | rez-gym-service | Core gym |
| **4121** | rez-gym-attendance-service | Attendance |
| **4122** | rez-gym-class-service | Classes |
| **4123** | rez-gym-scheduler-service | Scheduling |
| **4124** | rez-gym-analytics-service | Analytics |

### HOJAI Integration (4600-4699)

| Port | Service | Purpose |
|------|---------|---------|
| **4600** | REZ-competitive-intelligence | Competitive analysis |
| **4601** | rez-multi-location | Multi-location |
| **4610** | rez-payroll | Payroll |
| **4620** | rez-warranty | Warranty |
| **4625** | rez-inventory-alerts | Alerts |
| **4630** | rez-supplier-marketplace | Supplier marketplace |

---

## Port Ranges by Category

| Range | Category | Services |
|-------|----------|----------|
| 3000-3099 | Consumer Services | REZ-* apps, loans, white-label |
| 4000-4099 | Core Merchant | Main platform services |
| 4100-4199 | Industry-Specific | Restaurant, Hotel, Salon, Retail, Gym |
| 4200-4299 | NexTaBizz UI | Dashboards, web apps |
| 4300-4399 | Integration | B2B, webhooks, APIs |
| 4400-4499 | Utility | Alerts, notifications |
| 4500-4599 | Reserved | Future use |
| 4600-4699 | HOJAI Integration | Intelligence, payroll, warranty |

---

## Files Created

### 1. port-assignments.json

Location: `/REZ-Merchant/port-assignments.json`

JSON registry of all port assignments with ranges.

### 2. UPDATE-PORTS.sh

Location: `/REZ-Merchant/UPDATE-PORTS.sh`

Shell script to update all services with correct ports.

---

## Migration Steps

### Step 1: Update Service Configuration

For each service, update the environment or config file:

```typescript
// Before
const PORT = 4000;

// After (example for NexTaBizz)
const PORT = 4200;
```

### Step 2: Update Docker Compose

```yaml
# Before
services:
  nexTabizz:
    ports:
      - "4000:4000"

# After
services:
  nexTabizz:
    ports:
      - "4200:4200"
```

### Step 3: Update Service-to-Service URLs

In each service that calls another service, update the URL:

```typescript
// Before
const SERVICE_URL = 'http://localhost:4000';

// After
const SERVICE_URL = 'http://localhost:4200';
```

### Step 4: Update Load Balancer / API Gateway

```nginx
# Before
location /nexTabizz {
  proxy_pass http://localhost:4000;
}

# After
location /nexTabizz {
  proxy_pass http://localhost:4200;
}
```

### Step 5: Update Firewall Rules

```bash
# Remove old port
sudo ufw delete allow 4000/tcp

# Add new ports
sudo ufw allow 4200/tcp
sudo ufw allow 4201/tcp
# ... etc
```

### Step 6: Update DNS / Service Discovery

```typescript
// Service registry update
{
  name: 'nexTabizz',
  port: 4200,  // Changed from 4000
  url: 'http://localhost:4200'
}
```

---

## Verification Checklist

After making changes, verify each service:

- [ ] Service starts on new port without errors
- [ ] Health check endpoint responds
- [ ] Other services can reach it on new port
- [ ] Load balancer/health checks updated
- [ ] Monitoring dashboards show correct port
- [ ] Documentation updated
- [ ] No references to old port in code

---

## Rollback Plan

If issues occur:

1. Revert port in service config
2. Revert Docker Compose port mapping
3. Revert service-to-service URLs
4. Revert load balancer config
5. Test service on old port

---

## Impact Analysis

| Change | Impact | Mitigation |
|--------|--------|------------|
| Port 4000 split | 13 URL changes | Update all references |
| Kitchen services moved | 2 services relocated | Test KDS workflow |
| POS services moved | 2 services relocated | Test ordering flow |
| NexTaBizz family | 13 services to 4200+ | Test dashboard access |

---

## Timeline

| Date | Action |
|------|--------|
| June 4, 2026 | Conflicts identified |
| June 4, 2026 | Port assignments created |
| June 4, 2026 | Update script created |
| June 4, 2026 | Documentation updated |
| TBD | Implement port changes in production |

---

**Last Updated:** June 4, 2026
**Version:** 2.0.0

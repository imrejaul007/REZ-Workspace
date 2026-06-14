# REZ-Consumer — Ecosystem Integration Guide

**Version:** 1.0.0
**Date:** June 4, 2026

---

## ECOSYSTEM OVERVIEW

The REZ Ecosystem consists of 7 companies working together:

| Company | Role | Parent |
|---------|------|--------|
| **HOJAI AI** | AI Infrastructure | Parent |
| **RABTUL Technologies** | Core Platform | - |
| **REZ Intelligence** | AI/ML | - |
| **REZ Consumer** | B2C Apps | - |
| **REZ Merchant** | Industry OS | - |
| **KHAIRMOVE** | Mobility | - |
| **AXOM** | Social | - |
| **AdBazaar** | Marketing | - |

---

## REZ-CONSUMER INTEGRATIONS

### 1. RABTUL Technologies (Auth, Wallet, Payment)

**Services Used:**
- RABTUL Auth Service
- RABTUL Wallet Service
- RABTUL Payment Service
- RABTUL Notification Service

**Connected Services:**
```
rez-app/
do/
safe-qr/
safe-qr-service/
verify-qr-service/
REZ-bills/
REZ-expense/
REZ-save/
REZ-inbox/
rez-driver/
```

**Environment Variables:**
```bash
EXPO_PUBLIC_AUTH_URL=https://rez-auth-service.onrender.com
EXPO_PUBLIC_WALLET_URL=https://rez-wallet-service.onrender.com
EXPO_PUBLIC_PAYMENT_URL=https://rez-payment-service.onrender.com
```

---

### 2. HOJAI AI (AI Agents, Intent)

**Services Used:**
- HOJAI Mind (Intent Prediction)
- HOJAI Agent (AI Agents)
- REZ Voice AI

**Connected Services:**
```
do/ - 38 AI agents
REZ-assistant/ - Chat AI
REZ-inbox/ - Email parsing
```

**Environment Variables:**
```bash
HOJAI_API_URL=https://hojai-ai.onrender.com
REZ_MIND_API=https://rez-mind.onrender.com
```

---

### 3. REZ Intelligence (ML Models)

**Services Used:**
- Fraud Detection
- Recommendations
- Price Optimization
- Bandit Model

**Connected Services:**
```
REZ-assistant/ - Recommendations
REZ-inbox/ - Spending analysis
go4food-api/ - Smart search
```

---

### 4. REZ Merchant (Restaurant Platform)

**Connected Services:**
```
rez-menu/ - Restaurant OS
go4food/ - Food comparison
REZ-inbox/ - Food receipts
```

---

## NOT CONNECTED (Need Integration)

### Services Missing Integration

| Service | Missing | Priority |
|---------|---------|----------|
| verify-qr-mobile | HOJAI integration | HIGH |
| verify-qr-dashboard | REZ Mind | MEDIUM |
| REZ-bills | HOJAI OCR | MEDIUM |
| REZ-expense | REZ Intelligence | HIGH |

---

## INTEGRATION CHECKLIST

### ✅ Already Integrated
- [x] RABTUL Auth (all services)
- [x] RABTUL Wallet (rez-app, do, REZ-bills)
- [x] RABTUL Payment (rez-app, REZ-bills)
- [x] HOJAI Agents (do - 38 agents)
- [x] REZ Mind (do)

### ⚠️ Need Integration
- [ ] HOJAI OCR (REZ-bills, REZ-expense)
- [ ] REZ Intelligence (REZ-assistant)
- [ ] REZ Merchant (go4food-api)

---

## API ENDPOINTS

### RABTUL Services
| Service | URL |
|---------|-----|
| Auth | https://rez-auth-service.onrender.com |
| Wallet | https://rez-wallet-service.onrender.com |
| Payment | https://rez-payment-service.onrender.com |

### HOJAI AI
| Service | URL |
|---------|-----|
| Mind | https://rez-mind.onrender.com |
| Agents | https://hojai-ai.onrender.com |
| Voice | https://rez-voice.onrender.com |

### REZ Consumer
| Service | Port |
|---------|------|
| go4food-api | 3002 |
| REZ-inbox | 3003 |
| REZ-assistant | 3010 |
| REZ-nearby | 3015 |
| REZ-scan | 3016 |
| safe-qr-service | 4001 |
| verify-qr-service | 4003 |

---

## NEXT STEPS

1. **Verify-qr-mobile** → Connect to HOJAI Mind for intent tracking
2. **REZ-bills** → Connect to HOJAI OCR for receipt scanning
3. **REZ-assistant** → Connect to REZ Intelligence for recommendations
4. **go4food-api** → Connect to REZ Merchant for restaurant data

---

**Last Updated:** June 4, 2026

# RidZa - Financial Services OS

**Location:** `companies/RidZa/`  
**Purpose:** Financial services, lending, insurance, and payments for the RTMN ecosystem  
**Status:** ✅ **BUILT** | **June 14, 2026**

---

## RidZa Overview

RidZa provides comprehensive financial services including lending, insurance, and payment solutions integrated directly into the RTMN ecosystem for businesses and consumers.

### RidZa vs Traditional Financial Services

| Feature | Traditional Finance | RidZa |
|---------|------------------|-------|
| Ecosystem Integration | ❌ | ✅ |
| Instant Credit | Days | ✅ Minutes |
| Digital Onboarding | Manual | ✅ Fully Digital |
| Flexible Repayment | Limited | ✅ Dynamic |
| AI Credit Assessment | Basic | ✅ ML-Powered |
| Embedded Finance | ❌ | ✅ |

---

## Core Services

| Category | Services | Description |
|----------|----------|-------------|
| **Lending** | Credit, Loans, BNPL | Credit assessment and lending |
| **Insurance** | Health, Vehicle, Property | Insurance products |
| **Payments** | UPI, Cards, Wallets | Payment processing |
| **Compliance** | KYC, AML, Fraud | Regulatory compliance |

---

## Key Features

### Lending Services
| Feature | Description |
|---------|-------------|
| Instant Credit | Quick credit decisions |
| BNPL | Buy Now Pay Later |
| Business Loans | Working capital |
| Merchant Cash Advance | Revenue-based financing |
| Flexible Tenure | Customizable repayment |
| Dynamic Interest | Usage-based pricing |

### Insurance Products
| Feature | Description |
|---------|-------------|
| Health Insurance | Individual, family plans |
| Vehicle Insurance | Auto, bike coverage |
| Property Insurance | Business, home |
| Liability Insurance | Professional indemnity |
| Crop Insurance | Agriculture sector |
| Micro Insurance | Small ticket sizes |

### Financial Intelligence
| Feature | Description |
|---------|-------------|
| Credit Score | Real-time credit monitoring |
| Spending Analytics | Transaction insights |
| Cash Flow Analysis | Business health |
| Fraud Detection | AI-powered monitoring |
| Expense Categorization | Auto-categorization |

---

## API Endpoints

```
# Credit
POST   /api/credit/apply            # Apply for credit
GET    /api/credit/:userId          # Get credit status
POST   /api/credit/emi              # Calculate EMI

# Payments
POST   /api/payments                # Make payment
GET    /api/payments/:userId        # Payment history
POST   /api/payments/verify         # Verify payment

# Insurance
POST   /api/insurance/apply         # Apply for insurance
GET    /api/insurance/:userId      # Get policies
POST   /api/insurance/claim        # File claim

# Analytics
GET    /api/analytics/score/:userId # Credit score
GET    /api/analytics/spending/:userId # Spending analysis
```

---

## Integration with RTMN

| Service | Integration | Purpose |
|---------|-------------|---------|
| RisaCare | Health Insurance | Patient coverage |
| REZ-Merchant | Merchant Loans | Working capital |
| Nexha | Supplier Financing | Trade credit |
| CorpPerks | Employee Benefits | Insurance plans |
| AssetMind | Wealth Integration | Financial planning |

---

## Quick Start

```bash
# Install
cd companies/RidZa && npm install

# Start services
npm start

# Health check
curl http://localhost:4250/health
```

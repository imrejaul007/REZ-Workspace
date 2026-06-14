# RTNM Products Features Audit - RidZa

**Audit Date:** 2026-06-12  
**Company:** RidZa  
**Total Products:** 11  
**Total Features:** 150+

---

## Product Features Matrix

### 1. Finance Accountant
**Location:** `/finance-accountant/`  
**Port:** 3000 | **Stack:** Express + MongoDB + Redis

#### Core Features
| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Create Invoice | `/api/invoice` | POST | Create new invoice with items |
| Get Invoices | `/api/invoice/:tenantId` | GET | List invoices by tenant |
| Get Invoice | `/api/invoice/:tenantId/:invoiceId` | GET | Get single invoice |
| Update Status | `/api/invoice/:tenantId/:invoiceId/status` | PATCH | Update invoice status |
| Create Ledger | `/api/ledger` | POST | Create ledger entry |
| Get Ledger | `/api/ledger/:tenantId/:ledger` | GET | Get ledger entries |
| Ledger Summary | `/api/ledger/:tenantId/:ledger/summary` | GET | Get ledger totals |
| Tally Export | `/api/tally/export/:tenantId` | GET | Export to Tally XML |
| Tally Sync | `/api/tally/sync/:tenantId` | POST | Sync invoices to ledger |
| Sync Status | `/api/tally/sync/:tenantId/status` | GET | Get sync progress |

#### Additional Features
- [x] Multi-tenant isolation
- [x] Invoice item support with tax
- [x] GST calculation
- [x] Tally XML export
- [x] Ledger double-entry support
- [x] Invoice status tracking (draft/pending/paid/cancelled)
- [x] Date-based filtering
- [x] Pagination support
- [x] Invoice types (sales/purchase/credit/debit)
- [x] Running balance calculation

#### Invoice Types
- `sales` - Sales invoice
- `purchase` - Purchase invoice
- `credit` - Credit note
- `debit` - Debit note

#### Invoice Statuses
- `draft` - Invoice created but not sent
- `pending` - Invoice sent, awaiting payment
- `paid` - Payment received
- `cancelled` - Invoice cancelled

---

### 2. Finance AI
**Location:** `/finance-ai/`  
**Port:** 3000 | **Stack:** Express + MongoDB + Redis

#### Core Features
| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Create Transaction | `/api/transaction` | POST | Record new transaction |
| Get Transactions | `/api/transaction/:tenantId` | GET | List transactions |
| Get Transaction | `/api/transaction/:tenantId/:id` | GET | Get single transaction |
| Analyze Transaction | `/api/analysis/transaction` | POST | Fraud/risk analysis |
| Cashflow Prediction | `/api/analysis/:tenantId/prediction` | GET | Forecast cashflow |
| Spending Insights | `/api/analysis/:tenantId/insights` | GET | Spending analysis |
| Dashboard | `/api/analysis/:tenantId/dashboard` | GET | CFO dashboard data |

#### Transaction Types
- `income` - Revenue received
- `expense` - Money spent
- `transfer` - Internal transfer

#### Transaction Categories
`salary`, `rent`, `utilities`, `supplies`, `marketing`, `payroll`, `taxes`, `insurance`, `investment`, `loan`, `other`

#### Analytics Features
- [x] Transaction pattern analysis
- [x] Anomaly detection (z-score based)
- [x] Risk scoring (0-100)
- [x] Cashflow forecasting
- [x] Spending categorization
- [x] Trend analysis (up/down/stable)
- [x] Budget vs actual comparison
- [x] Anomaly insights generation
- [x] Category breakdown
- [x] Recommendation generation

---

### 3. Finance Auditor
**Location:** `/finance-auditor/`  
**Port:** 3000 | **Stack:** Express + MongoDB + Redis

#### Core Features
| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Detect Fraud | `/api/fraud/detect` | POST | Single transaction fraud check |
| Batch Fraud | `/api/fraud/batch` | POST | Batch fraud detection (up to 100) |
| Check Duplicate | `/api/duplicate/check` | POST | Duplicate invoice detection |
| Batch Duplicate | `/api/duplicate/batch-check` | POST | Batch duplicate check |
| Get Risk | `/api/risk/:tenantId` | GET | Get cached risk assessment |
| Assess Risk | `/api/risk/:tenantId/assess` | POST | Trigger new assessment |
| Get Alerts | `/api/alerts/:tenantId` | GET | List alerts |
| Acknowledge Alert | `/api/alerts/:alertId/acknowledge` | PUT | Acknowledge alert |
| Get Reports | `/api/reports/:tenantId` | GET | List audit reports |
| Generate Report | `/api/reports/:tenantId/generate` | POST | Generate audit report |

#### Risk Levels
- `low` - Normal transaction
- `medium` - Requires attention
- `high` - Action required
- `critical` - Immediate action needed

#### Alert Types
- `fraud` - Fraud detected
- `duplicate` - Duplicate transaction
- `compliance` - Compliance issue
- `anomaly` - Anomalous behavior

#### Report Types
- `internal` - Internal audit
- `external` - External audit
- `compliance` - Compliance report
- `fraud-investigation` - Fraud investigation

#### Audit Features
- [x] Real-time fraud detection
- [x] Pattern-based anomaly detection
- [x] Duplicate invoice hashing
- [x] Risk scoring (low/medium/high/critical)
- [x] Alert generation & management
- [x] Audit report generation
- [x] Transaction history tracking
- [x] Z-score based anomaly detection
- [x] 1-hour risk assessment cache
- [x] Batch processing support

---

### 4. Finance Budget Coach
**Location:** `/finance-budget-coach/`  
**Port:** 3000 | **Stack:** Express + MongoDB + Redis

#### Core Features
| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Get Budgets | `/api/budgets/:tenantId` | GET | List budgets |
| Create Budget | `/api/budgets/:tenantId` | POST | Create budget |
| Update Budget | `/api/budgets/:tenantId/:id` | PUT | Update budget |
| Delete Budget | `/api/budgets/:tenantId/:id` | DELETE | Delete budget |
| Get Advice | `/api/budgets/:tenantId/advice` | GET | Get AI recommendations |
| Simulate | `/api/simulate/:tenantId` | POST | Run scenario simulation |
| Categories | `/api/budgets/categories` | GET | List budget categories |

#### Budget Categories
- `housing` - Rent, mortgage
- `transportation` - Travel, fuel
- `food` - Groceries, dining
- `utilities` - Electricity, water, internet
- `healthcare` - Medical, insurance
- `entertainment` - Recreation, hobbies
- `savings` - Emergency fund, investments
- `debt` - Loan payments, EMIs
- `other` - Miscellaneous

#### Budget Features
- [x] Budget creation & management
- [x] AI-powered recommendations
- [x] Scenario simulation
- [x] Category-based tracking
- [x] Spending pattern analysis
- [x] Budget vs actual comparison
- [x] Priority-based recommendations (high/medium/low)
- [x] Action items generation
- [x] Fiscal year support
- [x] Multiple scenario support

---

### 5. Finance CFO
**Location:** `/finance-cfo/`  
**Port:** 3000 | **Stack:** Express + MongoDB + Redis

#### Core Features
| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Cashflow Analysis | `/api/cashflow/:tenantId` | GET | Analyze cash flow |
| Runway Calculation | `/api/runway/:tenantId` | GET | Calculate runway |
| Burn Rate | `/api/burnrate/:tenantId` | GET | Calculate burn rate |
| Get Alerts | `/api/alerts/:tenantId` | GET | Financial alerts |
| Dashboard | `/api/dashboard/:tenantId` | GET | Complete dashboard |
| Add Transaction | `/api/transactions/:tenantId` | POST | Record transaction |
| Update Financials | `/api/financials/:tenantId` | PUT | Update financial data |

#### Runway Status
- `healthy` - >12 months runway
- `warning` - 6-12 months runway
- `critical` - <6 months runway

#### CFO Features
- [x] Cash flow analysis
- [x] Runway calculation (months remaining)
- [x] Burn rate analysis
- [x] Financial health scoring
- [x] Alert generation
- [x] Trend analysis
- [x] Revenue/expense tracking
- [x] Forecast integration
- [x] Monthly breakdown
- [x] Scenario modeling (best/worst case)

---

### 6. Finance Collections
**Location:** `/finance-collections/`  
**Port:** 3000 | **Stack:** Express + MongoDB + Redis

#### Core Features
| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| AR Aging Report | `/api/aging/:tenantId` | GET | AR aging analysis |
| Create Follow-up | `/api/follow-up` | POST | Schedule follow-up |
| Get Receivables | `/api/receivables/:tenantId` | GET | List receivables |
| Update Receivable | `/api/receivables/:tenantId/:id` | PUT | Update receivable |
| Batch Reminders | `/api/reminders/:tenantId` | POST | Generate reminders |

#### Aging Buckets
- `current` - Not yet due
- `1-30` - 1-30 days overdue
- `31-60` - 31-60 days overdue
- `61-90` - 61-90 days overdue
- `91+` - Over 91 days overdue

#### Receivable Status
- `pending` - Awaiting payment
- `partial` - Partial payment received
- `paid` - Fully paid
- `overdue` - Past due date
- `cancelled` - Cancelled

#### Collection Features
- [x] AR aging buckets (0-30, 31-60, 61-90, 91+)
- [x] Automated follow-up scheduling
- [x] Channel selection (WhatsApp/Email/SMS)
- [x] Reminder templates
- [x] Payment recording
- [x] Aging analysis
- [x] Collection efficiency metrics
- [x] Escalation triggers
- [x] DSO calculation
- [x] Age-based escalation

---

### 7. Finance Compliance
**Location:** `/finance-compliance/`  
**Port:** 3000 | **Stack:** Express + MongoDB + Redis

#### Core Features
| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| GST Calculate | `/api/gst/calculate` | POST | Calculate GST |
| TDS Check | `/api/tds/:tenantId` | GET | TDS compliance check |
| TDS Calculate | `/api/tds/calculate` | POST | Calculate TDS |
| Payroll Compliance | `/api/payroll/compliance` | POST | Payroll compliance |
| Filing Reminders | `/api/filing/reminders` | GET | Upcoming deadlines |
| Compliance Status | `/api/status/:tenantId` | GET | Overall compliance |

#### GST Slabs
- 5% - Essential items
- 12% - Standard items
- 18% - Most goods/services
- 28% - Luxury items

#### TDS Sections
- 194A - Interest income (10%)
- 194C - Contractor payments (2%)
- 194H - Commission/brokerage (10%)
- 194I - Rent (10%/20%)
- 194J - Professional fees (10%)

#### TDS Rates
- 10% - Standard TDS
- 20% - Higher TDS
- 30% - Highest TDS

#### Compliance Features
- [x] GST calculation (5%, 12%, 18%, 28%)
- [x] HSN code validation
- [x] TDS calculation (10S, 20%, 30%)
- [x] Section-based TDS
- [x] Filing deadline tracking
- [x] Compliance status monitoring
- [x] Auto-reminder generation
- [x] Regulatory reporting
- [x] Payroll compliance checks
- [x] Due date tracking

---

### 8. Finance Payables
**Location:** `/finance-payables/`  
**Port:** 3000 | **Stack:** Express + MongoDB + Redis

#### Core Features
| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Create Vendor | `/api/vendors` | POST | Add new vendor |
| List Vendors | `/api/vendors/:tenantId` | GET | List all vendors |
| Get Vendor | `/api/vendors/:tenantId/:id` | GET | Get vendor details |
| Update Vendor | `/api/vendors/:tenantId/:id` | PUT | Update vendor |
| Delete Vendor | `/api/vendors/:tenantId/:id` | DELETE | Remove vendor |
| Create Bill | `/api/bills` | POST | Create bill |
| List Bills | `/api/bills/:tenantId` | GET | List all bills |
| Get Bill | `/api/bills/:tenantId/:id` | GET | Get bill details |
| Update Bill | `/api/bills/:tenantId/:id` | PUT | Update bill |
| Process Payment | `/api/bills/:tenantId/:id/pay` | POST | Pay bill |
| Payment Schedule | `/api/schedule/:tenantId` | GET | Get payment schedule |

#### Bill Status
- `pending` - Awaiting payment
- `approved` - Approved for payment
- `paid` - Payment completed
- `cancelled` - Bill cancelled

#### Payables Features
- [x] Vendor CRUD operations
- [x] Bill tracking
- [x] Payment scheduling
- [x] Cash flow optimization
- [x] GSTIN/PAN validation
- [x] Payment approval workflow
- [x] Due date tracking
- [x] Discount capture
- [x] Payment reminders
- [x] Multi-vendor support

---

### 9. Ridza Islamic Finance
**Location:** `/ridza-islamic-finance/`  
**Port:** 4530 | **Stack:** Express + MongoDB + Redis

#### Core Features
| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| BNPL Apply | `/api/bnpl/apply` | POST | Apply for BNPL |
| BNPL Plans | `/api/bnpl/plans` | GET | List BNPL plans |
| BNPL Calculate | `/api/bnpl/calculate` | POST | Calculate BNPL |
| Zakat Calculate | `/api/zakat/calculate` | POST | Calculate Zakat |
| Zakat History | `/api/zakat/history/:userId` | GET | Get Zakat history |
| Lending Apply | `/api/lending/apply` | POST | Apply for Islamic loan |
| Lending Status | `/api/lending/status/:id` | GET | Check application |
| Murabaha | `/api/lending/murabaha` | POST | Murabaha financing |
| Ijara | `/api/lending/ijara` | POST | Ijara (lease) financing |

#### Islamic Finance Products
- **Murabaha** - Cost-plus financing (seller buys item, sells at profit)
- **Ijara** - Lease financing (ownership remains with lessor)
- **Musharaka** - Partnership financing (profit/loss sharing)

#### Zakat Calculation
- 2.5% of total wealth above Nisab threshold
- Nisab = 85g of gold (approximately)

#### Islamic Finance Features
- [x] Sharia-compliant BNPL
- [x] Zakat calculator (2.5% of wealth)
- [x] Murabaha (cost-plus financing)
- [x] Ijara (lease financing)
- [x] Musharaka (partnership)
- [x] Gold price integration
- [x] Nisab threshold calculation
- [x] Payment scheduling
- [x] Sharia compliance validation
- [x] Islamic loan applications

---

### 10. Ridza Remittance
**Location:** `/ridza-remittance/`  
**Port:** 4540 | **Stack:** Express + MongoDB + Redis

#### Core Features
| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Get Quote | `/api/transfer/quote` | POST | Get transfer quote |
| Send Money | `/api/transfer/send` | POST | Initiate transfer |
| Transfer Status | `/api/transfer/:id` | GET | Check status |
| Cancel Transfer | `/api/transfer/:id/cancel` | POST | Cancel transfer |
| Exchange Rates | `/api/rates` | GET | Current rates |
| Rate Convert | `/api/rates/convert` | POST | Convert amount |
| Add Recipient | `/api/recipients` | POST | Add recipient |
| List Recipients | `/api/recipients` | GET | List recipients |
| Update Recipient | `/api/recipients/:id` | PUT | Update recipient |
| Delete Recipient | `/api/recipients/:id` | DELETE | Remove recipient |

#### Supported Currencies
USD, AED, INR, GBP, EUR, SAR, QAR, KWD, BHD, OMR

#### Transfer Status
- `pending` - Transfer initiated
- `processing` - Being processed
- `completed` - Transfer completed
- `failed` - Transfer failed
- `cancelled` - Transfer cancelled

#### Remittance Features
- [x] Real-time exchange rates
- [x] Multi-currency support (10+ currencies)
- [x] Transfer tracking
- [x] KYC integration
- [x] Recipient management
- [x] Rate locking
- [x] Fee calculation
- [x] Transfer limits
- [x] Transfer cancellation
- [x] Batch transfers

---

### 11. Services (Shared)
**Location:** `/services/`  
**Port:** 5200 | **Stack:** Express + In-Memory

#### Credit Service Features
| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Apply for Credit | `/api/credit/apply` | POST | Submit credit application |
| Get Credit Profile | `/api/credit/:customerId` | GET | Get credit profile |
| Approve Application | `/api/credit/:id/approve` | POST | Approve credit |
| Reject Application | `/api/credit/:id/reject` | POST | Reject credit |
| Disburse Loan | `/api/credit/:id/disburse` | POST | Disburse funds |
| Calculate EMI | `/api/credit/emi` | POST | Calculate EMI |
| Get Credit Score | `/api/credit/score/:customerId` | GET | Get credit score |
| Get Credit Report | `/api/credit/report/:customerId` | GET | Full credit report |

#### Credit Features
- [x] Eligibility calculation
- [x] Interest rate calculation
- [x] EMI calculation
- [x] Amortization schedule
- [x] Credit scoring (300-900)
- [x] Loan disbursement
- [x] Credit rating (Excellent/Good/Fair/Poor/Very Poor)
- [x] Payment history tracking

#### Insurance Service Features
| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Get Quote | `/api/insurance/quote` | POST | Get insurance quote |
| Buy Policy | `/api/insurance/policy` | POST | Purchase policy |
| File Claim | `/api/insurance/claim` | POST | File a claim |
| Claim Status | `/api/insurance/claim/:id` | GET | Check claim status |
| Get Policies | `/api/insurance/policies/:customerId` | GET | List policies |

#### Insurance Types
- Life
- Health
- Car
- Home
- Travel

#### Insurance Features
- [x] Insurance quotes
- [x] Policy management
- [x] Claims processing
- [x] Premium calculation
- [x] Coverage tracking
- [x] Claim status tracking

#### Hub Client Features
| Feature | Method | Description |
|---------|--------|-------------|
| callViaHub | POST | Call another service via hub |
| verifyToken | POST | Verify JWT token |
| processPayment | POST | Process payment |
| addCoins | POST | Add to wallet |
| sendNotification | POST | Send notification |

---

## RTNM Ecosystem Integration (NEW - June 2026)

### StayOwn Hotel OS Integration

#### Hotel Finance Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Finance Overview** | Complete hotel financial picture | ✅ |
| **Revenue Analytics** | Revenue breakdown by category | ✅ |
| **Expense Tracking** | Cost analysis and breakdown | ✅ |
| **Occupancy Analytics** | Occupancy rate and metrics | ✅ |
| **Credit Options** | Hotel financing and loans | ✅ |
| **Insurance Needs** | Recommended coverage for hotels | ✅ |
| **Apply for Credit** | Submit credit application | ✅ |

#### Hotel Insurance Products

| Product | Description | Status |
|---------|-------------|--------|
| **Property Insurance** | Building, furniture, fixtures | ✅ |
| **Business Interruption** | Revenue loss during closures | ✅ |
| **Public Liability** | Guest injuries, property damage | ✅ |

---

## Feature Summary

### Total Features by Category

| Category | Count | Products |
|----------|-------|----------|
| Accounting | 10 | accountant, payables |
| AI/Analytics | 12 | ai, auditor, budget-coach |
| Compliance | 10 | compliance |
| Collections | 10 | collections |
| CFO | 10 | cfo |
| Islamic Finance | 10 | islamic-finance |
| Remittance | 10 | remittance |
| Credit | 8 | services |
| Insurance | 6 | services |
| **Total** | **86** | **11 products** |

---

## Technology Features Matrix

| Feature | accountant | ai | auditor | budget | cfo | collections | compliance | payables | islamic | remit | services |
|---------|------------|-----|---------|--------|-----|-------------|------------|----------|---------|-------|----------|
| MongoDB | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Redis | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| JWT Auth | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Rate Limit | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Validation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Health Check | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Docker | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## API Method Summary

| Method | Count | Used For |
|--------|-------|----------|
| POST | 35 | Create operations |
| GET | 35 | Read operations |
| PUT | 10 | Update operations |
| PATCH | 2 | Partial updates |
| DELETE | 4 | Delete operations |
| **Total** | **86** | All REST methods |

---

## Related Documentation

- [RTNM-COMPANIES-AUDIT.md](RTNM-COMPANIES-AUDIT.md) - Company overview
- [FEATURES.md](./finance-accountant/FEATURES.md) - Product-specific features
- [CLAUDE.md](./finance-accountant/CLAUDE.md) - Development guide

---

**Last Updated:** 2026-06-12  
**Total Features:** 86+  
**Products Documented:** 11

### SUTAR SimulationOS (HOJAI AI)
**Port:** 4241 | **Service:** sutar-simulation-os | **Layer:** 5

#### Features

##### Scenario Planning ✅
| Feature | Status | Category |
|---------|--------|----------|
| Pricing Optimization | ✅ | PRICING |
| Offer Modeling | ✅ | OFFER |
| Cashback ROI | ✅ | CASHBACK |
| Bundle Pricing | ✅ | BUNDLE |

##### Forecasting ✅
| Feature | Status | Category |
|---------|--------|----------|
| Demand Forecasting | ✅ | DEMAND |
| Cash Flow Forecasting | ✅ | CASHFLOW |
| Revenue Forecasting | ✅ | REVENUE |
| Cost Forecasting | ✅ | COST |

##### Risk Modeling ✅
| Feature | Status | Category |
|---------|--------|----------|
| Financial Risk | ✅ | RISK |
| Operational Risk | ✅ | RISK |
| Market Risk | ✅ | RISK |
| Compliance Risk | ✅ | COMPLIANCE |

##### Sensitivity Analysis ✅
| Feature | Status | Category |
|---------|--------|----------|
| What-If Analysis | ✅ | /api/v1/simulations/:id/whatif |
| Impact Assessment | ✅ | ImpactSummary |
| Recommendation Engine | ✅ | Recommendation[] |

##### Operations ✅
| Feature | Status | Category |
|---------|--------|----------|
| Staffing Optimization | ✅ | STAFFING |
| Inventory Optimization | ✅ | INVENTORY |
| Procurement Analysis | ✅ | PROCUREMENT |

#### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/v1/simulations | POST | Run Monte Carlo simulation |
| /api/v1/simulations | GET | List simulations |
| /api/v1/simulations/:id | GET | Get simulation |
| /api/v1/simulations/:id | DELETE | Delete simulation |
| /api/v1/simulations/:id/whatif | POST | What-if analysis |
| /api/v1/simulations/compare | POST | Compare scenarios |

#### Implementation
- **Location:** `companies/hojai-ai/hojai-sutar-os/services/sutar-simulation-os/`
- **Technology:** Node.js, Express, TypeScript, Zod
- **Lines:** 1500+
- **Status:** Production Ready

---

### SUTAR OS - Autonomous Economic Infrastructure

**Company:** HOJAI AI | **Services:** 25 | **Status:** Production Ready

| Service | Port | Features |
|---------|------|----------|
| SimulationOS | 4241 | Monte Carlo, What-if, Forecasting, Risk, COMPLIANCE |
| Decision Engine | 4240 | Policy evaluation, Risk assessment, PROCEED/HOLD/REJECT |
| GoalOS | 4242 | Goal decomposition, OKR system |
| Negotiation Engine | 4191 | RFQ, Quotes, Counter-offers |
| Trust Engine | 4180 | Trust scoring, KYC, Credit check |
| Contract OS | 4190 | Contracts, Digital signatures |
| Economy OS | 4251 | Karma points, Transactions, Billing |
| Agent Network | 4155 | Registry, Capability matching |
| Marketplace | 4250 | Service listing, Ratings |
| Network Learning | 4243 | Pattern learning |
| Intent Bus | 4154 | Intent capture, Patterns |
| Memory Bridge | 4143 | Context storage |
| Gateway | 4140 | API routing |

**Simulation Types (14):** PRICING, OFFER, CASHBACK, BUNDLE, DEMAND, CASHFLOW, REVENUE, COST, RISK, COMPLIANCE, STAFFING, INVENTORY, PROCUREMENT, CUSTOM

**Decision Types (10):** OFFER, CASHBACK, PERSONALIZATION, ROUTING, FRAUD, PRICING, NEXT_ACTION, RETENTION, APPROVAL, RISK

---

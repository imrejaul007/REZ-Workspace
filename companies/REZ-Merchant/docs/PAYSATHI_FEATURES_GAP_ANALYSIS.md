# Paysaathi/Takkada vs ReZ Merchant — Feature Gap Analysis

**Source:** [https://www.paysaathi.com](https://www.paysaathi.com) + Takkada platform research  
**Date:** 2026-05-12  
**Purpose:** Identify missing B2B features in ReZ Merchant vs. competitors

---

## 1. Feature Comparison Matrix

| Feature | Paysaathi/Takkada | ReZ Merchant | Status |
|---------|-------------------|--------------|--------|
| **Supplier/ Vendor Management** | ✅ Full CRUD + GSTIN validation + PAN | ✅ Basic CRUD | Partial |
| **Purchase Orders (PO)** | ✅ Create + approve + track | ✅ Basic create/list/get | Partial |
| **Credit Limits per Supplier** | ✅ Per-vendor credit limit + period | ⚠️ `creditLimit` field exists, no logic | Missing |
| **Credit Period / Due Dates** | ✅ Due date tracking per invoice | ❌ No due date on POs | Missing |
| **Auto Interest on Overdue** | ✅ Configurable % per day overdue | ❌ No interest calculation | Missing |
| **Payment Reminders** | ✅ SMS/WhatsApp/Email auto-reminders | ❌ No reminders for B2B | Missing |
| **Virtual Account Numbers** | ✅ Per-customer virtual accounts | ❌ No virtual accounts | Missing |
| **Auto Bank Reconciliation** | ✅ Parse bank statements + match | ❌ No bank statement parsing | Missing |
| **E-waybill Integration** | ✅ Direct e-waybill generation | ❌ No e-waybill | Missing |
| **GSTR Filing Prep** | ✅ GSTR-1/3B reconciliation | ❌ No GST filing | Missing |
| **TDS/TCS Management** | ✅ TDS/TCS deduction + reporting | ❌ No TDS/TCS | Missing |
| **Bulk Vendor Payments** | ✅ Batch payments to vendors | ❌ No bulk payments | Missing |
| **Employee Disbursements** | ✅ Salary/wage payouts | ❌ No payroll module | Missing |
| **Bank Statement Import** | ✅ Upload + auto-categorize | ❌ No statement import | Missing |
| **Multi-bank Aggregation** | ✅ Connect multiple bank accounts | ❌ No multi-bank | Missing |
| **Cash Flow Forecasting** | ✅ Predictive cash flow | ❌ No forecasting | Missing |
| **Aging Analysis Report** | ✅ 0-30 / 30-60 / 60-90 / 90+ days | ❌ No aging report | Missing |
| **Vendor Self-Service Portal** | ✅ Vendor logs in, sees payable | ❌ No vendor portal | Missing |
| **Multi-currency Support** | ✅ B2B in USD/AED | ❌ INR only | Missing |
| **Expense Tracking** | ✅ Full expense mgmt + receipt scan | ⚠️ Basic expense CRUD | Partial |
| **RFQ (Request for Quote)** | ✅ Suppliers bid on RFQs | ❌ No RFQ module | Missing |
| **Purchase Approval Workflow** | ✅ Multi-level PO approval | ❌ No approval workflow | Missing |
| **Delivery Challan** | ✅ Generate delivery challans | ❌ No challan support | Missing |
| **Goods Receipt Note (GRN)** | ✅ Track inbound receipts | ❌ No GRN | Missing |

---

## 2. Priority Implementation Plan

### Tier 1 — Must Have (Revenue-Blocking)

| # | Feature | Files to Create/Modify | Status |
|---|---------|----------------------|--------|
| 1 | **PO Due Date + Credit Period** | `PurchaseOrder.ts` model, `purchaseOrders.ts` route | ✅ Done |
| 2 | **Supplier Credit Limit Enforcement** | `Supplier.ts` model, `checkCreditLimit()` service | ✅ Done |
| 3 | **Aging Analysis Report** | `purchaseOrders.ts` `/aging` route + `bulkGetSupplierAging()` | ✅ Done |
| 4 | **Auto Payment Reminders** | `dunningService.ts` + `reminderTemplates.ts` | ✅ Done |
| 5 | **PO Approval Workflow** | `PurchaseOrder.ts` approvalHistory + `purchaseOrders.ts` approve/reject | ✅ Done |

### Tier 2 — Should Have (Competitive)

| # | Feature | Files to Create/Modify | Status |
|---|---------|----------------------|--------|
| 6 | **Interest on Overdue** | `creditLineService.ts` with interest calculation | ✅ Done |
| 7 | **RFQ Module** | `routes/rfq.ts`, `models/RFQ.ts`, `models/Quote.ts` | ✅ Done |
| 8 | **Delivery Challan** | `routes/challans.ts`, `models/DeliveryChallan.ts` | ✅ Done |
| 9 | **Goods Receipt Note (GRN)** | `purchaseOrderService.ts` with `processGoodsReceipt()` | ✅ Done |
| 10 | **Virtual Account Numbers** | `routes/virtualAccounts.ts`, `models/VirtualAccount.ts` | ✅ Done |
| 11 | **Bulk Payment Processing** | `routes/bulkPayments.ts` batch processing | ✅ Done |

### Tier 3 — Nice to Have (Differentiation)

| # | Feature | Files to Create/Modify | Status |
|---|---------|----------------------|--------|
| 12 | **Bank Statement Import** | `services/bankStatementParser.ts`, `routes/bankStatements.ts` | ✅ Done |
| 13 | **Auto Reconciliation** | `services/reconciliationService.ts`, `routes/reconciliation.ts` | ✅ Done |
| 14 | **E-waybill Integration** | `services/ewaybillService.ts`, `routes/ewaybill.ts` | ✅ Done |
| 15 | **GSTR Filing Prep** | `services/gstrService.ts`, `routes/gstr.ts` | ✅ Done |
| 16 | **TDS/TCS Management** | `services/tdsTcsService.ts`, `routes/tds.ts` | ✅ Done |
| 17 | **Vendor Self-Service Portal** | `services/vendorPortalService.ts`, `routes/vendorPortal.ts` | ✅ Done |
| 18 | **Cash Flow Forecasting** | `services/cashFlowForecastService.ts`, `routes/cashFlow.ts` | ✅ Done |
| 19 | **Multi-bank Aggregation** | `services/multiBankAggregationService.ts`, `routes/multiBank.ts` | ✅ Done |
| 20 | **Employee Disbursements** | `services/employeePayoutsService.ts`, `routes/employeePayouts.ts` | ✅ Done |

---

## 3. Existing Code to Leverage

### Models Already in Place
- `Supplier.ts` — needs `creditPeriodDays`, `dueDatePreference`
- `PurchaseOrder.ts` — needs `dueDate`, `approvedBy`, `approvalStatus`, `reminderSchedule`
- `CorporateAccount.ts` — can be extended for vendor credit tracking
- `CustomerCredit.ts` — reference for khata/credit logic patterns

### Services Already in Place
- `settlementService.ts` — reference for payment processing
- `walletMerchant.ts` — reference for merchant wallet
- `nextabizzSignals.ts` — webhook handling pattern

### Patterns to Follow
- Transaction-based state changes (from payment service)
- BullMQ job queue (for reminders)
- Idempotency keys (for bulk operations)
- HMAC signature verification (for bank webhooks)

---

## 4. Immediate Next Steps

1. **Week 1:** Add `dueDate`, `creditPeriodDays`, `approvalStatus` to `PurchaseOrder` model
2. **Week 2:** Implement aging report API + dashboard endpoint
3. **Week 3:** Build reminder service with BullMQ
4. **Week 4:** Build RFQ module (model + routes)
5. **Week 5+:** Challan, GRN, bulk payments, vendor portal

---

## 5. Competitive Positioning Notes

**Paysaathi/Takkada** is primarily a B2B **payment collection + reconciliation** platform. They do NOT appear to have:
- Restaurant/hospitality-specific features
- Multi-outlet inventory management
- B2C customer loyalty
- OTA/hotel distribution

**ReZ Merchant's advantage:** We already have the merchant relationship + multi-industry modules. The gap is in the **accounts payable (AP)** side — paying suppliers on time, managing vendor credit, and B2B payment workflows.

**Recommendation:** Focus Tier 1 + Tier 2 features first to close the AP gap, then build the vendor portal as a differentiator.

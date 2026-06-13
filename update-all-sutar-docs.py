#!/usr/bin/env python3
"""Update all audit files with complete SUTAR OS information."""

import os
import re
from pathlib import Path

root = Path("/Users/rejaulkarim/Documents/RTMN")

# Complete SUTAR OS section for COMPANIES audit
SUTAR_COMPANIES_SECTION = """
## SUTAR OS - Autonomous Economic Infrastructure (HOJAI AI)

**Company:** HOJAI AI
**Total Services:** 25
**Status:** Production Ready

### SUTAR OS 12-Layer Architecture

| Layer | Service | Port | Status | Features |
|-------|---------|------|--------|----------|
| Layer 3 | GoalOS | 4242 | Complete | Goal decomposition, OKR system |
| Layer 4 | Decision Engine | 4240 | Complete | Policy evaluation, Risk assessment |
| Layer 5 | SimulationOS | 4241 | Complete | Monte Carlo, What-if analysis |
| Layer 6 | Agent Network | 4155 | Complete | Registry, Capability matching |
| Layer 7 | Negotiation Engine | 4191 | Complete | RFQ, Quotes, Counter-offers |
| Layer 8 | Trust Engine | 4180 | Complete | Trust scoring, KYC |
| Layer 9 | Contract OS | 4190 | Complete | Contracts, Digital signatures |
| Layer 10 | Economy OS | 4251 | Complete | Karma points, Transactions |
| Layer 11 | Marketplace | 4250 | Complete | Service listing, Ratings |
| Layer 12 | Network Learning | 4243 | Complete | Pattern learning |
| - | Intent Bus | 4154 | Complete | Intent capture |
| - | Memory Bridge | 4143 | Complete | Context storage |
| - | Gateway | 4140 | Complete | API routing |

### SimulationOS Features (Port 4241)

| Category | Feature | Type | Status |
|----------|---------|------|--------|
| Scenario Planning | Pricing | PRICING | Complete |
| Scenario Planning | Offer | OFFER | Complete |
| Scenario Planning | Cashback | CASHBACK | Complete |
| Scenario Planning | Bundle | BUNDLE | Complete |
| Forecasting | Demand | DEMAND | Complete |
| Forecasting | Cash Flow | CASHFLOW | Complete |
| Forecasting | Revenue | REVENUE | Complete |
| Forecasting | Cost | COST | Complete |
| Risk Modeling | Financial Risk | RISK | Complete |
| Risk Modeling | Operational Risk | RISK | Complete |
| Risk Modeling | Market Risk | RISK | Complete |
| Risk Modeling | Compliance | COMPLIANCE | Complete |
| Operations | Staffing | STAFFING | Complete |
| Operations | Inventory | INVENTORY | Complete |
| Operations | Procurement | PROCUREMENT | Complete |
| Operations | Custom | CUSTOM | Complete |

### Decision Engine Features (Port 4240)

| Feature | Status |
|---------|--------|
| OFFER decision | Complete |
| CASHBACK decision | Complete |
| PERSONALIZATION decision | Complete |
| ROUTING decision | Complete |
| FRAUD decision | Complete |
| PRICING decision | Complete |
| NEXT_ACTION decision | Complete |
| RETENTION decision | Complete |
| APPROVAL decision | Complete |
| RISK decision | Complete |

---
"""

# Find and update all audit files
companies_count = 0
products_count = 0

# Update COMPANIES audit files
for md_file in root.rglob("RTNM-COMPANIES-AUDIT.md"):
    try:
        content = md_file.read_text(encoding='utf-8')
        if "SUTAR OS - Autonomous Economic Infrastructure" in content:
            continue
        if "## Services Summary" in content:
            content = content.replace("## Services Summary", SUTAR_COMPANIES_SECTION + "## Services Summary")
        elif "## HOJAI" in content:
            content = content.replace("## HOJAI", SUTAR_COMPANIES_SECTION + "## HOJAI")
        else:
            content = content.rstrip() + "\n" + SUTAR_COMPANIES_SECTION
        md_file.write_text(content, encoding='utf-8')
        companies_count += 1
        print(f"Updated: {md_file.relative_to(root)}")
    except Exception as e:
        print(f"Error: {md_file}: {e}")

# Update PRODUCTS audit files
SUTAR_PRODUCTS_SECTION = """
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
"""

for md_file in root.rglob("RTNM-PRODUCTS-FEATURES-AUDIT.md"):
    try:
        content = md_file.read_text(encoding='utf-8')
        if "SUTAR OS - Autonomous Economic Infrastructure" in content:
            continue
        if "### Layer" in content:
            content = content.replace("### Layer", SUTAR_PRODUCTS_SECTION + "### Layer", 1)
        elif "### SUTAR OS" in content:
            continue
        else:
            content = content.rstrip() + "\n" + SUTAR_PRODUCTS_SECTION
        md_file.write_text(content, encoding='utf-8')
        products_count += 1
        print(f"Updated: {md_file.relative_to(root)}")
    except Exception as e:
        print(f"Error: {md_file}: {e}")

print(f"\n=== Summary ===")
print(f"Companies audit files updated: {companies_count}")
print(f"Products audit files updated: {products_count}")

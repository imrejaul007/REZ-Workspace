#!/usr/bin/env python3
"""Update all audit files with new SUTAR OS services"""

import os
from pathlib import Path
from datetime import datetime

ROOT = Path("/Users/rejaulkarim/Documents/RTMN")

# New services to add
NEW_SERVICES = {
    "BOA OS": {
        "location": "companies/RTNM-Group/boa-os/",
        "port": 4100,
        "lines": 1313,
        "company": "RTNM-Group",
        "features": [
            "Strategic Goals",
            "Portfolio Management",
            "Opportunities",
            "Risk Assessment",
            "Budget Planning",
            "SUTAR Sync"
        ]
    },
    "BOA-SUTAR Bridge": {
        "location": "companies/RTNM-Group/boa-sutar-bridge/",
        "port": 4110,
        "lines": 185,
        "company": "RTNM-Group",
        "features": [
            "Goal sync (BOA→SUTAR)",
            "Outcome sync (SUTAR→BOA)",
            "Status polling",
            "BOA SUTAR integration"
        ]
    },
    "Intent Graph": {
        "location": "companies/hojai-ai/services/hojai-intent-graph/",
        "port": 4018,
        "lines": 352,
        "company": "HOJAI AI",
        "features": [
            "Intent Capture",
            "Pattern Recognition",
            "Context Enrichment",
            "Intent Routing",
            "Type Classification"
        ]
    },
    "Trust Scorer": {
        "location": "companies/RABTUL-Technologies/REZ-trust-scorer/",
        "port": 4180,
        "lines": 358,
        "company": "RABTUL Technologies",
        "features": [
            "Trust Score (0-100)",
            "Credit Score (25%)",
            "Payment History (25%)",
            "Dispute Rate (25%)",
            "Delivery Success (25%)"
        ]
    },
    "SLA Monitor": {
        "location": "companies/RABTUL-Technologies/REZ-sla-monitor/",
        "port": 4195,
        "lines": 209,
        "company": "RABTUL Technologies",
        "features": [
            "SLA Monitoring",
            "Compliance tracking",
            "Alert generation",
            "Breach prevention"
        ]
    },
    "Breach Detector": {
        "location": "companies/RABTUL-Technologies/REZ-breach-detector/",
        "port": 4196,
        "lines": 230,
        "company": "RABTUL Technologies",
        "features": [
            "Breach Detection",
            "Severity assessment",
            "Escalation",
            "Resolution tracking"
        ]
    },
    "Simulation Engine": {
        "location": "companies/hojai-ai/services/hojai-simulation-engine/",
        "port": 4241,
        "lines": 310,
        "company": "HOJAI AI",
        "features": [
            "What-if Analysis",
            "Monte Carlo simulation",
            "Risk Assessment",
            "Confidence Scoring",
            "Scenario Testing"
        ]
    },
    "Economy OS": {
        "location": "companies/RABTUL-Technologies/REZ-economy-os/",
        "port": 4251,
        "lines": 310,
        "company": "RABTUL Technologies",
        "features": [
            "Karma Points",
            "Platform Fees",
            "Settlement",
            "Transaction tracking",
            "Tier System"
        ]
    },
    "Discovery Engine": {
        "location": "companies/hojai-ai/services/hojai-discovery-engine/",
        "port": 4256,
        "lines": 382,
        "company": "HOJAI AI",
        "features": [
            "Category Match",
            "Capability Match",
            "Location Match",
            "Trust Match",
            "Price Match"
        ]
    }
}

def create_company_docs():
    """Create documentation in company folders"""
    companies = {
        "RTNM-Group": [],
        "HOJAI AI": [],
        "RABTUL Technologies": []
    }

    for name, data in NEW_SERVICES.items():
        companies[data["company"]].append((name, data))

    for company, services in companies.items():
        if not services:
            continue

        # Determine company directory
        if company == "RTNM-Group":
            company_dir = ROOT / "companies/RTNM-Group"
        elif company == "HOJAI AI":
            company_dir = ROOT / "companies/hojai-ai"
        else:
            company_dir = ROOT / "companies/RABTUL-Technologies"

        # Create SUTAR-OS-COMPONENTS.md
        components_file = company_dir / "SUTAR-OS-COMPONENTS.md"
        features_file = company_dir / "SUTAR-OS-FEATURES.md"

        # Build components content
        components_content = f'''# {company} - SUTAR OS Components

**Last Updated:** {datetime.now().strftime("%Y-%m-%d")}

---

## SUTAR OS Phase 6 Components

{company} hosts the following SUTAR OS components:

'''

        features_content = f'''# {company} - SUTAR OS Features

**Last Updated:** {datetime.now().strftime("%Y-%m-%d")}

---

## Feature List

'''

        for name, data in services:
            features_table = "\n".join([f"| {f} | ✅ Implemented |" for f in data["features"]])
            services_table = "\n".join([f"| {s} |" for s in data["features"]])

            components_content += f'''### {name}

| Aspect | Value |
|--------|-------|
| Location | {data["location"]} |
| Port | {data["port"]} |
| Lines | {data["lines"]:,} |

**Features:**
{features_table}

---

'''

            features_content += f'''## {name}

| Feature | Status |
|---------|--------|
{features_table}

---

'''

        components_file.write_text(components_content)
        features_file.write_text(features_content)

        print(f"  Created: {components_file}")
        print(f"  Created: {features_file}")

def main():
    print("="*70)
    print("Updating SUTAR OS Documentation")
    print("="*70)
    print()

    print("Creating company documentation...")
    create_company_docs()

    print()
    print("="*70)
    print("Documentation update complete!")
    print("="*70)

if __name__ == "__main__":
    main()

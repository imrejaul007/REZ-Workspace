# NonProfit OS - Nonprofit Platform

**Status:** ✅ BUILT - June 14, 2026  
**Port:** 5160  
**Location:** `industries/nonprofit-os/`

## Overview

NonProfit OS provides a comprehensive platform for nonprofit organizations, connecting donors, campaigns, beneficiaries, and volunteers with AI-powered fundraising and impact tracking.

## Digital Twins

| Twin | Description | Capabilities |
|------|-------------|--------------|
| **Donor Twin** | Donor profiles | Giving history |
| **Campaign Twin** | Fundraising campaigns | Goal tracking |
| **Beneficiary Twin** | Program recipients | Impact metrics |
| **Volunteer Twin** | Volunteer management | Hours, skills |

## AI Agents

| Agent | Purpose |
|-------|---------|
| **Fundraising Agent** | Donation optimization |
| **VolunteerMatch Agent** | Volunteer assignment |
| **ImpactReport Agent** | Impact measurement |
| **DonorRel Agent** | Donor stewardship |
| **GrantWriter Agent** | Grant applications |

## Quick Start

```bash
cd industries/nonprofit-os && npm install && node src/index.js
curl http://localhost:5160/health
```

## Integration

- Connected to RTMN Hub at `http://localhost:8000`
- NonProfit Agent available via AgentOS
- Payment via RABTUL
- Impact reporting to BOA
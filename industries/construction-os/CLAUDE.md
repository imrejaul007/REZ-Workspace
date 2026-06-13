# Construction OS - Construction Platform

**Status:** ✅ BUILT - June 14, 2026  
**Port:** 5210  
**Location:** `industries/construction-os/`

## Overview

Construction OS provides a comprehensive platform for construction companies, connecting projects, contractors, workers, and materials with AI-powered project management and safety monitoring.

## Digital Twins

| Twin | Description | Capabilities |
|------|-------------|--------------|
| **Project Twin** | Project tracking | Timeline, budget |
| **Contractor Twin** | Contractor management | Credentials, ratings |
| **Worker Twin** | Worker profiles | Skills, certifications |
| **Material Twin** | Materials tracking | Inventory, delivery |

## AI Agents

| Agent | Purpose |
|-------|---------|
| **ProjectMgmt Agent** | Project coordination |
| **SafetyInsp Agent** | Safety compliance |
| **ResourceAlloc Agent** | Resource planning |
| **ProgressTrack Agent** | Progress monitoring |
| **CostEst Agent** | Cost estimation |

## Quick Start

```bash
cd industries/construction-os && npm install && node src/index.js
curl http://localhost:5210/health
```

## Integration

- Connected to RTMN Hub at `http://localhost:8000`
- Construction Agent available via AgentOS
- RealEstate OS for property data
- Manufacturing OS for materials
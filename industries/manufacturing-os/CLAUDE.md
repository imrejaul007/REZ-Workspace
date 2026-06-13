# Manufacturing OS - Production Platform

**Status:** ✅ BUILT - June 14, 2026  
**Port:** 5150  
**Location:** `industries/manufacturing-os/`

## Overview

Manufacturing OS provides a comprehensive platform for manufacturing operations, connecting products, machines, production lines, and inventory with AI-powered optimization.

## Digital Twins

| Twin | Description | Capabilities |
|------|-------------|--------------|
| **Product Twin** | Product definitions | BOM management |
| **Machine Twin** | Equipment tracking | Predictive maintenance |
| **Production Twin** | Production planning | OEE tracking |
| **Inventory Twin** | Raw materials, WIP | Just-in-time alerts |

## AI Agents

| Agent | Purpose |
|-------|---------|
| **ProductionSched Agent** | Schedule optimization |
| **QualityCtrl Agent** | Quality assurance |
| **MaintenancePred Agent** | Predictive maintenance |
| **SupplyChain Agent** | Supplier management |
| **SafetyInsp Agent** | Safety compliance |

## Quick Start

```bash
cd industries/manufacturing-os && npm install && node src/index.js
curl http://localhost:5150/health
```

## Integration

- Connected to RTMN Hub at `http://localhost:8000`
- Manufacturing Agent available via AgentOS
- Supply chain via Retail OS
- Quality data to BOA
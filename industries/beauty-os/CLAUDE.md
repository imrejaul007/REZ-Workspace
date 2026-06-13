# Beauty OS - Beauty & Wellness Platform

**Status:** ✅ BUILT - June 14, 2026  
**Port:** 5090  
**Location:** `industries/beauty-os/`

## Overview

Beauty OS provides a comprehensive platform for salons, spas, and beauty businesses, connecting clients, services, staff, and inventory with AI-powered booking and recommendations.

## Digital Twins

| Twin | Description | Capabilities |
|------|-------------|--------------|
| **Client Twin** | Client profiles, history | Preferences, loyalty |
| **Service Twin** | Service catalog | Pricing, duration |
| **Staff Twin** | Stylist management | Schedule, skills |
| **Inventory Twin** | Product inventory | Alerts, reorder |

## AI Agents

| Agent | Purpose |
|-------|---------|
| **Booking Agent** | Appointment scheduling |
| **Consultation Agent** | Client consultations |
| **ProductRec Agent** | Product recommendations |
| **Reminder Agent** | Appointment reminders |
| **Satisfaction Agent** | Feedback collection |

## Quick Start

```bash
cd industries/beauty-os && npm install && node src/index.js
curl http://localhost:5090/health
```

## Integration

- Connected to RTMN Hub at `http://localhost:8000`
- Beauty Agent available via AgentOS
- Retail inventory sync
- Loyalty via RABTUL

# IoT Sensor Hub - Real-time Equipment Monitoring

**Company:** StayOwn-Hospitality
**Type:** IoT Platform
**Port:** 4903
**Status:** ✅ Built (June 14, 2026)

---

## Overview

Simulates real-time IoT sensors for hotel equipment with predictive maintenance integration.

### Tagline
> "Room 1521 AC shows unusual vibration"

---

## Equipment Types Monitored

| Type | Sensors | Update Frequency |
|------|---------|----------------|
| AC | vibration, temp, pressure, noise | Real-time |
| Elevator | speed, weight, door | Every 30s |
| Plumbing | pressure, flow, leak | Every 60s |
| Electrical | current, voltage, heat | Every 30s |
| Kitchen | temp, smoke | Every 15s |

---

## Alert Thresholds

| Equipment | Warning | Critical | Action |
|-----------|---------|----------|--------|
| AC Vibration | >2.0 | >3.5 | Maintenance |
| AC Temp | >28°C | >32°C | Alert |
| Electrical Heat | >45°C | >60°C | Shutdown |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/equipment` | Register equipment |
| GET | `/api/equipment` | List equipment |
| POST | `/api/sensors/:id/readings` | Submit readings |
| GET | `/api/alerts` | Get alerts |
| GET | `/api/alerts/critical` | Critical alerts |
| GET | `/api/analytics/predict/:id` | Prediction |
| GET | `/api/analytics/high-risk` | High-risk list |
| POST | `/api/story/ac-vibration` | Chapter 14 |

---

## Quick Start

```bash
cd iot-sensor-hub
npm install
npm run dev
```

---

## Story Coverage

| Chapter | Description | Status |
|---------|------------|--------|
| Ch 14 | AC vibration detection | ✅ Working |

---

**Last Updated:** June 14, 2026

# IoT Sensor Hub - Features

**Company:** StayOwn-Hospitality
**Type:** IoT Platform
**Port:** 4903
**Status:** ✅ Built

---

## Core Features

### 1. Equipment Registration
- [x] Register AC, elevator, plumbing, electrical, kitchen
- [x] Track location (room, floor, common area)
- [x] Store equipment metadata
- [x] Monitor status (operational, warning, critical)

### 2. Real-time Sensors
| Type | Sensors | Warning | Critical |
|------|---------|---------|----------|
| AC | vibration, temp, pressure, noise | >2.0 | >3.5 |
| Elevator | speed, weight, door | variation | failure |
| Plumbing | pressure, flow, leak | drop | detected |
| Electrical | current, voltage, heat | >45°C | >60°C |
| Kitchen | temp, smoke | variance | smoke |

### 3. Alert System
- [x] Real-time alerts
- [x] Critical alerts
- [x] Alert history
- [x] Severity levels

### 4. Predictive Analytics
- [x] Failure probability
- [x] Health score
- [x] Trend analysis
- [x] Maintenance recommendations

### 5. Maintenance Integration
- [x] Notify Maintenance Agent
- [x] Create work orders
- [x] Track guest impact

---

## Alert Thresholds

| Equipment | Metric | Warning | Critical |
|---------|--------|---------|----------|
| AC | Vibration | >2.0 | >3.5 |
| AC | Temperature | >28°C | >32°C |
| Electrical | Heat | >45°C | >60°C |
| Plumbing | Pressure drop | >0.5 | detected |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/equipment` | Register |
| GET | `/api/equipment` | List |
| POST | `/api/sensors/:id/readings` | Readings |
| GET | `/api/alerts` | Alerts |
| GET | `/api/analytics/predict/:id` | Prediction |
| GET | `/api/analytics/high-risk` | High-risk |

---

## Story Coverage

| Chapter | Description | Status |
|---------|------------|--------|
| Ch 14 | AC vibration detected | ✅ |

---

**Last Updated:** June 14, 2026

# RTNM DIGITAL - Master README

**Version:** 1.0.0
**Date:** 2026-06-12
**Status:** ✅ Production Ready

---

## Overview

RTNM Digital is a comprehensive ecosystem of AI-powered products and services spanning multiple verticals.

## Companies & Products

- **AdBazaar** (381 services)
- **AssetMind** (86 services)
- **Axom** (62 services)
- **CorpPerks** (60 services)
- **KHAIRMOVE** (343 services)
- **Karma-Foundation** (4 services)
- **LawGens** (4 services)
- **Nexha** (12 services)
- **RABTUL-Technologies** (203 services)
- **REZ-Consumer** (34 services)
- **REZ-Merchant** (259 services)
- **REZ-Workspace** (87 services)
- **RTNM-Digital** (4 services)
- **RTNM-Group** (42 services)
- **RTNM-REE** (12 services)
- **RidZa** (11 services)
- **RisaCare** (869 services)
- **RisnaEstate** (522 services)
- **StayOwn-Hospitality** (125 services)
- **hojai-ai** (452 services)

---

## Architecture

```
RTNM DIGITAL
├── HOJAI AI (AI Intelligence)
├── RABTUL (Core Services)
├── REZ (Consumer Apps)
├── AdBazaar (Advertising)
├── Nexha (Commerce)
├── RisaCare (Healthcare)
├── StayOwn (Hospitality)
├── RisnaEstate (Real Estate)
├── LawGens (Legal)
├── RidZa (Finance)
├── CorpPerks (HR)
└── KHAIRMOVE (Transport)
```

---

## Quick Start

### 1. Choose a Company

```bash
cd companies/<company-name>
```

### 2. Choose a Service

```bash
cd <service-directory>
```

### 3. Start Development

```bash
npm install
npm run dev
```

### 4. Start Production

```bash
docker-compose up -d
```

---

## Services by Type

### AI & Intelligence

- **HOJAI AI:** 300+ services
  - Genie (Personal AI)
  - SkillNet (Skill Marketplace)
  - BrandPulse (Brand Intelligence)
  - Voice AI

### Core Infrastructure

- **RABTUL:** 10+ services
  - Auth Service
  - Payment Service
  - Wallet Service
  - Notification Service

### Consumer Apps

- **REZ Consumer:** Rider app
- **REZ Merchant:** Merchant platform
- **RisaCare:** Healthcare
- **StayOwn:** Hospitality
- **RisnaEstate:** Real Estate

### Enterprise

- **AdBazaar:** DOOH Advertising
- **CorpPerks:** Employee benefits
- **LawGens:** Legal services
- **Nexha:** Commerce network

---

## Integration Points

All services integrate with **RABTUL Core Services:**

| Service | Port | Purpose |
|---------|------|---------|
| RABTUL Auth | 4002 | Authentication |
| RABTUL Payment | 4001 | Payment processing |
| RABTUL Wallet | 4004 | Balance management |
| RABTUL Notification | 4005 | Notifications |

---

## Deployment

### Docker

```bash
docker-compose up -d
```

### Kubernetes

```bash
kubectl apply -f k8s/
```

### Cloud

| Platform | Status |
|----------|--------|
| GCP Cloud Run | ✅ Ready |
| AWS ECS | ✅ Ready |
| Azure | ✅ Ready |

---

## Monitoring

All services expose `/health` endpoint for:
- Liveness probes
- Readiness probes
- Status checks

---

## Documentation

Each company and service has:

- `README.md` - User documentation
- `CLAUDE.md` - AI context
- `INTEGRATION.md` - Integration guide
- `Dockerfile` - Container
- `docker-compose.yml` - Local development

---

## License

Proprietary - RTNM Digital

---

**Generated:** 2026-06-12

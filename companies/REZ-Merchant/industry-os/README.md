# 🏢 REZ Merchant - Industry OS

**Unified Multi-Industry Platform**  
**Version:** 2.0 | **Date:** June 13, 2026

---

## 🎯 Overview

Industry OS provides specialized services for 15 different industries, all built on the unified REZ Merchant platform with shared services (auth, payments, notifications, etc.).

---

## 📁 Industry OS Structure

```
industry-os/
├── restaurant-os/      🍽️ 22 services  ✅
├── hotel-os/          🏨 52 services  ✅
├── salon-os/          💇 54 services  ✅
├── healthcare-os/     🏥 51 services  ✅
├── fitness-os/        💪 44 services  ✅
├── retail-os/         🛒 32 services  ✅
├── events-os/         🎪 24 services  ✅
├── grocery-os/        🥗 6 services   ✅
├── education-os/      🎓 6 services   ✅
├── automotive-os/     🚗 4 services   ✅
├── fashion-os/        👗 3 services   ✅
├── laundry-os/        🧺 4 services   ✅
├── real-estate-os/    🏠 4 services   ✅
├── fleet-os/          🚛 4 services   ✅
├── manufacturing-os/   🏭 4 services   ✅
└── shared/            📦 SDKs & utilities
```

---

## 🔌 Port Assignments

| Industry | Range | Ports |
|----------|-------|-------|
| Restaurant OS | 4100-4149 | 4101-4111 |
| Hotel OS | 4800-4899 | 4801-4870 |
| Salon OS | 4900-4949 | 4901-4906 |
| Healthcare OS | 4500-4549 | 4501-4504 |
| Fitness OS | 4550-4599 | 4551-4553 |
| Retail OS | 4600-4649 | 4601-4604 |
| Events OS | 4750-4799 | 4751-4752 |
| Grocery OS | 4650-4699 | 4651-4652 |
| Education OS | 4700-4749 | 4701-4702 |

Full port registry: [PORTS.md](PORTS.md)

---

## 🏨 Hotel OS (HIGHLIGHT)

Most mature OS with production-ready AI services:

| Service | Port | LOC | Status |
|---------|------|-----|--------|
| rez-booking | 4801 | 3,082 | ✅ Production |
| rez-staybot | 4840 | 1,267 | ✅ Production |
| rez-housekeeping | 4830 | 682 | ✅ Production |
| rez-voice-agent | 4842 | 744 | ✅ Production |

---

## 🔗 Shared Services

| Service | Port | Purpose |
|---------|------|---------|
| RABTUL Auth | 4002 | Authentication |
| RABTUL Payment | 4001 | Payments |
| RABTUL Wallet | 4004 | Balance |
| HOJAI Brain | 4630 | AI Engine |

---

## 🚀 Quick Start

```bash
# Restaurant
cd industry-os/restaurant-os/core/rez-restaurant
npm install && npm run dev  # Port 4101

# Hotel
cd industry-os/hotel-os/core/rez-booking
npm install && npm run dev  # Port 4801
```

---

## 📚 Documentation

- [Hotel OS Features](../docs/HOTEL-SERVICES-COMPLETE.md)
- [Industry Duplicates Audit](../docs/INDUSTRY-DUPLICATES-AUDIT.md)
- [Port Registry](PORTS.md)

---

## 🔄 Migration History (June 13, 2026)

| Industry | Services | Action |
|----------|----------|--------|
| Hotel | 31 | ✅ Consolidated from StayOwn |
| Restaurant | 22 | ✅ Consolidated |
| Salon | 54 | ✅ Consolidated |
| Healthcare | 51 | ✅ Consolidated |
| Fitness | 44 | ✅ Consolidated |
| Retail | 32 | ✅ Consolidated |
| Events | 24 | ✅ Consolidated |

---

**Version:** 2.0  
**Updated:** June 13, 2026  
**Total Industries:** 15  
**Total Services:** 300+

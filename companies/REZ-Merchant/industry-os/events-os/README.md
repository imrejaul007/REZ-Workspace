# 🎪 REZ Events OS

**Unified Event Management Platform**  
**Version:** 1.0 | **Date:** June 13, 2026

---

## 📁 Structure

```
events-os/
├── .env.example              ← Environment template
├── core/
│   ├── rez-events/           ← Main service (4751)
│   └── REZ-events-admin/     ← Admin web
├── catering/
│   └── REZ-events-catering/ ← Food & beverages
├── logistics/
│   └── REZ-events-logistics/ ← Transport & setup
├── venues/
│   └── REZ-events-venues/    ← Venue management
├── entertainment/
│   └── REZ-events-entertainment/ ← Entertainment
└── analytics/
    └── REZ-events-analytics/ ← Event insights (4752)
```

---

## 🔌 Ports

| Service | Port | Description |
|---------|------|-------------|
| rez-events | 4751 | Main API |
| rez-events-analytics | 4752 | Analytics |

---

## 🚀 Quick Start

```bash
cd core/rez-events
npm install
npm run dev  # Port 4751
```

---

**Version:** 1.0 | **Updated:** June 13, 2026

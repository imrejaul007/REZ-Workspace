# 🛒 REZ Retail OS

**Unified Retail Store Platform**  
**Version:** 1.0 | **Date:** June 13, 2026

---

## 📁 Structure

```
retail-os/
├── .env.example              ← Environment template
├── core/
│   ├── rez-retail/           ← Main service (4601)
│   ├── rez-retail-crm/       ← Customer management
│   ├── REZ-retail-app/       ← Mobile app
│   └── REZ-retail-admin/     ← Admin web
├── pos/
│   └── rez-retail-pos/       ← Retail POS (4602)
├── inventory/
│   └── rez-retail-inventory/ ← Stock management (4603)
├── loyalty/
│   └── rez-retail-loyalty/   ← Points & rewards
└── analytics/
    └── rez-retail-analytics/ ← Sales insights (4604)
```

---

## 🔌 Ports

| Service | Port | Description |
|---------|------|-------------|
| rez-retail | 4601 | Main API |
| rez-retail-pos | 4602 | POS |
| rez-retail-inventory | 4603 | Inventory |
| rez-retail-analytics | 4604 | Analytics |

---

## 🚀 Quick Start

```bash
cd core/rez-retail
npm install
npm run dev  # Port 4601
```

---

**Version:** 1.0 | **Updated:** June 13, 2026

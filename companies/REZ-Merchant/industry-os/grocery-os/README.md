# 🥗 REZ Grocery OS

**Unified Quick Commerce Platform**  
**Version:** 1.0 | **Date:** June 13, 2026

---

## 📁 Structure

```
grocery-os/
├── .env.example              ← Environment template
├── core/
│   └── rez-grocery/        ← Main service (4651)
└── integrations/
    └── rez-grocery-inventory/ ← Stock management (4652)
```

---

## 🔌 Ports

| Service | Port | Description |
|---------|------|-------------|
| rez-grocery | 4651 | Main API |
| rez-grocery-inventory | 4652 | Inventory |

---

## 🚀 Quick Start

```bash
cd core/rez-grocery
npm install
npm run dev  # Port 4651
```

---

**Version:** 1.0 | **Updated:** June 13, 2026

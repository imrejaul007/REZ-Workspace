# 💪 REZ Fitness OS

**Unified Gym & Wellness Platform**  
**Version:** 1.0 | **Date:** June 13, 2026

---

## 📁 Structure

```
fitness-os/
├── .env.example              ← Environment template
├── core/
│   ├── rez-fitness/          ← Main service (4551)
│   ├── rez-mind-fitness/     ← AI trainer
│   ├── REZ-fitness-app/      ← Mobile app
│   └── REZ-fitness-admin/    ← Admin web
├── gym/
│   └── rez-gym-access/       ← Access control (4552)
├── classes/
│   └── rez-fitness-classes/  ← Class scheduling
└── analytics/
    └── rez-fitness-analytics/ ← Usage analytics
```

---

## 🔌 Ports

| Service | Port | Description |
|---------|------|-------------|
| rez-fitness | 4551 | Main API |
| rez-gym | 4552 | Gym access |
| rez-mind-fitness | 4553 | AI trainer |

---

## 🚀 Quick Start

```bash
cd core/rez-fitness
npm install
npm run dev  # Port 4551
```

---

**Version:** 1.0 | **Updated:** June 13, 2026

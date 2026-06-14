# REZ-menu-qr - Menu QR Features

**Status:** ✅ PRODUCTION READY
**Port:** 3018

---

## FEATURES

### Menu Management

| Feature | Description | Status |
|---------|-------------|--------|
| **Digital Menu** | Restaurant menu | ✅ |
| **Categories** | Food categories | ✅ |
| **Items** | Menu items | ✅ |
| **Variants** | Size, extras | ✅ |

### QR Ordering

| Feature | Description | Status |
|---------|-------------|--------|
| **Table Scan** | Scan QR at table | ✅ |
| **Order** | Add items | ✅ |
| **Cart** | Review order | ✅ |
| **Payment** | Pay via app | ✅ |

### Table Management

| Feature | Description | Status |
|---------|-------------|--------|
| **Sections** | Indoor, outdoor | ✅ |
| **Tables** | Table layout | ✅ |
| **Status** | Occupied, available | ✅ |

### Kitchen Integration

| Feature | Description | Status |
|---------|-------------|--------|
| **Order Routing** | Send to kitchen | ✅ |
| **Status Updates** | Order progress | ✅ |
| **Completion** | Mark ready | ✅ |

---

## API ENDPOINTS

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/menu/:restaurantId` | GET | Get menu |
| `/order` | POST | Create order |
| `/tables` | GET | List tables |

---

## TECHNICAL STACK

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB

---

**Last Updated:** June 12, 2026

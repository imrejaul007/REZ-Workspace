# 🔌 REZ Unified Input Manager

**Port: 4095**

Handles all input types in one place and routes to appropriate service.

---

## Features

| Input Type | Handler | Routes To |
|-----------|---------|----------|
| **Voice** | Microphone | Genie Voice (4760) |
| **Text** | Keyboard | Genie Voice (4760) |
| **QR** | Camera | REZ QR (4090) |
| **Tap** | NFC/Cards | RABTUL Payment |

---

## Quick Start

```bash
cd RABTUL-Technologies/REZ-unified-input-manager
npm install
npm run dev
```

---

## API Endpoints

### POST /api/input/voice
```bash
curl -X POST http://localhost:4095/api/input/voice \
  -F "audio=@voice.wav" \
  -F "userId=user_123"
```

### POST /api/input/text
```json
{
  "text": "Order pizza",
  "userId": "user_123",
  "source": "app"
}
```

### POST /api/input/qr
```json
{
  "qrCode": "REZ_MENU_123",
  "userId": "user_123",
  "source": "qr"
}
```

### POST /api/input/tap
```json
{
  "tapData": "card_456",
  "type": "card",
  "userId": "user_123",
  "source": "pos"
}
```

### POST /api/input/auto
Auto-detect and route:
```json
{
  "type": "voice",
  "data": "...",
  "userId": "user_123"
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     UNIFIED INPUT MANAGER (4095)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   INPUT SOURCES                                                              │
│   ─────────────                                                              │
│   Voice ──► Mic                                                            │
│   Text ──► Keyboard                                                        │
│   QR ────► Camera                                                         │
│   Tap ───► NFC/Cards                                                      │
│                                                                              │
│   │                                                                        │
│   ▼                                                                        │
│   ┌─────────────────────────────────────────────────────────────────┐      │
│   │                    INPUT MANAGER                                 │      │
│   │                                                                 │      │
│   │   Detect Type ──► Route to Service                             │      │
│   │                                                                 │      │
│   │   Voice ──► Genie Voice (4760)                              │      │
│   │   Text ──► Genie Voice (4760)                               │      │
│   │   QR ──► REZ QR (4090)                                       │      │
│   │   Tap ──► RABTUL Payment (4001)                              │      │
│   │                                                                 │      │
│   │   Collect Training Data ──► HOJAI Voice Studio              │      │
│   │                                                                 │      │
│   └─────────────────────────────────────────────────────────────────┘      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

**License:** Proprietary - RABTUL Technologies / RTNM Digital
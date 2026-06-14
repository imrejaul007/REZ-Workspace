# 🎤 REZ Voice QR Service

**Voice AI for QR ordering and POS**

> Voice ordering through QR codes and POS systems

**Port:** 4096

---

## Overview

Voice QR Service enables voice-based ordering through:
- Restaurant QR codes (scan, speak, order)
- POS systems (voice checkout)
- Table service (voice commands)

---

## Features

| Feature | Description |
|---------|-------------|
| **Voice Menu** | Navigate menu by voice |
| **Voice Order** | Add items by speaking |
| **Voice Checkout** | Confirm order by voice |
| **Session Management** | Track voice sessions |
| **Training Data** | Collect for HOJAI Voice Studio |

---

## Quick Start

```bash
cd RABTUL-Technologies/REZ-voice-qr-service
npm install
npm run dev
```

---

## API Endpoints

### Start Session
```bash
POST /api/voice-qr/session
{
  "qrCode": "REZ_TABLE_123",
  "userId": "user_123"
}
```

### Voice Command
```bash
POST /api/voice-qr/session/:id/speak
{
  "text": "Add margherita pizza"
}
# or
{
  "audio": "base64_audio_data"
}
```

### End Session
```bash
DELETE /api/voice-qr/session/:id
```

### List Orders
```bash
GET /api/voice-qr/orders?businessId=123&status=pending
```

---

## Example Flow

```
User scans QR
    │
    ▼
POST /api/voice-qr/session
    │
    ▼
Genie: "Welcome to La Pinoz! How can I help?"
    │
    ▼
User: "Add margherita pizza"
    │
    ▼
POST /api/voice-qr/session/:id/speak
    │
    ▼
Intent: add_item
Added: 1x Margherita Pizza - Rs. 299
    │
    ▼
Genie: "Added 1 margherita pizza. Anything else?"
    │
    ▼
User: "Checkout"
    │
    ▼
Order confirmed - Rs. 299
```

---

## Training Data

All voice interactions collected for training:

```json
{
  "type": "voice-qr",
  "source": "rez-voice-qr-service",
  "transcript": "Add margherita pizza",
  "intent": "add_item",
  "qrCode": "REZ_TABLE_123",
  "businessId": "restaurant_456"
}
```

---

**License:** Proprietary - RABTUL Technologies / RTNM Digital
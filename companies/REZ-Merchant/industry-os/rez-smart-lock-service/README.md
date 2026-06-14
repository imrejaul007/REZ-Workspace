# REZ Smart Lock Service

**Port: 4035**

Smart lock integration for REZ Hotel Ecosystem - manages digital keys, access codes, and keyless entry.

## Overview

REZ Smart Lock Service provides:
- Digital key generation
- Access code management
- Keyless entry logging
- Lock status monitoring
- Guest access control

## Features

### Key Management
- Generate time-limited keys
- PIN code creation
- Mobile key provisioning
- Key sharing

### Access Control
- Room-level permissions
- Time-based restrictions
- One-time codes
- Recurring access

### Audit Logging
- Entry/exit tracking
- Access attempts
- Invalid code alerts
- Lock status changes

### Lock Types
- RFID card locks
- Bluetooth locks
- WiFi-enabled locks
- Biometric locks

## Quick Start

```bash
cd industry-os/rez-smart-lock-service
npm install
npm run dev
```

Service runs on **port 4035**.

## API Endpoints

### Keys
```
GET  /api/keys/:hotelId              - List keys
GET  /api/keys/:keyId               - Get key details
POST /api/keys                       - Generate key
POST /api/keys/bulk                 - Bulk generate keys
DELETE /api/keys/:keyId             - Revoke key
PUT  /api/keys/:keyId/extend        - Extend key validity
```

### Access Codes
```
GET  /api/codes/:hotelId             - List codes
GET  /api/codes/:codeId             - Get code details
POST /api/codes                       - Create code
DELETE /api/codes/:codeId            - Delete code
POST /api/codes/:codeId/deactivate  - Deactivate code
```

### Locks
```
GET  /api/locks/:hotelId             - List locks
GET  /api/locks/:lockId             - Get lock status
POST /api/locks/:lockId/lock        - Lock remotely
POST /api/locks/:lockId/unlock      - Unlock remotely
POST /api/locks/:lockId/calibrate   - Calibrate lock
```

### Audit
```
GET  /api/audit/:hotelId             - Get access logs
GET  /api/audit/:roomId             - Room-specific logs
GET  /api/audit/:guestId            - Guest access history
```

### Validation
```
POST /api/validate                    - Validate key/code
POST /api/validate/access            - Check access permission
```

## Usage Examples

### Generate Key
```bash
curl -X POST http://localhost:4035/api/keys \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "hotel-123",
    "roomId": "room-305",
    "guestId": "guest-456",
    "guestName": "John Doe",
    "checkIn": "2026-06-15T14:00:00Z",
    "checkOut": "2026-06-18T11:00:00Z"
  }'
```

### Create Access Code
```bash
curl -X POST http://localhost:4035/api/codes \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "hotel-123",
    "roomId": "room-305",
    "code": "1234",
    "validFrom": "2026-06-15T14:00:00Z",
    "validUntil": "2026-06-18T11:00:00Z",
    "type": "pin"
  }'
```

### Unlock Room
```bash
curl -X POST http://localhost:4035/api/locks/room-305/unlock \
  -H "Content-Type: application/json" \
  -d '{"method": "remote", "operatorId": "staff-789"}'
```

### Validate Access
```bash
curl -X POST http://localhost:4035/api/validate \
  -H "Content-Type: application/json" \
  -d '{
    "lockId": "lock-305",
    "keyId": "key-456",
    "timestamp": "2026-06-15T15:30:00Z"
  }'
```

## Key Types

| Type | Description | Use Case |
|------|-------------|----------|
| `mobile` | Bluetooth/NFC key | Primary guest access |
| `pin` | Numeric code | Staff/cleaning |
| `card` | RFID card | Legacy systems |
| `biometric` | Fingerprint/Face | High security |

## Lock Status

| Status | Description |
|--------|-------------|
| `locked` | Door is locked |
| `unlocked` | Door is unlocked |
| `ajar` | Door is open |
| `offline` | Lock disconnected |
| `low_battery` | Battery needs replacement |

## Architecture

```
rez-smart-lock-service/
├── src/
│   ├── index.ts              # Express server
│   ├── smart-lock.test.ts    # Tests
│   └── services/
│       └── smart-lock.service.ts  # Business logic
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Integration

Integrates with:
- Smart lock hardware (Sail, OTTO, etc.)
- REZ PMS Service (check-in/out)
- REZ Booking Engine
- REZ Guest Mobile App
- REZ Staff App

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4035 | Service port |
| LOCK_PROVIDER | - | Lock hardware provider |

## License

Proprietary - RTNM Group

# REZ MFA Service - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Security

---

## Overview

Multi-Factor Authentication service providing TOTP-based 2FA, backup codes, and recovery options. Extends the auth service with additional MFA capabilities.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REZ MFA Service                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── TOTP Manager   → Time-based one-time passwords                      │
│  ├── Backup Codes  → Recovery code generation                            │
│  ├── QR Generator  → QR code for authenticator apps                    │
│  └── Rate Limiter  → Brute-force protection                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### MFA Setup
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/mfa/setup` | Initialize MFA setup |
| GET | `/mfa/qr/:userId` | Get QR code for authenticator |
| POST | `/mfa/verify-setup` | Verify TOTP during setup |

### MFA Verify
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/mfa/verify` | Verify TOTP code |
| POST | `/mfa/disable` | Disable MFA |

### Backup Codes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/mfa/backup-codes/generate` | Generate backup codes |
| POST | `/mfa/backup-codes/verify` | Verify backup code |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.2.0",
  "speakeasy": "^2.0.0",
  "qrcode": "^1.5.3",
  "zod": "^3.22.4",
  "winston": "^3.11.0",
  "bcryptjs": "^2.4.3",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "ioredis": "^5.3.2",
  "jsonwebtoken": "^9.0.2"
}
```

---

## Status

- [x] TOTP setup
- [x] QR code generation
- [x] TOTP verification
- [x] Backup codes
- [x] Rate limiting

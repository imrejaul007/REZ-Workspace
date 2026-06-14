# REZ MFA Service

Multi-Factor Authentication service for the REZ ecosystem. Provides TOTP (Time-based One-Time Password), backup codes, account recovery, trusted device management, and anomaly detection.

## Features

- **TOTP Authentication**: Google Authenticator compatible
- **QR Code Generation**: Easy setup with QR codes
- **Backup Codes**: 10 one-time backup codes for account recovery
- **SMS Fallback**: Alternative verification via SMS
- **Account Recovery**: Multiple recovery methods (email, SMS, admin)
- **Trusted Devices**: Remember devices to skip MFA on return visits
- **Anomaly Detection**: Detect suspicious login patterns
- **Rate Limiting**: Protection against brute force attacks
- **Lockout Protection**: Automatic account lockout after failed attempts

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB 6.0+
- Redis 7.0+ (optional, for caching)

### Installation

```bash
# Clone and install dependencies
cd REZ-mfa-service
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your configuration
vim .env

# Build the project
npm run build

# Start the service
npm start
```

### Development

```bash
# Start with hot reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | `4031` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/rez_mfa` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for encrypting TOTP secrets | Required |
| `INTERNAL_SERVICE_TOKEN` | Service-to-service auth token | Required |
| `TOTP_ISSUER` | Issuer name in QR code | `REZ` |
| `TOTP_WINDOW` | Time window for TOTP validation | `1` |
| `TOTP_STEP` | TOTP time step in seconds | `30` |
| `BACKUP_CODES_COUNT` | Number of backup codes | `10` |
| `ADMIN_TOKENS` | Comma-separated admin tokens | Optional |

## API Endpoints

All endpoints require `X-Internal-Token` header except health check.

### MFA Setup

```bash
# Start MFA setup - generates TOTP secret and QR code
POST /api/v1/mfa/setup

Request:
{
  "userId": "user123",
  "email": "user@example.com",
  "method": "totp"
}

Response:
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCodeUrl": "data:image/png;base64,...",
    "manualEntryKey": "JBSWY3DPEHPK3PXP",
    "issuer": "REZ"
  }
}
```

### Verify TOTP

```bash
# Verify TOTP token and enable MFA
POST /api/v1/mfa/verify

Request:
{
  "userId": "user123",
  "token": "123456",
  "trustDevice": true,
  "deviceName": "iPhone 15",
  "deviceId": "device-uuid"
}

Response:
{
  "success": true,
  "data": {
    "backupCodes": ["ABCD-EFGH", "IJKL-MNOP", ...],
    "remainingBackupCodes": 10,
    "trustedDeviceToken": "..."
  }
}
```

### Disable MFA

```bash
# Disable MFA (requires valid TOTP token)
POST /api/v1/mfa/disable

Request:
{
  "userId": "user123",
  "token": "123456",
  "reason": "Switching to different authenticator"
}
```

### Admin Disable MFA

```bash
# Admin disable MFA (bypasses token verification)
POST /api/v1/mfa/admin/disable
X-Admin-Token: your-admin-token

Request:
{
  "userId": "user123",
  "reason": "User requested"
}
```

### Backup Codes

```bash
# Get backup codes count
GET /api/v1/mfa/backup-codes?userId=user123

# Regenerate backup codes
POST /api/v1/mfa/backup-codes/regenerate

Request:
{
  "userId": "user123",
  "token": "123456"
}

# Use backup code
POST /api/v1/mfa/backup-codes/use

Request:
{
  "userId": "user123",
  "code": "ABCD-EFGH"
}
```

### Account Recovery

```bash
# Start recovery request
POST /api/v1/mfa/recover

Request:
{
  "userId": "user123",
  "method": "email"
}

Response:
{
  "success": true,
  "data": {
    "requestId": "uuid",
    "expiresAt": "2024-01-15T12:30:00Z"
  }
}

# Complete recovery
POST /api/v1/mfa/recover

Request:
{
  "userId": "user123",
  "method": "email",
  "requestId": "uuid",
  "verificationCode": "123456"
}
```

### Trusted Devices

```bash
# List trusted devices
GET /api/v1/mfa/trusted-devices?userId=user123

# Remove trusted device
DELETE /api/v1/mfa/trusted-devices

Request:
{
  "userId": "user123",
  "deviceId": "device-uuid"
}
```

### Status & Monitoring

```bash
# Get MFA status
GET /api/v1/mfa/status?userId=user123

# Get anomaly report
GET /api/v1/mfa/anomaly-report?userId=user123

# Get login history
GET /api/v1/mfa/login-history?userId=user123&page=1&limit=20

# Health check
GET /api/v1/mfa/health
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway                             │
└─────────────────────────────┬───────────────────────────────────┘
                              │ X-Internal-Token
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REZ MFA Service (Port 4031)                   │
├─────────────────────────────────────────────────────────────────┤
│  Routes                                                         │
│  ├── POST /setup       → TOTPManager.generateSecret()           │
│  ├── POST /verify      → TOTPManager.verifyAndEnable()          │
│  ├── POST /disable     → TOTPManager.disableMFA()               │
│  ├── POST /recover     → RecoveryManager                        │
│  └── ...                                                        │
├─────────────────────────────────────────────────────────────────┤
│  Services                                                       │
│  ├── TOTPManager         → TOTP generation & verification        │
│  ├── BackupCodeManager  → Backup code generation & verification  │
│  ├── RecoveryManager    → Account recovery workflow             │
│  ├── AnomalyDetector    → Login pattern analysis                │
│  └── SMSManager         → SMS notifications                    │
├─────────────────────────────────────────────────────────────────┤
│  Models                                                         │
│  ├── MFAUser           → User MFA configuration                 │
│  ├── LoginAttempt      → Login history & anomalies              │
│  └── RecoveryRequest   → Recovery workflow state                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         MongoDB                                  │
│  ├── rez_mfa.mfa_users                                        │
│  ├── rez_mfa.login_attempts                                   │
│  └── rez_mfa.recovery_requests                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Security Features

### TOTP Encryption

TOTP secrets are encrypted using AES-256-GCM before storage:

```
encrypted = AES-256-GCM(secret, key, iv)
stored = iv:authTag:encrypted
```

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| General | 100 requests | 15 minutes |
| Verification | 5 attempts | 1 minute |
| Backup codes | 10 attempts | 1 hour |
| Recovery | 3 requests | 1 hour |

### Account Lockout

Accounts are automatically locked after 10 consecutive failed verification attempts. Lockout duration: 30 minutes.

### Anomaly Detection

Detects:
- Logins from unusual locations
- Multiple failed attempts
- Logins from unrecognized devices
- Suspicious IP addresses
- Unusual login times

## Integration

### Service-to-Service Communication

```typescript
const response = await fetch('http://localhost:4031/api/v1/mfa/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
  },
  body: JSON.stringify({
    userId: 'user123',
    token: '123456',
    trustDevice: true,
    deviceId: 'device-uuid',
    deviceName: 'iPhone 15'
  })
});
```

### Integration with Auth Service

Add MFA verification step in your auth flow:

1. User logs in with credentials
2. If MFA enabled, prompt for TOTP code
3. Verify with MFA service
4. On success, create session

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- src/services/totpManager.test.ts
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 4031
CMD ["node", "dist/index.js"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rez-mfa-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rez-mfa-service
  template:
    spec:
      containers:
        - name: mfa-service
          image: rez-mfa-service:latest
          ports:
            - containerPort: 4031
          env:
            - name: MONGODB_URI
              valueFrom:
                secretKeyRef:
                  name: mfa-secrets
                  key: mongodb-uri
            - name: INTERNAL_SERVICE_TOKEN
              valueFrom:
                secretKeyRef:
                  name: mfa-secrets
                  key: service-token
```

## Monitoring

### Metrics to Track

- TOTP verification success/failure rate
- Backup code usage rate
- Recovery request count
- Anomaly detection alerts
- Rate limit triggered count
- Account lockout frequency

### Logs

Logs are output in JSON format for production:

```json
{
  "level": "info",
  "message": "MFA verification successful",
  "userId": "user123",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## License

MIT

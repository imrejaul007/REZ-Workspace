# REZ Secrets Manager

Enterprise-grade secrets management service for the REZ platform. Provides secure storage, encryption, rotation, and auditing for sensitive credentials and configuration data.

## Features

- **Secret Storage**: Securely store and manage secrets with AES-256-GCM encryption
- **Key Management**: Automatic generation and rotation of encryption keys
- **Version Control**: Track all versions of secrets with full history
- **Access Control**: Fine-grained permissions with principal-based access
- **Audit Logging**: Complete audit trail of all secret operations
- **Auto-Rotation**: Automatic key rotation based on time or usage
- **Security Alerts**: Real-time detection of anomalous access patterns

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    REZ Secrets Manager                       │
├─────────────────────────────────────────────────────────────┤
│  API Layer (Express + Helmet)                               │
│  ├── /secrets/* - Secret CRUD operations                    │
│  ├── /keys/* - Key management                               │
│  ├── /rotation/* - Rotation control                        │
│  └── /audit/* - Audit queries                              │
├─────────────────────────────────────────────────────────────┤
│  Service Layer                                               │
│  ├── SecretStorage - Secret management with AC              │
│  ├── KeyManager - Encryption key lifecycle                 │
│  ├── AutoRotation - Scheduled key rotation                 │
│  └── SecretAudit - Comprehensive audit logging             │
├─────────────────────────────────────────────────────────────┤
│  Vault Layer (AES-256-GCM)                                  │
│  └── SecretVault - Core encryption/decryption              │
├─────────────────────────────────────────────────────────────┤
│  Storage Backend (Redis/In-Memory)                          │
│  └── AuditStorage - Immutable audit records                │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- Redis (optional, falls back to in-memory)

### Installation

```bash
git clone https://github.com/rabtul-technologies/rez-secrets-manager.git
cd rez-secrets-manager
npm install
```

### Configuration

Set environment variables:

```bash
export MASTER_PASSWORD="your-secure-master-password"
export NODE_ENV="production"
export PORT=3000
export REDIS_URL="redis://localhost:6379"
```

### Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Docker

```bash
docker build -t rez-secrets-manager .
docker run -p 3000:3000 \
  -e MASTER_PASSWORD="$MASTER_PASSWORD" \
  -e REDIS_URL="$REDIS_URL" \
  rez-secrets-manager
```

## API Reference

### Secrets

#### Create Secret
```http
POST /secrets
Content-Type: application/json
X-Principal: admin

{
  "name": "database-password",
  "value": "super-secret-password",
  "tags": { "env": "production", "service": "api" },
  "expiresAt": "2025-12-31T23:59:59Z",
  "allowedPrincipals": ["api-service", "admin"]
}
```

#### Get Secret
```http
GET /secrets/database-password
X-Principal: api-service
```

#### Update Secret
```http
PUT /secrets/database-password
Content-Type: application/json
X-Principal: admin

{
  "value": "new-password"
}
```

#### Delete Secret
```http
DELETE /secrets/database-password
X-Principal: admin
```

#### List Secrets
```http
GET /secrets?prefix=db&tags={"env":"production"}
X-Principal: admin
```

#### Get Secret Versions
```http
GET /secrets/database-password/versions
X-Principal: admin
```

### Keys

#### Generate Key
```http
POST /keys
Content-Type: application/json
X-Principal: system

{
  "type": "symmetric",
  "purpose": "encryption"
}
```

#### List Keys
```http
GET /keys?status=active
X-Principal: admin
```

#### Rotate Key
```http
POST /keys/{keyId}/rotate
X-Principal: system
```

### Rotation

#### Get Rotation Status
```http
GET /rotation/status
X-Principal: admin
```

### Audit

#### Get Audit Summary
```http
GET /audit/summary?since=2024-01-01T00:00:00Z
X-Principal: admin
```

#### Query Audit Events
```http
GET /audit/events?actions=secret.read,secret.deleted&principal=api-service&limit=100
X-Principal: admin
```

#### Get Security Alerts
```http
GET /audit/alerts?severity=high
X-Principal: admin
```

### Monitoring

#### Health Check
```http
GET /health
```

#### Metrics
```http
GET /metrics
```

## Security

### Encryption

- **Algorithm**: AES-256-GCM with authenticated encryption
- **Key Derivation**: PBKDF2 with SHA-512, 100,000 iterations
- **Key Rotation**: Automatic every 90 days or 1M operations
- **Integrity**: SHA-256 checksums for all secrets

### Access Control

- Principal-based authorization
- IP whitelist support
- Time-based access windows
- Role-based permissions (read, write, delete, rotate, admin)

### Audit

- Immutable audit trail with checksum chain
- Real-time security alerts
- Brute force detection
- Anomalous access pattern recognition

## Rotation Policies

Create custom rotation policies:

```http
POST /rotation/policies
Content-Type: application/json
X-Principal: admin

{
  "name": "production-keys",
  "secrets": ["db-*", "api-*"],
  "schedule": "0 2 * * 0",
  "maxAgeDays": 30,
  "maxUsage": 500000,
  "enabled": true
}
```

## Deployment

### Render.com

1. Fork this repository
2. Create a new Web Service on Render
3. Connect your repository
4. Set environment variables:
   - `MASTER_PASSWORD` (generate securely)
   - `REDIS_URL` (optional, creates managed Redis)
5. Deploy

The `render.yaml` file handles auto-scaling, health checks, and cron jobs.

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rez-secrets-manager
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rez-secrets-manager
  template:
    metadata:
      labels:
        app: rez-secrets-manager
    spec:
      containers:
        - name: secrets-manager
          image: rez-secrets-manager:latest
          ports:
            - containerPort: 3000
          env:
            - name: MASTER_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: secrets-manager-secret
                  key: master-password
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
```

## Development

### Scripts

```bash
npm run dev      # Development with ts-node
npm run build    # Build for production
npm run start    # Run production build
npm run test     # Run tests
npm run lint     # Lint code
```

### Testing

```bash
# Unit tests
npm test

# With coverage
npm run test -- --coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

- Documentation: /docs
- Issues: GitHub Issues
- Email: support@rabtul-technologies.com

# REZ Safe QR Service

**Privacy-safe communication and recovery QR system** - Universal emergency modes for pets, devices, and more.

---

## Features (v2.0)

| Feature | Description |
|---------|-------------|
| 15 QR Modes | Pet, Personal, Device, Medical, Helmet, Child, Vehicle, Bicycle, Key, Luggage, Home, Office, Event, Student, Package |
| Anonymous Messaging | Finders contact owners without seeing contact info |
| Karma System | Earn points by helping others |
| Lost Mode | Post to community feed |
| Support Plans | Priority support subscriptions |
| Express Recovery | Fast lost item recovery (Premium) |
| Service Requests | Device repair service booking |
| RABTUL Integration | Auth, Wallet, Notifications, Care, Agent |

---

## Architecture

```
Safe QR Ecosystem
├── QR Modes (15 types)
├── Karma System
├── Lost Mode
├── Support Plans
│   ├── Basic Support
│   ├── Priority Support
│   └── Premium Support
├── Service Requests
└── RABTUL Integration
```

---

## API Reference

### Core APIs
```bash
POST /api/qr                    # Create Safe QR
GET  /api/qr/my               # List user's QRs
PUT  /api/qr/:shortcode       # Update QR
DELETE /api/qr/:shortcode      # Delete QR
POST /api/qr/:shortcode/lost   # Activate lost mode
```

### Support APIs
```bash
GET  /api/support/plans        # Get support plans
POST /api/support/subscribe    # Subscribe to plan
POST /api/support/request      # Create support request
GET  /api/support/request/:id  # Get request status
POST /api/express-recovery     # Request express recovery
```

### Merchant Integration
```bash
POST /api/merchant/register-device  # Register for loyalty
POST /api/merchant/earn-points      # Award points
GET  /api/merchant/analytics       # Get analytics
```

---

## Deployment

### Docker
```bash
docker-compose up -d
```

### Kubernetes
```bash
kubectl apply -f k8s/deployment.yaml
```

---

## Environment Variables

```bash
PORT=4000
MONGODB_URI=mongodb://localhost:27017/safe-qr
REDIS_URL=redis://localhost:6379

# RABTUL Services
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
NOTIFICATIONS_SERVICE_URL=https://rez-notifications-service.onrender.com
```

---

## Testing

```bash
npm test
```

---

## Documentation

- API Spec: `docs/openapi.yaml`
- Integration: Uses centralized RABTUL integration

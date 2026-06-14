# TwinOS - Professional Twin Marketplace

**The World's First Employee-Owned AI Workforce Network**

[![Version](https://img.shields.io/badge/version-1.0.0-purple.svg)](https://github.com/hojai/twinos)
[![License](https://img.shields.io/badge/license-proprietary-blue.svg)](LICENSE)

---

## 🎯 What is TwinOS?

TwinOS transforms hiring from:

```
Today:     Company → Hire 1 Human
Tomorrow:  Company → Hire 1 Human + N Professional Twins
```

Each employee gets **5 Professional Twins** they **OWN**:

| Twin | Purpose | Productivity |
|------|---------|--------------|
| **Knowledge Twin** | What you know | +1.5x |
| **Skill Twin** | What you can do | +2.5x |
| **Career Twin** | Where you're going | +1.0x |
| **Productivity Twin** | How you work | +1.5x |
| **Execution Twin** | What you delegate | +3.0x |

**Combined: 3.5x - 10x productivity**

---

## 🔐 Trust Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TWINOS TRUST PILLARS                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. OWNERSHIP - You own your twin, not the company        │
│  2. PORTABILITY - Twins travel when you change jobs        │
│  3. PRIVACY - You control who sees what                   │
│  4. EXPORT - Full data portability anytime                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone and start
git clone https://github.com/hojai/twinos.git
cd twinos

# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f twinos

# Open dashboard
open http://localhost:4762
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Run migrations
npm run migrate

# Seed sample data
npm run seed

# Start development
npm run dev

# Open dashboard
open http://localhost:4762
```

### Option 3: Production

```bash
# Build
npm run build

# Deploy
./start.sh deploy

# Or with Docker
docker build -t twinos:latest .
docker run -p 4760:4760 twinos:latest
```

---

## 📁 Project Structure

```
twinos/
├── src/
│   ├── index.ts              # Main entry point
│   ├── routes/               # API routes
│   │   ├── twins.ts         # Twin CRUD
│   │   ├── marketplace.ts    # Browse/search
│   │   ├── hiring.ts        # Hiring workflow
│   │   ├── privacy.ts       # Privacy controls
│   │   ├── export.ts        # Export/import
│   │   └── memory.ts        # Memory integration
│   ├── services/             # Business logic
│   │   ├── memory-bridge.ts
│   │   ├── skillnet-webhook.ts
│   │   └── subscription.ts
│   ├── middleware/           # Express middleware
│   │   └── auth.ts
│   └── ml/                   # AI/ML training
│       └── training.ts
├── ui/                      # React dashboard
│   └── src/app/
├── tests/                   # Integration tests
├── scripts/                 # Utility scripts
│   └── migrate.ts
├── docs/                    # Documentation
│   ├── API.md
│   └── USER-GUIDE.md
├── docker-compose.yml
├── Dockerfile
├── start.sh
└── package.json
```

---

## 📡 API Endpoints

### Health
- `GET /health` - Health check
- `GET /health/ready` - Readiness check

### Twins
- `POST /twins` - Create twin
- `GET /twins/:twinId` - Get twin
- `GET /twins/owner/:corpId` - Get owner twins
- `PATCH /twins/:twinId` - Update twin
- `DELETE /twins/:twinId` - Archive twin

### Marketplace
- `GET /marketplace/search` - Search twins
- `GET /marketplace/featured` - Featured twins
- `GET /marketplace/categories` - Browse by type

### Hiring
- `POST /hire` - Request access
- `PATCH /hire/:grantId` - Approve/reject
- `GET /hire/active/:companyId` - Active hires
- `POST /hire/:grantId/invoke` - Log usage

### Privacy
- `GET /privacy/:twinId` - Get settings
- `PATCH /privacy/:twinId` - Update settings
- `POST /privacy/:twinId/preset` - Apply preset
- `POST /privacy/:twinId/revoke-all` - Emergency revoke

### Export
- `GET /export/:twinId/complete` - Export twin
- `GET /export/owner/:corpId/all` - Export all
- `GET /export/job-change/:corpId` - Job change export

### Analytics
- `GET /analytics/workforce` - Platform analytics
- `GET /analytics/:twinId` - Twin analytics
- `GET /analytics/trends/marketplace` - Trends

See [docs/API.md](docs/API.md) for complete API reference.

---

## 💰 Pricing

| Plan | Price | Twins | Features |
|------|-------|-------|----------|
| **Basic** | Free | 1 Knowledge | Export |
| **Pro** | ₹499/mo | 3 Twins | API, Analytics |
| **Premium** | ₹999/mo | 5 Twins | Sutar, Training |
| **Freelancer** | ₹799/mo | 5 + MyTalent | Marketplace |

Enterprise pricing available for 10+ employees.

---

## 🔧 Configuration

### Environment Variables

```bash
# Server
PORT=4760
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/twinos

# Authentication
JWT_SECRET=your-secret-key
CORPID_TOKEN=corpid-internal-token

# External Services
CORPID_URL=http://localhost:4702
SALAR_URL=http://localhost:4710
HOJAI_MEMORY_URL=http://localhost:4520
REZ_MEMORY_URL=http://localhost:4210
SKILLNET_BRIDGE_URL=http://localhost:5130
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/twins.test.ts

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

---

## 📊 Monitoring

### Prometheus Metrics

```bash
# View metrics
curl http://localhost:4760/metrics

# Prometheus endpoint included
```

### Grafana Dashboard

```bash
# Access Grafana
open http://localhost:3001

# Default credentials
username: admin
password: admin
```

---

## 🔒 Security

- JWT authentication for all protected endpoints
- CorpID verification for ownership
- Rate limiting (100 req/min default)
- Privacy controls (owner, company, public)
- Audit logging for all operations
- Encryption for sensitive data

---

## 📈 Scaling

```bash
# Scale to N instances
./start.sh scale 3

# Or with Docker
docker-compose up -d --scale twinos=3
```

---

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB status
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Clean Start
```bash
# Stop everything
docker-compose down

# Remove volumes
docker-compose down -v

# Fresh start
docker-compose up -d
```

---

## 📚 Documentation

- [API Documentation](docs/API.md)
- [User Guide](docs/USER-GUIDE.md)
- [Architecture Guide](docs/ARCHITECTURE.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Proprietary - HOJAI AI. All rights reserved.

---

## 🆘 Support

- **Email**: support@hojai.ai
- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/hojai/twinos/issues)

---

**TwinOS - Your Professional Intelligence, Always With You**
